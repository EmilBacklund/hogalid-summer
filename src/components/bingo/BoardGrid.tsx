'use client';

import { COLORS } from '@/constants';
import type { BingoTile } from '@/types';
import type { LineState } from '@/utils';

interface BoardGridProps {
  items: BingoTile[];
  doneIds: string[];
  justDoneId: string | null;
  cols: number;
  lineState: LineState;
  theme?: 'dark' | 'light';
}

/**
 * The bingo grid. Cell colors/transforms/shadows are computed per tile (done
 * state, category, just-completed pulse, in-completed-line glow) and the
 * column count drives the template — all genuinely dynamic, so they stay inline.
 */
export function BoardGrid({
  items,
  doneIds,
  justDoneId,
  cols,
  lineState,
  theme = 'dark',
}: BoardGridProps) {
  const isLight = theme === 'light';
  const emptyBg = isLight ? 'rgba(29,53,87,0.08)' : 'rgba(255,255,255,0.06)';
  const emptyBorder = isLight ? 'rgba(29,53,87,0.16)' : 'rgba(255,255,255,0.08)';
  const emptyText = isLight ? 'rgba(29,53,87,0.35)' : 'rgba(255,255,255,0.2)';
  const lineGlow = isLight ? '0 0 6px rgba(29,53,87,0.18)' : '0 0 6px rgba(255,255,255,0.28)';

  return (
    <div
      className="mb-1.5"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: cols === 10 ? 3 : 8,
        padding: cols === 10 ? '0 2px' : 0,
      }}
    >
      {items.map((item, index) => {
        const isDone = doneIds.includes(item.id);
        const isJust = justDoneId === item.id;
        const row = Math.floor(index / cols);
        const col = index % cols;
        const inCompletedLine = lineState.rows.includes(row) || lineState.cols.includes(col);
        const fill = item.cat === '⚽' ? COLORS.lime : '#fbbf24';
        return (
          <div
            key={item.id}
            title={item.label}
            style={{
              aspectRatio: cols === 10 ? '1' : '1 / 1.05',
              borderRadius: cols === 10 ? 4 : 12,
              background: isDone ? fill : emptyBg,
              border: isDone ? 'none' : `1px solid ${emptyBorder}`,
              transition: 'all 0.25s',
              transform: isJust ? 'scale(1.08)' : 'scale(1)',
              boxShadow: isJust ? `0 0 8px ${fill}` : inCompletedLine && isDone ? lineGlow : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: cols === 10 ? 7 : 10,
              color: isDone ? 'rgba(0,0,0,0.45)' : emptyText,
              fontWeight: 800,
              textAlign: 'center',
              padding: cols === 10 ? 0 : 4,
            }}
          >
            {cols === 10 ? index + 1 : item.cat}
          </div>
        );
      })}
    </div>
  );
}
