import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFoster } from '@/features/foster/api/fosterApi';
import { queryKeys } from '@/shared/api/queryKeys';

export function useCreateFoster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFoster,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.foster.lists(),
      });
    },
  });
}