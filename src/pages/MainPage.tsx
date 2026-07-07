// 메인 페이지(`/`) — 콘텐츠 영역은 의도적으로 비워 둔다.
// Header/Footer는 UserLayout이 제공하고, 이 자리는 담당자가 배너·카드·후기 등 실제 콘텐츠를 채운다.
// ⚠️ mainpage_v2의 더미 데이터(ANIMAL_CARDS, REVIEWS 등)나 섹션을 이식하지 않는다.
export function MainPage() {
  return <section aria-label="메인 콘텐츠 영역">{/* 담당자 콘텐츠 자리 (비워 둠) */}</section>;
}
