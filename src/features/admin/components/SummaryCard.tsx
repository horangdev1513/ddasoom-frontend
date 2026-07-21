// 대시보드 처리대기 숫자 카드 — 클릭 시 해당 처리 화면으로 이동.
// "보기만 하는 대시보드 지양" — 모든 숫자는 클릭 가능한 진입점.

export function SummaryCard({
  label, value, loading, highlight, onClick,
}: {
  label: string;
  value: number | undefined;
  loading?: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border p-5 text-left transition-colors hover:bg-secondary ${
        highlight ? 'border-destructive/40' : ''
      }`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>
        {loading || value === undefined ? '—' : value.toLocaleString()}
      </p>
    </button>
  );
}