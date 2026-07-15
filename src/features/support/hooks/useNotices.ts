import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getNotices, getNotice } from '@/features/support/api/noticeApi';

// 유저용 공지사항 TanStack Query 훅 모음 (읽기 전용 — mutation 없음).

export function useNotices(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.support.noticeList(params),
    queryFn: () => getNotices(params),
  });
}

export function useNotice(noticeId: number | null) {
  return useQuery({
    queryKey: queryKeys.support.noticeDetail(noticeId ?? 0),
    queryFn: () => getNotice(noticeId as number),
    enabled: noticeId != null,
  });
}
