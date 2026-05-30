import { z } from 'zod';
import { getDb, initDb } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { ApiError, handle, json, requireAdmin } from '@/server/responses';
import { getPhotoStorage } from '@/server/photoStorage';
import { stockholmToday } from '@/server/dates';
import {
  adminAliasSchema,
  adminDateSchema,
  adminFirstLogSchema,
  adminResetPasswordSchema,
} from '@/schemas';
import type { Client } from '@libsql/client';

export const runtime = 'nodejs';

const actionSchema = z.object({
  action: z.enum([
    'reset-season',
    'reset-password',
    'delete-user',
    'season-start',
    'countdown-date',
    'first-log',
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
    }

    throw new ApiError('unknown_action', 400);
  });
}
