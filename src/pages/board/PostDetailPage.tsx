import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Siren } from 'lucide-react';

import { ReportModal } from '@/features/report/components/ReportModal';
import { resolveBoard, resolveSlugByBoardType } from '@/features/board/types';
import { usePostDetailQuery } from '@/features/board/hooks/usePostQuery';
import { useDeletePost } from '@/features/board/hooks/useDeletePost';
import { CommentSection } from '@/features/board/components/CommentSection';
import { SafeHtmlViewer } from '@/shared/components/editor/SafeHtmlViewer';
import { useAuthStore } from '@/shared/stores/authStore';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Button } from '@/shared/components/ui/button';
import { formatDate } from '@/features/board/util';

// 게시글 상세 — GET /api/posts/{postId} (공개 라우트, 댓글 작성만 로그인 필요)
// URL: /board/:boardType/:postId — slug는 백엔드 검증 대상이 아니라 "목록으로" 복귀용.
export function PostDetailPage() {
  const navigate = useNavigate();
  const { boardType: slug, postId: postIdParam } = useParams();

  const board = resolveBoard(slug);
  // 숫자가 아닌 postId(예: /board/review/abc) → null → 조회 스킵 + NotFound
  const parsedId =
    postIdParam != null && /^\d+$/.test(postIdParam)
      ? Number(postIdParam)
      : null;

  const user = useAuthStore((s) => s.user);

  // 훅 규칙상 조건부 return 이전에 모든 훅 호출 (BoardListPage와 동일 원칙)
  const { data, isLoading, isError } = usePostDetailQuery(
    board && parsedId != null ? parsedId : null,
  );
  const deleteMutation = useDeletePost();
  const [reportOpen, setReportOpen] = useState(false);

  if (!board || parsedId == null) return <NotFoundPage />;

  if (isLoading) {
    return (
      <p className='py-20 text-center text-muted-foreground'>불러오는 중…</p>
    );
  }

  // 없거나 삭제된 게시글 → 백엔드 404(POST_NOT_FOUND)
  if (isError || !data) {
    return (
      <div className='mx-auto max-w-4xl px-6 py-14'>
        <p className='py-10 text-center text-muted-foreground'>
          게시글을 찾을 수 없습니다.
        </p>
        <div className='flex justify-center'>
          <Button variant='outline' onClick={() => navigate(`/board/${slug}`)}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  const isAuthor = user != null && user.memberId === data.author.memberId;
  // 수정 경로는 URL slug가 아니라 게시글의 실제 boardType 기준으로 생성 (slug 불일치 진입 방어).
  const editSlug = resolveSlugByBoardType(data.boardType);
  const canEdit = isAuthor && editSlug != null;

  const handleDelete = () => {
    // window.confirm으로 최소 구현 — 디자인 통일이 필요해지면 ui/alert-dialog로 교체
    if (!window.confirm('게시글을 삭제할까요? 삭제 후 되돌릴 수 없습니다.'))
      return;
    deleteMutation.mutate(data.postId, {
      onSuccess: () => navigate(`/board/${slug}`),
    });
  };

  return (
    <div className='mx-auto max-w-4xl px-6 py-14'>
      {/* ── 헤더 ── */}
      <div className='mb-2 flex items-center gap-2'>
        <span className='rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white'>
          {data.category}
        </span>
        <span className='text-xs text-[#C4B4A4]'>
          {formatDate(data.createdAt)}
          {data.updatedAt !== data.createdAt && ' (수정됨)'}
        </span>
      </div>
      <h1 className='mb-4 text-3xl font-bold text-foreground'>{data.title}</h1>

      <div className='mb-8 flex items-center justify-between border-b border-border pb-4'>
        <span className='text-sm font-medium text-ring'>
          {data.author.nickname}
        </span>
        <div className='flex items-center gap-3 text-xs text-[#C4B4A4]'>
          <span className='flex items-center gap-1'>
            <Eye size={13} />
            {data.viewCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── 본문 — 백엔드 sanitize + DOMPurify 이중 방어 (SafeHtmlViewer) ── */}
      <SafeHtmlViewer html={data.content} className='min-h-40' />

      {/* ── 하단 액션 ── */}
      <div className='mt-10 flex items-center justify-between border-t border-border pt-6'>
        <Button variant='outline' onClick={() => navigate(`/board/${slug}`)}>
          목록으로
        </Button>
        {isAuthor && (
          <div className='flex gap-2'>
            {canEdit && (
              <Button
                variant='outline'
                onClick={() =>
                  navigate(`/board/${editSlug}/${data.postId}/edit`)
                }
              >
                수정
              </Button>
            )}
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              삭제
            </Button>
          </div>
        )}
        {/* 신고는 로그인한 비작성자에게만 노출 (수정/삭제 게이팅과 동일 원칙) */}
        {!isAuthor && user != null && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setReportOpen(true)}
            className='gap-1 text-muted-foreground hover:text-destructive'
          >
            <Siren size={14} />
            신고
          </Button>
        )}
      </div>

      {/* 신고 모달 — open 상태는 이 화면이 소유 (ReportModal 사용 규약) */}
      <ReportModal
        targetType='POST'
        targetId={data.postId}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />

      {/* ── 댓글 ── */}
      <CommentSection postId={data.postId} />
    </div>
  );
}
