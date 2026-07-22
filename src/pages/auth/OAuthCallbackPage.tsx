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

// ⚠️ 에러 문구 매핑은 이 페이지가 하지 않는다 — 모든 실패를 /login?error=코드 로 넘겨
//    LoginPage의 LOGIN_ERROR_MESSAGES가 배너로 안내한다(문구 관리처 단일화).
//    이 페이지에 문구 상수를 두면 실제로 쓰이지 않는 죽은 코드가 된다.

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
      // 차단성 에러는 토스트(전환 중 유실 위험) 대신 로그인 페이지 배너로 — 쿼리로 코드만 전달
      navigate(`/login?error=${errorCode}`, { replace: true });
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
        // LoginPage는 state가 아니라 쿼리(?error=)만 읽는다 — state로 넘기면 문구가 조용히 유실된다.
        // 매핑에 없는 코드라 LoginPage의 기본 문구가 표시된다.
        navigate('/login?error=OAUTH_FAILED', { replace: true });
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