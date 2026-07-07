import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { Providers } from '@/app/providers';
import { bootstrapAuth } from '@/app/bootstrap';
import '@/styles/index.css';

// 부팅 시 인증 상태 복원(reissue 1회). 실패는 비로그인으로 정상 처리한다.
void bootstrapAuth();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
