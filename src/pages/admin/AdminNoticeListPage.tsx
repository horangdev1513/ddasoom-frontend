import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAdminNotices, useChangeNoticeVisibility, useDeleteNotice } from '@/features/admin/hooks/useNotices';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

export function AdminNoticeListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data, isLoading, isError } = useAdminNotices({ page, size: 10 });
  const changeVisibility = useChangeNoticeVisibility();
  const deleteNotice = useDeleteNotice();

  const handleDelete = () => {
    if (deleteTargetId == null) return;
    deleteNotice.mutate(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError) {
    return <div className="p-8 text-center text-destructive">목록을 불러오지 못했습니다.</div>;
  }

  const notices = data?.content ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">공지사항 관리</h1>
        <Button onClick={() => navigate('/admin/notices/new')}>새 공지 작성</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">번호</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-20">고정</TableHead>
              <TableHead className="w-24">노출</TableHead>
              <TableHead className="w-32">작성일</TableHead>
              <TableHead className="w-24">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  등록된 공지사항이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => (
                <TableRow
                  key={notice.noticeId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/notices/${notice.noticeId}/edit`)}
                >
                  <TableCell>{notice.noticeId}</TableCell>
                  <TableCell className="font-medium">{notice.title}</TableCell>
                  <TableCell>
                    {notice.isPinned && <Badge variant="secondary">고정</Badge>}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={notice.isVisible}
                      onCheckedChange={(checked) =>
                        changeVisibility.mutate({ noticeId: notice.noticeId, isVisible: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {notice.createdAt.slice(0, 10)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(notice.noticeId)}
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 (간단 버전 — 이전/다음) */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasPrevious}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {(data?.page ?? 0) + 1} / {data?.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </Button>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteTargetId != null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 공지는 사용자에게 더 이상 노출되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}