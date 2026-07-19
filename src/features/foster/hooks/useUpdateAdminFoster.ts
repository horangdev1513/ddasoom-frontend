import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateAdminFoster } from '@/features/foster/api/fosterAdminApi';
import type { FosterAdminUpdatePayload } from '@/features/foster/types';
import { queryKeys } from '@/shared/api/queryKeys';

interface UpdateAdminFosterVariables {
  fosterId: number;
  payload: FosterAdminUpdatePayload;
}

export function useUpdateAdminFoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fosterId, payload }: UpdateAdminFosterVariables) =>
      updateAdminFoster(fosterId, payload),
    onSuccess: (_, { fosterId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.fosters(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.fosterDetail(fosterId),
      });
      toast.success('임시보호 신청 처리 정보가 수정되었습니다.');
    },
  });
}