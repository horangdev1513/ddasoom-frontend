// 리치텍스트 에디터 공용 상수.
// 공지사항(Notice)·FAQ 작성/수정 화면에서 재사용된다.

// 본문에 삽입 가능한 최대 이미지 수.
// 백엔드 ImageErrorCode.IMAGE_003과 동일해야 함 — 변경 시 양쪽 동시 수정 (2026-07-15 기준 20 확정).
export const MAX_IMAGES = 20;

// 허용 이미지 MIME 타입 — <input accept>와 삽입 전 1차 검증에 공용.
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

// <input accept> 속성 값.
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

// 단일 이미지 최대 용량 — 10MB. (서버 내부 multipart 여유값은 사용자에게 노출하지 않는다.)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// 이미지 소유 도메인 타입. 백엔드 OwnerType enum과 대응한다.
// 공지는 'NOTICE', FAQ 화면은 'FAQ'를 RichTextEditor의 ownerType prop으로 주입한다.
export type OwnerType = 'NOTICE' | 'FAQ';

// 이미지 업로드 API의 ownerType 기본값.
// 백엔드 OwnerType enum에 NOTICE는 존재(public), FAQ는 추가 예정.
// FAQ는 백엔드 OwnerType enum 추가 후 사용 가능.
export const EDITOR_OWNER_TYPE: OwnerType = 'NOTICE';

// 미저장 blob 정리 기준 — 24시간. 에디터 마운트 시 이보다 오래된 IndexedDB 항목을 제거한다.
export const PENDING_IMAGE_TTL_MS = 24 * 60 * 60 * 1000;

// 본문 타이포그래피 공용 클래스 — 에디터 편집 영역과 SafeHtmlViewer가 동일 렌더를 갖도록 공유한다.
// Tailwind typography 플러그인 미도입 상태라 필요한 요소만 최소 스타일링(하드코딩 색상 금지, 시맨틱 토큰 사용).
export const EDITOR_CONTENT_CLASS =
  'text-sm leading-relaxed text-foreground ' +
  '[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold ' +
  '[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold ' +
  '[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_a]:text-primary [&_a]:underline [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md';
