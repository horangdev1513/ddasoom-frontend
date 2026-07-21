import { axiosInstance } from "@/shared/api/axiosInstance";
import type { ApiResponse } from "@/shared/types/api";

// features/admin — 유기동물 관리 (새싹3)
// 백엔드: animal/controller/AdminAnimalController.java (/api/admin/animals, ADMIN 전용)

/**
 * 공공데이터포털 유기동물 데이터를 DB에 수동 미러링(동기화). POST /api/admin/animals/sync
 * 전 페이지를 순회해 upsert하므로 수 분 걸릴 수 있다(동기 처리 — 완료 시 응답).
 * @returns 성공 메시지(토스트 표기용)
 */
export async function syncAnimals(): Promise<string> {
  const res = await axiosInstance.post<ApiResponse<null>>(
    "/admin/animals/sync",
  );
  return res.data.message;
}
