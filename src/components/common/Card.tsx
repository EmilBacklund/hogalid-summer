import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const card = cva(
  'overflow-hidden rounded-[18px] border border-white/15 px-5 py-[18px] backdrop-blur-sm transition-all',
  {
    variants: {
      elevation: {
        flat: '',
        raised: 'shadow-lg shadow-black/30',
      },
      glow: {
        none: '',
        lime: 'shadow-[0_0_16px_rgba(240,220,0,0.45)]',
        red: 'shadow-[0_0_16px_rgba(220,40,40,0.45)]',
      },
      interactive: {
        true: 'cursor-pointer bg-white/10 hover:bg-white/[0.18]',
        false: 'bg-white/10',
      },
    },
    defaultVariants: { elevation: 'flat', glow: 'none', interactive: false },
  },
);

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof card>;

/**
 * Frosted surface used across the app. Variants (cva): `elevation`, `glow`, and
 * `interactive` (hover highlight + pointer). Defaults to interactive when an
 * `onClick` is provided.
 */
export function Card({ className, elevation, glow, interactive, onClick, ...props }: CardProps) {
  const isInteractive = interactive ?? Boolean(onClick);
  return (
    <div
      onClick={onClick}
      // When clickable, expose button semantics + keyboard activation (a11y).
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.currentTarget.click();
              }
            }
          : undefined
      }
      className={cn(card({ elevation, glow, interactive: isInteractive }), className)}
      {...props}
    />
  );
}
