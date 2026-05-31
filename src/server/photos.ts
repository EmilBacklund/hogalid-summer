import type { Client } from '@libsql/client';
import { getPhotoStorage } from './photoStorage';

/**
 * Delete a photo's bytes (best-effort, from Netlify Blobs) and its metadata
 * row. Returns false when the photo did not exist. Shared by the leader's
 * reject action and the admin gallery's delete so removal happens in one place.
 */
export async function deletePhotoById(db: Client, photoId: number): Promise<boolean> {
  const result = await db.execute({
    sql: 'SELECT blob_key FROM album_photos WHERE id = ?',
    args: [photoId],
  });
  const row = result.rows[0];
  if (!row) return false;
  if (row.blob_key) {
    try {
      await getPhotoStorage().delete(String(row.blob_key));
    } catch {
      // The metadata row is the source of truth; a missing/failed blob delete
      // must not block removing the row.
    }
  }
  await db.execute({ sql: 'DELETE FROM album_photos WHERE id = ?', args: [photoId] });
  return true;
}
