// 전역 헤더 — 아직 빈 껍데기.
// 로고 텍스트 + 네비게이션 자리 표시만. 실제 메뉴/스타일 구현은 담당자 몫(mainpage_v2 이식 금지).
export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-bold">따숨</span>
        <nav aria-label="주 메뉴">
            <ul className="flex items-center gap-4 text-sm text-muted-foreground">
            <li>메뉴 1</li>
            <li>메뉴 2</li>
            <li>메뉴 3</li>
            </ul>
          </nav>
      </div>
    </header>
  );
}
