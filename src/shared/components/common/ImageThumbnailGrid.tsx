import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui/dialog';

// 첨부 이미지 열람용 썸네일 그리드 + 확대 뷰어.
// 썸네일 클릭 → Dialog로 원본 확대. (본문 삽입형 이미지는 SafeHtmlViewer가 담당 — 용도가 다르다.)
// ⚠️ url은 Presigned(30분 유효)라 오래 캐싱하지 않는다 — 상세 조회 응답에 실린 값을 그대로 쓴다.

interface ThumbnailImage {
  imageId: number;
  url: string;
}

interface ImageThumbnailGridProps {
  images: ThumbnailImage[];
}

export function ImageThumbnailGrid({ images }: ImageThumbnailGridProps) {
  const [openedUrl, setOpenedUrl] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {images.map((image) => (
          <li key={image.imageId}>
            <button
              type="button"
              aria-label="첨부 이미지 확대"
              onClick={() => setOpenedUrl(image.url)}
            >
              <img
                src={image.url}
                alt=""
                loading="lazy"
                className="size-24 cursor-zoom-in rounded-md border border-border object-cover transition-opacity hover:opacity-85"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={openedUrl != null} onOpenChange={(open) => !open && setOpenedUrl(null)}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          {/* Radix Dialog는 접근성상 Title이 필수 — 화면에는 노출하지 않는다. */}
          <DialogTitle className="sr-only">첨부 이미지 확대 보기</DialogTitle>
          {openedUrl && (
            <img
              src={openedUrl}
              alt=""
              className="max-h-[80vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
