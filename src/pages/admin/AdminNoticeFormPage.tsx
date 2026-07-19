import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminNotice, useCreateNotice, useUpdateNotice } from '@/features/admin/hooks/useNotices';
import { RichTextEditor, type RichTextEditorHandle } from '@/shared/components/editor';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

// title만 폼(RHF)으로 검증한다. content는 RichTextEditor가 ref(getPayload)로 조달하므로 폼 밖에서 관리.
// 백엔드 제약: title VARCHAR(255) NOT NULL
const noticeSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(255, '제목은 255자를 초과할 수 없습니다.'),
});
type NoticeForm = z.infer<typeof noticeSchema>;

export function AdminNoticeFormPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams();
  const isEdit = noticeId != null;
  const numericId = isEdit ? Number(noticeId) : null;

  const { data: notice } = useAdminNotice(numericId);
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();

  const editorRef = useRef<RichTextEditorHandle>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoticeForm>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: '' },
    values: isEdit && notice ? { title: notice.title } : undefined,
  });

  const onSubmit = async (form: NoticeForm) => {
    if (!editorRef.current) return;

    // 1. 미업로드 이미지 업로드 → 확정 HTML + imageIds. 실패 토스트는 에디터가 표시하므로 여기선 return만.
    let payload;
    try {
      payload = await editorRef.current.getPayload();
    } catch {
      return;
    }

    // 2. 공지 생성/수정
    try {
      if (isEdit && numericId != null) {
        await updateNotice.mutateAsync({
          noticeId: numericId,
          payload: { title: form.title, content: payload.html, imageIds: payload.imageIds },
        });
      } else {
        await createNotice.mutateAsync({
          title: form.title,
          content: payload.html,
          imageIds: payload.imageIds,
        });
      }
    } catch {
      return; // mutation 실패 — 임시 blob은 유지(재시도 가능)
    }

    // 3. 저장 성공 후 임시 blob 정리 (누락 시 IndexedDB에 blob 누적)
    await editorRef.current.cleanup();

    navigate('/admin/notices');
  };

  const isSubmitting = createNotice.isPending || updateNotice.isPending;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">
        {isEdit ? '공지사항 수정' : '새 공지 작성'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" {...register('title')} placeholder="공지 제목을 입력하세요" />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>내용</Label>
          {/* 수정 모드는 기존 content(HTML)를 initialHtml로 복원해야 하므로 로드 완료 후 마운트한다.
              RichTextEditor는 initialHtml을 첫 마운트 시점에만 읽기 때문. */}
          {isEdit && !notice ? (
            <div className="min-h-[280px] rounded-md border border-border p-4 text-sm text-muted-foreground">
              불러오는 중…
            </div>
          ) : (
            <RichTextEditor
              ref={editorRef}
              ownerType="NOTICE"
              initialHtml={isEdit ? notice?.content ?? '' : ''}
              placeholder="공지 내용을 입력하세요"
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? '수정 완료' : '등록'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/notices')}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
