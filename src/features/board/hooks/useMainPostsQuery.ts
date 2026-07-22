import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';
import type { PageResponse } from '@/shared/types/api';
import { getPosts } from '../api/boardApi';
import {
  BOARD_BY_SLUG,
  type PostListItem,
  type PostListParams,
} from '../types';
import { pickLatestPosts, toPostPreview } from '../util';

// 메인 페이지 게시글 미리보기 조회.
// 전용 미리보기 엔드포인트를 새로 만들지 않고 기존 목록 API(GET /api/posts)를 size 제한으로 재사용한다.
// queryKey도 board.list(...)를 그대로 써서, 글 작성/삭제 시 lists() 무효화에 메인 캐시가 함께 걸리게 한다.

// 노출 건수 — ContentPreviewSection의 그리드(md:grid-cols-3)와 일치시킨다.
const MAIN_PREVIEW_SIZE = 3;

const REVIEW_PARAMS: PostListParams = {
  boardType: BOARD_BY_SLUG.review.boardType,
  page: 0,
  size: MAIN_PREVIEW_SIZE,
};

// "커뮤니티" 섹션은 단일 게시판이 아니라 정보 게시판 2종을 합쳐 보여준다.
// (백엔드 BoardType에 커뮤니티 통합 타입이 없고, 목록 API는 boardType이 필수라 게시판별로 조회한다)
const COMMUNITY_PARAMS: PostListParams[] = [
  BOARD_BY_SLUG['dog-info'].boardType,
  BOARD_BY_SLUG['cat-info'].boardType,
].map((boardType) => ({ boardType, page: 0, size: MAIN_PREVIEW_SIZE }));

// select/combine은 모듈 스코프에 두어 렌더마다 참조가 바뀌지 않게 한다.
function selectPreviews(page: PageResponse<PostListItem>) {
  return page.content.map(toPostPreview);
}

function combineCommunityResults(
  results: UseQueryResult<PageResponse<PostListItem>>[],
) {
  const posts = results.flatMap((result) => result.data?.content ?? []);
  return {
    // 게시판별로 최신 3건씩 받아온 뒤 합쳐서 다시 최신 3건만 남긴다.
    data: pickLatestPosts(posts, MAIN_PREVIEW_SIZE).map(toPostPreview),
    isLoading: results.some((result) => result.isLoading),
  };
}

/** 입양 후기 미리보기 — 최신 3건 */
export function useMainReviewPostsQuery() {
  return useQuery({
    queryKey: queryKeys.board.list(REVIEW_PARAMS),
    queryFn: () => getPosts(REVIEW_PARAMS),
    select: selectPreviews,
  });
}

/** 커뮤니티(강아지 + 고양이) 미리보기 — 두 게시판을 합친 최신 3건 */
export function useMainCommunityPostsQuery() {
  return useQueries({
    queries: COMMUNITY_PARAMS.map((params) => ({
      queryKey: queryKeys.board.list(params),
      queryFn: () => getPosts(params),
    })),
    combine: combineCommunityResults,
  });
}
