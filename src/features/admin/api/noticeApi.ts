import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';

// features/admin 도메인 API 모듈 — 관리자 공지사항 관리.
// 백엔드: support/controller/AdminNoticeController.java (/api/admin/notices, hasRole(ADMIN))

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 응답: support/dto/response/NoticeSummaryResponse.java — 목록 행
export interface NoticeListItem {
  noticeId: number;
  title: string;
  isVisible: boolean;
  isPinned: boolean;
  createdAt: string;
}

// 응답: support/dto/response/NoticeResponse.java — 상세
export interface NoticeDetail {
  noticeId: number;
  writerNickname: string;
  title: string;
  content: string;
  isVisible: boolean;
  pinOrder: number | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// 요청: support/dto/request/NoticeCreateRequest.java
// content는 HTML 문자열, imageIds는 본문 등장 순서(image_order) — 백엔드가 attach에 사용.
export interface NoticeCreatePayload {
  title: string;
  content: string;
  imageIds: number[];
}

// 요청: support/dto/request/NoticeUpdateRequest.java
// imageIds는 본문 전체 기준 최종 리스트 — 백엔드가 syncImages로 diff 처리.
export interface NoticeUpdatePayload {
  title: string;
  content: string;
  imageIds: number[];
}

// ── API 함수 ────────────────────────────────────────────────────────────

/** 관리자 공지 목록 (노출여부 무관 전체) — GET /api/admin/notices */
export async function getAdminNotices(
  params: { page?: number; size?: number } = {},
): Promise<PageResponse<NoticeListItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<NoticeListItem>>>('/admin/notices', {
    params: { page: 0, size: 10, ...params },
  });
  return res.data.data as PageResponse<NoticeListItem>;
}

/** 관리자 공지 상세 — GET /api/admin/notices/{noticeId} */
export async function getAdminNotice(noticeId: number): Promise<NoticeDetail> {
  const res = await axiosInstance.get<ApiResponse<NoticeDetail>>(`/admin/notices/${noticeId}`);
  return res.data.data as NoticeDetail;
}

/** 공지 작성 — POST /api/admin/notices */
export async function createNotice(payload: NoticeCreatePayload): Promise<NoticeDetail> {
  const res = await axiosInstance.post<ApiResponse<NoticeDetail>>('/admin/notices', payload);
  return res.data.data as NoticeDetail;
}

/** 공지 수정 — PUT /api/admin/notices/{noticeId} */
export async function updateNotice(noticeId: number, payload: NoticeUpdatePayload): Promise<NoticeDetail> {
  const res = await axiosInstance.put<ApiResponse<NoticeDetail>>(`/admin/notices/${noticeId}`, payload);
  return res.data.data as NoticeDetail;
}

/** 노출 여부 변경 — PATCH /api/admin/notices/{noticeId}/visibility?isVisible= */
export async function changeNoticeVisibility(noticeId: number, isVisible: boolean): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>(
    `/admin/notices/${noticeId}/visibility`,
    null,
    { params: { isVisible } },
  );
}

/** 공지 삭제 (soft delete) — DELETE /api/admin/notices/{noticeId} */
export async function deleteNotice(noticeId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(`/admin/notices/${noticeId}`);
}

/**
 * 고정 공지 순서 일괄 설정 — PATCH /api/admin/notices/pin-order
 * ⚠️ 전체 덮어쓰기: 보낸 배열 순서대로 pin_order=1,2,3… 부여, 배열에 없는 기존 고정글은
 * pin_order=NULL로 자동 해제됨. 따라서 항상 "고정되어야 할 전체 ID 배열"을 보내야 한다.
 */
export async function reorderPinnedNotices(noticeIds: number[]): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>('/admin/notices/pin-order', { noticeIds });
}