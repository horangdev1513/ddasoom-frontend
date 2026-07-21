// 보호지역 시/도별 분포 표 — PDF 디자인 기준 (순위 / 시도명 / 건수 / 인라인 상대비율 막대).
import type { AnimalRegionCount } from '@/features/admin/api/statisticsApi';

export function RegionDistributionTable({ regions }: { regions: AnimalRegionCount[] }) {
  const max = regions.reduce((m, r) => Math.max(m, r.count), 0);

  if (regions.length === 0) {
    return <p className="text-sm text-muted-foreground">지역 데이터가 아직 없습니다.</p>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="grid grid-cols-[36px_88px_52px_1fr] items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
        <span className="text-center">순위</span>
        <span>시/도명</span>
        <span className="text-right">건수</span>
        <span>상대 비율</span>
      </div>
      {regions.map((r, i) => (
        <div
          key={r.region}
          className="grid grid-cols-[36px_88px_52px_1fr] items-center gap-2 border-b border-border px-3 py-1.5 text-sm last:border-b-0"
        >
          <span className="text-center font-bold text-muted-foreground">{i + 1}</span>
          <span className="truncate font-medium">{r.region}</span>
          <span className="text-right tabular-nums">{r.count}건</span>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[#8b5cf6]"
              style={{ width: max > 0 ? `${(r.count / max) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}