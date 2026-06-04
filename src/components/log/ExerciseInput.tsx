import { Card } from '@/components/common';
import { cn } from '@/lib/cn';
import type { Exercise } from '@/types';

export const LOG_INPUT =
  'focus:ring-hogalid-yellow/40 w-full rounded-[10px] border-[1.5px] border-white/20 bg-white/[0.08] px-3 py-[9px] text-sm text-white outline-none focus:ring-2';

interface ExerciseInputProps {
  exercise: Exercise;
  value: string;
  highscore: string;
  onValue: (v: string) => void;
  onHighscore: (v: string) => void;
  /** 'stacked' = range under label (grid cards); 'inline' = range on the right. */
  layout?: 'stacked' | 'inline';
}

const NUM_PROPS = {
  type: 'text',
  inputMode: 'numeric' as const,
  pattern: '[0-9]*',
  autoComplete: 'off',
};

/** One exercise card: a value input, plus a highscore input when the exercise tracks records. */
export function ExerciseInput({
  exercise: ex,
  value,
  highscore,
  onValue,
  onHighscore,
  layout = 'stacked',
}: ExerciseInputProps) {
  return (
    <Card className="min-w-0 px-3.5 py-4" style={{ borderLeft: `4px solid ${ex.color}` }}>
      {layout === 'stacked' ? (
        <div className="mb-2.5 flex items-start gap-2">
          <div
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: ex.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white">{ex.label}</div>
            <div className="mt-[3px] text-[11px] text-white/35">
              0–{ex.max} {ex.unit}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-2 flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: ex.color }} />
          <div className="text-[15px] font-bold text-white">{ex.label}</div>
          <div className="ml-auto text-[11px] font-semibold text-white/35">
            0–{ex.max} {ex.unit}
          </div>
        </div>
      )}

      {ex.hasHighscore ? (
        <>
          <div className="grid grid-cols-2 items-start gap-2.5">
            <div>
              <div className="mb-1.5 text-[11px] font-bold tracking-[0.6px] text-white/45 uppercase">
                Touch
              </div>
              <input
                {...NUM_PROPS}
                aria-label={`${ex.label} – antal ${ex.unit}`}
                placeholder={`Antal ${ex.unit}`}
                value={value}
                onChange={(e) => onValue(e.target.value)}
                className={LOG_INPUT}
              />
            </div>
            <div>
              <div className="mb-1.5 text-[11px] font-bold tracking-[0.6px] text-white/45 uppercase">
                Rekord
              </div>
              <input
                {...NUM_PROPS}
                aria-label={`${ex.label} – rekord`}
                placeholder="🏆 Rekord"
                value={highscore}
                onChange={(e) => onHighscore(e.target.value)}
                className={cn(LOG_INPUT, 'border-hogalid-yellow/30 bg-[rgba(255,218,61,0.06)]')}
              />
            </div>
          </div>
          <div className="mt-[5px] text-[11px] text-white/40">
            Rekord = flest i rad utan att tappa bollen
          </div>
        </>
      ) : (
        <input
          {...NUM_PROPS}
          aria-label={`${ex.label} – antal ${ex.unit}`}
          placeholder={`Antal ${ex.unit}`}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          className={LOG_INPUT}
        />
      )}
    </Card>
  );
}
