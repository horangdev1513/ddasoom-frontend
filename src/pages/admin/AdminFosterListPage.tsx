import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, HandHeart } from 'lucide-react';
import { useAdminFosters } from '@/features/foster/hooks/useAdminFosters';
import type { FosterAdminListItem, FosterStatus } from '@/features/foster/types';
import { FosterStatusBadge } from '@/features/foster/components/FosterStatusBadge';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

type StatusFilter = 'ALL' | 'ACTIVE' | FosterStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '신청 대기' },
  { value: 'REJECTED', label: '신청 거절' },
  { value: 'ACTIVE', label: '진행 중' },
  { value: 'ENDED', label: '종료' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '-';

  const date = new Date(iso);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function getDDay(iso: string | null): string {
  if (!iso) return '-';

  const target = new Date(iso);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'D-Day';

  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;
}

function getExpectedEndAt(foster: FosterAdminListItem): string | null {
  if (foster.status === 'EXTENDED' && foster.fosterExtendAt) {
    return foster.fosterExtendAt;
  }

  return foster.fosterEndAt;
}

export function AdminFosterListPage({
  activeOnly = false,
}: {
  activeOnly?: boolean;
}) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);

  const isInvalidDateRange =
    Boolean(startDate) &&
    Boolean(endDate) &&
    startDate > endDate;

  const selectedStatus =
    statusFilter === 'ALL' || statusFilter === 'ACTIVE'
      ? undefined
      : statusFilter;

  const { data, isLoading, isFetching, isError } = useAdminFosters(
    {
      status: activeOnly ? undefined : selectedStatus,
      activeOnly: activeOnly || statusFilter === 'ACTIVE' ? true : undefined,
      includeDeleted: activeOnly ? false : includeDeleted,
      startDate: activeOnly ? undefined : startDate || undefined,
      endDate: activeOnly ? undefined : endDate || undefined,
      page,
      size: 20,
    },
    !isInvalidDateRange,
  );

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(0);
  };

  const fosters = data?.content ?? [];
  const columnCount = activeOnly ? 8 : 7;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <HandHeart className="text-ring" size={24} />
          <h1 className="text-xl font-semibold">
            {activeOnly ? '임시보호 중 관리' : '임시보호 신청 관리'}
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeOnly
            ? '현재 임시보호 중이거나 연장된 신청의 일정을 관리합니다.'
            : '임시보호 신청 현황과 처리 상태를 확인합니다.'}
        </p>
      </div>

      {!activeOnly && (
        <div className="mb-5 space-y-4 rounded-md border bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const isSelected = statusFilter === filter.value;

              return (
                <Button
                  key={filter.value}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={isSelected}
                  onClick={() => handleStatusChange(filter.value)}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor="foster-start-date"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                신청 접수 시작일
              </label>
              <Input
                id="foster-start-date"
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  setPage(0);
                }}
                className="w-44"
              />
            </div>

            <div>
              <label
                htmlFor="foster-end-date"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                신청 접수 종료일
              </label>
              <Input
                id="foster-end-date"
                type="date"
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  setPage(0);
                }}
                className="w-44"
              />
            </div>

            <label className="flex h-9 items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={includeDeleted}
                onCheckedChange={(checked) => {
                  setIncludeDeleted(checked === true);
                  setPage(0);
                }}
              />
              삭제된 신청 포함
            </label>
          </div>

          {isInvalidDateRange && (
            <p className="text-sm text-destructive">
              신청 접수 시작일은 종료일보다 늦을 수 없습니다.
            </p>
          )}
        </div>
      )}

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {activeOnly ? (
              <TableRow>
                <TableHead>번호</TableHead>
                <TableHead>임시보호 동물</TableHead>
                <TableHead>신청자</TableHead>
                <TableHead>시작일</TableHead>
                <TableHead>기본 종료일</TableHead>
                <TableHead>연장일</TableHead>
                <TableHead>예정 종료일</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead>번호</TableHead>
                <TableHead>신청 동물</TableHead>
                <TableHead>신청자</TableHead>
                <TableHead>처리 관리자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>수정일</TableHead>
              </TableRow>
            )}
          </TableHeader>

          <TableBody>
            {isInvalidDateRange ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-28 text-center text-destructive">
                  날짜 범위를 다시 확인해 주세요.
                </TableCell>
              </TableRow>
            ) : isLoading || isFetching ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-28 text-center text-muted-foreground"
                >
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-28 text-center text-destructive"
                >
                  임시보호 신청 목록을 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : fosters.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-28 text-center text-muted-foreground"
                >
                  {activeOnly
                    ? '현재 임시보호 중인 신청이 없습니다.'
                    : '조건에 맞는 임시보호 신청이 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              fosters.map((foster) => {
                const expectedEndAt = getExpectedEndAt(foster);

                return (
                  <TableRow
                    key={foster.fosterId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/fosters/${foster.fosterId}`)}
                  >
                    {activeOnly ? (
                      <>
                        <TableCell>{foster.fosterId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {foster.animalImageUrl ? (
                              <img
                                src={foster.animalImageUrl}
                                alt={foster.animalNickname}
                                className="h-9 w-9 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                                <CalendarDays className="text-muted-foreground" size={16} />
                              </div>
                            )}
                            <span className="font-medium">{foster.animalNickname}</span>
                          </div>
                        </TableCell>
                        <TableCell>{foster.userNickname}</TableCell>
                        <TableCell>{formatDate(foster.fosterStartAt)}</TableCell>
                        <TableCell>{formatDate(foster.fosterEndAt)}</TableCell>
                        <TableCell>{formatDate(foster.fosterExtendAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(expectedEndAt)}</span>
                            <span className="text-sm text-ring">{getDDay(expectedEndAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <FosterStatusBadge status={foster.status} />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{foster.fosterId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {foster.animalImageUrl ? (
                              <img
                                src={foster.animalImageUrl}
                                alt={foster.animalNickname}
                                className="h-9 w-9 rounded-md object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                                <CalendarDays className="text-muted-foreground" size={16} />
                              </div>
                            )}
                            <span className="font-medium">{foster.animalNickname}</span>
                          </div>
                        </TableCell>
                        <TableCell>{foster.userNickname}</TableCell>
                        <TableCell>{foster.reviewerNickname ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FosterStatusBadge status={foster.status} />
                            {foster.deletedAt && (
                              <Badge variant="destructive">삭제됨</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(foster.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(foster.updatedAt)}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasPrevious || isFetching}
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
          disabled={!data?.hasNext || isFetching}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}