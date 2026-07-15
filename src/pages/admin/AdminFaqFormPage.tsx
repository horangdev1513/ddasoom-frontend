import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAdminFaq,
  useCreateFaq,
  useUpdateFaq,
  useFaqCategories,
} from '@/features/admin/hooks/useFaqs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

// 백엔드 제약과 맞춤: question VARCHAR(255) NOT NULL, answer TEXT NOT NULL, category Enum NOT NULL
const faqSchema = z.object({
  category: z.string().min(1, '카테고리를 선택해 주세요.'),
  question: z.string().min(1, '질문을 입력해 주세요.').max(255, '질문은 255자를 초과할 수 없습니다.'),
  answer: z.string().min(1, '답변을 입력해 주세요.'),
});
type FaqForm = z.infer<typeof faqSchema>;

export function AdminFaqFormPage() {
  const navigate = useNavigate();
  const { faqId } = useParams();
  const isEdit = faqId != null;
  const numericId = isEdit ? Number(faqId) : null;

  const { data: faq } = useAdminFaq(numericId);
  const { data: categories } = useFaqCategories();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FaqForm>({
    resolver: zodResolver(faqSchema),
    defaultValues: { category: '', question: '', answer: '' },
  });

  // 수정 모드 — 기존 데이터 로드되면 폼에 채움
  useEffect(() => {
    if (isEdit && faq) {
      reset({ category: faq.category, question: faq.question, answer: faq.answer });
    }
  }, [isEdit, faq, reset]);

  const onSubmit = (form: FaqForm) => {
    if (isEdit && numericId != null) {
      updateFaq.mutate(
        { faqId: numericId, payload: form },
        { onSuccess: () => navigate('/admin/faqs') },
      );
    } else {
      createFaq.mutate(form, {
        onSuccess: () => navigate('/admin/faqs'),
      });
    }
  };

  const isSubmitting = createFaq.isPending || updateFaq.isPending;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">{isEdit ? 'FAQ 수정' : '새 FAQ 작성'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="question">질문</Label>
          <Input id="question" {...register('question')} placeholder="질문을 입력하세요" />
          {errors.question && <p className="text-sm text-destructive">{errors.question.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">답변</Label>
          <Textarea
            id="answer"
            {...register('answer')}
            placeholder="답변을 입력하세요"
            rows={12}
          />
          {errors.answer && <p className="text-sm text-destructive">{errors.answer.message}</p>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? '수정 완료' : '등록'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/faqs')}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
