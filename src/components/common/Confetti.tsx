import type { CSSProperties } from 'react';
import { COLORS } from '@/constants';

const COLORS_LIST = [COLORS.yellow, COLORS.red, '#fff', COLORS.navy, COLORS.yellow, '#ff9f9f'];

/** Falling confetti overlay. Each piece's position/size/timing is dynamic. */
export function Confetti({ active = true }: { active?: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden" aria-hidden>
      {Array.from({ length: 32 }, (_, i) => {
        const round = i % 3 === 0;
        // Cast: custom properties (--*) aren't in this csstype's CSSProperties.
        const style = {
          left: `${(i * 37) % 100}%`,
          top: `-${10 + ((i * 13) % 30)}px`,
          width: round ? 10 : 7,
          height: round ? 10 : 14,
          borderRadius: i % 2 === 0 ? '50%' : 2,
          background: COLORS_LIST[i % COLORS_LIST.length],
          '--confetti-duration': `${1.5 + (i % 5) * 0.3}s`,
          '--confetti-delay': `${(i % 7) * 0.1}s`,
        } as CSSProperties;
        return <div key={i} className="animate-confetti-fall absolute" style={style} />;
      })}
    </div>
  );
}
