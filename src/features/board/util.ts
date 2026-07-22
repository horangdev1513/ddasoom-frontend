import type { PostListItem, PostPreview } from './types';

// features/board 표시용 유틸.
// (PostCard.tsx의 로컬 formatDate와 동일 로직 — 기존 코드는 건드리지 않고,
//  상세/댓글에서 시간 표시(formatDateTime)가 추가로 필요해 여기로 모음.
//  PostCard 쪽 통합은 별도 정리 작업에서.)

/** LocalDateTime ISO 문자열(타임존 없음) → "2026.07.16" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** LocalDateTime ISO 문자열 → "2026.07.16 14:03" (댓글용) */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 이미지 NULL(썸네일 미지정) 대비 placeholder — AnimalCard와 동일한 환경변수를 재사용한다.
const FALLBACK_IMAGE = import.meta.env.VITE_IMAGE_PLACEHOLDER;

/**
 * 목록 응답(PostListItem) → 메인 미리보기 계약(PostPreview) 변환.
 * ContentPreviewSection은 메인 담당자 소유 컴포넌트(수정 금지)라, 데이터를 그 props 계약에 맞춘다.
 * - createdAt: PostPreview는 표시용 문자열 계약이므로 여기서 포맷한다.
 * - imageUrl: thumbnailUrl은 NULL 가능하지만 PostPreview는 string 계약 → placeholder로 채운다.
 */
export function toPostPreview(post: PostListItem): PostPreview {
  return {
    postId: post.postId,
    title: post.title,
    summary: post.contentPreview,
    category: post.category,
    authorNickname: post.author.nickname,
    createdAt: formatDate(post.createdAt),
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    imageUrl: post.thumbnailUrl ?? FALLBACK_IMAGE,
  };
}

/**
 * 여러 게시판에서 모은 글을 최신순으로 정렬해 상위 size건만 남긴다. (메인 커뮤니티 미리보기용)
 * createdAt은 타임존 없는 ISO 문자열이라 사전식 비교만으로 시간순이 성립한다 — Date 파싱 불필요.
 */
export function pickLatestPosts(
  posts: PostListItem[],
  size: number,
): PostListItem[] {
  return [...posts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, size);
}
