import type { Client, Row } from '@libsql/client';
import { randomUUID } from 'node:crypto';

/**
 * Invite helpers ported from netlify/functions/users.js. An invite gates
 * registration: each is single-use, identified by an opaque `token` (link) or a
 * short human `code`.
 */

export type InviteStatus = 'active' | 'clicked' | 'used' | 'disabled';

export interface InviteClient {
  id: number;
  label: string;
  token: string;
  code: string;
  status: InviteStatus;
  clickedAt: string | null;
  usedAt: string | null;
  usedByAlias: string;
  createdAt: string;
}

function randomToken(): string {
  return randomUUID().replace(/-/g, '');
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  const part = () =>
    Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(
      '',
    );
  return `F15-${part()}`;
}

export function normalizeInviteStatus(row: Row): InviteStatus {
  const status = String(row.status ?? '');
  if (status === 'used') return 'used';
  if (status === 'disabled') return 'disabled';
  if (row.clicked_at) return 'clicked';
  return 'active';
}

export function inviteRowToClient(row: Row): InviteClient {
  return {
    id: Number(row.id),
    label: String(row.label),
    token: String(row.token),
    code: String(row.code),
    status: normalizeInviteStatus(row),
    clickedAt: row.clicked_at ? String(row.clicked_at) : null,
    usedAt: row.used_at ? String(row.used_at) : null,
    usedByAlias: String(row.used_by_label ?? row.used_by_alias ?? ''),
    createdAt: String(row.created_at),
  };
}

/** Attach a friendly display label for the user who redeemed an invite. */
export async function hydrateInviteDisplay(db: Client, invite: Row): Promise<Row> {
  if (!invite.used_by_alias) return invite;
  const result = await db.execute({
    sql: 'SELECT display_name, display_alias, alias FROM users WHERE alias = ?',
    args: [String(invite.used_by_alias)],
  });
  const user = result.rows[0];
  if (!user) return invite;
  return {
    ...invite,
    used_by_label: user.display_name || user.display_alias || user.alias,
  } as Row;
}

export async function getInviteByToken(db: Client, token: string): Promise<Row | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM invites WHERE token = ?',
    args: [token],
  });
  return result.rows[0] ?? null;
}

export async function getInviteByCode(db: Client, code: string): Promise<Row | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM invites WHERE UPPER(code) = ?',
    args: [code.trim().toUpperCase()],
  });
  return result.rows[0] ?? null;
}

/** Mark an unused invite as clicked the first time it is opened. */
export async function markInviteClicked(db: Client, invite: Row): Promise<Row> {
  const status = String(invite.status ?? '');
  if (status === 'used' || status === 'disabled' || invite.clicked_at) return invite;
  const clickedAt = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE invites SET clicked_at = ?, status = ? WHERE id = ?',
    args: [clickedAt, 'clicked', Number(invite.id)],
  });
  return { ...invite, clicked_at: clickedAt, status: 'clicked' } as Row;
}

export async function generateUniqueInvite(db: Client, label: string): Promise<Row> {
  for (let i = 0; i < 12; i++) {
    const token = randomToken();
    const code = randomCode();
    const existing = await db.execute({
      sql: 'SELECT id FROM invites WHERE token = ? OR code = ?',
      args: [token, code],
    });
    if (existing.rows.length === 0) {
      const createdAt = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO invites (label, token, code, status, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [label, token, code, 'active', createdAt],
      });
      const created = await getInviteByToken(db, token);
      if (created) return created;
    }
  }
  throw new Error('invite_generation_failed');
}
