import { useQuery } from '@tanstack/react-query';
import { getMyFosterDetail } from '@/features/foster/api/fosterApi';
import { queryKeys } from '@/shared/api/queryKeys';

export function useFosterDetail(fosterId: number | null) {
  return useQuery({
    queryKey: queryKeys.foster.detail(fosterId ?? 0),
    queryFn: () => getMyFosterDetail(fosterId as number),
    enabled: fosterId != null,
  });
}