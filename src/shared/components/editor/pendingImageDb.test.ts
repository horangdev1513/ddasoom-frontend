import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { pendingImageDb, type PendingImage } from './pendingImageDb';

function makeRecord(localId: string, createdAt: number): PendingImage {
  return {
    localId,
    blob: new Blob([`data-${localId}`], { type: 'image/png' }),
    fileName: `${localId}.png`,
    mimeType: 'image/png',
    createdAt,
  };
}

describe('pendingImageDb', () => {
  beforeEach(() => {
    // 매 테스트마다 새 인메모리 IndexedDB로 초기화
    globalThis.indexedDB = new IDBFactory();
  });

  it('put/get — 레코드가 라운드트립되고 blob은 문자열(base64)이 아니다', async () => {
    await pendingImageDb.put(makeRecord('a', 1000));
    const got = await pendingImageDb.get('a');
    expect(got).toBeDefined();
    expect(got?.localId).toBe('a');
    expect(got?.fileName).toBe('a.png');
    expect(got?.mimeType).toBe('image/png');
    // base64로 저장하지 않았음을 보장 — blob 필드는 문자열이 아니다.
    // (jsdom Blob은 fake-indexeddb의 구조화 복제에서 바이트가 유실되므로 내용/size는 검증하지 않는다.
    //  실제 브라우저 IndexedDB는 Blob을 네이티브로 저장한다.)
    expect(typeof got?.blob).not.toBe('string');
    expect(got?.blob).toBeTruthy();
  });

  it('get — 없는 키는 undefined', async () => {
    expect(await pendingImageDb.get('nope')).toBeUndefined();
  });

  it('delete — 항목을 제거한다', async () => {
    await pendingImageDb.put(makeRecord('a', 1000));
    await pendingImageDb.delete('a');
    expect(await pendingImageDb.get('a')).toBeUndefined();
  });

  it('deleteOlderThan — 기준보다 오래된 항목만 제거한다', async () => {
    const now = 100_000;
    await pendingImageDb.put(makeRecord('old', now - 5000));
    await pendingImageDb.put(makeRecord('new', now - 500));

    await pendingImageDb.deleteOlderThan(1000, now); // cutoff = now - 1000

    expect(await pendingImageDb.get('old')).toBeUndefined();
    expect(await pendingImageDb.get('new')).toBeDefined();
  });
});
