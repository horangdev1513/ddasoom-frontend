import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PawPrint, Search, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useAuthStore } from "@/shared/stores/authStore";
import { AnimalCard } from "@/features/animals/components/AnimalCard";
import { useAnimalsInfiniteQuery } from "@/features/animals/hooks/useAnimalsInfiniteQuery";
import { useAnimalLikeMutation } from "@/features/animals/hooks/useAnimalLikeMutation";
import { useInfiniteScroll } from "@/features/animals/hooks/useInfiniteScroll";
import type {
  AnimalFilters,
  AnimalKindCode,
  AnimalGenderCode,
  AnimalListItem,
} from "@/features/animals/types";

// 유기동물 목록 페이지 — 동적 검색 필터 + 무한스크롤.
// 메인 검색바에서 넘어온 쿼리(species/sido/sigungu)를 초기 필터로 반영한다.

const KIND_OPTIONS: { label: string; value: AnimalKindCode | "ALL" }[] = [
  { label: "전체", value: "ALL" },
  { label: "강아지", value: "D" },
  { label: "고양이", value: "C" },
];

// 메인 검색바의 species 라벨 → kind 코드
function speciesToKind(species: string | null): AnimalKindCode | undefined {
  if (species === "강아지") return "D";
  if (species === "고양이") return "C";
  return undefined;
}

export function AnimalListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // 메인에서 넘어온 초기 필터 (한 번만 계산)
  const [filters, setFilters] = useState<AnimalFilters>(() => {
    const sido = searchParams.get("sido") ?? undefined;
    const sigungu = searchParams.get("sigungu") ?? undefined;
    return {
      kind: speciesToKind(searchParams.get("species")),
      location: sigungu || sido, // 더 구체적인 값 우선 (백엔드 location은 contains 매칭)
    };
  });
  // 지역 입력은 로컬로 들고 있다가 검색 버튼/Enter로 커밋 (매 타이핑마다 refetch 방지)
  const [locationInput, setLocationInput] = useState(filters.location ?? "");

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnimalsInfiniteQuery(filters);

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

  // 비로그인 클릭 → 로그인 유도. 로그인 → 낙관적 토글.
  const handleLikeToggle = (animal: AnimalListItem) => {
    if (!user) {
      toast("로그인 후 좋아요할 수 있어요.");
      navigate("/login");
      return;
    }
    toggleLike({ animalId: animal.animalId, currentlyLiked: animal.isLiked });
  };

  const setKind = (value: AnimalKindCode | "ALL") =>
    setFilters((f) => ({ ...f, kind: value === "ALL" ? undefined : value }));

  const setGender = (value: string) =>
    setFilters((f) => ({
      ...f,
      gender: value === "ALL" ? undefined : (value as AnimalGenderCode),
    }));

  const setFosterState = (value: string) =>
    setFilters((f) => ({
      ...f,
      isFostered: value === "ALL" ? undefined : value === "FOSTERED",
    }));

  const toggleLikedOnly = () =>
    setFilters((f) => ({ ...f, isLiked: f.isLiked ? undefined : true }));

  const commitLocation = () =>
    setFilters((f) => ({ ...f, location: locationInput.trim() || undefined }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
      <div className="mx-auto max-w-6xl px-6">
        {/* ── 헤더 ── */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <PawPrint size={28} className="text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              유기동물 찾기
            </h1>
          </div>
          <p className="text-base text-muted-foreground">
            조건을 선택해 새 가족을 기다리는 아이들을 만나보세요.
          </p>
        </div>

        {/* ── 필터 바 ── */}
        <div className="mb-8 flex flex-wrap items-stretch gap-3 rounded-2xl border border-border bg-white p-4">
          {/* 종 토글 */}
          <div className="flex gap-2">
            {KIND_OPTIONS.map((opt) => {
              const active = (filters.kind ?? "ALL") === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={`rounded-xl border-[1.5px] px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? "border-ring bg-secondary text-ring"
                      : "border-border bg-muted text-muted-foreground hover:border-ring/60 hover:text-ring"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="w-px bg-border" />

          {/* 성별 */}
          <Select value={filters.gender ?? "ALL"} onValueChange={setGender}>
            <SelectTrigger className="!h-full w-[130px] rounded-xl border-border bg-secondary px-4">
              <SelectValue placeholder="성별" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">성별 전체</SelectItem>
              <SelectItem value="M">수컷</SelectItem>
              <SelectItem value="F">암컷</SelectItem>
              <SelectItem value="Q">미상</SelectItem>
            </SelectContent>
          </Select>

          {/* 보호 상태 */}
          <Select
            value={fosterSelectValue(filters.isFostered)}
            onValueChange={setFosterState}
          >
            <SelectTrigger className="!h-full w-[150px] rounded-xl border-border bg-secondary px-4">
              <SelectValue placeholder="보호 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">보호상태 전체</SelectItem>
              <SelectItem value="AVAILABLE">임시보호 가능</SelectItem>
              <SelectItem value="FOSTERED">임시보호 중</SelectItem>
            </SelectContent>
          </Select>

          {/* 지역 검색 (Enter 또는 검색 버튼으로 커밋) */}
          <div className="flex flex-1 items-stretch gap-2">
            <input
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLocation();
              }}
              placeholder="지역 (예: 서울, 해운대구)"
              className="min-w-[140px] flex-1 rounded-xl border border-border bg-secondary px-4 text-base outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            <button
              type="button"
              onClick={commitLocation}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ring px-5 text-base font-bold text-white transition-all hover:brightness-105"
            >
              <Search size={16} />
              검색
            </button>
          </div>

          {/* 내가 좋아요한 (로그인 시에만) */}
          {user && (
            <button
              type="button"
              onClick={toggleLikedOnly}
              className={`flex items-center gap-1.5 rounded-xl border-[1.5px] px-4 py-2 text-sm font-semibold transition-all ${
                filters.isLiked
                  ? "border-[#F87171] bg-[#F87171]/10 text-[#F87171]"
                  : "border-border bg-muted text-muted-foreground hover:border-[#F87171]/60 hover:text-[#F87171]"
              }`}
            >
              <Heart size={15} fill={filters.isLiked ? "#F87171" : "none"} />
              좋아요만
            </button>
          )}
        </div>

        {/* ── 콘텐츠 ── */}
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
              조건에 맞는 아이들이 없어요.
            </p>
          </CenterState>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
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

            {/* 무한스크롤 sentinel + 로딩 표시 */}
            <div ref={sentinelRef} className="flex justify-center py-8">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              {!hasNextPage && (
                <span className="text-sm text-muted-foreground">
                  마지막 아이까지 다 봤어요 🐾
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// isFostered 필터값 → 셀렉트 표시값
function fosterSelectValue(isFostered: boolean | undefined): string {
  if (isFostered === undefined) return "ALL";
  return isFostered ? "FOSTERED" : "AVAILABLE";
}

function CenterState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/50 py-20 text-center">
      {children}
    </div>
  );
}
