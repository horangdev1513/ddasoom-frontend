import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getFaqs, getFaq, getFaqCategories } from '@/features/support/api/faqApi';

// 유저용 FAQ TanStack Query 훅 모음 (읽기 전용 — mutation 없음).

export function useFaqs() {
  return useQuery({
    queryKey: queryKeys.support.faqs(),
    queryFn: () => getFaqs(),
  });
}

export function useFaq(faqId: number | null) {
  return useQuery({
    queryKey: queryKeys.support.faqDetail(faqId ?? 0),
    queryFn: () => getFaq(faqId as number),
    enabled: faqId != null,
  });
}

export function useFaqCategories() {
  return useQuery({
    queryKey: queryKeys.support.faqCategories(),
    queryFn: () => getFaqCategories(),
  });
}
