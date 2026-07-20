import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type {
  CommentItem,
  PostCreatePayload,
  PostDetail,
  PostListItem,
  PostListParams,
  PostUpdatePayload,
} from '../types';

// features/board 도메인 API 모듈. 작성 방식은 features/auth/api/authApi.ts 참고.

/**
 * 게시글 목록 조회.
 * 백엔드: GET /api/posts?boardType&category&page&size — PostController.getPostList
 * 응답: ApiResponse<PageResponse<PostResponse>> → res.data.data 로 PageResponse 추출.
 * category가 undefined면 axios가 파라미터에서 자동 제외 → "전체" 조회(백엔드 category optional 전제).
 */
export async function getPosts(
  params: PostListParams,
): Promise<PageResponse<PostListItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<PostListItem>>>(
    '/posts',
    { params },
  );
  return res.data.data as PageResponse<PostListItem>;
}

export async function createPost(payload: PostCreatePayload): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>('/posts', payload);
  return res.data.data as number; // postId
}

/**
 * 게시글 상세 조회.
 * 백엔드: GET /api/posts/{postId} — PostController.getPostDetail
 * ⚠️ 호출마다 서버에서 조회수가 증가한다(PostService.getPostDetail의 increaseViewCount).
 *    → 댓글 작성 등에서 detail 쿼리를 함부로 invalidate하면 조회수가 부풀므로 주의.
 */
export async function getPostDetail(postId: number): Promise<PostDetail> {
  const res = await axiosInstance.get<ApiResponse<PostDetail>>(
    `/posts/${postId}`,
  );
  return res.data.data as PostDetail;
}

/** 게시글 삭제(soft delete). 백엔드: DELETE /api/posts/{postId} — 작성자 검증은 서버(403 POST_ACCESS_DENIED) */
export async function deletePost(postId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<void>>(`/posts/${postId}`);
}

// ===== 댓글 — 백엔드: PostCommentController (/api/posts/{postId}/comments) =====

/** 댓글 목록 조회 — createdAt ASC(오래된 순), size 기본 20 (백엔드 defaultValue와 일치) */
export async function getComments(
  postId: number,
  page: number,
): Promise<PageResponse<CommentItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<CommentItem>>>(
    `/posts/${postId}/comments`,
    { params: { page, size: 20 } },
  );
  return res.data.data as PageResponse<CommentItem>;
}

/** 댓글 작성 — 201 + 생성된 CommentResponse 반환 */
export async function createComment(
  postId: number,
  content: string,
): Promise<CommentItem> {
  const res = await axiosInstance.post<ApiResponse<CommentItem>>(
    `/posts/${postId}/comments`,
    { content },
  );
  return res.data.data as CommentItem;
}

/** 댓글 수정 — 수정된 CommentResponse 반환. 작성자 검증은 서버(403 COMMENT_ACCESS_DENIED) */
export async function updateComment(
  postId: number,
  commentId: number,
  content: string,
): Promise<CommentItem> {
  const res = await axiosInstance.patch<ApiResponse<CommentItem>>(
    `/posts/${postId}/comments/${commentId}`,
    { content },
  );
  return res.data.data as CommentItem;
}

/** 댓글 삭제(soft delete) */
export async function deleteComment(
  postId: number,
  commentId: number,
): Promise<void> {
  await axiosInstance.delete<ApiResponse<void>>(
    `/posts/${postId}/comments/${commentId}`,
  );
}

export async function updatePost(
  postId: number,
  payload: PostUpdatePayload,
): Promise<void> {
  await axiosInstance.patch<ApiResponse<void>>(`/posts/${postId}`, payload);
}
