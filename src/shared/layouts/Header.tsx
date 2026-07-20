import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/shared/stores/authStore';
import { logout } from '@/features/auth/api/authApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';

// 전역 헤더 — 피그마 메인 디자인의 메가메뉴 구조를 프로젝트 컨벤션(테마 토큰)으로 재구현.
// 네비 메뉴 정의 — 하위 경로는 각 도메인 담당자와 협의된 확정 경로.
// ⚠️ 고객센터 하위 3개(공지/FAQ/1:1 문의)는 모두 라우트 등록 완료 — 여기 경로를 바꾸면 router.tsx도 함께 수정할 것.
const NAV_MENUS = [
  {
    label: '유기동물',
    items: [{ label: '보호 동물 찾기', to: '/animals' }],
  },
  {
    label: '임시보호',
    items: [
      { label: '신청 내역', to: '/mypage/fosters' },
    ],
  },
  {
    label: '펫 커뮤니티',
    items: [
      { label: '고양이', to: '/board/cat-info' },
      { label: '강아지', to: '/board/dog-info' },
      { label: '입양 후기', to: '/board/review' },
    ],
  },
  {
    label: '고객센터',
    items: [
      { label: '공지사항', to: '/support/notices' },
      { label: 'FAQ', to: '/support/faqs' },
      { label: '1:1 문의', to: '/support/qnas' },
    ],
  },
  {
    label: '따숨 소개',
    items: [
      { label: '따숨 이야기', to: '/about' },
      { label: '이용 안내', to: '/guide' },
    ],
  },
];

// 3존 고정폭 — 상단바와 드롭다운 패널이 같은 값을 공유해야 컬럼이 어긋나지 않는다
const LOGO_W = 'w-36';
const AUTH_W = 'w-74';

export function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const user = useAuthStore((s) => s.user);

  const open = (label: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setActiveMenu(label);
  };
  // 바로 닫으면 메뉴→패널 이동 중 깜빡임 — 120ms 유예 (피그마 원본 UX 유지)
  const close = () => {
    leaveTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };
  const keep = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  return (
    <header
      className='sticky top-0 z-50 border-b border-border bg-white/95 shadow-sm backdrop-blur'
      onMouseLeave={close}
    >
      {/* ── 상단바 ── */}
      <div className='mx-auto flex h-16 max-w-6xl items-center px-6'>
        {/* 로고 */}
        <Link to='/' className={`${LOGO_W} flex shrink-0 items-center gap-2`}>
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
            <PawPrint size={15} className='text-white' />
          </div>
          {/* [타이포] text-lg → text-xl (로고도 한 단계 상향) */}
          <span className='text-xl font-bold text-primary'>따숨</span>
        </Link>

        {/* 네비 — 4등분, hover 시 메가 드롭다운 */}
        <nav
          className='hidden h-16 flex-1 items-stretch md:flex'
          aria-label='주 메뉴'
        >
          {NAV_MENUS.map((menu) => {
            const isActive = activeMenu === menu.label;
            return (
              <button
                key={menu.label}
                onMouseEnter={() => open(menu.label)}
                // [타이포] text-sm → text-base
                className={`relative flex flex-1 items-center justify-center text-base font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-foreground'
                }`}
              >
                {menu.label}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] w-full bg-primary transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* 인증 영역 — 로그인 상태 분기 (GUEST는 USER와 다른 UI) */}
        <div
          className={`hidden ${AUTH_W} shrink-0 items-center justify-end gap-2 md:flex`}
        >
          {!user ? (
            <GuestMenu />
          ) : user.role === 'GUEST' ? (
            <IncompleteMenu />
          ) : (
            <UserMenu nickname={user.nickname} role={user.role} />
          )}
        </div>
      </div>

      {/* ── 메가 드롭다운 패널 — 상단바와 동일 3존 구조 ── */}
      {activeMenu && (
        <div
          className='absolute left-0 w-full border-t border-border bg-white'
          onMouseEnter={keep}
        >
          <div className='mx-auto flex max-w-6xl px-6 py-8'>
            <div className={`${LOGO_W} shrink-0`} />
            <div className='flex flex-1'>
              {NAV_MENUS.map((menu) => (
                <div
                  key={menu.label}
                  className='flex flex-1 flex-col items-center gap-1 border-r border-border px-4 last:border-r-0'
                >
                  {menu.items.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setActiveMenu(null)}
                      // [타이포] text-sm → text-base
                      className={`w-full rounded-lg py-2.5 text-center text-base transition-colors hover:bg-secondary hover:text-primary ${
                        menu.label === activeMenu
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <div className={`${AUTH_W} shrink-0`} />
          </div>
        </div>
      )}
    </header>
  );
}

/** 비로그인: 로그인 / 회원가입 버튼 */
function GuestMenu() {
  return (
    <>
      {/* [타이포] size="sm" 제거 — 기본 크기 버튼으로 상향 */}
      <Button variant='outline' className='rounded-full' asChild>
        <Link to='/login'>로그인</Link>
      </Button>
      <Button className='rounded-full' asChild>
        <Link to='/signup'>회원가입</Link>
      </Button>
    </>
  );
}

/** 로그인: 닉네임(마이페이지 링크) + 로그아웃(확인 모달) */
function UserMenu({
  nickname,
  role,
}: {
  nickname: string;
  role: 'USER' | 'ADMIN';
}) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await logout(); // RT 쿠키 삭제·블랙리스트는 서버 담당
    } catch {
      // 이미 만료된 세션 등으로 실패해도 클라이언트 상태는 정리한다 — 로그아웃은 실패해도 로그아웃
    } finally {
      clearAuth();
      toast.success('로그아웃 되었습니다.');
      navigate('/');
    }
  };

  return (
    <>
      <span className='min-w-0 truncate whitespace-nowrap text-base font-medium text-foreground'>
        {nickname}님
      </span>
      <Button
        variant='outline'
        size='sm'
        className='shrink-0 rounded-full'
        asChild
      >
        <Link to={role === 'ADMIN' ? '/admin' : '/mypage'}>
          {role === 'ADMIN' ? '관리자페이지' : '마이페이지'}
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant='outline' size='sm' className='shrink-0 rounded-full'>
            로그아웃
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃 하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              다시 로그인하면 언제든 이어서 이용할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** GUEST(소셜 가입 미완료): 닉네임 대신 "추가정보 입력 필요" 안내 배지 + 로그아웃 */
function IncompleteMenu() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // 로그아웃은 실패해도 로그아웃
    } finally {
      clearAuth();
      navigate('/');
    }
  };

  return (
    <>
      <button
        onClick={() => navigate('/signup/social')}
        className='flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary/15 px-3.5 py-2 text-sm font-semibold text-ring transition-colors hover:bg-primary/25'
      >
        <AlertCircle size={14} className='shrink-0' />
        추가정보 입력 필요
      </button>
      <Button
        variant='outline'
        size='sm'
        className='shrink-0 rounded-full'
        onClick={handleLogout}
      >
        로그아웃
      </Button>
    </>
  );
}
