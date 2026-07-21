import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  AdminGlobalCommentItem,
  BOARD_TYPE_LABEL,
} from '@/features/admin/api/adminBoardApi';
import {
  useAdminComments,
  useForceDeleteCommentInList,
} from '@/features/admin/hooks/useAdminBoard';

// 데모 규모라 전체 1회 로드 후 검색/정렬/페이징을 전부 클라이언트에서 처리(AdminPostListPage와 동일).
// → 검색 타이핑 중 서버 요청 0회. 댓글 수가 커지면 manualPagination으로 서버 모드 전환 검토.
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
  row: { original: AdminGlobalCommentItem },
  _columnId: string,
  filterValue: string,
) {
  const q = filterValue.toLowerCase();
  return (
    row.original.content.toLowerCase().includes(q) ||
    row.original.author.nickname.toLowerCase().includes(q) ||
    row.original.postTitle.toLowerCase().includes(q)
  );
}

// 강제삭제 액션 — 별도 컴포넌트로 분리한 이유:
// 뮤테이션의 isPending을 컬럼 정의(모듈 스코프)에서 참조하면 삭제 중 컬럼이 재생성돼 표가 리셋될 수 있다.
// 각 행이 자체 훅으로 로컬 pending을 관리하면 컬럼 배열은 안정적으로 유지된다.
function CommentRowActions({ comment }: { comment: AdminGlobalCommentItem }) {
  const forceDelete = useForceDeleteCommentInList();

  // 이미 삭제된 댓글은 백엔드가 멱등 처리하지만, UI에서도 감춰 혼란을 방지한다.
  if (comment.deletedAt != null) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='text-destructive hover:text-destructive'
          disabled={forceDelete.isPending}
        >
          삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>이 댓글을 강제삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            작성자 동의 없이 댓글이 숨김 처리됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              forceDelete.mutate({
                postId: comment.postId,
                commentId: comment.commentId,
              })
            }
          >
            강제삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// 컬럼 정의도 모듈 스코프 — 매 렌더 재생성 방지 (액션은 자체 훅을 쓰는 CommentRowActions에 위임)
const columns: ColumnDef<AdminGlobalCommentItem>[] = [
  {
    accessorKey: 'commentId',
    header: ({ column }) => <SortableHeader column={column} label='번호' />,
    cell: ({ row }) => <span>{row.original.commentId}</span>,
  },
  {
    accessorKey: 'content',
    header: ({ column }) => <SortableHeader column={column} label='내용' />,
    cell: ({ row }) => (
      <span
        className={
          row.original.deletedAt
            ? 'line-clamp-2 max-w-sm text-muted-foreground line-through'
            : 'line-clamp-2 max-w-sm'
        }
      >
        {row.original.content}
      </span>
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
    // 원글 — 클릭 시 게시글 상세로 이동 (행 전체 클릭 대신 링크로 한정해 삭제 버튼과 충돌 방지)
    id: 'post',
    accessorFn: (row) => row.postTitle,
    header: ({ column }) => <SortableHeader column={column} label='원글' />,
    cell: ({ row }) => (
      <Link
        to={`/admin/posts/${row.original.postId}`}
        className='text-primary underline-offset-2 hover:underline line-clamp-1 max-w-xs'
      >
        {row.original.postTitle}
      </Link>
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
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader column={column} label='작성일' />,
    cell: ({ row }) => (
      <span className='text-muted-foreground'>
        {row.original.createdAt.slice(0, 10)}
      </span>
    ),
  },
  {
    // deletedAt 유무를 정렬 가능한 값으로 변환 — 삭제된 댓글이 아래로 모이도록
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
  {
    id: 'actions',
    header: () => <span className='sr-only'>관리</span>,
    cell: ({ row }) => (
      <div className='text-right'>
        <CommentRowActions comment={row.original} />
      </div>
    ),
  },
];

export function AdminCommentListPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [boardType, setBoardType] = useState<string>('ALL');

  // 전체 1회 로드 — 검색어/게시판은 쿼리 조건이 아니므로 바꿔도 재조회 없음
  const { data, isLoading, isError } = useAdminComments(0, FETCH_ALL_SIZE);
  const comments = useMemo(() => data?.content ?? [], [data]);

  // boardType이 실제로 바뀔 때만 새 배열을 만든다 — 참조 안정성이 무한루프 방지의 핵심
  const columnFilters: ColumnFiltersState = useMemo(
    () => (boardType === 'ALL' ? [] : [{ id: 'boardType', value: boardType }]),
    [boardType],
  );

  const table = useReactTable({
    data: comments,
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
        <h1 className='text-xl font-semibold'>댓글 관리</h1>
      </div>

      {/* 검색 + 게시판 필터 — 전부 메모리 필터링, 서버 요청 없음 */}
      <div className='mb-4 flex gap-2'>
        <Input
          placeholder='내용 · 작성자 · 원글 제목 검색'
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
                  조건에 맞는 댓글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
