import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from '../api/boardApi';

// 댓글 도메인 훅 묶음 (게시글 상세 페이지 전용).
//
// ⚠️ 댓글 뮤테이션은 comments(postId)만 무효화하고 detail(postId)은 건드리지 않는다.
//    detail 재조회 = 백엔드 조회수 증가 부작용이 있기 때문(getPostDetail 주석 참고).
//    따라서 화면의 "댓글 N개"는 post.commentCount(캐시 컬럼)가 아니라
//    댓글 목록 응답의 totalElements를 사용한다 — CommentSection이 이 원칙을 따른다.

/** 댓글 목록 — createdAt ASC(오래된 순), 20개 페이징 */
export function useCommentsQuery(postId: number | null, page: number) {
  return useQuery({
    queryKey: queryKeys.board.commentList(postId ?? -1, page),
    queryFn: () => getComments(postId as number, page),
    enabled: postId != null,
  });
}

export function useCreateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.board.comments(postId),
      });
      toast.success('댓글이 작성되었습니다.');
    },
  });
}

export function useUpdateComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: number;
      content: string;
    }) => updateComment(postId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.board.comments(postId),
      });
      toast.success('댓글이 수정되었습니다.');
    },
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.board.comments(postId),
      });
      toast.success('댓글이 삭제되었습니다.');
    },
  });
}
