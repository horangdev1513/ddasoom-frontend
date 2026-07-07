import { axiosInstance } from '@/shared/api/axiosInstance';
import { useAuthStore } from '@/shared/stores/authStore';

// 앱 부팅 시(새로고침 포함) 서버에 물어봐서 인증 상태를 복원한다.
// RT는 httpOnly라 프론트가 "쿠키가 있나?"를 판단할 수 없으므로, 조건 없이 reissue를 1회 호출해 서버에 위임한다.
//   - 200 → 새 AT를 authStore에 저장 + user 세팅 후 로그인 상태로 렌더링
//   - 401 → 비로그인 확정(정상 케이스, 에러 로그/모니터링 금지)
//   - 완료 시 isAuthReady = true (이 전에는 라우트 가드 판단 금지)
export async function bootstrapAuth(): Promise<void> {
  try {
    // TODO(백엔드 reissue API 확정 후): 응답 바디의 새 AT(응답 필드명 미확정)와 user를
    //   authStore.setAuth(accessToken, user) 로 저장한다. 현재는 필드가 미확정이라 저장 로직 보류.
    await axiosInstance.post('/auth/reissue');
  } catch {
    // 백엔드 reissue 엔드포인트가 아직 없어 404/401/미구현으로 실패하는 것을 "비로그인 확정"으로 간주(정상 흐름).
    // 비로그인은 정상 케이스이므로 에러 로그/모니터링을 전송하지 않는다.
  } finally {
    // 성공/실패와 무관하게 부트스트랩 절차는 끝났으므로 가드 판단을 허용한다.
    useAuthStore.getState().setAuthReady(true);
  }
}
