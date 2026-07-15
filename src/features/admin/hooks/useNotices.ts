import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getAdminNotices,
  getAdminNotice,
  createNotice,
  updateNotice,
  changeNoticeVisibility,
  deleteNotice,
  reorderPinnedNotices,
  type NoticeCreatePayload,
  type NoticeUpdatePayload,
} from '@/features/admin/api/noticeApi';

// 관리자 공지사항 TanStack Query 훅 모음.

export function useAdminNotices(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.noticeList(params),
    queryFn: () => getAdminNotices(params),
  });
}

export function useAdminNotice(noticeId: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.noticeDetail(noticeId ?? 0),
    queryFn: () => getAdminNotice(noticeId as number),
    enabled: noticeId != null,
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NoticeCreatePayload) => createNotice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notices() });
      toast.success('공지사항이 등록되었습니다.');
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noticeId, payload }: { noticeId: number; payload: NoticeUpdatePayload }) =>
      updateNotice(noticeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notices() });
      toast.success('공지사항이 수정되었습니다.');
    },
  });
}

export function useChangeNoticeVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noticeId, isVisible }: { noticeId: number; isVisible: boolean }) =>
      changeNoticeVisibility(noticeId, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notices() });
      toast.success('노출 여부가 변경되었습니다.');
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noticeId: number) => deleteNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notices() });
      toast.success('공지사항이 삭제되었습니다.');
    },
  });
}

export function useReorderPinnedNotices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noticeIds: number[]) => reorderPinnedNotices(noticeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notices() });
      toast.success('고정 설정이 변경되었습니다.');
    },
    onError: () => {
      toast.error('고정 설정 변경에 실패했습니다.');
    },
  });
}