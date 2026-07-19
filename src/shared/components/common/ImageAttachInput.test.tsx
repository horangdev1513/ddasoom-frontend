import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageAttachInput } from './ImageAttachInput';
import { ImageUploadError } from '@/shared/components/editor/editorImageApi';

// 업로드 API와 토스트는 모킹 — 검증 대상은 "로딩 state가 모든 경로에서 해제되는가"다.
vi.mock('@/shared/components/editor/editorImageApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/components/editor/editorImageApi')>();
  return { ...actual, uploadImage: vi.fn() };
});
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const { uploadImage } = await import('@/shared/components/editor/editorImageApi');
const mockUpload = vi.mocked(uploadImage);

function makeFile(name = 'a.png', type = 'image/png', size = 1024) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function renderInput() {
  const onChange = vi.fn();
  render(
    <ImageAttachInput ownerType="QNA" value={[]} onChange={onChange} maxImages={10} />,
  );
  // 숨겨진 file input — label이 없어 컨테이너에서 직접 집는다.
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  return { onChange, input };
}

describe('ImageAttachInput 로딩 state', () => {
  beforeEach(() => vi.clearAllMocks());

  it('업로드 성공 시 로딩이 해제되고 imageId가 상위로 전달된다', async () => {
    mockUpload.mockResolvedValue({ imageId: 1, url: 'http://x/1.png', isThumbnail: false });
    const { onChange, input } = renderInput();

    await userEvent.upload(input, makeFile());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([
      { imageId: 1, url: 'http://x/1.png', isThumbnail: false },
    ]));
    // 버튼 라벨이 '업로드 중…'으로 남아있으면 무한로딩이다.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /이미지 첨부/ })).toBeEnabled(),
    );
  });

  it('업로드 실패(IMAGE_002) 시에도 로딩이 해제된다', async () => {
    mockUpload.mockRejectedValue(new ImageUploadError('IMAGE_002', '용량 초과'));
    const { input } = renderInput();

    await userEvent.upload(input, makeFile());

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /이미지 첨부/ })).toBeEnabled(),
    );
  });
});
