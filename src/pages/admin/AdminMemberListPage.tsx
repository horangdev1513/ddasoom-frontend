import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminMembers } from '@/features/admin/hooks/useMembers';
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

const ROLE_OPTIONS: { value: Role | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 권한' },
  { value: 'GUEST', label: 'GUEST' },
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

export function AdminMemberListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<Role | 'ALL'>('ALL');

  const { data, isLoading, isError } = useAdminMembers({
    keyword: keyword || undefined,
    role: role === 'ALL' ? undefined : role,
    page,
    size: 10,
  });

  const handleSearch = (next: string) => {
    setKeyword(next);
    setPage(0); // 검색 조건 바뀌면 1페이지부터
  };
  const handleRoleChange = (next: Role | 'ALL') => {
    setRole(next);
    setPage(0);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError) {
    return <div className="p-8 text-center text-destructive">목록을 불러오지 못했습니다.</div>;
  }

  const members = data?.content ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">유저 관리</h1>
      </div>

      {/* 검색 — 이메일/닉네임 키워드 + Role 필터 */}
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="이메일 또는 닉네임 검색"
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={role} onValueChange={(v) => handleRoleChange(v as Role | 'ALL')}>
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
            <TableRow>
              <TableHead className="w-16">번호</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>닉네임</TableHead>
              <TableHead className="w-24">권한</TableHead>
              <TableHead className="w-24">상태</TableHead>
              <TableHead className="w-32">가입일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  조건에 맞는 회원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow
                  key={member.memberId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/members/${member.memberId}`)}
                >
                  <TableCell>{member.memberId}</TableCell>
                  <TableCell className="font-medium">{member.email}</TableCell>
                  <TableCell>{member.nickname}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {member.deletedAt ? (
                      <Badge variant="destructive">탈퇴</Badge>
                    ) : (
                      <Badge variant="secondary">활성</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.createdAt.slice(0, 10)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 — AdminNoticeListPage와 동일 문법 */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasPrevious}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          이전
        </Button>
        <span className="text-sm text-muted-foreground">
          {(data?.page ?? 0) + 1} / {data?.totalPages ?? 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.hasNext}
          onClick={() => setPage((p) => p + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}