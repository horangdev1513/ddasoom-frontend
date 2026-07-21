import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useAdminAnimalSync } from '@/features/admin/hooks/useAdminAnimalSync';

// 유기동물 공공 API 동기화 트리거 버튼 (대시보드 우상단).
// 실제 동기화 호출·성공/실패 토스트는 useAdminAnimalSync 훅이 담당한다.
// 동기화는 전 페이지 순회 upsert라 수 분 걸릴 수 있어(동기 응답), 진행 중엔 버튼을 잠근다.
export function AnimalSyncButton() {
  const { mutate, isPending } = useAdminAnimalSync();

  return (
    <Button
      onClick={() => mutate()}
      disabled={isPending}
      size="lg"
      className="h-12 gap-2 px-6 text-base font-semibold"
    >
      <RefreshCw size={18} className={isPending ? 'animate-spin' : ''} />
      {isPending ? '동기화 중…' : '유기동물 정보 동기화'}
    </Button>
  );
}