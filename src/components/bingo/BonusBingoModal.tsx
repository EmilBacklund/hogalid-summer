'use client';

import { BONUS_BINGO, COLORS } from '@/constants';
import { ProgressBar } from '@/components/common';
import type { BingoTile } from '@/types';
import type { LineState } from '@/utils';
import { BoardGrid } from './BoardGrid';
import { LineIndicators } from './LineIndicators';
import { ChallengeList } from './ChallengeList';

interface BonusBingoModalProps {
  bonusDone: string[];
  justDoneId: string | null;
  selected: BingoTile | null;
  setSelected: (challenge: BingoTile | null) => void;
  busy: boolean;
  onMarkDone: (id: string) => void;
  lineState: LineState;
  rowBonus: number;
  colBonus: number;
  totalBeforeBoardTwo: number;
  unlockTarget: number;
  onClose: () => void;
}

/** Full-screen "Bonusbingo" board (12 extra tiles that count toward Bricka 2). */
export function BonusBingoModal({
  bonusDone,
  justDoneId,
  selected,
  setSelected,
  busy,
  onMarkDone,
  lineState,
  rowBonus,
  colBonus,
  totalBeforeBoardTwo,
  unlockTarget,
  onClose,
}: BonusBingoModalProps) {
  const expanded = !!selected && !bonusDone.includes(selected.id);
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
        aria-label="Bonusbingo"
        className="max-h-[90vh] w-full max-w-[430px] overflow-y-auto rounded-[28px] border-[6px] border-white/[0.18] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        style={{
          padding: expanded ? '20px 16px 110px' : '20px 16px 18px',
          background: 'linear-gradient(180deg, rgba(10,32,74,0.99) 0%, rgba(20,55,120,0.98) 100%)',
        }}
      >
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <div className="text-hogalid-yellow mb-1 text-[11px] font-extrabold tracking-[1px] uppercase">
              Extra innehåll
            </div>
            <div className="font-display text-[28px] leading-[1.08] text-white">Bonusbingo</div>
            <div className="mt-1.5 text-[13px] leading-snug text-white/70">
              12 extra rutor som räknas in när du låser upp Bricka 2.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="h-9 w-9 shrink-0 rounded-full bg-white/[0.08] text-xl leading-none text-white"
          >
            ×
          </button>
        </div>

        <div className="mb-3.5 grid grid-cols-[1fr_auto] items-center gap-3">
          <div>
            <div className="mb-1.5 text-sm font-extrabold text-white">
              {bonusDone.length}/12 klara
            </div>
            <ProgressBar
              value={Math.round((bonusDone.length / BONUS_BINGO.length) * 100)}
              color={COLORS.yellow}
              height={10}
            />
          </div>
          <div className="text-right text-xs font-extrabold text-white/70">
            {totalBeforeBoardTwo}/{unlockTarget} till Bricka 2
          </div>
        </div>

        <BoardGrid
          items={BONUS_BINGO}
          doneIds={bonusDone}
          justDoneId={justDoneId}
          cols={4}
          lineState={lineState}
        />
        <LineIndicators
          lineState={lineState}
          rowBonus={rowBonus}
          colBonus={colBonus}
          rowColor={COLORS.yellow}
          colColor="#60a5fa"
        />

        <ChallengeList
          items={BONUS_BINGO}
          doneIds={bonusDone}
          selectedChallenge={selected}
          setSelectedChallenge={setSelected}
          justDoneId={justDoneId}
          busy={busy}
          onMarkDone={onMarkDone}
        />
      </div>
    </div>
  );
}
