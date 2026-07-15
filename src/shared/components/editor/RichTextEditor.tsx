import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { toast } from 'sonner';
import { cn } from '@/shared/components/ui/utils';
import { DeferredImage } from './DeferredImage';
import { EditorToolbar } from './EditorToolbar';
import { extractImageIds } from './extractImageIds';
import { getImageErrorMessage } from './editorImageApi';
import { uploadPendingImages } from './uploadPendingImages';
import { useDeferredImageUpload } from './useDeferredImageUpload';
import { pendingImageDb } from './pendingImageDb';
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPT_ATTR,
  EDITOR_CONTENT_CLASS,
  PENDING_IMAGE_TTL_MS,
  type OwnerType,
} from './editorConstants';

// 저장 페이로드 — 페이지의 공지/FAQ 저장 mutation이 그대로 전송한다.
export interface EditorPayload {
  html: string;
  imageIds: number[]; // 본문 등장 순서 = image_order
}

// 페이지가 ref로 접근하는 명령형 핸들.
export interface RichTextEditorHandle {
  // 미업로드 이미지를 업로드하고 확정 HTML + imageIds를 반환. 실패 시 reject.
  getPayload: () => Promise<EditorPayload>;
  // 저장 성공 후 호출 — 임시 blob(IndexedDB) 삭제 + objectURL revoke.
  cleanup: () => Promise<void>;
}

interface RichTextEditorProps {
  ownerType: OwnerType;
  initialHtml?: string; // 수정 화면 진입 시 서버 HTML(영구 URL + data-image-id)
  placeholder?: string;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  function RichTextEditor({ ownerType, initialHtml = '', placeholder = '내용을 입력하세요' }, ref) {
    const { insertFiles, revokeObjectUrls, cleanup } = useDeferredImageUpload(ownerType);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<Editor | null>(null);

    // 붙여넣기/드롭 이벤트에서 이미지 파일 추출 → 삽입. 처리했으면 true(기본 동작 차단).
    const handleFilesFromDataTransfer = useCallback(
      (dt: DataTransfer | null): boolean => {
        if (!dt) return false;
        const files = Array.from(dt.files).filter((f) =>
          (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type),
        );
        if (files.length === 0) return false;
        if (editorRef.current) void insertFiles(editorRef.current, files);
        return true;
      },
      [insertFiles],
    );

    const editor = useEditor({
      extensions: [
        // StarterKit v3에 Link/리스트가 포함되므로 별도 extension-link를 추가하지 않는다(중복 등록 방지).
        StarterKit.configure({ link: { openOnClick: false } }),
        Placeholder.configure({ placeholder }),
        DeferredImage,
      ],
      content: initialHtml,
      editorProps: {
        attributes: { class: 'focus:outline-none min-h-[280px]' },
        handlePaste: (_view, event) => handleFilesFromDataTransfer(event.clipboardData),
        handleDrop: (_view, event) => handleFilesFromDataTransfer((event as DragEvent).dataTransfer),
      },
    });

    editorRef.current = editor;

    // 마운트: 이전 세션의 오래된 미저장 blob 정리(흐름 ④). 언마운트: objectURL revoke.
    useEffect(() => {
      pendingImageDb.deleteOlderThan(PENDING_IMAGE_TTL_MS).catch(() => {});
      return () => revokeObjectUrls();
    }, [revokeObjectUrls]);

    useImperativeHandle(
      ref,
      () => ({
        getPayload: async () => {
          if (!editor) throw new Error('에디터가 초기화되지 않았습니다');
          try {
            await uploadPendingImages(editor, ownerType);
          } catch (err) {
            // 서버 에러코드(uploadPendingImages가 보존한 .code) → 사용자 안내 문구로 매핑해 노출.
            toast.error(getImageErrorMessage((err as { code?: string })?.code));
            throw err;
          }
          const html = editor.getHTML();
          // 방어 assert — 이 시점 HTML엔 blob URL / data-local-id가 남아있으면 안 된다.
          if (html.includes('blob:') || html.includes('data-local-id')) {
            throw new Error('업로드되지 않은 이미지가 본문에 남아 있습니다');
          }
          return { html, imageIds: extractImageIds(editor) };
        },
        cleanup: async () => {
          await cleanup();
        },
      }),
      [editor, ownerType, cleanup],
    );

    const openFilePicker = () => fileInputRef.current?.click();

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      if (files.length > 0 && editor) void insertFiles(editor, files);
      event.target.value = ''; // 같은 파일 재선택 허용
    };

    return (
      <div className="rounded-md border border-border bg-background">
        <EditorToolbar editor={editor} onInsertImage={openFilePicker} />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <EditorContent
          editor={editor}
          className={cn(
            EDITOR_CONTENT_CLASS,
            'max-h-[600px] overflow-y-auto px-4 py-3',
            // 빈 상태 placeholder (Placeholder 확장이 붙이는 data-placeholder 사용)
            '[&_p.is-editor-empty:first-child]:before:pointer-events-none',
            '[&_p.is-editor-empty:first-child]:before:float-left',
            '[&_p.is-editor-empty:first-child]:before:h-0',
            '[&_p.is-editor-empty:first-child]:before:text-muted-foreground',
            "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          )}
        />
      </div>
    );
  },
);
