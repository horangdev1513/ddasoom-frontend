import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatDateTime } from '@/shared/utils/date';
import { SafeHtmlViewer } from '@/shared/components/editor/SafeHtmlViewer';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import {
  useAdminPostComments,
  useAdminPostDetail,
  useForceDeleteComment,
  useForceDeletePost,
} from '@/features/admin/hooks/useAdminBoard';
import { BOARD_TYPE_LABEL } from '@/features/admin/api/adminBoardApi';

export function AdminPostDetailPage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const id = postId ? Number(postId) : null;

  const [commentPage, setCommentPage] = useState(0);

  const { data: post, isLoading, isError } = useAdminPostDetail(id);
  const { data: comments } = useAdminPostComments(id, commentPage);

  const forceDeletePost = useForceDeletePost();
  const forceDeleteComment = useForceDeleteComment(id ?? 0);

  if (isLoading) {
    return (
      <div className='p-8 text-center text-muted-foreground'>불러오는 중…</div>
    );
  }
  if (isError || !post) {
    return (
      <div className='p-8 text-center'>
        <p className='text-destructive'>게시글을 불러오지 못했습니다.</p>
        <Button
          variant='outline'
          className='mt-4'
          onClick={() => navigate('/admin/posts')}
        >
          목록으로
        </Button>
      </div>
    );
  }

  const isDeleted = post.deletedAt != null;

  return (
    <div className='p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/admin/posts')}
          >
            ← 목록으로
          </Button>
          <h1 className='text-xl font-semibold'>게시글 상세</h1>
          {isDeleted ? (
            <Badge variant='destructive'>삭제됨</Badge>
          ) : (
            <Badge variant='secondary'>활성</Badge>
          )}
        </div>

        {/* 강제삭제는 활성 글에만 노출 — 이미 삭제된 글은 백엔드가 멱등 처리하지만 UI에서도 감춰 혼란 방지 */}
        {!isDeleted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={forceDeletePost.isPending}
              >
                게시글 강제삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>이 게시글을 강제삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  작성자 동의 없이 게시글이 숨김 처리되며, 첨부 이미지도 함께
                  정리됩니다. 되돌리려면 별도 복구가 필요합니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => forceDeletePost.mutate(post.postId)}
                >
                  강제삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* 기본 정보 */}
      <div className='mb-6 grid grid-cols-2 gap-4 rounded-md border p-5'>
        <div>
          <span className='text-sm text-muted-foreground'>게시판</span>
          <p className='flex items-center gap-2'>
            <Badge variant='outline'>
              {BOARD_TYPE_LABEL[post.boardType] ?? post.boardType}
            </Badge>
            <span className='text-sm text-muted-foreground'>
              {post.category}
            </span>
          </p>
        </div>
        <div>
          <span className='text-sm text-muted-foreground'>작성자</span>
          <p className='font-medium'>
            {post.author.nickname}
            <span className='ml-1 text-sm text-muted-foreground'>
              #{post.author.memberId}
            </span>
          </p>
        </div>
        <div>
          <span className='text-sm text-muted-foreground'>작성일</span>
          <p className='font-medium'>{formatDateTime(post.createdAt)}</p>
        </div>
        <div>
          <span className='text-sm text-muted-foreground'>조회 / 댓글</span>
          <p className='font-medium'>
            {post.viewCount} / {post.commentCount}
          </p>
        </div>
      </div>

      {/* 본문 */}
      <div className='mb-6 rounded-md border p-5'>
        <h2 className='mb-3 text-lg font-semibold text-foreground'>
          {post.title}
        </h2>
        <SafeHtmlViewer html={post.content} />
      </div>

      {/* 댓글 목록 */}
      <div className='rounded-md border p-5'>
        <h2 className='mb-3 text-sm font-semibold text-foreground'>
          댓글 {comments ? `(${comments.totalElements})` : ''}
        </h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>작성자</TableHead>
              <TableHead>내용</TableHead>
              <TableHead className='w-32'>작성일</TableHead>
              <TableHead className='w-20'>상태</TableHead>
              <TableHead className='w-24 text-right'>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!comments || comments.content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='h-16 text-center text-muted-foreground'
                >
                  댓글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              comments.content.map((comment) => {
                const commentDeleted = comment.deletedAt != null;
                return (
                  <TableRow key={comment.commentId}>
                    <TableCell>{comment.author.nickname}</TableCell>
                    <TableCell
                      className={
                        commentDeleted
                          ? 'text-muted-foreground line-through'
                          : ''
                      }
                    >
                      {comment.content}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {comment.createdAt.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {commentDeleted ? (
                        <Badge variant='destructive'>삭제됨</Badge>
                      ) : (
                        <Badge variant='secondary'>활성</Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      {/* 활성 댓글에만 강제삭제 버튼 노출 */}
                      {!commentDeleted && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-destructive hover:text-destructive'
                              disabled={forceDeleteComment.isPending}
                            >
                              삭제
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                이 댓글을 강제삭제할까요?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                작성자 동의 없이 댓글이 숨김 처리됩니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  forceDeleteComment.mutate(comment.commentId)
                                }
                              >
                                강제삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* 댓글 페이지네이션 — 백엔드 20개 단위 */}
        {comments && comments.totalPages > 1 && (
          <div className='mt-4 flex items-center justify-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={!comments.hasPrevious}
              onClick={() => setCommentPage((p) => Math.max(0, p - 1))}
            >
              이전
            </Button>
            <span className='text-sm text-muted-foreground'>
              {comments.page + 1} / {comments.totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={!comments.hasNext}
              onClick={() => setCommentPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
