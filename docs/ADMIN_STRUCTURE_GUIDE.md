# features/admin 협업 구조 가이드

> `features/admin`은 여러 담당자가 각자의 관리자 기능을 넣는 **공유 도메인**입니다.
> 한 폴더를 여러 명이 건드리므로, 아래 규칙을 지켜 Git 머지 충돌을 방지합니다.
> 프론트 총괄(이서진)이 뼈대를 먼저 잡아두었으니, 각 담당자는 **자기 구획에만** 코드를 추가하면 됩니다.

---

## 1. 담당 분담 (기획서 기준)

| 관리 페이지 | 기능 | 담당 |
|------------|------|------|
| 대시보드 | 전체 신청 현황 요약 (상태별 건수) | **이서진** |
| 공지사항 / FAQ / QnA | 등록·수정·삭제·답변 | **이서진** |
| 통계 (시간 되면) | 신청·유저 통계 | **이서진** |
| 임시보호 신청 관리 | 목록·상세·메시지·상태변경 | **김경우** (상태변경 담당 협의 필요) |
| 유저 관리 | 목록·상태변경·상세 | **구지훈** |
| 게시글 관리 | 게시글·댓글 삭제 | **유창호** |
| 어드민 로그인 / 권한 검증 | 로그인, Role 가드 | **구지훈** |

---

## 2. 기본 원칙 — "공유 파일/공유 객체를 만들지 않는다"

여러 명이 같은 파일·같은 객체를 편집하면 충돌납니다. admin 안의 모든 것을 **도메인별 파일로 쪼개고**, 불가피하게 공유하는 것(`queryKeys`, `router`)은 **담당자별 구획**으로 나눕니다.

## 3. 폴더/파일 배치 규칙

```
features/admin/
├── api/
│   ├── adminMemberApi.ts    # 유저 관리 (구지훈)
│   ├── adminFosterApi.ts    # 임시보호 신청 관리 (김경우)
│   ├── adminBoardApi.ts     # 게시글/댓글 관리 (유창호)
│   ├── dashboardApi.ts      # 대시보드 (이서진)
│   ├── noticeApi.ts         # 공지 (이서진)
│   ├── faqApi.ts            # FAQ (이서진)
│   └── qnaApi.ts            # QnA (이서진)
├── hooks/
│   ├── useMembers.ts        # (구지훈)
│   ├── useAdminFosters.ts   # (김경우)
│   ├── useAdminBoard.ts     # (유창호)
│   ├── useDashboard.ts      # (이서진)
│   ├── useNotices.ts        # (이서진)
│   └── ...
├── components/              # 도메인별 파일/하위폴더로 분리
└── (types.ts 공유 금지 — 타입은 각 {domain}Api.ts 안에)
```

**규칙:**
- API 함수는 `{domain}Api.ts`, 훅은 `use{Domain}.ts` — 파일명에 도메인을 박아 각자 다른 파일을 만진다.
- **타입은 공유 `types.ts`에 몰지 말고 각 `{domain}Api.ts` 안에 `export interface`로 둔다** (백엔드 DTO와 1:1). 공유 types.ts는 충돌 지점이 되므로 쓰지 않는다.
- 컴포넌트도 도메인별로 분리. 진짜 공용만 별도 관리 + 팀 공지.

## 4. queryKeys 규칙 (충돌 최다 발생 지점 — 가장 중요)

팀 컨벤션상 `shared/api/queryKeys.ts` **단일 파일**을 유지하되, `admin` 객체 안을 **담당자별 주석 구획**으로 나눈다. 아래 뼈대를 미리 잡아두었으니 각자 자기 구획에만 추가한다.

```ts
admin: {
  all: ['admin'] as const,

  // ── 대시보드 (이서진) ──────────────────────
  // dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,

  // ── 공지사항 (이서진) ──────────────────────
  notices: () => [...queryKeys.admin.all, 'notices'] as const,
  noticeList: (params) => [...queryKeys.admin.notices(), 'list', params] as const,
  noticeDetail: (id) => [...queryKeys.admin.notices(), 'detail', id] as const,

  // ── FAQ (이서진) ──────────────────────────
  // ── QnA (이서진) ──────────────────────────

  // ── 유저 관리 (구지훈) ──────────────────────
  // members: () => [...queryKeys.admin.all, 'members'] as const,

  // ── 임시보호 신청 관리 (김경우) ──────────────
  // adminFosters: () => [...queryKeys.admin.all, 'fosters'] as const,

  // ── 게시글 관리 (유창호) ────────────────────
  // adminBoard: () => [...queryKeys.admin.all, 'board'] as const,
},
```

- 각 담당자는 **자기 구획 안에서만** 키를 추가/수정한다. 서로 다른 줄을 편집하므로 머지 충돌이 거의 없다.
- 다른 사람 구획 사이에 끼워넣지 않는다.

## 5. 라우터 규칙 (`app/router.tsx`)

`/admin` children도 공유 지점이다. 담당자별 라우트를 모아서 등록하고, `{ path: '*' }`(catch-all)는 **항상 맨 마지막**에 유지한다.

```tsx
// /admin children
{ index: true, element: <AdminDashboardPage /> },          // 대시보드 (이서진)

// ── 공지 (이서진) ──
{ path: 'notices', element: <AdminNoticeListPage /> },
{ path: 'notices/new', element: <AdminNoticeFormPage /> },
{ path: 'notices/:noticeId/edit', element: <AdminNoticeFormPage /> },

// ── FAQ / QnA (이서진) ── 추가 예정

// ── 유저 관리 (구지훈) ── 추가 예정
// ── 임시보호 관리 (김경우) ── 추가 예정
// ── 게시글 관리 (유창호) ── 추가 예정

{ path: '*', element: <AdminDashboardPage /> },            // ← 항상 맨 아래
```

- 새 라우트는 기존 것 사이에 끼우지 말고 자기 구획에 모아서 추가한다.

## 6. 유저용 vs 관리자용 구분

| 구분 | 폴더 | 백엔드 대응 |
|------|------|-------------|
| 관리자 화면 | `features/admin/` | 백엔드 도메인 무관, 관리자 기능 전부 여기로 통합 |
| 유저 화면 | `features/{domain}/` | 백엔드 패키지와 1:1 대칭 |

- 예: 공지사항 → 관리자 관리 화면은 `features/admin/`, 유저 열람 화면은 `features/support/`
- `features/support`는 유저용 공지/FAQ/QnA 열람 도메인 (백엔드 `support` 패키지와 1:1). 프론트 컨벤션 문서 features 목록에도 추가 필요.

## 7. 요약 체크리스트 (admin에 기능 추가 시)

- [ ] API는 `features/admin/api/{domain}Api.ts`에 (타입도 이 파일 안에)
- [ ] 훅은 `features/admin/hooks/use{Domain}.ts`에
- [ ] queryKeys는 `admin` 안 **자기 담당자 주석 구획**에만 추가
- [ ] 라우트는 자기 구획에 모아서, `*`는 맨 아래 유지
- [ ] 공유 `types.ts`에 타입 몰지 않기
- [ ] 다른 담당자 구획/파일은 PR 없이 수정 금지
