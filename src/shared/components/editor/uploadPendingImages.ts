import type { Editor } from '@tiptap/react';
import { uploadImage, ImageUploadError } from './editorImageApi';
import { pendingImageDb } from './pendingImageDb';
import type { OwnerType } from './editorConstants';

// 저장 파이프라인(흐름 ②).
// localId만 있는(미업로드) 이미지 노드를 본문 등장 순서대로 순차 업로드하고,
// 성공한 노드는 즉시 attrs를 { src: 영구URL, imageId, localId: null }로 갱신한다.
// → 하나라도 실패하면 그 지점에서 throw. 이미 갱신된 성공분은 재시도 시 재업로드되지 않는다.
//
// 반환: 업로드에 성공적으로 사용된 localId 목록(호출부의 cleanup 대상).

interface FailureInfo {
  index: number; // 1-based (사용자 메시지용)
  cause: unknown;
}

export async function uploadPendingImages(editor: Editor, ownerType: OwnerType): Promise<string[]> {
  const uploadedLocalIds: string[] = [];

  // 미업로드 노드의 localId를 등장 순서대로 수집.
  // (position은 갱신 과정에서 검색으로 다시 찾으므로 localId만 보관)
  const pendingLocalIds: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs.localId && !node.attrs.imageId) {
      pendingLocalIds.push(node.attrs.localId as string);
    }
  });

  let failure: FailureInfo | null = null;

  for (let i = 0; i < pendingLocalIds.length; i++) {
    const localId = pendingLocalIds[i];
    const record = await pendingImageDb.get(localId);
    if (!record) {
      failure = { index: i + 1, cause: new Error(`임시 저장된 이미지를 찾을 수 없습니다 (${localId})`) };
      break;
    }
    try {
      const file = new File([record.blob], record.fileName, { type: record.mimeType });
      const uploaded = await uploadImage(file, ownerType);
      // 성공 → 해당 노드 attrs 확정. image는 atom leaf라 setNodeMarkup 후에도 position이 안정적이다.
      applyUploadedAttrs(editor, localId, uploaded.url, uploaded.imageId);
      uploadedLocalIds.push(localId);
    } catch (cause) {
      failure = { index: i + 1, cause };
      break;
    }
  }

  if (failure) {
    // 서버 에러코드(ImageUploadError.code)를 뭉개지 않고 보존해 상위(토스트)가 문구 매핑에 쓰게 한다.
    // wrapper 메시지에는 실패 순번(N번째)을 남긴다.
    const code = failure.cause instanceof ImageUploadError ? failure.cause.code : undefined;
    const error = new Error(`이미지 ${failure.index}번째 업로드 실패, 다시 저장을 시도해주세요`);
    (error as Error & { cause?: unknown; failedAt?: number; code?: string }).cause = failure.cause;
    (error as Error & { failedAt?: number }).failedAt = failure.index;
    (error as Error & { code?: string }).code = code;
    throw error;
  }

  return uploadedLocalIds;
}

// localId로 이미지 노드를 찾아 업로드 결과 attrs로 갱신한다.
function applyUploadedAttrs(editor: Editor, localId: string, url: string, imageId: number): void {
  editor.commands.command(({ tr, state }) => {
    let pos = -1;
    state.doc.descendants((node, nodePos) => {
      if (pos !== -1) return false;
      if (node.type.name === 'image' && node.attrs.localId === localId) {
        pos = nodePos;
        return false;
      }
    });
    if (pos === -1) return false;
    const node = state.doc.nodeAt(pos);
    if (!node) return false;
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url, imageId, localId: null });
    return true;
  });
}
