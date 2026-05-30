'use client';

import { useState } from 'react';
import { COLORS } from '@/constants';
import { Card } from '@/components/common';
import { AvatarSVG } from '@/components/avatar';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

type CheerResult = 'sent' | 'already' | 'error';

interface RosterCardProps {
  members: User[];
  myAlias: string;
  onCheer: (alias: string) => Promise<CheerResult>;
}

function userLabel(u: User): string {
  return u.displayName || u.displayAlias || u.alias;
}

/** Collapsible teammate roster with a one-tap "heja" (cheer) per player/day. */
export function RosterCard({ members, myAlias, onCheer }: RosterCardProps) {
  const [open, setOpen] = useState(false);
  const [cheered, setCheered] = useState<Record<string, 'sent' | 'already'>>({});

  async function handleCheer(alias: string) {
    if (cheered[alias]) return;
    const result = await onCheer(alias);
    if (result === 'sent') setCheered((p) => ({ ...p, [alias]: 'sent' }));
    else if (result === 'already') setCheered((p) => ({ ...p, [alias]: 'already' }));
  }

  return (
    <Card className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <div className="text-sm font-bold text-white/70">👥 Lagkompisar ({members.length})</div>
        <div className="text-lg leading-none text-white/40">{open ? '▲' : '▼'}</div>
      </button>
      {open && (
        <div className="mt-3.5 grid grid-cols-3 gap-3">
          {members.map((u) => {
            const isMe = u.alias === myAlias;
            const state = cheered[u.alias];
            return (
              <div key={u.alias} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'rounded-full border-2 bg-white/[0.06] p-1',
                    isMe ? 'border-hogalid-yellow' : 'border-transparent',
                  )}
                >
                  <AvatarSVG avatarConfig={u.avatarConfig} size={52} />
                </div>
                <div
                  className={cn(
                    'text-center text-xs leading-tight font-bold',
                    isMe ? 'text-hogalid-yellow' : 'text-white',
                  )}
                >
                  {userLabel(u)}
                </div>
                {isMe ? (
                  <div className="text-hogalid-yellow text-[10px]">Du</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleCheer(u.alias)}
                    className="rounded-xl border px-2.5 py-[3px] text-[11px] font-bold transition-all"
                    style={{
                      background:
                        state === 'sent'
                          ? 'rgba(168,230,61,0.2)'
                          : state === 'already'
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(255,200,0,0.15)',
                      borderColor: state === 'sent' ? COLORS.lime : 'rgba(255,200,0,0.3)',
                      color:
                        state === 'sent'
                          ? COLORS.lime
                          : state === 'already'
                            ? 'rgba(255,255,255,0.4)'
                            : COLORS.yellow,
                      cursor: state ? 'default' : 'pointer',
                    }}
                  >
                    {state === 'sent'
                      ? '✅ Hejat!'
                      : state === 'already'
                        ? 'Redan hejat'
                        : '📣 Heja!'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
