import { cn } from '@/lib/cn';

interface CheerToastProps {
  /** Display names of the players who cheered. */
  names: string[];
  fading: boolean;
  onDismiss: () => void;
}

/** Top-of-screen banner shown when other players have cheered you on. */
export function CheerToast({ names, fading, onDismiss }: CheerToastProps) {
  const headline =
    names.length === 1
      ? `${names[0]} hejar på dig!`
      : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]} hejar på dig!`;

  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Stäng hejarop"
      className={cn(
        'fixed top-[60px] right-4 left-4 z-[1200] flex items-center gap-3.5 rounded-[18px] bg-[linear-gradient(135deg,rgba(255,200,0,0.95)_0%,rgba(255,140,0,0.95)_100%)] px-5 py-4 text-left shadow-[0_8px_32px_rgba(255,140,0,0.4)]',
        fading ? 'animate-cheer-fade-out' : 'animate-cheer-slide-in',
      )}
    >
      <div className="animate-cheer-bounce text-4xl leading-none">📣</div>
      <div role="status" className="flex-1">
        <div className="font-display text-base leading-tight text-[#1a1a2e]">{headline}</div>
        <div className="mt-[3px] text-xs font-semibold text-[#1a1a2e]/60">Kämpa vidare! 💪</div>
      </div>
    </button>
  );
}
