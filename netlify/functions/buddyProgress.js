// Shared helper: recalculate buddy challenge progress for a user.
// Call after any real training log is added, edited, or when a challenge is accepted.
export async function updateBuddyProgress(db, key) {
  const activeChallenges = await db.execute({
    sql: `SELECT * FROM buddy_challenges
          WHERE (from_alias = ? OR to_alias = ?) AND status = 'active'`,
    args: [key, key],
  });

  for (const c of activeChallenges.rows) {
    const isFrom = c.from_alias === key;
    const alreadyDone = isFrom ? c.from_completed_at : c.to_completed_at;
    if (alreadyDone) continue;

    const acceptedDate = c.accepted_at.slice(0, 10);
    const logsResult = await db.execute({
      sql: `SELECT exercises FROM logs
            WHERE alias = ? AND date >= ?
              AND bingo = 0 AND daily_challenge = 0
              AND title NOT LIKE '🤝buddy:%'`,
      args: [key, acceptedDate],
    });

    let progress = 0;
    for (const lr of logsResult.rows) {
      const exArr = JSON.parse(lr.exercises || '[]');
      const found = exArr.find(e => e.id === c.exercise_id);
      if (found) progress += found.value || 0;
    }

    const progressField = isFrom ? 'from_progress' : 'to_progress';
    const completedField = isFrom ? 'from_completed_at' : 'to_completed_at';
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE buddy_challenges SET ${progressField} = ? WHERE id = ?`,
      args: [progress, c.id],
    });

    if (progress >= c.amount) {
      await db.execute({
        sql: `UPDATE buddy_challenges SET ${completedField} = ? WHERE id = ?`,
        args: [now, c.id],
      });

      const updated = await db.execute({
        sql: 'SELECT * FROM buddy_challenges WHERE id = ?',
        args: [c.id],
      });
      const uc = updated.rows[0];
      if (uc && uc.from_completed_at && uc.to_completed_at && uc.status !== 'completed') {
        await db.execute({
          sql: `UPDATE buddy_challenges SET status = 'completed' WHERE id = ?`,
          args: [c.id],
        });

        const bonusPoints =
          c.exercise_id === 'skott' ? 0
          : c.exercise_id === 'fritraning' ? c.amount * 5
          : c.amount;

        const bonusDate = now.slice(0, 10);
        const bonusTitle = `🤝buddy:${c.to_alias}:${c.amount}:${c.exercise_id}`;
        const partnerBonusTitle = `🤝buddy:${c.from_alias}:${c.amount}:${c.exercise_id}`;

        for (const [bonusAlias, titleForLog] of [
          [c.from_alias, bonusTitle],
          [c.to_alias, partnerBonusTitle],
        ]) {
          await db.execute({
            sql: `INSERT INTO logs
                  (alias, date, exercises, points, minutes, bingo, bingo_football,
                   daily_challenge, ice_cream, swim, pages, title, created_at)
                  VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?)`,
            args: [
              bonusAlias,
              bonusDate,
              JSON.stringify([{ id: c.exercise_id, value: c.amount }]),
              bonusPoints,
              c.exercise_id === 'fritraning' ? c.amount : 0,
              titleForLog,
              now,
            ],
          });
        }
      }
    }
  }
}
