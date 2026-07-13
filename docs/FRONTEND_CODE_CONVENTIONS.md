# FRONTEND_CODE_CONVENTIONS

> 따숨팀 내부 규칙 문서
> 저장소 소개·실행 방법 참고파일: 루트 [`README.md`](../README.md),
> TanStack Query 사용 패턴 참고파일: [`TANSTACK_QUERY_GUIDE.md`](./TANSTACK_QUERY_GUIDE.md)

---

## 1. 기술 스택별 사용 규칙

| 분류            | 기술              | 규칙                                                                                       |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| 언어            | TypeScript 5.x    | `strict: true`, **JS 파일 사용 금지**                                                      |
| 라우팅          | React Router v7   | 라우트 정의 = `app/router.tsx` **단일 파일**                                               |
| 서버 상태       | TanStack Query v5 | API 데이터는 전부 여기서 관리 → [TANSTACK_QUERY_GUIDE.md](./TANSTACK_QUERY_GUIDE.md) 참고  |
| 클라이언트 상태 | Zustand           | `authStore` — Access Token(상태 변수) + `user` + `isAuthReady` 보관                        |
| HTTP            | Axios             | `withCredentials: true` 고정 (Refresh Token 쿠키 자동 동봉)                                |
| 스타일          | Tailwind CSS v4   | 디자인 토큰 = `styles/theme.css`                                                           |
| UI 컴포넌트     | shadcn/ui         | 코드 소유 방식. `shared/components/ui/`는 **임의 수정 금지**, 커스텀 시 `common/`에서 래핑 |
| 차트            | recharts          | 관리자 대시보드                                                                            |
| 토스트          | sonner            | 인터셉터 에러 알림 등                                                                      |
| 테스트          | Vitest + RTL      | 유틸 / Zod 스키마 / 핵심 훅 대상                                                           |

---

## 2. 프로젝트 구조

**도메인(기능) 기반 구조** 사용.
백엔드 패키지(`com.paw.ddasoom.{도메인}`)와 프론트 `features/{도메인}`이 1:1로 대칭되도록 유지

```
src/
├── app/                      # 앱 전역 설정
│   ├── router.tsx            #   전체 라우트 정의 (단일 파일)
│   ├── providers.tsx         #   QueryClientProvider 등
│   ├── bootstrap.ts          #   부팅 시 reissue 1회 호출 → 인증 상태 복구
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
│   ├── layouts/              #   UserLayout, AdminLayout
│   ├── hooks/  stores/  utils/  types/
└── styles/                   # tailwind.css, theme.css (따숨 커스텀 테마)
```

### 운영 규칙

1. **다른 사람의 `features/` 폴더는 PR 없이 수정 금지.**
2. 두 도메인 이상에서 쓰이면 `shared/`로 승격, 승격 시 팀 채널 공지할 것.
3. `features` 간 직접 import 지양. 공유가 필요하면 `shared` 경유할 것.

---

## 3. 역할별 라우트 & 권한 가드

| 경로                           | 페이지                                       | 접근 권한         |
| ------------------------------ | -------------------------------------------- | ----------------- |
| `/`                            | 메인                                         | 공개              |
| `/login`, `/signup`            | 로그인 / 회원가입 (SNS 포함)                 | 공개              |
| `/admin/login`                 | 관리자 전용 로그인 (SNS 없음)                | 공개              |
| `/animals`, `/animals/:id`     | 유기동물 목록 / 상세                         | 공개              |
| `/board/info`, `/board/review` | 정보교환 / 입양후기 게시판                   | 공개(작성은 USER) |
| `/foster/apply/:animalId`      | 임시보호 신청서 작성                         | USER              |
| `/mypage`                      | 마이페이지 대시보드                          | USER              |
| `/admin`, `/admin/**`          | 관리자 대시보드 / 신청·유저·게시글·신고 관리 | ADMIN             |

