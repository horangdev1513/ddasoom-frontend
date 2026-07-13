import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type { Role } from '@/shared/types/role';

// features/mypage 도메인 API 모듈. 작성 방식은 features/auth/api/authApi.ts 참고.

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 응답: member/dto/response/MemberResponse.java
export interface MemberInfo {
  memberId: number;
  email: string;
  name: string;
  nickname: string;
  tel: string;
  role: Role;
}

// 요청: member/dto/request/MemberUpdateRequest.java — name, nickname, tel
export interface UpdateProfilePayload {
  name: string;
  nickname: string;
  tel: string;
}

// 요청: member/dto/request/PasswordChangeRequest.java
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// 응답: member/dto/response/LoginLogResponse.java (관리자 API와 동일 DTO 재사용)
export interface LoginLogItem {
  loginLogId: number;
  loginType: string;
  loginAt: string;
}

// ── API 함수 ────────────────────────────────────────────────────────────

/** 내 정보 조회 — 백엔드: GET /api/members/me */
export async function getMyInfo(): Promise<MemberInfo> {
  const res = await axiosInstance.get<ApiResponse<MemberInfo>>('/members/me');
  return res.data.data as MemberInfo;
}

/** 내 정보 수정 (이름/닉네임/전화번호) — 백엔드: PATCH /api/members/me */
export async function updateProfile(payload: UpdateProfilePayload): Promise<MemberInfo> {
  const res = await axiosInstance.patch<ApiResponse<MemberInfo>>('/members/me', payload);
  return res.data.data as MemberInfo;
}

/**
 * 비밀번호 변경 — 백엔드: PATCH /api/members/me/password
 * 성공 시 서버가 전 세션을 무효화한다 — 호출부에서 authStore.clearAuth() 후 재로그인 유도 필요.
 */
export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>('/members/me/password', payload);
}

/** 회원 탈퇴 — 백엔드: DELETE /api/members/me. 성공 시 서버가 쿠키/세션 정리 완료 */
export async function withdraw(): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>('/members/me');
}

/** 내 로그인 이력 최근 5건 — 백엔드: GET /api/members/me/login-logs/recent */
export async function getMyRecentLoginLogs(): Promise<LoginLogItem[]> {
  const res = await axiosInstance.get<ApiResponse<LoginLogItem[]>>('/members/me/login-logs/recent');
  return res.data.data as LoginLogItem[];
}

/** 내 로그인 이력 전체 (페이징) — 백엔드: GET /api/members/me/login-logs */
export async function getMyLoginLogs(page: number, size: number): Promise<PageResponse<LoginLogItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<LoginLogItem>>>('/members/me/login-logs', {
    params: { page, size },
  });
  return res.data.data as PageResponse<LoginLogItem>;
}