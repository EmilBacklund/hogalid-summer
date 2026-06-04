'use client';

import { createPortal } from 'react-dom';
import { EXERCISES, getCelebrationLine } from '@/constants';
import type { BuddyChallenge, User } from '@/types';
import { Confetti } from './Confetti';

interface BuddyCelebrationProps {
  challenge: BuddyChallenge;
  user: User;
  onClose: () => void;
  partnerLabel?: string;
}

/** Shown when both partners complete a buddy challenge. */
export function BuddyCelebration({
  challenge,
  user,
  onClose,
  partnerLabel,
}: BuddyCelebrationProps) {
  const partner =
    partnerLabel ?? (challenge.fromAlias === user.alias ? challenge.toAlias : challenge.fromAlias);
  const ex = EXERCISES.find((e) => e.id === challenge.exerciseId);

  return createPortal(
    <>
      <Confetti active />
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
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-6"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Utmaning klarad"
          className="border-hogalid-yellow w-full max-w-[340px] rounded-[24px] border-2 bg-[linear-gradient(145deg,#0a1628,#001e6e)] px-7 pt-9 pb-7 text-center shadow-[0_0_60px_#f0dc0044]"
        >
          <div className="mb-3 text-[72px] leading-none">🤝</div>
          <div className="text-hogalid-yellow font-display mb-2 text-[28px] leading-tight">
            Grattis!
          </div>
          <div className="mb-5 text-[17px] leading-snug font-bold text-white">
            Du och <span className="text-hogalid-yellow">{partner}</span> klarade utmaningen:
            <br />
            <span className="text-hogalid-yellow">
              {challenge.amount} {ex?.label ?? challenge.exerciseId}!
            </span>
          </div>
          <div className="mb-6 text-[13px] text-white/50">Ni får dubbla poäng för träningen 🎉</div>
          <div className="text-hogalid-yellow mb-5 text-[13px] font-extrabold">
            {getCelebrationLine('hawaii', challenge.id)}
          </div>
          <button
            onClick={onClose}
            className="text-hogalid-dark bg-hogalid-yellow font-display w-full rounded-[14px] py-3.5 text-xl tracking-[0.5px]"
          >
            🙌 Awesome!
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
