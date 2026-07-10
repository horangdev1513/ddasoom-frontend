import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { CheckCircle2 } from 'lucide-react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { sendEmailAuthCode, verifyEmailAuthCode, signup, checkNicknameAvailable } from '@/features/auth/api/authApi';
import { Input } from '@/shared/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';

// 일반 회원가입 — 이메일 인증 3단계 플로우 (백엔드 Redis 설계와 1:1):
//   1단계 이메일 발송(authCode 3분) → 2단계 코드 검증(verified 30분) → 3단계 정보 입력·가입
// 검증 정규식은 백엔드 SignupRequest의 @Pattern과 동일 유지 — 변경 시 양쪽 동시 수정.
const signupSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요.').email('이메일 형식이 올바르지 않습니다.'),
  code: z.string().length(6, '인증코드 6자리를 입력해 주세요.'),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      '비밀번호는 대소문자, 숫자, 특수문자 포함 8자 이상이어야 합니다.',
    ),
  passwordConfirm: z.string(),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.').max(50, '이름은 50자 이하여야 합니다.'),
  nickname: z.string().regex(/^[a-zA-Z0-9가-힣]{2,10}$/, '닉네임은 2~10자의 한글, 영문, 숫자만 가능합니다.'),
  tel: z.string().regex(/^01(?:0|1|[6-9])(?:\d{3}|\d{4})\d{4}$/, "휴대폰 번호는 '-' 없이 10~11자리여야 합니다."),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['passwordConfirm'],
});
type SignupForm = z.infer<typeof signupSchema>;

// 이메일 인증 진행 단계 — 각 단계에서 이전 단계 입력은 잠긴다
type EmailStep = 'input' | 'sent' | 'verified';

