import { useCallback, useMemo } from "react";
import { Loader2, Heart, PawPrint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimalCard } from "@/features/animals/components/AnimalCard";
import { useLikedAnimalsInfiniteQuery } from "@/features/animals/hooks/useLikedAnimalsInfiniteQuery";
import { useAnimalLikeMutation } from "@/features/animals/hooks/useAnimalLikeMutation";
import { useInfiniteScroll } from "@/features/animals/hooks/useInfiniteScroll";
import type { AnimalListItem } from "@/features/animals/types";

// 마이페이지 "좋아요한 아이들" 탭 — 내가 좋아요한 동물 목록(최근순, 무한스크롤).
// 좋아요 취소 시 카드가 목록에서 즉시 사라진다(useAnimalLikeMutation의 마이페이지 제거 분기).
export function LikedAnimalsTab() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLikedAnimalsInfiniteQuery();
  const {
    mutate: toggleLike,
    isPending: likePending,
    variables,
  } = useAnimalLikeMutation();

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data],
  );

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);
  const sentinelRef = useInfiniteScroll(
    handleLoadMore,
    Boolean(hasNextPage) && !isFetchingNextPage,
  );

  // 마이페이지 목록은 전부 좋아요한 동물 → 하트 클릭 = 좋아요 취소(카드 제거)
  const handleLikeToggle = (animal: AnimalListItem) => {
    toggleLike({ animalId: animal.animalId, currentlyLiked: true });
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Heart size={22} className="text-[#F87171]" fill="#F87171" />
        <h2 className="text-2xl font-bold text-foreground">좋아요한 아이들</h2>
      </div>

      {isLoading ? (
        <CenterState>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </CenterState>
      ) : isError ? (
        <CenterState>
          <p className="text-muted-foreground">목록을 불러오지 못했어요.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-full border border-border px-6 py-2 text-sm font-semibold text-muted-foreground hover:border-ring hover:text-ring"
          >
            다시 시도
          </button>
        </CenterState>
      ) : items.length === 0 ? (
        <CenterState>
          <PawPrint size={32} className="text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            아직 좋아요한 아이가 없어요.
          </p>
          <button
            onClick={() => navigate("/animals")}
            className="mt-3 rounded-full bg-ring px-6 py-2 text-sm font-bold text-white transition-all hover:brightness-105"
          >
            아이들 만나러 가기
          </button>
        </CenterState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {items.map((animal) => (
              <AnimalCard
                key={animal.animalId}
                animal={animal}
                onLikeToggle={handleLikeToggle}
                likePending={
                  likePending && variables?.animalId === animal.animalId
                }
              />
            ))}
          </div>
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CenterState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 py-16 text-center">
      {children}
    </div>
  );
}
