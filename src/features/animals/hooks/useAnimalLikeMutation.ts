import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import type { PageResponse } from "@/shared/types/api";
import { likeAnimal, unlikeAnimal } from "../api/animalsApi";
import type { AnimalDetail, AnimalListItem, AnimalPreview } from "../types";

// 좋아요 토글 뮤테이션 (낙관적 업데이트).
//
// ⚠️ 설계: 성공 후 invalidate 하지 않는다.
//    좋아요 쓰기는 Redis dirty에 즉시 기록되지만 서버의 isLiked는 RDB(animal_like) 기준이라
//    배치 flush(약 10초) 전에는 방금 누른 좋아요가 반영되지 않는다. 여기서 refetch하면
//    낙관적으로 켠 하트가 도로 꺼지는 깜빡임이 생긴다. → 캐시의 낙관값을 진실로 유지하고
//    실패 시에만 롤백한다. (Write-Behind eventual-consistency와 일관)

type LikeVars = { animalId: number; currentlyLiked: boolean };

function toggleItem<T extends { isLiked: boolean; likeCount: number }>(
  item: T,
  liked: boolean,
): T {
  return {
    ...item,
    isLiked: liked,
    likeCount: Math.max(0, item.likeCount + (liked ? 1 : -1)),
  };
}

// 알 수 없는 캐시 데이터에서 목록(InfiniteData)/상세(단건) 두 형태를 인식해 해당 동물만 토글
function patchCache(data: unknown, animalId: number, liked: boolean): unknown {
  if (data == null || typeof data !== "object") return data;

  // 무한 목록: { pages: PageResponse<AnimalListItem>[] }
  if ("pages" in data) {
    const infinite = data as InfiniteData<PageResponse<AnimalListItem>>;
    return {
      ...infinite,
      pages: infinite.pages.map((page) => ({
        ...page,
        content: page.content.map((it) =>
          it.animalId === animalId ? toggleItem(it, liked) : it,
        ),
      })),
    };
  }

  // 상세 단건: { animalId, ... }
  if ("animalId" in data) {
    const detail = data as AnimalDetail;
    if (detail.animalId !== animalId) return data;
    return {
      ...detail,
      isLiked: liked,
      likeCount: Math.max(0, detail.likeCount + (liked ? 1 : -1)),
    };
  }

  // 메인 미리보기: AnimalPreview[] (평범한 배열, pages/animalId 래퍼 없음)
  if (Array.isArray(data)) {
    return data.map((it) =>
      (it as AnimalPreview).animalId === animalId
        ? toggleItem(it as AnimalPreview, liked)
        : it,
    );
  }

  return data;
}

// 마이페이지 좋아요 목록에서 해당 동물 카드를 제거(좋아요 취소 시).
// patchCache가 isLiked=false로 뒤집으면 빈 하트 카드가 남으므로, 마이페이지 한정으로 아예 빼준다.
function removeFromLikedList(data: unknown, animalId: number): unknown {
  if (data == null || typeof data !== "object" || !("pages" in data))
    return data;
  const infinite = data as InfiniteData<PageResponse<AnimalListItem>>;
  return {
    ...infinite,
    pages: infinite.pages.map((page) => ({
      ...page,
      content: page.content.filter((it) => it.animalId !== animalId),
    })),
  };
}

export function useAnimalLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ animalId, currentlyLiked }: LikeVars) =>
      currentlyLiked ? unlikeAnimal(animalId) : likeAnimal(animalId),

    onMutate: async ({ animalId, currentlyLiked }) => {
      const nextLiked = !currentlyLiked;
      await queryClient.cancelQueries({ queryKey: queryKeys.animals.all() });

      // 롤백용 스냅샷 저장 후, animals 하위 모든 캐시(목록/상세/좋아요목록)에 낙관적 패치
      const snapshot = queryClient.getQueriesData({
        queryKey: queryKeys.animals.all(),
      });
      queryClient.setQueriesData({ queryKey: queryKeys.animals.all() }, (old) =>
        patchCache(old, animalId, nextLiked),
      );

      // 마이페이지 좋아요 목록: 좋아요 취소면 카드를 목록에서 제거(빈 하트로 남기지 않음).
      // 스냅샷은 위 all() 조회에 이미 포함돼 있어 롤백은 그대로 커버된다.
      if (
        currentlyLiked &&
        queryClient.getQueryData(queryKeys.animals.likedByMe())
      ) {
        queryClient.setQueryData(queryKeys.animals.likedByMe(), (old) =>
          removeFromLikedList(old, animalId),
        );
      }
      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      context?.snapshot.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    // onSettled에서 invalidate하지 않음 — 위 설계 주석 참고
  });
}
