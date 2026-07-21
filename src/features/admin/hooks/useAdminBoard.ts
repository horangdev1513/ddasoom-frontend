import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getAdminPosts,
  getAdminPostDetail,
  getAdminPostComments,
  forceDeletePost,
  forceDeleteComment,
  type AdminPostSearchParams,
} from '@/features/admin/api/adminBoardApi';

// 관리자 게시글/댓글 관리 TanStack Query 훅 모음 — useMembers.ts와 동일 양식.

export function useAdminPosts(params: AdminPostSearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.postList(params),
    queryFn: () => getAdminPosts(params),
  });
}

export function useAdminPostDetail(postId: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.postDetail(postId ?? 0),
    queryFn: () => getAdminPostDetail(postId as number),
    enabled: postId != null,
    retry: false, // 없는 글은 재시도해도 동일 — 즉시 안내로
  });
}

export function useAdminPostComments(postId: number | null, page = 0) {
  return useQuery({
    queryKey: queryKeys.admin.postComments(postId ?? 0, page),
    queryFn: () => getAdminPostComments(postId as number, page),
    enabled: postId != null,
  });
}

/**
 * 게시글 강제삭제.
 * 성공 시 목록(상태 뱃지)과 해당 글의 상세가 함께 바뀌므로 posts() 루트로 한 번에 무효화한다.
 */
export function useForceDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: number) => forceDeletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.posts() });
      toast.success('게시글을 강제삭제했습니다.');
    },
  });
}

/**
 * 댓글 강제삭제.
 * 댓글 상태와 원글의 댓글수(commentCount)가 함께 바뀌므로 posts() 루트로 무효화한다
 * (해당 postId의 상세·댓글·목록이 모두 posts() 하위 계층에 있음).
 */
export function useForceDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => forceDeleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.posts() });
      toast.success('댓글을 강제삭제했습니다.');
    },
  });
}
