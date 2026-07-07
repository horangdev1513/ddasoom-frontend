import { useParams } from 'react-router-dom';

// 게시판 페이지(placeholder) — features/board 담당자가 구현.
// 정보교환(info)/입양후기(review)를 boardType 파라미터로 분기(board 도메인 하나로 통합).
export function BoardListPage() {
  const { boardType } = useParams();
  return <p className="p-8 text-center">게시판 페이지 (boardType: {boardType}) — 준비 중입니다.</p>;
}
