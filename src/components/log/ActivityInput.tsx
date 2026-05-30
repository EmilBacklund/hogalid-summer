import { Card } from '@/components/common';
import { cn } from '@/lib/cn';
import { LOG_INPUT } from './ExerciseInput';
import type { SummerActivity } from '@/types';

interface ActivityInputProps {
  activity: SummerActivity;
  value: string;
  onChange: (v: string) => void;
}

/** A summer-activity tile (ice cream / swim / pages read) with a centered numeric input. */
export function ActivityInput({ activity: act, value, onChange }: ActivityInputProps) {
  return (
    <Card className="min-w-0 px-2.5 pt-3.5 pb-3" style={{ borderTop: `4px solid ${act.color}` }}>
      <div className="mb-2.5 text-center">
        <div className="mb-1.5 text-[22px] leading-none">{act.icon}</div>
        <div className="text-[13px] font-bold text-white">{act.label}</div>
        <div className="mt-1 text-[10px] text-white/35">
          0–{act.max} {act.unit}
        </div>
      </div>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-label={`${act.label} – antal ${act.unit}`}
        placeholder={`Antal ${act.unit}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(LOG_INPUT, 'px-2 text-center')}
      />
    </Card>
  );
}
