import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type { Role } from '@/shared/types/role';

// features/admin 도메인 API 모듈 — 관리자 전용 회원 관리.
// 백엔드: member/controller/AdminMemberController.java (/api/admin/members, hasRole(ADMIN))
// 작성 방식은 features/auth/api/authApi.ts 참고.

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 응답: member/dto/response/AdminMemberResponse.java — 목록 행
export interface AdminMemberListItem {
  memberId: number;
  email: string;
  nickname: string;
  role: Role;
  status: MemberStatus; // ACTIVE=정상 / HIDDEN=신고 제재 숨김 (백엔드 V12 — 탈퇴 여부와 별개 축)
  createdAt: string;
  deletedAt: string | null; // null = 활성, 값 있음 = 탈퇴 — 별도 status 필드 없음(프론트 파생 표시)
}

// 응답: member/dto/response/AdminMemberDetailResponse.java — 상세
export interface AdminMemberDetail {
  memberId: number;
  email: string;
  name: string;
  nickname: string;
  tel: string;
  role: Role;
  status: MemberStatus; // ACTIVE=정상 / HIDDEN=신고 제재 숨김 (백엔드 V12 — 탈퇴 여부와 별개 축)
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  socialProviders: string[]; // 예: ["KAKAO", "GOOGLE"]
  recentLoginLogs: AdminLoginLogItem[]; // 최근 5건 미리보기
}

// 응답: member/dto/response/LoginLogResponse.java (마이페이지와 동일 DTO 재사용)
export interface AdminLoginLogItem {
  loginLogId: number;
  loginType: string;
  loginAt: string;
}

// 목록 조회 쿼리 파라미터
export interface AdminMemberSearchParams {
  keyword?: string; // 이메일/닉네임 부분일치
  role?: Role;
  page?: number; // 0부터, 기본 0
  size?: number; // 기본 10
}

// ── API 함수 ────────────────────────────────────────────────────────────

/**
 * 회원 목록 — 백엔드: GET /api/admin/members
 * 탈퇴 회원도 포함된 전체 목록. 상태 표시는 deletedAt으로 프론트에서 파생.
 */
export async function getAdminMembers(params: AdminMemberSearchParams = {}): Promise<PageResponse<AdminMemberListItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<AdminMemberListItem>>>('/admin/members', {
    params: { page: 0, size: 10, ...params },
  });
  return res.data.data as PageResponse<AdminMemberListItem>;
}

/**
 * 회원 상세 — 백엔드: GET /api/admin/members/{memberId}
 * 탈퇴 회원도 조회 가능 (강제탈퇴 소명·복구 판단용).
 */
export async function getAdminMemberDetail(memberId: number): Promise<AdminMemberDetail> {
  const res = await axiosInstance.get<ApiResponse<AdminMemberDetail>>(`/admin/members/${memberId}`);
  return res.data.data as AdminMemberDetail;
}

/**
 * 회원 로그인 이력 전체 (페이징) — 백엔드: GET /api/admin/members/{memberId}/login-logs
 * 상세 화면의 "전체 보기" — 마이페이지 LoginLogsModal과 동일 페이징 양식 재사용 권장.
 */
export async function getAdminMemberLoginLogs(
  memberId: number,
  page = 0,
  size = 20,
): Promise<PageResponse<AdminLoginLogItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<AdminLoginLogItem>>>(
    `/admin/members/${memberId}/login-logs`,
    { params: { page, size } },
  );
  return res.data.data as PageResponse<AdminLoginLogItem>;
}

/**
 * 강제 탈퇴 — 백엔드: DELETE /api/admin/members/{memberId}
 * ⚠️ ADMIN 계정 대상 시 400 MEMBER_007 (자기 자신 포함 — 관리자는 강제탈퇴 불가).
 */
export async function forceWithdrawMember(memberId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(`/admin/members/${memberId}`);
}

/**
 * 계정 복구 — 백엔드: PATCH /api/admin/members/{memberId}/restore
 * ⚠️ 탈퇴 상태가 아닌 회원 대상 시 400 MEMBER_006.
 * soft delete + 유니크 제약 유지 정책 덕에 이메일/닉네임 충돌 없이 안전하게 복구됨.
 */
export async function restoreMember(memberId: number): Promise<AdminMemberListItem> {
  const res = await axiosInstance.patch<ApiResponse<AdminMemberListItem>>(`/admin/members/${memberId}/restore`);
  return res.data.data as AdminMemberListItem;
}

// 회원 노출 상태 — 백엔드 member/domain/MemberStatus.java와 1:1
export type MemberStatus = 'ACTIVE' | 'HIDDEN';

/**
 * 회원 노출 상태 변경 (신고 제재) — 백엔드: PATCH /api/admin/members/{memberId}/status
 * ⚠️ ADMIN 계정 대상 시 400 MEMBER_008 / 탈퇴 회원 대상 시 400 MEMBER_003 (백엔드가 차단).
 * 신고 확인 후 관리자가 "직접" 전환하는 수동 제재 — 자동 처리 없음 (팀 정책).
 */
export async function updateMemberStatus(memberId: number, status: MemberStatus): Promise<AdminMemberListItem> {
  const res = await axiosInstance.patch<ApiResponse<AdminMemberListItem>>(
    `/admin/members/${memberId}/status`, { status });
  return res.data.data as AdminMemberListItem;
}