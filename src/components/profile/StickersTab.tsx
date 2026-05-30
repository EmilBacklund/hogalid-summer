import { STICKERS, STICKER_GROUPS } from '@/constants';
import { cn } from '@/lib/cn';
import type { Sticker } from '@/types';

/** "Stickers" tab: collectible stickers grouped by theme, dimmed until earned. */
export function StickersTab({ earnedStickers }: { earnedStickers: Sticker[] }) {
  const earnedIds = new Set(earnedStickers.map((s) => s.id));

  return (
    <div>
      <div className="mb-4 text-center text-[13px] font-semibold text-white/50">
        {earnedStickers.length} av {STICKERS.length} stickers upplåsta
      </div>
      <div className="flex flex-col gap-4">
        {STICKER_GROUPS.map((group) => (
          <div key={group}>
            <div className="mb-2 text-xs font-extrabold tracking-wider text-white/55 uppercase">
              {group}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STICKERS.filter((s) => s.group === group).map((sticker) => {
                const earned = earnedIds.has(sticker.id);
                return (
                  <div
                    key={sticker.id}
                    className={cn(
                      'flex min-h-[104px] flex-col items-center justify-center rounded-2xl px-2.5 pt-3 pb-2.5 text-center',
                      earned
                        ? 'border border-[rgba(240,220,0,0.35)] bg-[linear-gradient(160deg,rgba(240,220,0,0.18),rgba(255,255,255,0.08))]'
                        : 'border border-white/[0.08] bg-white/5 opacity-[0.42]',
                    )}
                  >
                    <div className="text-[28px] leading-none">{earned ? sticker.icon : '🔒'}</div>
                    <div
                      className={cn(
                        'mt-2 text-[11px] leading-tight font-extrabold',
                        earned ? 'text-hogalid-yellow' : 'text-white/50',
                      )}
                    >
                      {sticker.label}
                    </div>
                    <div
                      className={cn(
                        'mt-[5px] text-[10px] leading-tight',
                        earned ? 'text-white/52' : 'text-white/[0.28]',
                      )}
                    >
                      {sticker.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
