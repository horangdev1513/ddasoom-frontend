import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';

// features/admin 도메인 API 모듈 — 관리자 FAQ 관리.
// 백엔드: support/controller/AdminFaqController.java (/api/admin/faqs, hasRole(ADMIN))
// ⚠️ Notice와 달리 목록은 페이징 없이 List 통째로 반환한다.

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 응답: support/dto/response/FaqSummaryResponse.java — 목록 행
export interface FaqListItem {
  faqId: number;
  category: string; // Enum value (예: "FOSTER")
  question: string;
  isVisible: boolean;
}

// 응답: support/dto/response/FaqResponse.java — 상세
export interface FaqDetail {
  faqId: number;
  category: string;
  question: string;
  answer: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

// 응답: 카테고리 옵션 (GET /api/faqs/categories) — 드롭다운 채우는 용도
export interface FaqCategoryOption {
  value: string; // Enum 상수명 (요청 시 이 값을 보낸다)
  label: string; // 화면 표시용 한글
}

// 요청: support/dto/request/FaqCreateRequest.java / FaqUpdateRequest.java
export interface FaqPayload {
  category: string;
  question: string;
  answer: string;
}

// ── API 함수 ────────────────────────────────────────────────────────────

/** 관리자 FAQ 목록 (노출여부 무관 전체, 카테고리순) — GET /api/admin/faqs */
export async function getAdminFaqs(): Promise<FaqListItem[]> {
  const res = await axiosInstance.get<ApiResponse<FaqListItem[]>>('/admin/faqs');
  return res.data.data as FaqListItem[];
}

/** 관리자 FAQ 상세 — GET /api/admin/faqs/{faqId} */
export async function getAdminFaq(faqId: number): Promise<FaqDetail> {
  const res = await axiosInstance.get<ApiResponse<FaqDetail>>(`/admin/faqs/${faqId}`);
  return res.data.data as FaqDetail;
}

/** FAQ 작성 — POST /api/admin/faqs */
export async function createFaq(payload: FaqPayload): Promise<FaqDetail> {
  const res = await axiosInstance.post<ApiResponse<FaqDetail>>('/admin/faqs', payload);
  return res.data.data as FaqDetail;
}

/** FAQ 수정 — PUT /api/admin/faqs/{faqId} */
export async function updateFaq(faqId: number, payload: FaqPayload): Promise<FaqDetail> {
  const res = await axiosInstance.put<ApiResponse<FaqDetail>>(`/admin/faqs/${faqId}`, payload);
  return res.data.data as FaqDetail;
}

/** 노출 여부 변경 — PATCH /api/admin/faqs/{faqId}/visibility?isVisible= */
export async function changeFaqVisibility(faqId: number, isVisible: boolean): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>(
    `/admin/faqs/${faqId}/visibility`,
    null,
    { params: { isVisible } },
  );
}

/** FAQ 삭제 (soft delete) — DELETE /api/admin/faqs/{faqId} */
export async function deleteFaq(faqId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(`/admin/faqs/${faqId}`);
}

/** 카테고리 옵션 목록 (공개 API) — GET /api/faqs/categories */
export async function getFaqCategories(): Promise<FaqCategoryOption[]> {
  const res = await axiosInstance.get<ApiResponse<FaqCategoryOption[]>>('/faqs/categories');
  return res.data.data as FaqCategoryOption[];
}
