import { ArrowRight } from 'lucide-react';

export type NudgeAction = 'log' | 'daily' | 'buddy' | null;

export interface Nudge {
  icon: string;
  text: string;
  action: NudgeAction;
  /** Accent color (hex) — drives the border/gradient/arrow tint. */
  color: string;
}

interface ActionNudgeProps {
  nudge: Nudge;
  /** Secondary line, e.g. "3 av 11 spelare har tränat idag" (hidden when null). */
  subtitle: string | null;
  onClick: () => void;
}

/** The "gör-det-nu" prompt — a single contextual call to action. */
export function ActionNudge({ nudge, subtitle, onClick }: ActionNudgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-4 text-left"
      // Tint is computed per nudge type — genuinely dynamic.
      style={{
        borderColor: `${nudge.color}44`,
        background: `linear-gradient(135deg, ${nudge.color}18, ${nudge.color}08)`,
        cursor: nudge.action ? 'pointer' : 'default',
      }}
    >
      <span className="shrink-0 text-[26px] leading-none">{nudge.icon}</span>
      <div className="flex-1">
        <div className="text-sm font-bold text-white">{nudge.text}</div>
        {subtitle && (
          <div className="mt-[3px] text-[11px] font-semibold text-white/45">{subtitle}</div>
        )}
      </div>
      {nudge.action && <ArrowRight size={18} className="shrink-0" style={{ color: nudge.color }} />}
    </button>
  );
}
