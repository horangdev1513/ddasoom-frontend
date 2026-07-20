import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandHeart, PawPrint } from 'lucide-react';
import { useMyFosters } from '@/features/foster/hooks/useFosters';
import type { FosterStatus } from '@/features/foster/types';
import { FosterStatusBadge } from '@/features/foster/components/FosterStatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';

const STATUS_OPTIONS: { value: 'ALL' | FosterStatus; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'PENDING', label: '신청 대기' },
  { value: 'REJECTED', label: '신청 거절' },
  { value: 'FOSTERING', label: '임시보호 중' },
  { value: 'EXTENDED', label: '임시보호 연장' },
  { value: 'ENDED', label: '임시보호 종료' },
];

function formatDate(iso: string): string {
  const date = new Date(iso);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function FosterHistoryTab() {
  const [status, setStatus] = useState<'ALL' | FosterStatus>('ALL');
  const [page, setPage] = useState(0);

  const selectedStatus = status === 'ALL' ? undefined : status;
  const { data, isLoading, isError } = useMyFosters({
    status: selectedStatus,
    page,
    size: 10,
  });

  const handleStatusChange = (value: 'ALL' | FosterStatus) => {
    setStatus(value);
    setPage(0);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <p className="text-base text-destructive">
          임시보호 신청 내역을 불러오지 못했습니다.
        </p>
      </div>
    );
  }

  const fosters = data?.content ?? [];

  return (
    <section className="rounded-2xl border border-border bg-white p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <HandHeart className="text-ring" size={24} />
            <h2 className="text-2xl font-bold text-foreground">임시보호 신청 내역</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            내가 신청한 임시보호의 진행 상태를 확인할 수 있어요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = status === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                aria-pressed={isSelected}
                onClick={() => handleStatusChange(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {fosters.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/50 text-center">
          <PawPrint className="text-muted-foreground/50" size={32} />
          <p className="text-base text-muted-foreground">신청한 임시보호 내역이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {fosters.map((foster) => (
            <li key={foster.fosterId}>
              <Link
                to={`/mypage/fosters/${foster.fosterId}`}
                className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50"
              >
                {foster.animalImageUrl ? (
                  <img
                    src={foster.animalImageUrl}
                    alt={foster.animalNickname}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <PawPrint className="text-muted-foreground" size={24} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-foreground">
                    {foster.animalNickname}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    신청일 {formatDate(foster.createdAt)}
                  </p>
                </div>

                <FosterStatusBadge status={foster.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasPrevious}
          onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
        >
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {(data?.page ?? 0) + 1} / {Math.max(1, data?.totalPages ?? 0)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasNext}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          다음
        </Button>
      </div>
    </section>
  );
}