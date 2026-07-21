import { useQuery } from '@tanstack/react-query';
import { getMyPendingFosterApplication } from '@/features/foster/api/fosterApi';
import { queryKeys } from '@/shared/api/queryKeys';

export function useMyPendingFosterApplication(
  animalId: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: queryKeys.foster.pendingApplication(animalId),
    queryFn: () => getMyPendingFosterApplication(animalId),
    enabled: enabled && Number.isSafeInteger(animalId) && animalId > 0,
  });
}