import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  usePendingSummary, useFosterStatusDistribution, useTodayNewMembers,
} from '@/features/admin/hooks/useDashboard';
import { useSignupDailyTrend } from '@/features/admin/hooks/useStatistics';
import { SummaryCard } from '@/features/admin/components/SummaryCard';
import type { FosterStatus } from '@/features/admin/api/dashboardApi';
import { formatLocalDateShort } from '@/shared/utils/date';

// 관리자 대시보드 — "오늘 뭘 처리해야 하나"(액션 지표 + 현재 스냅샷).
// 숫자/막대 클릭 시 해당 처리 화면으로 이동. 가입자 추이는 현재 스냅샷 성격이라 여기 배치.

const FOSTER_STATUS_LABEL: Record<FosterStatus, string> = {
  PENDING: '대기', FOSTERING: '보호중', EXTENDED: '연장됨', ENDED: '종료', REJECTED: '거절됨',
};
const FOSTER_STATUS_COLOR: Record<FosterStatus, string> = {
  PENDING: '#f59e0b', FOSTERING: '#3b82f6', EXTENDED: '#8b5cf6', ENDED: '#9ca3af', REJECTED: '#ef4444',
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [signupOffset, setSignupOffset] = useState(0);

  const { data: pending, isLoading: pendingLoading, isError: pendingError } = usePendingSummary();
  const { data: distribution } = useFosterStatusDistribution();
  const { data: newMembers } = useTodayNewMembers();
  const { data: signup } = useSignupDailyTrend(signupOffset);

  const chartData = (distribution ?? []).map((d) => ({
    ...d,
    label: FOSTER_STATUS_LABEL[d.status],
  }));
  const signupData = (signup?.points ?? []).map((p) => ({
    label: formatLocalDateShort(p.date),
    count: p.count,
  }));

  if (pendingError) {
    return <div className="p-8 text-center text-destructive">대시보드를 불러오지 못했습니다.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold">대시보드</h1>

      {/* 처리대기 그룹 — 최상단. 오늘 가입자도 여기로 (5개 한 줄) */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">처리 대기</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="임보 심사 대기" value={pending?.reviewPending} loading={pendingLoading}
          onClick={() => navigate('/admin/fosters?status=PENDING')} />
        <SummaryCard label="임보 만료 긴급 (D-7)" value={pending?.expiringUrgent} loading={pendingLoading} highlight
          onClick={() => navigate('/admin/fosters?expiring=urgent')} />
        <SummaryCard label="임보 만료 예정 (D-8~30)" value={pending?.expiringUpcoming} loading={pendingLoading}
          onClick={() => navigate('/admin/fosters?expiring=upcoming')} />
        <SummaryCard label="미답변 QnA" value={pending?.qnaPending} loading={pendingLoading}
          onClick={() => navigate('/admin/qnas?status=PENDING')} />
        <SummaryCard label="오늘 신규 가입자" value={newMembers?.todayCount}
          onClick={() => navigate('/admin/members')} />
      </div>

      {/* 하단: 상태 분포 막대 | 일별 가입자 추이 — 반반 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">임보 신청 상태 분포</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={13} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
              <Tooltip formatter={(value: number) => [`${value}건`, '건수']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} cursor="pointer"
                onClick={(data) => navigate(`/admin/fosters?status=${data.status}`)}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={FOSTER_STATUS_COLOR[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">일별 신규 가입자 추이</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => setSignupOffset((o) => o + 1)}
                className="rounded-md border border-border p-1 hover:bg-secondary">
                <ChevronLeft size={15} />
              </button>
              <span>
                {signupData.length > 0
                  ? `${signupData[0].label} ~ ${signupData[signupData.length - 1].label}`
                  : '—'}
              </span>
              <button onClick={() => setSignupOffset((o) => Math.max(0, o - 1))} disabled={signupOffset === 0}
                className="rounded-md border border-border p-1 hover:bg-secondary disabled:opacity-40">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
              <Tooltip formatter={(value: number) => [`${value}명`, '가입']} />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}