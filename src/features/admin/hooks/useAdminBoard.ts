import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getAdminPosts,
  getAdminPostDetail,
  getAdminPostComments,
  getAdminComments,
  forceDeletePost,
  forceDeleteComment,
  AdminCommentSearchParams,
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

// ===== 전체 댓글 관리 (게시글에 종속되지 않은 사이트 전체 댓글 목록) =====

/**
 * 전체 댓글 목록 — 전체 1회 로드 후 검색/필터/정렬/페이징은 페이지에서 클라이언트 처리(AdminPosts와 동일).
 */
export function useAdminComments(params: AdminCommentSearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.commentList(params),
    queryFn: () => getAdminComments(params),
  });
}

/**
 * 전체 댓글 관리 화면의 댓글 강제삭제.
 * 목록 자체(comments())와, 원글의 commentCount·상세가 걸린 posts()를 함께 무효화한다.
 * postId는 목록 행이 함께 내려주므로 기존 DELETE /api/admin/posts/{postId}/comments/{commentId} 재사용.
 */
export function useForceDeleteCommentInList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      commentId,
    }: {
      postId: number;
      commentId: number;
    }) => forceDeleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.comments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.posts() });
      toast.success('댓글을 강제삭제했습니다.');
    },
  });
}
