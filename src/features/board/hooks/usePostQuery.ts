import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import { getPosts } from '../api/boardApi';
import type { PostListParams } from '../types';

// enabled: slug가 유효할 때만 조회(잘못된 slug에서 헛 API 호출 방지).
export function usePostsQuery(params: PostListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.board.list(params),
    queryFn: () => getPosts(params),
    enabled,
  });
}
