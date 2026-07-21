import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';
import type { UploadedImage } from '@/shared/components/editor/editorImageApi';

// features/support 도메인 API 모듈 — 유저용 FAQ 열람(읽기 전용).
// 백엔드: support/controller/FaqController.java (/api/faqs, 공개 API)

// ── 타입 (백엔드 DTO와 1:1) ──────────────────────────────────────────────

// 응답: support/dto/response/FaqSummaryResponse.java — 목록 행 (answer 없음)
export interface FaqListItem {
  faqId: number;
  category: string; // Enum value (예: "FOSTER")
  question: string;
  isVisible: boolean;
}

// 응답: support/dto/response/FaqResponse.java — 상세 (answer 포함)
export interface FaqDetail {
  faqId: number;
  category: string;
  question: string;
  answer: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  // 첨부 이미지 — { imageId, url, isThumbnail } 형태(shared UploadedImage와 동일).
  // ⚠️ url은 Presigned(30분 유효)라 상세 진입마다 최신 조회로 받는다(useFaq staleTime 0).
  images: UploadedImage[];
}

// 응답: 카테고리 옵션 (GET /api/faqs/categories) — 필터/태그 표시용
export interface FaqCategoryOption {
  value: string; // Enum 상수명
  label: string; // 화면 표시용 한글
}

// ── API 함수 ────────────────────────────────────────────────────────────

/** 유저 FAQ 목록 (노출 + 미삭제만, 카테고리순) — GET /api/faqs */
export async function getFaqs(): Promise<FaqListItem[]> {
  const res = await axiosInstance.get<ApiResponse<FaqListItem[]>>('/faqs');
  return res.data.data as FaqListItem[];
}

/** 유저 FAQ 상세 — GET /api/faqs/{faqId} */
export async function getFaq(faqId: number): Promise<FaqDetail> {
  const res = await axiosInstance.get<ApiResponse<FaqDetail>>(`/faqs/${faqId}`);
  return res.data.data as FaqDetail;
}

/** 카테고리 옵션 목록 — GET /api/faqs/categories */
export async function getFaqCategories(): Promise<FaqCategoryOption[]> {
  const res = await axiosInstance.get<ApiResponse<FaqCategoryOption[]>>('/faqs/categories');
  return res.data.data as FaqCategoryOption[];
}
