import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DeferredImage } from './DeferredImage';
import { extractImageIds } from './extractImageIds';

function makeEditor(html: string): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, DeferredImage],
    content: html,
  });
}

describe('extractImageIds', () => {
  it('본문 등장 순서대로 imageId를 추출한다', () => {
    const editor = makeEditor(
      '<p>a</p><img src="https://cdn/a.png" data-image-id="10">' +
        '<p>b</p><img src="https://cdn/b.png" data-image-id="7">',
    );
    expect(extractImageIds(editor)).toEqual([10, 7]);
    editor.destroy();
  });

  it('imageId가 없는(미업로드) 노드는 제외한다', () => {
    const editor = makeEditor(
      '<img src="https://cdn/a.png" data-image-id="3">' +
        '<img src="blob:local" data-local-id="uuid-1">',
    );
    expect(extractImageIds(editor)).toEqual([3]);
    editor.destroy();
  });
});