- 권한 가드: `RequireAuth`(USER), `RequireAdmin`(ADMIN) — **`authStore.user.role`로 판단** (토큰 디코딩 아님).
- **프론트 가드는 UX 장치일 뿐, 실제 접근 제어는 백엔드가 담당**

---

## 4. 인증 구조 요약

> 상세 규칙 참고파일: 백엔드 `docs/SECURITY-FLOW_V2.md`

| 항목      | Access Token (AT)                         | Refresh Token (RT)                                     |
| --------- | ----------------------------------------- | ------------------------------------------------------ |
| 저장 위치 | **전역 상태 변수** (`authStore`, zustand) | **HttpOnly 쿠키** (JS 접근 불가)                       |
| 전송 방식 | 매 요청 `Authorization: Bearer {AT}` 헤더 | 브라우저 자동 전송 (쿠키)                              |
| 서버 저장 | 없음 (로그아웃 블랙리스트만 예외)         | Redis (`refresh:{memberId}`)                           |
| 재발급    | 새로 발급                                 | **로테이션** — 구 RT는 서버 grace period(30초) 후 폐기 |

- **부팅 시**: `app/bootstrap.ts`가 `POST /api/auth/reissue`를 조건 없이 1회 호출 → 성공하면 로그인 상태 복구, 실패(401)하면 정상적인 비로그인 상태.
- **AT 만료(401) 시**: axios 응답 인터셉터가 single-flight로 재발급 후 원 요청 재시도.
- **AT → `localStorage` 저장 X.**
- RT : 프론트 코드에서 다루지 않음.

---

## 5. 네이밍 컨벤션

| 대상            | 규칙                                                              | 예시                                                   |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| 컴포넌트 파일   | PascalCase                                                        | `AnimalCard.tsx`                                       |
| 페이지 컴포넌트 | `~Page` 접미사 필수                                               | `AdminFosterListPage.tsx`                              |
| 커스텀 훅       | `use` 접두사                                                      | `useInfiniteScroll.ts`                                 |
| API 모듈        | `{도메인}Api.ts`, 함수는 `get/create/update/delete`               | `fosterApi.ts` → `getMyFosters()`                      |
| Zod 스키마      | `{이름}Schema`                                                    | `signupSchema`                                         |
| queryKey        | `shared/api/queryKeys.ts` 팩토리에서만 생성 (즉석 문자열 금지)    | `queryKeys.fosters.my()`                               |
| 함수 형태       | 컴포넌트/훅/최상위 = `function` 선언문, 내부 핸들러 = 화살표 함수 | [TanStack 가이드](./TANSTACK_QUERY_GUIDE.md) 예시 참고 |

---

## 6. 브랜치 & PR 규칙

- 브랜치: `feat/{도메인}-{작업}` (예: `feat/animals-list`)
- 백엔드에 영향 있는 변경(응답 포맷·에러 코드 등): PR에 ⚠️ 표시, 백엔드 담당자와 협의 필요.

---

## 7. 트러블슈팅

**Q. 새로고침하면 로그아웃돼요.**
① `bootstrap.ts`의 reissue 호출이 실행·완료되는지 ② 가드가 `isAuthReady` 이전에 판단하고 있지 않은지 ③ `authStore`에 AT가 실제로 세팅됐는지 확인.

**Q. 401이 떴는데 자동 재발급이 안 돼요.**
① reissue 요청이 Network 탭에 찍히는지 ② single-flight 함수(`shared/api/reissue.ts`)를 거치지 않는 별도 axios 호출이 있는지 확인.

**Q. CORS 에러가 떠요.**
① 프록시(`/api` 상대경로) 사용 확인 — 절대경로는 프록시 우회 ② 백엔드 `app.cors.allowed-origins`에 5173 등록 확인.

**Q. `import.meta.env.VITE_...`가 undefined예요.**
`VITE_` 접두사 확인, `.env.local` 수정 후 dev 서버 재시작 (환경변수는 핫리로드 안 됨).
