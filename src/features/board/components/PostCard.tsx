import { MessageCircle, Eye, ImageIcon } from 'lucide-react';
import type { PostListItem } from '@/features/board/types';

// 게시판 리스트 카드 1건. 메인용 ContentPreviewSection과 용도 분리(그 컴포넌트는 수정 금지).
// TODO: 상세 페이지 라우트 확정 후 카드 클릭 → /board/{slug}/{postId} 이동 연결.
interface PostCardProps {
  post: PostListItem;
}

// LocalDateTime(타임존 없음) → "2026.07.01" 표시용. (11개 확인항목 중 datetime timezone 이슈는 표시엔 무해)
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_32px_rgba(244,185,66,0.16)]'>
      <div className='h-48 overflow-hidden bg-secondary'>
        {post.thumbnailUrl ? (
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            loading='lazy'
            className='h-full w-full object-cover'
          />
        ) : (
          // 썸네일 null → 기본 플레이스홀더
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <ImageIcon size={40} />
          </div>
        )}
      </div>
      <div className='p-4'>
        <div className='mb-2 flex items-center gap-2'>
          <span className='rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white'>
            {post.category}
          </span>
          <span className='text-xs text-[#C4B4A4]'>
            {formatDate(post.createdAt)}
          </span>
        </div>
        <h3 className='mb-2 line-clamp-1 text-lg font-bold text-foreground'>
          {post.title}
        </h3>
        <p className='mb-4 line-clamp-2 text-sm text-muted-foreground'>
          {post.contentPreview}
        </p>
        <div className='flex items-center justify-between border-t border-border pt-3'>
          <span className='text-sm font-medium text-ring'>
            {post.author.nickname}
          </span>
          <div className='flex items-center gap-3 text-xs text-[#C4B4A4]'>
            <span className='flex items-center gap-1'>
              <MessageCircle size={13} />
              {post.commentCount}
            </span>
            <span className='flex items-center gap-1'>
              <Eye size={13} />
              {post.viewCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
