import { Link, useNavigate, useParams } from 'react-router-dom'; // ⭐ 변경 — '원문 보기'를 같은 탭 내부 이동(Link)으로 바꾸며 Link 추가
import {
  useAdminReport,
  useApproveReport,
  useRejectReport,
} from '@/features/admin/hooks/useAdminReports';
// ⭐ 추가 — 대상 원문(관리자 화면) 링크 조합 유틸
import { buildReportTargetLink } from '@/features/admin/api/adminReportApi';
import { REPORT_REASON_LABEL, REPORT_TARGET_TYPE_LABEL } from '@/features/report/util';
import { ReportStatusBadge } from '@/pages/admin/AdminReportListPage';
import { formatDateTime } from '@/shared/utils/date';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
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

export function AdminReportDetailPage() {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const id = reportId ? Number(reportId) : null;

  const { data: report, isLoading, isError } = useAdminReport(id);
  const approve = useApproveReport(id ?? 0);
  const reject = useRejectReport(id ?? 0);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError || !report) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">신고를 불러오지 못했습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/reports')}>
          목록으로
        </Button>
      </div>
    );
  }

  const isPending = report.status === 'PENDING';
  const isProcessing = approve.isPending || reject.isPending;
  // ⭐ 추가 — 대상 원문 링크(조합 불가 시 null → '원문 보기' 버튼 미노출)
  const targetLink = buildReportTargetLink(report);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/reports')}>
            ← 목록으로
          </Button>
          <h1 className="text-xl font-semibold">신고 상세</h1>
          <ReportStatusBadge status={report.status} />
        </div>

        {/* 처리 버튼은 미처리(PENDING) 건에만 노출한다 — 재처리는 백엔드가 REPORT_003으로 거부 */}
        {isPending && (
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                {/* ⭐ 변경 — 승인 정책이 '숨김'에서 '콘텐츠 삭제 + 피신고자 강제탈퇴'로 바뀌어 라벨 수정 */}
                <Button variant="destructive" disabled={isProcessing}>
                  승인 (제재)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>이 신고를 승인할까요?</AlertDialogTitle>
                  {/* ⭐ 변경 — 되돌릴 수 없는 강제탈퇴가 걸려 있어 reportedMemberWithdrawn에 따라 문구 분기 */}
                  <AlertDialogDescription>
                    {report.reportedMemberWithdrawn
                      ? '이미 탈퇴한 회원입니다. 콘텐츠만 삭제됩니다.'
                      : '신고된 콘텐츠가 삭제되고 작성자 계정이 강제탈퇴됩니다. 되돌릴 수 없습니다.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => approve.mutate()}>승인</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" disabled={isProcessing} onClick={() => reject.mutate()}>
              반려
            </Button>
          </div>
        )}
      </div>

      {/* 기본 정보 */}
      <div className="mb-6 grid grid-cols-2 gap-4 rounded-md border p-5">
        <div>
          <span className="text-sm text-muted-foreground">신고 대상</span>
          <p className="flex items-center gap-2">
            <Badge variant="outline">{REPORT_TARGET_TYPE_LABEL[report.targetType]}</Badge>
            <span className="font-medium">#{report.targetId}</span>
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">신고 사유</span>
          <p className="font-medium">{REPORT_REASON_LABEL[report.reason]}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">신고자</span>
          <p className="font-medium">{report.reporterNickname}</p>
        </div>
        {/* ⭐ 추가 — 피신고자. reportedMemberId가 있으면 관리자 회원 상세로 이동, 없으면(스냅샷 이전) '정보 없음' */}
        <div>
          <span className="text-sm text-muted-foreground">피신고자</span>
          {report.reportedMemberId != null ? (
            <p className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/admin/members/${report.reportedMemberId}`)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {report.reportedNickname ?? `#${report.reportedMemberId}`}
              </button>
              {report.reportedMemberWithdrawn && <Badge variant="destructive">탈퇴</Badge>}
            </p>
          ) : (
            <p className="font-medium text-muted-foreground">정보 없음</p>
          )}
        </div>
        <div>
          <span className="text-sm text-muted-foreground">신고일</span>
          <p className="font-medium">{formatDateTime(report.createdAt)}</p>
        </div>
        {/* 처리 완료 건만 처리자/처리일시를 노출한다 */}
        {report.processorNickname && (
          <div>
            <span className="text-sm text-muted-foreground">처리자</span>
            <p className="font-medium">{report.processorNickname}</p>
          </div>
        )}
        {report.processedAt && (
          <div>
            <span className="text-sm text-muted-foreground">처리일시</span>
            <p className="font-medium">{formatDateTime(report.processedAt)}</p>
          </div>
        )}
      </div>

      {/* ⭐ 추가 — 신고 대상 카드. '무엇이 신고됐나'를 먼저 보여주려 누적 신고 카드 위에 배치 */}
      <div className="mb-6 rounded-md border p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">신고 대상</h2>
        <p className="font-medium text-foreground">
          {report.targetTitle ?? (
            <span className="text-muted-foreground">
              삭제되었거나 정보가 없는 대상입니다.
            </span>
          )}
        </p>
        {/* 발췌는 평문(서버가 태그 제거). dangerouslySetInnerHTML 금지. null이면(회원 신고 등) 영역 자체를 렌더하지 않음 */}
        {report.targetSnippet && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {report.targetSnippet}
          </p>
        )}
        {/* 원문 링크 — 조합 불가(POST_COMMENT + targetParentId null)면 버튼 미노출. 승인된 신고는 404 가능하나 정상 동선 */}
        {/* ⭐ 변경 — 이동 대상이 모두 관리자 화면 내부라 같은 탭 이동(Link)으로 변경. 새 탭(target/rel)·↗ 아이콘 제거 */}
        {targetLink && (
          <Button variant="outline" size="sm" className="mt-3" asChild>
            <Link to={targetLink}>원문 보기</Link>
          </Button>
        )}
      </div>

      {/* 누적 신고 건수 — 제재 수위 판단의 핵심 근거라 별도 블록으로 강조 */}
      <div className="mb-6 rounded-md border p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">이 대상의 누적 신고</h2>
        <p className="text-2xl font-bold text-foreground">{report.targetReportCount}건</p>
        {/* ⭐ 변경 — 회원 기준 카운트와 구분되게 라벨 명확화 + 반려 제외 정책 반영 */}
        <p className="mt-1 text-sm text-muted-foreground">
          이 게시글(대상)이 신고된 총 횟수입니다. 반려된 신고는 제외됩니다.
        </p>
        {/* ⭐ 추가 — 회원 기준 누적. 대상 기준과 의미가 다름(상습 분산 신고 탐지용). reportedMemberId 없으면 미노출 */}
        {report.reportedMemberId != null && (
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">이 회원의 누적 신고</h2>
            <p className="text-2xl font-bold text-foreground">
              {report.reportedMemberReportCount}건
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              이 회원이 통틀어 신고된 총 횟수입니다. 반려된 신고는 제외됩니다.
            </p>
          </div>
        )}
      </div>

      {/* 상세 내용 — 사유가 ETC일 때만 값이 있다 */}
      <div className="rounded-md border p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">상세 내용</h2>
        {report.content ? (
          <p className="whitespace-pre-wrap text-sm text-foreground">{report.content}</p>
        ) : (
          <p className="text-sm text-muted-foreground">작성된 상세 내용이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
