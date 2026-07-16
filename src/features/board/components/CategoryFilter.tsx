// 게시판 강아지/고양이 카테고리 토글 (텍스트만).
// 색상·활성 스킴은 메인 유기동물 검색바(AnimalPreviewSection)와 동일하게 맞춰 통일감을 유지한다.
//
// value=undefined 는 "전체"를 뜻하고, 활성 버튼을 다시 누르면 전체로 풀린다.

const CATEGORIES = ['강아지', '고양이'] as const;

interface CategoryFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className='flex gap-3'>
      {CATEGORIES.map((category) => {
        const active = value === category;
        return (
          <button
            key={category}
            type='button'
            onClick={() => onChange(active ? undefined : category)}
            className={`shrink-0 rounded-xl border-[1.5px] px-6 py-2 text-sm font-semibold transition-all ${
              active
                ? 'border-ring bg-secondary text-ring'
                : 'border-border bg-muted text-muted-foreground hover:border-ring/60 hover:bg-secondary/50 hover:text-ring'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
