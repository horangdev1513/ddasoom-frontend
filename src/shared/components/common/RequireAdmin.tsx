import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';

export function RequireAdmin() {
  const isAuthReady = useAuthStore((s) => s.isAuthReady);
  const user = useAuthStore((s) => s.user);

  if (!isAuthReady) {
    return (
      <div className="grid min-h-full place-items-center text-muted-foreground">로딩 중…</div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}