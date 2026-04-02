import { getDb, initDb } from './db.js';
import { hashPassword, verifyPassword } from './auth.js';

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
        const users = {};
        for (const row of result.rows) {
          const u = rowToUser(row);
          u.logs = await getLogs(db, u.alias.toLowerCase());
          u.bingo = await getBingo(db, u.alias.toLowerCase());
          u.completedDaily = await getCompletedDaily(db, u.alias.toLowerCase());
          users[u.alias.toLowerCase()] = u;
        }
        return new Response(JSON.stringify(users), { status: 200, headers });
      }
    }

    // POST - register new user
    if (method === 'POST' && action === 'register') {
      const body = await req.json();
      const { alias, password, avatarBase } = body;
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
        sql: 'INSERT INTO users (alias, password, avatar_base, unlocked_items, highscores, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [key, hashed, avatarBase || 0, '[]', '{}', joinedAt],
      });

      const user = {
        alias: key,
        avatarBase: avatarBase || 0,
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

    // PUT - update user (highscores, unlockedItems)
    if (method === 'PUT' && action === 'update') {
      const body = await req.json();
      const { alias, highscores, unlockedItems } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'UPDATE users SET highscores = ?, unlocked_items = ? WHERE alias = ?',
        args: [JSON.stringify(highscores), JSON.stringify(unlockedItems), key],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - add log
    if (method === 'POST' && action === 'addlog') {
      const body = await req.json();
      const { alias, log } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          key,
          log.date,
          JSON.stringify(log.exercises || []),
          log.points || 0,
          log.minutes || 0,
          log.bingo ? 1 : 0,
          log.bingoFootball ? 1 : 0,
          log.dailyChallenge ? 1 : 0,
        ],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // PUT - edit log
    if (method === 'PUT' && action === 'editlog') {
      const body = await req.json();
      const { logId, log } = body;

      await db.execute({
        sql: 'UPDATE logs SET date = ?, exercises = ?, points = ?, minutes = ? WHERE id = ?',
        args: [
          log.date,
          JSON.stringify(log.exercises || []),
          log.points || 0,
          log.minutes || 0,
          logId,
        ],
      });
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

    return new Response(JSON.stringify({ error: 'unknown_action' }), { status: 400, headers });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

function rowToUser(row) {
  return {
    alias: row.alias,
    avatarBase: row.avatar_base,
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
