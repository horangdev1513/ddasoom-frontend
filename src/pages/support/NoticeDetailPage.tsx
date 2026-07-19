import { useNavigate, useParams } from 'react-router-dom';
import { useNotice } from '@/features/support/hooks/useNotices';
import { SafeHtmlViewer } from '@/shared/components/editor';
import { Button } from '@/shared/components/ui/button';

export function NoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams<{ noticeId: string }>();
  const parsedId = noticeId != null ? Number(noticeId) : null;

  const { data, isLoading, isError } = useNotice(parsedId);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  // 존재하지 않거나 비노출/삭제 공지 → 백엔드 404(SUPPORT_001)
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="p-8 text-center text-muted-foreground">공지사항을 찾을 수 없습니다.</div>
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => navigate('/support/notices')}>
            목록으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">{data.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{data.createdAt.slice(0, 10)}</p>

      {/* content는 HTML 문자열 — SafeHtmlViewer가 sanitize + data-image-id 허용 후 렌더 */}
      <SafeHtmlViewer html={data.content} className="min-h-40 border-t pt-6" />

      <div className="mt-8 flex justify-center">
        <Button variant="outline" onClick={() => navigate('/support/notices')}>
          목록으로
        </Button>
      </div>
    </div>
  );
}
