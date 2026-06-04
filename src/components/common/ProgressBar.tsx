import { COLORS } from '@/constants';

interface ProgressBarProps {
  value: number;
  max?: number;
  /** Fill color (CSS color). Defaults to the brand yellow. */
  color?: string;
  height?: number;
}

/**
 * Thin animated progress bar. The fill width/color and its glow are computed
 * from props, so they stay as inline styles (genuinely dynamic).
 */
export function ProgressBar({
  value,
  max = 100,
  color = COLORS.lime,
  height = 10,
}: ProgressBarProps) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : value);
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-white/15"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(.4,2,.6,1)]"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}99` }}
      />
    </div>
  );
}
