import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFaqs, useFaqCategories } from '@/features/support/hooks/useFaqs';
import { Card, CardContent, CardFooter } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

// 'ALL'은 "전체" 필터를 나타내는 프론트 전용 값 (백엔드 카테고리 value와 겹치지 않음)
const ALL = 'ALL';

export function FaqListPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(ALL);

  const { data: faqs, isLoading, isError } = useFaqs();
  const { data: categories } = useFaqCategories();

  // 카테고리 value → 한글 label 매핑 (없으면 value 그대로)
  const categoryLabel = (value: string) =>
    categories?.find((c) => c.value === value)?.label ?? value;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">불러오는 중…</div>;
  }
  if (isError) {
    return <div className="p-8 text-center text-destructive">목록을 불러오지 못했습니다.</div>;
  }

  const items = faqs ?? [];
  // 목록을 한 번에 받으므로 클라이언트에서 카테고리 필터링
  const visibleItems = selected === ALL ? items : items.filter((f) => f.category === selected);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">자주 묻는 질문</h1>

      {/* 카테고리 필터 (pill 버튼) */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selected === ALL ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => setSelected(ALL)}
        >
          전체
        </Button>
        {categories?.map((category) => (
          <Button
            key={category.value}
            variant={selected === category.value ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => setSelected(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {visibleItems.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">등록된 FAQ가 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((faq) => (
            <Card
              key={faq.faqId}
              className="flex h-full min-h-[140px] cursor-pointer flex-col justify-between gap-3 transition-shadow hover:shadow-md"
              onClick={() => navigate(`/support/faqs/${faq.faqId}`)}
            >
              <CardContent className="flex flex-1 items-center">
                <p className="line-clamp-2 font-medium">
                  <span className="mr-1 text-primary">Q</span>
                  {faq.question}
                </p>
              </CardContent>
              <CardFooter>
                <Badge variant="secondary">#{categoryLabel(faq.category)}</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
