'use client';

import { useState } from 'react';
import { useAdminMutations, useLeaders } from '@/hooks/useAdmin';
import { cn } from '@/lib/cn';

const PANEL = 'mb-4 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5';
const LABEL = 'mb-1 text-xs font-bold tracking-wider text-white/50 uppercase';
const INPUT =
  'flex-1 rounded-[10px] border border-white/20 bg-white/[0.08] px-3 py-2 text-[13px] text-white';

/**
 * Create a leader (coach) account. Leaders sign in with these credentials but
 * never play — they are excluded from leaderboards and can moderate (e.g.
 * approve photos). Server re-verifies the admin claim (SEC C1).
 */
export function LeaderManager() {
  const { createLeader, deleteUser } = useAdminMutations();
  const { data: leaders = [] } = useLeaders();
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState('');

  const canSubmit = alias.trim().length > 0 && password.length >= 4 && !createLeader.isPending;

  async function handleDelete(target: string, label: string) {
    if (!confirm(`Ta bort ledaren "${label}"? Detta går inte att ångra.`)) return;
    try {
      await deleteUser.mutateAsync(target);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      alert('Kunde inte ta bort ledaren: ' + msg);
    }
  }

  async function handleCreate() {
    if (!canSubmit) return;
    const name = alias.trim();
    try {
      await createLeader.mutateAsync({ alias: name, password });
      setDone(name);
      setAlias('');
      setPassword('');
      setTimeout(() => setDone(''), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      alert(
        msg.includes('alias_taken')
          ? 'Det finns redan ett konto med det namnet.'
          : 'Kunde inte skapa ledare: ' + msg,
      );
    }
  }

  return (
    <div className={PANEL}>
      <div className={LABEL}>👤 Skapa ledarkonto</div>
      <div className="mb-2.5 text-xs leading-snug text-white/40">
        Ledare loggar in som vanligt men spelar inte — de syns inte i topplistan och kan godkänna
        bilder. Välj ett namn och ett lösenord och dela med tränaren.
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Ledarnamn (t.ex. tranare-anna)"
          autoComplete="off"
          className={INPUT}
        />
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Lösenord (minst 4 tecken)"
            autoComplete="off"
            className={INPUT}
          />
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!canSubmit}
            className={cn(
              'rounded-[10px] px-4 py-2 text-[13px] font-bold whitespace-nowrap',
              !canSubmit ? 'bg-white/10 text-white/35' : 'bg-hogalid-yellow text-hogalid-dark',
            )}
          >
            {createLeader.isPending ? 'Skapar...' : 'Skapa'}
          </button>
        </div>
      </div>
      {done && (
        <div className="text-hogalid-yellow mt-2.5 text-[13px] font-bold">
          ✅ Ledaren &quot;{done}&quot; är skapad.
        </div>
      )}

      {leaders.length > 0 && (
        <div className="mt-3.5 border-t border-white/10 pt-3">
          <div className={LABEL}>Befintliga ledare ({leaders.length})</div>
          <div className="flex flex-col gap-1.5">
            {leaders.map((leader) => (
              <div
                key={leader.alias}
                className="flex items-center justify-between gap-2 rounded-[10px] bg-white/[0.06] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-white">
                    {leader.displayAlias || leader.alias}
                  </div>
                  {leader.mustChangePassword && (
                    <div className="text-[11px] text-white/40">Har inte bytt lösenord än</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(leader.alias, leader.displayAlias || leader.alias)}
                  disabled={deleteUser.isPending}
                  className="shrink-0 rounded-lg bg-red-500/15 px-3 py-1.5 text-[12px] font-bold text-red-300 disabled:opacity-50"
                >
                  Ta bort
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
