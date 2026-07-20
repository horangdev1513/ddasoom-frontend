import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HandHeart, PawPrint } from 'lucide-react';
import { useFosterDetail } from '@/features/foster/hooks/useFosterDetail';
import { useDeleteFoster } from '@/features/foster/hooks/useDeleteFoster';
import { FosterStatusBadge } from '@/features/foster/components/FosterStatusBadge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

function formatDateTime(iso: string): string {
  const date = new Date(iso);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-base text-foreground">{value}</dd>
    </div>
  );
}

export function FosterDetailPage() {
  const navigate = useNavigate();
  const { fosterId: fosterIdParam } = useParams();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fosterId = Number(fosterIdParam);
  const validFosterId = Number.isSafeInteger(fosterId) && fosterId > 0 ? fosterId : null;

  const { data, isLoading, isError } = useFosterDetail(validFosterId);
  const deleteFosterMutation = useDeleteFoster();

  if (validFosterId == null) {
    return (
      <section className="rounded-2xl border border-border bg-white p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground">잘못된 신청 경로입니다.</h2>
        <p className="mt-2 text-base text-muted-foreground">
          임시보호 신청 정보를 확인할 수 없습니다.
        </p>
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
        <Skeleton className="mt-8 h-32 w-full" />
        <Skeleton className="mt-6 h-48 w-full" />
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

  const shouldShowSchedule =
    data.status === 'FOSTERING' ||
    data.status === 'EXTENDED' ||
    data.status === 'ENDED';

  const canEdit = data.status === 'PENDING';

  const canDelete =
    data.status === 'PENDING' || data.status === 'REJECTED';

  const handleDelete = () => {
    setDeleteError(null);

    deleteFosterMutation.mutate(data.fosterId, {
      onSuccess: () => {
        navigate('/mypage/fosters', { replace: true });
      },
      onError: () => {
        setDeleteError('신청을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      },
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-white p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2">
            <HandHeart className="text-ring" size={24} />
            <h2 className="text-2xl font-bold text-foreground">임시보호 신청 상세</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            신청 번호 {data.fosterNum}
          </p>
        </div>
        <FosterStatusBadge status={data.status} />
      </div>

      {deleteError && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>삭제할 수 없습니다.</AlertTitle>
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 border-b border-border py-6">
        {data.animalImageUrl ? (
          <img
            src={data.animalImageUrl}
            alt={data.animalNickname}
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <PawPrint className="text-muted-foreground" size={28} />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">신청 동물</p>
          <Link
            to={`/animals/${data.animalId}`}
            className="mt-1 block truncate text-xl font-bold text-foreground hover:text-ring"
          >
            {data.animalNickname}
          </Link>
        </div>
      </div>

      <dl className="space-y-5 py-6">
        <DetailRow label="나이" value={`${data.age}세`} />
        <DetailRow label="직업" value={data.job} />
        <DetailRow label="하고 싶은 말" value={data.message || '작성한 내용이 없습니다.'} />
        <DetailRow label="신청일" value={formatDateTime(data.createdAt)} />
        <DetailRow label="최종 수정일" value={formatDateTime(data.updatedAt)} />
      </dl>

      <div className="border-t border-border py-6">
        <h3 className="text-lg font-bold text-foreground">관리자 안내</h3>
        <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {data.answer || '관리자 답변을 기다리고 있습니다.'}
        </p>
      </div>

      {shouldShowSchedule && (
        <div className="border-t border-border py-6">
          <h3 className="text-lg font-bold text-foreground">임시보호 일정</h3>
          <dl className="mt-4 space-y-4">
            <DetailRow
              label="시작일"
              value={data.fosterStartAt ? formatDateTime(data.fosterStartAt) : '미정'}
            />
            <DetailRow
              label="기본 종료일"
              value={data.fosterEndAt ? formatDateTime(data.fosterEndAt) : '미정'}
            />
            <DetailRow
              label="연장일"
              value={data.fosterExtendAt ? formatDateTime(data.fosterExtendAt) : '해당 없음'}
            />
            <DetailRow
              label="최종 종료일"
              value={data.fosterCompleteAt ? formatDateTime(data.fosterCompleteAt) : '미정'}
            />
          </dl>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-6">
        <div className="flex gap-3">
          {canEdit && (
  <Button asChild variant="outline">
    <Link to={`/mypage/fosters/${data.fosterId}/edit`}>
      신청 수정
    </Link>
  </Button>
)}

        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleteFosterMutation.isPending}>
                신청 삭제
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>임시보호 신청을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  삭제한 신청 내역은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteFosterMutation.isPending}>
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteFosterMutation.isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {deleteFosterMutation.isPending ? '삭제 중...' : '삭제하기'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        </div>

        <Button asChild variant="outline">
          <Link to="/mypage/fosters">목록으로</Link>
        </Button>
      </div>
    </section>
  );
}