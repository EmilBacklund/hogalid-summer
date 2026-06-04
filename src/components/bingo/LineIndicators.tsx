'use client';

import { COLORS } from '@/constants';
import type { LineState } from '@/utils';

interface LineIndicatorsProps {
  lineState: LineState;
  rowBonus: number;
  colBonus: number;
  rowColor?: string;
  colColor?: string;
}

/** Pills listing each completed row/column and its bonus. Colors are dynamic. */
export function LineIndicators({
  lineState,
  rowBonus,
  colBonus,
  rowColor = COLORS.lime,
  colColor = '#fbbf24',
}: LineIndicatorsProps) {
  if (lineState.rows.length === 0 && lineState.cols.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap justify-center gap-1.5">
      {lineState.rows.map((row) => (
        <span
          key={`row-${row}`}
          className="rounded-full px-[9px] py-1 text-[11px] font-extrabold"
          style={{
            background: `${rowColor}20`,
            border: `1px solid ${rowColor}66`,
            color: rowColor,
          }}
        >
          Rad {row + 1} ✓ +{rowBonus}p
        </span>
      ))}
      {lineState.cols.map((col) => (
        <span
          key={`col-${col}`}
          className="rounded-full px-[9px] py-1 text-[11px] font-extrabold"
          style={{
            background: `${colColor}20`,
            border: `1px solid ${colColor}66`,
            color: colColor,
          }}
        >
          Kolumn {col + 1} ✓ +{colBonus}p
        </span>
      ))}
    </div>
  );
}
