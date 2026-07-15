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

export const queryKeys = {
  // features/auth
  auth: {},
  // features/animals — 유기동물
  animals: {},
  // features/board — 정보교환/입양후기 통합(boardType 파라미터로 분기)
  board: {},
  // features/foster — 임시보호
  foster: {},
  // features/mypage — 마이페이지
  mypage: {},
  // features/admin — 공지사항, Faq, Qna, 관리자페이지
  admin: {
    all: ['admin'] as const,
    // ===== 공지사항 (이서진) =======
    notices: () => [...queryKeys.admin.all, 'notices'] as const,
    noticeList: (params: { page?: number; size?: number }) =>
      [...queryKeys.admin.notices(), 'list', params] as const,
    noticeDetail: (id: number) =>
      [...queryKeys.admin.notices(), 'detail', id] as const,

    // ===== FAQ (이서진) =======
    // FAQ는 페이징이 없으므로 faqList 파라미터 키 불필요 — faqs() 하나로 목록 전체 무효화
    faqs: () => [...queryKeys.admin.all, 'faqs'] as const,
    faqDetail: (id: number) => [...queryKeys.admin.faqs(), 'detail', id] as const,
    faqCategories: () => [...queryKeys.admin.all, 'faqCategories'] as const,
    // ===== QNA (이서진) =======
    
    // ===== 구지훈 (유저 관리) =======

    // ===== 김경우 (임시보호 신청 관리) =======
    
    // ===== 유창호 (게시글 관리) =======
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
    faqDetail: (id: number) => [...queryKeys.support.faqs(), 'detail', id] as const,
    faqCategories: () => [...queryKeys.support.all, 'faqCategories'] as const,
  },
} as const;
