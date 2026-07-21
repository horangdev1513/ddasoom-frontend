import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/shared/api/queryKeys';
import {
  getAdminFaqs,
  getAdminFaq,
  createFaq,
  updateFaq,
  changeFaqVisibility,
  deleteFaq,
  getFaqCategories,
  type FaqPayload,
} from '@/features/admin/api/faqApi';

// 관리자 FAQ TanStack Query 훅 모음. (useNotices 패턴 그대로 — 단, 목록은 페이징 없이 List)

export function useAdminFaqs() {
  return useQuery({
    queryKey: queryKeys.admin.faqs(),
    queryFn: () => getAdminFaqs(),
  });
}

export function useAdminFaq(faqId: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.faqDetail(faqId ?? 0),
    queryFn: () => getAdminFaq(faqId as number),
    enabled: faqId != null,
    // images.url이 Presigned(30분 만료)라 폼 진입마다 최신 조회로 받는다 — 만료된 미리보기 방지.
    staleTime: 0,
  });
}

export function useFaqCategories() {
  return useQuery({
    queryKey: queryKeys.admin.faqCategories(),
    queryFn: () => getFaqCategories(),
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FaqPayload) => createFaq(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.faqs() });
      toast.success('FAQ가 등록되었습니다.');
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ faqId, payload }: { faqId: number; payload: FaqPayload }) =>
      updateFaq(faqId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.faqs() });
      toast.success('FAQ가 수정되었습니다.');
    },
  });
}

export function useChangeFaqVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ faqId, isVisible }: { faqId: number; isVisible: boolean }) =>
      changeFaqVisibility(faqId, isVisible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.faqs() });
      toast.success('노출 여부가 변경되었습니다.');
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (faqId: number) => deleteFaq(faqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.faqs() });
      toast.success('FAQ가 삭제되었습니다.');
    },
  });
}
