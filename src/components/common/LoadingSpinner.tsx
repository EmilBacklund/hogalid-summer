import { cn } from '@/lib/cn';

interface LoadingSpinnerProps {
  text?: string;
  /** 'splash' = full-screen; 'section' = inside a card/page area. */
  size?: 'splash' | 'section';
}

/** Bouncing-football loading indicator. */
export function LoadingSpinner({ text = 'Laddar...', size = 'section' }: LoadingSpinnerProps) {
  const isSplash = size === 'splash';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        isSplash ? 'min-h-screen' : 'px-5 py-8',
      )}
    >
      {isSplash && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/img/hogalid-logo.png" alt="" className="mb-6 h-14 w-14 opacity-80" />
      )}
      <div
        className={cn(
          'animate-football-bounce mb-3.5 leading-none',
          isSplash ? 'text-5xl' : 'text-4xl',
        )}
      >
        ⚽
      </div>
      {text && (
        <div
          className={cn(
            'animate-shimmer font-semibold text-white/50',
            isSplash ? 'text-base' : 'text-sm',
          )}
        >
          {text}
        </div>
      )}
      {isSplash && (
        <div className="text-hogalid-yellow font-display mt-3 text-xl opacity-70">Högalid F15</div>
      )}
    </div>
  );
}

/** Pulsing skeleton bar for placeholder content. */
export function SkeletonBar({
  height = 14,
  width = '100%',
  borderRadius = 99,
}: {
  height?: number;
  width?: number | string;
  borderRadius?: number;
}) {
  return <div className="animate-shimmer bg-white/10" style={{ height, width, borderRadius }} />;
}

/** Animated top loading bar. */
export function TopLoadingBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden bg-white/10">
      <div className="animate-loading-slide via-hogalid-yellow h-full w-1/4 bg-gradient-to-r from-transparent to-transparent" />
    </div>
  );
}

/** Small inline loading dots for buttons. */
export function ButtonLoader({ color = '#fff' }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-dot-pulse inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: color, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
