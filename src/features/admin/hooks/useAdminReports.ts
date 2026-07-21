import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  approveReport,
  getAdminReport,
  getAdminReports,
  rejectReport,
  type AdminReportSearchParams,
} from '@/features/admin/api/adminReportApi';
import { getReportErrorMessage } from '@/features/report/util';

// 관리자 신고 처리 TanStack Query 훅 모음 — useAdminQnas.ts와 동일 양식.

export function useAdminReports(params: AdminReportSearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.reportList(params),
    queryFn: () => getAdminReports(params),
  });
}

export function useAdminReport(reportId: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.reportDetail(reportId ?? 0),
    queryFn: () => getAdminReport(reportId as number),
    enabled: reportId != null,
    retry: false, // 없는 신고는 재시도해도 동일 — 즉시 안내로
  });
}

/**
 * 승인/반려 공통 처리.
 * 두 mutation의 차이가 호출 함수·성공 문구·회원 무효화 여부뿐이라 한 곳에 모았다.
 * 성공 시 상세(처리자/처리일시/상태)와 목록(상태 뱃지·필터)이 모두 바뀌므로 신고 계층을 무효화한다.
 * 승인은 MEMBER 대상이면 회원 status가 ACTIVE→HIDDEN으로 바뀌므로 회원 목록/상세도 함께 무효화한다
 * (반려는 회원 상태를 바꾸지 않아 회원 무효화 불필요).
 */
function useProcessReport(
  reportId: number,
  process: (reportId: number) => Promise<void>,
  successMessage: string,
  invalidateMembers: boolean,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => process(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports() });
      if (invalidateMembers) {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.members() });
      }
      toast.success(successMessage);
    },
    onError: (error) => {
      // REPORT_003(이미 처리됨)은 다른 관리자가 먼저 처리한 경우 — 무효화해서 최신 상태를 다시 받는다.
      // MEMBER_007(ADMIN 회원 승인 시도)은 반려로 유도하는 문구를 보여준다.
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reports() });
      toast.error(getReportErrorMessage(error, '신고 처리에 실패했습니다.'));
    },
  });
}

export function useApproveReport(reportId: number) {
  return useProcessReport(reportId, approveReport, '신고를 승인 처리했습니다.', true);
}

export function useRejectReport(reportId: number) {
  return useProcessReport(reportId, rejectReport, '신고를 반려 처리했습니다.', false);
}
