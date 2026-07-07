# 🐾 따숨 (Ddasoom) — Frontend

> **따뜻한 숨결** — 유기동물에게 따뜻한 손길을 이어주는 임시보호 & 커뮤니티 플랫폼

유기동물 정보를 확인하고, 임시보호를 신청하고, 반려동물 정보를 나누는 웹 서비스의 프론트엔드 저장소입니다.
백엔드 저장소: `ddasoom-backend` (Spring Boot 3.5 / Java 21)

---

## 📌 주요 기능

| # | 기능 | 설명 |
|---|------|------|
| 1 | **유기동물 정보 조회** | 유기동물 목록/상세, 검색·필터·정렬, 좋아요 |
| 2 | **임시보호 신청** | 유기동물 임시보호 신청서 작성, 내 신청 내역 조회 |
| 3 | **펫 커뮤니티** | 반려동물 정보 교환 게시판, 입양 후기 게시판 |
| 4 | **회원 시스템** | 이메일 인증 회원가입, SNS 로그인(구글/카카오/네이버), JWT 인증 |
| 5 | **관리자 페이지** | 임시보호 신청 관리, 회원 관리, 게시글/댓글 관리, 신고 처리 |

---

## 🛠️ 기술 스택

| 분류 | 기술 | 비고 |
|---|---|---|
| 언어 | TypeScript 5.x | `strict: true`, JS 파일 사용 금지 |
| 프레임워크 | React 18.3 | |
| 빌드 | Vite 6.x | 개발 서버 포트 `5173` |
| 라우팅 | React Router v7 | 라우트 정의는 `app/router.tsx` 단일 파일 |
| 서버 상태 | **TanStack Query v5** | API 데이터는 전부 여기서 관리 (사용법은 [8절](#8-tanstack-query-사용-예시) 참고) |
| 클라이언트 상태 | Zustand | `authStore` — Access Token(상태 변수) + `user` + `isAuthReady` 보관 |
| HTTP | Axios | `withCredentials: true` 고정 (Refresh Token 쿠키 자동 동봉) |
| 폼 / 검증 | React Hook Form + Zod | |
| 스타일 | Tailwind CSS v4 | 디자인 토큰은 `styles/theme.css` |
| UI 컴포넌트 | shadcn/ui (Radix 기반) | 코드 소유 방식 |
| 아이콘 | lucide-react | |
| 차트 | recharts | 관리자 대시보드 |
| 토스트 | sonner | 인터셉터 에러 알림 등 |
| 테스트 | Vitest + React Testing Library | 유틸 / Zod 스키마 / 핵심 훅 대상 |

---

## 🚀 로컬 실행 방법

### 1. 사전 준비

- **Node.js 20 LTS 이상** (`node -v`로 확인)
- npm 10+ (Node에 포함)
- 백엔드 로컬 실행 환경: JDK 21, MySQL 8, **Redis** (인증 기능 테스트에 필수)

### 2. 설치 및 실행

```bash
# 1) 저장소 클론
git clone <repo-url>
cd ddasoom-frontend

# 2) 의존성 설치
npm install

# 3) 환경변수 설정 — 예시 파일 복사 후 값 채우기
cp .env.example .env.local

# 4) 개발 서버 실행 (http://localhost:5173)
npm run dev
```

### 3. 백엔드 함께 띄우기

프론트 대부분의 화면은 백엔드 API가 필요합니다.

```bash
cd ddasoom-backend
# application.yml-example → application.yml 복사 후 값 입력
docker run -d -p 6379:6379 --name ddasoom-redis redis   # Redis 먼저 실행
./gradlew bootRun    # http://localhost:8080
```

> 백엔드 없이 UI만 작업할 때는 각 feature의 mock 데이터로 개발하고, PR 전에 반드시 실제 API로 확인합니다.
> **인증(로그인/가드) 기능 개발·테스트에는 Redis 기동이 필수**입니다. (Refresh Token 원본·블랙리스트가 Redis에 저장됨)

---

## 🔧 환경 변수

Vite는 **`VITE_` 접두사가 붙은 변수만** 클라이언트 코드에 노출합니다(`import.meta.env.VITE_...`).
`.env.local`은 gitignore 대상이며, 커밋되는 것은 `.env.example`(키 목록만)입니다.

| 변수명 | 설명 | 예시 |
|---|---|---|
| `VITE_API_BASE_URL` | API 기본 경로. 프록시 사용 시 `/api` 고정 | `/api` |
| `VITE_API_PROXY_TARGET` | Vite 프록시가 전달할 백엔드 주소 (vite.config에서만 사용) | `http://localhost:8080` |
| `VITE_KAKAO_CLIENT_ID` | 카카오 OAuth 클라이언트 ID (SNS 로그인 착수 시) | - |

> 비밀키(SMTP 계정, 공공 API 키 등)는 **전부 백엔드에서 관리**합니다. 프론트 환경변수는 번들에 그대로 노출되므로 비밀 값을 넣지 않습니다.

---

## 📂 프로젝트 구조

**도메인(기능) 기반 구조**를 사용합니다. 백엔드 패키지(`com.paw.ddasoom.{도메인}`)와 프론트 `features/{도메인}`이 1:1로 대칭되도록 유지합니다.

```
src/
├── app/                      # 앱 전역 설정
│   ├── router.tsx            #   전체 라우트 정의 (단일 파일)
│   ├── providers.tsx         #   QueryClientProvider 등
│   ├── bootstrap.ts           #   부팅 시 reissue 1회 호출 → 인증 상태 복구
│   └── App.tsx
├── pages/                    # 라우트 1개 = 페이지 파일 1개. features 조립만 담당
│   ├── auth/  animals/  board/  foster/  mypage/  admin/
├── features/                 # 도메인별 구현 (팀원 담당 경계 = 폴더 경계)
│   ├── auth/                 #   로그인/회원가입
│   ├── animals/              #   유기동물 목록/상세/좋아요
│   ├── board/                #   정보교환 + 입양후기 공용 (boardType 파라미터화)
│   ├── foster/               #   임시보호 신청/수정/내역
│   ├── mypage/
│   └── admin/                #   관리자
│       └── api/ hooks/ components/ types.ts
├── shared/                   # 도메인에 속하지 않는 공통 자산
│   ├── api/                  #   axiosInstance.ts, queryKeys.ts, reissue.ts(single-flight)
│   ├── components/ui/        #   shadcn 컴포넌트 (임의 수정 금지 — 래핑은 common/)
│   ├── components/common/    #   RequireAuth, RequireAdmin, ConfirmModal, EmptyState 등
│   ├── layouts/               #   UserLayout, AdminLayout
│   ├── hooks/  stores/  utils/  types/
└── styles/                    # tailwind.css, theme.css (따숨 커스텀 테마)
```

### 운영 규칙

1. **다른 사람의 `features/` 폴더는 PR 없이 수정 금지.**
2. 두 도메인 이상에서 쓰이면 `shared/`로 승격 — 승격 시 팀 채널에 한 줄 공지.
3. `features` 간 직접 import 지양. 공유가 필요하면 `shared` 경유.

---

## 🗺️ 역할별 라우트

| 경로 | 페이지 | 접근 권한 |
|---|---|---|
| `/` | 메인 | 공개 |
| `/login`, `/signup` | 로그인 / 회원가입 (SNS 포함) | 공개 |
| `/admin/login` | 관리자 전용 로그인 (SNS 없음) | 공개 |
| `/animals`, `/animals/:id` | 유기동물 목록 / 상세 | 공개 |
| `/board/info`, `/board/review` | 정보교환 / 입양후기 게시판 | 공개(작성은 USER) |
| `/foster/apply/:animalId` | 임시보호 신청서 작성 | USER |
| `/mypage` | 마이페이지 대시보드 | USER |
| `/admin`, `/admin/**` | 관리자 대시보드 / 신청·유저·게시글·신고 관리 | ADMIN |

- 권한 가드: `RequireAuth`(USER), `RequireAdmin`(ADMIN) — **`authStore.user.role`로 판단** (토큰 디코딩 아님).
- **프론트 가드는 UX 장치일 뿐, 실제 접근 제어는 백엔드가 담당합니다.**

---

## 🔐 인증 구조 요약

> 상세 규칙은 백엔드 `docs/SECURITY-FLOW.md` 참고.

| 항목 | Access Token | Refresh Token |
|---|---|---|
| 저장 위치 | **전역 상태 변수** (`authStore`, zustand) | **HttpOnly 쿠키** (JS 접근 불가) |
| 전송 방식 | 매 요청 `Authorization: Bearer {AT}` 헤더 | 브라우저 자동 전송 (쿠키) |
| 서버 저장 | 없음 (로그아웃 블랙리스트만 예외) | Redis (`refresh:{memberId}`) |
| 재발급 | 새로 발급 | **로테이션** — 구 RT는 서버 grace period(30초) 후 폐기 |

- **부팅 시**: `app/bootstrap.ts`가 `POST /api/auth/reissue`를 조건 없이 1회 호출 → 성공하면 로그인 상태 복구, 실패(401)하면 정상적인 비로그인 상태.
- **AT 만료(401) 시**: axios 응답 인터셉터가 single-flight로 재발급 후 원 요청 재시도.
- **AT는 절대 `localStorage`에 저장하지 않습니다.** Refresh Token은 프론트 코드가 아예 다루지 않습니다.

---

## 📏 컨벤션 요약

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | PascalCase | `AnimalCard.tsx` |
| 페이지 컴포넌트 | `~Page` 접미사 필수 | `AdminFosterListPage.tsx` |
| 커스텀 훅 | `use` 접두사 | `useInfiniteScroll.ts` |
| API 모듈 | `{도메인}Api.ts`, 함수는 `get/create/update/delete` | `fosterApi.ts` → `getMyFosters()` |
| Zod 스키마 | `{이름}Schema` | `signupSchema` |
| queryKey | `shared/api/queryKeys.ts` 팩토리에서만 생성 (즉석 문자열 금지) | `queryKeys.fosters.my()` |
| 함수 형태 | 컴포넌트/훅/최상위 = `function` 선언문, 내부 핸들러 = 화살표 함수 | 아래 8절 예시 참고 |

- 브랜치: `feat/{도메인}-{작업}` (예: `feat/animals-list`)
- 응답 포맷·에러 코드 등 백엔드에 영향 있는 변경은 PR에 ⚠️ 표시하고 백엔드 담당자 확인을 받습니다.

---

## 8. TanStack Query 사용 예시

프로젝트에서 서버 데이터를 다룰 때는 아래 3가지 패턴을 그대로 따릅니다: **① queryKey는 팩토리에서만, ② API 함수는 `{도메인}Api.ts`에 분리, ③ 컴포넌트는 `function` 선언문 + 내부 핸들러는 화살표 함수.**

### ① queryKey 팩토리 (`shared/api/queryKeys.ts`)

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

> ❌ 컴포넌트에서 `useQuery({ queryKey: ['animals', filters] })`처럼 즉석 배열을 만들지 않습니다.
> 팩토리를 거치지 않으면 캐시 무효화(invalidateQueries) 시 철자 오타 등으로 조용히 실패하기 쉽습니다.

### ② API 함수 분리 (`features/animals/api/animalsApi.ts`)

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

### ③ 조회 — `useQuery` (목록 페이지)

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

### ④ 변경 — `useMutation` (좋아요 버튼, 낙관적 업데이트)

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

### ⑤ 무한스크롤 — `useInfiniteQuery` (참고용, 페이지네이션 응답 형식 확정 후 적용)

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

### 핵심 규칙 요약

| 상황 | 사용 |
|---|---|
| 데이터 조회 (목록/상세) | `useQuery` |
| 데이터 변경 (생성/수정/삭제/좋아요) | `useMutation` + 성공 시 `invalidateQueries` |
| 무한스크롤/더보기 | `useInfiniteQuery` |
| 인증(401→재발급) | TanStack Query 담당 아님 — **axios interceptor**가 처리 (`shared/api/axiosInstance.ts`) |

---

## 🛠 트러블슈팅

**Q. 새로고침하면 로그아웃돼요.**
① `bootstrap.ts`의 reissue 호출이 실행·완료되는지 ② 가드가 `isAuthReady` 이전에 판단하고 있지 않은지 ③ `authStore`에 AT가 실제로 세팅됐는지 확인.

**Q. 401이 떴는데 자동 재발급이 안 돼요.**
① reissue 요청이 Network 탭에 찍히는지 ② single-flight 함수(`shared/api/reissue.ts`)를 거치지 않는 별도 axios 호출이 있는지 확인.

**Q. CORS 에러가 떠요.**
① 프록시(`/api` 상대경로) 사용 확인 — 절대경로는 프록시 우회 ② 백엔드 `app.cors.allowed-origins`에 5173 등록 확인.

**Q. `import.meta.env.VITE_...`가 undefined예요.**
`VITE_` 접두사 확인, `.env.local` 수정 후 dev 서버 재시작 (환경변수는 핫리로드 안 됨).

---

## 👥 팀

| 역할 | 담당 |
|------|------|
| 유기동물 API 연동 / 조회 | 김종식 |
| 임시보호 신청 | 김경우 |
| 커뮤니티 / 입양 후기 | 유창호 |
| 회원 / 인증 (Auth, Member, Security) | 구지훈 |
| **관리자 페이지 / 프론트엔드 총괄** | 이서진 |
