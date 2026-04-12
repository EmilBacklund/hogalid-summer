import { getDb, initDb } from './db.js';
import { hashPassword, verifyPassword } from './auth.js';
import { updateBuddyProgress } from './buddyProgress.js';

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `F15-${part()}`;
}

function normalizeInviteStatus(invite) {
  if (!invite) return null;
  if (invite.status === 'used') return 'used';
  if (invite.status === 'disabled') return 'disabled';
  if (invite.clicked_at) return 'clicked';
  return 'active';
}

function inviteRowToClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    token: row.token,
    code: row.code,
    status: normalizeInviteStatus(row),
    clickedAt: row.clicked_at || null,
    usedAt: row.used_at || null,
    usedByAlias: row.used_by_label || row.used_by_alias || '',
    createdAt: row.created_at,
  };
}

async function hydrateInviteDisplay(db, invite) {
  if (!invite?.used_by_alias) return invite;
  const result = await db.execute({
    sql: 'SELECT display_name, display_alias, alias FROM users WHERE alias = ?',
    args: [invite.used_by_alias],
  });
  const user = result.rows[0];
  if (!user) return invite;
  return {
    ...invite,
    used_by_label: user.display_name || user.display_alias || user.alias,
  };
}

async function getInviteByToken(db, token) {
  const result = await db.execute({
    sql: 'SELECT * FROM invites WHERE token = ?',
    args: [token],
  });
  return result.rows[0] || null;
}

async function getInviteByCode(db, code) {
  const result = await db.execute({
    sql: 'SELECT * FROM invites WHERE UPPER(code) = ?',
    args: [(code || '').trim().toUpperCase()],
  });
  return result.rows[0] || null;
}

async function markInviteClicked(db, invite) {
  if (!invite || invite.status === 'used' || invite.status === 'disabled' || invite.clicked_at) return invite;
  const clickedAt = new Date().toISOString();
  await db.execute({
    sql: 'UPDATE invites SET clicked_at = ?, status = ? WHERE id = ?',
    args: [clickedAt, 'clicked', invite.id],
  });
  return {
    ...invite,
    clicked_at: clickedAt,
    status: 'clicked',
  };
}

