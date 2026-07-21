import { useQuery } from '@tanstack/react-query';
import { getAdminFosters } from '@/features/foster/api/fosterAdminApi';
import type { FosterAdminListParams } from '@/features/foster/types';
import { queryKeys } from '@/shared/api/queryKeys';

export function useAdminFosters(
  params: FosterAdminListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.admin.fosterList(params),
    queryFn: () => getAdminFosters(params),
    enabled,
  });
}