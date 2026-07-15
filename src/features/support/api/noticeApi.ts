import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';

// features/support 도메인 API 모듈 — 유저용 공지사항 열람(읽기 전용).
// 백엔드: support/controller/NoticeController.java (/api/notices, 공개 API)

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

// ── API 함수 ────────────────────────────────────────────────────────────

/** 유저 공지 목록 (노출 + 미삭제만) — GET /api/notices */
export async function getNotices(
  params: { page?: number; size?: number } = {},
): Promise<PageResponse<NoticeListItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<NoticeListItem>>>('/notices', {
    params: { page: 0, size: 10, ...params },
  });
  return res.data.data as PageResponse<NoticeListItem>;
}

/** 유저 공지 상세 — GET /api/notices/{noticeId} */
export async function getNotice(noticeId: number): Promise<NoticeDetail> {
  const res = await axiosInstance.get<ApiResponse<NoticeDetail>>(`/notices/${noticeId}`);
  return res.data.data as NoticeDetail;
}
