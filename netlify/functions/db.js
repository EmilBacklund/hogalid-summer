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
      avatar_config TEXT DEFAULT '{}',
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

    CREATE TABLE IF NOT EXISTS feed_reactions (
      event_key TEXT NOT NULL,
      alias TEXT NOT NULL,
      emoji TEXT NOT NULL,
      PRIMARY KEY (event_key, alias)
    );

    CREATE TABLE IF NOT EXISTS weekly_results (
      week_start TEXT PRIMARY KEY,
      challenge_label TEXT NOT NULL,
      challenge_type TEXT NOT NULL,
      value INTEGER NOT NULL,
      goal INTEGER NOT NULL,
      level INTEGER NOT NULL,
      level_name TEXT
    );

    CREATE TABLE IF NOT EXISTS cheers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_alias TEXT NOT NULL,
      to_alias TEXT NOT NULL,
      created_at TEXT NOT NULL,
      seen INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS buddy_challenges (
      id TEXT PRIMARY KEY,
      from_alias TEXT NOT NULL,
      to_alias TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      accepted_at TEXT,
      from_completed_at TEXT,
      to_completed_at TEXT,
      from_progress INTEGER DEFAULT 0,
      to_progress INTEGER DEFAULT 0
    );
  `);

  // Migrations
  const migrations = [
    "ALTER TABLE users ADD COLUMN display_password TEXT DEFAULT ''",
    "ALTER TABLE users ADD COLUMN display_name TEXT DEFAULT ''",
    "ALTER TABLE logs ADD COLUMN ice_cream INTEGER DEFAULT 0",
    "ALTER TABLE logs ADD COLUMN swim INTEGER DEFAULT 0",
    "ALTER TABLE logs ADD COLUMN pages INTEGER DEFAULT 0",
    "ALTER TABLE logs ADD COLUMN title TEXT DEFAULT ''",
    "ALTER TABLE logs ADD COLUMN created_at TEXT DEFAULT ''",
    "ALTER TABLE buddy_challenges ADD COLUMN from_baseline INTEGER DEFAULT 0",
    "ALTER TABLE buddy_challenges ADD COLUMN to_baseline INTEGER DEFAULT 0",
  ];
  for (const sql of migrations) {
    try { await db.execute(sql); } catch (e) { /* column already exists */ }
  }

  // Migration: add avatar_config column if missing (replaces old avatar_base)
  try {
    await db.execute("ALTER TABLE users ADD COLUMN avatar_config TEXT DEFAULT '{}'");
  } catch (e) {
    // Column already exists — ignore
  }
}
