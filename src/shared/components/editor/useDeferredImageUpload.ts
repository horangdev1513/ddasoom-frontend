import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Editor } from '@tiptap/react';
import { pendingImageDb } from './pendingImageDb';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_IMAGES,
  type OwnerType,
} from './editorConstants';

// 지연 업로드 삽입 흐름(흐름 ①)과 정리(흐름 ④)를 담당하는 훅.
// - insertFiles: 1차 검증 → IndexedDB에 blob 저장 → objectURL 생성 → 노드 삽입
// - revokeObjectUrls: 언마운트 시 생성한 objectURL 전부 revoke (IDB 항목은 유지 → TTL 정리 대상)
// - cleanup: 저장 성공 후 삽입했던 blob의 IDB 항목 삭제 + objectURL revoke
//
// ownerType는 향후 확장 여지를 위해 받아두지만 삽입 단계에서는 검증에만 쓰인다(업로드는 저장 시점).
export function useDeferredImageUpload(_ownerType: OwnerType) {
  const objectUrlsRef = useRef<string[]>([]);
  const insertedLocalIdsRef = useRef<Set<string>>(new Set());

  const insertFiles = useCallback(async (editor: Editor, files: File[]): Promise<void> => {
    for (const file of files) {
      // 1차 방어 검증 (서버 IMAGE_001/IMAGE_002/IMAGE_003 사전 차단)
      if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        toast.error('지원하지 않는 이미지 형식입니다. (JPG/PNG/GIF/WEBP)');
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('이미지 용량은 10MB 이하만 가능합니다.');
        continue;
      }
      if (countImages(editor) >= MAX_IMAGES) {
        toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 삽입할 수 있습니다.`);
        break; // 이후 파일도 초과가 확정이므로 중단
      }

      const localId = crypto.randomUUID();
      try {
        await pendingImageDb.put({
          localId,
          blob: file,
          fileName: file.name,
          mimeType: file.type,
          createdAt: Date.now(),
        });
      } catch {
        // IDB 저장 실패 시 노드 미삽입
        toast.error('이미지 임시 저장에 실패했습니다. 다시 시도해주세요.');
        continue;
      }

      const blobUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(blobUrl);
      insertedLocalIdsRef.current.add(localId);

      editor
        .chain()
        .focus()
        .insertContent({ type: 'image', attrs: { src: blobUrl, localId, imageId: null } })
        .run();
    }
  }, []);

  // 언마운트: objectURL만 revoke (IDB는 유지)
  const revokeObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);

  // 저장 성공 후: 이번 세션에 삽입한 blob의 IDB 항목 삭제 + objectURL revoke
  const cleanup = useCallback(async () => {
    const localIds = Array.from(insertedLocalIdsRef.current);
    insertedLocalIdsRef.current.clear();
    await Promise.all(localIds.map((id) => pendingImageDb.delete(id).catch(() => {})));
    revokeObjectUrls();
  }, [revokeObjectUrls]);

  return { insertFiles, revokeObjectUrls, cleanup };
}

function countImages(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') count += 1;
  });
  return count;
}
