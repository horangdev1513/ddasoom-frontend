import { createBrowserRouter } from 'react-router-dom';

import { UserLayout } from '@/shared/layouts/UserLayout';
import { AdminLayout } from '@/shared/layouts/AdminLayout';
import { RequireAuth } from '@/shared/components/common/RequireAuth';
import { RequireAdmin } from '@/shared/components/common/RequireAdmin';

import { MainPage } from '@/pages/MainPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import { SocialSignupPage } from '@/pages/auth/SocialSignupPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { RequireGuest } from '@/shared/components/common/RequireGuest';
import { SignupPage } from '@/pages/auth/SignupPage';
import { AnimalListPage } from '@/pages/animals/AnimalListPage';
import { AnimalDetailPage } from '@/pages/animals/AnimalDetailPage';
import { BoardListPage } from '@/pages/board/BoardListPage';
import { FosterApplyPage } from '@/pages/foster/FosterApplyPage';
import { MyPageLayout } from '@/pages/mypage/MyPageLayout';
import { ProfileTab } from '@/pages/mypage/ProfileTab';
import { LikedAnimalsTab } from '@/pages/mypage/LikedAnimalsTab';
import { FosterHistoryTab } from '@/pages/mypage/FosterHistoryTab';
import { MyPostsTab } from '@/pages/mypage/MyPostsTab';
import { MyCommentsTab } from '@/pages/mypage/MyCommentsTab';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminNoticeListPage } from '@/pages/admin/AdminNoticeListPage';
import { AdminNoticeFormPage } from '@/pages/admin/AdminNoticeFormPage';
import { AboutPage } from '@/pages/about/AboutPage';
import { GuidePage } from '@/pages/about/GuidePage';

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
      { path: 'about', element: <AboutPage /> },
      { path: 'guide', element: <GuidePage /> },
      { path: 'oauth/callback', element: <OAuthCallbackPage /> },   // 소셜 로그인 착지 (백엔드 SuccessHandler 리다이렉트 대상)
      { path: 'reset-password', element: <ResetPasswordPage /> },   // 비밀번호 재설정 메일 링크 착지
      {
        // GUEST 전용 — 소셜 가입 추가정보
        element: <RequireGuest />,
        children: [{ path: 'signup/social', element: <SocialSignupPage /> }],
      },
      { path: 'animals', element: <AnimalListPage /> },
      { path: 'animals/:id', element: <AnimalDetailPage /> },
      { path: 'board/:boardType', element: <BoardListPage /> }, // /board/info, /board/review
      {
        // USER 전용 가드
        element: <RequireAuth />,
        children: [
          { path: 'foster/apply/:animalId', element: <FosterApplyPage /> },
          {
            path: 'mypage',
            element: <MyPageLayout />,
            children: [
              { index: true, element: <ProfileTab /> },          // /mypage = 내 정보
              { path: 'likes', element: <LikedAnimalsTab /> },
              { path: 'fosters', element: <FosterHistoryTab /> },
              { path: 'posts', element: <MyPostsTab /> },
              { path: 'comments', element: <MyCommentsTab /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
      { path: 'forbidden', element: <ForbiddenPage /> }, // 403 리다이렉트
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
          { path: 'notices', element: <AdminNoticeListPage /> },
          { path: 'notices/new', element: <AdminNoticeFormPage /> },
          { path: 'notices/:noticeId/edit', element: <AdminNoticeFormPage /> },
          { path: '*', element: <AdminDashboardPage /> }, // /admin/** (관리 서브페이지 자리)
        ],
      },
    ],
  },
]);
