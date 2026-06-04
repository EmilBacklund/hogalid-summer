import { getCelebrationLine } from '@/constants';
import type { Level } from '@/types';
import { Confetti } from './Confetti';

/** Celebratory overlay shown when the player reaches a new level. */
export function LevelUpModal({ level, onClose }: { level: Level | null; onClose: () => void }) {
  if (!level) return null;

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
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 p-6"
    >
      <Confetti />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nivå upp"
        className="w-full max-w-[340px] rounded-[28px] border-2 border-[#f0dc0088] bg-[linear-gradient(160deg,rgba(0,20,64,0.98)_0%,rgba(0,40,100,0.96)_58%,rgba(220,40,40,0.88)_100%)] px-7 pt-9 pb-7 text-center shadow-[0_0_60px_#f0dc0044,0_20px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="animate-level-pop mb-3 text-[72px] leading-none">{level.icon}</div>
        <div
          className="text-hogalid-yellow animate-level-slide-up mb-1.5 text-[13px] font-extrabold tracking-[1.5px] uppercase"
          style={{ animationDelay: '0.3s' }}
        >
          Nivå upp!
        </div>
        <div
          className="font-display animate-level-slide-up mb-2 text-[28px] leading-tight text-white"
          style={{ animationDelay: '0.4s' }}
        >
          {level.name}
        </div>
        <div
          className="animate-level-slide-up mb-6 text-sm font-semibold text-white/50"
          style={{ animationDelay: '0.5s' }}
        >
          Du är nu {level.icon} {level.name}!
        </div>
        <div
          className="text-hogalid-yellow animate-level-slide-up mb-[18px] text-[13px] font-extrabold tracking-[0.3px]"
          style={{ animationDelay: '0.55s' }}
        >
          {getCelebrationLine('drive', level.name)}
        </div>
        <button
          onClick={onClose}
          className="text-hogalid-dark bg-hogalid-yellow font-display animate-level-slide-up rounded-[14px] px-9 py-3 text-lg shadow-[0_4px_20px_#f0dc0055]"
          style={{ animationDelay: '0.6s' }}
        >
          Toppen!
        </button>
      </div>
    </div>
  );
}
