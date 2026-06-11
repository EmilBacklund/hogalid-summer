'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { COLORS } from '@/constants';
import { useInvites, useAdminMutations } from '@/hooks/useAdmin';
import { useAllUsers } from '@/hooks/useAllUsers';
import type { Invite } from '@/types';

function statusLabel(invite: Invite): string {
  if (invite.status === 'used') return 'Använd';
  if (invite.status === 'disabled') return 'Inaktiv';
  if (invite.status === 'clicked') return 'Öppnad';
  return 'Ej öppnad';
}

function statusColor(invite: Invite): string {
  // Distinct hues so the states read at a glance: grey → yellow → green, red for
  // disabled. (COLORS.lime and COLORS.accent are both the theme yellow now, so
  // "used" and "clicked" must not share them — see colors.ts.)
  if (invite.status === 'used') return '#4ade80'; // green — redeemed
  if (invite.status === 'disabled') return '#f87171'; // red — revoked
  if (invite.status === 'clicked') return COLORS.yellow; // yellow — opened
  return 'rgba(255,255,255,0.45)'; // grey — never opened
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Open a print-friendly window with the invite's name, QR code and link/code so
 * the admin can hand a player a physical slip. The QR is passed in as a data URL
 * (already generated for the inline preview) so printing needs no extra work.
 */
function printInvite(invite: Invite, qrDataUrl: string, inviteUrl: string): void {
  const win = window.open('', '_blank', 'width=640,height=800');
  if (!win) {
    alert('Kunde inte öppna utskriftsfönstret. Tillåt popup-fönster och försök igen.');
    return;
  }
  const name = escapeHtml(invite.label);
  const code = escapeHtml(invite.code);
  const url = escapeHtml(inviteUrl);
  win.document.write(`<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<title>Inbjudan – ${name}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 48px 32px;
         color: #002864; text-align: center; }
  .name { font-size: 30px; font-weight: 800; margin: 0 0 8px; }
  .sub { font-size: 15px; color: #555; margin: 0 0 28px; }
  img.qr { width: 280px; height: 280px; }
  .code { margin-top: 24px; font-size: 14px; color: #555; }
  .code b { display: block; font-size: 24px; letter-spacing: 2px; color: #002864; margin-top: 4px; }
  .url { margin-top: 18px; font-size: 12px; color: #777; word-break: break-all; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <h1 class="name">${name}</h1>
  <p class="sub">Skanna QR-koden för att gå med i Högalid F15</p>
  <img class="qr" src="${qrDataUrl}" alt="QR-kod" onload="window.focus();window.print();" />
  <div class="code">Eller använd koden:<b>${code}</b></div>
  <div class="url">${url}</div>
</body>
</html>`);
  win.document.close();
}

const SMALL_BTN = 'rounded-lg bg-white/10 px-2.5 py-[7px] text-xs font-bold text-white/70';

/** Create + manage named invite links/codes. */
export function InviteManager() {
  const { data: invites = [] } = useInvites();
  const { data: allUsers = [] } = useAllUsers();
  const { createInvite, updateInvite } = useAdminMutations();
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState<{ id: number; mode: string } | null>(null);

  // The display name (smeknamn) a redeemer currently uses, keyed by their
  // lowercased login alias — so the admin sees both the login id the invite is
  // tied to AND the nickname that player goes by now.
  const nicknameByAlias = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of allUsers) {
      if (u.displayName) map.set(u.alias.toLowerCase(), u.displayName);
    }
    return map;
  }, [allUsers]);

  async function handleCreate() {
    if (!label.trim()) return;
    try {
      await createInvite.mutateAsync(label.trim());
      setLabel('');
    } catch (e) {
      alert('Kunde inte skapa inbjudan: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleAction(inviteId: number, mode: 'disable' | 'enable') {
    setBusy({ id: inviteId, mode });
    try {
      await updateInvite.mutateAsync({ inviteId, mode });
    } catch (e) {
      alert('Kunde inte uppdatera inbjudan: ' + (e instanceof Error ? e.message : ''));
    }
    setBusy(null);
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
          {invites.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              busy={busy}
              onAction={handleAction}
              redeemerNickname={
                invite.usedByAlias
                  ? (nicknameByAlias.get(invite.usedByAlias.toLowerCase()) ?? null)
                  : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InviteCard({
  invite,
  busy,
  onAction,
  redeemerNickname,
}: {
  invite: Invite;
  busy: { id: number; mode: string } | null;
  onAction: (inviteId: number, mode: 'disable' | 'enable') => void;
  /** The smeknamn the redeemer currently goes by, if they set one. */
  redeemerNickname: string | null;
}) {
  const inviteUrl = `${window.location.origin}/?invite=${invite.token}`;
  const [qr, setQr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const isBusy = busy?.id === invite.id;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(inviteUrl, { width: 240, margin: 1 })
      .then((url) => {
        if (active) setQr(url);
      })
      .catch(() => {
        if (active) setQr(null);
      });
    return () => {
      active = false;
    };
  }, [inviteUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      alert(inviteUrl);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/[0.18] px-3 pt-3 pb-2.5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-[15px] font-extrabold text-white">{invite.label}</div>
          <div className="mt-0.5 text-xs font-bold" style={{ color: statusColor(invite) }}>
            {statusLabel(invite)}
          </div>
        </div>
        <div className="text-right text-[11px] text-white/35">
          Skapad {formatDateTime(invite.createdAt)}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="shrink-0">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt={`QR-kod för ${invite.label}`}
              className="h-[88px] w-[88px] rounded-lg bg-white p-1"
            />
          ) : (
            <div className="h-[88px] w-[88px] rounded-lg bg-white/10" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[11px] text-white/40">Kod</div>
          <div className="text-hogalid-yellow mb-2 text-sm font-extrabold">{invite.code}</div>
          <div className="mb-1 text-[11px] text-white/40">Länk</div>
          <div className="text-[11px] leading-snug break-all text-white/[0.72]">{inviteUrl}</div>
        </div>
      </div>

      <div className="mt-2.5 mb-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 px-2.5 py-2">
          <div className="mb-[3px] text-[10px] text-white/35">Öppnad</div>
          <div className="text-xs font-bold text-white">{formatDateTime(invite.clickedAt)}</div>
        </div>
        <div className="rounded-lg bg-white/5 px-2.5 py-2">
          <div className="mb-[3px] text-[10px] text-white/35">Använd av (inloggning)</div>
          <div className="text-xs font-bold text-white">{invite.usedByAlias || '—'}</div>
          {redeemerNickname && (
            <div className="mt-0.5 text-[10px] text-white/55">
              Smeknamn: <span className="font-bold text-white/80">{redeemerNickname}</span>
            </div>
          )}
          <div className="mt-0.5 text-[10px] text-white/35">{formatDateTime(invite.usedAt)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-lg px-2.5 py-[7px] text-xs font-bold"
          style={
            copiedId
              ? { background: COLORS.lime, color: COLORS.dark }
              : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }
          }
        >
          {copiedId ? '✅ Kopierad' : 'Kopiera länk'}
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
          onClick={() => qr && printInvite(invite, qr, inviteUrl)}
          disabled={!qr}
          className={SMALL_BTN + ' disabled:opacity-40'}
        >
          🖨️ Skriv ut
        </button>
        {/* Disabling only revokes an invite that has not been redeemed yet — a
            used invite is already permanently unusable, so the toggle is hidden
            for it. (A previously disabled invite still shows "Aktivera" so it is
            never stranded.) */}
        {invite.status !== 'used' && (
          <button
            type="button"
            onClick={() => onAction(invite.id, invite.status === 'disabled' ? 'enable' : 'disable')}
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
        )}
      </div>
    </div>
  );
}
