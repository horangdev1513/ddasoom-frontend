import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAdminFaqs,
  useChangeFaqVisibility,
  useDeleteFaq,
  useFaqCategories,
} from '@/features/admin/hooks/useFaqs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
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

export function AdminFaqListPage() {
  const navigate = useNavigate();
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data: faqs, isLoading, isError } = useAdminFaqs();
  const { data: categories } = useFaqCategories();
  const changeVisibility = useChangeFaqVisibility();
  const deleteFaq = useDeleteFaq();

  // 카테고리 value → 한글 label 매핑 (없으면 value 그대로 표시)
  const categoryLabel = (value: string) =>
    categories?.find((c) => c.value === value)?.label ?? value;

  const handleDelete = () => {
    if (deleteTargetId == null) return;
    deleteFaq.mutate(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError) {
    return <div className="p-8 text-center text-destructive">목록을 불러오지 못했습니다.</div>;
  }

  const items = faqs ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">FAQ 관리</h1>
        <Button onClick={() => navigate('/admin/faqs/new')}>새 FAQ 작성</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">카테고리</TableHead>
              <TableHead>질문</TableHead>
              <TableHead className="w-24">노출</TableHead>
              <TableHead className="w-24">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  등록된 FAQ가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((faq) => (
                <TableRow
                  key={faq.faqId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/faqs/${faq.faqId}/edit`)}
                >
                  <TableCell className="text-muted-foreground">
                    {categoryLabel(faq.category)}
                  </TableCell>
                  <TableCell className="font-medium">{faq.question}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={faq.isVisible}
                      onCheckedChange={(checked) =>
                        changeVisibility.mutate({ faqId: faq.faqId, isVisible: checked })
                      }
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTargetId(faq.faqId)}
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

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteTargetId != null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>FAQ를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 FAQ는 사용자에게 더 이상 노출되지 않습니다.
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
