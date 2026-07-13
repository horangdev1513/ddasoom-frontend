import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { LogIn, KeyRound, Trash2 } from 'lucide-react';
import {
  getMyInfo, updateProfile, changePassword, withdraw, getMyRecentLoginLogs,
  type MemberInfo, type LoginLogItem,
} from '@/features/mypage/api/memberApi';
import { checkNicknameAvailable } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/authStore';
import { Input } from '@/shared/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';

// 내 정보 관리 — 기본정보(조회↔편집 모드) / 비밀번호 변경(접힌 카드) / 최근 로그인 이력 / 회원 탈퇴.
// UX 원칙: 폼은 상시 노출하지 않는다 — "수정하기/변경하기"를 눌러야 편집 상태로 전환 (실수 저장 방지).
export function ProfileTab() {
  const [info, setInfo] = useState<MemberInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMyInfo()
      .then(setInfo)
      .catch(() => toast.error('정보를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-white p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (!info) {
    return <div className="rounded-2xl border border-border bg-white p-8 text-center text-destructive">정보를 불러오지 못했습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <ProfileInfoCard info={info} onUpdated={setInfo} />
      <PasswordChangeCard />
      <RecentLoginLogsCard />
      <WithdrawCard />
    </div>
  );
}

/* ───────────────────────── 카드 1: 기본정보 (조회 ↔ 편집 모드) ───────────────────────── */

const profileSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상이어야 합니다.')
    .max(50, '이름은 50자 이하여야 합니다.')
    .refine(
      (v) => /^[가-힣]+$/.test(v) || /^[a-zA-Z\s]+$/.test(v),
      '이름은 한글 또는 영문만 입력할 수 있습니다.',
    ),
  nickname: z.string().regex(/^[a-zA-Z0-9가-힣]{2,10}$/, '닉네임은 2~10자의 한글, 영문, 숫자만 가능합니다.'),
  tel: z.string().regex(/^01(?:0|1|[6-9])(?:\d{3}|\d{4})\d{4}$/, "휴대폰 번호는 '-' 없이 10~11자리여야 합니다."),
});
type ProfileForm = z.infer<typeof profileSchema>;

