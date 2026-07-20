import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteAdminFoster } from '@/features/foster/api/fosterAdminApi';
import { queryKeys } from '@/shared/api/queryKeys';

export function useDeleteAdminFoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminFoster,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.fosters(),
      });
      toast.success('임시보호 신청이 삭제되었습니다.');
    },
  });
}