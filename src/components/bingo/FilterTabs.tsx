'use client';

import { cn } from '@/lib/cn';

export type BingoFilter = 'all' | '⚽' | '☀️';

interface FilterTabsProps {
  filter: BingoFilter;
  setFilter: (filter: BingoFilter) => void;
  count: number;
}

/** Category filter for the challenge list: all / football / summer. */
export function FilterTabs({ filter, setFilter, count }: FilterTabsProps) {
  const tabs: [BingoFilter, string][] = [
    ['all', `Alla ${count}`],
    ['⚽', 'Fotboll & idrott'],
    ['☀️', 'Sommar'],
  ];
  return (
    <div className="mb-3.5 flex gap-2">
      {tabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setFilter(value)}
          className={cn(
            'flex-1 rounded-[10px] py-2 text-[13px] font-bold transition-all',
            filter === value ? 'bg-hogalid-yellow text-hogalid-dark' : 'bg-white/10 text-white/70',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
