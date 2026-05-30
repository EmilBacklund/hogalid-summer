'use client';

import { useState } from 'react';
import { COLORS } from '@/constants';
import { getLevel } from '@/utils';
import { AvatarSVG } from '@/components/avatar';
import { useAdminMutations } from '@/hooks/useAdmin';
import type { Stats, User } from '@/types';

interface PlayerCardProps {
  player: User;
  stats: Stats;
  lastActivity: string | null;
  today: string;
}

function daysSince(today: string, dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((new Date(today).getTime() - new Date(dateStr).getTime()) / 86400000);
}

function activityColor(days: number | null): string {
  if (days === null) return 'rgba(255,255,255,0.3)';
  if (days === 0) return COLORS.lime;
  if (days <= 3) return COLORS.accent;
  if (days <= 7) return '#fb923c';
  return '#f87171';
}

const STAT_BOX = 'rounded-[10px] bg-white/5 px-1.5 py-[7px] text-center';

/**
 * One player's admin card: stats, password reset, and delete. No password is
 * ever shown (SEC C2) — only a reset to a fresh hash.
 */
export function PlayerCard({ player, stats, lastActivity, today }: PlayerCardProps) {
  const { resetPassword, deleteUser } = useAdminMutations();
  const [showReset, setShowReset] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removed, setRemoved] = useState(false);

  const days = daysSince(today, lastActivity);
  const level = getLevel(stats.totalPoints);

  async function handleResetPassword() {
    if (!newPw.trim()) return;
    try {
      await resetPassword.mutateAsync({ alias: player.alias, newPassword: newPw.trim() });
      setShowReset(false);
      setNewPw('');
    } catch (e) {
      alert('Kunde inte byta lösenord: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleDelete() {
    try {
      await deleteUser.mutateAsync(player.alias);
      setRemoved(true);
    } catch (e) {
      alert('Kunde inte ta bort spelare: ' + (e instanceof Error ? e.message : ''));
    }
  }

  if (removed) return null;

  const statBoxes: { lbl: string; val: string | number; col: string }[] = [
    { lbl: 'Poäng', val: stats.totalPoints, col: COLORS.accent },
    { lbl: 'Minuter', val: stats.totalMinutes, col: COLORS.lime },
    { lbl: 'Touch', val: stats.totalTouch, col: '#60a5fa' },
    { lbl: 'Bingo', val: `${stats.bingoCount}/50`, col: COLORS.yellow },
  ];

  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5">
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AvatarSVG avatarConfig={player.avatarConfig} size={32} />
          <div>
            <div className="text-base font-bold text-white">{player.alias}</div>
            <div className="text-xs text-white/40">
              {level.icon} {level.name}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-bold" style={{ color: activityColor(days) }}>
            {days === null
              ? 'Aldrig loggat'
              : days === 0
                ? 'Aktiv idag ✅'
                : `${days} dag${days === 1 ? '' : 'ar'} sedan`}
          </div>
          <div className="mt-0.5 text-[11px] text-white/30">{lastActivity || '—'}</div>
        </div>
      </div>

      <div className="mb-2.5 grid grid-cols-4 gap-1.5">
        {statBoxes.map(({ lbl, val, col }) => (
          <div key={lbl} className={STAT_BOX}>
            <div className="text-[15px] font-bold" style={{ color: col }}>
              {val}
            </div>
            <div className="mt-px text-[10px] text-white/35">{lbl}</div>
          </div>
        ))}
      </div>

      <div className="mb-2 text-xs text-white/40">
        🔥 Streak: <span className="font-bold text-white">{stats.streak}</span> dagar &nbsp;|&nbsp;
        Bästa: <span className="font-bold text-white">{stats.maxStreak}</span> dagar &nbsp;|&nbsp;
        Pass: <span className="font-bold text-white">{stats.totalLogs}</span>
      </div>

      {/* Password reset (no plaintext display — SEC C2) */}
      <div className="rounded-[10px] bg-black/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">🔑 Lösenord</span>
          <button
            type="button"
            onClick={() => setShowReset((v) => !v)}
            className="ml-auto rounded-md bg-white/10 px-2.5 py-1 text-xs"
            style={{ color: COLORS.accent }}
          >
            Byt
          </button>
        </div>
        {showReset && (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Nytt lösenord"
              className="flex-1 rounded-lg border border-white/20 bg-white/[0.08] px-2.5 py-1.5 text-[13px] text-white"
            />
            <button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={resetPassword.isPending}
              className="text-hogalid-dark min-w-[60px] rounded-lg px-3.5 py-1.5 text-xs font-bold"
              style={{
                background: resetPassword.isPending ? 'rgba(240,220,0,0.5)' : COLORS.lime,
                opacity: resetPassword.isPending ? 0.7 : 1,
              }}
            >
              {resetPassword.isPending ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        )}
      </div>

      {confirmDelete ? (
        <div className="mt-1.5 rounded-[10px] border border-[rgba(220,40,40,0.35)] bg-[rgba(220,40,40,0.1)] px-3 py-2.5">
          <div className="mb-2 text-[13px] font-bold text-[#f87171]">
            ⚠️ Ta bort {player.alias}? All data raderas permanent.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleteUser.isPending}
              className="flex-1 rounded-lg py-2 text-[13px] font-bold text-white"
              style={{ background: COLORS.red, opacity: deleteUser.isPending ? 0.6 : 1 }}
            >
              {deleteUser.isPending ? 'Tar bort...' : 'Ja, ta bort'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-white/15 px-3.5 py-2 text-[13px] text-white/50"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-1.5 w-full rounded-[10px] border border-[rgba(220,40,40,0.3)] py-1.5 text-xs font-bold text-[#f87171]"
        >
          🗑️ Ta bort spelare
        </button>
      )}
    </div>
  );
}
