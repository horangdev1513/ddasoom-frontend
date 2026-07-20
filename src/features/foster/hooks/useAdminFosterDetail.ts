import { useQuery } from '@tanstack/react-query';
import { getAdminFosterDetail } from '@/features/foster/api/fosterAdminApi';
import { queryKeys } from '@/shared/api/queryKeys';

export function useAdminFosterDetail(fosterId: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.fosterDetail(fosterId ?? 0),
    queryFn: () => getAdminFosterDetail(fosterId as number),
    enabled: fosterId != null,
  });
}