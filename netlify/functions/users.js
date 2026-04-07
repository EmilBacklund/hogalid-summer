import { getDb, initDb } from './db.js';
import { hashPassword, verifyPassword } from './auth.js';

// ── Shared helper: recalculate buddy challenge progress for a user ──
// Call this after any real training log is added or edited.
async function updateBuddyProgress(db, key) {
  const activeChallenges = await db.execute({
    sql: `SELECT * FROM buddy_challenges
          WHERE (from_alias = ? OR to_alias = ?) AND status = 'active'`,
    args: [key, key],
  });

  for (const c of activeChallenges.rows) {
    const isFrom = c.from_alias === key;
    const alreadyDone = isFrom ? c.from_completed_at : c.to_completed_at;
    if (alreadyDone) continue;

    // Sum all qualifying logs for this exercise where the training DATE
    // is on or after the day the challenge was accepted.
    // We use `date` (the actual training date, YYYY-MM-DD) rather than
    // `created_at` so that retroactively entered logs for earlier dates
    // are correctly excluded.
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

export default async (req, context) => {
  const db = getDb();
  await initDb(db);

  const method = req.method;
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // GET - config (season start date)
    if (method === 'GET' && action === 'config') {
      const result = await db.execute({
        sql: "SELECT value FROM config WHERE key = 'season_start'",
        args: [],
      });
      const seasonStart = result.rows.length > 0 ? result.rows[0].value : null;
      return new Response(JSON.stringify({ seasonStart }), { status: 200, headers });
    }

    // GET - feed reactions
    if (method === 'GET' && action === 'reactions') {
      const result = await db.execute('SELECT event_key, alias, emoji FROM feed_reactions');
      const data = {};
      result.rows.forEach(r => {
        if (!data[r.event_key]) data[r.event_key] = {};
        data[r.event_key][r.alias] = r.emoji;
      });
      return new Response(JSON.stringify(data), { status: 200, headers });
    }

    // GET all users (admin) or single user
    if (method === 'GET') {
      const alias = url.searchParams.get('alias');

      if (alias) {
        const result = await db.execute({
          sql: 'SELECT * FROM users WHERE alias = ?',
          args: [alias.toLowerCase()],
        });
        if (result.rows.length === 0) {
          return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });
        }
        const user = rowToUser(result.rows[0]);
        // attach logs, bingo, completedDaily
        user.logs = await getLogs(db, alias.toLowerCase());
        user.bingo = await getBingo(db, alias.toLowerCase());
        user.completedDaily = await getCompletedDaily(db, alias.toLowerCase());
        return new Response(JSON.stringify(user), { status: 200, headers });
      } else {
        // all users
        const result = await db.execute('SELECT * FROM users');
        const users = [];
        for (const row of result.rows) {
          const u = rowToUser(row);
          u.logs = await getLogs(db, u.alias.toLowerCase());
          u.bingo = await getBingo(db, u.alias.toLowerCase());
          u.completedDaily = await getCompletedDaily(db, u.alias.toLowerCase());
          u.password = row.display_password || '';
          users.push(u);
        }
        return new Response(JSON.stringify(users), { status: 200, headers });
      }
    }

    // POST - register new user
    if (method === 'POST' && action === 'register') {
      const body = await req.json();
      const { alias, password, avatarConfig } = body;
      const key = alias.toLowerCase();

      const existing = await db.execute({
        sql: 'SELECT alias FROM users WHERE alias = ?',
        args: [key],
      });
      if (existing.rows.length > 0) {
        return new Response(JSON.stringify({ error: 'alias_taken' }), { status: 409, headers });
      }

      const hashed = await hashPassword(password);
      const joinedAt = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO users (alias, password, display_password, avatar_config, unlocked_items, highscores, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [key, hashed, password, JSON.stringify(avatarConfig || {}), '[]', '{}', joinedAt],
      });

      const user = {
        alias: key,
        avatarConfig: avatarConfig || {},
        unlockedItems: [],
        highscores: {},
        logs: [],
        bingo: [],
        completedDaily: {},
        joinedAt,
      };
      return new Response(JSON.stringify(user), { status: 201, headers });
    }

    // POST - login
    if (method === 'POST' && action === 'login') {
      const body = await req.json();
      const { alias, password } = body;
      const key = alias.toLowerCase();

      // Admin login via env vars
      if (key === (process.env.ADMIN_ALIAS || 'admin').toLowerCase()) {
        if (password === process.env.ADMIN_PASSWORD) {
          return new Response(JSON.stringify({ alias: 'admin', isAdmin: true }), { status: 200, headers });
        }
        return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401, headers });
      }

      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE alias = ?',
        args: [key],
      });
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401, headers });
      }

      const valid = await verifyPassword(password, result.rows[0].password);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401, headers });
      }

      const user = rowToUser(result.rows[0]);
      user.logs = await getLogs(db, key);
      user.bingo = await getBingo(db, key);
      user.completedDaily = await getCompletedDaily(db, key);
      return new Response(JSON.stringify(user), { status: 200, headers });
    }

    // PUT - update user (highscores, unlockedItems, avatarConfig)
    if (method === 'PUT' && action === 'update') {
      const body = await req.json();
      const { alias, highscores, unlockedItems, avatarConfig } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'UPDATE users SET highscores = ?, unlocked_items = ?, avatar_config = ? WHERE alias = ?',
        args: [JSON.stringify(highscores), JSON.stringify(unlockedItems), JSON.stringify(avatarConfig || {}), key],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // PUT - update display name
    if (method === 'PUT' && action === 'updatedisplayname') {
      const body = await req.json();
      const { alias, displayName } = body;
      const key = alias.toLowerCase();
      const name = (displayName || '').trim().slice(0, 20);

      await db.execute({
        sql: 'UPDATE users SET display_name = ? WHERE alias = ?',
        args: [name, key],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - add log
    if (method === 'POST' && action === 'addlog') {
      const body = await req.json();
      const { alias, log } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge, ice_cream, swim, pages, title, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          key,
          log.date,
          JSON.stringify(log.exercises || []),
          log.points || 0,
          log.minutes || 0,
          log.bingo ? 1 : 0,
          log.bingoFootball ? 1 : 0,
          log.dailyChallenge ? 1 : 0,
          log.iceCream || 0,
          log.swim || 0,
          log.pages || 0,
          log.title || '',
          new Date().toISOString(),
        ],
      });

      // ── Buddy challenge progress check ──
      if (!log.bingo && !log.dailyChallenge && !(log.title || '').startsWith('🤝buddy:')) {
        await updateBuddyProgress(db, key);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // PUT - edit log
    if (method === 'PUT' && action === 'editlog') {
      const body = await req.json();
      const { logId, log } = body;

      // Fetch alias from the existing log row before updating
      const existingLog = await db.execute({
        sql: 'SELECT alias FROM logs WHERE id = ?',
        args: [logId],
      });

      await db.execute({
        sql: 'UPDATE logs SET date = ?, exercises = ?, points = ?, minutes = ?, ice_cream = ?, swim = ?, pages = ?, title = ? WHERE id = ?',
        args: [
          log.date,
          JSON.stringify(log.exercises || []),
          log.points || 0,
          log.minutes || 0,
          log.iceCream || 0,
          log.swim || 0,
          log.pages || 0,
          log.title || '',
          logId,
        ],
      });

      // Recalculate buddy challenge progress after edit
      const editedAlias = existingLog.rows[0]?.alias;
      if (editedAlias && !(log.title || '').startsWith('🤝buddy:')) {
        await updateBuddyProgress(db, editedAlias);
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // DELETE - delete log
    if (method === 'PUT' && action === 'deletelog') {
      const body = await req.json();
      const { logId } = body;

      await db.execute({ sql: 'DELETE FROM logs WHERE id = ?', args: [logId] });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - complete bingo
    if (method === 'POST' && action === 'bingo') {
      const body = await req.json();
      const { alias, challengeId } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO bingo (alias, challenge_id) VALUES (?, ?)',
        args: [key, challengeId],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - complete daily
    if (method === 'POST' && action === 'daily') {
      const body = await req.json();
      const { alias, date, challengeId } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO completed_daily (alias, date, challenge_id) VALUES (?, ?, ?)',
        args: [key, date, challengeId],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - add/remove reaction
    if (method === 'POST' && action === 'react') {
      const body = await req.json();
      const { eventKey, alias, emoji } = body;
      if (!emoji) {
        await db.execute({ sql: 'DELETE FROM feed_reactions WHERE event_key = ? AND alias = ?', args: [eventKey, alias] });
      } else {
        await db.execute({ sql: 'INSERT OR REPLACE INTO feed_reactions (event_key, alias, emoji) VALUES (?, ?, ?)', args: [eventKey, alias, emoji] });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // GET - weekly results history
    if (method === 'GET' && action === 'weeklyresults') {
      const result = await db.execute('SELECT * FROM weekly_results ORDER BY week_start DESC');
      return new Response(JSON.stringify(result.rows.map(r => ({
        weekStart: r.week_start,
        challengeLabel: r.challenge_label,
        challengeType: r.challenge_type,
        value: r.value,
        goal: r.goal,
        level: r.level,
        levelName: r.level_name,
      }))), { status: 200, headers });
    }

    // POST - save weekly result
    if (method === 'POST' && action === 'saveweeklyresult') {
      const body = await req.json();
      const { weekStart, challengeLabel, challengeType, value, goal, level, levelName } = body;
      await db.execute({
        sql: 'INSERT OR REPLACE INTO weekly_results (week_start, challenge_label, challenge_type, value, goal, level, level_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [weekStart, challengeLabel, challengeType, value, goal, level, levelName || null],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // PUT - reset season (clear all data, set new season start)
    if (method === 'PUT' && action === 'resetseason') {
      const today = new Date().toISOString().slice(0, 10);
      await db.executeMultiple(`
        DELETE FROM logs;
        DELETE FROM bingo;
        DELETE FROM completed_daily;
        DELETE FROM users;
        DELETE FROM weekly_results;
        DELETE FROM feed_reactions;
      `);
      await db.execute({
        sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('season_start', ?)",
        args: [today],
      });
      return new Response(JSON.stringify({ ok: true, seasonStart: today }), { status: 200, headers });
    }

    // PUT - admin reset password
    if (method === 'PUT' && action === 'resetpassword') {
      const body = await req.json();
      const { alias, newPassword } = body;
      const key = alias.toLowerCase();

      const hashed = await hashPassword(newPassword);
      await db.execute({
        sql: 'UPDATE users SET password = ?, display_password = ? WHERE alias = ?',
        args: [hashed, newPassword, key],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), { status: 400, headers });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

function rowToUser(row) {
  return {
    alias: row.alias,
    displayName: row.display_name || '',
    avatarConfig: JSON.parse(row.avatar_config || '{}'),
    unlockedItems: JSON.parse(row.unlocked_items || '[]'),
    highscores: JSON.parse(row.highscores || '{}'),
    joinedAt: row.joined_at,
  };
}

async function getLogs(db, alias) {
  const result = await db.execute({
    sql: 'SELECT * FROM logs WHERE alias = ? ORDER BY date ASC',
    args: [alias],
  });
  return result.rows.map((row) => ({
    id: row.id,
    date: row.date,
    exercises: JSON.parse(row.exercises || '[]'),
    points: row.points,
    minutes: row.minutes,
    bingo: row.bingo === 1,
    bingoFootball: row.bingo_football === 1,
    dailyChallenge: row.daily_challenge === 1,
    iceCream: row.ice_cream || 0,
    swim: row.swim || 0,
    pages: row.pages || 0,
    title: row.title || '',
    createdAt: row.created_at || '',
  }));
}

async function getBingo(db, alias) {
  const result = await db.execute({
    sql: 'SELECT challenge_id FROM bingo WHERE alias = ?',
    args: [alias],
  });
  return result.rows.map((r) => r.challenge_id);
}

async function getCompletedDaily(db, alias) {
  const result = await db.execute({
    sql: 'SELECT date, challenge_id FROM completed_daily WHERE alias = ?',
    args: [alias],
  });
  const obj = {};
  result.rows.forEach((r) => {
    obj[r.date] = r.challenge_id;
  });
  return obj;
}
