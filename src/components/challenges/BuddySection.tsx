'use client';

import { useState } from 'react';
import { Card, BuddyCelebration } from '@/components/common';
import { cn } from '@/lib/cn';
import { QuickChallenge } from './QuickChallenge';
import { ChallengeForm } from './ChallengeForm';
import { BuddyChallengeList } from './BuddyChallengeList';
import type { BuddyChallenge, User } from '@/types';

const ERROR_TEXT: Record<string, string> = {
  too_many_own: 'Du har redan tre aktiva utmaningar.',
  too_many_target: 'Kompisen har redan tre aktiva utmaningar.',
  pair_exists: 'Ni har redan en utmaning ihop.',
  user_not_found: 'Hittar inte den spelaren.',
  unknown_exercise: 'Okänd övning.',
  invalid_target: 'Du kan inte utmana dig själv.',
};

function errorText(raw: string): string {
  let code = raw;
  try {
    code = JSON.parse(raw).error ?? raw;
  } catch {
    // not JSON — use the raw text
  }
  return ERROR_TEXT[code] || 'Något gick fel';
}

interface BuddySectionProps {
  user: User;
  allUsers: User[];
  buddyChallenges: BuddyChallenge[];
  onCreate: (toAlias: string, exerciseId: string, amount: number) => Promise<void>;
  onRespond: (challengeId: string, response: 'accept' | 'decline') => Promise<void>;
  onCancel: (challengeId: string) => void;
}

/** The full "Kompisutmaningar" block: quick generator, create form, and lists. */
export function BuddySection({
  user,
  allUsers,
  buddyChallenges,
  onCreate,
  onRespond,
  onCancel,
}: BuddySectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [celebrate, setCelebrate] = useState<BuddyChallenge | null>(null);

  const getUserLabel = (u: User) => u.displayName || u.displayAlias || u.alias;
  const labelByAlias = Object.fromEntries(allUsers.map((u) => [u.alias, getUserLabel(u)]));
  const teammates = allUsers.filter((u) => u.alias !== user.alias);

  const incoming = buddyChallenges.filter(
    (c) => c.toAlias === user.alias && c.status === 'pending',
  );
  const outgoing = buddyChallenges.filter(
    (c) => c.fromAlias === user.alias && c.status === 'pending',
  );
  const active = buddyChallenges.filter(
    (c) => (c.fromAlias === user.alias || c.toAlias === user.alias) && c.status === 'active',
  );
  const finished = buddyChallenges
    .filter(
      (c) =>
        (c.fromAlias === user.alias || c.toAlias === user.alias) &&
        ['completed', 'failed', 'declined', 'cancelled'].includes(c.status),
    )
    .slice(0, 5);

  const activeCountByAlias: Record<string, number> = {};
  buddyChallenges.forEach((c) => {
    if (['pending', 'active'].includes(c.status)) {
      activeCountByAlias[c.fromAlias] = (activeCountByAlias[c.fromAlias] || 0) + 1;
      activeCountByAlias[c.toAlias] = (activeCountByAlias[c.toAlias] || 0) + 1;
    }
  });

  async function create(toAlias: string, exerciseId: string, amount: number) {
    try {
      await onCreate(toAlias, exerciseId, amount);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorText(e instanceof Error ? e.message : '') };
    }
  }

  return (
    <Card className="mb-5 border border-[rgba(240,220,0,0.18)] bg-[linear-gradient(180deg,rgba(0,20,64,0.88),rgba(0,20,64,0.72))]">
      {celebrate &&
        (() => {
          const partner =
            celebrate.fromAlias === user.alias ? celebrate.toAlias : celebrate.fromAlias;
          return (
            <BuddyCelebration
              challenge={celebrate}
              user={user}
              partnerLabel={labelByAlias[partner] ?? partner}
              onClose={() => setCelebrate(null)}
            />
          );
        })()}

      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wider text-white/50 uppercase">
            🤝 Kompisutmaningar
          </div>
          <div className="text-[11px] text-white/30">Klara tillsammans — dubbla poäng!</div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            'rounded-[10px] px-3.5 py-2 text-[13px] font-bold',
            showForm ? 'bg-white/[0.12] text-white/70' : 'bg-hogalid-yellow text-hogalid-dark',
          )}
        >
          {showForm ? '✕ Stäng' : '+ Ny utmaning'}
        </button>
      </div>

      <QuickChallenge
        user={user}
        teammates={teammates}
        buddyChallenges={buddyChallenges}
        activeCountByAlias={activeCountByAlias}
        getUserLabel={getUserLabel}
        onCreate={create}
      />

      {showForm && (
        <ChallengeForm
          user={user}
          teammates={teammates}
          buddyChallenges={buddyChallenges}
          activeCountByAlias={activeCountByAlias}
          getUserLabel={getUserLabel}
          onCreate={create}
        />
      )}

      <BuddyChallengeList
        user={user}
        incoming={incoming}
        outgoing={outgoing}
        active={active}
        finished={finished}
        labelByAlias={labelByAlias}
        onRespond={onRespond}
        onCancel={onCancel}
        onCelebrate={setCelebrate}
      />
    </Card>
  );
}
