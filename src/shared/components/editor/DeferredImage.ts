import Image from '@tiptap/extension-image';

// 지연 업로드용 Image 노드.
// 공식 @tiptap/extension-image에 커스텀 속성 2개(imageId, localId)만 추가한다.
// 노드명은 그대로 'image'라 파이프라인의 node.type.name === 'image' 판별과 호환된다.
//
// - imageId: 업로드 완료된 이미지의 서버 확정 id. HTML 직렬화 시 data-image-id.
// - localId: 미업로드 blob 이미지의 IndexedDB 키(uuid). HTML 직렬화 시 data-local-id.
//   저장 성공 후 서버로 가는 HTML에는 절대 남으면 안 된다(파이프라인이 null로 갱신).
export const DeferredImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-image-id'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.imageId ? { 'data-image-id': String(attrs.imageId) } : {},
      },
      localId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-local-id'),
        renderHTML: (attrs: Record<string, unknown>) =>
          attrs.localId ? { 'data-local-id': String(attrs.localId) } : {},
      },
    };
  },
});
