import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';

// 관리자 대시보드 API — 백엔드: dashboard/controller/DashboardController.java (/api/admin/dashboard)
// 대시보드·통계는 전 도메인 데이터를 집계하는 특성상 지훈 전담 (팀 결정).

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 백엔드 foster/domain/FosterStatus.java와 1:1
export type FosterStatus = 'PENDING' | 'REJECTED' | 'FOSTERING' | 'EXTENDED' | 'ENDED';

// 응답: dashboard/dto/PendingSummaryResponse.java
export interface PendingSummary {
  reviewPending: number;    // 심사대기 (foster PENDING)
  expiringUrgent: number;   // 만료 긴급 (D-0 ~ D-7)
  expiringUpcoming: number; // 만료 예정 (D-8 ~ D-30) — 긴급과 배타 구간
  qnaPending: number;       // 답변대기 QnA
}

// 응답: dashboard/dto/FosterStatusCountResponse.java — 항상 5종 전부 내려옴 (0건 포함)
export interface FosterStatusCount {
  status: FosterStatus;
  count: number;
}

// 응답: dashboard/dto/NewMemberCountResponse.java
export interface NewMemberCount {
  todayCount: number;
}

// ── API 함수 ────────────────────────────────────────────────────────────

/** 처리대기 그룹 — 백엔드: GET /api/admin/dashboard/pending-summary */
export async function getPendingSummary(): Promise<PendingSummary> {
  const res = await axiosInstance.get<ApiResponse<PendingSummary>>('/admin/dashboard/pending-summary');
  return res.data.data as PendingSummary;
}

/** 임보 상태 5종 분포 — 백엔드: GET /api/admin/dashboard/fosters/status-distribution */
export async function getFosterStatusDistribution(): Promise<FosterStatusCount[]> {
  const res = await axiosInstance.get<ApiResponse<FosterStatusCount[]>>(
    '/admin/dashboard/fosters/status-distribution');
  return res.data.data as FosterStatusCount[];
}

/** 금일 신규 가입자 — 백엔드: GET /api/admin/dashboard/members/new-today */
export async function getTodayNewMembers(): Promise<NewMemberCount> {
  const res = await axiosInstance.get<ApiResponse<NewMemberCount>>('/admin/dashboard/members/new-today');
  return res.data.data as NewMemberCount;
}