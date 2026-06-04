import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { weeklyResultSchema } from '@/schemas';

export const runtime = 'nodejs';

/** History of completed weekly team challenges. */
export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const db = getDb();
    await initDb(db);
    const result = await db.execute('SELECT * FROM weekly_results ORDER BY week_start DESC');
    return json(
      result.rows.map((r) => ({
        weekStart: String(r.week_start),
        challengeLabel: String(r.challenge_label),
        challengeType: String(r.challenge_type),
        value: Number(r.value),
        goal: Number(r.goal),
        level: Number(r.level),
        levelName: r.level_name ? String(r.level_name) : null,
      })),
    );
  });
}

/** Persist a finished week's result (shared team record, keyed by week_start). */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const body = await parseBody(req, weeklyResultSchema);

    const db = getDb();
    await initDb(db);
    await db.execute({
      sql: 'INSERT OR REPLACE INTO weekly_results (week_start, challenge_label, challenge_type, value, goal, level, level_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        body.weekStart,
        body.challengeLabel,
        body.challengeType,
        body.value,
        body.goal,
        body.level,
        body.levelName ?? null,
      ],
    });
    return json({ ok: true });
  });
}
