import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
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

// 관리자 댓글 관리 — 검색·필터·정렬·페이징을 모두 서버에서 처리한다(서버 페이징).
// 전체를 받아 브라우저에서 거르던 방식은 댓글이 늘면 응답 지연·메모리 문제로 반드시 한계에 부딪힌다.
const PAGE_SIZE = 20;

const BOARD_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: '전체 게시판' },
  { value: 'DOG_INFO', label: '강아지 정보' },
  { value: 'CAT_INFO', label: '고양이 정보' },
  { value: 'ADOPTION_REVIEW', label: '입양 후기' },
];

// 화면 컬럼 id → 백엔드 정렬 프로퍼티(엔티티 경로). 루트는 PostComment.
// ⚠️ 백엔드 화이트리스트와 반드시 일치해야 한다. 어긋나면 에러가 아니라
//    기본 정렬(작성일 최신순)로 조용히 대체되어 원인 파악이 어렵다.
const SORT_PROPERTY: Record<string, string> = {
  commentId: 'id',
  content: 'content',
  author: 'member.nickname',
  post: 'post.title',
  boardType: 'post.boardType',
  createdAt: 'createdAt',
  // 화면의 "상태"(활성/삭제됨)는 deletedAt 유무 파생.
  // MySQL은 NULL을 가장 작게 보므로 ASC = 활성 먼저 → 삭제됨 나중 (기존 0/1 정렬과 동일 순서)
  status: 'deletedAt',
};

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
// 정렬·필터를 서버가 처리하므로 파생 accessorFn과 filterFn은 두지 않는다.
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
    // author는 객체라 컬럼 id를 별도로 둔다 (정렬은 서버가 member.nickname으로 처리)
    id: 'author',
    header: ({ column }) => <SortableHeader column={column} label='작성자' />,
    cell: ({ row }) => <span>{row.original.author.nickname}</span>,
  },
  {
    // 원글 — 클릭 시 게시글 상세로 이동 (행 전체 클릭 대신 링크로 한정해 삭제 버튼과 충돌 방지)
    id: 'post',
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
    id: 'status',
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
  // ── 서버 요청 파라미터가 되는 상태들 ──
  const [sorting, setSorting] = useState<SortingState>([]);
  const [keywordInput, setKeywordInput] = useState(''); // 입력 즉시 반영(화면용)
  const [keyword, setKeyword] = useState(''); // 디바운스 후 반영(요청용)
  const [boardType, setBoardType] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // 타이핑 한 글자마다 요청이 나가지 않도록 300ms 디바운스.
  // 입력값과 요청값을 분리해 입력 반응성은 유지한다.
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // 검색·필터가 바뀌면 첫 페이지로 되돌린다.
  // (3페이지에서 검색했는데 결과가 1페이지뿐이면 빈 화면이 뜨는 문제 방지)
  useEffect(() => {
    setPage(0);
  }, [keyword, boardType]);

  // TanStack의 SortingState → Spring 정렬 표기("프로퍼티,방향")
  const sortParam = useMemo(() => {
    if (sorting.length === 0) return undefined;
    const { id, desc } = sorting[0];
    const property = SORT_PROPERTY[id];
    return property ? `${property},${desc ? 'desc' : 'asc'}` : undefined;
  }, [sorting]);

  const { data, isLoading, isError } = useAdminComments({
    keyword: keyword || undefined,
    boardType: boardType === 'ALL' ? undefined : boardType,
    sort: sortParam,
    page,
    size: PAGE_SIZE,
  });

  const comments = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 0;

  const table = useReactTable({
    data: comments,
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
    <div className='p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>댓글 관리</h1>
        {data && (
          <span className='text-sm text-muted-foreground'>
            전체 {data.totalElements}건
          </span>
        )}
      </div>

      {/* 검색 + 게시판 필터 — 전부 서버 요청 파라미터로 전달된다 */}
      <div className='mb-4 flex gap-2'>
        <Input
          placeholder='내용 · 작성자 · 원글 제목 검색'
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
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
            ) : comments.length === 0 ? (
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

      {/* 페이지네이션 — 서버 페이징이라 table의 페이지 API 대신 page 상태를 직접 다룬다 */}
      <div className='mt-4 flex items-center justify-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          이전
        </Button>
        <span className='text-sm text-muted-foreground'>
          {page + 1} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant='outline'
          size='sm'
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}