import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireLeader } from '@/server/responses';
import { deletePhotoById } from '@/server/photos';
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

    if (action === 'approve') {
      const result = await db.execute({
        sql: "UPDATE album_photos SET status = 'approved' WHERE id = ?",
        args: [photoId],
      });
      if (result.rowsAffected === 0) throw new ApiError('not_found', 404);
      return json({ ok: true, status: 'approved' });
    }

    // reject: remove the bytes from storage, then the metadata row.
    if (!(await deletePhotoById(db, photoId))) throw new ApiError('not_found', 404);
    return json({ ok: true, status: 'rejected' });
  });
}
