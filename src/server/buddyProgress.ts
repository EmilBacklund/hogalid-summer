import type { Client } from '@libsql/client';
import type { ExerciseEntry } from '@/types';

/**
 * Recalculate buddy-challenge progress for a user after a real training log is
 * added or edited (or a challenge is accepted). When both partners reach the
 * target, the challenge is marked completed and a server-computed bonus log is
 * written for each partner. Ported from netlify/functions/buddyProgress.js.
 */
export async function updateBuddyProgress(db: Client, alias: string): Promise<void> {
  const active = await db.execute({
    sql: `SELECT * FROM buddy_challenges
          WHERE (from_alias = ? OR to_alias = ?) AND status = 'active'`,
    args: [alias, alias],
  });

  for (const c of active.rows) {
    const fromAlias = String(c.from_alias);
    const toAlias = String(c.to_alias);
    const exerciseId = String(c.exercise_id);
    const amount = Number(c.amount);
    const isFrom = fromAlias === alias;
    const alreadyDone = isFrom ? c.from_completed_at : c.to_completed_at;
    if (alreadyDone) continue;

    const acceptedDate = String(c.accepted_at ?? '').slice(0, 10);
    const logs = await db.execute({
      sql: `SELECT exercises FROM logs
            WHERE alias = ? AND date >= ?
              AND bingo = 0 AND daily_challenge = 0
              AND title NOT LIKE '🤝buddy:%'`,
      args: [alias, acceptedDate],
    });

    let rawTotal = 0;
    for (const lr of logs.rows) {
      const exArr = JSON.parse(String(lr.exercises ?? '[]')) as ExerciseEntry[];
      const found = exArr.find((e) => e.id === exerciseId);
      if (found) rawTotal += found.value || 0;
    }

    const baseline = Number(isFrom ? (c.from_baseline ?? 0) : (c.to_baseline ?? 0));
    const progress = Math.max(0, rawTotal - baseline);

    const progressField = isFrom ? 'from_progress' : 'to_progress';
    const completedField = isFrom ? 'from_completed_at' : 'to_completed_at';
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE buddy_challenges SET ${progressField} = ? WHERE id = ?`,
      args: [progress, String(c.id)],
    });

    if (progress < amount) continue;

    await db.execute({
      sql: `UPDATE buddy_challenges SET ${completedField} = ? WHERE id = ?`,
      args: [now, String(c.id)],
    });

    const updated = await db.execute({
      sql: 'SELECT * FROM buddy_challenges WHERE id = ?',
      args: [String(c.id)],
    });
    const uc = updated.rows[0];
    if (uc && uc.from_completed_at && uc.to_completed_at && uc.status !== 'completed') {
      await db.execute({
        sql: `UPDATE buddy_challenges SET status = 'completed' WHERE id = ?`,
        args: [String(c.id)],
      });

      const bonusPoints =
        exerciseId === 'skott' ? 0 : exerciseId === 'fritraning' ? amount * 5 : amount;
      const bonusDate = now.slice(0, 10);
      const fromTitle = `🤝buddy:${toAlias}:${amount}:${exerciseId}`;
      const toTitle = `🤝buddy:${fromAlias}:${amount}:${exerciseId}`;

      for (const [bonusAlias, titleForLog] of [
        [fromAlias, fromTitle],
        [toAlias, toTitle],
      ] as const) {
        await db.execute({
          sql: `INSERT INTO logs
                (alias, date, exercises, points, minutes, bingo, bingo_football,
                 daily_challenge, ice_cream, swim, pages, title, created_at)
                VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?)`,
          args: [
            bonusAlias,
            bonusDate,
            JSON.stringify([{ id: exerciseId, value: amount }]),
            bonusPoints,
            exerciseId === 'fritraning' ? amount : 0,
            titleForLog,
            now,
          ],
        });
      }
    }
  }
}
