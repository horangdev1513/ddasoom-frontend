import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@/features/report/api/reportApi';

// features/admin 도메인 API 모듈 — 관리자 신고 처리 (/api/admin/reports, hasRole(ADMIN)).
// 대상/사유/상태 enum은 유저용과 동일하므로 features/report/api/reportApi.ts를 재사용한다
// (중복 타입 정의 금지 — features/admin/api/qnaApi.ts가 features/qna/types를 쓰는 것과 같은 방식).

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

/** 응답: 목록 행 — ReportSummaryResponse */
export interface ReportSummaryResponse {
  reportId: number;
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  status: ReportStatus;
  reporterNickname: string;
  createdAt: string;
  // ⭐ 추가 — 목록에서 피신고자/대상 식별용. 스냅샷 이전 신고는 null (폴백 필수)
  reportedNickname: string | null;
  targetTitle: string | null; // 회원 신고면 닉네임 스냅샷
}

/** 응답: 상세 — ReportDetailResponse (목록 필드 + 처리 이력·누적 건수) */
export interface ReportDetailResponse extends ReportSummaryResponse {
  content: string | null; // ETC가 아니면 null
  processorNickname: string | null; // 미처리 시 null (필드 자체는 항상 내려온다)
  processedAt: string | null;
  targetReportCount: number; // 이 대상이 지금까지 신고당한 누적 건수 — 제재 판단 근거 (정책 변경: 반려 제외)
  // ⭐ 추가 — 대상 스냅샷 + 피신고자 정보. 스냅샷 도입 이전 신고는 아래가 전부 null/기본값이라 렌더 폴백 필수
  targetParentId: number | null; // 댓글 신고일 때만 채워짐 — 원 게시글 PK
  targetSnippet: string | null; // 본문 발췌(최대 200자, 평문). 회원 신고면 null
  reportedMemberId: number | null; // 피신고자 PK
  reportedMemberWithdrawn: boolean; // 피신고자가 이미 탈퇴했는지
  reportedMemberReportCount: number; // 이 "회원"이 받은 누적 신고 수 (반려 제외)
}

/** 목록 검색 파라미터 — status/targetType은 미지정 시 전체 */
export interface AdminReportSearchParams {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  size?: number;
  // ⭐ 추가 — 지정 시 해당 회원이 "받은" 신고만 반환. 이때 status/targetType 필터는 서버가 무시한다
  reportedMemberId?: number;
}

// ── API 함수 ─────────────────────────────────────────────────────────────

/** 신고 목록 — GET /api/admin/reports */
export async function getAdminReports(
  params: AdminReportSearchParams = {},
): Promise<PageResponse<ReportSummaryResponse>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<ReportSummaryResponse>>>(
    '/admin/reports',
    { params: { page: 0, size: 10, ...params } },
  );
  return res.data.data as PageResponse<ReportSummaryResponse>;
}

/** 신고 상세 — GET /api/admin/reports/{reportId} */
export async function getAdminReport(reportId: number): Promise<ReportDetailResponse> {
  const res = await axiosInstance.get<ApiResponse<ReportDetailResponse>>(
    `/admin/reports/${reportId}`,
  );
  return res.data.data as ReportDetailResponse;
}

/**
 * 신고 승인 — PATCH /api/admin/reports/{reportId}/approve
 * 승인과 동시에 대상이 숨김 처리된다(회원 신고면 강제 탈퇴).
 * TODO: 응답 data 스펙 미확인 — 현재는 무시하고 상세를 재조회한다.
 */
export async function approveReport(reportId: number): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>(`/admin/reports/${reportId}/approve`);
}

/** 신고 반려 — PATCH /api/admin/reports/{reportId}/reject */
export async function rejectReport(reportId: number): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>(`/admin/reports/${reportId}/reject`);
}

// ── 링크 조합 ──────────────────────────────────────────────────────────────

/**
 * ⭐ 추가 — 신고 대상의 원문(관리자 화면) 경로를 조합한다. 백엔드는 URL을 내려주지 않으므로
 * targetType + targetId + targetParentId로 프론트가 만든다. (단일 사용처 — shared로 승격하지 않음)
 * - 승인된 신고는 원글이 soft delete되어 공개 상세는 404가 나므로, 삭제 글도 조회되는 관리자 상세로 보낸다.
 * - POST_COMMENT는 원 게시글(targetParentId)로 이동 + #comment-{targetId} 해시. 관리자 상세 댓글은
 *   별도 페이징 API라 앵커가 동작하지 않을 수 있으나 허용한다(어떤 댓글인지는 targetSnippet으로 식별).
 * - POST_COMMENT인데 targetParentId가 null이면 링크를 만들 수 없어 null 반환(호출부는 버튼 미노출).
 */
export function buildReportTargetLink(report: {
  targetType: ReportTargetType;
  targetId: number;
  targetParentId: number | null;
}): string | null {
  switch (report.targetType) {
    case 'POST':
      return `/admin/posts/${report.targetId}`;
    case 'POST_COMMENT':
      return report.targetParentId != null
        ? `/admin/posts/${report.targetParentId}#comment-${report.targetId}`
        : null;
    case 'MEMBER':
      return `/admin/members/${report.targetId}`;
  }
}
