import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';

import {
  RichTextEditor,
  type RichTextEditorHandle,
} from '@/shared/components/editor';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useCreatePost } from '@/features/board/hooks/useCreatePost';

// 입양후기(ADOPTION_REVIEW) 작성 페이지.

const REVIEW_CATEGORIES = ['강아지', '고양이'] as const;

// 제목·카테고리만 zod 로 검증. 본문(RichTextEditor)은 RHF 밖(ref)이라 제출 시점에 수동 검증한다.
const reviewSchema = z.object({
  category: z.string().min(1, '카테고리를 선택해주세요.'),
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(255, '제목은 255자 이하여야 합니다.'),
});
type ReviewForm = z.infer<typeof reviewSchema>;

export function ReviewWritePage() {
  const navigate = useNavigate();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const createPost = useCreatePost();

  // 이미지 업로드(getPayload) 구간은 mutation 밖이라 isPending 으로 안 잡힘 → 별도 상태로 전체를 덮는다.
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { category: '', title: '' },
  });

  const onSubmit = async (form: ReviewForm) => {
    if (isSaving || !editorRef.current) return;
    setIsSaving(true);
    try {
      // 1) 본문 이미지 일괄 업로드 + 확정 HTML/imageIds 획득.
      //    실패 시 에디터 내부가 안내 토스트를 띄우고 throw → 여기선 조용히 종료(중복 토스트 방지).
      let payload;
      try {
        payload = await editorRef.current.getPayload();
      } catch {
        return;
      }

      // 2) 본문 빈값 수동 검증. 빈 에디터의 HTML 은 <p></p> 형태 → 태그 제거 후 판단.
      const text = payload.html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, '')
        .trim();
      if (text.length === 0 && payload.imageIds.length === 0) {
        toast.error('내용을 입력해주세요.');
        return;
      }

      // 3) 게시글 저장. 성공 토스트/목록 무효화는 useCreatePost.onSuccess 가 담당.
      try {
        await createPost.mutateAsync({
          boardType: 'ADOPTION_REVIEW',
          category: form.category,
          title: form.title,
          content: payload.html,
          imageIds: payload.imageIds,
          thumbnailImageId: payload.imageIds[0] ?? null, // ← 이미지 있으면 첫 장을 대표로, 없으면 null
        });
      } catch (err) {
        // 백엔드 ApiResponse.message 는 사용자 노출용 문구이므로 그대로 안내.
        const message = axios.isAxiosError(err)
          ? (err.response?.data?.message as string | undefined)
          : undefined;
        toast.error(
          message ?? '게시글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
        );
        return;
      }

      // 4) 저장 성공 후에만 임시 blob(IndexedDB) 정리 + 목록으로 이동.
      await editorRef.current.cleanup();
      navigate('/board/review');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='mx-auto max-w-3xl px-4 py-8'>
      <h1 className='mb-6 text-xl font-semibold'>입양 후기 작성</h1>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='category'>카테고리</Label>
          <Controller
            name='category'
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id='category' className='w-40'>
                  <SelectValue placeholder='카테고리를 선택하세요' />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className='text-sm text-destructive'>
              {errors.category.message}
            </p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='title'>제목</Label>
          <Input
            id='title'
            {...register('title')}
            placeholder='제목을 입력하세요'
          />
          {errors.title && (
            <p className='text-sm text-destructive'>{errors.title.message}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='content'>내용</Label>
          <RichTextEditor
            ref={editorRef}
            ownerType='POST'
            placeholder='입양 후기를 남겨주세요'
          />
        </div>

        <div className='flex gap-2'>
          <Button type='submit' disabled={isSaving}>
            {isSaving ? '등록 중...' : '등록'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/board/review')}
            disabled={isSaving}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