function ProfileInfoCard({ info, onUpdated }: { info: MemberInfo; onUpdated: (info: MemberInfo) => void }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isEditing, setIsEditing] = useState(false); // 조회 모드 ↔ 편집 모드
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'unchecked' | 'checking' | 'available' | 'taken'>('unchecked');

  const {
    register, handleSubmit, getValues, trigger, watch, reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: info.name, nickname: info.nickname, tel: info.tel },
  });

  // 닉네임을 실제로 바꿨을 때만 중복확인을 강제 (기존 값 그대로면 확인 불필요)
  const nicknameChanged = watch('nickname') !== info.nickname;

  /** 편집 취소 — 폼을 원래 값으로 복원하고 조회 모드로 */
  const handleCancel = () => {
    reset({ name: info.name, nickname: info.nickname, tel: info.tel });
    setNicknameStatus('unchecked');
    setIsEditing(false);
  };

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

  const onSubmit = async (form: ProfileForm) => {
    if (nicknameChanged && nicknameStatus !== 'available') {
      toast.warning('변경한 닉네임의 중복 확인을 해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await updateProfile(form);
      onUpdated(updated);
      // 헤더 닉네임 즉시 동기화
      if (accessToken) setAuth(accessToken, { memberId: updated.memberId, nickname: updated.nickname, role: updated.role });
      toast.success('정보가 수정되었어요.');
      setIsEditing(false); // 저장 성공 → 조회 모드 복귀
      setNicknameStatus('unchecked');
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === 'AUTH_002') {
        setNicknameStatus('taken');
        toast.error('방금 다른 분이 사용한 닉네임이에요.');
      } else {
        toast.error('수정 중 문제가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = '!h-11 rounded-xl border-border bg-secondary px-4 text-base';

  // ── 조회 모드: 텍스트 표시 + "수정하기" ──
  if (!isEditing) {
    return (
      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">기본 정보</h2>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-xl border border-ring/40 bg-secondary px-4 py-2 text-sm font-semibold text-ring transition-colors hover:bg-ring hover:text-white"
          >
            수정하기
          </button>
        </div>
        <dl className="space-y-3">
          <ProfileInfoRow label="이메일" value={`${info.email} (변경 불가)`} />
          <ProfileInfoRow label="이름" value={info.name} />
          <ProfileInfoRow label="닉네임" value={info.nickname} />
          <ProfileInfoRow label="휴대폰 번호" value={info.tel} />
        </dl>
      </section>
    );
  }

  // ── 편집 모드: 폼 + 수정 완료 / 취소 ──
  return (
    <section className="rounded-2xl border border-ring/40 bg-white p-6">
      <h2 className="mb-4 text-xl font-bold text-foreground">기본 정보 수정</h2>
      <p className="mb-5 text-sm text-muted-foreground">이메일: {info.email} (변경 불가)</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">이름</label>
          <Input className={inputClass} {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">닉네임</label>
          <div className="flex gap-2">
            <Input
              className={`${inputClass} flex-1`}
              {...register('nickname', { onChange: () => setNicknameStatus('unchecked') })}
            />
            {nicknameChanged && (
              <button
                type="button"
                onClick={handleCheckNickname}
                disabled={nicknameStatus === 'checking'}
                className="shrink-0 rounded-xl border border-ring/40 bg-secondary px-4 text-sm font-semibold text-ring transition-colors hover:bg-ring hover:text-white disabled:opacity-60"
              >
                {nicknameStatus === 'checking' ? '확인 중…' : '중복 확인'}
              </button>
            )}
          </div>
          {errors.nickname && <p className="mt-1 text-sm text-destructive">{errors.nickname.message}</p>}
          {nicknameStatus === 'available' && <p className="mt-1 text-sm text-[#5BA97B]">사용 가능한 닉네임이에요.</p>}
          {nicknameStatus === 'taken' && <p className="mt-1 text-sm text-destructive">이미 사용 중인 닉네임이에요.</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">휴대폰 번호</label>
          <Input className={inputClass} {...register('tel')} />
          {errors.tel && <p className="mt-1 text-sm text-destructive">{errors.tel.message}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-ring px-6 py-2.5 text-base font-bold text-white transition-all hover:brightness-105 disabled:opacity-60"
          >
            {isSubmitting ? '저장 중…' : '수정 완료'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-border px-6 py-2.5 text-base font-semibold text-muted-foreground transition-colors hover:bg-secondary"
          >
            취소
          </button>
        </div>
      </form>
    </section>
  );
}

/** 조회 모드의 정보 행 */
function ProfileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4 text-base">
      <dt className="w-24 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ───────────────────────── 카드 2: 비밀번호 변경 (접힌 카드 → 펼침) ───────────────────────── */

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
  newPassword: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
      '비밀번호는 대소문자, 숫자, 특수문자 포함 8자 이상이어야 합니다.',
    ),
  newPasswordConfirm: z.string(),
}).refine((d) => d.newPassword === d.newPasswordConfirm, {
  message: '새 비밀번호가 일치하지 않습니다.',
  path: ['newPasswordConfirm'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

function PasswordChangeCard() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [isOpen, setIsOpen] = useState(false); // 접힘 ↔ 폼 펼침
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register, handleSubmit, setError, reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  /** 펼침 취소 — 입력값 비우고 접기 */
  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const onSubmit = async (form: PasswordForm) => {
    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      // 백엔드가 전 세션 무효화 — 클라이언트도 즉시 로그아웃 후 재로그인 유도
      clearAuth();
      toast.success('비밀번호가 변경됐어요. 다시 로그인해 주세요.');
      navigate('/login', { replace: true });
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.code === 'MEMBER_004') {
        setError('currentPassword', { message: '현재 비밀번호가 일치하지 않습니다.' });
      } else if (isAxiosError(error) && error.response?.data?.code === 'MEMBER_005') {
        toast.error('소셜 로그인 회원은 비밀번호를 변경할 수 없어요.');
        handleClose();
      } else {
        toast.error('변경 중 문제가 발생했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = '!h-11 rounded-xl border-border bg-secondary px-4 text-base';

  return (
    <section className={`rounded-2xl border bg-white p-6 ${isOpen ? 'border-ring/40' : 'border-border'}`}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
          <KeyRound size={19} className="text-ring" /> 비밀번호 변경
        </h2>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="rounded-xl border border-ring/40 bg-secondary px-4 py-2 text-sm font-semibold text-ring transition-colors hover:bg-ring hover:text-white"
          >
            변경하기
          </button>
        )}
      </div>

      {!isOpen ? (
        <p className="mt-2 text-sm text-muted-foreground">
          변경 시 모든 기기에서 로그아웃되며 다시 로그인해야 해요. (소셜 로그인 회원은 이용 불가)
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <div>
            <Input type="password" placeholder="현재 비밀번호" autoComplete="current-password" className={inputClass} {...register('currentPassword')} />
            {errors.currentPassword && <p className="mt-1 text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <Input type="password" placeholder="새 비밀번호 (대소문자·숫자·특수문자 포함 8자 이상)" autoComplete="new-password" className={inputClass} {...register('newPassword')} />
            {errors.newPassword && <p className="mt-1 text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div>
            <Input type="password" placeholder="새 비밀번호 확인" autoComplete="new-password" className={inputClass} {...register('newPasswordConfirm')} />
            {errors.newPasswordConfirm && <p className="mt-1 text-sm text-destructive">{errors.newPasswordConfirm.message}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-ring px-6 py-2.5 text-base font-bold text-white transition-all hover:brightness-105 disabled:opacity-60"
            >
              {isSubmitting ? '변경 중…' : '비밀번호 변경'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-border px-6 py-2.5 text-base font-semibold text-muted-foreground transition-colors hover:bg-secondary"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ───────────────────────── 카드 3: 최근 로그인 이력 ───────────────────────── */

const LOGIN_TYPE_LABEL: Record<string, string> = {
  LOCAL: '이메일 로그인',
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
};

function RecentLoginLogsCard() {
  const [logs, setLogs] = useState<LoginLogItem[] | null>(null);

  useEffect(() => {
    getMyRecentLoginLogs().then(setLogs).catch(() => setLogs([]));
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
        <LogIn size={19} className="text-ring" /> 최근 로그인 이력
      </h2>
      {logs === null ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">로그인 이력이 없어요.</p>
      ) : (
        <ul className="divide-y divide-border">
          {logs.map((log) => (
            <li key={log.loginLogId} className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium text-foreground">{LOGIN_TYPE_LABEL[log.loginType] ?? log.loginType}</span>
              <span className="text-muted-foreground">{new Date(log.loginAt).toLocaleString('ko-KR')}</span>
            </li>
          ))}
        </ul>
      )}
      {/* TODO: 전체 보기 — GET /members/me/login-logs 페이징 API 연동 (필요 시 별도 페이지/모달로 확장) */}
    </section>
  );
}

/* ───────────────────────── 카드 4: 회원 탈퇴 ───────────────────────── */

function WithdrawCard() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    setIsSubmitting(true);
    try {
      await withdraw();
      clearAuth();
      toast.success('그동안 따숨과 함께해 주셔서 감사했어요.');
      navigate('/', { replace: true });
    } catch {
      toast.error('탈퇴 처리 중 문제가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-destructive">
        <Trash2 size={19} /> 회원 탈퇴
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        탈퇴 시 서비스 이용 기록이 비활성화되며, 동일 이메일로는 재가입이 제한돼요.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="rounded-xl border border-destructive/40 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white">
            회원 탈퇴하기
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 탈퇴하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없으며, 즉시 로그아웃됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} disabled={isSubmitting}>
              {isSubmitting ? '처리 중…' : '탈퇴하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}