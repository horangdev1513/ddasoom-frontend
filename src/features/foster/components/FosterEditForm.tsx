import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useUpdateFoster } from '@/features/foster/hooks/useUpdateFoster';
import type { FosterUserDetail } from '@/features/foster/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

const fosterEditSchema = z.object({
  age: z
    .string()
    .trim()
    .min(1, '나이를 입력해 주세요.')
    .max(10, '나이는 10자 이하로 입력해 주세요.')
    .regex(/^[0-9]+$/, '나이는 숫자만 입력할 수 있어요.'),
  job: z
    .string()
    .trim()
    .min(1, '직업을 입력해 주세요.')
    .max(30, '직업은 30자 이하로 입력해 주세요.')
    .regex(/^[가-힣a-zA-Z0-9 ]+$/, '직업은 한글, 영문, 숫자, 공백만 입력할 수 있어요.'),
  message: z.string().max(1000, '하고 싶은 말은 1000자 이하로 입력해 주세요.'),
});

type FosterEditFormValues = z.infer<typeof fosterEditSchema>;

function getServerErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return '수정 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const code = error.response?.data?.code;

  if (code === 'FOSTER_011') {
    return '신청 대기 또는 신청 거절 상태에서만 수정할 수 있습니다.';
  }

  if (code === 'FOSTER_001') {
    return '임시보호 신청 정보를 찾을 수 없습니다.';
  }

  if (code === 'INVALID_INPUT') {
    return '입력 내용을 다시 확인해 주세요.';
  }

  return '수정 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

export function FosterEditForm({ foster }: { foster: FosterUserDetail }) {
  const navigate = useNavigate();
  const updateFosterMutation = useUpdateFoster();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FosterEditFormValues>({
    resolver: zodResolver(fosterEditSchema),
    defaultValues: {
      age: foster.age,
      job: foster.job,
      message: foster.message ?? '',
    },
  });

  const onSubmit = (values: FosterEditFormValues) => {
    updateFosterMutation.mutate(
      {
        fosterId: foster.fosterId,
        payload: values,
      },
      {
        onSuccess: () => {
          navigate(`/mypage/fosters/${foster.fosterId}`, { replace: true });
        },
        onError: (error) => {
          setError('root', {
            message: getServerErrorMessage(error),
          });
        },
      },
    );
  };

  const inputClass = 'rounded-xl border-border bg-secondary px-4 text-base';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {errors.root && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>수정할 수 없습니다.</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <label
          htmlFor="foster-edit-age"
          className="mb-2 block text-base font-semibold text-foreground"
        >
          나이
        </label>
        <Input
          id="foster-edit-age"
          inputMode="numeric"
          maxLength={10}
          className={inputClass}
          aria-invalid={Boolean(errors.age)}
          {...register('age')}
        />
        {errors.age && (
          <p className="mt-1 text-sm text-destructive">{errors.age.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="foster-edit-job"
          className="mb-2 block text-base font-semibold text-foreground"
        >
          직업
        </label>
        <Input
          id="foster-edit-job"
          maxLength={30}
          className={inputClass}
          aria-invalid={Boolean(errors.job)}
          {...register('job')}
        />
        {errors.job && (
          <p className="mt-1 text-sm text-destructive">{errors.job.message}</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="foster-edit-message"
            className="text-base font-semibold text-foreground"
          >
            하고 싶은 말
          </label>
          <span className="text-sm text-muted-foreground">선택</span>
        </div>
        <Textarea
          id="foster-edit-message"
          maxLength={1000}
          className="min-h-36 rounded-xl border-border bg-secondary px-4 py-3 text-base"
          aria-invalid={Boolean(errors.message)}
          {...register('message')}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/mypage/fosters/${foster.fosterId}`)}
          disabled={updateFosterMutation.isPending}
        >
          취소
        </Button>
        <Button type="submit" disabled={updateFosterMutation.isPending}>
          {updateFosterMutation.isPending ? '수정 중…' : '수정 완료'}
        </Button>
      </div>
    </form>
  );
}