import * as Sentry from '@sentry/nextjs';
import { notifyDiscordOfError } from '@/server/discord-notify';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  enabled: Boolean(dsn) && process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  ...(dsn ? { dsn } : {}),
  async beforeSend(event, hint) {
    // Mirror server-side errors to Discord (replaces the paid integration).
    await notifyDiscordOfError(event, hint);
    return event;
  },
});
