import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/shared/components/ui/utils';
import { EDITOR_CONTENT_CLASS } from './editorConstants';

interface SafeHtmlViewerProps {
  html: string;
  className?: string;
}

// 저장된 공지/FAQ 본문(영구 URL + data-image-id)을 sanitize 후 렌더한다.
// 공지/FAQ 상세 조회와 에디터 저장본 미리보기에서 공용.
// ⚠️ data-image-id를 허용 속성에 반드시 등록한다 — 누락 시 속성이 소거되어 전체 설계가 무너진다.
export function SafeHtmlViewer({ html, className }: SafeHtmlViewerProps) {
  const clean = useMemo(() => DOMPurify.sanitize(html, { ADD_ATTR: ['data-image-id'] }), [html]);

  return (
    <div
      className={cn(EDITOR_CONTENT_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
