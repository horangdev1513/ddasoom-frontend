import axios from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';
import { reissueAccessToken } from '@/shared/api/reissue';

// 공용 axios 인스턴스.
// - withCredentials: true 고정 → Refresh Token httpOnly 쿠키 자동 동봉(필수).
// - baseURL: '/api' → dev 프록시(vite.config.ts)가 백엔드(8080)로 전달, same-origin 유지.
export const axiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// [요청 인터셉터] Access Token을 Authorization: Bearer 헤더로 첨부한다.
// authStore를 React 외부에서 getState()로 읽는다(zustand를 쓰는 이유).
axiosInstance.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// [응답 인터셉터] 401 → single-flight reissue → 원 요청 1회 재시도.
// reissue를 건너뛰는 3가지 경우:
//   1. 이미 재시도한 요청(_retry) — 무한 루프 방지, 재시도는 1회만
//   2. reissue 요청 자체의 401 — bare axios라 여기 안 오지만 방어적으로 명시
//   3. code === 'AUTH_101' (로그인 실패) — 토큰 만료가 아니라 자격증명 오류.
//      reissue해봤자 의미 없고, 로그인 페이지의 폼 에러 표시가 리다이렉트에 씹히는 버그를 막는다.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.code;

    // 403은 재시도로 풀리지 않는 최종 상태 — 재발급 흐름을 타지 않고 즉시 안내 화면으로.
    // shouldReissue 판별보다 먼저 처리해도 무방(401이 아니므로 그 분기와 겹치지 않음).
    //window.location.href를 쓴 이유 — 인터셉터는 React 컴포넌트 트리 바깥이라 useNavigate를 못 씁니다. 인증 관련 강제 이동에서 흔히 쓰는 방식입니다.
    if (status === 403) {
      window.location.href = '/forbidden';
      return Promise.reject(error);
    }

    const shouldReissue =
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/reissue') &&
      errorCode !== 'AUTH_101';

    if (!shouldReissue) {
      return Promise.reject(error);
    }

    originalRequest._retry = true; // 이 요청의 재시도는 1회로 제한

    try {
      const result = await reissueAccessToken(); // single-flight — 동시 401들이 하나의 재발급을 공유
      useAuthStore.getState().setAccessToken(result.accessToken);
      originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
      return axiosInstance(originalRequest); // 원 요청 재시도
    } catch {
      // 재발급 실패(AUTH_104 = RT 만료/불일치) → 일괄 로그아웃 (코드별 분기 금지 — 팀 방침)
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  },
);
