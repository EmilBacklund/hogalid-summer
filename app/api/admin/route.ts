import { z } from 'zod';
import { getDb, initDb } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { ApiError, handle, json, requireAdmin } from '@/server/responses';
import { getPhotoStorage } from '@/server/photoStorage';
import { stockholmToday } from '@/server/dates';
import {
  adminAliasSchema,
  adminCreateLeaderSchema,
  adminDateSchema,
  adminDeleteLogSchema,
  adminFirstLogSchema,
  adminResetPasswordSchema,
} from '@/schemas';
import type { Client } from '@libsql/client';

export const runtime = 'nodejs';

const actionSchema = z.object({
  action: z.enum([
    'reset-season',
    'reset-password',
    'create-leader',
    'delete-user',
    'season-start',
    'countdown-date',
    'first-log',
    'delete-log',
  ]),
});

function field<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
  raw: unknown,
): T {
  const result = schema.safeParse(raw);
  if (!result.success || result.data === undefined) throw new ApiError('invalid_body', 400);
  return result.data;
}

async function setConfig(db: Client, key: string, value: string): Promise<void> {
  await db.execute({
    sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
    args: [key, value],
  });
}

/**
 * All destructive / privileged operations. Every branch is gated by the signed
 * `admin` claim (SEC C1) — never trusted from the client alone.
 */
export function POST(req: Request) {
  return handle(async () => {
    await requireAdmin(req);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ApiError('invalid_body', 400);
    }
    const { action } = field(actionSchema, raw);

    const db = getDb();
    await initDb(db);

    switch (action) {
      case 'reset-season': {
        await db.executeMultiple(`
          DELETE FROM logs;
          DELETE FROM bingo;
          DELETE FROM bonus_bingo;
          DELETE FROM bingo_two;
          DELETE FROM adult_bingo;
          DELETE FROM completed_daily;
          DELETE FROM users;
          DELETE FROM weekly_results;
          DELETE FROM feed_reactions;
          DELETE FROM cheers;
          DELETE FROM buddy_challenges;
          DELETE FROM album_photos;
          DELETE FROM invites;
        `);
        const today = stockholmToday();
        await setConfig(db, 'season_start', today);
        return json({ ok: true, seasonStart: today });
      }

      case 'reset-password': {
        // SEC C2: store only the new PBKDF2 hash — no plaintext, no "show password".
        const { alias, newPassword } = field(adminResetPasswordSchema, raw);
        const hashed = await hashPassword(newPassword);
        await db.execute({
          sql: 'UPDATE users SET password = ? WHERE alias = ?',
          args: [hashed, alias.toLowerCase()],
        });
        return json({ ok: true });
      }

      case 'create-leader': {
        // A coach account: can moderate (e.g. approve photos) but never plays,
        // so it is excluded from leaderboards. Stored exactly like a player
        // (PBKDF2 hash, SEC C2) but with role = 'leader'.
        const { alias, password } = field(adminCreateLeaderSchema, raw);
        const key = alias.toLowerCase();
        const existing = await db.execute({
          sql: 'SELECT alias FROM users WHERE alias = ?',
          args: [key],
        });
        if (existing.rows.length > 0) throw new ApiError('alias_taken', 409);
        const hashed = await hashPassword(password);
        const joinedAt = new Date().toISOString();
        // must_change_password = 1: the admin sets a temporary password; the
        // leader must pick their own on first login (forced by the UI).
        await db.execute({
          sql: `INSERT INTO users
                (alias, display_alias, password, avatar_config, unlocked_items, highscores, secret_flags, joined_at, role, must_change_password)
                VALUES (?, ?, ?, '{}', '[]', '{}', '{}', ?, 'leader', 1)`,
          args: [key, alias.trim() || key, hashed, joinedAt],
        });
        return json({ ok: true }, 201);
      }

      case 'delete-user': {
        const { alias } = field(adminAliasSchema, raw);
        const key = alias.toLowerCase();
        // Best-effort: remove the user's photo blobs before dropping metadata.
        const photos = await db.execute({
          sql: 'SELECT blob_key FROM album_photos WHERE alias = ?',
          args: [key],
        });
        const storage = getPhotoStorage();
        for (const p of photos.rows) {
          if (p.blob_key) {
            try {
              await storage.delete(String(p.blob_key));
            } catch {
              // ignore missing blobs
            }
          }
        }
        const statements = [
          'DELETE FROM logs WHERE alias = ?',
          'DELETE FROM bingo WHERE alias = ?',
          'DELETE FROM bonus_bingo WHERE alias = ?',
          'DELETE FROM bingo_two WHERE alias = ?',
          'DELETE FROM adult_bingo WHERE alias = ?',
          'DELETE FROM completed_daily WHERE alias = ?',
          'DELETE FROM album_photos WHERE alias = ?',
          'DELETE FROM users WHERE alias = ?',
        ];
        for (const sql of statements) await db.execute({ sql, args: [key] });
        await db.execute({
          sql: 'DELETE FROM buddy_challenges WHERE from_alias = ? OR to_alias = ?',
          args: [key, key],
        });
        await db.execute({
          sql: 'DELETE FROM cheers WHERE from_alias = ? OR to_alias = ?',
          args: [key, key],
        });
        return json({ ok: true });
      }

      case 'season-start': {
        const { date } = field(adminDateSchema, raw);
        await setConfig(db, 'season_start', date);
        return json({ ok: true, seasonStart: date });
      }

      case 'countdown-date': {
        const { date } = field(adminDateSchema, raw);
        await setConfig(db, 'countdown_date', date);
        return json({ ok: true, countdownDate: date });
      }

      case 'first-log': {
        const { alias, date } = field(adminFirstLogSchema, raw);
        const key = alias.toLowerCase();
        const result = await db.execute({
          sql: 'SELECT id FROM logs WHERE alias = ? ORDER BY date ASC LIMIT 1',
          args: [key],
        });
        const row = result.rows[0];
        if (!row) throw new ApiError('no_logs', 404);
        await db.execute({
          sql: 'UPDATE logs SET date = ? WHERE id = ?',
          args: [date, Number(row.id)],
        });
        return json({ ok: true });
      }

      case 'delete-log': {
        // Remove a single training log on a player's behalf (e.g. a mistaken or
        // inappropriate entry). Admin-only — never trusted from the client.
        const { logId } = field(adminDeleteLogSchema, raw);
        const result = await db.execute({
          sql: 'DELETE FROM logs WHERE id = ?',
          args: [logId],
        });
        if (result.rowsAffected === 0) throw new ApiError('not_found', 404);
        return json({ ok: true });
      }
    }

    throw new ApiError('unknown_action', 400);
  });
}
