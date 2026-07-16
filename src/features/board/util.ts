// features/board 표시용 유틸.
// (PostCard.tsx의 로컬 formatDate와 동일 로직 — 기존 코드는 건드리지 않고,
//  상세/댓글에서 시간 표시(formatDateTime)가 추가로 필요해 여기로 모음.
//  PostCard 쪽 통합은 별도 정리 작업에서.)

/** LocalDateTime ISO 문자열(타임존 없음) → "2026.07.16" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** LocalDateTime ISO 문자열 → "2026.07.16 14:03" (댓글용) */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
