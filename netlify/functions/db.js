import { createClient } from "@libsql/client";

export function getDb() {
  return createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  });
}

export async function initDb(db) {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      alias TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      display_password TEXT DEFAULT '',
      avatar_base INTEGER DEFAULT 0,
      unlocked_items TEXT DEFAULT '[]',
      highscores TEXT DEFAULT '{}',
      joined_at TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alias TEXT NOT NULL,
      date TEXT NOT NULL,
      exercises TEXT DEFAULT '[]',
      points INTEGER DEFAULT 0,
      minutes INTEGER DEFAULT 0,
      bingo INTEGER DEFAULT 0,
      bingo_football INTEGER DEFAULT 0,
      daily_challenge INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bingo (
      alias TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      PRIMARY KEY (alias, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS completed_daily (
      alias TEXT NOT NULL,
      date TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      PRIMARY KEY (alias, date)
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migrations
  const migrations = [
    "ALTER TABLE users ADD COLUMN display_password TEXT DEFAULT ''",
    "ALTER TABLE logs ADD COLUMN ice_cream INTEGER DEFAULT 0",
    "ALTER TABLE logs ADD COLUMN swim INTEGER DEFAULT 0",
    "ALTER TABLE logs ADD COLUMN pages INTEGER DEFAULT 0",
  ];
  for (const sql of migrations) {
    try { await db.execute(sql); } catch (e) { /* column already exists */ }
  }
}
