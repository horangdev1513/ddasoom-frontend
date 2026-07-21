import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PawPrint } from 'lucide-react';
import { useAdminFosterDetail } from '@/features/foster/hooks/useAdminFosterDetail';
import { useDeleteAdminFoster } from '@/features/foster/hooks/useDeleteAdminFoster';
import { FosterStatusBadge } from '@/features/foster/components/FosterStatusBadge';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
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
import { Skeleton } from '@/shared/components/ui/skeleton';

const FALLBACK_IMAGE =
  import.meta.env.VITE_IMAGE_PLACEHOLDER ??
  'https://placehold.co/400x300/FFF3D6/9C8B75?text=No+Image';

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';

  const date = new Date(iso);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function getDDay(dateString: string | null): string {
  if (!dateString) return '-';

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

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="mt-1 break-words font-medium text-foreground">{value}</p>
    </div>
  );
}

function ExpandableText({
  value,
  emptyText,
}: {
  value: string | null;
  emptyText: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = value?.trim() || emptyText;
  const canExpand = content.length > 120;

  return (
    <div>
      <p
        className={`whitespace-pre-wrap text-base leading-relaxed text-foreground ${
          isExpanded ? '' : 'max-h-20 overflow-hidden'
        }`}
      >
        {content}
      </p>

      {canExpand && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-auto px-0 text-ring hover:bg-transparent hover:text-ring"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? '접기' : '더보기'}
        </Button>
      )}
    </div>
  );
}

export function AdminFosterProgressDetailPage() {
  const navigate = useNavigate();
  const { fosterId: fosterIdParam } = useParams();
  const fosterId = Number(fosterIdParam);
  const validFosterId =
    Number.isSafeInteger(fosterId) && fosterId > 0 ? fosterId : null;

  const { data, isLoading, isError } = useAdminFosterDetail(validFosterId);
  const deleteFosterMutation = useDeleteAdminFoster();

  const handleDelete = () => {
    if (!validFosterId) return;

    deleteFosterMutation.mutate(validFosterId, {
      onSuccess: () => {
        navigate('/admin/active-fosters', { replace: true });
      },
      onError: (error) => {
        console.error('임시보호 신청 삭제 실패:', error);
      },
    });
  };

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
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-60 w-full" />
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
    return <Navigate to={`/admin/fosters/${data.fosterId}`} replace />;
  }

  const isActiveFoster =
    data.status === 'FOSTERING' || data.status === 'EXTENDED';

  const canDelete = !data.deletedAt && data.status === 'ENDED';

  const editButtonLabel = isActiveFoster
    ? '임시보호수정'
    : '관리자 메세지 수정';

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/active-fosters">
              <ArrowLeft />
              목록으로
            </Link>
          </Button>

          <h1 className="text-xl font-semibold">임시보호 진행 상세</h1>
        </div>

        <div className="flex items-center gap-2">
          <FosterStatusBadge status={data.status} />
          {data.deletedAt && <Badge variant="destructive">삭제됨</Badge>}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border p-5 lg:grid-cols-4">
        <div className="col-span-2">
          <span className="text-sm text-muted-foreground">임시보호 동물</span>
          <div className="mt-2 flex items-center gap-3">
            {data.animalImageUrl ? (
              <img
                src={data.animalImageUrl}
                alt={data.animalNickname}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="h-14 w-14 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-secondary">
                <PawPrint className="text-muted-foreground" size={22} />
              </div>
            )}

            <div>
              <Link
                to={`/animals/${data.animalId}`}
                className="font-medium text-foreground hover:text-ring"
              >
                {data.animalNickname}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                동물 번호 {data.animalId}
              </p>
            </div>
          </div>
        </div>

        <DetailItem label="신청자" value={data.userNickname} />
        <DetailItem label="전화번호" value={data.userTel} />
        <DetailItem
          label="처리 관리자"
          value={data.reviewerNickname ?? '미처리'}
        />
        <DetailItem label="신청 번호" value={data.fosterNum} />
        <DetailItem label="신청일" value={formatDateTime(data.createdAt)} />
        <DetailItem
          label="최종 수정일"
          value={formatDateTime(data.updatedAt)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            신청 정보
          </h2>

          <dl className="grid grid-cols-2 gap-4">
            <DetailItem label="나이" value={`${data.age}세`} />
            <DetailItem label="직업" value={data.job} />
          </dl>

          <div className="mt-4 border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">신청 내용</span>
            <div className="mt-2">
              <ExpandableText
                value={data.message}
                emptyText="작성한 내용이 없습니다."
              />
            </div>
          </div>
        </section>

        <section className="rounded-md border p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            관리자 답변
          </h2>

          <ExpandableText
            value={data.answer}
            emptyText="등록된 관리자 답변이 없습니다."
          />
        </section>
      </div>

      <section className="mt-6 rounded-md border p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          임시보호 일정
        </h2>

        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <DetailItem
            label="시작일"
            value={
              data.fosterStartAt
                ? `${formatDateTime(data.fosterStartAt)} (${getDDay(data.fosterStartAt)})`
                : '미정'
            }
          />
          <DetailItem
            label="기본 종료일"
            value={
              data.fosterEndAt
                ? `${formatDateTime(data.fosterEndAt)} (${getDDay(data.fosterEndAt)})`
                : '미정'
            }
          />
          <DetailItem
            label="연장일"
            value={
              data.fosterExtendAt
                ? `${formatDateTime(data.fosterExtendAt)} (${getDDay(data.fosterExtendAt)})`
                : '해당 없음'
            }
          />
          <DetailItem
            label="최종 종료일"
            value={
              data.fosterCompleteAt
                ? `${formatDateTime(data.fosterCompleteAt)} (${getDDay(data.fosterCompleteAt)})`
                : '미정'
            }
          />
        </dl>
      </section>

      {!data.deletedAt && (
        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-border pt-5">
          <Button asChild className="min-w-40">
            <Link to={`/admin/active-fosters/${data.fosterId}/edit`}>
              {editButtonLabel}
            </Link>
          </Button>

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="min-w-24">
                  삭제
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>종료된 임시보호 신청을 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    진행 중인 임시보호는 삭제할 수 없으며, 중단 처리로 종료 상태를 남겨야 합니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteFosterMutation.isPending}>
                    취소
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteFosterMutation.isPending}
                  >
                    {deleteFosterMutation.isPending ? '삭제 중...' : '삭제'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}