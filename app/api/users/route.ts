import { getDb, initDb } from '@/server/db';
import { handle, json, requireUser } from '@/server/responses';
import { loadAllUsers } from '@/server/repo';

export const runtime = 'nodejs';

/**
 * All players, fully hydrated, for the leaderboard / team views. Requires a
 * session (SEC C1). Never returns password material (SEC C2) — `loadAllUsers`
 * maps only public profile fields. Leader (coach) accounts are excluded: they
 * do not play and must never appear in leaderboards or team stats.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const db = getDb();
    await initDb(db);
    const users = await loadAllUsers(db);
    return json(users.filter((u) => u.role !== 'leader'));
  });
}
