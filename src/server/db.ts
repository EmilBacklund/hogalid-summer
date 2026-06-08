import { createClient, type Client } from '@libsql/client';

/**
 * Single libsql client per server instance. Route Handlers run in a long-lived
 * Node process on Netlify, so we memoize the client instead of opening a new
 * connection per request.
 */
let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_TOKEN;
  if (!url) throw new Error('TURSO_URL is not configured');
  client = createClient(authToken ? { url, authToken } : { url });
  return client;
}

/**
 * Ensure the schema exists. Idempotent — safe to call on every cold start.
 *
 * Note (SEC C2): the `display_password` plaintext column is intentionally gone.
 * Passwords are stored only as PBKDF2 hashes in `users.password`. Photo bytes
 * (SEC M1) live in Netlify Blobs; `album_photos` keeps metadata + `blob_key`.
 */
let initialized = false;

/** True when the connected DB still has the legacy `album_photos.image_data` column. */
let albumPhotosHasImageData = false;

/** Whether photo inserts must supply the legacy NOT NULL `image_data` column. */
export function albumPhotosNeedsImageData(): boolean {
  return albumPhotosHasImageData;
}

export async function initDb(db: Client = getDb()): Promise<void> {
  if (initialized) return;
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      alias TEXT PRIMARY KEY,
      display_alias TEXT DEFAULT '',
      display_name TEXT DEFAULT '',
      password TEXT NOT NULL,
      avatar_config TEXT DEFAULT '{}',
      unlocked_items TEXT DEFAULT '[]',
      highscores TEXT DEFAULT '{}',
      secret_flags TEXT DEFAULT '{}',
      joined_at TEXT,
      role TEXT NOT NULL DEFAULT 'player',
      must_change_password INTEGER NOT NULL DEFAULT 0
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
      daily_challenge INTEGER DEFAULT 0,
      ice_cream INTEGER DEFAULT 0,
      swim INTEGER DEFAULT 0,
      pages INTEGER DEFAULT 0,
      title TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
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

    CREATE TABLE IF NOT EXISTS adult_bingo (
      alias TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      PRIMARY KEY (alias, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS bonus_bingo (
      alias TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      PRIMARY KEY (alias, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS bingo_two (
      alias TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      PRIMARY KEY (alias, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      clicked_at TEXT,
      used_at TEXT,
      used_by_alias TEXT,
      created_at TEXT NOT NULL
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
      to_progress INTEGER DEFAULT 0,
      from_baseline INTEGER DEFAULT 0,
      to_baseline INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS album_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alias TEXT NOT NULL,
      blob_key TEXT NOT NULL,
      mime_type TEXT DEFAULT 'image/jpeg',
      week_start TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );
  `);

  // Idempotent migration for DBs created before photos moved to Netlify Blobs.
  try {
    await db.execute("ALTER TABLE album_photos ADD COLUMN blob_key TEXT DEFAULT ''");
  } catch {
    // column already exists
  }

  // Idempotent migration for DBs created before leader accounts existed. Every
  // pre-existing account is a player; only admin-created accounts are leaders.
  try {
    await db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'player'");
  } catch {
    // column already exists
  }

  // Idempotent migration for the forced first-login password change. Leaders are
  // created by the admin with a temporary password and must_change_password = 1;
  // they pick their own password on first login. Pre-existing accounts default to
  // 0 (no forced change).
  try {
    await db.execute(
      'ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0',
    );
  } catch {
    // column already exists
  }

  // Idempotent migration for DBs created before photo approval existed. Photos
  // uploaded under the old instant-publish behaviour are grandfathered in as
  // 'approved'; new uploads insert 'pending' explicitly and await a leader.
  try {
    await db.execute("ALTER TABLE album_photos ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
  } catch {
    // column already exists
  }

  // Legacy DBs (pre-SEC M1) kept base64 bytes in a NOT NULL `image_data` column.
  // We no longer write bytes to the DB, but the NOT NULL constraint would reject
  // metadata-only inserts — so detect the column and supply '' for it on insert
  // (non-destructive: existing rows keep their data).
  const columns = await db.execute('PRAGMA table_info(album_photos)');
  albumPhotosHasImageData = columns.rows.some((r) => String(r.name) === 'image_data');

  initialized = true;
}

/** Test-only: reset the memoized init flag so a fresh fake DB re-runs initDb. */
export function resetInitForTests(): void {
  initialized = false;
  albumPhotosHasImageData = false;
  client = null;
}
