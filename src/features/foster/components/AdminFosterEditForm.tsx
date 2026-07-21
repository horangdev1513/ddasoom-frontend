import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import { useUpdateAdminFoster } from '@/features/foster/hooks/useUpdateAdminFoster';
import type {
  FosterAdminDetail,
  FosterAdminUpdatePayload,
  FosterStatus,
} from '@/features/foster/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

const statusOptions: Record<FosterStatus, FosterStatus[]> = {
  PENDING: ['FOSTERING', 'REJECTED'],
  FOSTERING: ['FOSTERING', 'EXTENDED', 'ENDED'],
  EXTENDED: ['EXTENDED', 'ENDED'],
  REJECTED: ['REJECTED'],
  ENDED: ['ENDED'],
};

const statusLabels: Record<FosterStatus, string> = {
  PENDING: '신청 대기',
  REJECTED: '신청 거절',
  FOSTERING: '임시보호 중',
  EXTENDED: '임시보호 연장',
  ENDED: '임시보호 종료',
};

const fosterAdminEditSchema = z
  .object({
    answer: z.string().max(1000, '관리자 답변은 1000자 이하로 입력해 주세요.'),
    status: z.enum(['PENDING', 'REJECTED', 'FOSTERING', 'EXTENDED', 'ENDED']),
    fosterStartAt: z.string(),
    fosterEndAt: z.string(),
    fosterExtendAt: z.string(),
    fosterCompleteAt: z.string(),
  })
  .superRefine((values, context) => {
    const needsBasicSchedule =
      values.status === 'FOSTERING' ||
      values.status === 'EXTENDED' ||
      values.status === 'ENDED';

    if (needsBasicSchedule && !values.fosterStartAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterStartAt'],
        message: '임시보호 시작일을 입력해 주세요.',
      });
    }

    if (needsBasicSchedule && !values.fosterEndAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterEndAt'],
        message: '기본 종료일을 입력해 주세요.',
      });
    }

    if (values.status === 'EXTENDED' && !values.fosterExtendAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterExtendAt'],
        message: '연장일을 입력해 주세요.',
      });
    }

    if (values.status === 'ENDED' && !values.fosterCompleteAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterCompleteAt'],
        message: '최종 종료일을 입력해 주세요.',
      });
    }

    if (
      values.fosterStartAt &&
      values.fosterEndAt &&
      values.fosterStartAt > values.fosterEndAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterEndAt'],
        message: '기본 종료일은 시작일보다 빠를 수 없습니다.',
      });
    }

    if (
      values.fosterEndAt &&
      values.fosterExtendAt &&
      values.fosterEndAt > values.fosterExtendAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterExtendAt'],
        message: '연장일은 기본 종료일보다 빠를 수 없습니다.',
      });
    }

    if (
      values.fosterStartAt &&
      values.fosterCompleteAt &&
      values.fosterStartAt > values.fosterCompleteAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fosterCompleteAt'],
        message: '최종 종료일은 시작일보다 빠를 수 없습니다.',
      });
    }
  });

type FosterAdminEditFormValues = z.infer<typeof fosterAdminEditSchema>;

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';

  const date = new Date(value);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function getServerErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return '수정 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const code = error.response?.data?.code;

  if (code === 'FOSTER_007') {
    return '현재 상태에서는 선택한 상태로 변경할 수 없습니다.';
  }

  if (code === 'FOSTER_008') {
    return '임시보호 일정의 순서를 다시 확인해 주세요.';
  }

  if (code === 'FOSTER_013') {
    return '기존 답변과 일정 정보는 모두 포함해서 수정해야 합니다.';
  }

  if (code === 'FOSTER_014') {
    return '선택한 상태에 필요한 일정 정보가 누락되었습니다.';
  }

  if (code === 'FOSTER_017') {
    return '종료된 임시보호 신청의 일정은 수정할 수 없습니다.';
  }

  if (code === 'FOSTER_018') {
    return '종료 처리 시 기존 임시보호 일정은 수정할 수 없습니다.';
  }

  if (code === 'FOSTER_003') {
    return '삭제된 신청은 수정할 수 없습니다.';
  }

  return '수정 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

