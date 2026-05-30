import { getDb, initDb } from './db.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function stockholmToday() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function rowToPhoto(row) {
  return {
    id: row.id,
    alias: row.alias,
    uploaderName: row.display_name || row.display_alias || row.alias,
    imageData: row.image_data,
    mimeType: row.mime_type || 'image/jpeg',
    weekStart: row.week_start,
    uploadedAt: row.uploaded_at,
    date: (row.uploaded_at || '').slice(0, 10),
  };
}

export default async (req) => {
  const db = getDb();
  await initDb(db);

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    if (req.method === 'GET') {
      const result = await db.execute(`
        SELECT p.id, p.alias, p.image_data, p.mime_type, p.week_start, p.uploaded_at, u.display_name, u.display_alias
        FROM album_photos p
        LEFT JOIN users u ON u.alias = p.alias
        ORDER BY p.uploaded_at DESC
      `);
      return json(result.rows.map(rowToPhoto));
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const alias = (body.alias || '').trim().toLowerCase();
      const imageData = body.imageData || '';
      const mimeType = body.mimeType || 'image/jpeg';

      if (!alias || !imageData) {
        return json({ error: 'missing_fields' }, 400);
      }
      if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageData)) {
        return json({ error: 'invalid_image_type' }, 400);
      }
      if (imageData.length > 2_200_000) {
        return json({ error: 'image_too_large' }, 413);
      }

      const today = stockholmToday();
      const weekStart = getWeekStart(today);
      const limitCheck = await db.execute({
        sql: 'SELECT COUNT(*) AS count FROM album_photos WHERE alias = ? AND week_start = ?',
        args: [alias, weekStart],
      });
      const usedThisWeek = Number(limitCheck.rows[0]?.count || 0);
      if (usedThisWeek >= 2) {
        return json({ error: 'weekly_limit_reached' }, 429);
      }

      const uploadedAt = new Date().toISOString();
      const insert = await db.execute({
        sql: 'INSERT INTO album_photos (alias, image_data, mime_type, week_start, uploaded_at) VALUES (?, ?, ?, ?, ?)',
        args: [alias, imageData, mimeType, weekStart, uploadedAt],
      });
      const id = Number(insert.lastInsertRowid);

      const result = await db.execute({
        sql: `
          SELECT p.id, p.alias, p.image_data, p.mime_type, p.week_start, p.uploaded_at, u.display_name, u.display_alias
          FROM album_photos p
          LEFT JOIN users u ON u.alias = p.alias
          WHERE p.id = ?
        `,
        args: [id],
      });

      return json({ ok: true, photo: rowToPhoto(result.rows[0]) }, 201);
    }

    if (req.method === 'DELETE') {
      const body = await req.json();
      const id = body.id;
      if (!id) return json({ error: 'missing_id' }, 400);
      await db.execute({ sql: 'DELETE FROM album_photos WHERE id = ?', args: [Number(id)] });
      return json({ ok: true });
    }

    return json({ error: 'method_not_allowed' }, 405);
  } catch (error) {
    return json({ error: error.message || 'server_error' }, 500);
  }
};
