import { getDb, initDb } from '@/server/db';
import { handle, json, requireLeader } from '@/server/responses';

export const runtime = 'nodejs';

const MAX = 200;

interface PendingPhoto {
  id: number;
  alias: string;
  uploaderName: string;
  mimeType: string;
  weekStart: string;
  uploadedAt: string;
  date: string;
  status: 'pending';
  url: string;
}

/**
 * The moderation queue: every photo awaiting approval, oldest first so leaders
 * clear the backlog in upload order. Restricted to moderators (admin or a
 * leader account) via `requireLeader` — players never see the queue.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireLeader(req);
    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: `SELECT p.id, p.alias, p.mime_type, p.week_start, p.uploaded_at, u.display_name, u.display_alias
            FROM album_photos p
            LEFT JOIN users u ON u.alias = p.alias
            WHERE p.status = 'pending'
            ORDER BY p.uploaded_at ASC
            LIMIT ?`,
      args: [MAX],
    });

    const photos: PendingPhoto[] = result.rows.map((r) => {
      const id = Number(r.id);
      return {
        id,
        alias: String(r.alias),
        uploaderName: String(r.display_name || r.display_alias || r.alias),
        mimeType: String(r.mime_type || 'image/jpeg'),
        weekStart: String(r.week_start),
        uploadedAt: String(r.uploaded_at),
        date: String(r.uploaded_at || '').slice(0, 10),
        status: 'pending',
        url: `/api/photos/${id}`,
      };
    });
    return json({ photos });
  });
}
