import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteMyFoster } from '@/features/foster/api/fosterApi';
import { queryKeys } from '@/shared/api/queryKeys';

export function useDeleteFoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMyFoster,
    onSuccess: (_, fosterId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.foster.lists(),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.foster.detail(fosterId),
      });
      toast.success('임시보호 신청이 삭제되었습니다.');
    },
  });
}