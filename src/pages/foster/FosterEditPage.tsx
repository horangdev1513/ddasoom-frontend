import { Link, useParams } from 'react-router-dom';
import { HandHeart } from 'lucide-react';
import { useFosterDetail } from '@/features/foster/hooks/useFosterDetail';
import { FosterEditForm } from '@/features/foster/components/FosterEditForm';
import { FosterStatusBadge } from '@/features/foster/components/FosterStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function FosterEditPage() {
  const { fosterId: fosterIdParam } = useParams();
  const fosterId = Number(fosterIdParam);
  const validFosterId = Number.isSafeInteger(fosterId) && fosterId > 0 ? fosterId : null;

  const { data, isLoading, isError } = useFosterDetail(validFosterId);

  if (validFosterId == null) {
    return (
      <section className="rounded-2xl border border-border bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">잘못된 수정 경로입니다.</h1>
        <Button asChild className="mt-6">
          <Link to="/mypage/fosters">신청 내역으로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-white p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-8 h-72 w-full" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-2xl border border-border bg-white p-8 text-center">
        <p className="text-base text-destructive">
          임시보호 신청 정보를 불러오지 못했습니다.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/mypage/fosters">신청 내역으로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  const canEdit = data.status === 'PENDING';

  if (!canEdit) {
    return (
      <section className="rounded-2xl border border-border bg-white p-8">
        <Alert variant="destructive">
          <AlertTitle>수정할 수 없는 신청입니다.</AlertTitle>
          <AlertDescription>
            신청 대기 상태에서만 수정할 수 있습니다.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link to={`/mypage/fosters/${data.fosterId}`}>상세로 돌아가기</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-8">
      <div className="mb-8 flex flex-col justify-between gap-3 border-b border-border pb-6 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <HandHeart className="text-ring" size={24} />
            <h1 className="text-2xl font-bold text-foreground">임시보호 신청 수정</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            신청 동물: {data.animalNickname}
          </p>
        </div>
        <FosterStatusBadge status={data.status} />
      </div>

      {data.status === 'REJECTED' && (
        <Alert className="mb-6">
          <AlertTitle>신청 거절 상태입니다.</AlertTitle>
          <AlertDescription>
            내용을 수정해도 현재 신청 상태는 자동으로 변경되지 않습니다.
          </AlertDescription>
        </Alert>
      )}

      <FosterEditForm key={data.fosterId} foster={data} />
    </section>
  );
}