export function SignupPage() {
  const navigate = useNavigate();
  const [emailStep, setEmailStep] = useState<EmailStep>('input');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'unchecked' | 'checking' | 'available' | 'taken'>('unchecked');
  const [showComplete, setShowComplete] = useState(false); // 가입 완료 모달

  const {
    register, handleSubmit, getValues, setError, trigger,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  /** 1단계: 인증코드 발송 (재발송 겸용 — 백엔드가 기존 인증상태를 무효화하고 새 코드 발급) */
  const handleSendCode = async () => {
    const isValid = await trigger('email');
    if (!isValid) return;

    setIsSending(true);
    try {
      await sendEmailAuthCode({ email: getValues('email') });
      setEmailStep('sent');
      toast.success('인증코드를 발송했어요. 메일함을 확인해 주세요. (유효시간 3분)');
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === 'AUTH_001') {
        setError('email', { message: '이미 가입된 이메일입니다.' });
      } else {
        toast.error('메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSending(false);
    }
  };

  /** 2단계: 코드 검증 (verified 30분 시작) */
  const handleVerifyCode = async () => {
    const isValid = await trigger('code');
    if (!isValid) return;

    try {
      await verifyEmailAuthCode({ email: getValues('email'), code: getValues('code') });
      setEmailStep('verified');
      toast.success('이메일 인증이 완료됐어요. 30분 안에 가입을 완료해 주세요.');
    } catch (error) {
      // 백엔드 AUTH_004 — 불일치/만료 통합 (보안상 구분 비노출)
      if (isAxiosError(error) && error.response?.data?.code === 'AUTH_004') {
        setError('code', { message: '인증코드가 올바르지 않거나 만료되었습니다.' });
      } else {
        toast.error('인증 확인 중 문제가 발생했습니다.');
      }
    }
  };

  /** 닉네임 중복확인 — 형식 검증(zod) 통과 후에만 API 호출 (팀 규칙) */
  const handleCheckNickname = async () => {
    const isValid = await trigger('nickname');
    if (!isValid) return;
    setNicknameStatus('checking');
    try {
      const available = await checkNicknameAvailable(getValues('nickname'));
      setNicknameStatus(available ? 'available' : 'taken');
    } catch {
      setNicknameStatus('unchecked');
      toast.error('중복 확인 중 문제가 발생했습니다.');
    }
  };

  /** 3단계: 가입 제출 */
  const onSubmit = async (form: SignupForm) => {
    if (emailStep !== 'verified') {
      toast.warning('이메일 인증을 먼저 완료해 주세요.');
      return;
    }
    if (nicknameStatus !== 'available') {
      toast.warning('닉네임 중복 확인을 해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        nickname: form.nickname,
        tel: form.tel,
      });
      setShowComplete(true); // 완료 모달 → 확인 시 로그인 페이지로
    } catch (error) {
      if (!isAxiosError(error)) {
        toast.error('가입 처리 중 문제가 발생했습니다.');
        return;
      }
      const code = error.response?.data?.code;
      if (code === 'AUTH_003') {
        // 인증 후 30분 초과 — 이메일 단계로 복귀 (SECURITY-FLOW 6번 ④ 확정 처리)
        setEmailStep('input');
        toast.error('이메일 인증이 만료되었습니다. 처음부터 다시 인증해 주세요.');
      } else if (code === 'AUTH_002' || code === 'DUPLICATE_CONFLICT') {
        setNicknameStatus('taken');
        toast.error('방금 다른 분이 사용한 닉네임이에요. 다른 닉네임을 입력해 주세요.');
      } else if (code === 'AUTH_001') {
        setEmailStep('input');
        setError('email', { message: '이미 가입된 이메일입니다.' });
      } else {
        toast.error('가입 처리 중 문제가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = '!h-12 rounded-xl border-border bg-secondary px-4 text-base';
  const sideButtonClass =
    'shrink-0 rounded-xl border border-ring/40 bg-secondary px-4 text-sm font-semibold text-ring transition-colors hover:bg-ring hover:text-white disabled:opacity-60';

  return (
    <AuthCard title="회원가입" description="따숨과 함께 따뜻한 인연을 시작해요">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* ── 1단계: 이메일 + 발송 ── */}
        <div>
          <div className="flex gap-2">
            <Input
              type="email" placeholder="이메일" autoComplete="email"
              disabled={emailStep === 'verified'}
              className={`${inputClass} flex-1 disabled:opacity-70`}
              {...register('email', { onChange: () => emailStep === 'sent' && setEmailStep('input') })}
            />
            {emailStep !== 'verified' && (
              <button type="button" onClick={handleSendCode} disabled={isSending} className={sideButtonClass}>
                {isSending ? '발송 중…' : emailStep === 'sent' ? '재발송' : '인증코드 발송'}
              </button>
            )}
          </div>
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          {emailStep === 'verified' && (
            <p className="mt-1 flex items-center gap-1 text-sm text-[#5BA97B]">
              <CheckCircle2 size={14} /> 인증이 완료된 이메일이에요.
            </p>
          )}
        </div>

        {/* ── 2단계: 인증코드 (발송 후에만 노출) ── */}
        {emailStep === 'sent' && (
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="인증코드 6자리" inputMode="numeric" maxLength={6}
                className={`${inputClass} flex-1`}
                {...register('code')}
              />
              <button type="button" onClick={handleVerifyCode} className={sideButtonClass}>
                확인
              </button>
            </div>
            {errors.code && <p className="mt-1 text-sm text-destructive">{errors.code.message}</p>}
          </div>
        )}

        {/* ── 3단계: 나머지 정보 (인증 완료 후에만 노출) ── */}
        {emailStep === 'verified' && (
          <>
            <div>
              <Input type="password" placeholder="비밀번호 (대소문자·숫자·특수문자 포함 8자 이상)"
                autoComplete="new-password" className={inputClass} {...register('password')} />
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="비밀번호 확인"
                autoComplete="new-password" className={inputClass} {...register('passwordConfirm')} />
              {errors.passwordConfirm && <p className="mt-1 text-sm text-destructive">{errors.passwordConfirm.message}</p>}
            </div>
            <div>
              <Input placeholder="이름 (실명)" autoComplete="name" className={inputClass} {...register('name')} />
              {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div>
              <div className="flex gap-2">
                <Input placeholder="닉네임 (2~10자)" className={`${inputClass} flex-1`}
                  {...register('nickname', { onChange: () => setNicknameStatus('unchecked') })} />
                <button type="button" onClick={handleCheckNickname}
                  disabled={nicknameStatus === 'checking'} className={sideButtonClass}>
                  {nicknameStatus === 'checking' ? '확인 중…' : '중복 확인'}
                </button>
              </div>
              {errors.nickname && <p className="mt-1 text-sm text-destructive">{errors.nickname.message}</p>}
              {nicknameStatus === 'available' && <p className="mt-1 text-sm text-[#5BA97B]">사용 가능한 닉네임이에요.</p>}
              {nicknameStatus === 'taken' && <p className="mt-1 text-sm text-destructive">이미 사용 중인 닉네임이에요.</p>}
            </div>
            <div>
              <Input type="tel" placeholder="휴대폰 번호 ('-' 없이 숫자만)" autoComplete="tel"
                className={inputClass} {...register('tel')} />
              {errors.tel && <p className="mt-1 text-sm text-destructive">{errors.tel.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full rounded-xl bg-ring py-3 text-base font-bold text-white transition-all hover:brightness-105 disabled:opacity-60">
              {isSubmitting ? '가입 중…' : '가입하기'}
            </button>
          </>
        )}
      </form>

      {/* 가입 완료 모달 — 확인 시 로그인 페이지로 */}
      <AlertDialog open={showComplete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-[#5BA97B]" size={22} /> 가입을 환영해요! 🐾
            </AlertDialogTitle>
            <AlertDialogDescription>
              따숨 회원가입이 완료되었어요. 로그인하고 새 가족을 기다리는 아이들을 만나보세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate('/login', { replace: true })}>
              로그인 하러 가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthCard>
  );
}