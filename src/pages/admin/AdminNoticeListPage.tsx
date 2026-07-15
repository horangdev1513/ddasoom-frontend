import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  useAdminNotices,
  useChangeNoticeVisibility,
  useDeleteNotice,
  useReorderPinnedNotices,
} from '@/features/admin/hooks/useNotices';
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
  const reorderPinned = useReorderPinnedNotices();

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

  // 고정 집합 전체를 재구성해 PATCH(전체 덮어쓰기)한다 — 항상 "고정되어야 할 전체 ID 배열"을 보낸다.
  // 참고: 목록 응답(NoticeSummaryResponse)에 pin_order가 없어, 백엔드가 고정글을 pin_order 순으로
  // 상단 정렬해 내려준다는 전제 하에 목록 등장 순서로 고정 순서를 구성한다.
  // 한계: 고정글이 여러 페이지에 걸치는 케이스는 데모 범위 밖 — 현재 페이지 기준으로만 처리한다.
  const pinnedIds = notices.filter((n) => n.isPinned).map((n) => n.noticeId);

  const handlePin = (noticeId: number) => {
    reorderPinned.mutate([...pinnedIds, noticeId]);
  };
  const handleUnpin = (noticeId: number) => {
    reorderPinned.mutate(pinnedIds.filter((id) => id !== noticeId));
  };
  const handleMovePin = (noticeId: number, dir: -1 | 1) => {
    const i = pinnedIds.indexOf(noticeId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= pinnedIds.length) return;
    const next = [...pinnedIds];
    [next[i], next[j]] = [next[j], next[i]];
    reorderPinned.mutate(next);
  };

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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {notice.isPinned ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary">📌 {pinnedIds.indexOf(notice.noticeId) + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={reorderPinned.isPending || pinnedIds.indexOf(notice.noticeId) === 0}
                          onClick={() => handleMovePin(notice.noticeId, -1)}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={
                            reorderPinned.isPending ||
                            pinnedIds.indexOf(notice.noticeId) === pinnedIds.length - 1
                          }
                          onClick={() => handleMovePin(notice.noticeId, 1)}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={reorderPinned.isPending}
                          onClick={() => handleUnpin(notice.noticeId)}
                        >
                          고정 해제
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={reorderPinned.isPending}
                        onClick={() => handlePin(notice.noticeId)}
                      >
                        고정
                      </Button>
                    )}
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