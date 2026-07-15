// 미업로드 이미지 blob의 임시 저장소(IndexedDB) 얇은 래퍼.
// 지연 업로드 파이프라인이 "삽입 시 blob 보관 → 저장 시 업로드 후 삭제"를 위해 사용한다.
// - Blob을 그대로 저장한다(base64 변환 금지 — 33% 용량 손실).
// - 외부 라이브러리(idb 등) 없이 순수 IndexedDB API만 사용한다.

const DB_NAME = 'ddasoom-editor';
const STORE = 'pending-images';
const DB_VERSION = 1;

// objectStore value 스키마. keyPath = localId.
export interface PendingImage {
  localId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  createdAt: number; // epoch ms — deleteOlderThan 기준
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'localId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put(image: PendingImage): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(image);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function get(localId: string): Promise<PendingImage | undefined> {
  const db = await openDb();
  try {
    return await new Promise<PendingImage | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(localId);
      req.onsuccess = () => resolve(req.result as PendingImage | undefined);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function remove(localId: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(localId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// createdAt이 (now - ageMs)보다 오래된 항목을 전부 제거한다. (고아 blob 정리 — 흐름 ④)
// now는 테스트 결정성을 위해 주입 가능하게 둔다.
async function deleteOlderThan(ageMs: number, now: number = Date.now()): Promise<void> {
  const cutoff = now - ageMs;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const cursorReq = tx.objectStore(STORE).openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        const value = cursor.value as PendingImage;
        if (value.createdAt < cutoff) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const pendingImageDb = { put, get, delete: remove, deleteOlderThan };
