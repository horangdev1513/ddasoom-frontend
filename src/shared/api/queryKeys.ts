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
  // features/admin — 관리자(프론트 총괄)
  admin: {},
} as const;
