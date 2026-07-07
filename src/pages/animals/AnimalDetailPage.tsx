import { useParams } from 'react-router-dom';

// 유기동물 상세 페이지(placeholder) — features/animals 담당자가 구현.
// 라우트 파라미터(:id)가 잘 넘어오는지 확인용으로 노출.
export function AnimalDetailPage() {
  const { id } = useParams();
  return <p className="p-8 text-center">유기동물 상세 페이지 (id: {id}) — 준비 중입니다.</p>;
}
