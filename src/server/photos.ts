import type { Client } from '@libsql/client';
import { PHOTO_CHALLENGE_POINTS } from '@/constants';
import { getPhotoChallenge } from '@/utils';
import { getPhotoStorage } from './photoStorage';

/**
 * Award the weekly photo-challenge bonus when a pending photo is approved.
 * The challenge is resolved from the PHOTO's week (not the approval date), so
 * a photo that waits over a weekend still counts for the week it was taken.
 * One bonus per player and challenge — the log title is the dedupe key, so a
 * player's second approved photo the same week never double-pays. Points are
 * fixed server-side (SEC H1); the client has no say.
 */
export async function awardPhotoChallengeBonus(
  db: Client,
  alias: string,
  weekStart: string,
): Promise<void> {
  const challenge = getPhotoChallenge(weekStart);
  const title = `📸 Fotoutmaning: ${challenge.label}`;
  const existing = await db.execute({
    sql: 'SELECT COUNT(*) AS count FROM logs WHERE alias = ? AND title = ?',
    args: [alias, title],
  });
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge, ice_cream, swim, pages, title, created_at)
          VALUES (?, ?, '[]', ?, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
    args: [alias, now.slice(0, 10), PHOTO_CHALLENGE_POINTS, title, now],
  });
}

/**
 * Delete a photo's bytes (best-effort, from Netlify Blobs) and its metadata
 * row. Returns false when the photo did not exist. Shared by the leader's
 * reject action and the admin gallery's delete so removal happens in one place.
 */
export async function deletePhotoById(db: Client, photoId: number): Promise<boolean> {
  const result = await db.execute({
    sql: 'SELECT blob_key FROM album_photos WHERE id = ?',
    args: [photoId],
  });
  const row = result.rows[0];
  if (!row) return false;
  if (row.blob_key) {
    try {
      await getPhotoStorage().delete(String(row.blob_key));
    } catch {
      // The metadata row is the source of truth; a missing/failed blob delete
      // must not block removing the row.
    }
  }
  await db.execute({ sql: 'DELETE FROM album_photos WHERE id = ?', args: [photoId] });
  return true;
}
