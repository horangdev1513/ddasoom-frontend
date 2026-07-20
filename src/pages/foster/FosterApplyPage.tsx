import { Link, useParams } from 'react-router-dom';
import { HandHeart } from 'lucide-react';
import { FosterApplicationForm } from '@/features/foster/components/FosterApplicationForm';
import { Button } from '@/shared/components/ui/button';

export function FosterApplyPage() {
  const { animalId: animalIdParam } = useParams();
  const animalId = Number(animalIdParam);

  if (!Number.isSafeInteger(animalId) || animalId <= 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">잘못된 신청 경로입니다.</h1>
          <p className="mt-2 text-base text-muted-foreground">
            임시보호를 신청할 동물 정보를 확인할 수 없습니다.
          </p>
          <Button asChild className="mt-6">
            <Link to="/animals">동물 목록으로 돌아가기</Link>
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <HandHeart className="text-ring" size={26} />
            <h1 className="text-2xl font-bold text-foreground">임시보호 신청</h1>
          </div>
          <p className="mt-2 text-base text-muted-foreground">
            신청 내용을 확인한 뒤 담당자가 안내해 드립니다.
          </p>
        </div>

        <FosterApplicationForm animalId={animalId} />
      </section>
    </div>
  );
}