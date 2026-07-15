import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminNotice, useCreateNotice, useUpdateNotice } from '@/features/admin/hooks/useNotices';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';

// 백엔드 제약과 맞춤: title VARCHAR(255) NOT NULL, content TEXT NOT NULL
const noticeSchema = z.object({
  title: z.string().min(1, '제목을 입력해 주세요.').max(255, '제목은 255자를 초과할 수 없습니다.'),
  content: z.string().min(1, '내용을 입력해 주세요.'),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoticeForm>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: '', content: '' },
  });

  // 수정 모드 — 기존 데이터 로드되면 폼에 채움
  useEffect(() => {
    if (isEdit && notice) {
      reset({ title: notice.title, content: notice.content });
    }
  }, [isEdit, notice, reset]);

  const onSubmit = (form: NoticeForm) => {
    if (isEdit && numericId != null) {
      updateNotice.mutate(
        { noticeId: numericId, payload: form },
        { onSuccess: () => navigate('/admin/notices') },
      );
    } else {
      createNotice.mutate(form, {
        onSuccess: () => navigate('/admin/notices'),
      });
    }
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
          <Label htmlFor="content">내용</Label>
          <Textarea
            id="content"
            {...register('content')}
            placeholder="공지 내용을 입력하세요"
            rows={12}
          />
          {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
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