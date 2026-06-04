'use client';

import { ADULT_BINGO } from '@/constants';
import { ProgressBar } from '@/components/common';
import type { BingoTile } from '@/types';
import type { LineState } from '@/utils';
import { BoardGrid } from './BoardGrid';
import { ChallengeList } from './ChallengeList';

interface AdultBingoModalProps {
  adultDone: string[];
  justDoneId: string | null;
  selected: BingoTile | null;
  setSelected: (challenge: BingoTile | null) => void;
  busy: boolean;
  onMarkDone: (id: string) => void;
  lineState: LineState;
  onClose: () => void;
}

// The adult tiles carry no points or category — render them as plain ⭐ rows.
const ADULT_LIST_ITEMS: BingoTile[] = ADULT_BINGO.map((item) => ({
  ...item,
  cat: '⭐',
  points: 0,
}));

/** Light-themed secret "vuxenbingo" board — 16 just-for-fun tiles. */
export function AdultBingoModal({
  adultDone,
  justDoneId,
  selected,
  setSelected,
  busy,
  onMarkDone,
  lineState,
  onClose,
}: AdultBingoModalProps) {
  const expanded = !!selected && !adultDone.includes(selected.id);
  const hasLine = lineState.rows.length > 0 || lineState.cols.length > 0;
  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Stäng"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/[0.82] p-3.5"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hemligt vuxenbingo"
        className="max-h-[90vh] w-full max-w-[430px] overflow-y-auto rounded-[28px] border-[6px] border-white/40 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        style={{
          padding: expanded ? '20px 16px 110px' : '20px 16px 18px',
          background: 'linear-gradient(180deg, #f3ead6 0%, #f7f0dd 100%)',
        }}
      >
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 text-[11px] font-extrabold tracking-[1px] text-[#48608d] uppercase">
              Bonusbingo
            </div>
            <div className="font-display text-[28px] leading-[1.08] text-[#1d3557]">
              Hemligt vuxenbingo
            </div>
            <div className="mt-1.5 text-[13px] leading-snug text-[rgba(29,53,87,0.72)]">
              16 rutor bara för kul. Perfekt för att sätta lite skojig press på de vuxna.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="h-9 w-9 shrink-0 rounded-full bg-[rgba(29,53,87,0.08)] text-xl leading-none text-[#1d3557]"
          >
            ×
          </button>
        </div>

        <div className="mb-3.5 grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <div className="mb-1.5 text-sm font-extrabold text-[#1d3557]">
              {adultDone.length}/16 klara
            </div>
            <ProgressBar
              value={Math.round((adultDone.length / ADULT_BINGO.length) * 100)}
              color="#f4b400"
              height={10}
            />
          </div>
          <div
            className="text-right text-xs font-extrabold"
            style={{ color: hasLine ? '#15803d' : '#1d3557' }}
          >
            {hasLine ? 'Bingo fixat!' : 'Jaga en rad eller kolumn'}
          </div>
        </div>

        <BoardGrid
          items={ADULT_BINGO}
          doneIds={adultDone}
          justDoneId={justDoneId}
          cols={4}
          lineState={lineState}
          theme="light"
        />

        {hasLine && (
          <div className="mb-3.5 flex flex-wrap gap-1.5">
            {lineState.rows.map((row) => (
              <span
                key={`adult-row-${row}`}
                className="rounded-full bg-[rgba(34,197,94,0.12)] px-2.5 py-[5px] text-[11px] font-extrabold text-[#166534]"
              >
                Rad {row + 1} ✓
              </span>
            ))}
            {lineState.cols.map((col) => (
              <span
                key={`adult-col-${col}`}
                className="rounded-full bg-[rgba(59,130,246,0.12)] px-2.5 py-[5px] text-[11px] font-extrabold text-[#1d4ed8]"
              >
                Kolumn {col + 1} ✓
              </span>
            ))}
          </div>
        )}

        <ChallengeList
          items={ADULT_LIST_ITEMS}
          doneIds={adultDone}
          selectedChallenge={selected}
          setSelectedChallenge={setSelected}
          justDoneId={justDoneId}
          busy={busy}
          onMarkDone={onMarkDone}
          theme="light"
        />
      </div>
    </div>
  );
}
