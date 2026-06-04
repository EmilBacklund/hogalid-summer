import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { updateBuddyProgress } from '@/server/buddyProgress';
import {
  clampExercises,
  clampPenaltyScore,
  clampSummer,
  computeTrainingPoints,
  trainingMinutes,
} from '@/server/points';
import { addLogInputSchema, deleteLogInputSchema, editLogInputSchema } from '@/schemas';
import type { Client } from '@libsql/client';

export const runtime = 'nodejs';

/** Verify the log exists and belongs to the acting user (SEC C1). */
async function assertOwnLog(db: Client, logId: number, alias: string): Promise<void> {
  const result = await db.execute({ sql: 'SELECT alias FROM logs WHERE id = ?', args: [logId] });
  const row = result.rows[0];
  if (!row) throw new ApiError('not_found', 404);
  if (String(row.alias) !== alias) throw new ApiError('forbidden', 403);
}

/** Add a log. Points and minutes are always recomputed server-side (SEC H1). */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const body = await parseBody(req, addLogInputSchema);
    const db = getDb();
    await initDb(db);
    const now = new Date().toISOString();

    if (body.kind === 'penalty') {
      const score = clampPenaltyScore(body.score);
      await db.execute({
        sql: `INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge, ice_cream, swim, pages, title, created_at)
              VALUES (?, ?, '[]', ?, 0, 0, 0, 0, 0, 0, 0, ?, ?)`,
        args: [session.alias, now.slice(0, 10), score, `penalty:${score}:10`, now],
      });
      return json({ ok: true });
    }

    const exercises = clampExercises(body.exercises);
    const points = computeTrainingPoints(exercises);
    const minutes = trainingMinutes(exercises);
    await db.execute({
      sql: `INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge, ice_cream, swim, pages, title, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, '', ?)`,
      args: [
        session.alias,
        body.date,
        JSON.stringify(exercises),
        points,
        minutes,
        clampSummer('iceCream', body.iceCream ?? 0),
        clampSummer('swim', body.swim ?? 0),
        clampSummer('pages', body.pages ?? 0),
        now,
      ],
    });

    await updateBuddyProgress(db, session.alias);
    return json({ ok: true, points });
  });
}

/** Edit one of the acting user's own logs. Points are recomputed (SEC H1). */
export function PUT(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { logId, log } = await parseBody(req, editLogInputSchema);
    const db = getDb();
    await initDb(db);
    await assertOwnLog(db, logId, session.alias);

    const exercises = clampExercises(log.exercises);
    const points = computeTrainingPoints(exercises);
    const minutes = trainingMinutes(exercises);
    await db.execute({
      sql: 'UPDATE logs SET date = ?, exercises = ?, points = ?, minutes = ?, ice_cream = ?, swim = ?, pages = ? WHERE id = ?',
      args: [
        log.date,
        JSON.stringify(exercises),
        points,
        minutes,
        clampSummer('iceCream', log.iceCream ?? 0),
        clampSummer('swim', log.swim ?? 0),
        clampSummer('pages', log.pages ?? 0),
        logId,
      ],
    });

    await updateBuddyProgress(db, session.alias);
    return json({ ok: true, points });
  });
}

/** Delete one of the acting user's own logs. */
export function DELETE(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { logId } = await parseBody(req, deleteLogInputSchema);
    const db = getDb();
    await initDb(db);
    await assertOwnLog(db, logId, session.alias);

    await db.execute({ sql: 'DELETE FROM logs WHERE id = ?', args: [logId] });
    await updateBuddyProgress(db, session.alias);
    return json({ ok: true });
  });
}
