import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

Sentry.init({
  enabled: Boolean(dsn) && process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  ...(dsn ? { dsn } : {}),
  beforeSend(event, hint) {
    // The webhook secret is server-only, so we can't post to Discord from the
    // browser. Relay through /api/client-error instead. Fire-and-forget with
    // keepalive so it survives a page unload; failures are swallowed. Lengths are
    // clipped to match the server's payload caps so the relay never 400s.
    try {
      const exception = event.exception?.values?.[0];
      const stack =
        hint?.originalException instanceof Error ? hint.originalException.stack : undefined;
      void fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          type: clip(exception?.type ?? 'Error', 200),
          message: clip(exception?.value ?? event.message ?? 'Unknown error', 2000),
          url: typeof window !== 'undefined' ? clip(window.location.href, 500) : undefined,
          stack: stack ? clip(stack, 4000) : undefined,
          eventId: event.event_id,
        }),
      }).catch(() => {});
    } catch {
      // Never let relay setup break Sentry's own reporting.
    }
    return event;
  },
});
