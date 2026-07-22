import { Heart, Users } from 'lucide-react';
import { AnimalPreviewSection } from '@/features/animals/components/AnimalPreviewSection';
import { ContentPreviewSection } from '@/features/board/components/ContentPreviewSection';
import type { AnimalPreview } from '@/features/animals/types';
import { useMainAnimalsQuery } from '@/features/animals/hooks/useMainAnimalsQuery';
import {
  useMainCommunityPostsQuery,
  useMainReviewPostsQuery,
} from '@/features/board/hooks/useMainPostsQuery';

// 메인 페이지 — 섹션 조립만 담당한다(구현은 features).
//
// ⭐ [팀원 안내 — API 연동 방법]
//   미리보기 3종은 모두 실 API로 연결되었습니다(목업 없음). 새 섹션을 추가할 때 참고할 규칙:
//   1. 본인 도메인의 조회 함수는 features/{도메인}/api/{도메인}Api.ts 에 작성 (예시: features/auth/api/authApi.ts)
//   2. 이 파일에서는 훅 호출 결과를 props로 넘기기만 합니다 — 섹션 컴포넌트는 수정 불필요(데이터는 props 계약)
//   3. 응답 필드가 features/{도메인}/types.ts 의 계약 타입과 다르면 변환 유틸에서 맞춥니다 (예: board/util.ts toPostPreview)
//   4. 미리보기 API는 비로그인도 보는 메인에 노출되므로 반드시 PUBLIC_URIS(공개)로 등록해 주세요.

export function MainPage() {
  // 유기동물 미리보기(최근 4건) - 로딩 중이면 빈 배열로 섹션은 검색바만 노출
  const { data: animals } = useMainAnimalsQuery();
  // 게시글 미리보기(각 최신 3건) — 로딩 중이면 빈 배열로 섹션 헤더/더보기만 노출
  const { data: reviewPosts } = useMainReviewPostsQuery();
  const { data: communityPosts } = useMainCommunityPostsQuery();

  return (
    <>
      {/* ── 히어로 ── */}
      <section className='relative h-[52vh] min-h-[420px] overflow-hidden md:min-h-[520px]'>
        <img
          src='https://images.unsplash.com/photo-1724024056572-0dead0189caf?fm=jpg&w=1400'
          alt='창가에서 쉬고 있는 고양이'
          className='h-full w-full object-cover object-center'
        />
        {/* 텍스트가 놓이는 좌측을 더 어둡게 — 가독성용 웜 그라데이션 */}
        <div className='absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent' />
        <div className='absolute inset-0 flex items-center'>
          <div className='mx-auto w-full max-w-6xl px-6'>
            <p className='mb-3 text-base font-semibold uppercase tracking-[0.2em] text-accent'>
              새로운 인연의 시작
            </p>
            <h1 className='mb-3 text-3xl font-bold leading-snug text-white md:text-5xl'>
              새로운 가족을 기다리는
              <br />
              아이들을 만나보세요
            </h1>
            <p className='max-w-md text-lg leading-relaxed text-[#EED9B6]'>
              전국 각지의 유기동물 보호소에서 새 가족을 기다리는
              <br />
              소중한 생명들과 함께하세요.
            </p>
          </div>
        </div>
      </section>

      {/* ── 미리보기 3종 (API 연동 방법은 상단 ⭐ 주석) ── */}
      <AnimalPreviewSection animals={animals ?? []} />
      <ContentPreviewSection
        icon={Heart}
        title='입양 후기'
        posts={reviewPosts ?? []}
        moreLabel='후기 더 보기'
        listPath='/board/review'
      />
      {/* 커뮤니티는 강아지+고양이 통합 섹션 — 더보기는 대표로 강아지 게시판을 연결한다 */}
      <ContentPreviewSection
        icon={Users}
        title='커뮤니티'
        posts={communityPosts}
        moreLabel='게시글 더 보기'
        listPath='/board/dog-info'
        background='cream'
      />

      {/* ── CTA 배너 — 피그마 원형: "입양 후기를 나눠주세요" + 후기 작성하기 ── */}
      <section className='bg-primary py-16'>
        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row'>
          <div>
            <h2 className='mb-3 text-3xl font-bold text-foreground md:text-4xl'>
              입양 후기를 나눠주세요
            </h2>
            <p className='max-w-lg text-lg leading-relaxed text-foreground/70'>
              소중한 입양 경험을 공유해주세요.
              <br />
              여러분의 이야기가 다른 아이들에게 새 가족을 만들어 줄 수 있어요.
            </p>
          </div>
          <div className='flex shrink-0 gap-3'>
            {/* TODO(board 담당): 후기 작성 라우트 확정 시 이동 경로 연결 (현재 목록으로) */}
            <button
              onClick={() => (window.location.href = '/board?category=review')}
              className='rounded-full bg-ring px-8 py-3 text-base font-bold text-white transition-all hover:brightness-95'
            >
              후기 작성하기
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
