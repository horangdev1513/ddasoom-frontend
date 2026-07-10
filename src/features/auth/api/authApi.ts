import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';
import type { Role } from '@/shared/types/role';
import type { AuthSessionResult } from '@/shared/api/reissue';

// features/auth 도메인 API 모듈.
// ⭐ 이 파일은 다른 팀원이 각자 도메인의 {도메인}Api.ts 를 작성할 때 따라할 "실제 동작 예시"다.
//    - 백엔드 auth/controller/AuthController.java 에 이미 구현된 3개 엔드포인트를 연동한다.
//    - 공통 규약: 모든 응답은 ApiResponse<T> 래퍼로 오므로 res.data.data 로 페이로드를 꺼낸다.
//    - 네이밍: API 모듈은 {도메인}Api.ts. 함수명은 동작을 드러내는 동사로.

// ── 요청/응답 타입 (백엔드 DTO와 필드명 1:1) ────────────────────────────────

// 요청: auth/dto/request/AuthCodeSendRequest.java — email(단일 필드)
export interface SendEmailAuthCodePayload {
  email: string;
}

// 요청: auth/dto/request/AuthCodeVerifyRequest.java — email, code(6자리 숫자 문자열)
export interface VerifyEmailAuthCodePayload {
  email: string;
  code: string;
}

// 요청: auth/dto/request/SignupRequest.java — email, password, name, nickname, tel
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  nickname: string;
  tel: string;
}

// 요청: auth/dto/request/LoginRequest.java — email, password
export interface LoginPayload {
  email: string;
  password: string;
}

// 응답: auth/dto/response/SignupResponse.java — memberId(Long), email, nickname, role(Role enum)
export interface SignupResult {
  memberId: number; // 백엔드 Long → TS number
  email: string;
  nickname: string;
  role: Role;
}

// 응답 타입은 shared/api/reissue.ts 의 AuthSessionResult 재사용
// (백엔드가 LoginResponse.java 하나를 login/reissue 공용으로 쓰는 설계와 1:1 대응)
export type { AuthSessionResult as LoginResult } from '@/shared/api/reissue';

// ── API 함수 ────────────────────────────────────────────────────────────────

/**
 * 이메일 인증 코드 발송(재발송 겸용).
 * 백엔드: POST /api/auth/email/send — AuthController.sendAuthCode
 * 요청: AuthCodeSendRequest.java / 응답: ApiResponse<Void> (data === null, 성공 메시지만)
 */
export async function sendEmailAuthCode(payload: SendEmailAuthCodePayload): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>('/auth/email/send', payload);
}

/**
 * 이메일 인증 코드 검증.
 * 백엔드: POST /api/auth/email/verify — AuthController.verifyAuthCode
 * 요청: AuthCodeVerifyRequest.java / 응답: ApiResponse<Void> (data === null)
 */
export async function verifyEmailAuthCode(payload: VerifyEmailAuthCodePayload): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>('/auth/email/verify', payload);
}

/**
 * 일반 회원가입.
 * 백엔드: POST /api/auth/signup — AuthController.signup (성공 시 201 CREATED)
 * 요청: SignupRequest.java / 응답: ApiResponse<SignupResponse.java>
 */
export async function signup(payload: SignupPayload): Promise<SignupResult> {
  const res = await axiosInstance.post<ApiResponse<SignupResult>>('/auth/signup', payload);
  // ApiResponse 래퍼에서 실제 페이로드를 꺼낸다. signup 성공 응답은 data가 반드시 존재.
  return res.data.data as SignupResult;
}

/**
 * 일반 로그인.
 * 백엔드: POST /api/auth/login — 실패는 전부 401 AUTH_101 (계정없음/비번틀림 구분 없음 — 페이지에서 단일 메시지 처리)
 * 성공 시 호출부에서 authStore.setAuth(result.accessToken, toAuthUser(result)) 로 저장한다.
 */
export async function login(payload: LoginPayload): Promise<AuthSessionResult> {
  const res = await axiosInstance.post<ApiResponse<AuthSessionResult>>('/auth/login', payload);
  return res.data.data as AuthSessionResult;
}

/**
 * 로그아웃.
 * 백엔드: POST /api/auth/logout — Authorization 헤더 필수(요청 인터셉터가 자동 첨부).
 * 성공 후 호출부에서 authStore.clearAuth() 실행. RT 쿠키 삭제는 서버가 수행한다.
 */
export async function logout(): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>('/auth/logout');
}

// ── 비밀번호 재설정 / 닉네임 중복 확인 ──────────────────────────────────────

/** 재설정 메일 발송 — 이메일 존재 여부와 무관하게 항상 성공 응답(보안 설계). 실패 분기 불필요 */
export async function requestPasswordReset(email: string): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>('/auth/password/reset-request', { email });
}

/** 토큰으로 비밀번호 재설정 — 만료/재사용 시 AUTH_108. 성공 시 로그인 페이지로 유도 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>('/auth/password/reset', { token, newPassword });
}

/** 닉네임 사용 가능 여부 — true = 사용 가능. 형식 검증(zod) 통과 후에만 호출할 것 */
export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const res = await axiosInstance.get<ApiResponse<boolean>>('/auth/nickname/available', {
    params: { nickname },
  });
  return res.data.data === true;
}