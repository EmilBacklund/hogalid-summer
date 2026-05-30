'use client';

import { COLORS } from '@/constants';

interface AdultIntroModalProps {
  onOpen: () => void;
  onClose: () => void;
}

/** One-time reveal shown when the secret adult board is discovered. */
export function AdultIntroModal({ onOpen, onClose }: AdultIntroModalProps) {
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
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/[0.76] px-4 py-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hemligt vuxenbingo hittat"
        className="w-full max-w-[360px] rounded-3xl border border-[rgba(250,204,21,0.28)] px-5 py-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        style={{
          background:
            'linear-gradient(160deg, rgba(14,22,50,0.98) 0%, rgba(29,78,216,0.95) 58%, rgba(250,204,21,0.18) 100%)',
        }}
      >
        <div className="mb-3 text-5xl">🕵️</div>
        <div className="font-display mb-2.5 text-[28px] leading-[1.1] text-white">
          Du hittade Hemligt vuxenbingo!
        </div>
        <div className="mb-[18px] text-[15px] leading-relaxed text-white/80">
          Här finns roliga vuxenuppdrag för sommaren.
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onOpen}
            className="font-display flex-1 rounded-2xl px-4 py-3.5 text-[17px]"
            style={{ background: COLORS.lime, color: COLORS.dark }}
          >
            Öppna bingot
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/[0.18] bg-white/[0.08] px-4 py-3.5 font-bold text-white/75"
          >
            Inte nu
          </button>
        </div>
      </div>
    </div>
  );
}
