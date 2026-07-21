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
    // images.url이 Presigned(30분 만료)라 상세 진입마다 최신 조회로 받는다 — 오래된 캐시 재사용 금지.
    staleTime: 0,
  });
}

export function useFaqCategories() {
  return useQuery({
    queryKey: queryKeys.support.faqCategories(),
    queryFn: () => getFaqCategories(),
  });
}
