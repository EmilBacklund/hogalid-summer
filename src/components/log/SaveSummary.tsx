import type { CSSProperties } from 'react';
import type { Level } from '@/types';

export interface SaveSummaryData {
  points: number;
  touch: number;
  mins: number;
  newRecord: boolean;
  leveledUp: Level | null;
  isEdit: boolean;
}

const pop = (delay: number): CSSProperties => ({ animationDelay: `${delay}s` });

/** Celebratory overlay shown right after a log is saved (points, touch/min, level-up). */
export function SaveSummary({
  summary,
  onClose,
}: {
  summary: SaveSummaryData;
  onClose: () => void;
}) {
  const { leveledUp, isEdit, points, touch, mins, newRecord } = summary;

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
      className="animate-save-fly-in fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="border-hogalid-yellow/40 w-full max-w-[340px] rounded-3xl border-2 bg-[linear-gradient(160deg,rgba(0,20,64,0.98),rgba(0,40,100,0.96))] px-6 py-7 text-center shadow-[0_16px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="animate-save-points-pop mb-2 text-5xl" style={pop(0.2)}>
          {leveledUp ? leveledUp.icon : isEdit ? '✏️' : '⚽'}
        </div>
        <div
          className="text-hogalid-yellow animate-save-points-pop font-display mb-1"
          style={pop(0.3)}
        >
          <span className={leveledUp ? 'text-xl' : 'text-2xl'}>
            {leveledUp
              ? `Nivå upp! ${leveledUp.icon} ${leveledUp.name}`
              : isEdit
                ? 'Uppdaterat!'
                : 'Bra jobbat!'}
          </span>
        </div>
        <div
          className="text-hogalid-yellow animate-save-points-pop font-display mb-2 text-4xl leading-[1.1]"
          style={pop(0.4)}
        >
          +{points}p
        </div>
        <div
          className="animate-save-fly-in flex justify-center gap-4"
          style={{ ...pop(0.5), marginBottom: newRecord ? 12 : 4 }}
        >
          {touch > 0 && <span className="text-[13px] text-white/60">🦶 {touch} touch</span>}
          {mins > 0 && <span className="text-[13px] text-white/60">⏱ {mins} min</span>}
        </div>
        {newRecord && (
          <div
            className="text-hogalid-yellow animate-save-points-pop text-sm font-bold"
            style={pop(0.6)}
          >
            🏆 Nytt personligt rekord!
          </div>
        )}
        <div className="mt-3.5 text-[11px] text-white/30">Tryck för att stänga</div>
      </div>
    </div>
  );
}
