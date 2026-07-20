import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getPendingSummary, getFosterStatusDistribution, getTodayNewMembers,
} from '@/features/admin/api/dashboardApi';

// 관리자 대시보드 훅 — useMembers.ts와 동일 양식. 조회 전용(뮤테이션 없음).

export function usePendingSummary() {
  return useQuery({
    queryKey: queryKeys.admin.dashboardPendingSummary(),
    queryFn: getPendingSummary,
  });
}

export function useFosterStatusDistribution() {
  return useQuery({
    queryKey: queryKeys.admin.dashboardStatusDistribution(),
    queryFn: getFosterStatusDistribution,
  });
}

export function useTodayNewMembers() {
  return useQuery({
    queryKey: queryKeys.admin.dashboardNewMembers(),
    queryFn: getTodayNewMembers,
  });
}