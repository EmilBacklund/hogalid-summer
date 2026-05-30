import { randomUUID } from 'node:crypto';
import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
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
  /** Auth-gated bytes endpoint — never the raw data (SEC M1). */
  url: string;
}

/** Paginated photo metadata. Returns URLs, never image bytes (SEC M1). */
export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: `SELECT p.id, p.alias, p.mime_type, p.week_start, p.uploaded_at, u.display_name, u.display_alias
            FROM album_photos p
            LEFT JOIN users u ON u.alias = p.alias
            ORDER BY p.uploaded_at DESC
            LIMIT ? OFFSET ?`,
      args: [limit + 1, offset],
    });

    const rows = result.rows.slice(0, limit);
    const hasMore = result.rows.length > limit;
    const photos: PhotoMeta[] = rows.map((r) => {
      const id = Number(r.id);
      return {
        id,
        alias: String(r.alias),
        uploaderName: String(r.display_name || r.display_alias || r.alias),
        mimeType: String(r.mime_type || 'image/jpeg'),
        weekStart: String(r.week_start),
        uploadedAt: String(r.uploaded_at),
        date: String(r.uploaded_at || '').slice(0, 10),
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
    const insert = await db.execute({
      sql: 'INSERT INTO album_photos (alias, blob_key, mime_type, week_start, uploaded_at) VALUES (?, ?, ?, ?, ?)',
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
          url: `/api/photos/${id}`,
        },
      },
      201,
    );
  });
}
