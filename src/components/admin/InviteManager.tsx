'use client';

import { useState } from 'react';
import { COLORS } from '@/constants';
import { useInvites, useAdminMutations } from '@/hooks/useAdmin';
import type { Invite } from '@/types';

function statusLabel(invite: Invite): string {
  if (invite.status === 'used') return 'Använd';
  if (invite.status === 'disabled') return 'Inaktiv';
  if (invite.status === 'clicked') return 'Öppnad';
  return 'Ej öppnad';
}

function statusColor(invite: Invite): string {
  if (invite.status === 'used') return COLORS.lime;
  if (invite.status === 'disabled') return '#f87171';
  if (invite.status === 'clicked') return COLORS.accent;
  return 'rgba(255,255,255,0.45)';
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

const SMALL_BTN = 'rounded-lg bg-white/10 px-2.5 py-[7px] text-xs font-bold text-white/70';

/** Create + manage named invite links/codes. */
export function InviteManager() {
  const { data: invites = [] } = useInvites();
  const { createInvite, updateInvite } = useAdminMutations();
  const [label, setLabel] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [busy, setBusy] = useState<{ id: number; mode: string } | null>(null);

  async function handleCreate() {
    if (!label.trim()) return;
    try {
      await createInvite.mutateAsync(label.trim());
      setLabel('');
    } catch (e) {
      alert('Kunde inte skapa inbjudan: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleAction(inviteId: number, mode: 'disable' | 'enable' | 'reset') {
    setBusy({ id: inviteId, mode });
    try {
      await updateInvite.mutateAsync({ inviteId, mode });
    } catch (e) {
      alert('Kunde inte uppdatera inbjudan: ' + (e instanceof Error ? e.message : ''));
    }
    setBusy(null);
  }

  async function copyLink(invite: Invite) {
    const url = `${window.location.origin}/?invite=${invite.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert(url);
    }
  }

  return (
    <div className="mb-[18px] rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5">
      <div className="mb-1.5 text-xs font-bold tracking-wider text-white/50 uppercase">
        🔐 Inbjudningslänkar &amp; koder
      </div>
      <div className="mb-3 text-xs leading-snug text-white/40">
        Skapa en namngiven inbjudan per spelare så du ser vem den skickats till, om den öppnats och
        vem som använt den.
      </div>

      <div className="mb-3.5 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
          aria-label="Namn på inbjudan"
          placeholder="Namnge länken, t.ex. Maja eller Spelare 12"
          className="flex-1 rounded-[10px] border border-white/20 bg-white/[0.08] px-3 py-2.5 text-[13px] text-white"
        />
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={!label.trim() || createInvite.isPending}
          className="rounded-[10px] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap disabled:bg-white/10 disabled:text-white/35"
          style={
            label.trim() && !createInvite.isPending
              ? { background: COLORS.lime, color: COLORS.dark }
              : undefined
          }
        >
          {createInvite.isPending ? 'Skapar...' : 'Ny invite'}
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="py-2 text-[13px] text-white/35">Inga invites skapade än.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {invites.map((invite) => {
            const inviteUrl = `${window.location.origin}/?invite=${invite.token}`;
            const isBusy = busy?.id === invite.id;
            return (
              <div
                key={invite.id}
                className="rounded-xl border border-white/[0.08] bg-black/[0.18] px-3 pt-3 pb-2.5"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[15px] font-extrabold text-white">{invite.label}</div>
                    <div
                      className="mt-0.5 text-xs font-bold"
                      style={{ color: statusColor(invite) }}
                    >
                      {statusLabel(invite)}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-white/35">
                    Skapad {formatDateTime(invite.createdAt)}
                  </div>
                </div>

                <div className="mb-1 text-[11px] text-white/40">Kod</div>
                <div className="text-hogalid-yellow mb-2 text-sm font-extrabold">{invite.code}</div>

                <div className="mb-1 text-[11px] text-white/40">Länk</div>
                <div className="mb-2.5 text-[11px] leading-snug break-all text-white/[0.72]">
                  {inviteUrl}
                </div>

                <div className="mb-2.5 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 px-2.5 py-2">
                    <div className="mb-[3px] text-[10px] text-white/35">Öppnad</div>
                    <div className="text-xs font-bold text-white">
                      {formatDateTime(invite.clickedAt)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2.5 py-2">
                    <div className="mb-[3px] text-[10px] text-white/35">Använd av</div>
                    <div className="text-xs font-bold text-white">{invite.usedByAlias || '—'}</div>
                    <div className="mt-0.5 text-[10px] text-white/35">
                      {formatDateTime(invite.usedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => void copyLink(invite)}
                    className="rounded-lg px-2.5 py-[7px] text-xs font-bold"
                    style={
                      copiedId === invite.id
                        ? { background: COLORS.lime, color: COLORS.dark }
                        : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
                    }
                  >
                    {copiedId === invite.id ? '✅ Kopierad' : 'Kopiera länk'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(invite.code)}
                    className={SMALL_BTN}
                  >
                    Kopiera kod
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleAction(
                        invite.id,
                        invite.status === 'disabled' ? 'enable' : 'disable',
                      )
                    }
                    disabled={isBusy}
                    className="rounded-lg bg-white/10 px-2.5 py-[7px] text-xs font-bold disabled:opacity-60"
                    style={{ color: invite.status === 'disabled' ? COLORS.lime : '#fca5a5' }}
                  >
                    {isBusy && (busy?.mode === 'disable' || busy?.mode === 'enable')
                      ? 'Sparar...'
                      : invite.status === 'disabled'
                        ? 'Aktivera'
                        : 'Inaktivera'}
                  </button>
                  {/* Reset would unlink the player who redeemed this invite, so
                      it is only offered for invites that have never been used. */}
                  {!invite.usedAt && (
                    <button
                      type="button"
                      onClick={() => void handleAction(invite.id, 'reset')}
                      disabled={isBusy}
                      className="rounded-lg bg-white/10 px-2.5 py-[7px] text-xs font-bold disabled:opacity-60"
                      style={{ color: COLORS.accent }}
                    >
                      {isBusy && busy?.mode === 'reset' ? 'Återställer...' : 'Återställ'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
