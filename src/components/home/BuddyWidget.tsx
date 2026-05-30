'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { BuddyChallenge } from '@/types';

const FORTY_EIGHT_H = 48 * 3_600_000;
const EIGHT_H = 8 * 3_600_000;

interface BuddyWidgetProps {
  buddyChallenges: BuddyChallenge[];
  myAlias: string;
  nameByAlias: Record<string, string>;
  onOpen: () => void;
}

/** Home widget surfacing incoming, active and soon-to-expire buddy challenges. */
export function BuddyWidget({ buddyChallenges, myAlias, nameByAlias, onOpen }: BuddyWidgetProps) {
  const incoming = buddyChallenges.filter((c) => c.toAlias === myAlias && c.status === 'pending');
  const active = buddyChallenges.filter(
    (c) => (c.fromAlias === myAlias || c.toAlias === myAlias) && c.status === 'active',
  );
  const urgent = active.filter((c) => {
    if (!c.acceptedAt) return false;
    const ms = new Date(c.acceptedAt).getTime() + FORTY_EIGHT_H - Date.now();
    return ms > 0 && ms < EIGHT_H;
  });

  if (incoming.length === 0 && active.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'mb-3 block w-full rounded-[14px] bg-white/[0.06] px-3.5 py-3 text-left',
        incoming.length > 0 ? 'border-hogalid-yellow/55 border-[1.5px]' : 'border border-white/10',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between',
          (incoming.length > 0 || urgent.length > 0) && 'mb-2',
        )}
      >
        <span className="text-sm font-bold text-white">🤝 Kompisutmaningar</span>
        <span className="text-hogalid-yellow flex items-center gap-[3px] text-xs font-semibold">
          Se alla <ArrowRight size={13} />
        </span>
      </div>

      {incoming.length > 0 && (
        <div
          className={cn(
            'rounded-[10px] bg-[rgba(240,220,0,0.13)] px-[11px] py-2',
            urgent.length > 0 && 'mb-1.5',
          )}
        >
          <span className="text-hogalid-yellow text-[13px] font-bold">
            📥 {incoming.length} inkommande utmaning{incoming.length > 1 ? 'ar' : ''} väntar på
            svar!
          </span>
        </div>
      )}

      {urgent.map((c) => {
        const ms = new Date(c.acceptedAt!).getTime() + FORTY_EIGHT_H - Date.now();
        const h = Math.floor(ms / 3_600_000);
        const m = Math.floor((ms % 3_600_000) / 60_000);
        const partner = c.fromAlias === myAlias ? c.toAlias : c.fromAlias;
        const partnerLabel = nameByAlias[partner] || partner;
        return (
          <div key={c.id} className="mb-1 rounded-[10px] bg-[rgba(220,40,40,0.15)] px-[11px] py-2">
            <span className="text-hogalid-red text-[13px] font-bold">
              ⏰ Du &amp; {partnerLabel} — {h}h {m}m kvar!
            </span>
          </div>
        );
      })}

      {active.length > 0 && urgent.length === 0 && incoming.length === 0 && (
        <div className="text-[13px] text-white/50">
          {active.length} aktiv{active.length > 1 ? 'a' : ''} utmaning
          {active.length > 1 ? 'ar' : ''} pågår
        </div>
      )}
    </button>
  );
}
