import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useAdminMemberDetail, useAdminMemberLoginLogs, useForceWithdrawMember, useRestoreMember,
  useUpdateMemberStatus,
} from '@/features/admin/hooks/useMembers';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';

// 로그인 방식 라벨 — LoginLogsModal과 동일 표기 통일
const LOGIN_TYPE_LABEL: Record<string, string> = {
  LOCAL: '이메일 로그인', KAKAO: '카카오', NAVER: '네이버', GOOGLE: '구글',
};
const LOG_PAGE_SIZE = 20;

export function AdminMemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const id = memberId ? Number(memberId) : null;
  const [logPage, setLogPage] = useState(0);

  const { data: member, isLoading, isError } = useAdminMemberDetail(id);
  const { data: logs } = useAdminMemberLoginLogs(id, logPage);
  const forceWithdraw = useForceWithdrawMember();
  const restore = useRestoreMember();
  const updateStatus = useUpdateMemberStatus();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError || !member) {
    return <div className="p-8 text-center text-destructive">회원 정보를 불러오지 못했습니다.</div>;
  }

  const isWithdrawn = member.deletedAt != null;
  const isHidden = member.status === 'HIDDEN';

  const handleForceWithdraw = () => {
    if (!id) return;
    forceWithdraw.mutate(id);
  };
  const handleRestore = () => {
    if (!id) return;
    restore.mutate(id);
  };
  // 노출 상태 전환 — 신고 확인 후 관리자 수동 제재 (자동 처리 없음 — 팀 정책).
  // ADMIN 대상은 백엔드가 MEMBER_008로 차단, 탈퇴 회원은 MEMBER_003 (버튼 자체를 숨겨 이중 방어)
  const handleToggleStatus = () => {
    if (!id) return;
    updateStatus.mutate({ memberId: id, status: isHidden ? 'ACTIVE' : 'HIDDEN' });
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/members')}>
            ← 목록으로
          </Button>
          <h1 className="text-xl font-semibold">회원 상세</h1>
        </div>

        {/* 강제탈퇴/복구 — ADMIN 계정 대상 시 400 MEMBER_007은 컨트롤러가 이미 막음(백엔드),
            여기선 UI 노출만 활성/탈퇴 상태로 분기 */}
        <div className="flex items-center gap-2">
          {isWithdrawn ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">계정 복구</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>계정을 복구할까요?</AlertDialogTitle>
                  <AlertDialogDescription>
                    복구 즉시 해당 회원은 새로운 토큰을 발급받아 정상 이용이 가능해집니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRestore}>복구</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <>
              {/* 노출 상태 전환 — 신고 제재. 탈퇴 회원에겐 미노출 (탈퇴가 더 강한 제재라 상태 변경이 무의미) */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={isHidden ? 'secondary' : 'outline'}
                    disabled={member.role === 'ADMIN'}
                  >
                    {isHidden ? '숨김 해제' : '회원 숨김'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isHidden ? '숨김을 해제할까요?' : '이 회원을 숨김 처리할까요?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isHidden
                        ? '회원이 정상(ACTIVE) 상태로 전환됩니다.'
                        : '신고 내용을 확인하셨나요? 숨김(HIDDEN) 처리는 관리자가 직접 검토한 뒤 진행하는 수동 제재입니다.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleToggleStatus}>
                      {isHidden ? '해제' : '숨김 처리'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={member.role === 'ADMIN'}>강제 탈퇴</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>이 회원을 강제 탈퇴시킬까요?</AlertDialogTitle>
                    <AlertDialogDescription>
                      즉시 전체 세션이 종료되며, 이미 발급된 토큰으로도 더 이상 활동할 수 없게 됩니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleForceWithdraw}>강제 탈퇴</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border p-5">
        <div><span className="text-sm text-muted-foreground">이메일</span><p className="font-medium">{member.email}</p></div>
        <div><span className="text-sm text-muted-foreground">이름</span><p className="font-medium">{member.name}</p></div>
        <div><span className="text-sm text-muted-foreground">닉네임</span><p className="font-medium">{member.nickname}</p></div>
        <div><span className="text-sm text-muted-foreground">전화번호</span><p className="font-medium">{member.tel}</p></div>
        <div>
          <span className="text-sm text-muted-foreground">권한</span>
          <p><Badge variant="outline">{member.role}</Badge></p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">상태</span>
          <p>
            {isWithdrawn
              ? <Badge variant="destructive">탈퇴</Badge>
              : isHidden
                ? <Badge variant="outline">숨김</Badge>
                : <Badge variant="secondary">활성</Badge>}
          </p>
        </div>
        <div><span className="text-sm text-muted-foreground">가입일</span><p className="font-medium">{member.createdAt.slice(0, 10)}</p></div>
        <div><span className="text-sm text-muted-foreground">최근 수정일</span><p className="font-medium">{member.updatedAt.slice(0, 10)}</p></div>
      </div>

      {/* 소셜 연동 현황 */}
      <div className="mb-6 rounded-md border p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">소셜 연동</h2>
        {member.socialProviders.length === 0 ? (
          <p className="text-sm text-muted-foreground">연동된 소셜 계정이 없습니다.</p>
        ) : (
          <div className="flex gap-2">
            {member.socialProviders.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
          </div>
        )}
      </div>

      {/* 로그인 이력 — 상세 페이지 안에서 바로 페이징 (마이페이지 모달과 문법 통일) */}
      <div className="rounded-md border p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">로그인 이력</h2>
        {!logs || logs.content.length === 0 ? (
          <p className="text-sm text-muted-foreground">로그인 이력이 없습니다.</p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {logs.content.map((log) => (
                <li key={log.loginLogId} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-foreground">
                    {LOGIN_TYPE_LABEL[log.loginType] ?? log.loginType}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(log.loginAt).toLocaleString('ko-KR')}
                  </span>
                </li>
              ))}
            </ul>
            {logs.totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <button
                  onClick={() => setLogPage((p) => p - 1)}
                  disabled={logPage === 0}
                  className="flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> 이전
                </button>
                <span className="text-sm text-muted-foreground">
                  {logPage + 1} / {logs.totalPages} 페이지 (총 {logs.totalElements}건)
                </span>
                <button
                  onClick={() => setLogPage((p) => p + 1)}
                  disabled={!logs.hasNext}
                  className="flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-40 transition-colors hover:bg-secondary"
                >
                  다음 <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}