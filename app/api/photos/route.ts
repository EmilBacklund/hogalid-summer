import { randomUUID } from 'node:crypto';
import { albumPhotosNeedsImageData, getDb, initDb } from '@/server/db';
import { ApiError, handle, isModerator, json, parseBody, requireUser } from '@/server/responses';
import { getPhotoStorage } from '@/server/photoStorage';
import { getWeekStart, stockholmToday } from '@/server/dates';
import { photoUploadSchema } from '@/schemas';

export const runtime = 'nodejs';

const MAX_BYTES = 1_600_000; // ~1.6 MB after client downscale (SEC M1)
const WEEKLY_LIMIT = 2;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

interface PhotoMeta {
  id: number;
  alias: string;
  uploaderName: string;
  mimeType: string;
  weekStart: string;
  uploadedAt: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  /** Auth-gated bytes endpoint — never the raw data (SEC M1). */
  url: string;
}

/**
 * Paginated photo metadata. Returns URLs, never image bytes (SEC M1). The album
 * only ever surfaces approved photos; an uploader additionally sees their own
 * pending ones (badged as awaiting approval in the UI), so they know the upload
 * landed and is queued for a leader.
 */
export function GET(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

    const db = getDb();
    await initDb(db);
    // Moderators (admin / leaders) see every photo — including pending ones —
    // so the admin gallery can manage the full album. Players only ever see
    // approved photos plus their own (pending shots they uploaded).
    const moderator = isModerator(session);
    const result = await db.execute({
      sql: `SELECT p.id, p.alias, p.mime_type, p.week_start, p.uploaded_at, p.status, u.display_name, u.display_alias
            FROM album_photos p
            LEFT JOIN users u ON u.alias = p.alias
            ${moderator ? '' : "WHERE p.status = 'approved' OR p.alias = ?"}
            ORDER BY p.uploaded_at DESC
            LIMIT ? OFFSET ?`,
      args: moderator ? [limit + 1, offset] : [session.alias, limit + 1, offset],
    });

    const rows = result.rows.slice(0, limit);
    const hasMore = result.rows.length > limit;
    const photos: PhotoMeta[] = rows.map((r) => {
      const id = Number(r.id);
      const status = r.status === 'pending' || r.status === 'rejected' ? r.status : 'approved';
      return {
        id,
        alias: String(r.alias),
        uploaderName: String(r.display_name || r.display_alias || r.alias),
        mimeType: String(r.mime_type || 'image/jpeg'),
        weekStart: String(r.week_start),
        uploadedAt: String(r.uploaded_at),
        date: String(r.uploaded_at || '').slice(0, 10),
        status,
        url: `/api/photos/${id}`,
      };
    });
    return json({ photos, nextOffset: hasMore ? offset + limit : null });
  });
}

/** Upload a photo: bytes go to Netlify Blobs, metadata to the DB (SEC M1). */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { imageData, mimeType } = await parseBody(req, photoUploadSchema);

    const commaIdx = imageData.indexOf(',');
    const base64 = imageData.slice(commaIdx + 1);
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length === 0) throw new ApiError('invalid_image', 400);
    if (bytes.length > MAX_BYTES) throw new ApiError('image_too_large', 413);

    const headerMatch = /^data:(image\/(?:jpeg|jpg|png|webp));base64,/i.exec(imageData);
    const resolvedMime = mimeType ?? headerMatch?.[1]?.toLowerCase() ?? 'image/jpeg';

    const db = getDb();
    await initDb(db);
    const weekStart = getWeekStart(stockholmToday());
    const limitCheck = await db.execute({
      sql: 'SELECT COUNT(*) AS count FROM album_photos WHERE alias = ? AND week_start = ?',
      args: [session.alias, weekStart],
    });
    if (Number(limitCheck.rows[0]?.count ?? 0) >= WEEKLY_LIMIT) {
      throw new ApiError('weekly_limit_reached', 429);
    }

    const blobKey = `${session.alias}/${weekStart}/${randomUUID()}`;
    await getPhotoStorage().put(blobKey, bytes);

    const uploadedAt = new Date().toISOString();
    // New uploads await a leader's approval before the team can see them
    // (status='pending'); the literal keeps the args positions stable. Legacy
    // DBs still carry a NOT NULL `image_data` column; supply '' for it so the
    // metadata-only insert satisfies the constraint (bytes live in storage).
    const insert = albumPhotosNeedsImageData()
      ? await db.execute({
          sql: "INSERT INTO album_photos (alias, blob_key, mime_type, week_start, uploaded_at, status, image_data) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
          args: [session.alias, blobKey, resolvedMime, weekStart, uploadedAt, ''],
        })
      : await db.execute({
          sql: "INSERT INTO album_photos (alias, blob_key, mime_type, week_start, uploaded_at, status) VALUES (?, ?, ?, ?, ?, 'pending')",
          args: [session.alias, blobKey, resolvedMime, weekStart, uploadedAt],
        });
    const id = Number(insert.lastInsertRowid);

    return json(
      {
        ok: true,
        photo: {
          id,
          alias: session.alias,
          mimeType: resolvedMime,
          weekStart,
          uploadedAt,
          date: uploadedAt.slice(0, 10),
          status: 'pending',
          url: `/api/photos/${id}`,
        },
      },
      201,
    );
  });
}
