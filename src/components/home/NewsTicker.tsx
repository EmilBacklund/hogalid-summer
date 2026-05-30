import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { FeedEvent } from '@/types';

interface NewsTickerProps {
  items: FeedEvent[];
  onOpen: () => void;
}

/** Scrolling "Nytt" feed strip; tapping it opens the team feed. */
export function NewsTicker({ items, onOpen }: NewsTickerProps) {
  if (items.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-3 block w-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/5 py-2 text-left"
    >
      <div className="flex items-center">
        <span className="text-hogalid-yellow mr-2 shrink-0 border-r border-white/10 px-2.5 text-[11px] font-bold tracking-wider uppercase">
          Nytt
        </span>
        <div className="flex-1 overflow-hidden">
          <div
            className="animate-ticker inline-flex whitespace-nowrap"
            style={{ '--ticker-duration': `${items.length * 4}s` } as CSSProperties}
          >
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                className={cn(
                  'mr-8 text-xs',
                  item.isMe ? 'text-hogalid-yellow font-bold' : 'font-normal text-white/65',
                )}
              >
                {item.icon} <span className="font-semibold text-white/90">{item.alias}</span>{' '}
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
