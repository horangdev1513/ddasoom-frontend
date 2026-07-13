# 🐾 따숨 (Ddasoom) — Frontend

> **따뜻한 숨결** — 유기동물에게 따뜻한 손길을 이어주는 임시보호 & 커뮤니티 플랫폼

유기동물 정보 확인, 임시보호 신청, 반려동물 정보 공유용 웹 서비스 프론트엔드 저장소입니다.
백엔드 저장소: `ddasoom-backend` (Spring Boot 3.5 / Java 21)

---

## 📌 주요 기능

| #   | 기능                   | 설명                                                           |
| --- | ---------------------- | -------------------------------------------------------------- |
| 1   | **유기동물 정보 조회** | 유기동물 목록/상세, 검색·필터·정렬, 관심 동물 저장 (좋아요)    |
| 2   | **임시보호 신청**      | 유기동물 임시보호 신청서 작성, 신청 내역 조회                  |
| 3   | **펫 커뮤니티**        | 반려동물 정보 교환 게시판, 입양 후기 게시판                    |
| 4   | **회원 시스템**        | 이메일 인증 회원가입, SNS 로그인(구글/카카오/네이버), JWT 인증 |
| 5   | **관리자 페이지**      | 임시보호 신청 관리, 회원 관리, 게시글/댓글 관리, 신고 처리     |

---

## 🛠️ 기술 스택

| 분류                   | 기술                             |
| ---------------------- | -------------------------------- |
| 언어                   | TypeScript 5.x (`strict: true`)  |
| 프레임워크             | React 18.3                       |
| 빌드                   | Vite 6.x (개발 서버 포트 `5173`) |
| 라우팅                 | React Router v7                  |
| 서버 상태              | TanStack Query v5                |
| 클라이언트 상태        | Zustand                          |
| HTTP                   | Axios                            |
| 폼 / 검증              | React Hook Form + Zod            |
| 스타일                 | Tailwind CSS v4                  |
| UI 컴포넌트            | shadcn/ui (Radix 기반)           |
| 아이콘 / 차트 / 토스트 | lucide-react / recharts / sonner |
| 테스트                 | Vitest + React Testing Library   |

> 각 라이브러리 사용 규칙 참고 파일: (디렉터리 구조 및 배치 규칙, 금지 패턴 등) [`docs/FRONTEND_CODE_CONVENTIONS.md`](./docs/FRONTEND_CODE_CONVENTIONS.md)

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

### 3. 백엔드 연동 실행

```bash
cd ddasoom-backend
# application.yml-example → application.yml 복사 후 값 입력
docker run -d -p 6379:6379 --name ddasoom-redis redis   # Redis 먼저 실행
./gradlew bootRun    # http://localhost:8080
```

#### 주의사항

> 1. 백엔드 없이 UI만 작업할 때는 각 feature의 mock 데이터로 개발, PR 전에 반드시 실제 API로 동작 검증
> 2. **인증(로그인/가드) 기능 개발·테스트 시 Redis 기동 필수** (Refresh Token 원본·블랙리스트가 Redis에 저장됨)

---

## 🔧 환경 변수

Vite는 **`VITE_` 접두사가 붙은 변수만** 클라이언트 코드에 노출합니다(`import.meta.env.VITE_...`).
`.env.local`은 gitignore 대상이며, `.env.example` 만 커밋 대상입니다.

| 변수명                  | 설명                                                      | 예시                    |
| ----------------------- | --------------------------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL`     | API 기본 경로. 프록시 사용 시 `/api` 고정                 | `/api`                  |
| `VITE_API_PROXY_TARGET` | Vite 프록시가 전달할 백엔드 주소 (vite.config에서만 사용) | `http://localhost:8080` |
| `VITE_KAKAO_CLIENT_ID`  | 카카오 OAuth 클라이언트 ID (SNS 로그인 착수 시)           | -                       |

> 비밀키(SMTP 계정, 공공 API 키 등)는 **전부 백엔드에서 관리**합니다.
> 프론트 환경변수는 번들에 그대로 노출되므로 비밀 값을 넣지 않습니다.

---

## 📂 프로젝트 구조 (개요)

**도메인(기능) 기반 구조**를 사용합니다. 백엔드 패키지(`com.paw.ddasoom.{도메인}`)와 프론트 `features/{도메인}`이 1:1로 대칭되도록 유지합니다.

```
src/
├── app/          # 앱 전역 설정 (라우터, 프로바이더, 부트스트랩)
├── pages/        # 라우트 1개 = 페이지 파일 1개
├── features/     # 도메인별 구현 (auth / animals / board / foster / mypage / admin)
├── shared/       # 공통 자산 (api, components, layouts, hooks, stores, utils)
└── styles/       # tailwind.css, theme.css
```

폴더별 상세 규칙 및 운영 원칙 참고 파일: [`docs/FRONTEND_CODE_CONVENTIONS.md`](./docs/FRONTEND_CODE_CONVENTIONS.md)

---

## 📚 문서

| 문서                                                                       | 내용                                                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`docs/FRONTEND_CODE_CONVENTIONS.md`](./docs/FRONTEND_CODE_CONVENTIONS.md) | 프로젝트 구조 상세, 네이밍/브랜치 컨벤션, 라우트·권한 가드, 인증 구조, 트러블슈팅 |
| [`docs/TANSTACK_QUERY_GUIDE.md`](./docs/TANSTACK_QUERY_GUIDE.md)           | TanStack Query 사용 패턴 (queryKey 팩토리, useQuery/useMutation/useInfiniteQuery) |
| 백엔드 `docs/SECURITY-FLOW_V2.md`                                          | 인증/토큰 흐름 상세 규칙 (백엔드 저장소)                                          |

---

## 👥 팀

| 역할                                 | 담당   |
| ------------------------------------ | ------ |
| 유기동물 API 연동 / 조회             | 김종식 |
| 임시보호 신청                        | 김경우 |
| 커뮤니티 / 입양 후기                 | 유창호 |
| 회원 / 인증 (Auth, Member, Security) | 구지훈 |
| 관리자 페이지 / 프론트엔드 총괄      | 이서진 |
