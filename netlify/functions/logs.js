import { getDb, ensureTables } from "./db.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };

  const db = getDb();
  await ensureTables(db);

  try {
    // POST — add new log
    if (event.httpMethod === "POST") {
      const { alias, log } = JSON.parse(event.body);
      const result = await db.execute({
        sql: "INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge) VALUES (?,?,?,?,?,?,?,?)",
        args: [
          alias.toLowerCase(),
          log.date,
          JSON.stringify(log.exercises || []),
          log.points || 0,
          log.minutes || 0,
          log.bingo ? 1 : 0,
          log.bingoFootball ? 1 : 0,
          log.dailyChallenge ? 1 : 0,
        ],
      });
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ id: Number(result.lastInsertRowid) }) };
    }

    // PUT — edit existing log
    if (event.httpMethod === "PUT") {
      const { id, log } = JSON.parse(event.body);
      await db.execute({
        sql: "UPDATE logs SET date=?, exercises=?, points=?, minutes=? WHERE id=?",
        args: [log.date, JSON.stringify(log.exercises || []), log.points || 0, log.minutes || 0, id],
      });
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    // DELETE — remove log
    if (event.httpMethod === "DELETE") {
      const { id } = JSON.parse(event.body);
      await db.execute({ sql: "DELETE FROM logs WHERE id=?", args: [id] });
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: CORS, body: "Method not allowed" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
