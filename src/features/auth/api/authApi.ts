import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';
import type { Role } from '@/shared/types/role';

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

// 응답: auth/dto/response/SignupResponse.java — memberId(Long), email, nickname, role(Role enum)
export interface SignupResult {
  memberId: number; // 백엔드 Long → TS number
  email: string;
  nickname: string;
  role: Role;
}

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

// ── 미구현(백엔드 DTO 미확정) ────────────────────────────────────────────────
// 아래 login/reissue/logout 은 백엔드 auth/dto/request/LoginRequest.java,
// response/LoginResponse.java 가 현재 "필드 없는 빈 클래스"라 실제 타입을 확정할 수 없어 보류한다.
// (reissue 응답의 AT 필드명, 로그인 응답의 사용자 정보 스펙 세부가 아직 미확정)
//
// TODO: 백엔드 LoginRequest/LoginResponse 필드 확정 후 구현
// export async function login(payload: LoginPayload): Promise<LoginResult> {
//   const res = await axiosInstance.post<ApiResponse<LoginResult>>('/auth/login', payload);
//   return res.data.data as LoginResult;
// }
//
// TODO: 백엔드 POST /api/auth/reissue 확정 후 구현 (single-flight 는 shared/api/reissue.ts 에서 관리)
// export async function reissue(): Promise<{ accessToken: string; user: AuthUser }> { ... }
//
// TODO: 백엔드 POST /api/auth/logout 확정 후 구현 (Authorization 헤더 필수)
// export async function logout(): Promise<void> {
//   await axiosInstance.post<ApiResponse<null>>('/auth/logout');
// }
