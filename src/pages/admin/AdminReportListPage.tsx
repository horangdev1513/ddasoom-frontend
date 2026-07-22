import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminReports } from '@/features/admin/hooks/useAdminReports';
import type { ReportStatus, ReportTargetType } from '@/features/report/api/reportApi';
import {
  REPORT_REASON_LABEL,
  REPORT_STATUS_LABEL,
  REPORT_TARGET_TYPE_LABEL,
} from '@/features/report/util';
// 페이지 번호 방식 페이지네이션은 QnA 목록에서 쓰던 것을 그대로 재사용한다(관리자 목록 공용).
import { QnaPagination } from '@/features/qna/components/QnaPagination';
import { formatDate } from '@/shared/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

// 셀렉트는 빈 문자열 value를 허용하지 않으므로 "전체"를 'ALL' 센티넬로 두고,
// 요청 직전에 undefined로 바꿔 파라미터 자체를 빼버린다(백엔드 optional 필터 규약).
const STATUS_OPTIONS: { value: ReportStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REJECTED', label: '반려' },
];

const TARGET_TYPE_OPTIONS: { value: ReportTargetType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 대상' },
  { value: 'POST', label: '게시글' },
  { value: 'POST_COMMENT', label: '댓글' },
  { value: 'MEMBER', label: '회원' },
];

// 상태 뱃지 — PENDING 노랑 / APPROVED 빨강 / REJECTED 회색.
// 노랑은 Badge variant에 없어 outline + 색상 유틸로 표현한다(상세 페이지와 동일 규칙).
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  if (status === 'APPROVED') {
    return <Badge variant="destructive">{REPORT_STATUS_LABEL.APPROVED}</Badge>;
  }
  if (status === 'REJECTED') {
    return <Badge variant="secondary">{REPORT_STATUS_LABEL.REJECTED}</Badge>;
  }
  return (
    <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
      {REPORT_STATUS_LABEL.PENDING}
    </Badge>
  );
}

export function AdminReportListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [targetType, setTargetType] = useState<ReportTargetType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useAdminReports({
    status: status === 'ALL' ? undefined : status,
    targetType: targetType === 'ALL' ? undefined : targetType,
    page,
    size: 10,
  });

  // 필터가 바뀌면 이전 페이지 번호가 새 결과 범위를 넘길 수 있어 첫 페이지로 되돌린다.
  const handleStatusChange = (next: ReportStatus | 'ALL') => {
    setStatus(next);
    setPage(0);
  };
  const handleTargetTypeChange = (next: ReportTargetType | 'ALL') => {
    setTargetType(next);
    setPage(0);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError) {
    return <div className="p-8 text-center text-destructive">목록을 불러오지 못했습니다.</div>;
  }

  const reports = data?.content ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">신고 관리</h1>
      </div>

      <div className="mb-4 flex gap-2">
        <Select value={status} onValueChange={(v) => handleStatusChange(v as ReportStatus | 'ALL')}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={targetType}
          onValueChange={(v) => handleTargetTypeChange(v as ReportTargetType | 'ALL')}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TARGET_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">번호</TableHead>
              {/* ⭐ 변경 — 대상 컬럼에 제목을 함께 노출하므로 폭을 넓힘 */}
              <TableHead className="w-56">대상</TableHead>
              <TableHead>사유</TableHead>
              <TableHead className="w-32">신고자</TableHead>
              {/* ⭐ 추가 — 피신고자 컬럼 */}
              <TableHead className="w-32">피신고자</TableHead>
              <TableHead className="w-24">상태</TableHead>
              <TableHead className="w-32">신고일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                {/* ⭐ 변경 — 피신고자 컬럼 추가로 colSpan 6→7 */}
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  조건에 맞는 신고가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow
                  key={report.reportId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/reports/${report.reportId}`)}
                >
                  <TableCell>{report.reportId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {REPORT_TARGET_TYPE_LABEL[report.targetType]}
                      </Badge>
                      {/* ⭐ 변경 — targetId 숫자 대신 제목 노출(길면 1줄 말줄임). 없으면 기존처럼 #id */}
                      {report.targetTitle ? (
                        <span
                          className="max-w-[240px] truncate text-muted-foreground"
                          title={report.targetTitle}
                        >
                          {report.targetTitle}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">#{report.targetId}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {REPORT_REASON_LABEL[report.reason]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.reporterNickname}
                  </TableCell>
                  {/* ⭐ 추가 — 피신고자(없으면 -) */}
                  <TableCell className="text-muted-foreground">
                    {report.reportedNickname ?? '-'}
                  </TableCell>
                  <TableCell>
                    <ReportStatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <QnaPagination
        page={data?.page ?? 0}
        totalPages={data?.totalPages ?? 1}
        hasPrevious={data?.hasPrevious ?? false}
        hasNext={data?.hasNext ?? false}
        onChange={setPage}
      />
    </div>
  );
}
