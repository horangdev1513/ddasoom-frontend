# TANSTACK_QUERY_GUIDE

> TanStack Query v5 사용 패턴 &(서버데이터 사용 시 적용 규칙)
> 네이밍·구조 규칙 참고파일: [`FRONTEND_CODE_CONVENTIONS.md`](./FRONTEND_CODE_CONVENTIONS.md)

프로젝트에서 서버 데이터를 다룰 때 아래 3가지 패턴을 그대로 따릅니다:
**① queryKey는 팩토리에서만 생성** 
**② API 함수는 `{도메인}Api.ts`에 분리할 것**
**③ 컴포넌트는 `function` 선언문 + 내부 핸들러는 화살표 함수 사용할 것****

---

## ① queryKey 팩토리 (`shared/api/queryKeys.ts`)

```ts
// shared/api/queryKeys.ts
export const queryKeys = {
  animals: {
    all: () => ['animals'] as const,
    list: (filters: AnimalFilters) => ['animals', 'list', filters] as const,
    detail: (id: number) => ['animals', 'detail', id] as const,
  },
  fosters: {
    my: () => ['fosters', 'my'] as const,
  },
};
```

> ❌ **컴포넌트에서 `useQuery({ queryKey: ['animals', filters] })`처럼 즉석 배열 생성 X.**
> 이유: 팩토리를 거치지 않으면 캐시 무효화(invalidateQueries) 시 철자 오타 등으로 조용히 실패.

---

## ② API 함수 분리 (`features/animals/api/animalsApi.ts`)

```ts
// features/animals/api/animalsApi.ts
import { axiosInstance } from '@/shared/api/axiosInstance';
import type { Animal, AnimalFilters } from '../types';

export async function getAnimals(filters: AnimalFilters): Promise<Animal[]> {
  const { data } = await axiosInstance.get('/api/animals', { params: filters });
  return data.data; // ApiResponse<T> 래퍼에서 data 필드만 추출
}

export async function getAnimalDetail(id: number): Promise<Animal> {
  const { data } = await axiosInstance.get(`/api/animals/${id}`);
  return data.data;
}
```

---

## ③ 조회 — `useQuery` (목록 페이지)

```tsx
// features/animals/hooks/useAnimalsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getAnimals } from '../api/animalsApi';
import type { AnimalFilters } from '../types';

export function useAnimalsQuery(filters: AnimalFilters) {
  return useQuery({
    queryKey: queryKeys.animals.list(filters),
    queryFn: () => getAnimals(filters),
  });
}
```

```tsx
// pages/animals/AnimalListPage.tsx
function AnimalListPage() {
  const [filters, setFilters] = useState<AnimalFilters>({ type: 'all' });
  const { data: animals, isLoading, error } = useAnimalsQuery(filters);

  const handleFilterChange = (next: AnimalFilters) => {
    setFilters(next);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {animals?.map((animal) => (
        <AnimalCard key={animal.id} animal={animal} />
      ))}
    </div>
  );
}
```

---

## ④ 변경 — `useMutation` (좋아요 버튼, 낙관적 업데이트)

```tsx
// features/animals/hooks/useLikeAnimalMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { likeAnimal } from '../api/animalsApi';

export function useLikeAnimalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (animalId: number) => likeAnimal(animalId),
    onSuccess: (_, animalId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.animals.detail(animalId) });
    },
  });
}
```

```tsx
function AnimalCard({ animal }: AnimalCardProps) {
  const { mutate: likeAnimal, isPending } = useLikeAnimalMutation();

  const handleLikeClick = () => {
    likeAnimal(animal.id);
  };

  return (
    <div>
      <span>{animal.name}</span>
      <button onClick={handleLikeClick} disabled={isPending}>
        ❤️ {animal.likeCount}
      </button>
    </div>
  );
}
```

---

## ⑤ 무한스크롤 — `useInfiniteQuery` (참고용, 페이지네이션 응답 형식 확정 후 적용)

```tsx
// features/animals/hooks/useAnimalsInfiniteQuery.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getAnimalsPage } from '../api/animalsApi';

export function useAnimalsInfiniteQuery(filters: AnimalFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.animals.list(filters),
    queryFn: ({ pageParam }) => getAnimalsPage(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
```

> ⚠️ 페이지네이션 응답 형식(`{ content, hasNext, nextCursor }`)이 아직 백엔드와 확정되지 않았습니다. 형식 확정 전까지는 위 코드를 그대로 붙여넣지 말고, 확정 후 `nextCursor` 필드명을 맞춰서 사용하세요.

---

## 핵심 규칙 요약

| 상황 | 사용 |
|---|---|
| 데이터 조회 (목록/상세) | `useQuery` |
| 데이터 변경 (생성/수정/삭제/좋아요) | `useMutation` + 성공 시 `invalidateQueries` |
| 무한스크롤/더보기 | `useInfiniteQuery` |
| 인증(401→재발급) |**axios interceptor** 처리 (`shared/api/axiosInstance.ts`) |
