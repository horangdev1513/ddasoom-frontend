// TanStack Query queryKey 팩토리.
// queryKey는 반드시 이 팩토리를 경유해서 생성한다(즉석 문자열/배열 키 금지 — 무효화/일관성 보장).
// 예) useQuery({ queryKey: queryKeys.animals.list(filters) })
//
// 현재는 도메인별 뼈대(빈 객체 + 주석)만 둔다. 실제 키 함수는 각 도메인 담당자가
// 자기 features 폴더 작업 시 아래 규약을 따라 채운다.
//
// 규약(권장 형태):
//   domain: {
//     all:    ['animals'] as const,                                  // 도메인 전체 무효화용 루트 키
//     lists:  () => [...queryKeys.animals.all, 'list'] as const,
//     list:   (params) => [...queryKeys.animals.lists(), params] as const,
//     details:() => [...queryKeys.animals.all, 'detail'] as const,
//     detail: (id) => [...queryKeys.animals.details(), id] as const,
//   }

import { PostListParams } from '@/features/board/types';

export const queryKeys = {
  // features/auth
  auth: {},
  // features/animals — 유기동물 (김종식)
  animals: {
    all: () => ['animals'] as const, // 도메인 전체(목록/상세/좋아요목록) 무효화·낙관적 패치 루트
    lists: () => [...queryKeys.animals.all(), 'list'] as const,
    // filters 객체가 그대로 키에 들어가므로, 값 있는 필드만 담아 안정적 키를 유지할 것
    // (타입은 shared→feature 역의존을 피하려 인라인 구조로 둠 — features/animals/types.ts의 AnimalFilters와 동일 구조)
    list: (filters: {
      kind?: 'D' | 'C';
      gender?: 'M' | 'F' | 'Q';
      location?: string;
      isFostered?: boolean;
      isLiked?: boolean;
    }) => [...queryKeys.animals.lists(), filters] as const,
    details: () => [...queryKeys.animals.all(), 'detail'] as const,
    detail: (id: number) => [...queryKeys.animals.details(), id] as const,
    likedByMe: () => [...queryKeys.animals.all(), "liked-by-me"] as const, // 마이페이지 좋아요 목록
    main: () => [...queryKeys.animals.all(), 'main'] as const,
  },
  // features/board — 정보교환/입양후기 통합(boardType 파라미터로 분기) (유창호)
  // features/board — 정보교환/입양후기 통합(boardType 파라미터로 분기) (유창호)
  board: {
    all: ['board'] as const,
    lists: () => [...queryKeys.board.all, 'list'] as const,
    list: (params: PostListParams) =>
      [...queryKeys.board.lists(), params] as const,
    details: () => [...queryKeys.board.all, 'detail'] as const,
    detail: (postId: number) => [...queryKeys.board.details(), postId] as const,
    // 댓글 키는 detail(postId) 하위 — 게시글 무효화 시 댓글도 함께 무효화되는 계층 관계.
    // ⚠️ 역은 성립 안 함: 댓글 무효화(comments)는 detail 쿼리를 건드리지 않는다.
    //    (detail 재조회 = 조회수 증가 부작용이 있어 댓글 작성마다 detail을 invalidate하지 않기 위한 설계)
    comments: (postId: number) =>
      [...queryKeys.board.detail(postId), 'comments'] as const,
    commentList: (postId: number, page: number) =>
      [...queryKeys.board.comments(postId), page] as const,
  },
  // features/foster — 임시보호 (김경우)
  foster: {
    all: ['foster'] as const,
    lists: () => [...queryKeys.foster.all, 'list'] as const,
    list: (params: import('@/features/foster/types').FosterListParams) =>
      [...queryKeys.foster.lists(), params] as const,
    details: () => [...queryKeys.foster.all, 'detail'] as const,
    detail: (fosterId: number) =>
      [...queryKeys.foster.details(), fosterId] as const,
  },
  // features/mypage — 마이페이지 (구지훈)
  mypage: {
    all: ['mypage'] as const,
    myInfo: () => [...queryKeys.mypage.all, 'myInfo'] as const,
    recentLoginLogs: () =>
      [...queryKeys.mypage.all, 'recentLoginLogs'] as const,
  },
  // features/admin — 공지사항, Faq, Qna, 관리자페이지 (이서진)
  admin: {
    all: ['admin'] as const,
    // ===== 대시보드 (구지훈) =======
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    dashboardPendingSummary: () => [...queryKeys.admin.dashboard(), 'pendingSummary'] as const,
    dashboardStatusDistribution: () => [...queryKeys.admin.dashboard(), 'statusDistribution'] as const,
    dashboardNewMembers: () => [...queryKeys.admin.dashboard(), 'newMembers'] as const,

    // ===== 통계 (구지훈) =======
    statistics: () => [...queryKeys.admin.all, 'statistics'] as const,
    statFosterMonthly: (year: number) => [...queryKeys.admin.statistics(), 'fosterMonthly', year] as const,
    statApprovalRate: () => [...queryKeys.admin.statistics(), 'approvalRate'] as const,
    statAvgDuration: () => [...queryKeys.admin.statistics(), 'avgDuration'] as const,
    statKindRatio: () => [...queryKeys.admin.statistics(), 'kindRatio'] as const,
    statRegion: () => [...queryKeys.admin.statistics(), 'region'] as const,
    statTopAnimals: () => [...queryKeys.admin.statistics(), 'topAnimals'] as const,
    statSignupDaily: (offset: number) => [...queryKeys.admin.statistics(), 'signupDaily', offset] as const,

    // ===== 공지사항 (이서진) =======
    notices: () => [...queryKeys.admin.all, 'notices'] as const,
    noticeList: (params: { page?: number; size?: number }) =>
      [...queryKeys.admin.notices(), 'list', params] as const,
    noticeDetail: (id: number) =>
      [...queryKeys.admin.notices(), 'detail', id] as const,

    // ===== FAQ (이서진) =======
    // FAQ는 페이징이 없으므로 faqList 파라미터 키 불필요 — faqs() 하나로 목록 전체 무효화
    faqs: () => [...queryKeys.admin.all, 'faqs'] as const,
    faqDetail: (id: number) =>
      [...queryKeys.admin.faqs(), 'detail', id] as const,
    faqCategories: () => [...queryKeys.admin.all, 'faqCategories'] as const,
    // ===== QNA (이서진) =======
    // 상태 필터(status)가 목록 키의 일부 — 전체/PENDING/ANSWERED 탭이 각각 독립 캐시를 갖는다.
    qnas: () => [...queryKeys.admin.all, 'qnas'] as const,
    qnaList: (params: { status?: string; page?: number; size?: number }) =>
      [...queryKeys.admin.qnas(), 'list', params] as const,
    qnaDetail: (id: number) =>
      [...queryKeys.admin.qnas(), 'detail', id] as const,

    // ===== 신고 관리 (이서진) =======
    // status/targetType 필터가 목록 키의 일부 — 필터 조합마다 독립 캐시를 갖는다.
    // 승인/반려는 상세와 목록이 함께 바뀌므로 reports() 루트로 한 번에 무효화한다.
    reports: () => [...queryKeys.admin.all, 'reports'] as const,
    reportList: (params: {
      status?: string;
      targetType?: string;
      page?: number;
      size?: number;
    }) => [...queryKeys.admin.reports(), 'list', params] as const,
    reportDetail: (id: number) =>
      [...queryKeys.admin.reports(), 'detail', id] as const,

    // ===== 구지훈 (유저 관리) =======
    members: () => [...queryKeys.admin.all, 'members'] as const,
    memberList: (params: {
      keyword?: string;
      role?: string;
      page?: number;
      size?: number;
    }) => [...queryKeys.admin.members(), 'list', params] as const,
    memberDetail: (id: number) =>
      [...queryKeys.admin.members(), 'detail', id] as const,
    memberLoginLogs: (id: number, page: number) =>
      [...queryKeys.admin.members(), 'loginLogs', id, page] as const,
    // ===== 김경우 (임시보호 신청 관리) =======
    fosters: () => [...queryKeys.admin.all, 'fosters'] as const,
    fosterList: (params: import('@/features/foster/types').FosterAdminListParams) =>
      [...queryKeys.admin.fosters(), 'list', params] as const,
    fosterDetail: (fosterId: number) =>
      [...queryKeys.admin.fosters(), 'detail', fosterId] as const,
    // ===== 유창호 (게시글 관리) =======
  },

  // features/qna — 유저용 1:1 문의 (이서진)
  // 관리자 QnA(admin.qnas)와는 별도 엔드포인트(/api/qnas)라 캐시도 분리한다.
  qna: {
    all: ['qna'] as const,
    lists: () => [...queryKeys.qna.all, 'list'] as const,
    list: (params: { page?: number; size?: number }) =>
      [...queryKeys.qna.lists(), params] as const,
    details: () => [...queryKeys.qna.all, 'detail'] as const,
    detail: (qnaId: number) => [...queryKeys.qna.details(), qnaId] as const,
  },

  // features/support — 유저용 공지/FAQ/QnA 열람
  support: {
    all: ['support'] as const,
    notices: () => [...queryKeys.support.all, 'notices'] as const,
    noticeList: (params: { page?: number; size?: number }) =>
      [...queryKeys.support.notices(), 'list', params] as const,
    noticeDetail: (id: number) =>
      [...queryKeys.support.notices(), 'detail', id] as const,
    // FAQ는 페이징 없이 목록 전체를 받는다 — faqs() 하나로 목록 전체 무효화
    faqs: () => [...queryKeys.support.all, 'faqs'] as const,
    faqDetail: (id: number) =>
      [...queryKeys.support.faqs(), 'detail', id] as const,
    faqCategories: () => [...queryKeys.support.all, 'faqCategories'] as const,
  },

} as const;
