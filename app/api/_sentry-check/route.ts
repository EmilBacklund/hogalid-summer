import * as Sentry from '@sentry/nextjs';
import { json } from '@/server/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TEMPORARY Sentry verification endpoint — DELETE after confirming events land.
 * Captures a labelled test exception and flushes before returning, so the event
 * is guaranteed sent even in a short-lived serverless function. Inert outside
 * production (Sentry is disabled without a DSN + NODE_ENV=production).
 */
export async function GET() {
  const eventId = Sentry.captureException(
    new Error('Sentry verification check — safe to ignore, delete /api/_sentry-check'),
  );
  await Sentry.flush(2000);
  return json({ ok: true, eventId });
}
