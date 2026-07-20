import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateFoster } from '@/features/foster/hooks/useCreateFoster';
import { getMyInfo } from '@/features/mypage/api/memberApi';
import { queryKeys } from '@/shared/api/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

const fosterApplicationSchema = z.object({
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

type FosterApplicationFormValues = z.infer<typeof fosterApplicationSchema>;

function getServerErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return '신청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const code = error.response?.data?.code;

  if (code === 'FOSTER_009') {
    return '이미 이 동물에게 임시보호를 신청한 내역이 있습니다.';
  }

  if (code === 'FOSTER_010') {
    return '이미 임시보호 중인 동물은 신청할 수 없습니다.';
  }

  if (code === 'INVALID_INPUT') {
    return '입력 내용을 다시 확인해 주세요.';
  }

  return '신청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

export function FosterApplicationForm({ animalId }: { animalId: number }) {
  const navigate = useNavigate();
  const createFosterMutation = useCreateFoster();

  const {
    data: memberInfo,
    isLoading: isMemberInfoLoading,
    isError: isMemberInfoError,
  } = useQuery({
    queryKey: queryKeys.mypage.myInfo(),
    queryFn: getMyInfo,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FosterApplicationFormValues>({
    resolver: zodResolver(fosterApplicationSchema),
    defaultValues: {
      age: '',
      job: '',
      message: '',
    },
  });

  const onSubmit = (values: FosterApplicationFormValues) => {
    createFosterMutation.mutate(
      {
        animalId,
        age: values.age,
        job: values.job,
        message: values.message,
      },
      {
        onSuccess: () => {
          toast.success('임시보호 신청이 완료되었습니다.');
          navigate('/mypage/fosters');
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
      <section
        className="rounded-xl border border-border bg-secondary/50 p-4"
        aria-label="신청자 정보"
      >
        <h2 className="text-lg font-bold text-foreground">신청자 정보</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          회원 정보에 등록된 연락처를 기준으로 신청이 접수됩니다.
        </p>

        {isMemberInfoLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            회원 정보를 불러오는 중…
          </p>
        ) : isMemberInfoError ? (
          <p className="mt-4 text-sm text-destructive">
            회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">이름</dt>
              <dd className="mt-1 text-base font-semibold text-foreground">
                {memberInfo?.name ?? '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">휴대폰 번호</dt>
              <dd className="mt-1 text-base font-semibold text-foreground">
                {memberInfo?.tel ?? '-'}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {errors.root && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>신청을 완료할 수 없습니다.</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <label
          htmlFor="foster-age"
          className="mb-2 block text-base font-semibold text-foreground"
        >
          나이
        </label>
        <Input
          id="foster-age"
          inputMode="numeric"
          maxLength={10}
          placeholder="숫자만 입력해 주세요"
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
          htmlFor="foster-job"
          className="mb-2 block text-base font-semibold text-foreground"
        >
          직업
        </label>
        <Input
          id="foster-job"
          maxLength={30}
          placeholder="예: 회사원, 학생, 프리랜서"
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
            htmlFor="foster-message"
            className="text-base font-semibold text-foreground"
          >
            하고 싶은 말
          </label>
          <span className="text-sm text-muted-foreground">선택</span>
        </div>
        <Textarea
          id="foster-message"
          maxLength={1000}
          placeholder="임시보호가 가능한 환경이나 경험을 자유롭게 작성해 주세요."
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
          onClick={() => navigate(-1)}
          disabled={createFosterMutation.isPending}
        >
          취소
        </Button>
        <Button type="submit" disabled={createFosterMutation.isPending}>
          {createFosterMutation.isPending ? '신청 중…' : '임시보호 신청하기'}
        </Button>
      </div>
    </form>
  );
}