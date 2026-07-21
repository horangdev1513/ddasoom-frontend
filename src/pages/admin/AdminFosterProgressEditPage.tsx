import { Link, Navigate, useParams } from 'react-router-dom';
import { HandHeart } from 'lucide-react';
import { useAdminFosterDetail } from '@/features/foster/hooks/useAdminFosterDetail';
import { AdminFosterEditForm } from '@/features/foster/components/AdminFosterEditForm';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { FosterStatus } from '@/features/foster/types';

function getDetailPath(fosterId: number, status: FosterStatus): string {
  const isProgressStatus =
    status === 'FOSTERING' ||
    status === 'EXTENDED' ||
    status === 'ENDED';

  return isProgressStatus
    ? `/admin/active-fosters/${fosterId}`
    : `/admin/fosters/${fosterId}`;
}

export function AdminFosterProgressEditPage() {
  const { fosterId: fosterIdParam } = useParams();
  const fosterId = Number(fosterIdParam);
  const validFosterId =
    Number.isSafeInteger(fosterId) && fosterId > 0 ? fosterId : null;

  const { data, isLoading, isError } = useAdminFosterDetail(validFosterId);

  if (validFosterId == null) {
    return (
      <div className="p-6">
        <p className="text-destructive">잘못된 임시보호 진행 경로입니다.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/active-fosters">목록으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          임시보호 진행 정보를 불러오지 못했습니다.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/active-fosters">목록으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const isProgressStatus =
    data.status === 'FOSTERING' ||
    data.status === 'EXTENDED' ||
    data.status === 'ENDED';

  if (!isProgressStatus) {
    return (
      <Navigate
        to={`/admin/fosters/${data.fosterId}/edit`}
        replace
      />
    );
  }

  if (data.deletedAt) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>수정할 수 없는 신청입니다.</AlertTitle>
          <AlertDescription>
            삭제된 임시보호 신청은 수정할 수 없습니다.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline" className="mt-6">
          <Link to={`/admin/active-fosters/${data.fosterId}`}>
            상세로 돌아가기
          </Link>
        </Button>
      </div>
    );
  }

  const isActiveFoster =
    data.status === 'FOSTERING' || data.status === 'EXTENDED';

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <HandHeart className="text-ring" size={24} />
          <h1 className="text-xl font-semibold">
            {isActiveFoster ? '임시보호 중단 처리' : '임시보호 종료 정보 수정'}
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {data.animalNickname} / 신청자 {data.userNickname}
        </p>
      </div>

      <AdminFosterEditForm
        key={data.fosterId}
        foster={data}
        getDetailPath={(status) => getDetailPath(data.fosterId, status)}
      />
    </div>
  );
}