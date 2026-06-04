import { computeWeeklyHistory } from '@/utils';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

interface LastWeekResultProps {
  allUsers: User[];
  seasonStart: string | null;
}

/** Compact strip showing how the team did on last week's challenge. */
export function LastWeekResult({ allUsers, seasonStart }: LastWeekResultProps) {
  const history = computeWeeklyHistory(allUsers, seasonStart);
  if (history.length === 0) return null;
  const last = history[0]!;
  const { levelInfo, challenge } = last;
  const done = levelInfo.level > 0;

  return (
    <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-white/5 px-3.5 py-2.5">
      <div className="text-lg">{done ? (levelInfo.isMaxLevel ? '🔥' : '✅') : '❌'}</div>
      <div className="flex-1">
        <div className="text-[11px] font-semibold tracking-wide text-white/40 uppercase">
          Förra veckan
        </div>
        <div className="text-xs text-white/70">{challenge.label}</div>
      </div>
      <div className="text-right">
        {done ? (
          <div
            className={cn(
              'text-[13px] font-bold',
              levelInfo.isMaxLevel ? 'text-[#ff6a00]' : 'text-hogalid-yellow',
            )}
          >
            Nivå {levelInfo.level} — {levelInfo.levelName}
          </div>
        ) : (
          <div className="text-[13px] font-semibold text-white/40">Ej klar</div>
        )}
        <div className="text-[11px] text-white/30">
          {last.value} {challenge.type === 'touch' ? 'touch' : 'min'}
        </div>
      </div>
    </div>
  );
}
