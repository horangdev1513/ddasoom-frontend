import { axiosInstance } from '@/shared/api/axiosInstance';
import type { ApiResponse, PageResponse } from '@/shared/types/api';
import type {
  FosterAdminDetail,
  FosterAdminListItem,
  FosterAdminListParams,
  FosterAdminUpdatePayload,
} from '@/features/foster/types';

export async function getAdminFosters(
  params: FosterAdminListParams,
): Promise<PageResponse<FosterAdminListItem>> {
  const res = await axiosInstance.get<ApiResponse<PageResponse<FosterAdminListItem>>>(
    '/admin/fosters',
    {
      params: {
        page: 0,
        size: 20,
        includeDeleted: false,
        ...params,
      },
    },
  );

  return res.data.data as PageResponse<FosterAdminListItem>;
}

export async function getAdminFosterDetail(
  fosterId: number,
): Promise<FosterAdminDetail> {
  const res = await axiosInstance.get<ApiResponse<FosterAdminDetail>>(
    `/admin/fosters/${fosterId}`,
  );

  return res.data.data as FosterAdminDetail;
}

export async function updateAdminFoster(
  fosterId: number,
  payload: FosterAdminUpdatePayload,
): Promise<void> {
  await axiosInstance.patch<ApiResponse<null>>(
    `/admin/fosters/${fosterId}`,
    payload,
  );
}

export async function deleteAdminFoster(fosterId: number): Promise<void> {
  await axiosInstance.delete<ApiResponse<null>>(`/admin/fosters/${fosterId}`);
}