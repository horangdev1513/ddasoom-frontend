import type { Editor } from '@tiptap/react';

// 본문 등장 순서대로 imageId를 추출한다.
// 저장 시 이 리스트의 인덱스가 그대로 백엔드 image_order가 된다.
// imageId가 없는(미업로드) 노드는 제외한다.
export function extractImageIds(editor: Editor): number[] {
  const ids: number[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image' && node.attrs.imageId) {
      ids.push(Number(node.attrs.imageId));
    }
  });
  return ids;
}