export function AdminFosterEditForm({
  foster,
  getDetailPath,
}: {
  foster: FosterAdminDetail;
  getDetailPath: (status: FosterStatus) => string;
}) {
  const navigate = useNavigate();
  const updateFosterMutation = useUpdateAdminFoster();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FosterAdminEditFormValues>({
    resolver: zodResolver(fosterAdminEditSchema),
    defaultValues: {
      answer: foster.answer ?? '',
      status: foster.status,
      fosterStartAt: toDateTimeLocal(foster.fosterStartAt),
      fosterEndAt: toDateTimeLocal(foster.fosterEndAt),
      fosterExtendAt: toDateTimeLocal(foster.fosterExtendAt),
      fosterCompleteAt: toDateTimeLocal(foster.fosterCompleteAt),
    },
  });

  const selectedStatus = watch('status');
  const isEndedFoster = foster.status === 'ENDED';

  const showBasicSchedule =
    selectedStatus === 'FOSTERING' ||
    selectedStatus === 'EXTENDED' ||
    selectedStatus === 'ENDED';

  const showExtendSchedule =
    selectedStatus === 'EXTENDED' || Boolean(foster.fosterExtendAt);

  const showCompleteSchedule = selectedStatus === 'ENDED';

  const scheduleInputProps = isEndedFoster
    ? { readOnly: true, tabIndex: -1 }
    : {};

  const scheduleInputClass = isEndedFoster
    ? 'pointer-events-none bg-muted text-muted-foreground'
    : 'bg-secondary';

  const onSubmit = (values: FosterAdminEditFormValues) => {
    const payload: FosterAdminUpdatePayload = {
      answer: values.answer.trim(),
      status: values.status,
      fosterStartAt: values.fosterStartAt || null,
      fosterEndAt: values.fosterEndAt || null,
      fosterExtendAt: values.fosterExtendAt || null,
      fosterCompleteAt: values.fosterCompleteAt || null,
    };

    updateFosterMutation.mutate(
      {
        fosterId: foster.fosterId,
        payload,
      },
      {
        onSuccess: () => {
          navigate(getDetailPath(values.status), { replace: true });
        },
        onError: (error) => {
          setError('root', {
            message: getServerErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      {errors.root && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>수정할 수 없습니다.</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <p className="mb-3 text-base font-semibold text-foreground">처리 상태</p>
        <div className="flex flex-wrap gap-2">
          {statusOptions[foster.status].map((status) => (
            <Button
              key={status}
              type="button"
              variant={selectedStatus === status ? 'default' : 'outline'}
              aria-pressed={selectedStatus === status}
              onClick={() =>
                setValue('status', status, { shouldValidate: true })
              }
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="foster-admin-answer"
          className="mb-2 block text-base font-semibold text-foreground"
        >
          관리자 답변
        </label>
        <Textarea
          id="foster-admin-answer"
          maxLength={1000}
          className="min-h-36 rounded-xl border-border bg-secondary px-4 py-3 text-base"
          aria-invalid={Boolean(errors.answer)}
          {...register('answer')}
        />
        {errors.answer && (
          <p className="mt-1 text-sm text-destructive">
            {errors.answer.message}
          </p>
        )}
      </div>

      {showBasicSchedule && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="foster-admin-start-at"
              className="mb-2 block text-base font-semibold text-foreground"
            >
              임시보호 시작일
            </label>
            <Input
              id="foster-admin-start-at"
              type="datetime-local"
              {...scheduleInputProps}
              className={scheduleInputClass}
              aria-invalid={Boolean(errors.fosterStartAt)}
              {...register('fosterStartAt')}
            />
            {errors.fosterStartAt && (
              <p className="mt-1 text-sm text-destructive">
                {errors.fosterStartAt.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="foster-admin-end-at"
              className="mb-2 block text-base font-semibold text-foreground"
            >
              기본 종료일
            </label>
            <Input
              id="foster-admin-end-at"
              type="datetime-local"
              {...scheduleInputProps}
              className={scheduleInputClass}
              aria-invalid={Boolean(errors.fosterEndAt)}
              {...register('fosterEndAt')}
            />
            {errors.fosterEndAt && (
              <p className="mt-1 text-sm text-destructive">
                {errors.fosterEndAt.message}
              </p>
            )}
          </div>
        </div>
      )}

      {showExtendSchedule && (
        <div>
          <label
            htmlFor="foster-admin-extend-at"
            className="mb-2 block text-base font-semibold text-foreground"
          >
            연장일
          </label>
          <Input
            id="foster-admin-extend-at"
            type="datetime-local"
            {...scheduleInputProps}
            className={scheduleInputClass}
            aria-invalid={Boolean(errors.fosterExtendAt)}
            {...register('fosterExtendAt')}
          />
          {errors.fosterExtendAt && (
            <p className="mt-1 text-sm text-destructive">
              {errors.fosterExtendAt.message}
            </p>
          )}
        </div>
      )}

      {showCompleteSchedule && (
        <div>
          <label
            htmlFor="foster-admin-complete-at"
            className="mb-2 block text-base font-semibold text-foreground"
          >
            최종 종료일
          </label>
          <Input
            id="foster-admin-complete-at"
            type="datetime-local"
            {...scheduleInputProps}
            className={scheduleInputClass}
            aria-invalid={Boolean(errors.fosterCompleteAt)}
            {...register('fosterCompleteAt')}
          />
          {errors.fosterCompleteAt && (
            <p className="mt-1 text-sm text-destructive">
              {errors.fosterCompleteAt.message}
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          disabled={updateFosterMutation.isPending}
          onClick={() => navigate(getDetailPath(foster.status))}
        >
          취소
        </Button>
        <Button type="submit" disabled={updateFosterMutation.isPending}>
          {updateFosterMutation.isPending ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  );
}