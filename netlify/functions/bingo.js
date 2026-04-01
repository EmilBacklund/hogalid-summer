import { getDb, ensureTables } from "./db.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };

  const db = getDb();
  await ensureTables(db);

  try {
    if (event.httpMethod === "POST") {
      const { alias, challengeId } = JSON.parse(event.body);
      await db.execute({
        sql: "INSERT OR IGNORE INTO bingo (alias, challenge_id) VALUES (?,?)",
        args: [alias.toLowerCase(), challengeId],
      });
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }
    return { statusCode: 405, headers: CORS, body: "Method not allowed" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
