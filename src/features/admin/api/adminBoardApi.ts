import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type { Author, PostImage } from '@/features/board/types';

// features/admin 도메인 API 모듈 — 관리자 전용 게시글/댓글 관리.
// 백엔드: board/controller/AdminBoardController.java (/api/admin/posts, hasRole(ADMIN))
// 작성 방식은 features/admin/api/adminMemberApi.ts 참고.

// ── boardType(백엔드 enum 문자열) → 라벨 ─────────────────────────────────
// features/board/types.ts의 BOARD_BY_SLUG와 동일 값. 관리자 목록/상세에서 boardType 컬럼 표시용.
export const BOARD_TYPE_LABEL: Record<string, string> = {
  DOG_INFO: '강아지 정보',
  CAT_INFO: '고양이 정보',
  ADOPTION_REVIEW: '입양 후기',
};

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 응답: board/dto/response/AdminPostResponse.java — 목록 행
// ⚠️ 사용자 목록(PostListItem)과 달리 boardType/deletedAt 포함, contentPreview/thumbnailUrl 없음.
export interface AdminPostListItem {
  postId: number;
  boardType: string; // DOG_INFO / CAT_INFO / ADOPTION_REVIEW
  category: string;
  title: string;
  author: Author;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  deletedAt: string | null; // null = 활성, 값 있음 = 삭제됨(강제삭제/신고숨김/작성자삭제)
}

// 응답: board/dto/response/AdminPostDetailResponse.java — 상세
export interface AdminPostDetail {
  postId: number;
  boardType: string;
  category: string;
  title: string;
  content: string; // 백엔드 sanitize 완료 HTML — 렌더는 SafeHtmlViewer(DOMPurify 이중 방어)
  author: Author;
  images: PostImage[]; // 활성 이미지만 (삭제 글은 비어 있을 수 있음)
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 응답: board/dto/response/AdminCommentResponse.java — 댓글 행 (삭제 댓글 포함)
export interface AdminCommentItem {
  commentId: number;
  author: Author;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null; // null = 활성, 값 있음 = 삭제됨
}

// 목록 조회 쿼리 파라미터
export interface AdminPostSearchParams {
  boardType?: string; // 선택 필터 (미전달 = 전 보드)
  keyword?: string; // 제목 부분일치
  page?: number; // 0부터, 기본 0
  size?: number; // 기본 10
}

// ── API 함수 ────────────────────────────────────────────────────────────

/**
 * 게시글 목록 — 백엔드: GET /api/admin/posts
 * 삭제된 글도 포함된 전체 목록(전 보드). 상태 표시는 deletedAt으로 프론트에서 파생.
 */
export async function getAdminPosts(
  params: AdminPostSearchParams = {},
): Promise<PageResponse<AdminPostListItem>> {
  const res = await axiosInstance.get<
    ApiResponse<PageResponse<AdminPostListItem>>
  >('/admin/posts', {
    params: { page: 0, size: 10, ...params },
  });
  return res.data.data as PageResponse<AdminPostListItem>;
}

/**
 * 게시글 상세 — 백엔드: GET /api/admin/posts/{postId}
 * 삭제된 글도 조회 가능. ⚠️ 관리자 열람은 조회수를 올리지 않는다(사용자 상세 경로와 분리).
 */
export async function getAdminPostDetail(
  postId: number,
): Promise<AdminPostDetail> {
  const res = await axiosInstance.get<ApiResponse<AdminPostDetail>>(
    `/admin/posts/${postId}`,
  );
  return res.data.data as AdminPostDetail;
}

/**
 * 특정 게시글의 댓글 목록 — 백엔드: GET /api/admin/posts/{postId}/comments
 * 삭제 댓글 포함, 오래된 순.
 */
export async function getAdminPostComments(
  postId: number,
  page = 0,
  size = 20,
): Promise<PageResponse<AdminCommentItem>> {
  const res = await axiosInstance.get<
    ApiResponse<PageResponse<AdminCommentItem>>
  >(`/admin/posts/${postId}/comments`, { params: { page, size } });
  return res.data.data as PageResponse<AdminCommentItem>;
}

/**
 * 게시글 강제삭제(soft delete) — 백엔드: DELETE /api/admin/posts/{postId}
 * 작성자 검증 없이 관리자 권한으로 수행. 이미 삭제 글이면 멱등(200).
 */
export async function forceDeletePost(postId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(`/admin/posts/${postId}`);
}

/**
 * 댓글 강제삭제(soft delete) — 백엔드: DELETE /api/admin/posts/{postId}/comments/{commentId}
 * 작성자 검증 없이 관리자 권한으로 수행. 이미 삭제 댓글이면 멱등(200).
 */
export async function forceDeleteComment(
  postId: number,
  commentId: number,
): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(
    `/admin/posts/${postId}/comments/${commentId}`,
  );
}
