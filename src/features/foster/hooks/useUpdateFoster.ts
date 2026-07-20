import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateMyFoster } from '@/features/foster/api/fosterApi';
import type { FosterUpdatePayload } from '@/features/foster/types';
import { queryKeys } from '@/shared/api/queryKeys';

interface UpdateFosterVariables {
  fosterId: number;
  payload: FosterUpdatePayload;
}

export function useUpdateFoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fosterId, payload }: UpdateFosterVariables) =>
      updateMyFoster(fosterId, payload),
    onSuccess: (_, { fosterId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.foster.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.foster.detail(fosterId),
      });
      toast.success('임시보호 신청이 수정되었습니다.');
    },
  });
}