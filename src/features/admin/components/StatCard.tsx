// 통계 상단 숫자 카드 — 클릭 이동 없는 순수 지표 표시용 (대시보드의 SummaryCard와 용도 구분).
import type { ReactNode } from 'react';

export function StatCard({
  label, value, hint,
}: {
  label: string;
  value: ReactNode;   // 문자열 또는 커스텀 노드(승인율/반려율 색 분리 등)
  hint?: string;
}) {
  return (
    <div className="rounded-md border p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}