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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  AdminPostListItem,
  BOARD_TYPE_LABEL,
} from '@/features/admin/api/adminBoardApi';
import { useAdminPosts } from '@/features/admin/hooks/useAdminBoard';

// 데모 규모라 전체 1회 로드 후 검색/정렬/페이징을 전부 클라이언트에서 처리(AdminMemberListPage와 동일).
// → 검색 타이핑 중 서버 요청 0회. 글 수가 커지면 manualPagination으로 서버 모드 전환 검토.
const FETCH_ALL_SIZE = 500;

const BOARD_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: '전체 게시판' },
  { value: 'DOG_INFO', label: '강아지 정보' },
  { value: 'CAT_INFO', label: '고양이 정보' },
  { value: 'ADOPTION_REVIEW', label: '입양 후기' },
];

// ⚠️ 컴포넌트 바깥(모듈 스코프)에 둔다 — 렌더링마다 재생성되는 함수를 state로 넘기면
// TanStack Table이 "필터 함수가 바뀌었다"고 오판해 페이지 리셋 → 리렌더 → 재생성 무한루프에 빠진다.
function globalFilterFn(
  row: { original: AdminPostListItem },
  _columnId: string,
  filterValue: string,
) {
  const q = filterValue.toLowerCase();
  return (
    row.original.title.toLowerCase().includes(q) ||
    row.original.author.nickname.toLowerCase().includes(q)
  );
}

// 컬럼 정의도 모듈 스코프 — 매 렌더 재생성 방지 (데이터 자체가 없으므로 컴포넌트 상태 의존 없음)
const columns: ColumnDef<AdminPostListItem>[] = [
  {
    accessorKey: 'postId',
    header: ({ column }) => <SortableHeader column={column} label='번호' />,
    cell: ({ row }) => <span>{row.original.postId}</span>,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <SortableHeader column={column} label='제목' />,
    cell: ({ row }) => (
      <span className='font-medium line-clamp-1 max-w-xs'>
        {row.original.title}
      </span>
    ),
  },
  {
    accessorKey: 'boardType',
    header: ({ column }) => <SortableHeader column={column} label='게시판' />,
    cell: ({ row }) => (
      <Badge variant='outline'>
        {BOARD_TYPE_LABEL[row.original.boardType] ?? row.original.boardType}
      </Badge>
    ),
    filterFn: 'equals', // 게시판 셀렉트 필터용 — 정확 일치
  },
  {
    accessorKey: 'category',
    header: ({ column }) => <SortableHeader column={column} label='카테고리' />,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.category}</span>
    ),
  },
  {
    // author는 객체라 정렬/필터 키로 닉네임을 파생
    id: 'author',
    accessorFn: (row) => row.author.nickname,
    header: ({ column }) => <SortableHeader column={column} label='작성자' />,
    cell: ({ row }) => <span>{row.original.author.nickname}</span>,
  },
  {
    accessorKey: 'viewCount',
    header: ({ column }) => <SortableHeader column={column} label='조회' />,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.viewCount}</span>
    ),
  },
  {
    accessorKey: 'commentCount',
    header: ({ column }) => <SortableHeader column={column} label='댓글' />,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.commentCount}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column} label='작성일' />,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>
        {row.original.createdAt.slice(0, 10)}
      </span>
    ),
  },
  {
    // deletedAt 유무를 정렬 가능한 값으로 변환 — 삭제된 글이 아래로 모이도록
    id: 'status',
    accessorFn: (row) => (row.deletedAt ? 1 : 0),
    header: ({ column }) => <SortableHeader column={column} label='상태' />,
    cell: ({ row }) =>
      row.original.deletedAt ? (
        <Badge variant='destructive'>삭제됨</Badge>
      ) : (
        <Badge variant='secondary'>활성</Badge>
      ),
  },
];

export function AdminPostListPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [boardType, setBoardType] = useState<string>('ALL');

  // 전체 1회 로드 — 검색어/게시판은 쿼리 조건이 아니므로 바꿔도 재조회 없음
  const { data, isLoading, isError } = useAdminPosts({
    page: 0,
    size: FETCH_ALL_SIZE,
  });
  const posts = useMemo(() => data?.content ?? [], [data]);

  // boardType이 실제로 바뀔 때만 새 배열을 만든다 — 참조 안정성이 무한루프 방지의 핵심
  const columnFilters: ColumnFiltersState = useMemo(
    () => (boardType === 'ALL' ? [] : [{ id: 'boardType', value: boardType }]),
    [boardType],
  );

  const table = useReactTable({
    data: posts,
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
    <div className='p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>게시글 관리</h1>
      </div>

      {/* 검색 + 게시판 필터 — 전부 메모리 필터링, 서버 요청 없음 */}
      <div className='mb-4 flex gap-2'>
        <Input
          placeholder='제목 또는 작성자 검색'
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='max-w-xs'
        />
        <Select value={boardType} onValueChange={setBoardType}>
          <SelectTrigger className='w-40'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOARD_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  불러오는 중…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-destructive'
                >
                  목록을 불러오지 못했습니다.
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  조건에 맞는 게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='cursor-pointer'
                  onClick={() =>
                    navigate(`/admin/posts/${row.original.postId}`)
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

      {/* 페이지네이션 */}
      <div className='mt-4 flex items-center justify-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          이전
        </Button>
        <span className='text-sm text-muted-foreground'>
          {table.getState().pagination.pageIndex + 1} /{' '}
          {Math.max(1, table.getPageCount())}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
