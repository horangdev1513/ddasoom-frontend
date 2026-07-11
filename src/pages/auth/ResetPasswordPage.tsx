import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { MailCheck, CheckCircle2 } from 'lucide-react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { requestPasswordReset, resetPassword } from '@/features/auth/api/authApi';
import { Input } from '@/shared/components/ui/input';

// 비밀번호 재설정 — 한 페이지에서 ?token 유무로 두 뷰를 분기:
//   토큰 없음: 재설정 메일 요청 폼 (로그인 페이지 "비밀번호를 잊으셨나요?" 진입)
//   토큰 있음: 새 비밀번호 입력 폼 (백엔드 메일 링크 {프론트}/reset-password?token={uuid} 착지)
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return token ? <ResetForm token={token} /> : <RequestForm />;
}

/* ───────────────────────── 요청 폼 (토큰 없음) ───────────────────────── */

const requestSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요.').email('이메일 형식이 올바르지 않습니다.'),
});
type RequestForm_ = z.infer<typeof requestSchema>;

function RequestForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm<RequestForm_>({ resolver: zodResolver(requestSchema) });

  const onSubmit = async (form: RequestForm_) => {
    setIsSubmitting(true);
    try {
      // 백엔드 정책: 이메일 존재 여부와 무관하게 항상 동일 성공 응답 (열거 공격 방지)
      // → 프론트도 "존재하면/안 하면" 분기 없이 단일 완료 화면. 실패 분기 자체가 없다.
      await requestPasswordReset(form.email);
      setIsSent(true);
    } catch {
      toast.error('요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <AuthCard title="메일을 확인해 주세요">
        <div className="flex flex-col items-center gap-4 text-center">
          <MailCheck size={44} className="text-ring" />
          <p className="text-base leading-relaxed text-muted-foreground">
            입력하신 주소가 가입된 이메일이라면
            <br />
            비밀번호 재설정 링크를 보내드렸어요.
            <br />
            <span className="text-sm">(링크는 30분간 유효해요)</span>
          </p>
          <Link to="/login" className="mt-2 text-sm font-semibold text-ring hover:brightness-110">
            로그인으로 돌아가기
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="비밀번호 찾기" description="가입한 이메일로 재설정 링크를 보내드려요">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Input
            type="email" placeholder="이메일" autoComplete="email"
            className="!h-12 rounded-xl border-border bg-secondary px-4 text-base"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-xl bg-ring py-3 text-base font-bold text-white transition-all hover:brightness-105 disabled:opacity-60"
        >
          {isSubmitting ? '요청 중…' : '재설정 링크 받기'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-muted-foreground transition-colors hover:text-ring">
          로그인으로 돌아가기
        </Link>
      </p>
    </AuthCard>
  );
}

/* ───────────────────────── 재설정 폼 (토큰 있음) ───────────────────────── */

// 비밀번호 규칙은 회원가입과 동일 — 백엔드 @Pattern과 1:1 유지 (변경 시 양쪽 동시 수정)
const resetSchema = z.object({
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      '비밀번호는 대소문자, 숫자, 특수문자 포함 8자 이상이어야 합니다.',
    ),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
});
type ResetForm_ = z.infer<typeof resetSchema>;

function ResetForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm<ResetForm_>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (form: ResetForm_) => {
    setIsSubmitting(true);
    try {
      await resetPassword(token, form.password);
      // 성공 = 백엔드가 전 세션 무효화 완료 — 재로그인 필수 (SECURITY-FLOW 5번)
      setIsDone(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === 'AUTH_108') {
        setIsTokenInvalid(true); // 만료/재사용 — 재요청 유도 화면으로 전환
      } else {
        toast.error('처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTokenInvalid) {
    return (
      <AuthCard title="링크가 만료됐어요">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-base leading-relaxed text-muted-foreground">
            재설정 링크가 만료되었거나 이미 사용됐어요.
            <br />
            아래에서 새 링크를 다시 요청해 주세요.
          </p>
          <Link
            to="/reset-password"
            className="w-full rounded-xl bg-ring py-3 text-center text-base font-bold text-white transition-all hover:brightness-105"
          >
            다시 요청하기
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (isDone) {
    return (
      <AuthCard title="비밀번호가 변경됐어요">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={44} className="text-[#5BA97B]" />
          <p className="text-base text-muted-foreground">새 비밀번호로 다시 로그인해 주세요.</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full rounded-xl bg-ring py-3 text-base font-bold text-white transition-all hover:brightness-105"
          >
            로그인 하러 가기
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="새 비밀번호 설정" description="사용할 새 비밀번호를 입력해 주세요">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Input
            type="password" placeholder="새 비밀번호 (대소문자·숫자·특수문자 포함 8자 이상)"
            autoComplete="new-password"
            className="!h-12 rounded-xl border-border bg-secondary px-4 text-base"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div>
          <Input
            type="password" placeholder="새 비밀번호 확인"
            autoComplete="new-password"
            className="!h-12 rounded-xl border-border bg-secondary px-4 text-base"
            {...register('passwordConfirm')}
          />
          {errors.passwordConfirm && <p className="mt-1 text-sm text-destructive">{errors.passwordConfirm.message}</p>}
        </div>
        <button
          type="submit" disabled={isSubmitting}
          className="w-full rounded-xl bg-ring py-3 text-base font-bold text-white transition-all hover:brightness-105 disabled:opacity-60"
        >
          {isSubmitting ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </AuthCard>
  );
}