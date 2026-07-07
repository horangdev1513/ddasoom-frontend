import axios from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';

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

// [응답 인터셉터] 401 → single-flight reissue → 원 요청 재시도 자리.
// TODO(백엔드 reissue API 확정 후): shared/api/reissue.ts 의 single-flight 함수를 호출해
//   - 성공: 새 AT를 authStore에 갱신 후 원 요청 재시도(1회 제한 플래그 필수)
//   - 실패: authStore 초기화 + /login 이동(코드별 분기 없이 일괄 로그아웃)
//   - reissue 자체의 401은 재진입 금지(무한 루프 방지)
// 백엔드 reissue 응답 필드·expiresIn 단위가 미확정이라 실제 로직은 아직 구현하지 않는다.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
