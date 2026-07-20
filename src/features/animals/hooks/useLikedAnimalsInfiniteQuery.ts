import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { getLikedAnimals } from "../api/animalsApi";

// 마이페이지 — 내가 좋아요한 동물 목록 무한스크롤.
// queryKey는 파라미터 없는 likedByMe() 하나로 고정 → 좋아요 취소 시 뮤테이션이 이 키를 직접 갱신(카드 제거).
export function useLikedAnimalsInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.animals.likedByMe(),
    queryFn: ({ pageParam }) => getLikedAnimals(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
  });
}
