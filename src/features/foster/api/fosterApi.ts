import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type {
  FosterCreatePayload,
  FosterListParams,
  FosterPendingApplication,
  FosterUpdatePayload,
  FosterUserDetail,
  FosterUserListItem,
} from '@/features/foster/types';

export async function getMyFosters(
  params: FosterListParams = {},
): Promise<PageResponse<FosterUserListItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<FosterUserListItem>>>(
    '/fosters/my',
    {
      params: { page: 0, size: 10, ...params },
    },
  );

  return res.data.data as PageResponse<FosterUserListItem>;
}

export async function getMyPendingFosterApplication(
  animalId: number,
): Promise<FosterPendingApplication> {
  const res = await axiosInstance.get<ApiResponse<FosterPendingApplication>>(
    '/fosters/my/pending',
    {
      params: { animalId },
    },
  );

  return res.data.data as FosterPendingApplication;
}

export async function getMyFosterDetail(fosterId: number): Promise<FosterUserDetail> {
  const res = await axiosInstance.get<ApiResponse<FosterUserDetail>>(
    `/fosters/${fosterId}`,
  );

  return res.data.data as FosterUserDetail;
}

export async function createFoster(payload: FosterCreatePayload): Promise<void> {
  await axiosInstance.post<ApiResponse<null>>('/fosters', payload);
}

export async function updateMyFoster(
  fosterId: number,
  payload: FosterUpdatePayload,
): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>(`/fosters/${fosterId}`, payload);
}

export async function deleteMyFoster(fosterId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(`/fosters/${fosterId}`);
}