import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireLeader } from '@/server/responses';
import { getPhotoStorage } from '@/server/photoStorage';
import { photoReviewSchema } from '@/schemas';

export const runtime = 'nodejs';

/**
 * A leader's moderation decision on a pending photo. `approve` publishes it to
 * the team album; `reject` deletes the row and its bytes from storage, freeing
 * the uploader's weekly slot. Restricted to moderators via `requireLeader`.
 */
export function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    await requireLeader(req);
    const { id } = await ctx.params;
    const photoId = Number(id);
    if (!Number.isInteger(photoId) || photoId <= 0) throw new ApiError('not_found', 404);

    const { action } = await parseBody(req, photoReviewSchema);

    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: 'SELECT blob_key, status FROM album_photos WHERE id = ?',
      args: [photoId],
    });
    const row = result.rows[0];
    if (!row) throw new ApiError('not_found', 404);

    if (action === 'approve') {
      await db.execute({
        sql: "UPDATE album_photos SET status = 'approved' WHERE id = ?",
        args: [photoId],
      });
      return json({ ok: true, status: 'approved' });
    }

    // reject: remove the bytes from storage, then the metadata row.
    if (row.blob_key) {
      await getPhotoStorage().delete(String(row.blob_key));
    }
    await db.execute({ sql: 'DELETE FROM album_photos WHERE id = ?', args: [photoId] });
    return json({ ok: true, status: 'rejected' });
  });
}
