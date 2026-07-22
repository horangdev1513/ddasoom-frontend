import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/components/ui/table';
import { SortableHeader } from '@/features/admin/components/SortableHeader';
import { useAdminMembers } from '@/features/admin/hooks/useMembers';
import type {
  AdminMemberListItem,
  AdminMemberStatusFilter,
} from '@/features/admin/api/adminMemberApi';
import type { Role } from '@/shared/types/role';

// 관리자 유저 관리 — 검색·필터·정렬·페이징을 모두 서버에서 처리한다(서버 페이징).
// 전체를 받아 브라우저에서 거르던 방식은 데이터가 늘면 응답 지연·메모리 문제로 반드시 한계에 부딪힌다.

const PAGE_SIZE = 20;

const ROLE_OPTIONS: { value: Role | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 권한' },
  { value: 'GUEST', label: 'GUEST' },
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

type StatusFilter = 'ALL' | AdminMemberStatusFilter;
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'HIDDEN', label: '숨김' },
  { value: 'DELETED', label: '탈퇴' },
];

// 화면 컬럼 id → 백엔드 정렬 프로퍼티. 백엔드 화이트리스트와 반드시 일치해야 한다.
// (허용 밖 값을 보내면 에러가 아니라 기본 정렬로 조용히 대체되므로, 어긋나면 원인 파악이 어렵다)
const SORT_PROPERTY: Record<string, string> = {
  memberId: 'id',
  email: 'email',
  nickname: 'nickname',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
};

const columns: ColumnDef<AdminMemberListItem>[] = [
  {
    accessorKey: 'memberId',
    header: ({ column }) => <SortableHeader column={column} label="번호" />,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <SortableHeader column={column} label="이메일" />,
  },
  {
    accessorKey: 'nickname',
    header: ({ column }) => <SortableHeader column={column} label="닉네임" />,
    cell: ({ row }) => row.original.nickname ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <SortableHeader column={column} label="권한" />,
  },
  {
    // 상태는 파생값(탈퇴 > 숨김 > 활성) — 정렬은 백엔드가 CASE 식으로 처리한다
    id: 'status',
    header: ({ column }) => <SortableHeader column={column} label="상태" />,
    cell: ({ row }) => {
      if (row.original.deletedAt) return <span className="text-destructive">탈퇴</span>;
      if (row.original.status === 'HIDDEN') return <span className="text-amber-600">숨김</span>;
      return <span className="text-muted-foreground">활성</span>;
    },
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

  // ── 서버 요청 파라미터가 되는 상태들 ──
  const [sorting, setSorting] = useState<SortingState>([]);
  const [keywordInput, setKeywordInput] = useState('');   // 입력 즉시 반영(화면용)
  const [keyword, setKeyword] = useState('');             // 디바운스 후 반영(요청용)
  const [role, setRole] = useState<Role | 'ALL'>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(0);

  // 타이핑 한 글자마다 요청이 나가지 않도록 300ms 디바운스.
  // 입력값(keywordInput)과 요청값(keyword)을 분리해 입력 반응성은 유지한다.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // 검색·필터가 바뀌면 첫 페이지로 되돌린다.
  // (3페이지에서 검색했는데 결과가 1페이지뿐이면 빈 화면이 뜨는 문제 방지)
  useEffect(() => {
    setPage(0);
  }, [keyword, role, status]);

  // TanStack의 SortingState → Spring 정렬 표기("프로퍼티,방향")
  const sortParam = useMemo(() => {
    if (sorting.length === 0) return undefined;
    const { id, desc } = sorting[0];
    const property = SORT_PROPERTY[id];
    return property ? `${property},${desc ? 'desc' : 'asc'}` : undefined;
  }, [sorting]);

  const { data, isLoading, isError } = useAdminMembers({
    keyword: keyword || undefined,
    role: role === 'ALL' ? undefined : role,
    status: status === 'ALL' ? undefined : status,
    sort: sortParam,
    page,
    size: PAGE_SIZE,
  });

  const members = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 0;

  const table = useReactTable({
    data: members,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    // 검색·정렬·페이징을 서버가 처리하므로 클라이언트 행 모델을 쓰지 않는다.
    // manual 플래그를 켜지 않으면 TanStack이 "이미 걸러진 한 페이지"를 다시 자르려 든다.
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">유저 관리</h1>
        {data && (
          <span className="text-sm text-muted-foreground">전체 {data.totalElements}명</span>
        )}
      </div>

      {/* 검색 + 필터 — 전부 서버 요청 파라미터로 전달된다 */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="이메일 또는 닉네임 검색"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
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
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
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
            ) : members.length === 0 ? (
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

      {/* 페이지네이션 — 서버 페이징이라 table의 페이지 API 대신 page 상태를 직접 다룬다 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {page + 1} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}