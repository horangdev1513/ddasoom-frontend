import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';

// ADMIN 권한 가드(/admin, /admin/** 관리자 경로).
// isAuthReady 이전에는 판단 금지 → 부트스트랩 완료 전에는 스피너만. 판단은 authStore.user.role 로만.
export function RequireAdmin() {
  const isAuthReady = useAuthStore((s) => s.isAuthReady);

  if (!isAuthReady) {
    return (
      <div className="grid min-h-full place-items-center text-muted-foreground">로딩 중…</div>
    );
  }

  // TODO(백엔드 로그인/reissue API 확정 후): role !== 'ADMIN' 이면 리다이렉트.
  //   const user = useAuthStore.getState().user;
  //   if (!user) return <Navigate to="/admin/login" replace />;
  //   if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  // 지금은 가드 자리만 만들고 실제 리다이렉트는 보류.
  return <Outlet />;
}
