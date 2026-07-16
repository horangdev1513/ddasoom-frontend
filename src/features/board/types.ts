// features/board 도메인 전용 타입 정의 파일

/**
 * 메인 페이지 게시글 미리보기 카드 1건 — 입양후기/펫 커뮤니티 공용.
 * ⚠️ [담당자 계약] 메인 미리보기 API(최신 4건 × 2종)의 응답 DTO를 이 형태로 맞춰주시거나,
 *    다르다면 이 타입과 MainPage의 목업을 실제 스펙으로 함께 수정해 주세요. (담당: 커뮤니티/입양후기 도메인)
 */
export interface PostPreview {
  postId: number;
  title: string;
  summary: string; // 본문 요약 (2줄 표시)
  category: string; // 입양후기: 펫 종류 / 커뮤니티: 게시판 분류
  authorNickname: string;
  createdAt: string; // 표시용 날짜 문자열 (예: "2026.07.01")
  commentCount: number;
  viewCount: number;
  imageUrl: string; // 썸네일
}

// URL slug ↔ 백엔드 boardType 매핑. A안: 게시판 3개 = 백엔드 boardType과 1:1.
// 잘못된 slug는 undefined → 페이지에서 NotFound 처리(프론트 가드는 UX용, 실검증은 백엔드 BOARD_003).
export const BOARD_BY_SLUG = {
  'dog-info': { boardType: 'DOG_INFO', label: '강아지' },
  'cat-info': { boardType: 'CAT_INFO', label: '고양이' },
  review: { boardType: 'ADOPTION_REVIEW', label: '입양 후기' },
} as const;

export type BoardSlug = keyof typeof BOARD_BY_SLUG;

export function resolveBoard(slug: string | undefined) {
  return slug && slug in BOARD_BY_SLUG
    ? BOARD_BY_SLUG[slug as BoardSlug]
    : undefined; // 알 수 없는 slug → 호출부에서 NotFoundPage 렌더
}

// 게시글 작성자 — 백엔드: board/dto/response/AuthorResponse.java
// ⚠️ 필드명 추정: AuthorResponse.from(authorId, nickname) 기준. 실제 JSON 필드가 다르면 여기 맞춰 수정.
export interface Author {
  authorId: number; // 백엔드 Long
  nickname: string;
}

// 게시글 목록 아이템 — 백엔드: board/dto/response/PostResponse.java
// 메인 미리보기용 PostPreview와 별개(용도 분리). 게시판 리스트 카드용.
export interface PostListItem {
  postId: number;
  category: string;
  title: string;
  contentPreview: string; // 본문 앞 200자 — 말줄임은 CSS(line-clamp)
  thumbnailUrl: string | null; // 미지정 시 null → 기본 이미지 처리
  author: Author;
  viewCount: number;
  commentCount: number;
  createdAt: string; // LocalDateTime → ISO 문자열(타임존 없음). 표시 포맷은 프론트
}

// GET /api/posts 쿼리 파라미터
// boardType: 백엔드 enum 문자열(DOG_INFO 등) — slug 아님(변환된 값)
// category: 선택. 미선택(전체)이면 생략 → ⚠️ 백엔드 category optional 전제(A안)
// page: 0-base(Spring), size 기본 9
export interface PostListParams {
  boardType: string;
  category?: string;
  page?: number;
  size?: number;
}

//
export interface PostCreatePayload {
  boardType: string; // "ADOPTION_REVIEW" 고정
  category: string; // "강아지" | "고양이"
  title: string;
  content: string; // getPayload().html
  imageIds: number[]; // getPayload().imageIds
  thumbnailImageId: number | null;
}
