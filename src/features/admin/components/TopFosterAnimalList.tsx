// 임보 신청 TOP10 리스트 + 종 필터 토글 — 전체 순위 유지, 종별 필터는 프론트 kind 필터.
import { useState } from 'react';
import type { TopFosterAnimal, AnimalKind } from '@/features/admin/api/statisticsApi';

const KIND_LABEL: Record<AnimalKind, string> = { D: '개', C: '고양이' };
type KindFilter = 'ALL' | AnimalKind;

export function TopFosterAnimalList({ animals }: { animals: TopFosterAnimal[] }) {
  const [filter, setFilter] = useState<KindFilter>('ALL');

  const dogCount = animals.filter((a) => a.kind === 'D').length;
  const catCount = animals.filter((a) => a.kind === 'C').length;
  const filtered = filter === 'ALL' ? animals : animals.filter((a) => a.kind === filter);

  return (
    <div className="rounded-md border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">임보 신청 많은 동물 TOP10</h2>
        <div className="flex gap-1 rounded-md border border-border p-0.5 text-xs">
          {([
            ['ALL', `전체 ${animals.length}`],
            ['D', `개 ${dogCount}`],
            ['C', `고양이 ${catCount}`],
          ] as const).map(([key, text]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded px-2.5 py-1 transition-colors ${
                filter === key ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {animals.length === 0 ? '임보 신청 데이터가 아직 없습니다.' : '해당 종은 TOP10에 없습니다.'}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((a) => {
            const rank = animals.findIndex((x) => x.animalId === a.animalId) + 1;
            return (
              <li key={a.animalId} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.nickname} className="h-9 w-9 rounded-md object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-md bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.nickname}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.abandonmentId}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{KIND_LABEL[a.kind]} · {a.typeName}</span>
                <span className="shrink-0 font-semibold">{a.fosterCount}건</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}