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
import { AdminMemberListPage } from '@/pages/admin/AdminMemberListPage';
import { AdminMemberDetailPage } from '@/pages/admin/AdminMemberDetailPage';
import { AdminStatisticsPage } from '@/pages/admin/AdminStatisticsPage';
import { AdminFaqListPage } from '@/pages/admin/AdminFaqListPage';
import { AdminFaqFormPage } from '@/pages/admin/AdminFaqFormPage';
import { AdminQnaListPage } from '@/pages/admin/AdminQnaListPage';
import { AdminQnaDetailPage } from '@/pages/admin/AdminQnaDetailPage';
import { AdminReportListPage } from '@/pages/admin/AdminReportListPage';
import { AdminReportDetailPage } from '@/pages/admin/AdminReportDetailPage';
import { QnaListPage } from '@/pages/qna/QnaListPage';
import { QnaWritePage } from '@/pages/qna/QnaWritePage';
import { QnaDetailPage } from '@/pages/qna/QnaDetailPage';
import { AboutPage } from '@/pages/about/AboutPage';
import { GuidePage } from '@/pages/about/GuidePage';
import { NoticeListPage } from '@/pages/support/NoticeListPage';
import { NoticeDetailPage } from '@/pages/support/NoticeDetailPage';
import { FaqListPage } from '@/pages/support/FaqListPage';
import { FaqDetailPage } from '@/pages/support/FaqDetailPage';
import { PostDetailPage } from '@/pages/board/PostDetailPage';
import { FosterDetailPage } from '@/pages/foster/FosterDetailPage';
import { FosterEditPage } from '@/pages/foster/FosterEditPage';
import { AdminFosterListPage } from '@/pages/admin/AdminFosterListPage';
import { AdminFosterApplicationDetailPage } from '@/pages/admin/AdminFosterApplicationDetailPage';
import { AdminFosterProgressDetailPage } from '@/pages/admin/AdminFosterProgressDetailPage';
import { AdminFosterApplicationEditPage } from '@/pages/admin/AdminFosterApplicationEditPage';
import { AdminFosterProgressEditPage } from '@/pages/admin/AdminFosterProgressEditPage';
import { PostWritePage } from '@/pages/board/PostWritePage';
import { AdminPostListPage } from '@/pages/admin/AdminPostListPage';
import { AdminPostDetailPage } from '@/pages/admin/AdminPostDetailPage';

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
      { path: 'oauth/callback', element: <OAuthCallbackPage /> }, // 소셜 로그인 착지 (백엔드 SuccessHandler 리다이렉트 대상)
      { path: 'reset-password', element: <ResetPasswordPage /> }, // 비밀번호 재설정 메일 링크 착지
      {
        // GUEST 전용 — 소셜 가입 추가정보
        element: <RequireGuest />,
        children: [{ path: 'signup/social', element: <SocialSignupPage /> }],
      },
      { path: 'animals', element: <AnimalListPage /> },
      { path: 'animals/:id', element: <AnimalDetailPage /> },
      { path: 'board/:boardType', element: <BoardListPage /> }, // /board/info, /board/review
      { path: 'board/:boardType/:postId', element: <PostDetailPage /> },
      { path: 'support/notices', element: <NoticeListPage /> }, // 공지사항 목록 (공개)
      { path: 'support/notices/:noticeId', element: <NoticeDetailPage /> }, // 공지사항 상세 (공개)
      { path: 'support/faqs', element: <FaqListPage /> }, // FAQ 목록 (공개)
      { path: 'support/faqs/:faqId', element: <FaqDetailPage /> }, // FAQ 상세 (공개)
      {
        // USER 전용 가드
        element: <RequireAuth />,
        children: [
          { path: 'foster/apply/:animalId', element: <FosterApplyPage /> },
          {
            path: 'mypage',
            element: <MyPageLayout />,
            children: [
              { index: true, element: <ProfileTab /> }, // /mypage = 내 정보
              { path: 'likes', element: <LikedAnimalsTab /> },
              { path: 'fosters', element: <FosterHistoryTab /> },
              { path: 'fosters/:fosterId/edit', element: <FosterEditPage /> },
              { path: 'fosters/:fosterId', element: <FosterDetailPage /> },
              { path: 'posts', element: <MyPostsTab /> },
              { path: 'comments', element: <MyCommentsTab /> },
            ],
          },
          // 게시판 공통 작성/수정 — 'write'는 정적 세그먼트라 공개 상세(:postId)보다 우선 매칭
          { path: 'board/:boardType/write', element: <PostWritePage /> },
          { path: 'board/:boardType/:postId/edit', element: <PostWritePage /> }, // 작성 페이지 겸용(수정 모드)

          // ===== QNA — 1:1 문의 (이서진) =======
          // 공지/FAQ와 같은 support/ 하위 경로(헤더·푸터 '고객센터' 메뉴와 정합).
          // 단, 공지/FAQ와 달리 로그인 필수라 RequireAuth 안에 둔다.
          { path: 'support/qnas', element: <QnaListPage /> },
          { path: 'support/qnas/new', element: <QnaWritePage /> },
          { path: 'support/qnas/:qnaId', element: <QnaDetailPage /> },
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
          { index: true, element: <AdminDashboardPage /> }, // /대시보드
          // ===== 공지사항 (이서진) =======
          { path: 'notices', element: <AdminNoticeListPage /> },
          { path: 'notices/new', element: <AdminNoticeFormPage /> },
          { path: 'notices/:noticeId/edit', element: <AdminNoticeFormPage /> },
          // ===== FAQ (이서진) =======
          { path: 'faqs', element: <AdminFaqListPage /> },
          { path: 'faqs/new', element: <AdminFaqFormPage /> },
          { path: 'faqs/:faqId/edit', element: <AdminFaqFormPage /> },
          // ===== QNA (이서진) =======
          { path: 'qnas', element: <AdminQnaListPage /> },
          { path: 'qnas/:qnaId', element: <AdminQnaDetailPage /> },
          // ===== 신고 관리 (이서진) =======
          { path: 'reports', element: <AdminReportListPage /> },
          { path: 'reports/:reportId', element: <AdminReportDetailPage /> },

          // ===== 유저 관리 (구지훈) =======
          { path: 'members', element: <AdminMemberListPage /> },
          { path: 'members/:memberId', element: <AdminMemberDetailPage /> },
          // ===== 통계 (구지훈) =======
          { path: 'statistics', element: <AdminStatisticsPage /> },

          // ===== 임시보호 신청 관리 (김경우) =======
          {
            path: 'fosters',
            element: (
              <AdminFosterListPage
                key='application-foster-list'
                scope='APPLICATION'
              />
            ),
          },
          {
            path: 'fosters/:fosterId/edit',
            element: <AdminFosterApplicationEditPage />,
          },
          {
            path: 'fosters/:fosterId',
            element: <AdminFosterApplicationDetailPage />,
          },
          {
            path: 'active-fosters',
            element: (
              <AdminFosterListPage
                key='progress-foster-list'
                scope='PROGRESS'
              />
            ),
          },
          {
            path: 'active-fosters/:fosterId/edit',
            element: <AdminFosterProgressEditPage />,
          },
          {
            path: 'active-fosters/:fosterId',
            element: <AdminFosterProgressDetailPage />,
          },
          // ===== 게시글 관리 (유창호) =======
          { path: 'posts', element: <AdminPostListPage /> },
          { path: 'posts/:postId', element: <AdminPostDetailPage /> },

          // ===== 유기동물 동기화 (김종식) - 대시보드 우측 상단 버튼으로 이동, 별도 라우트 없음 =======

          { path: '*', element: <AdminDashboardPage /> }, // /admin/** (관리 서브페이지 자리)
        ],
      },
    ],
  },
]);
