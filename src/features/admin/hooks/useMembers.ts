import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getAdminMembers,
  getAdminMemberDetail,
  getAdminMemberLoginLogs,
  forceWithdrawMember,
  updateMemberStatus, type MemberStatus,
  restoreMember,
  type AdminMemberSearchParams,
} from '@/features/admin/api/adminMemberApi';

// 관리자 유저 관리 TanStack Query 훅 모음 — useNotices.ts와 동일 양식.

export function useAdminMembers(params: AdminMemberSearchParams = {}) {
  return useQuery({
    queryKey: queryKeys.admin.memberList(params),
    queryFn: () => getAdminMembers(params),
  });
}

export function useAdminMemberDetail(memberId: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.memberDetail(memberId ?? 0),
    queryFn: () => getAdminMemberDetail(memberId as number),
    enabled: memberId != null,
  });
}

export function useAdminMemberLoginLogs(memberId: number | null, page: number) {
  return useQuery({
    queryKey: queryKeys.admin.memberLoginLogs(memberId ?? 0, page),
    queryFn: () => getAdminMemberLoginLogs(memberId as number, page),
    enabled: memberId != null,
  });
}

export function useForceWithdrawMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => forceWithdrawMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members() });
      toast.success('회원을 강제 탈퇴 처리했습니다.');
    },
  });
}

export function useRestoreMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) => restoreMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members() });
      toast.success('계정을 복구했습니다.');
    },
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, status }: { memberId: number; status: MemberStatus }) =>
      updateMemberStatus(memberId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.members() });
      toast.success(status === 'HIDDEN' ? '회원을 숨김 처리했습니다.' : '회원을 정상 상태로 전환했습니다.');
    },
  });
}