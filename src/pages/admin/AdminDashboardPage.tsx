import { useNavigate } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  usePendingSummary, useFosterStatusDistribution, useTodayNewMembers,
} from '@/features/admin/hooks/useDashboard';
import type { FosterStatus } from '@/features/admin/api/dashboardApi';

// 관리자 대시보드 — "오늘 뭘 처리해야 하나"(액션 지표 + 현재 스냅샷).
// 모든 숫자/막대는 클릭 시 해당 처리 화면으로 이동 — "보기만 하는 대시보드 지양" (통계요청 1-1).
// 추세 분석(왜 이런 흐름인가)은 통계 페이지 담당 — 여기선 현재 상태만.

// 상태 한글 라벨 + 상태별 목록 이동 쿼리 (FosterStatusBadge와 표기 통일)
const FOSTER_STATUS_LABEL: Record<FosterStatus, string> = {
  PENDING: '대기', FOSTERING: '보호중', EXTENDED: '연장됨', ENDED: '종료', REJECTED: '거절됨',
};
// 막대 색 — 처리 필요(대기)만 강조, 나머지는 중립 톤
const FOSTER_STATUS_COLOR: Record<FosterStatus, string> = {
  PENDING: '#f59e0b', FOSTERING: '#3b82f6', EXTENDED: '#8b5cf6', ENDED: '#9ca3af', REJECTED: '#ef4444',
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: pending, isLoading: pendingLoading } = usePendingSummary();
  const { data: distribution } = useFosterStatusDistribution();
  const { data: newMembers } = useTodayNewMembers();

  // recharts용 데이터 — 백엔드가 5종 전부(0건 포함) 내려주므로 그대로 매핑 (필터링 금지)
  const chartData = (distribution ?? []).map((d) => ({
    ...d,
    label: FOSTER_STATUS_LABEL[d.status],
  }));

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold">대시보드</h1>

      {/* ── 처리대기 그룹 — 관리자 페이지의 존재 이유("지금 처리할 일")라 최상단 배치 ── */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">처리 대기</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="심사 대기"
          value={pending?.reviewPending}
          loading={pendingLoading}
          onClick={() => navigate('/admin/fosters?status=PENDING')}
        />
        <SummaryCard
          label="만료 긴급 (D-7)"
          value={pending?.expiringUrgent}
          loading={pendingLoading}
          highlight
          onClick={() => navigate('/admin/fosters')}
        />
        <SummaryCard
          label="만료 예정 (D-8~30)"
          value={pending?.expiringUpcoming}
          loading={pendingLoading}
          onClick={() => navigate('/admin/fosters')}
        />
        <SummaryCard
          label="답변 대기 QnA"
          value={pending?.qnaPending}
          loading={pendingLoading}
          onClick={() => navigate('/admin/qnas?status=PENDING')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── 임보 상태 분포 — 5종은 시간축이 아닌 독립 범주라 막대차트 (꺾은선 아님 — 통계요청 1-3) ── */}
        <div className="rounded-md border p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">임보 신청 상태 분포</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
              <Tooltip formatter={(value: number) => [`${value}건`, '건수']} />
              {/* 막대 클릭 → 해당 상태 목록으로 (그래프 전환이 아니라 "정보→처리" 연결) */}
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => navigate(`/admin/fosters?status=${data.status}`)}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={FOSTER_STATUS_COLOR[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 오늘 신규 가입자 ── */}
        <SummaryCard
          label="오늘 신규 가입자"
          value={newMembers?.todayCount}
          onClick={() => navigate('/admin/members')}
          className="lg:h-auto"
        />
      </div>
    </div>
  );
}

// 클릭 이동형 숫자 카드 — 대시보드 전용이라 페이지 내 선언 (2곳 이상 쓰이는 시점에 분리)
function SummaryCard({
  label, value, loading, highlight, onClick, className = '',
}: {
  label: string;
  value: number | undefined;
  loading?: boolean;
  highlight?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border p-5 text-left transition-colors hover:bg-secondary ${
        highlight ? 'border-destructive/40' : ''
      } ${className}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>
        {loading || value === undefined ? '—' : value.toLocaleString()}
      </p>
    </button>
  );
}