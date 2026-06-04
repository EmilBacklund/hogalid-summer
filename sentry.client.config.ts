import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  enabled: Boolean(dsn) && process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  ...(dsn ? { dsn } : {}),
});
