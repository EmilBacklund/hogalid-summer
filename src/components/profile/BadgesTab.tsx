import { BADGES } from '@/constants';
import { Card } from '@/components/common';
import { cn } from '@/lib/cn';
import type { Badge, Stats } from '@/types';

const DESCRIPTIONS: Record<string, string> = {
  streak7: 'Håll en streak i 7 dagar',
  streak14: 'Håll en streak i 14 dagar',
  juggle50: 'Jonglera 50 gånger i rad',
  minutes300: 'Träna totalt 5 timmar',
  paparazzi: 'Ladda upp 10 bilder i fotoalbumet',
  allExercises: 'Testa minst 7 olika övningar',
  bingo10: 'Klara 10 bingoutmaningar',
  bingo20: 'Klara 20 bingoutmaningar',
  bingo35: 'Klara 35 bingoutmaningar',
  bingo50: 'Klara alla 50 bingoutmaningar',
  bingoline: 'Klara en hel rad eller kolumn i bingo',
};

interface BadgesTabProps {
  earnedBadges: Badge[];
  stats: Stats;
}

/** "Medaljer" tab: every badge, dimmed until its condition is met. */
export function BadgesTab({ earnedBadges }: BadgesTabProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  return (
    <div>
      <div className="mb-4 text-center text-[13px] font-semibold text-white/50">
        {earnedBadges.length} av {BADGES.length} medaljer upplåsta
      </div>
      <div className="flex flex-col gap-2">
        {BADGES.map((badge) => {
          const earned = earnedIds.has(badge.id);
          return (
            <Card
              key={badge.id}
              className={cn('flex items-center gap-3.5 px-4 py-3.5', !earned && 'opacity-45')}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[28px]',
                  earned
                    ? 'border border-[rgba(240,220,0,0.35)] bg-[rgba(240,220,0,0.12)]'
                    : 'border border-white/[0.08] bg-white/5',
                )}
              >
                {earned ? badge.icon : '🔒'}
              </div>
              <div className="flex-1">
                <div
                  className={cn(
                    'text-sm font-bold',
                    earned ? 'text-hogalid-yellow' : 'text-white/50',
                  )}
                >
                  {badge.label}
                </div>
                <div className={cn('mt-0.5 text-xs', earned ? 'text-white/50' : 'text-white/30')}>
                  {DESCRIPTIONS[badge.id] || ''}
                </div>
              </div>
              {earned && <div className="text-hogalid-yellow shrink-0 text-lg">✅</div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
