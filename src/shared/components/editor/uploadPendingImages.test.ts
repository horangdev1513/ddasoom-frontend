import { describe, it, expect, vi, beforeEach } from 'vitest';

// api·IndexedDB는 목으로 대체 (파이프라인 로직만 검증)
vi.mock('./editorImageApi', () => ({
  uploadImage: vi.fn(),
  ImageUploadError: class ImageUploadError extends Error {},
}));
vi.mock('./pendingImageDb', () => ({
  pendingImageDb: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    deleteOlderThan: vi.fn(),
  },
}));

import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DeferredImage } from './DeferredImage';
import { uploadPendingImages } from './uploadPendingImages';
import { uploadImage } from './editorImageApi';
import { pendingImageDb } from './pendingImageDb';

const uploadImageMock = vi.mocked(uploadImage);
const getMock = vi.mocked(pendingImageDb.get);

function makeEditorWithTwoBlobs(): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, DeferredImage],
    content:
      '<img src="blob:local-1" data-local-id="local-1">' +
      '<img src="blob:local-2" data-local-id="local-2">',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // 모든 localId에 대해 임시 blob 레코드를 반환
  getMock.mockImplementation(async (localId: string) => ({
    localId,
    blob: new Blob(['x'], { type: 'image/png' }),
    fileName: `${localId}.png`,
    mimeType: 'image/png',
    createdAt: 0,
  }));
});

describe('uploadPendingImages', () => {
  it('전체 성공 시 HTML에 blob:/data-local-id가 남지 않는다', async () => {
    uploadImageMock
      .mockResolvedValueOnce({ imageId: 100, url: 'https://cdn/1.png', isThumbnail: true })
      .mockResolvedValueOnce({ imageId: 200, url: 'https://cdn/2.png', isThumbnail: false });

    const editor = makeEditorWithTwoBlobs();
    const used = await uploadPendingImages(editor, 'NOTICE');

    expect(used).toEqual(['local-1', 'local-2']);
    const html = editor.getHTML();
    expect(html).not.toContain('blob:');
    expect(html).not.toContain('data-local-id');
    expect(html).toContain('data-image-id="100"');
    expect(html).toContain('data-image-id="200"');
    editor.destroy();
  });

  it('부분 실패 시 성공분 attrs는 갱신하고 reject한다', async () => {
    uploadImageMock
      .mockResolvedValueOnce({ imageId: 100, url: 'https://cdn/1.png', isThumbnail: true })
      .mockRejectedValueOnce(new Error('network down'));

    const editor = makeEditorWithTwoBlobs();

    await expect(uploadPendingImages(editor, 'NOTICE')).rejects.toThrow(/2번째 업로드 실패/);

    const html = editor.getHTML();
    // 1번째: 성공 → 확정 URL + imageId, local-id 제거
    expect(html).toContain('data-image-id="100"');
    expect(html).not.toContain('data-local-id="local-1"');
    // 2번째: 실패 → 여전히 미업로드(blob + local-id) 상태
    expect(html).toContain('data-local-id="local-2"');
    // 업로드는 순차 실행 — 실패 시점(2회차)에서 중단
    expect(uploadImageMock).toHaveBeenCalledTimes(2);
    editor.destroy();
  });
});
