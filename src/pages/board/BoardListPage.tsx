import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, SquarePen } from 'lucide-react';

import { resolveBoard } from '@/features/board/types';
import { usePostsQuery } from '@/features/board/hooks/usePostQuery';
import { PostCard } from '@/features/board/components/PostCard';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CategoryFilter } from '@/features/board/components/CategoryFilter';

export function BoardListPage() {
  const { boardType: slug } = useParams();
  const board = resolveBoard(slug);
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [category, setCategory] = useState<string | undefined>(undefined); // undefined = 전체

  // 훅 규칙상 조건부 return 이전에 모든 훅 호출. board 없으면 enabled=false로 조회 스킵.
  const { data, isLoading, error } = usePostsQuery(
    { boardType: board?.boardType ?? '', category, page },
    !!board,
  );

  // 게시판 전환 시 페이지·카테고리 초기화 (강아지 필터를 켠 채 다른 게시판으로 넘어가면 어색하므로 함께 리셋)
  useEffect(() => {
    setPage(0);
    setCategory(undefined);
  }, [board?.boardType]);

  if (!board) return <NotFoundPage />;

  const handleCategoryChange = (value: string | undefined) => {
    setCategory(value);
    setPage(0); // 필터 바꾸면 첫 페이지부터
  };

  return (
    <div className='mx-auto max-w-6xl px-6 py-14'>
      {/* ── 제목 + 글쓰기 ── */}
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='text-3xl font-bold text-foreground'>{board.label}</h1>
        <button
          type='button'
          onClick={() => navigate('/board/review/write')}
          className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ring px-6 py-3 text-base font-bold text-white transition-all hover:brightness-105'
        >
          <SquarePen size={16} />
          글쓰기
        </button>
      </div>

      {/* ── 필터 + 검색바 — 메인 유기동물 검색바(AnimalPreviewSection)와 동일 톤 ── */}
      <div className='mb-8 flex items-stretch gap-3 rounded-2xl border border-border bg-white p-4'>
        <CategoryFilter value={category} onChange={handleCategoryChange} />

        <div className='w-px bg-border' />

        {/* 검색 — 자리만 배치. ⚠️ 백엔드 게시글 검색 API가 아직 없어 비활성 상태.
            API(GET /api/posts 에 keyword 파라미터 등)가 준비되면 아래 input/button을
            제어 상태 + 검색 핸들러로 연결하고 disabled 를 제거하면 됩니다. */}
        <div className='flex flex-1'>
          <input
            type='text'
            placeholder='검색 준비 중'
            disabled
            className='w-full rounded-xl border border-border bg-secondary px-4 text-base placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60'
          />
        </div>
        <button
          type='button'
          disabled
          title='검색 기능 준비 중'
          className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ring px-6 text-base font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50'
        >
          <Search size={16} />
          검색
        </button>
      </div>

      {isLoading && (
        <p className='py-20 text-center text-muted-foreground'>불러오는 중…</p>
      )}
      {error && (
        <p className='py-20 text-center text-destructive'>
          목록을 불러오지 못했습니다.
        </p>
      )}

      {data && data.content.length === 0 && (
        <p className='py-20 text-center text-muted-foreground'>
          아직 게시글이 없습니다.
        </p>
      )}

      {data && data.content.length > 0 && (
        <>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {data.content.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>

          {/* 간단 페이지네이션 — PageResponse.hasPrevious/hasNext 기반 */}
          <div className='mt-10 flex items-center justify-center gap-4'>
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!data.hasPrevious}
              className='rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40'
            >
              이전
            </button>
            <span className='text-sm text-muted-foreground'>
              {data.page + 1} / {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasNext}
              className='rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40'
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
