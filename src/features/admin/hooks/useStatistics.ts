import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getFosterMonthlyTrend, getFosterApprovalRate, getFosterAvgDuration,
  getAnimalKindRatio, getAnimalRegionDistribution, getTopFosterAnimals, getSignupDailyTrend,
} from '@/features/admin/api/statisticsApi';

// 관리자 통계 훅 — 조회 전용. 연도/offset처럼 파라미터가 있는 쿼리는 키에 포함해 독립 캐시.

export function useFosterMonthlyTrend(year: number) {
  return useQuery({
    queryKey: queryKeys.admin.statFosterMonthly(year),
    queryFn: () => getFosterMonthlyTrend(year),
  });
}

export function useFosterApprovalRate() {
  return useQuery({ queryKey: queryKeys.admin.statApprovalRate(), queryFn: getFosterApprovalRate });
}

export function useFosterAvgDuration() {
  return useQuery({ queryKey: queryKeys.admin.statAvgDuration(), queryFn: getFosterAvgDuration });
}

export function useAnimalKindRatio() {
  return useQuery({ queryKey: queryKeys.admin.statKindRatio(), queryFn: getAnimalKindRatio });
}

export function useAnimalRegionDistribution() {
  return useQuery({ queryKey: queryKeys.admin.statRegion(), queryFn: getAnimalRegionDistribution });
}

export function useTopFosterAnimals() {
  return useQuery({ queryKey: queryKeys.admin.statTopAnimals(), queryFn: getTopFosterAnimals });
}

export function useSignupDailyTrend(offset: number) {
  return useQuery({
    queryKey: queryKeys.admin.statSignupDaily(offset),
    queryFn: () => getSignupDailyTrend(offset),
  });
}