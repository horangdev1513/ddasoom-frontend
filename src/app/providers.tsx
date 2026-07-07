import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 앱 전역 프로바이더.
// 현재는 서버 상태(TanStack Query) 프로바이더 골격만. RouterProvider 등은 추후 추가.
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
