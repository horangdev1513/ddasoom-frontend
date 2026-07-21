import { Link, useParams } from 'react-router-dom';
import { HandHeart, PawPrint } from 'lucide-react';
import { FosterApplicationForm } from '@/features/foster/components/FosterApplicationForm';
import { useAnimalDetailQuery } from '@/features/animals/hooks/useAnimalDetailQuery';
import { useMyPendingFosterApplication } from '@/features/foster/hooks/useMyPendingFosterApplication';
import { Button } from '@/shared/components/ui/button';

export function FosterApplyPage() {
  const { animalId: animalIdParam } = useParams();
  const animalId = Number(animalIdParam);
  const validAnimalId = Number.isSafeInteger(animalId) && animalId > 0;

  const {
    data: animal,
    isLoading: isAnimalLoading,
    isError: isAnimalError,
  } = useAnimalDetailQuery(animalId);

  const {
    data: pendingApplication,
    isLoading: isPendingApplicationLoading,
    isError: isPendingApplicationError,
  } = useMyPendingFosterApplication(animalId, validAnimalId);

  if (!validAnimalId) {
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

  if (isAnimalLoading || isPendingApplicationLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8">
          <p className="text-base text-muted-foreground">
            신청 정보를 확인 중입니다.
          </p>
        </section>
      </div>
    );
  }

  if (isAnimalError || !animal) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            동물 정보를 불러올 수 없습니다.
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
          <Button asChild className="mt-6">
            <Link to="/animals">동물 목록으로 돌아가기</Link>
          </Button>
        </section>
      </div>
    );
  }

  if (isPendingApplicationError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            신청 상태를 확인할 수 없습니다.
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            잠시 후 다시 시도해 주세요.
          </p>
          <Button asChild className="mt-6">
            <Link to={`/animals/${animalId}`}>동물 상세로 돌아가기</Link>
          </Button>
        </section>
      </div>
    );
  }

  if (pendingApplication?.hasPendingApplication) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            이미 검토 중인 임시보호 신청이 있습니다.
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            신청 내역에서 진행 상황을 확인해 주세요.
          </p>
          <Button asChild className="mt-6">
            <Link to="/mypage/fosters">신청 내역으로 이동</Link>
          </Button>
        </section>
      </div>
    );
  }

  if (animal.isFostered) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-secondary py-10">
        <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            이미 임시보호 중인 동물입니다.
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            현재는 새로운 임시보호 신청을 받을 수 없습니다.
          </p>
          <Button asChild className="mt-6">
            <Link to={`/animals/${animalId}`}>동물 상세로 돌아가기</Link>
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

        <section
          className="mb-8 flex gap-4 rounded-xl border border-border bg-secondary/50 p-4"
          aria-label="신청 동물 정보"
        >
          {animal.imageUrl ? (
            <img
              src={animal.imageUrl}
              alt={animal.nickname}
              className="h-24 w-24 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
              <PawPrint className="text-muted-foreground" size={32} />
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">신청 동물</p>
            <Link
              to={`/animals/${animal.animalId}`}
              className="mt-1 block truncate text-xl font-bold text-foreground hover:text-ring"
            >
              {animal.nickname}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {animal.typeName} · {animal.age}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              보호 장소: {animal.location}
            </p>
          </div>
        </section>

        <FosterApplicationForm animalId={animalId} />
      </section>
    </div>
  );
}