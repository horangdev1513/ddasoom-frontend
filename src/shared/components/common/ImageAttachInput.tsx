import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  uploadImage,
  ImageUploadError,
  getImageErrorMessage,
  type UploadedImage,
} from '@/shared/components/editor/editorImageApi';
import {
  ACCEPT_ATTR,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  type OwnerType,
} from '@/shared/components/editor/editorConstants';

// 첨부형 이미지 업로드 입력.
// 에디터(shared/components/editor)의 "본문 삽입 + 저장 시 일괄 업로드" 방식과 달리,
// 파일 선택 즉시 POST /api/images로 업로드하고 imageId를 상위로 올리는 "선업로드 후 연결" 방식이다.
// 업로드 API·검증 상수·에러 문구는 에디터 모듈을 그대로 재사용한다(중복 구현 금지).

interface ImageAttachInputProps {
  // 백엔드 OwnerType — 질문 첨부는 'QNA', 코멘트 첨부는 'QNA_COMMENT'
  ownerType: OwnerType;
  // 업로드 완료된 이미지 목록 (상위가 state로 보유 → 저장 시 imageIds로 전송)
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  // 소유자당 첨부 상한 — 백엔드 IMAGE_003과 일치해야 함
  maxImages: number;
  disabled?: boolean;
}

export function ImageAttachInput({
  ownerType,
  value,
  onChange,
  maxImages,
  disabled = false,
}: ImageAttachInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 서버와 동일한 기준으로 1차 검증 — 불필요한 업로드 왕복을 줄인다.
  const validate = (file: File): string | null => {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return '지원하지 않는 형식입니다. jpg, png, gif, webp만 가능합니다.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return '이미지 용량은 10MB 이하만 가능합니다.';
    }
    return null;
  };

  const handleFilesSelected = async (fileList: FileList) => {
    const files = Array.from(fileList);
    // 입력값을 먼저 비워 같은 파일을 연속 선택해도 change 이벤트가 발생하게 한다.
    if (inputRef.current) inputRef.current.value = '';

    if (value.length + files.length > maxImages) {
      toast.error(`이미지는 최대 ${maxImages}장까지 첨부할 수 있습니다.`);
      return;
    }

    setIsUploading(true);
    // 순차 업로드 — 성공분은 즉시 반영해, 중간 실패 시에도 앞서 올라간 이미지를 잃지 않는다.
    const uploaded: UploadedImage[] = [];
    try {
      for (const file of files) {
        const invalidMessage = validate(file);
        if (invalidMessage) {
          toast.error(invalidMessage);
          continue;
        }
        try {
          uploaded.push(await uploadImage(file, ownerType));
        } catch (err) {
          const code = err instanceof ImageUploadError ? err.code : undefined;
          toast.error(getImageErrorMessage(code));
          break; // 이후 파일도 같은 이유로 실패할 가능성이 높다 — 토스트 연발 방지
        }
      }
    } finally {
      setIsUploading(false);
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    }
  };

  const handleRemove = (imageId: number) => {
    // 서버에서 즉시 삭제하지 않는다 — 첨부 목록에서 빼면 저장 시 imageIds에 포함되지 않아
    // 백엔드가 미연결 이미지로 정리한다(공지/게시글과 동일한 처리).
    onChange(value.filter((image) => image.imageId !== imageId));
  };

  const isFull = value.length >= maxImages;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading || isFull}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {isUploading ? '업로드 중…' : '이미지 첨부'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {value.length} / {maxImages}장 · 파일당 10MB 이하
        </span>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((image) => (
            <li key={image.imageId} className="relative">
              <img
                src={image.url}
                alt=""
                className="size-20 rounded-md border border-border object-cover"
              />
              <button
                type="button"
                aria-label="첨부 이미지 삭제"
                disabled={disabled}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-foreground/80 p-0.5 text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                onClick={() => handleRemove(image.imageId)}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
