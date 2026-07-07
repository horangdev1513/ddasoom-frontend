import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

// 일반 사용자 레이아웃: Header + 콘텐츠(Outlet) + Footer 3단.
// 콘텐츠 영역은 각 라우트 페이지가 Outlet 자리에 렌더링한다.
export function UserLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
