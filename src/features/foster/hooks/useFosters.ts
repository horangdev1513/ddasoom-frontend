import { useQuery } from '@tanstack/react-query';
import { getMyFosters } from '@/features/foster/api/fosterApi';
import type { FosterListParams } from '@/features/foster/types';
import { queryKeys } from '@/shared/api/queryKeys';

export function useMyFosters(params: FosterListParams = {}) {
  return useQuery({
    queryKey: queryKeys.foster.list(params),
    queryFn: () => getMyFosters(params),
  });
}