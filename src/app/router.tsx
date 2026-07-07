import { createBrowserRouter } from 'react-router-dom';

import { UserLayout } from '@/shared/layouts/UserLayout';
import { AdminLayout } from '@/shared/layouts/AdminLayout';
import { RequireAuth } from '@/shared/components/common/RequireAuth';
import { RequireAdmin } from '@/shared/components/common/RequireAdmin';

import { MainPage } from '@/pages/MainPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { AnimalListPage } from '@/pages/animals/AnimalListPage';
import { AnimalDetailPage } from '@/pages/animals/AnimalDetailPage';
import { BoardListPage } from '@/pages/board/BoardListPage';
import { FosterApplyPage } from '@/pages/foster/FosterApplyPage';
import { MyPage } from '@/pages/mypage/MyPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';

// 전체 라우트 정의(단일 파일에서 관리). 역할별 라우트를 한곳에 모아 등록한다.
// 현재는 경로 등록 + placeholder 페이지 연결까지만. 각 페이지 실제 구현은 도메인 담당자 몫.
export const router = createBrowserRouter([
  {
    // 일반 사용자 영역: Header/Footer 포함 UserLayout
    element: <UserLayout />,
    children: [
      { index: true, element: <MainPage /> }, // `/`
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'animals', element: <AnimalListPage /> },
      { path: 'animals/:id', element: <AnimalDetailPage /> },
      { path: 'board/:boardType', element: <BoardListPage /> }, // /board/info, /board/review
      {
        // USER 전용 가드
        element: <RequireAuth />,
        children: [
          { path: 'foster/apply/:animalId', element: <FosterApplyPage /> },
          { path: 'mypage', element: <MyPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // 관리자 로그인은 공개(가드/AdminLayout 밖)
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    // 관리자 영역: ADMIN 가드 → AdminLayout
    path: '/admin',
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> }, // /admin
          { path: '*', element: <AdminDashboardPage /> }, // /admin/** (관리 서브페이지 자리)
        ],
      },
    ],
  },
]);
