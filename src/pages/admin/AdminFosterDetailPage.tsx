import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, HandHeart, PawPrint } from 'lucide-react';
import { useAdminFosterDetail } from '@/features/foster/hooks/useAdminFosterDetail';
import { FosterStatusBadge } from '@/features/foster/components/FosterStatusBadge';
import { Badge } from '@/shared/components/ui/badge';
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

function getDDay(dateString: string): string {
  const target = new Date(dateString);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'D-Day';

  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-base text-foreground">{value}</dd>
    </div>
  );
}

export function AdminFosterDetailPage() {
  const { fosterId: fosterIdParam } = useParams();
  const fosterId = Number(fosterIdParam);
  const validFosterId = Number.isSafeInteger(fosterId) && fosterId > 0 ? fosterId : null;

  const { data, isLoading, isError } = useAdminFosterDetail(validFosterId);

  if (validFosterId == null) {
    return (
      <div className="p-6">
        <p className="text-destructive">잘못된 임시보호 신청 경로입니다.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/fosters">목록으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <p className="text-destructive">임시보호 신청 정보를 불러오지 못했습니다.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin/fosters">목록으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const shouldShowSchedule =
    data.status === 'FOSTERING' ||
    data.status === 'EXTENDED' ||
    data.status === 'ENDED';

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link to="/admin/fosters">
              <ArrowLeft />
              목록으로
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <HandHeart className="text-ring" size={24} />
            <h1 className="text-xl font-semibold">임시보호 신청 상세</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            신청 번호 {data.fosterNum}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!data.deletedAt && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/fosters/${data.fosterId}/edit`}>수정</Link>
            </Button>
          )}
          <FosterStatusBadge status={data.status} />
          {data.deletedAt && <Badge variant="destructive">삭제됨</Badge>}
        </div>
      </div>
      

      <section className="border-y bg-white px-5 py-6">
        <h2 className="text-lg font-semibold">신청 동물</h2>
        <div className="mt-4 flex items-center gap-4">
          {data.animalImageUrl ? (
            <img
              src={data.animalImageUrl}
              alt={data.animalNickname}
              className="h-20 w-20 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md bg-secondary">
              <PawPrint className="text-muted-foreground" size={28} />
            </div>
          )}

          <div>
            <Link
              to={`/animals/${data.animalId}`}
              className="text-lg font-semibold text-foreground hover:text-ring"
            >
              {data.animalNickname}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              동물 번호 {data.animalId}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-white px-5 py-6">
        <h2 className="text-lg font-semibold">신청자 정보</h2>
        <dl className="mt-4">
          <DetailRow label="닉네임" value={data.userNickname} />
          <DetailRow label="이메일" value={data.userEmail} />
          <DetailRow label="전화번호" value={data.userTel} />
        </dl>
      </section>

      <section className="border-b bg-white px-5 py-6">
        <h2 className="text-lg font-semibold">신청 내용</h2>
        <dl className="mt-4">
          <DetailRow label="나이" value={`${data.age}세`} />
          <DetailRow label="직업" value={data.job} />
          <DetailRow label="하고 싶은 말" value={data.message || '작성한 내용이 없습니다.'} />
          <DetailRow label="신청일" value={formatDateTime(data.createdAt)} />
          <DetailRow label="최종 수정일" value={formatDateTime(data.updatedAt)} />
          <DetailRow
            label="처리 관리자"
            value={data.reviewerNickname ?? '아직 처리되지 않았습니다.'}
          />
        </dl>
      </section>

      <section className="border-b bg-white px-5 py-6">
        <h2 className="text-lg font-semibold">관리자 답변</h2>
        <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-foreground">
          {data.answer || '등록된 관리자 답변이 없습니다.'}
        </p>
      </section>

      {shouldShowSchedule && (
        <section className="border-b bg-white px-5 py-6">
          <h2 className="text-lg font-semibold">임시보호 일정</h2>
          <dl className="mt-4">
            <DetailRow
              label="시작일"
              value={
                data.fosterStartAt
                  ? `${formatDateTime(data.fosterStartAt)} (${getDDay(data.fosterStartAt)})`
                  : '미정'
              }
            />
            <DetailRow
              label="기본 종료일"
              value={
                data.fosterEndAt
                  ? `${formatDateTime(data.fosterEndAt)} (${getDDay(data.fosterEndAt)})`
                  : '미정'
              }
            />
            <DetailRow
              label="연장일"
              value={
                data.fosterExtendAt
                  ? `${formatDateTime(data.fosterExtendAt)} (${getDDay(data.fosterExtendAt)})`
                  : '해당 없음'
              }
            />
            <DetailRow
              label="최종 종료일"
              value={
                data.fosterCompleteAt
                  ? `${formatDateTime(data.fosterCompleteAt)} (${getDDay(data.fosterCompleteAt)})`
                  : '미정'
              }
            />
          </dl>
        </section>
      )}
    </div>
  );
}