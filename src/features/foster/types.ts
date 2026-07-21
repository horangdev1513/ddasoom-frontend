export type FosterStatus =
  | 'PENDING'
  | 'REJECTED'
  | 'FOSTERING'
  | 'EXTENDED'
  | 'ENDED';

export type FosterManagementScope = 'APPLICATION' | 'PROGRESS';

export interface FosterPendingApplication {
  hasPendingApplication: boolean;
}

export interface FosterUserListItem {
  fosterId: number;
  animalId: number;
  animalNickname: string;
  animalImageUrl: string | null;
  status: FosterStatus;
  createdAt: string;
}

export interface FosterUserDetail {
  fosterId: number;
  animalId: number;
  animalNickname: string;
  animalImageUrl: string | null;
  age: string;
  job: string;
  message: string | null;
  answer: string | null;
  status: FosterStatus;
  fosterNum: string;
  fosterStartAt: string | null;
  fosterEndAt: string | null;
  fosterExtendAt: string | null;
  fosterCompleteAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FosterListParams {
  status?: FosterStatus;
  page?: number;
  size?: number;
}

export interface FosterCreatePayload {
  animalId: number;
  age: string;
  job: string;
  message: string;
}

export interface FosterUpdatePayload {
  age: string;
  job: string;
  message: string;
}

export interface FosterAdminListItem {
  fosterId: number;
  animalId: number;
  animalNickname: string;
  animalImageUrl: string | null;
  userId: number;
  userNickname: string;
  reviewerId: number | null;
  reviewerNickname: string | null;
  status: FosterStatus;
  fosterStartAt: string | null;
  fosterEndAt: string | null;
  fosterExtendAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FosterAdminListParams {
  scope: FosterManagementScope;
  status?: FosterStatus;
  activeOnly?: boolean;
  includeDeleted?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface FosterAdminDetail {
  fosterId: number;
  fosterNum: string;
  animalId: number;
  animalNickname: string;
  animalImageUrl: string | null;
  userId: number;
  userEmail: string;
  userNickname: string;
  userTel: string;
  reviewerId: number | null;
  reviewerNickname: string | null;
  age: string;
  job: string;
  message: string | null;
  answer: string | null;
  status: FosterStatus;
  fosterStartAt: string | null;
  fosterEndAt: string | null;
  fosterExtendAt: string | null;
  fosterCompleteAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface FosterAdminUpdatePayload {
  answer: string;
  status: FosterStatus;
  fosterStartAt: string | null;
  fosterEndAt: string | null;
  fosterExtendAt: string | null;
  fosterCompleteAt: string | null;
}
