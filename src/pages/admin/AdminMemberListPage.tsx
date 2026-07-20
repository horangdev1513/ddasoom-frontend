import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { SortableHeader } from '@/features/admin/components/SortableHeader';
import { ArrowUpDown } from 'lucide-react';
import { useAdminMembers } from '@/features/admin/hooks/useMembers';
import type { AdminMemberListItem } from '@/features/admin/api/adminMemberApi';
import type { Role } from '@/shared/types/role';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';

// 데모 규모(수십 명)라 전체 1회 로드 후 검색/정렬/페이징을 전부 클라이언트에서 처리.
// → 검색 타이핑 중 서버 요청 0회. 회원 수가 커지면 manualPagination으로 서버 모드 전환 검토.
const FETCH_ALL_SIZE = 500;

const ROLE_OPTIONS: { value: Role | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 권한' },
  { value: 'GUEST', label: 'GUEST' },
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

// ⚠️ 컴포넌트 바깥(모듈 스코프)에 둔다 — 렌더링마다 재생성되는 함수를 state로 넘기면
// TanStack Table이 "필터 함수가 바뀌었다"고 오판해 페이지 리셋 → 리렌더 → 재생성 무한루프에 빠진다.
function globalFilterFn(row: { original: AdminMemberListItem }, _columnId: string, filterValue: string) {
  const q = filterValue.toLowerCase();
  return (
    row.original.email.toLowerCase().includes(q) ||
    row.original.nickname.toLowerCase().includes(q)
  );
}

// 컬럼 정의도 모듈 스코프 — 매 렌더 재생성 방지 (데이터 자체가 없으므로 컴포넌트 상태 의존 없음)
const columns: ColumnDef<AdminMemberListItem>[] = [
   {
    accessorKey: 'memberId',
    header: ({ column }) => <SortableHeader column={column} label="번호" />,
    cell: ({ row }) => <span>{row.original.memberId}</span>,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <SortableHeader column={column} label="이메일" />,
    cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
  },
  {
    accessorKey: 'nickname',
    header: ({ column }) => <SortableHeader column={column} label="닉네임" />,
    cell: ({ row }) => <span>{row.original.nickname}</span>,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <SortableHeader column={column} label="권한" />,
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
    filterFn: 'equals', // Role 셀렉트 필터용 — 정확 일치
  },
  {
    // deletedAt 유무를 정렬 가능한 값으로 변환 — accessorFn으로 파생 값 생성
    id: 'status',
    // 정렬용 파생값 — 활성=0, 숨김=1, 탈퇴=2 (문제 상태가 아래로 모이도록)
    accessorFn: (row) => (row.deletedAt ? 2 : row.status === 'HIDDEN' ? 1 : 0),
    header: ({ column }) => <SortableHeader column={column} label="상태" />,
    cell: ({ row }) => (
      row.original.deletedAt
        ? <Badge variant="destructive">탈퇴</Badge>
        : row.original.status === 'HIDDEN'
          ? <Badge variant="outline">숨김</Badge>
          : <Badge variant="secondary">활성</Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column} label="가입일" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.createdAt.slice(0, 10)}</span>
    ),
  },
];

export function AdminMemberListPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [role, setRole] = useState<Role | 'ALL'>('ALL');

  // 전체 1회 로드 — 검색어는 쿼리 조건이 아니므로 타이핑해도 재조회 없음
  const { data, isLoading, isError } = useAdminMembers({ page: 0, size: FETCH_ALL_SIZE });
  const members = useMemo(() => data?.content ?? [], [data]);

  // role이 실제로 바뀔 때만 새 배열을 만든다 — 참조 안정성이 무한루프 방지의 핵심
  const columnFilters: ColumnFiltersState = useMemo(
    () => (role === 'ALL' ? [] : [{ id: 'role', value: role }]),
    [role],
  );

  const table = useReactTable({
    data: members,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">유저 관리</h1>
      </div>

      {/* 검색 + Role 필터 — 전부 메모리 필터링, 서버 요청 없음 */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="이메일 또는 닉네임 검색"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={role} onValueChange={(v) => setRole(v as Role | 'ALL')}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  불러오는 중…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-destructive">
                  목록을 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  조건에 맞는 회원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/members/${row.original.memberId}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
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