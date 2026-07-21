import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CornerDownRight, MessageSquare, PawPrint } from 'lucide-react';
import { useMyCommentsQuery } from '@/features/board/hooks/useMyBoard';
import { resolveSlugByBoardType } from '@/features/board/types';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate } from '@/shared/utils/date';

export function MyCommentsTab() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useMyCommentsQuery(page);

  if (isLoading) {
    return (
      <div className='rounded-2xl border border-border bg-white p-8'>
        <Skeleton className='mb-6 h-8 w-48' />
        <div className='space-y-3'>
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='rounded-2xl border border-border bg-white p-8 text-center'>
        <p className='text-base text-destructive'>
          내가 쓴 댓글 목록을 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  const comments = data?.content ?? [];

  return (
    <section className='rounded-2xl border border-border bg-white p-8'>
      <div className='mb-6'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='text-ring' size={24} />
          <h2 className='text-2xl font-bold text-foreground'>내가 쓴 댓글</h2>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          내가 남긴 댓글과 원글을 확인할 수 있어요. 클릭하면 해당 게시글로
          이동합니다.
        </p>
      </div>

      {comments.length === 0 ? (
        <div className='flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/50 text-center'>
          <PawPrint className='text-muted-foreground/50' size={32} />
          <p className='text-base text-muted-foreground'>
            작성한 댓글이 없습니다.
          </p>
        </div>
      ) : (
        <ul className='space-y-3'>
          {comments.map((comment) => {
            const slug = resolveSlugByBoardType(comment.boardType);

            return (
              <li key={comment.commentId}>
                <Link
                  to={`/board/${slug}/${comment.postId}`}
                  className='block rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50'
                >
                  <p className='line-clamp-2 text-base text-foreground'>
                    {comment.content}
                  </p>
                  <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'>
                    <span className='flex min-w-0 items-center gap-1'>
                      <CornerDownRight size={14} className='shrink-0' />
                      <span className='truncate font-medium'>
                        {comment.postTitle}
                      </span>
                    </span>
                    <span className='shrink-0'>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className='mt-6 flex items-center justify-center gap-3'>
        <Button
          variant='outline'
          size='sm'
          disabled={!data?.hasPrevious}
          onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
        >
          이전
        </Button>
        <span className='text-sm text-muted-foreground'>
          {(data?.page ?? 0) + 1} / {Math.max(1, data?.totalPages ?? 0)}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={!data?.hasNext}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          다음
        </Button>
      </div>
    </section>
  );
}
