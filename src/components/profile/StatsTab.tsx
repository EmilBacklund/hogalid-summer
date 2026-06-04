import { COLORS, EXERCISES } from '@/constants';
import { Card } from '@/components/common';
import type { Stats, User } from '@/types';

interface StatsTabProps {
  stats: Stats;
  user: User;
}

/** "Stats" tab: streaks, season totals, and per-exercise records. */
export function StatsTab({ stats, user }: StatsTabProps) {
  const streaks = [
    { label: 'Fotboll', val: stats.streak, icon: '⚽', color: COLORS.lime },
    { label: 'Glass', val: stats.iceCreamStreak, icon: '🍦', color: '#f9a8d4' },
    { label: 'Bad', val: stats.swimStreak, icon: '🏊', color: '#60a5fa' },
    { label: 'Läsning', val: stats.readStreak, icon: '📖', color: '#86efac' },
  ];
  const totals = [
    { label: 'Träningsmin', val: stats.totalMinutes, icon: '⏱' },
    { label: 'Touch totalt', val: stats.totalTouch, icon: '🦶' },
    { label: 'Längsta streak', val: stats.maxStreak, icon: '💪' },
    { label: 'Glassar', val: stats.totalIceCream, icon: '🍦' },
    { label: 'Bad', val: stats.totalSwim, icon: '🏊' },
    { label: 'Sidor lästa', val: stats.totalPages, icon: '📖' },
  ];
  const highscores = Object.entries(user.highscores || {});

  return (
    <div>
      <div className="font-display mb-2.5 text-lg text-white">Streaks</div>
      <div className="mb-5 grid grid-cols-2 gap-2.5">
        {streaks.map(({ label, val, icon, color }) => (
          <Card key={label} className="px-2 py-3.5 text-center">
            <div className="text-2xl">{icon}</div>
            <div className="font-display mt-0.5 text-[28px] leading-[1.1]" style={{ color }}>
              {val}
            </div>
            <div className="mt-0.5 text-[11px] text-white/45">dagar i rad</div>
            <div className="text-[10px] text-white/30">{label}</div>
          </Card>
        ))}
      </div>

      <div className="font-display mb-2.5 text-lg text-white">Totalt</div>
      <div className="mb-5 grid grid-cols-3 gap-2.5">
        {totals.map(({ label, val, icon }) => (
          <Card key={label} className="px-2 py-3 text-center">
            <div className="text-[22px]">{icon}</div>
            <div className="font-display text-[22px] text-white">{val}</div>
            <div className="text-[11px] text-white/50">{label}</div>
          </Card>
        ))}
      </div>

      {highscores.length > 0 && (
        <>
          <div className="font-display mb-2.5 text-lg text-white">Rekord</div>
          <Card className="mb-4">
            {highscores.map(([id, val]) => {
              const ex = EXERCISES.find((e) => e.id === id);
              return ex ? (
                <div key={id} className="mb-1 flex justify-between text-[13px] text-white/80">
                  <span>{ex.label}</span>
                  <span className="text-hogalid-yellow font-bold">{val} i rad</span>
                </div>
              ) : null;
            })}
          </Card>
        </>
      )}
    </div>
  );
}
