import { useState } from 'react';
import {
  Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  useFosterMonthlyTrend, useFosterApprovalRate, useFosterAvgDuration,
  useAnimalKindRatio, useAnimalRegionDistribution, useTopFosterAnimals,
} from '@/features/admin/hooks/useStatistics';
import { StatCard } from '@/features/admin/components/StatCard';
import { TopFosterAnimalList } from '@/features/admin/components/TopFosterAnimalList';
import { RegionDistributionTable } from '@/features/admin/components/RegionDistributionTable';
import type { AnimalKind } from '@/features/admin/api/statisticsApi';

// 관리자 통계 — "왜 이런 흐름인가"(기간 추세 분석). 현재 스냅샷/액션 지표는 대시보드.
// (일별 가입자 추이는 대시보드로 이동됨)

const KIND_LABEL: Record<AnimalKind, string> = { D: '개', C: '고양이' };
const KIND_COLOR: Record<AnimalKind, string> = { D: '#3b82f6', C: '#f59e0b' };
const YEARS = Array.from(
  { length: new Date().getFullYear() - 2025 + 1 },
  (_, i) => 2025 + i,
).reverse();

export function AdminStatisticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: monthly, isError: monthlyError } = useFosterMonthlyTrend(year);
  const { data: approval } = useFosterApprovalRate();
  const { data: duration } = useFosterAvgDuration();
  const { data: kinds } = useAnimalKindRatio();
  const { data: regions } = useAnimalRegionDistribution();
  const { data: topAnimals } = useTopFosterAnimals();

  const monthlyData = (monthly?.points ?? []).map((p) => ({ ...p, label: `${p.month}월` }));
  const kindData = (kinds ?? []).map((k) => ({ ...k, label: KIND_LABEL[k.kind] }));
  const kindTotal = kindData.reduce((sum, k) => sum + k.count, 0);

  const approvalRate = approval?.approvalRate ?? 0;
  const rejectRate = approval ? Math.round((100 - approval.approvalRate) * 10) / 10 : 0;

  const thisMonth = new Date().getMonth() + 1;
  const thisMonthCount = year === new Date().getFullYear()
    ? (monthly?.points.find((p) => p.month === thisMonth)?.count ?? 0)
    : null;

  if (monthlyError) {
    return <div className="p-8 text-center text-destructive">통계를 불러오지 못했습니다.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold">통계</h1>

      {/* 핵심 숫자 카드 3종 */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="임보 승인율 / 반려율"
          value={approval ? (
            <>
              <span className="text-[#3b82f6]">{approvalRate}%</span>
              <span className="mx-1.5 text-lg text-muted-foreground">/</span>
              <span className="text-destructive">{rejectRate}%</span>
            </>
          ) : '—'}
          hint={`승인 ${approval?.approvedCount ?? 0}건 / 반려 ${approval?.rejectedCount ?? 0}건 (대기 제외)`}
        />
        <StatCard
          label="평균 임보 지속기간"
          value={duration && duration.sampleCount > 0 ? `${duration.averageDays}일` : '—'}
          hint={duration && duration.sampleCount > 0
            ? `표본 ${duration.sampleCount}건 (시작~종료일 기준)`
            : '집계 가능한 임보 건이 아직 없습니다.'}
        />
        <StatCard
          label="이번 달 임보 신청"
          value={thisMonthCount === null ? '—' : `${thisMonthCount.toLocaleString()}건`}
          hint={thisMonthCount === null ? '올해 선택 시 표시됩니다' : `${thisMonth}월 신청 건수`}
        />
      </div>

      {/* 월별 추이 | 종별 비율 — 반반 */}
      <div className="mb-6 grid gap-6 lg:grid-cols-10">
        <div className="rounded-md border p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">월별 임보 신청 추이</h2>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm">
              {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
              <Tooltip formatter={(value: number) => [`${value}건`, '신청']} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-foreground">등록 동물 종별 비율</h2>
          <div className="flex items-center justify-between pr-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie data={kindData} dataKey="count" nameKey="label" innerRadius={52} outerRadius={82} paddingAngle={2}>
                  {kindData.map((entry) => (
                    <Cell key={entry.kind} fill={KIND_COLOR[entry.kind]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, _n, item) =>
                  [`${item?.payload?.label} (${value}마리)`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 text-sm">
              {kindData.map((k) => (
                <li key={k.kind} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: KIND_COLOR[k.kind] }} />
                  {k.label}
                  <span className="text-muted-foreground">
                    ({kindTotal > 0 ? Math.round((k.count / kindTotal) * 100) : 0}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* TOP10 | 보호지역 분포 — 반반 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopFosterAnimalList animals={topAnimals ?? []} />
        <div className="rounded-md border p-5">
          <h2 className="text-sm font-semibold text-foreground">보호지역 분포 현황 (시/도)</h2>
          <p className="mt-0.5 mb-4 text-xs text-muted-foreground">전국 시/도별 보호지역 지정 건수 및 분포 비율</p>
          <RegionDistributionTable regions={regions ?? []} />
        </div>
      </div>
    </div>
  );
}