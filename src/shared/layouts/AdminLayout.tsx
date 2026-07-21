import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import { cn } from '@/shared/components/ui/utils';
import { Flag } from 'lucide-react';

// 관리자 사이드바 메뉴 정의 — 새 관리 페이지 추가 시 여기에 한 줄만 추가
const MENU_ITEMS = [
  { label: '대시보드', path: '/admin' },
  { label: '통계', path: '/admin/statistics' },
  { label: '공지사항', path: '/admin/notices' },
  { label: 'FAQ', path: '/admin/faqs' },
  { label: 'QnA', path: '/admin/qnas' },
  { label: '유저 관리', path: '/admin/members' },
  { label: '게시글 관리', path: '/admin/posts' },
  { label: '댓글 관리', path: '/admin/comments' },
  { label: '임시보호 신청 관리', path: '/admin/fosters' },
  { label: '임시보호 중 관리', path: '/admin/active-fosters' },
  { label: '신고 관리', path: '/admin/reports', icon: Flag },
] as const;

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className='flex min-h-screen'>
      {/* 사이드바 — 다크 네이비 */}
      <aside className='flex w-56 flex-col bg-slate-900 text-slate-100'>
        <div className='border-b border-slate-700 px-6 py-5'>
          <span className='text-lg font-semibold'>따숨 관리자</span>
        </div>

        <nav className='flex-1 px-3 py-4'>
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              // 대시보드(/admin)만 정확 매칭, 나머지는 하위 경로 포함
              end={item.path === '/admin'}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-slate-700 font-medium text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className='border-t border-slate-700 px-6 py-4 text-sm text-slate-400'>
          {user?.nickname ?? '관리자'}님
        </div>
      </aside>

      {/* 본문 영역 */}
      <main className='flex-1 bg-slate-50'>
        <Outlet />
      </main>
    </div>
  );
}
