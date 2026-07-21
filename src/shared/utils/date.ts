// 날짜 표시 공용 유틸.
// ⚠️ features/board/util.ts에 동일 로직이 이미 존재한다(PostCard.tsx에도 로컬 사본).
//    board는 타 담당자 도메인이라 이번 작업에서 건드리지 않았다 — 별도 정리 작업에서 이 파일로 통합할 것.

/** LocalDateTime ISO 문자열(타임존 없음) → "2026.07.16" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** LocalDateTime ISO 문자열 → "2026.07.16 14:03" */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** LocalDate 백엔드 직렬화 배열([2026,7,21]) → "07.21" 축 라벨. null·문자열·배열 모두 안전 처리 */
export function formatLocalDateShort(date: [number, number, number] | string | null | undefined): string {
  if (date == null) return '';
  if (Array.isArray(date)) {
    const [, m, d] = date;
    return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
  }
  // 문자열 'yyyy-MM-dd' → 'MM.DD'
  return date.length >= 10 ? date.slice(5).replace('-', '.') : date;
}