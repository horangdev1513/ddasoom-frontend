import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  useFosterMonthlyTrend, useFosterApprovalRate, useFosterAvgDuration,
  useAnimalKindRatio, useAnimalRegionDistribution, useTopFosterAnimals, useSignupDailyTrend,
} from '@/features/admin/hooks/useStatistics';
import type { AnimalKind } from '@/features/admin/api/statisticsApi';

// 관리자 통계 — "왜 이런 흐름인가"(기간 기반 추세 분석). 현재 스냅샷/액션 지표는 대시보드 담당.
// 같은 데이터라도 형태가 갈림: 상태 분포=대시보드 막대(현재) / 월별 추이=여기 꺾은선(흐름).

const KIND_LABEL: Record<AnimalKind, string> = { D: '개', C: '고양이' };
const KIND_COLOR: Record<AnimalKind, string> = { D: '#3b82f6', C: '#f59e0b' };
// 연도 드롭다운 — 서비스 데이터 시작 연도(2025)부터 올해까지
const YEARS = Array.from(
  { length: new Date().getFullYear() - 2025 + 1 },
  (_, i) => 2025 + i,
).reverse();

export function AdminStatisticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [signupOffset, setSignupOffset] = useState(0); // 0=최근 7일, 커질수록 과거

  const { data: monthly } = useFosterMonthlyTrend(year);
  const { data: approval } = useFosterApprovalRate();
  const { data: duration } = useFosterAvgDuration();
  const { data: kinds } = useAnimalKindRatio();
  const { data: regions } = useAnimalRegionDistribution();
  const { data: topAnimals } = useTopFosterAnimals();
  const { data: signup } = useSignupDailyTrend(signupOffset);

  const monthlyData = (monthly?.points ?? []).map((p) => ({ ...p, label: `${p.month}월` }));
  const kindData = (kinds ?? []).map((k) => ({ ...k, label: KIND_LABEL[k.kind] }));
  const kindTotal = kindData.reduce((sum, k) => sum + k.count, 0);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold">통계</h1>

      {/* ── 핵심 숫자 카드 — 승인율 / 평균 지속기간 ── */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-md border p-5">
          <p className="text-sm text-muted-foreground">임보 승인율</p>
          <p className="mt-1 text-3xl font-bold">
            {approval ? `${approval.approvalRate}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {/* 대기(PENDING)는 미결 건이라 분모 제외 — 숫자 출렁임 방지 */}
            승인 {approval?.approvedCount ?? 0}건 / 거절 {approval?.rejectedCount ?? 0}건 (대기 제외)
          </p>
        </div>
        <div className="rounded-md border p-5">
          <p className="text-sm text-muted-foreground">평균 임보 지속기간</p>
          <p className="mt-1 text-3xl font-bold">
            {duration && duration.sampleCount > 0 ? `${duration.averageDays}일` : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {duration && duration.sampleCount > 0
              ? `표본 ${duration.sampleCount}건 (시작~종료일 기준)`
              : '집계 가능한 임보 건이 아직 없습니다.'}
          </p>
        </div>
      </div>

      {/* ── 월별 임보 신청 추이 — 12개월 한 화면 꺾은선 + 연도 드롭다운 (통계요청 2-1) ── */}
      <div className="mb-6 rounded-md border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">월별 임보 신청 추이</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
            <Tooltip formatter={(value: number) => [`${value}건`, '신청']} />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* ── 종별 비율 도넛 — 2분류 (통계요청 2-4) ── */}
        <div className="rounded-md border p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">등록 동물 종별 비율</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={kindData} dataKey="count" nameKey="label"
                     innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {kindData.map((entry) => (
                    <Cell key={entry.kind} fill={KIND_COLOR[entry.kind]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}마리`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2 text-sm">
              {kindData.map((k) => (
                <li key={k.kind} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: KIND_COLOR[k.kind] }} />
                  {k.label} {k.count.toLocaleString()}마리
                  <span className="text-muted-foreground">
                    ({kindTotal > 0 ? Math.round((k.count / kindTotal) * 100) : 0}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── 지역별 분포 — 시/도 기준, 건수 내림차순 (통계요청 2-5) ── */}
        <div className="rounded-md border p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">보호지역 분포 (시/도)</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, (regions?.length ?? 0) * 26)}>
            <BarChart data={regions ?? []} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <YAxis type="category" dataKey="region" width={64} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip formatter={(value: number) => [`${value}마리`, '등록']} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 임보 신청 TOP10 — 종 포함 리스트 (조회수 전환율 대체 — 통계요청 2-6) ── */}
      <div className="mb-6 rounded-md border p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">임보 신청 많은 동물 TOP10</h2>
        {!topAnimals || topAnimals.length === 0 ? (
          <p className="text-sm text-muted-foreground">임보 신청 데이터가 아직 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {topAnimals.map((a, i) => (
              <li key={a.animalId} className="flex items-center gap-4 py-2.5 text-sm">
                <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.nickname} className="h-10 w-10 rounded-md object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.nickname}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.abandonmentId}</p>
                </div>
                <span className="text-muted-foreground">{KIND_LABEL[a.kind]} · {a.typeName}</span>
                <span className="font-semibold">{a.fosterCount}건</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 일별 신규 가입자 추이 — 7일 창, 화살표로 과거 구간 탐색 (통계요청 2-6번 항목) ── */}
      <div className="rounded-md border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">일별 신규 가입자 추이</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => setSignupOffset((o) => o + 1)}
                    className="rounded-md border border-border p-1 hover:bg-secondary">
              <ChevronLeft size={15} />
            </button>
            <span>{signup ? `${signup.windowStart} ~ ${signup.windowEnd}` : '—'}</span>
            <button onClick={() => setSignupOffset((o) => Math.max(0, o - 1))}
                    disabled={signupOffset === 0}
                    className="rounded-md border border-border p-1 hover:bg-secondary disabled:opacity-40">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={signup?.points ?? []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11}
                   tickFormatter={(d: string) => d.slice(5)} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
            <Tooltip formatter={(value: number) => [`${value}명`, '가입']} />
            <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}