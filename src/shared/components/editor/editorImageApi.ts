import axios from 'axios';
import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api';
import { MAX_IMAGES, type OwnerType } from './editorConstants';

// 에디터 이미지 업로드 API 모듈.
// 백엔드: POST /api/images (multipart) — public MinIO 버킷에 저장, 영구 정적 URL 반환.
// axiosInstance.baseURL='/api'이므로 경로는 '/images'.

// 응답 data — 백엔드: 이미지 업로드 응답 DTO
export interface UploadedImage {
  imageId: number;
  url: string; // MinIO public 영구 URL (만료 없음, 본문에 그대로 삽입 가능)
  isThumbnail: boolean;
}

// 업로드 실패를 백엔드 에러 코드(IMAGE_001~006 등)와 함께 전달하는 에러 타입.
// 호출부(파이프라인/토스트)가 code로 분기할 수 있게 한다.
export class ImageUploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'ImageUploadError';
    this.code = code;
  }
}

// 서버 이미지 에러코드 → 사용자 안내 문구 매핑(단일 소스).
// 백엔드 ImageErrorCode와 동기화 — 코드/문구 추가·변경 시 백엔드와 함께 갱신할 것.
//  IMAGE_003의 장수는 MAX_IMAGES(editorConstants)와 항상 일치하도록 상수를 참조한다.
export const IMAGE_ERROR_MESSAGES: Record<string, string> = {
  IMAGE_001: '지원하지 않는 형식입니다. jpg, png, gif, webp만 가능합니다.',
  IMAGE_002: '이미지 용량은 10MB 이하만 가능합니다.',
  IMAGE_003: `이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`,
  IMAGE_004: '이미지를 찾을 수 없습니다. 다시 시도해주세요.',
  IMAGE_006: '이미지 소유자가 일치하지 않습니다.',
};

// 미매핑/미상 코드가 수렴하는 기본 문구.
export const DEFAULT_IMAGE_ERROR_MESSAGE = '이미지 업로드에 실패했습니다. 다시 시도해주세요.';

// 에러코드를 사용자 안내 문구로 변환한다. code가 없거나 매핑에 없으면 기본 문구.
export function getImageErrorMessage(code?: string): string {
  return (code && IMAGE_ERROR_MESSAGES[code]) || DEFAULT_IMAGE_ERROR_MESSAGE;
}

/**
 * 이미지 업로드 — 백엔드: POST /api/images
 * 성공 판별 기준은 HTTP 상태가 아니라 code === 'SUCCESS' 하나다.
 * 실패 시 백엔드 에러 코드를 담아 ImageUploadError를 던진다.
 */
export async function uploadImage(file: File, ownerType: OwnerType): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ownerType', ownerType);

  try {
    const res = await axiosInstance.post<ApiResponse<UploadedImage>>('/images', formData);
    if (res.data.code !== 'SUCCESS' || !res.data.data) {
      throw new ImageUploadError(res.data.code, res.data.message);
    }
    return res.data.data;
  } catch (err) {
    if (err instanceof ImageUploadError) throw err;
    // 4xx 응답(IMAGE_001 형식/IMAGE_002 용량/IMAGE_006 소유자 등) → 에러 코드 정규화
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as ApiResponse<null> | undefined;
      if (data?.code) throw new ImageUploadError(data.code, data.message);
    }
    throw err; // 네트워크 오류 등 code를 알 수 없는 경우
  }
}
