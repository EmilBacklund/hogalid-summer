'use client';

import { COLORS } from '@/constants';

interface SlotMachineProps {
  wheelNum: number | null;
  spinning: boolean;
  canSpin: boolean;
  itemCount: number;
  onSpin: () => void;
}

/**
 * Slot-machine wheel that picks a random remaining challenge. Colors and glow
 * track the spinning state and current number, so they stay inline.
 */
export function SlotMachine({ wheelNum, spinning, canSpin, itemCount, onSpin }: SlotMachineProps) {
  const isYellow = wheelNum !== null && wheelNum % 2 === 1;
  const prevNum = wheelNum !== null ? ((wheelNum - 2 + itemCount) % itemCount) + 1 : null;
  const nextNum = wheelNum !== null ? (wheelNum % itemCount) + 1 : null;

  return (
    <button
      type="button"
      onClick={canSpin ? onSpin : undefined}
      disabled={!canSpin}
      className="relative mb-3.5 block h-[126px] w-full overflow-hidden rounded-2xl select-none"
      style={{
        cursor: canSpin ? 'pointer' : 'default',
        boxShadow: spinning
          ? `0 0 32px ${isYellow ? COLORS.yellow : COLORS.red}88`
          : wheelNum !== null
            ? `0 0 20px ${isYellow ? COLORS.yellow : COLORS.red}55`
            : '0 4px 20px rgba(220,40,40,0.35)',
        transition: 'box-shadow 0.15s',
      }}
    >
      {wheelNum === null ? (
        <div
          className="flex h-full w-full items-center justify-center gap-2.5"
          style={{ background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})` }}
        >
          <span className="text-[26px]">🎰</span>
          <span className="font-display text-xl tracking-[0.5px] text-white">
            Slumpa ett uppdrag
          </span>
        </div>
      ) : (
        <div className="flex flex-col">
          <div
            className="flex h-7 items-center justify-center opacity-[0.22]"
            style={{ background: prevNum! % 2 === 1 ? COLORS.yellow : COLORS.red }}
          >
            <span
              className="font-display text-xl"
              style={{ color: prevNum! % 2 === 1 ? COLORS.dark : '#fff' }}
            >
              {prevNum}
            </span>
          </div>
          <div
            className="flex h-[70px] items-center justify-center"
            style={{ background: isYellow ? COLORS.yellow : COLORS.red }}
          >
            <span
              className="font-display text-[52px] leading-none"
              style={{ color: isYellow ? COLORS.dark : '#fff' }}
            >
              {wheelNum}
            </span>
          </div>
          <div
            className="flex h-7 items-center justify-center opacity-[0.22]"
            style={{ background: nextNum! % 2 === 1 ? COLORS.yellow : COLORS.red }}
          >
            <span
              className="font-display text-xl"
              style={{ color: nextNum! % 2 === 1 ? COLORS.dark : '#fff' }}
            >
              {nextNum}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
