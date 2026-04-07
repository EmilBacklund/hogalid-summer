import { getDb, initDb } from './db.js';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function rowToChallenge(r) {
  return {
    id: r.id,
    fromAlias: r.from_alias,
    toAlias: r.to_alias,
    exerciseId: r.exercise_id,
    amount: r.amount,
    status: r.status,
    createdAt: r.created_at,
    acceptedAt: r.accepted_at,
    fromCompletedAt: r.from_completed_at,
    toCompletedAt: r.to_completed_at,
    fromProgress: r.from_progress || 0,
    toProgress: r.to_progress || 0,
  };
}

export default async (req) => {
  const db = getDb();
  await initDb(db);

  const method = req.method;
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers });

  try {
    // GET all challenges for a user — also expire timed-out ones
    if (method === 'GET') {
      const alias = url.searchParams.get('alias');
      if (!alias) return new Response(JSON.stringify([]), { status: 200, headers });
      const key = alias.toLowerCase();

      // Expire active challenges past 48h without both completing
      const expireThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      await db.execute({
        sql: `UPDATE buddy_challenges SET status = 'failed'
              WHERE status = 'active' AND accepted_at < ?
                AND (from_completed_at IS NULL OR to_completed_at IS NULL)`,
        args: [expireThreshold],
      });

      const result = await db.execute({
        sql: `SELECT * FROM buddy_challenges
              WHERE from_alias = ? OR to_alias = ?
              ORDER BY created_at DESC`,
        args: [key, key],
      });

      return new Response(JSON.stringify(result.rows.map(rowToChallenge)), { status: 200, headers });
    }

    // POST create
    if (method === 'POST' && action === 'create') {
      const { fromAlias, toAlias, exerciseId, amount } = await req.json();
      const from = fromAlias.toLowerCase();
      const to = toAlias.toLowerCase();

      // Max 3 active (pending+active) per sender
      const fromCount = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM buddy_challenges
              WHERE (from_alias = ? OR to_alias = ?) AND status IN ('pending','active')`,
        args: [from, from],
      });
      if (Number(fromCount.rows[0].cnt) >= 3) {
        return new Response(
          JSON.stringify({ error: 'Du har redan 3 aktiva utmaningar' }),
          { status: 400, headers },
        );
      }

      // Max 3 active per receiver
      const toCount = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM buddy_challenges
              WHERE (from_alias = ? OR to_alias = ?) AND status IN ('pending','active')`,
        args: [to, to],
      });
      if (Number(toCount.rows[0].cnt) >= 3) {
        return new Response(
          JSON.stringify({ error: `${toAlias} har redan 3 aktiva utmaningar` }),
          { status: 400, headers },
        );
      }

      // Only 1 active challenge between same pair
      const pairCount = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM buddy_challenges
              WHERE ((from_alias = ? AND to_alias = ?) OR (from_alias = ? AND to_alias = ?))
                AND status IN ('pending','active')`,
        args: [from, to, to, from],
      });
      if (Number(pairCount.rows[0].cnt) > 0) {
        return new Response(
          JSON.stringify({ error: `Du har redan en aktiv utmaning med ${toAlias}` }),
          { status: 400, headers },
        );
      }

      const id = `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO buddy_challenges
              (id, from_alias, to_alias, exercise_id, amount, status, created_at)
              VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
        args: [id, from, to, exerciseId, amount, now],
      });

      return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers });
    }

    // POST respond — accept or decline
    if (method === 'POST' && action === 'respond') {
      const { challengeId, response } = await req.json(); // response: 'accept' | 'decline'
      const now = new Date().toISOString();

      if (response === 'accept') {
        await db.execute({
          sql: `UPDATE buddy_challenges SET status = 'active', accepted_at = ?
                WHERE id = ? AND status = 'pending'`,
          args: [now, challengeId],
        });
      } else {
        await db.execute({
          sql: `UPDATE buddy_challenges SET status = 'declined'
                WHERE id = ? AND status = 'pending'`,
          args: [challengeId],
        });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    // POST cancel — sender cancels a pending challenge
    if (method === 'POST' && action === 'cancel') {
      const { challengeId } = await req.json();

      await db.execute({
        sql: `UPDATE buddy_challenges SET status = 'cancelled'
              WHERE id = ? AND status = 'pending'`,
        args: [challengeId],
      });

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), { status: 404, headers });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};
