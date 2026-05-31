import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/server/db';
import { ApiError, handle, isModerator, requireUser } from '@/server/responses';
import { getPhotoStorage } from '@/server/photoStorage';

export const runtime = 'nodejs';

/**
 * Serve a photo's bytes from Netlify Blobs, auth-gated (SEC M1) — these are
 * minors' photos and must never be publicly fetchable. Cached privately.
 * Un-approved photos are only served to their uploader or a moderator, so a
 * pending photo can never be fetched by id before a leader has approved it.
 */
export function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const session = await requireUser(req);
    const { id } = await ctx.params;
    const photoId = Number(id);
    if (!Number.isInteger(photoId) || photoId <= 0) throw new ApiError('not_found', 404);

    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: 'SELECT alias, blob_key, mime_type, status FROM album_photos WHERE id = ?',
      args: [photoId],
    });
    const row = result.rows[0];
    if (!row || !row.blob_key) throw new ApiError('not_found', 404);

    const approved = row.status === 'approved';
    const owns = String(row.alias) === session.alias;
    if (!approved && !owns && !isModerator(session)) throw new ApiError('not_found', 404);

    const bytes = await getPhotoStorage().get(String(row.blob_key));
    if (!bytes) throw new ApiError('not_found', 404);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': String(row.mime_type || 'image/jpeg'),
        'Cache-Control': 'private, max-age=86400',
      },
    });
  });
}
