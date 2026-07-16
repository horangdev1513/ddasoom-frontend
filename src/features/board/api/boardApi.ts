import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type { PostCreatePayload, PostListItem, PostListParams } from '../types';

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
