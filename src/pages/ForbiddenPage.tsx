import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

// 403 전용 안내 페이지 — axiosInstance가 403 응답을 감지하면 여기로 리다이렉트.
// 401(로그인하면 풀림)과 달리 403은 재시도로 해결되지 않는 최종 상태이므로 재발급 흐름을 타지 않는다.
export function ForbiddenPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 bg-secondary text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert size={28} className="text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">접근 권한이 없어요</h1>
      <p className="max-w-sm text-base text-muted-foreground">
        이 페이지를 이용할 수 있는 권한이 없어요. 잘못 들어오셨다면 홈으로 돌아가 주세요.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-xl bg-ring px-6 py-2.5 text-base font-bold text-white transition-all hover:brightness-105"
      >
        홈으로 가기
      </Link>
    </div>
  );
}