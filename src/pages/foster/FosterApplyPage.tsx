import { useParams } from 'react-router-dom';

// 임시보호 신청서 작성 페이지(placeholder, USER 전용) — features/foster 담당자가 구현.
export function FosterApplyPage() {
  const { animalId } = useParams();
  return (
    <p className="p-8 text-center">임시보호 신청 페이지 (animalId: {animalId}) — 준비 중입니다.</p>
  );
}
