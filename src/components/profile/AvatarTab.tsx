import type { CSSProperties } from 'react';
import { COLORS, STARTER_OPTIONS, AVATAR_REWARDS, CATEGORIES } from '@/constants';
import { Card, ButtonLoader } from '@/components/common';
import { AvatarSVG, AvatarBuilder } from '@/components/avatar';
import { cn } from '@/lib/cn';
import type { AvatarConfig, AvatarReward, Stats, User } from '@/types';

// Base config for reward preview thumbnails when the user has no avatar yet.
const PREVIEW_BASE: AvatarConfig = {
  skinColor: 'f2d3b1',
  hair: 'long01',
  hairColor: '0e0e0e',
  eyes: 'variant01',
  eyebrows: 'variant02',
  mouth: 'variant02',
};

const MAX_PREVIEW = 5;

/** Drop the background color so preview thumbnails share a neutral backdrop. */
function withoutBackground(cfg: AvatarConfig): AvatarConfig {
  return Object.fromEntries(Object.entries(cfg).filter(([k]) => k !== 'backgroundColor'));
}

interface PreviewItem {
  category: string;
  variant: string;
  isColor: boolean;
}

function getPreviewItems(reward: AvatarReward): PreviewItem[] {
  const items: PreviewItem[] = [];
  for (const [category, variants] of Object.entries(reward.unlocks)) {
    const isColor = CATEGORIES.find((c) => c.key === category)?.type === 'color';
    const slots = MAX_PREVIEW - items.length;
    if (variants.length <= slots) {
      variants.forEach((v) => items.push({ category, variant: v, isColor }));
    } else {
      const step = variants.length / slots;
      for (let i = 0; i < slots; i++) {
        items.push({ category, variant: variants[Math.floor(i * step)]!, isColor });
      }
    }
    if (items.length >= MAX_PREVIEW) break;
  }
  return items;
}

interface AvatarTabProps {
  localConfig: AvatarConfig;
  setLocalConfig: (next: AvatarConfig) => void;
  unlockedOptions: Record<string, string[]>;
  unlockedItems: string[];
  stats: Stats;
  user: User;
  onUnlock: (itemId: string, cost: number) => void;
  unlocking: boolean;
}

/** "Avatar" tab: the live builder plus point-gated reward bundles. */
export function AvatarTab({
  localConfig,
  setLocalConfig,
  unlockedOptions,
  unlockedItems,
  stats,
  user,
  onUnlock,
  unlocking,
}: AvatarTabProps) {
  return (
    <>
      <Card className="mb-5 px-3.5 py-4">
        <AvatarBuilder
          avatarConfig={localConfig}
          onChange={setLocalConfig}
          starterOptions={STARTER_OPTIONS}
          unlockedOptions={unlockedOptions}
        />
      </Card>

      <div className="mb-2">
        <div className="font-display mb-3 text-xl text-white">Belöningar</div>
        <div className="flex flex-col gap-2.5">
          {AVATAR_REWARDS.map((reward) => {
            const owned = unlockedItems.includes(reward.id);
            const canBuy = !owned && stats.totalPoints >= reward.cost;
            const unlockCount = Object.values(reward.unlocks).reduce((s, a) => s + a.length, 0);
            const previewItems = getPreviewItems(reward);
            const count = previewItems.length;
            const hasArch = count > 1;

            return (
              <Card key={reward.id} className="relative px-4 pt-4 pb-3.5">
                {/* Decorative arch preview */}
                <div
                  className={cn(
                    'absolute flex items-end justify-center',
                    canBuy ? 'right-[108px]' : 'right-[72px]',
                    hasArch ? '-bottom-7' : 'bottom-0',
                    count > 3 ? 'gap-0' : 'gap-1.5',
                  )}
                >
                  {previewItems.map((item, i) => {
                    const t = hasArch ? (i - (count - 1) / 2) / ((count - 1) / 2) : 0;
                    const yOffset = -(1 - t * t) * 16;
                    const dist = Math.abs(t);
                    const itemOpacity = owned ? 0.8 - dist * 0.2 : 0.5 - dist * 0.4;
                    const scale = hasArch ? 1 - dist * 0.06 : 1;
                    const transform = hasArch
                      ? `translateY(${yOffset}px) rotate(${t * 10}deg) scale(${scale})`
                      : undefined;

                    if (item.isColor) {
                      const style: CSSProperties = {
                        backgroundColor: `#${item.variant}`,
                        transform,
                        transformOrigin: 'center bottom',
                        opacity: itemOpacity,
                        marginLeft: hasArch ? -6 : 0,
                        marginRight: hasArch ? -6 : 0,
                      };
                      return (
                        <div
                          key={i}
                          style={style}
                          className="h-[45px] w-[45px] shrink-0 rounded-full border-2 border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                        />
                      );
                    }

                    const baseConfig = withoutBackground(user.avatarConfig || PREVIEW_BASE);
                    const previewConfig = { ...baseConfig, [item.category]: item.variant };
                    const style: CSSProperties = {
                      transform,
                      transformOrigin: 'center bottom',
                      opacity: itemOpacity,
                      filter: owned ? undefined : 'saturate(0.6) blur(0.4px)',
                      marginLeft: hasArch ? -8 : 0,
                      marginRight: hasArch ? -8 : -10,
                    };
                    return (
                      <div key={i} className="shrink-0" style={style}>
                        <AvatarSVG avatarConfig={previewConfig} />
                      </div>
                    );
                  })}
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-base">{owned ? '✅' : '🔒'}</span>
                    <div>
                      <div
                        className={cn(
                          'text-sm font-bold',
                          owned ? 'text-hogalid-yellow' : 'text-white',
                        )}
                      >
                        {reward.label}
                      </div>
                      <div className="mt-px text-[11px] text-white/40">+{unlockCount} val</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {owned ? (
                      <div className="text-hogalid-yellow text-xs font-semibold">Upplåst!</div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            'text-[13px] font-bold',
                            canBuy ? 'text-hogalid-yellow' : 'text-white/40',
                          )}
                        >
                          {reward.cost}p
                        </div>
                        {canBuy && (
                          <button
                            type="button"
                            onClick={() => onUnlock(reward.id, reward.cost)}
                            disabled={unlocking}
                            className={cn(
                              'text-hogalid-dark relative z-40 mt-1 rounded-[10px] px-3.5 py-[5px] text-xs font-bold',
                              unlocking
                                ? 'cursor-not-allowed bg-[rgba(240,220,0,0.5)]'
                                : 'bg-hogalid-yellow',
                            )}
                          >
                            {unlocking ? <ButtonLoader color={COLORS.dark} /> : 'Lås upp!'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
