import { getDb, initDb } from '@/server/db';
import { handle, json } from '@/server/responses';

export const runtime = 'nodejs';

/**
 * Public season config (season start + countdown target). Read-only and
 * non-sensitive, so it stays open — the login screen reads the countdown before
 * a session exists. Writes go through the admin route.
 */
export function GET() {
  return handle(async () => {
    const db = getDb();
    await initDb(db);
    const result = await db.execute('SELECT key, value FROM config');
    const cfg: Record<string, string> = {};
    for (const row of result.rows) cfg[String(row.key)] = String(row.value);
    return json({
      seasonStart: cfg['season_start'] ?? null,
      countdownDate: cfg['countdown_date'] ?? null,
    });
  });
}
