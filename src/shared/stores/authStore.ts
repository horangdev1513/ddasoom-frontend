import { create } from 'zustand';
import type { Role } from '@/shared/types/role';

// 인증 상태 전역 스토어.
// ⚠️ Refresh Token 관련 필드/로직 일체 금지(httpOnly 쿠키로 브라우저가 관리), AT를 localStorage/sessionStorage에 백업 금지(XSS 방어).
//    authStore가 보관하는 것은 accessToken / user / isAuthReady 뿐.

// 로그인 사용자 정보. 백엔드 스펙 방향 확정: { memberId, nickname, role }
export interface AuthUser {
  memberId: number;
  nickname: string;
  role: Role;
}

interface AuthState {
  // Access Token — 전역 상태 변수로만 보관(zustand). getState()로 axios 인터셉터에서 접근한다.
  accessToken: string | null;
  // 인증 상태 판단은 오직 user(및 role)로만. JWT를 직접 디코딩하지 않는다.
  user: AuthUser | null;
  // 부트스트랩(reissue 1회 호출) 완료 여부. true 이전에는 라우트 가드 판단을 금지한다(로그인 유저가 새로고침마다 튕기는 버그 방지).
  isAuthReady: boolean;

  // 로그인/reissue 성공 시 AT + user 세팅
  setAuth: (accessToken: string, user: AuthUser) => void;
  // AT만 갱신(single-flight 재발급 성공 시 원 요청 재시도 전에 사용)
  setAccessToken: (accessToken: string) => void;
  // 부트스트랩 완료 표시
  setAuthReady: (ready: boolean) => void;
  // 로그아웃/재발급 실패 시 초기화 (isAuthReady는 유지 — 이미 부팅은 끝났으므로)
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthReady: false,

  setAuth: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
