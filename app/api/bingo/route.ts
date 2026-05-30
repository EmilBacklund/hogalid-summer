import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import {
  bingoTilePoints,
  clampLineBonus,
  isBingoTile,
  isFootballTile,
  type BingoBoard,
} from '@/server/points';
import { bingoInputSchema } from '@/schemas';
import type { Client } from '@libsql/client';

export const runtime = 'nodejs';

const TABLE: Record<BingoBoard, string> = {
  classic: 'bingo',
  adult: 'adult_bingo',
  bonus: 'bonus_bingo',
  bingoTwo: 'bingo_two',
};

async function writeBonusLog(
  db: Client,
  alias: string,
  points: number,
  football: boolean,
  title: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge, ice_cream, swim, pages, title, created_at)
          VALUES (?, ?, '[]', ?, 0, 1, ?, 0, 0, 0, 0, ?, ?)`,
    args: [alias, now.slice(0, 10), points, football ? 1 : 0, title, now],
  });
}

/**
 * Mark a bingo tile complete and award its bonus. Points are authoritative:
 * the per-tile bonus comes from constants; the line-completion bonus reported
 * by the client is clamped (SEC H1, see points.ts MAX_LINE_BONUS). Replays are
 * idempotent — a tile already marked awards nothing again.
 */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { board, challengeId, lineBonus, lineTitle } = await parseBody(req, bingoInputSchema);
    if (!isBingoTile(board, challengeId)) throw new ApiError('unknown_challenge', 400);

    const db = getDb();
    await initDb(db);

    const inserted = await db.execute({
      sql: `INSERT OR IGNORE INTO ${TABLE[board]} (alias, challenge_id) VALUES (?, ?)`,
      args: [session.alias, challengeId],
    });
    if (Number(inserted.rowsAffected) === 0) {
      return json({ ok: true, alreadyDone: true });
    }

    // The adult board carries no points — marking is the whole reward.
    if (board !== 'adult') {
      const football = isFootballTile(board, challengeId);
      const base = bingoTilePoints(board, challengeId);
      if (base > 0) await writeBonusLog(db, session.alias, base, football, '');
      const line = clampLineBonus(lineBonus ?? 0);
      if (line > 0) await writeBonusLog(db, session.alias, line, football, lineTitle ?? '');
    }

    return json({ ok: true });
  });
}
