import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/boardApi';
import { queryKeys } from '@/shared/api/queryKeys';
import { toast } from 'sonner';
import { PostCreatePayload } from '../types';

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PostCreatePayload) => createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.board.lists() });
      toast.success('게시글이 등록되었습니다.');
    },
  });
}
