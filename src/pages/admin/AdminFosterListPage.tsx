import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { CalendarDays } from 'lucide-react';
import { SortableHeader } from '@/features/admin/components/SortableHeader';
import { useAdminFosters } from '@/features/foster/hooks/useAdminFosters';
import type {
  FosterAdminListItem,
  FosterManagementScope,
  FosterStatus,
} from '@/features/foster/types';
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

const FETCH_ALL_SIZE = 500;

const FALLBACK_IMAGE =
  import.meta.env.VITE_IMAGE_PLACEHOLDER ??
  'https://placehold.co/400x300/FFF3D6/9C8B75?text=No+Image';

const APPLICATION_STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '신청 대기' },
  { value: 'REJECTED', label: '신청 거절' },
];

const PROGRESS_STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '임시보호 중' },
  { value: 'ENDED', label: '종료' },
];

const STATUS_FILTER_BUTTON_CLASSES: Record<
  StatusFilter,
  { default: string; selected: string }
> = {
  ALL: {
    default: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
    selected:
      'border-slate-300 bg-slate-100 text-slate-800 ring-1 ring-slate-300 ring-offset-1',
  },
  PENDING: {
    default: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    selected:
      'border-amber-300 bg-amber-100 text-amber-900 ring-1 ring-amber-300 ring-offset-1',
  },
  REJECTED: {
    default: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    selected:
      'border-rose-300 bg-rose-100 text-rose-800 ring-1 ring-rose-300 ring-offset-1',
  },
  FOSTERING: {
    default:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    selected:
      'border-emerald-300 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 ring-offset-1',
  },
  EXTENDED: {
    default: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    selected:
      'border-sky-300 bg-sky-100 text-sky-800 ring-1 ring-sky-300 ring-offset-1',
  },
  ENDED: {
    default: 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100',
    selected:
      'border-slate-300 bg-slate-100 text-slate-800 ring-1 ring-slate-300 ring-offset-1',
  },
  ACTIVE: {
    default:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    selected:
      'border-emerald-300 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 ring-offset-1',
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';

  const date = new Date(iso);

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function getExpectedEndAt(foster: FosterAdminListItem): string | null {
  return foster.status === 'EXTENDED' && foster.fosterExtendAt
    ? foster.fosterExtendAt
    : foster.fosterEndAt;
}

function getDDayInfo(iso: string | null): {
  label: string;
  className: string;
} {
  if (!iso) {
    return {
      label: '일정 미정',
      className: 'border-slate-200 bg-slate-50 text-slate-600',
    };
  }

  const target = new Date(iso);
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return {
      label: '오늘 종료',
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  if (diffDays > 0) {
    return {
      label: `${diffDays}일 남음`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  return {
    label: `${Math.abs(diffDays)}일 경과`,
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  };
}

function getInitialStatusFilter(
  scope: FosterManagementScope,
  statusParam: string | null,
): StatusFilter {
  if (scope === 'APPLICATION') {
    return statusParam === 'PENDING' || statusParam === 'REJECTED'
      ? statusParam
      : 'ALL';
  }

  if (statusParam === 'FOSTERING' || statusParam === 'EXTENDED') {
    return 'ACTIVE';
  }

  return statusParam === 'ENDED' ? 'ENDED' : 'ALL';
}

function getScopeRedirectPath(
  scope: FosterManagementScope,
  statusParam: string | null,
): string | null {
  const isProgressStatus =
    statusParam === 'FOSTERING' ||
    statusParam === 'EXTENDED' ||
    statusParam === 'ENDED';

  const isApplicationStatus =
    statusParam === 'PENDING' || statusParam === 'REJECTED';

  if (scope === 'APPLICATION' && isProgressStatus) {
    return `/admin/active-fosters?status=${statusParam}`;
  }

  if (scope === 'PROGRESS' && isApplicationStatus) {
    return `/admin/fosters?status=${statusParam}`;
  }

  return null;
}

const globalFilterFn: FilterFn<FosterAdminListItem> = (
  row,
  _columnId,
  filterValue,
) => {
  const keyword = String(filterValue).toLowerCase();

  return (
    row.original.animalNickname.toLowerCase().includes(keyword) ||
    row.original.userNickname.toLowerCase().includes(keyword) ||
    (row.original.reviewerNickname?.toLowerCase().includes(keyword) ?? false)
  );
};

const statusFilterFn: FilterFn<FosterAdminListItem> = (
  row,
  _columnId,
  filterValue,
) => {
  const status = filterValue as StatusFilter;

  if (status === 'ALL') return true;

  if (status === 'ACTIVE') {
    return (
      row.original.status === 'FOSTERING' ||
      row.original.status === 'EXTENDED'
    );
  }

  return row.original.status === status;
};

const deletedFilterFn: FilterFn<FosterAdminListItem> = (
  row,
  _columnId,
  filterValue,
) => {
  const showDeletedOnly = filterValue as boolean;

  return !showDeletedOnly || row.original.deletedAt !== null;
};

const createdAtFilterFn: FilterFn<FosterAdminListItem> = (
  row,
  _columnId,
  filterValue,
) => {
  const { startDate, endDate } = filterValue as {
    startDate: string;
    endDate: string;
  };

  const createdDate = row.original.createdAt.slice(0, 10);

  if (startDate && createdDate < startDate) return false;
  if (endDate && createdDate > endDate) return false;

  return true;
};

function AnimalCell({ foster }: { foster: FosterAdminListItem }) {
  return (
    <div className="flex items-center gap-2">
      {foster.animalImageUrl ? (
        <img
          src={foster.animalImageUrl}
          alt={foster.animalNickname}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-9 w-9 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
          <CalendarDays className="text-muted-foreground" size={16} />
        </div>
      )}
      <span className="font-medium">{foster.animalNickname}</span>
    </div>
  );
}

function DeletedStatusCell({ foster }: { foster: FosterAdminListItem }) {
  return foster.deletedAt ? (
    <Badge className="border-rose-200 bg-rose-50 text-rose-700">삭제</Badge>
  ) : (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
      정상
    </Badge>
  );
}

export function AdminFosterListPage({
  scope,
}: {
  scope: FosterManagementScope;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const isProgressManagement = scope === 'PROGRESS';
  const scopeRedirectPath = getScopeRedirectPath(scope, statusParam);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    getInitialStatusFilter(scope, statusParam),
  );
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>(() =>
  isProgressManagement
    ? [
        { id: 'progressOrder', desc: false },
        { id: 'fosterStartAt', desc: true },
      ]
    : [{ id: 'createdAt', desc: true }],
  );

  useEffect(() => {
    if (scopeRedirectPath) {
      navigate(scopeRedirectPath, { replace: true });
    }
  }, [navigate, scopeRedirectPath]);

  const { data, isLoading, isError } = useAdminFosters(
    {
      scope,
      includeDeleted: true,
      page: 0,
      size: FETCH_ALL_SIZE,
    },
    !scopeRedirectPath,
  );

  const fosters = useMemo(() => data?.content ?? [], [data]);

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [
      { id: 'status', value: statusFilter },
      { id: 'deleted', value: showDeletedOnly },
    ];

    if (startDate || endDate) {
      filters.push({
        id: 'createdAt',
        value: { startDate, endDate },
      });
    }

    return filters;
  }, [endDate, showDeletedOnly, startDate, statusFilter]);

  const columnVisibility = useMemo(
    () => ({
      deleted: false,
      progressOrder: false,
    }),
    [],
  );

  const columns = useMemo<ColumnDef<FosterAdminListItem>[]>(() => {
    const commonColumns: ColumnDef<FosterAdminListItem>[] = [
      {
        accessorKey: 'fosterId',
        header: ({ column }) => (
          <SortableHeader column={column} label="번호" />
        ),
      },
      {
        accessorKey: 'animalNickname',
        header: ({ column }) => (
          <SortableHeader column={column} label="신청 동물" />
        ),
        cell: ({ row }) => <AnimalCell foster={row.original} />,
      },
      {
        accessorKey: 'userNickname',
        header: ({ column }) => (
          <SortableHeader column={column} label="신청자" />
        ),
      },
    ];

    if (isProgressManagement) {
      return [
        ...commonColumns,
        {
          id: 'progressOrder',
          accessorFn: (row) => {
            if (row.deletedAt) {
              return 2;
            }

            if (
              row.status === 'FOSTERING' ||
              row.status === 'EXTENDED'
            ) {
              return 0;
            }

            return 1;
          },
        },
        {
          id: 'fosterStartAt',
          accessorFn: (row) => row.fosterStartAt ?? '9999-12-31',
          header: ({ column }) => (
            <SortableHeader column={column} label="임시보호 시작일" />
          ),
          cell: ({ row }) => formatDate(row.original.fosterStartAt),
        },
        {
          accessorKey: 'fosterEndAt',
          header: ({ column }) => (
            <SortableHeader column={column} label="기본 종료일" />
          ),
          cell: ({ row }) => formatDate(row.original.fosterEndAt),
        },
        {
          accessorKey: 'fosterExtendAt',
          header: ({ column }) => (
            <SortableHeader column={column} label="연장일" />
          ),
          cell: ({ row }) => formatDate(row.original.fosterExtendAt),
        },
        {
          id: 'expectedEndAt',
          accessorFn: (row) => getExpectedEndAt(row) ?? '',
          header: ({ column }) => (
            <SortableHeader column={column} label="현재 종료 기준일" />
          ),
          cell: ({ row }) => {
            const expectedEndAt = getExpectedEndAt(row.original);
            const dDayInfo = getDDayInfo(expectedEndAt);

            return (
              <div className="flex flex-col items-start gap-1">
                <span>{formatDate(expectedEndAt)}</span>
                <Badge
                  className={`border px-2 py-0.5 text-xs font-medium ${dDayInfo.className}`}
                >
                  {dDayInfo.label}
                </Badge>
              </div>
            );
          },
        },
        {
          id: 'status',
          accessorFn: (row) => row.status,
          header: ({ column }) => (
            <SortableHeader column={column} label="상태" />
          ),
          filterFn: statusFilterFn,
          cell: ({ row }) => (
            <FosterStatusBadge status={row.original.status} />
          ),
        },
        {
          id: 'deletedStatus',
          accessorFn: (row) => (row.deletedAt ? 1 : 0),
          header: ({ column }) => (
            <SortableHeader column={column} label="삭제 여부" />
          ),
          cell: ({ row }) => <DeletedStatusCell foster={row.original} />,
        },
        {
          id: 'deletedAt',
          accessorFn: (row) => row.deletedAt ?? '',
          header: ({ column }) => (
            <SortableHeader column={column} label="삭제 처리일" />
          ),
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {formatDate(row.original.deletedAt)}
            </span>
          ),
        },
        {
          id: 'deleted',
          accessorFn: (row) => row.deletedAt !== null,
          filterFn: deletedFilterFn,
        },
      ];
    }

    return [
      ...commonColumns,
      {
        accessorKey: 'reviewerNickname',
        header: ({ column }) => (
          <SortableHeader column={column} label="처리 관리자" />
        ),
        cell: ({ row }) => row.original.reviewerNickname ?? '-',
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: ({ column }) => (
          <SortableHeader column={column} label="상태" />
        ),
        filterFn: statusFilterFn,
        cell: ({ row }) => (
          <FosterStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <SortableHeader column={column} label="신청일" />
        ),
        filterFn: createdAtFilterFn,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <SortableHeader column={column} label="수정일" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: 'deletedStatus',
        accessorFn: (row) => (row.deletedAt ? 1 : 0),
        header: ({ column }) => (
          <SortableHeader column={column} label="삭제 여부" />
        ),
        cell: ({ row }) => <DeletedStatusCell foster={row.original} />,
      },
      {
        id: 'deletedAt',
        accessorFn: (row) => row.deletedAt ?? '',
        header: ({ column }) => (
          <SortableHeader column={column} label="삭제 처리일" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.deletedAt)}
          </span>
        ),
      },
      {
        id: 'deleted',
        accessorFn: (row) => row.deletedAt !== null,
        filterFn: deletedFilterFn,
      },
    ];
  }, [isProgressManagement]);

  const table = useReactTable({
    data: fosters,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const handleStatusChange = (value: StatusFilter) => {
    setStatusFilter(value);
    table.setPageIndex(0);
  };

  const isInvalidDateRange =
    Boolean(startDate) &&
    Boolean(endDate) &&
    startDate > endDate;

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {isProgressManagement ? '임시보호진행관리' : '임시보호신청관리'}
        </h1>
      </div>

      <div className="mb-5 space-y-4 rounded-md border bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {(
            isProgressManagement
              ? PROGRESS_STATUS_FILTERS
              : APPLICATION_STATUS_FILTERS
          ).map((filter) => {
            const isSelected = statusFilter === filter.value;
            const buttonClass = isSelected
              ? STATUS_FILTER_BUTTON_CLASSES[filter.value].selected
              : STATUS_FILTER_BUTTON_CLASSES[filter.value].default;

            return (
              <Button
                key={filter.value}
                type="button"
                variant="outline"
                size="sm"
                className={buttonClass}
                aria-pressed={isSelected}
                onClick={() => handleStatusChange(filter.value)}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Input
            placeholder="동물명 또는 신청자 검색"
            value={globalFilter}
            onChange={(event) => {
              setGlobalFilter(event.target.value);
              table.setPageIndex(0);
            }}
            className="w-56"
          />

          {!isProgressManagement && (
            <>
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
                    table.setPageIndex(0);
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
                    table.setPageIndex(0);
                  }}
                  className="w-44"
                />
              </div>
            </>
          )}

          <label className="flex h-9 items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={showDeletedOnly}
              onCheckedChange={(checked) => {
                setShowDeletedOnly(checked === true);
                table.setPageIndex(0);
              }}
            />
            삭제된 신청만 보기
          </label>
        </div>

        {isInvalidDateRange && (
          <p className="text-sm text-destructive">
            신청 접수 시작일은 종료일보다 늦을 수 없습니다.
          </p>
        )}
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isInvalidDateRange ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-28 text-center text-destructive"
                >
                  날짜 범위를 다시 확인해 주세요.
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-28 text-center text-muted-foreground"
                >
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-28 text-center text-destructive"
                >
                  임시보호 신청 목록을 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="h-28 text-center text-muted-foreground"
                >
                  조건에 맞는 임시보호 신청이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(
                      isProgressManagement
                        ? `/admin/active-fosters/${row.original.fosterId}`
                        : `/admin/fosters/${row.original.fosterId}`,
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          이전
        </Button>

        <span className="text-sm text-muted-foreground">
          {table.getState().pagination.pageIndex + 1} /{' '}
          {Math.max(1, table.getPageCount())}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          다음
        </Button>
      </div>
    </div>
  );
}