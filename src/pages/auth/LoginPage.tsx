import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { login } from '@/features/auth/api/authApi';
import { toAuthUser } from '@/shared/api/reissue';
import { useAuthStore } from '@/shared/stores/authStore';
import { Input } from '@/shared/components/ui/input';

// 로그인 폼 스키마 — 로그인은 "일치 여부"만 판단하므로 형식 검증은 최소(필수 + 이메일 형태)
const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요.').email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const LOGIN_ERROR_MESSAGES: Record<string, string> = {
      AUTH_106: '이미 해당 이메일로 가입된 계정이 있어요. 아래에서 이메일 로그인으로 이용해 주세요.',
      AUTH_107: '소셜 계정의 이메일 제공에 동의해 주세요.',
      AUTH_109: '탈퇴 처리된 계정이에요. 계정 복구를 원하시면 1:1 문의를 이용해 주세요.',
    };
    const errorCode = searchParams.get('error');
    const externalError = errorCode
      ? (LOGIN_ERROR_MESSAGES[errorCode] ?? '소셜 로그인에 실패했습니다. 다시 시도해 주세요.')
      : undefined;  

  const {
    register, handleSubmit, setError,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (form: LoginForm) => {
    setIsSubmitting(true);
    try {
      const result = await login(form);
      setAuth(result.accessToken, toAuthUser(result));
      toast.success(`${result.nickname ?? '회원'}님, 환영합니다!`);
      // GUEST(소셜 가입 미완료)가 일반 로그인할 일은 없지만(password null) 방어적으로 홈으로 통일
      navigate('/');
    } catch (error) {
      // 백엔드 정책: 로그인 실패는 전부 401 AUTH_101 (계정없음/비번틀림/탈퇴 구분 없음 — 열거 공격 방지)
      if (isAxiosError(error) && error.response?.data?.code === 'AUTH_101') {
        setError('root', { message: '이메일 또는 비밀번호가 일치하지 않습니다.' });
      } else {
        toast.error('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard title="로그인" description="따숨에 오신 것을 환영해요">
      {externalError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">{externalError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Input
            type="email"
            placeholder="이메일"
            autoComplete="email"
            className="!h-12 rounded-xl border-border bg-secondary px-4 text-base"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <Input
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            className="!h-12 rounded-xl border-border bg-secondary px-4 text-base"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {/* 로그인 실패(AUTH_101) — 필드가 아닌 폼 레벨 에러 */}
        {errors.root && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-ring py-3 text-base font-bold text-white transition-all hover:brightness-105 disabled:opacity-60"
        >
          {isSubmitting ? '로그인 중…' : '로그인'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link to="/reset-password" className="text-muted-foreground transition-colors hover:text-ring">
          비밀번호를 잊으셨나요?
        </Link>
        <Link to="/signup" className="font-semibold text-ring transition-colors hover:brightness-110">
          회원가입
        </Link>
      </div>

      {/* 구분선 */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">간편 로그인</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <SocialLoginButtons />
    </AuthCard>
  );
}