import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import { ReportModal } from '@/features/report/components/ReportModal';
import type { CommentItem } from '@/features/board/types';
import {
  useCommentsQuery,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/features/board/hooks/useComments';
import { formatDateTime } from '../util';

// 게시글 상세 하단 댓글 섹션.
// - 목록: GET /posts/{postId}/comments — createdAt ASC(오래된 순), 20개 페이징
// - "댓글 N개"는 목록 응답 totalElements 사용 (post.commentCount 캐시 컬럼이 아님 — useComments.ts 주석 참고)
// - 작성 폼은 로그인 사용자에게만. 상세 페이지 자체는 공개 라우트이므로 여기서 분기.
// - 본인 댓글만 수정/삭제 버튼 노출 (UX 가드 — 실검증은 백엔드 403 COMMENT_ACCESS_DENIED)

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(0);
  const [content, setContent] = useState('');

  const { data, isLoading, error } = useCommentsQuery(postId, page);
  const createMutation = useCreateComment(postId);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return; // 백엔드 @NotBlank와 동일 기준 — 공백만 입력 차단
    createMutation.mutate(trimmed, {
      onSuccess: () => setContent(''),
    });
  };

  return (
    <section className='mt-12'>
      <h2 className='mb-4 text-lg font-bold text-foreground'>
        댓글 {data ? data.totalElements : ''}
      </h2>

      {/* ── 작성 폼 ── */}
      {user ? (
        <div className='mb-8 rounded-2xl border border-border bg-white p-4'>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='댓글을 입력해주세요.'
            rows={3}
            className='w-full resize-none rounded-xl border border-border bg-secondary p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
          />
          <div className='mt-2 flex justify-end'>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={createMutation.isPending || !content.trim()}
              className='rounded-xl bg-ring px-5 py-2 text-sm font-bold text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'
            >
              등록
            </button>
          </div>
        </div>
      ) : (
        <div className='mb-8 rounded-2xl border border-border bg-secondary p-4 text-center text-sm text-muted-foreground'>
          <Link to='/login' className='font-medium text-ring underline'>
            로그인
          </Link>
          {' 후 댓글을 작성할 수 있습니다.'}
        </div>
      )}

      {/* ── 목록 ── */}
      {isLoading && (
        <p className='py-8 text-center text-muted-foreground'>불러오는 중…</p>
      )}
      {error != null && (
        <p className='py-8 text-center text-destructive'>
          댓글을 불러오지 못했습니다.
        </p>
      )}

      {data && data.content.length === 0 && (
        <p className='py-8 text-center text-muted-foreground'>
          첫 댓글을 남겨보세요.
        </p>
      )}

      {data && data.content.length > 0 && (
        <>
          <ul className='divide-y divide-border rounded-2xl border border-border bg-white'>
            {data.content.map((comment) => (
              <CommentRow
                key={comment.commentId}
                postId={postId}
                comment={comment}
                isMine={
                  user != null && user.memberId === comment.author.memberId
                }
                isLoggedIn={user != null}
              />
            ))}
          </ul>

          {/* 페이지네이션 — BoardListPage와 동일 패턴 (hasPrevious/hasNext 기반) */}
          {data.totalPages > 1 && (
            <div className='mt-6 flex items-center justify-center gap-4'>
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
          )}
        </>
      )}
    </section>
  );
}

// ── 댓글 1건 (인라인 수정 상태를 각 행이 소유) ──

interface CommentRowProps {
  postId: number;
  comment: CommentItem;
  isMine: boolean;
  isLoggedIn: boolean;
}

function CommentRow({ postId, comment, isMine, isLoggedIn }: CommentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [reportOpen, setReportOpen] = useState(false);

  const updateMutation = useUpdateComment(postId);
  const deleteMutation = useDeleteComment(postId);

  const handleUpdate = () => {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    updateMutation.mutate(
      { commentId: comment.commentId, content: trimmed },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDelete = () => {
    // window.confirm으로 최소 구현 — 디자인 통일이 필요해지면 ui/alert-dialog로 교체
    if (!window.confirm('댓글을 삭제할까요?')) return;
    deleteMutation.mutate(comment.commentId);
  };

  // DB 레이어 ON UPDATE로 updated_at이 갱신됨 — 생성 직후엔 두 값이 같고, 수정되면 커진다
  const isEdited = comment.updatedAt !== comment.createdAt;

  return (
    <li className='p-4'>
      <div className='mb-1 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-ring'>
            {comment.author.nickname}
          </span>
          <span className='text-xs text-[#C4B4A4]'>
            {formatDateTime(comment.createdAt)}
            {isEdited && ' (수정됨)'}
          </span>
        </div>
        {isMine && !isEditing && (
          <div className='flex gap-2 text-xs text-muted-foreground'>
            <button
              type='button'
              onClick={() => {
                setEditContent(comment.content);
                setIsEditing(true);
              }}
              className='hover:text-foreground'
            >
              수정
            </button>
            <button
              type='button'
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className='hover:text-destructive disabled:opacity-50'
            >
              삭제
            </button>
          </div>
        )}
        {/* 신고는 로그인한 사용자의 '타인 댓글'에만 노출 (본인 댓글엔 수정/삭제만) */}
        {isLoggedIn && !isMine && !isEditing && (
          <button
            type='button'
            onClick={() => setReportOpen(true)}
            className='text-xs text-muted-foreground hover:text-destructive'
          >
            신고
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className='w-full resize-none rounded-xl border border-border bg-secondary p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring'
          />
          <div className='mt-2 flex justify-end gap-2'>
            <button
              type='button'
              onClick={() => setIsEditing(false)}
              className='rounded-lg border border-border px-4 py-1.5 text-xs'
            >
              취소
            </button>
            <button
              type='button'
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !editContent.trim()}
              className='rounded-lg bg-ring px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50'
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <p className='whitespace-pre-wrap text-sm leading-relaxed text-foreground'>
          {comment.content}
        </p>
      )}

      {/* 신고 모달 — targetType은 POST_COMMENT, targetId는 이 댓글의 PK */}
      <ReportModal
        targetType='POST_COMMENT'
        targetId={comment.commentId}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </li>
  );
}