async function generateUniqueInvite(db, label) {
  for (let i = 0; i < 12; i++) {
    const token = randomToken();
    const code = randomCode();
    const existing = await db.execute({
      sql: 'SELECT id FROM invites WHERE token = ? OR code = ?',
      args: [token, code],
    });
    if (existing.rows.length === 0) {
      const createdAt = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO invites (label, token, code, status, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [label, token, code, 'active', createdAt],
      });
      return getInviteByToken(db, token);
    }
  }
  throw new Error('invite_generation_failed');
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
      const result = await db.execute("SELECT key, value FROM config");
      const cfg = {};
      for (const row of result.rows) cfg[row.key] = row.value;
      return new Response(JSON.stringify({
        seasonStart: cfg['season_start'] || null,
        countdownDate: cfg['countdown_date'] || null,
      }), { status: 200, headers });
    }

    // GET - unseen cheers for a user
    if (method === 'GET' && action === 'cheers') {
      const alias = url.searchParams.get('alias');
      if (!alias) return new Response(JSON.stringify({ error: 'missing_alias' }), { status: 400, headers });
      const result = await db.execute({
        sql: 'SELECT id, from_alias, created_at FROM cheers WHERE to_alias = ? AND seen = 0 ORDER BY created_at DESC',
        args: [alias.toLowerCase()],
      });
      const cheers = result.rows.map(r => ({ id: r.id, fromAlias: r.from_alias, createdAt: r.created_at }));
      return new Response(JSON.stringify(cheers), { status: 200, headers });
    }

    // GET - feed reactions
    if (method === 'GET' && action === 'reactions') {
      const result = await db.execute('SELECT event_key, alias, emoji FROM feed_reactions');
      const data = {};
      result.rows.forEach(r => {
        if (!data[r.event_key]) data[r.event_key] = {};
        data[r.event_key][r.alias] = r.emoji;
      });
      return json(data, headers);
    }

    // GET - all invites for admin
    if (method === 'GET' && action === 'invites') {
      const result = await db.execute('SELECT * FROM invites ORDER BY created_at DESC');
      const invites = [];
      for (const row of result.rows) {
        invites.push(inviteRowToClient(await hydrateInviteDisplay(db, row)));
      }
      return json(invites, headers);
    }

    // GET - validate invite by token or code
    if (method === 'GET' && action === 'invite') {
      const token = url.searchParams.get('token');
      const code = url.searchParams.get('code');
      let invite = null;

      if (token) invite = await getInviteByToken(db, token);
      else if (code) invite = await getInviteByCode(db, code);
      else return json({ error: 'missing_invite' }, headers, 400);

      if (!invite) return json({ error: 'invite_not_found' }, headers, 404);

      if (invite.status !== 'used' && invite.status !== 'disabled') {
        invite = await markInviteClicked(db, invite);
      }

      return json(inviteRowToClient(await hydrateInviteDisplay(db, invite)), headers);
    }

    // GET all users (admin) or single user
    if (method === 'GET' && !action) {
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
        user.bonusBingo = await getBonusBingo(db, alias.toLowerCase());
        user.bingoTwo = await getBingoTwo(db, alias.toLowerCase());
        user.adultBingo = await getAdultBingo(db, alias.toLowerCase());
        user.completedDaily = await getCompletedDaily(db, alias.toLowerCase());
        user.photoCount = await getPhotoCount(db, alias.toLowerCase());
        return new Response(JSON.stringify(user), { status: 200, headers });
      } else {
        // all users
        const result = await db.execute('SELECT * FROM users');
        const users = [];
        for (const row of result.rows) {
          const u = rowToUser(row);
          u.logs = await getLogs(db, u.alias.toLowerCase());
          u.bingo = await getBingo(db, u.alias.toLowerCase());
          u.bonusBingo = await getBonusBingo(db, u.alias.toLowerCase());
          u.bingoTwo = await getBingoTwo(db, u.alias.toLowerCase());
          u.adultBingo = await getAdultBingo(db, u.alias.toLowerCase());
          u.completedDaily = await getCompletedDaily(db, u.alias.toLowerCase());
          u.photoCount = await getPhotoCount(db, u.alias.toLowerCase());
          u.password = row.display_password || '';
          users.push(u);
        }
        return new Response(JSON.stringify(users), { status: 200, headers });
      }
    }

    // POST - register new user
    if (method === 'POST' && action === 'register') {
      const body = await req.json();
      const { alias, password, avatarConfig, inviteToken, inviteCode } = body;
      const aliasInput = (alias || '').trim();
      const key = aliasInput.toLowerCase();

      let invite = null;
      if (inviteToken) invite = await getInviteByToken(db, inviteToken);
      else if (inviteCode) invite = await getInviteByCode(db, inviteCode);

      if (!invite) {
        return json({ error: 'invite_required' }, headers, 400);
      }
      if (invite.status === 'used') {
        const hydratedInvite = await hydrateInviteDisplay(db, invite);
        return json({ error: 'invite_used', usedByAlias: hydratedInvite.used_by_label || hydratedInvite.used_by_alias || '' }, headers, 409);
      }
      if (invite.status === 'disabled') {
        return json({ error: 'invite_disabled' }, headers, 409);
      }

      const existing = await db.execute({
        sql: 'SELECT alias FROM users WHERE alias = ?',
        args: [key],
      });
      if (existing.rows.length > 0) {
        return json({ error: 'alias_taken' }, headers, 409);
      }

      const hashed = await hashPassword(password);
      const joinedAt = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO users (alias, display_alias, password, display_password, avatar_config, unlocked_items, highscores, secret_flags, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [key, aliasInput || key, hashed, password, JSON.stringify(avatarConfig || {}), '[]', '{}', '{}', joinedAt],
      });
      await db.execute({
        sql: 'UPDATE invites SET status = ?, used_at = ?, used_by_alias = ? WHERE id = ?',
        args: ['used', joinedAt, key, invite.id],
      });

      const user = {
        alias: key,
        displayAlias: aliasInput || key,
        avatarConfig: avatarConfig || {},
        unlockedItems: [],
        highscores: {},
        logs: [],
        bingo: [],
        bonusBingo: [],
        bingoTwo: [],
        adultBingo: [],
        completedDaily: {},
        secretFlags: {},
        joinedAt,
      };
      return json(user, headers, 201);
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
      user.bonusBingo = await getBonusBingo(db, key);
      user.bingoTwo = await getBingoTwo(db, key);
      user.adultBingo = await getAdultBingo(db, key);
      user.completedDaily = await getCompletedDaily(db, key);
      user.photoCount = await getPhotoCount(db, key);
      return new Response(JSON.stringify(user), { status: 200, headers });
    }

    // PUT - update user (highscores, unlockedItems, avatarConfig)
    if (method === 'PUT' && action === 'update') {
      const body = await req.json();
      const { alias, highscores, unlockedItems, avatarConfig, secretFlags } = body;
      const key = alias.toLowerCase();

      const existing = await db.execute({
        sql: 'SELECT highscores, unlocked_items, avatar_config, secret_flags FROM users WHERE alias = ?',
        args: [key],
      });
      const row = existing.rows[0] || {};

      await db.execute({
        sql: 'UPDATE users SET highscores = ?, unlocked_items = ?, avatar_config = ?, secret_flags = ? WHERE alias = ?',
        args: [
          highscores !== undefined ? JSON.stringify(highscores) : (row.highscores || '{}'),
          unlockedItems !== undefined ? JSON.stringify(unlockedItems) : (row.unlocked_items || '[]'),
          avatarConfig !== undefined ? JSON.stringify(avatarConfig || {}) : (row.avatar_config || '{}'),
          secretFlags !== undefined ? JSON.stringify(secretFlags || {}) : (row.secret_flags || '{}'),
          key,
        ],
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

    // POST - complete adult bingo
    if (method === 'POST' && action === 'adultbingo') {
      const body = await req.json();
      const { alias, challengeId } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO adult_bingo (alias, challenge_id) VALUES (?, ?)',
        args: [key, challengeId],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - complete bonus bingo
    if (method === 'POST' && action === 'bonusbingo') {
      const body = await req.json();
      const { alias, challengeId } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO bonus_bingo (alias, challenge_id) VALUES (?, ?)',
        args: [key, challengeId],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST - complete bricka 2
    if (method === 'POST' && action === 'bingotwo') {
      const body = await req.json();
      const { alias, challengeId } = body;
      const key = alias.toLowerCase();

      await db.execute({
        sql: 'INSERT OR IGNORE INTO bingo_two (alias, challenge_id) VALUES (?, ?)',
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

    // POST - send cheer
    if (method === 'POST' && action === 'cheer') {
      const body = await req.json();
      const { fromAlias, toAlias } = body;
      if (!fromAlias || !toAlias) return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers });
      // Rate limit: max 1 cheer per sender→receiver per day
      const today = new Date().toISOString().slice(0, 10);
      const existing = await db.execute({
        sql: "SELECT id FROM cheers WHERE from_alias = ? AND to_alias = ? AND created_at LIKE ?",
        args: [fromAlias.toLowerCase(), toAlias.toLowerCase(), today + '%'],
      });
      if (existing.rows.length > 0) {
        return new Response(JSON.stringify({ error: 'already_cheered_today' }), { status: 429, headers });
      }
      await db.execute({
        sql: 'INSERT INTO cheers (from_alias, to_alias, created_at) VALUES (?, ?, ?)',
        args: [fromAlias.toLowerCase(), toAlias.toLowerCase(), new Date().toISOString()],
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // PUT - mark cheers as seen
    if (method === 'PUT' && action === 'cheerseen') {
      const body = await req.json();
      const { ids } = body;
      if (!ids || !ids.length) return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
      const placeholders = ids.map(() => '?').join(',');
      await db.execute({
        sql: `UPDATE cheers SET seen = 1 WHERE id IN (${placeholders})`,
        args: ids,
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
      return json({ ok: true }, headers);
    }

    // POST - create invite
    if (method === 'POST' && action === 'createinvite') {
      const body = await req.json();
      const label = (body.label || '').trim().slice(0, 50);
      if (!label) return json({ error: 'missing_label' }, headers, 400);
      const invite = await generateUniqueInvite(db, label);
      return json(inviteRowToClient(invite), headers, 201);
    }

    // POST - update secret progress / easter egg flags
    if (method === 'POST' && action === 'secretprogress') {
      const body = await req.json();
      const { alias, patch } = body;
      const key = alias.toLowerCase();

      const existing = await db.execute({
        sql: 'SELECT secret_flags FROM users WHERE alias = ?',
        args: [key],
      });
      const current = JSON.parse(existing.rows[0]?.secret_flags || '{}');
      const next = { ...current };

      if (patch?.foundAdultBingo) next.foundAdultBingo = true;
      if (patch?.foundPenaltyGame) next.foundPenaltyGame = true;
      if (typeof patch?.penaltyBest === 'number') {
        next.penaltyBest = Math.max(Number(current.penaltyBest || 0), patch.penaltyBest);
      }

      await db.execute({
        sql: 'UPDATE users SET secret_flags = ? WHERE alias = ?',
        args: [JSON.stringify(next), key],
      });
      return json({ ok: true, secretFlags: next }, headers);
    }

    // PUT - update invite state
    if (method === 'PUT' && action === 'updateinvite') {
      const body = await req.json();
      const { inviteId, mode } = body;
      if (!inviteId || !mode) return json({ error: 'missing_fields' }, headers, 400);

      const existing = await db.execute({
        sql: 'SELECT * FROM invites WHERE id = ?',
        args: [inviteId],
      });
      const invite = existing.rows[0];
      if (!invite) return json({ error: 'invite_not_found' }, headers, 404);

      if (mode === 'disable') {
        await db.execute({
          sql: 'UPDATE invites SET status = ? WHERE id = ?',
          args: ['disabled', inviteId],
        });
      } else if (mode === 'enable') {
        await db.execute({
          sql: 'UPDATE invites SET status = ? WHERE id = ?',
          args: [invite.used_at ? 'used' : (invite.clicked_at ? 'clicked' : 'active'), inviteId],
        });
      } else if (mode === 'reset') {
        await db.execute({
          sql: 'UPDATE invites SET status = ?, clicked_at = NULL, used_at = NULL, used_by_alias = NULL WHERE id = ?',
          args: ['active', inviteId],
        });
      } else {
        return json({ error: 'invalid_mode' }, headers, 400);
      }

      const updated = await db.execute({
        sql: 'SELECT * FROM invites WHERE id = ?',
        args: [inviteId],
      });
      return json(inviteRowToClient(updated.rows[0]), headers);
    }

    // PUT - reset season (clear all data, set new season start)
    if (method === 'PUT' && action === 'resetseason') {
      const today = new Date().toISOString().slice(0, 10);
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
        DELETE FROM album_photos;
        DELETE FROM invites;
      `);
      await db.execute({
        sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('season_start', ?)",
        args: [today],
      });
      return json({ ok: true, seasonStart: today }, headers);
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

    // DELETE - remove a player and all their data
    if (method === 'DELETE' && action === 'deleteuser') {
      const body = await req.json();
      const { alias } = body;
      const key = alias.toLowerCase();
      const tables = [
        { sql: 'DELETE FROM logs WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM bingo WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM bonus_bingo WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM bingo_two WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM adult_bingo WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM completed_daily WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM buddy_challenges WHERE from_alias = ? OR to_alias = ?', args: [key, key] },
        { sql: 'DELETE FROM cheers WHERE from_alias = ? OR to_alias = ?', args: [key, key] },
        { sql: 'DELETE FROM album_photos WHERE alias = ?', args: [key] },
        { sql: 'DELETE FROM users WHERE alias = ?', args: [key] },
      ];
      for (const q of tables) await db.execute(q);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // PUT - update season start date (without resetting data)
    if (method === 'PUT' && action === 'updateseasonstart') {
      const body = await req.json();
      const { date } = body;
      await db.execute({
        sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('season_start', ?)",
        args: [date],
      });
      return new Response(JSON.stringify({ ok: true, seasonStart: date }), { status: 200, headers });
    }

    // PUT - update countdown target date
    if (method === 'PUT' && action === 'updatecountdowndate') {
      const body = await req.json();
      const { date } = body;
      await db.execute({
        sql: "INSERT OR REPLACE INTO config (key, value) VALUES ('countdown_date', ?)",
        args: [date],
      });
      return new Response(JSON.stringify({ ok: true, countdownDate: date }), { status: 200, headers });
    }

    // PUT - update date of a player's first log entry
    if (method === 'PUT' && action === 'updatefirstlog') {
      const body = await req.json();
      const { alias, date } = body;
      const key = alias.toLowerCase();
      // Find earliest log for this player
      const result = await db.execute({
        sql: 'SELECT id FROM logs WHERE alias = ? ORDER BY date ASC LIMIT 1',
        args: [key],
      });
      if (result.rows.length === 0) {
        return new Response(JSON.stringify({ error: 'no_logs' }), { status: 404, headers });
      }
      const logId = result.rows[0].id;
      await db.execute({
        sql: 'UPDATE logs SET date = ? WHERE id = ?',
        args: [date, logId],
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
    displayAlias: row.display_alias || row.alias,
    displayName: row.display_name || '',
    avatarConfig: JSON.parse(row.avatar_config || '{}'),
    unlockedItems: JSON.parse(row.unlocked_items || '[]'),
    highscores: JSON.parse(row.highscores || '{}'),
    secretFlags: JSON.parse(row.secret_flags || '{}'),
    joinedAt: row.joined_at,
    photoCount: 0,
  };
}

async function getAdultBingo(db, alias) {
  const result = await db.execute({
    sql: 'SELECT challenge_id FROM adult_bingo WHERE alias = ?',
    args: [alias],
  });
  return result.rows.map((r) => r.challenge_id);
}

async function getBonusBingo(db, alias) {
  const result = await db.execute({
    sql: 'SELECT challenge_id FROM bonus_bingo WHERE alias = ?',
    args: [alias],
  });
  return result.rows.map((r) => r.challenge_id);
}

async function getBingoTwo(db, alias) {
  const result = await db.execute({
    sql: 'SELECT challenge_id FROM bingo_two WHERE alias = ?',
    args: [alias],
  });
  return result.rows.map((r) => r.challenge_id);
}

async function getPhotoCount(db, alias) {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) AS count FROM album_photos WHERE alias = ?',
    args: [alias],
  });
  return Number(result.rows[0]?.count || 0);
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
