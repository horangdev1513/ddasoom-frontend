import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { toast } from 'sonner';
import { reissueAccessToken, toAuthUser } from '@/shared/api/reissue';
import { useAuthStore } from '@/shared/stores/authStore';

// 소셜 로그인 콜백 착지 페이지 — 백엔드 OAuth2 Success/FailureHandler의 리다이렉트 대상.
//   성공: RT 쿠키가 심어진 상태로 도착 → reissue 호출(= 부트스트랩과 동일 원리)로 AT 획득
//         → role이 GUEST(신규 소셜 가입)면 추가정보 입력으로, 아니면 홈으로
//   실패: ?error=AUTH_1xx 쿼리로 도착 → 코드별 안내 후 로그인 페이지로
// 흐름 상세: docs/SECURITY-FLOW.md 2번 [SNS 로그인]

// 백엔드 FailureHandler가 보내는 에러코드 → 사용자 안내 문구
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_106: '이미 해당 이메일로 가입된 계정이 있어요. 기존 계정으로 로그인해 주세요.',
  AUTH_107: '소셜 계정의 이메일 제공에 동의해 주세요.',
};
const DEFAULT_ERROR = '소셜 로그인에 실패했습니다. 다시 시도해 주세요.'; // AUTH_102(동의 취소 등) 포함

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  // StrictMode(개발 모드)의 effect 2회 실행으로 reissue가 중복 발사되는 것 방지.
  // single-flight가 어차피 흡수하지만, 토스트·navigate 중복까지 막으려면 가드가 필요하다.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // ── 실패 경로: FailureHandler가 error 쿼리를 실어 보냄 ──
    const errorCode = searchParams.get('error');
    if (errorCode) {
      toast.error(ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR);
      navigate('/login', { replace: true });
      return;
    }

    // ── 성공 경로: RT 쿠키로 AT 발급 ──
    (async () => {
      try {
        const result = await reissueAccessToken();
        setAuth(result.accessToken, toAuthUser(result));

        if (result.role === 'GUEST') {
          // 신규 소셜 가입 — 추가정보 입력으로 (닉네임이 아직 null이라 환영 문구에 못 씀)
          toast.info('가입을 완료하려면 추가 정보를 입력해 주세요.');
          navigate('/signup/social', { replace: true });
        } else {
          toast.success(`${result.nickname}님, 환영합니다!`);
          navigate('/', { replace: true });
        }
      } catch {
        // 쿠키 없이 직접 URL 진입했거나 RT가 이미 무효인 경우
        toast.error(DEFAULT_ERROR);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, searchParams, setAuth]);

  // 처리 중 잠깐 보이는 화면 — 로그인 진행감만 전달
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-secondary">
      <div className="flex h-14 w-14 animate-bounce items-center justify-center rounded-full bg-primary">
        <PawPrint size={26} className="text-white" />
      </div>
      <p className="text-base text-muted-foreground">로그인 처리 중이에요…</p>
    </div>
  );
}