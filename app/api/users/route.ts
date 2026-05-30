import { getDb, initDb } from '@/server/db';
import { handle, json, requireUser } from '@/server/responses';
import { loadAllUsers } from '@/server/repo';

export const runtime = 'nodejs';

/**
 * All players, fully hydrated, for the leaderboard / team views. Requires a
 * session (SEC C1). Never returns password material (SEC C2) — `loadAllUsers`
 * maps only public profile fields.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const db = getDb();
    await initDb(db);
    return json(await loadAllUsers(db));
  });
}
