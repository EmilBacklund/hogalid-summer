'use client';

import { useState } from 'react';
import { EXERCISES } from '@/constants';
import { Card, ProgressBar, ButtonLoader } from '@/components/common';
import { cn } from '@/lib/cn';
import type { BuddyChallenge, User } from '@/types';

const SECTION = 'mt-4 mb-2 text-[11px] font-bold tracking-wider text-white/45 uppercase';

function hoursAgo(iso: string | null): number {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function formatCountdown(acceptedAt: string | null): string {
  if (!acceptedAt) return '';
  const ms = new Date(acceptedAt).getTime() + 48 * 3_600_000 - Date.now();
  if (ms <= 0) return 'Utgått';
  return `${Math.floor(ms / 3_600_000)}h ${Math.floor((ms % 3_600_000) / 60_000)}m kvar`;
}

const exLabel = (id: string) => EXERCISES.find((e) => e.id === id);

interface BuddyChallengeListProps {
  user: User;
  incoming: BuddyChallenge[];
  outgoing: BuddyChallenge[];
  active: BuddyChallenge[];
  finished: BuddyChallenge[];
  labelByAlias: Record<string, string>;
  onRespond: (challengeId: string, response: 'accept' | 'decline') => Promise<void>;
  onCancel: (challengeId: string) => void;
  onCelebrate: (challenge: BuddyChallenge) => void;
}

/** All of the acting user's buddy challenges, grouped by role + status. */
export function BuddyChallengeList({
  user,
  incoming,
  outgoing,
  active,
  finished,
  labelByAlias,
  onRespond,
  onCancel,
  onCelebrate,
}: BuddyChallengeListProps) {
  const [respondBusy, setRespondBusy] = useState('');

  async function respond(id: string, response: 'accept' | 'decline') {
    setRespondBusy(id + response);
    await onRespond(id, response);
    setRespondBusy('');
  }

  const empty =
    incoming.length === 0 && outgoing.length === 0 && active.length === 0 && finished.length === 0;

  return (
    <>
      {incoming.length > 0 && (
        <>
          <div className={SECTION}>📥 Inkommande ({incoming.length})</div>
          {incoming.map((c) => {
            const ex = exLabel(c.exerciseId);
            const waitH = Math.floor(hoursAgo(c.createdAt));
            return (
              <Card key={c.id} className="border-hogalid-yellow/[0.33] mb-2.5 border-[1.5px]">
                <div className="mb-2.5 flex items-start justify-between">
                  <div>
                    <div className="text-hogalid-yellow text-sm font-bold">
                      {labelByAlias[c.fromAlias] || c.fromAlias} utmanar dig!
                    </div>
                    <div className="mt-[3px] text-[15px] font-bold text-white">
                      {c.amount} {ex?.label} ({ex?.unit})
                    </div>
                  </div>
                  <div className="text-[11px] text-white/35">
                    {waitH < 1 ? 'Alldeles nyss' : `${waitH}h sedan`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void respond(c.id, 'accept')}
                    disabled={!!respondBusy}
                    className="bg-hogalid-yellow text-hogalid-dark font-display flex flex-1 items-center justify-center rounded-[10px] py-2.5 text-[15px]"
                  >
                    {respondBusy === c.id + 'accept' ? (
                      <ButtonLoader color="#001540" />
                    ) : (
                      '✅ Acceptera'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void respond(c.id, 'decline')}
                    disabled={!!respondBusy}
                    className="text-hogalid-red rounded-[10px] border border-[rgba(220,40,40,0.4)] px-3.5 py-2.5 text-sm"
                  >
                    {respondBusy === c.id + 'decline' ? <ButtonLoader /> : 'Neka'}
                  </button>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <div className={SECTION}>📤 Skickade</div>
          {outgoing.map((c) => {
            const ex = exLabel(c.exerciseId);
            const waitH = Math.floor(hoursAgo(c.createdAt));
            return (
              <Card key={c.id} className="mb-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/50">Till {c.toAlias}</div>
                    <div className="mt-0.5 text-sm font-bold text-white">
                      {c.amount} {ex?.label}
                    </div>
                  </div>
                  <div className="text-[11px] text-white/35">
                    Väntar sedan {waitH < 1 ? '<1h' : `${waitH}h`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCancel(c.id)}
                  className="w-full rounded-[10px] border border-white/15 py-2.5 text-[13px] text-white/40"
                >
                  Avbryt
                </button>
              </Card>
            );
          })}
        </>
      )}

      {active.length > 0 && (
        <>
          <div className={SECTION}>⚡ Pågående</div>
          {active.map((c) => {
            const ex = exLabel(c.exerciseId);
            const isFrom = c.fromAlias === user.alias;
            const myProgress = isFrom ? c.fromProgress : c.toProgress;
            const theirProgress = isFrom ? c.toProgress : c.fromProgress;
            const myDone = isFrom ? !!c.fromCompletedAt : !!c.toCompletedAt;
            const theirDone = isFrom ? !!c.toCompletedAt : !!c.fromCompletedAt;
            const partner = isFrom ? c.toAlias : c.fromAlias;
            const partnerLabel = labelByAlias[partner] || partner;
            const pct = Math.min(100, Math.round((myProgress / c.amount) * 100));
            const theirPct = Math.min(100, Math.round((theirProgress / c.amount) * 100));
            return (
              <Card key={c.id} className="border-hogalid-yellow/[0.27] mb-2.5 border-[1.5px]">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-hogalid-yellow text-[13px] font-bold">
                      Du &amp; {partnerLabel}
                    </div>
                    <div className="mt-0.5 text-[15px] font-bold text-white">
                      {c.amount} {ex?.label}
                    </div>
                  </div>
                  <div className="text-right text-xs font-semibold text-white/40">
                    ⏰ {formatCountdown(c.acceptedAt)}
                  </div>
                </div>
                <div className="mb-2.5">
                  <div className="mb-1 flex justify-between">
                    <span className="text-hogalid-yellow text-xs font-bold">
                      {myDone ? '✅ Du — klar!' : `Du — ${myProgress}/${c.amount} ${ex?.unit}`}
                    </span>
                    <span className="text-xs text-white/30">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={myDone ? '#f0dc00' : '#f0dc00'} height={7} />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <span className="text-xs font-bold text-white/60">
                      {theirDone
                        ? `✅ ${partnerLabel} — klar!`
                        : `${partnerLabel} — ${theirProgress}/${c.amount} ${ex?.unit}`}
                    </span>
                    <span className="text-xs text-white/30">{theirPct}%</span>
                  </div>
                  <ProgressBar
                    value={theirPct}
                    color={theirDone ? '#f0dc00' : 'rgba(255,255,255,0.3)'}
                    height={7}
                  />
                </div>
                {theirDone && !myDone && (
                  <div className="text-hogalid-yellow mt-2.5 rounded-[10px] bg-[rgba(240,220,0,0.13)] px-3 py-2 text-[13px] font-bold">
                    🔥 {partnerLabel} är klar — nu är det din tur!
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}

      {finished.length > 0 && (
        <>
          <div className={SECTION}>📋 Avslutade</div>
          {finished.map((c) => {
            const ex = exLabel(c.exerciseId);
            const partner = c.fromAlias === user.alias ? c.toAlias : c.fromAlias;
            const partnerLabel = labelByAlias[partner] || partner;
            const isCompleted = c.status === 'completed';
            const icon =
              c.status === 'completed'
                ? '🎉'
                : c.status === 'failed'
                  ? '❌'
                  : c.status === 'declined'
                    ? '🚫'
                    : '↩️';
            const label =
              c.status === 'completed'
                ? 'Klarad!'
                : c.status === 'failed'
                  ? 'Missad'
                  : c.status === 'declined'
                    ? 'Nekad'
                    : 'Avbruten';
            return (
              <button
                key={c.id}
                type="button"
                disabled={!isCompleted}
                onClick={() => isCompleted && onCelebrate(c)}
                className={cn(
                  'mb-2 flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left',
                  isCompleted
                    ? 'border-hogalid-yellow/20 border bg-[rgba(168,230,61,0.07)]'
                    : 'border border-transparent bg-white/[0.04] opacity-55',
                )}
              >
                <span className="text-lg">{icon}</span>
                <div className="flex-1">
                  <span className="text-[13px] font-semibold text-white">
                    {c.amount} {ex?.label}
                  </span>
                  <span className="text-xs text-white/40"> med {partnerLabel}</span>
                </div>
                <span
                  className={cn(
                    'text-xs font-bold',
                    isCompleted ? 'text-hogalid-yellow' : 'text-white/30',
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </>
      )}

      {empty && (
        <div className="py-6 text-center text-[13px] text-white/25">
          Inga utmaningar ännu — skicka en till en lagkompis!
        </div>
      )}
    </>
  );
}
