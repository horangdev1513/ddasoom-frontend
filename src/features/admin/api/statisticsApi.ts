import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';
import type { FosterStatus } from '@/features/admin/api/dashboardApi';

// 관리자 통계 API — 백엔드: statistics/controller/StatisticsController.java (/api/admin/statistics)
// 통계 = "왜 이런 흐름인가" (기간 기반 추세). 현재 스냅샷은 대시보드(dashboardApi) 담당.

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

export type AnimalKind = 'D' | 'C'; // D=개, C=고양이 — 한글 라벨은 프론트 변환

// 응답: statistics/dto/FosterMonthlyTrendResponse.java — 1~12월 12포인트 고정(0건 포함)
export interface FosterMonthlyTrend {
  year: number;
  points: { month: number; count: number }[];
}

// 응답: FosterApprovalRateResponse — 대기 제외 분모. approvalRate: 0~100(%), 분모 0이면 0.0
export interface FosterApprovalRate {
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
}

// 응답: FosterAvgDurationResponse — sampleCount 0이면 "데이터 없음" 표시 근거
export interface FosterAvgDuration {
  averageDays: number;
  sampleCount: number;
}

// 응답: AnimalKindRatioResponse — 항상 2개(0건 종 포함)
export interface AnimalKindCount {
  kind: AnimalKind;
  count: number;
}

// 응답: AnimalRegionCountResponse — 건수 내림차순
export interface AnimalRegionCount {
  region: string;
  count: number;
}

// 응답: TopFosterAnimalResponse — 순위는 배열 index로 표시
export interface TopFosterAnimal {
  animalId: number;
  nickname: string;
  abandonmentId: string;
  kind: AnimalKind;
  typeName: string;
  imageUrl: string | null;
  fosterCount: number;
}

// 응답: MemberSignupTrendResponse — 기존 백엔드 API (offset: 0=최근 7일, 1=그 직전 7일…)
// ⚠️ 백엔드 TrendPoint.date 는 LocalDate → Jackson이 [year, month, day] 배열로 직렬화한다.
//    (문자열 'yyyy-MM-dd'가 아님 — 프론트에서 배열을 그대로 받아 라벨로 변환)
export type LocalDateTuple = [number, number, number];

export interface MemberSignupTrend {
  unit: string;
  offset: number;
  windowStart: string;
  windowEnd: string;
  points: { date: LocalDateTuple; count: number }[];
}

// ── API 함수 ────────────────────────────────────────────────────────────

/** 월별 임보 신청 추이 — GET /api/admin/statistics/fosters/monthly?year= (미지정 시 올해) */
export async function getFosterMonthlyTrend(year?: number): Promise<FosterMonthlyTrend> {
  const res = await axiosInstance.get<ApiResponse<FosterMonthlyTrend>>(
    '/admin/statistics/fosters/monthly', { params: year ? { year } : {} });
  return res.data.data as FosterMonthlyTrend;
}

/** 임보 승인율 — GET /api/admin/statistics/fosters/approval-rate */
export async function getFosterApprovalRate(): Promise<FosterApprovalRate> {
  const res = await axiosInstance.get<ApiResponse<FosterApprovalRate>>(
    '/admin/statistics/fosters/approval-rate');
  return res.data.data as FosterApprovalRate;
}

/** 평균 임보 지속기간 — GET /api/admin/statistics/fosters/avg-duration */
export async function getFosterAvgDuration(): Promise<FosterAvgDuration> {
  const res = await axiosInstance.get<ApiResponse<FosterAvgDuration>>(
    '/admin/statistics/fosters/avg-duration');
  return res.data.data as FosterAvgDuration;
}

/** 종별(개/고양이) 비율 — GET /api/admin/statistics/animals/kind-ratio */
export async function getAnimalKindRatio(): Promise<AnimalKindCount[]> {
  const res = await axiosInstance.get<ApiResponse<AnimalKindCount[]>>(
    '/admin/statistics/animals/kind-ratio');
  return res.data.data as AnimalKindCount[];
}

/** 보호지역 시/도별 분포 — GET /api/admin/statistics/animals/region-distribution */
export async function getAnimalRegionDistribution(): Promise<AnimalRegionCount[]> {
  const res = await axiosInstance.get<ApiResponse<AnimalRegionCount[]>>(
    '/admin/statistics/animals/region-distribution');
  return res.data.data as AnimalRegionCount[];
}

/** 임보 신청 TOP10 — GET /api/admin/statistics/fosters/top-animals */
export async function getTopFosterAnimals(): Promise<TopFosterAnimal[]> {
  const res = await axiosInstance.get<ApiResponse<TopFosterAnimal[]>>(
    '/admin/statistics/fosters/top-animals');
  return res.data.data as TopFosterAnimal[];
}

/** 일별 가입자 추이 (7일 창) — GET /api/admin/statistics/members/signup/daily?offset= */
export async function getSignupDailyTrend(offset = 0): Promise<MemberSignupTrend> {
  const res = await axiosInstance.get<ApiResponse<MemberSignupTrend>>(
    '/admin/statistics/members/signup/daily', { params: { offset } });
  return res.data.data as MemberSignupTrend;
}