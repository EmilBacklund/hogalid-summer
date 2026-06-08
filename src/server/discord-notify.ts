import type { ErrorEvent, EventHint } from '@sentry/nextjs';

const WEBHOOK_URL = process.env.DISCORD_ERROR_WEBHOOK_URL;

/** Discord embed colour (red) for error notifications. */
const RED = 0xe03131;

/** Cap field lengths well under Discord's 4096/embed limit. */
const MAX_DESC = 1500;

/** Bound the webhook round-trip so a slow/hanging Discord can't stall the error path. */
const POST_TIMEOUT_MS = 2000;

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Where the error was captured — surfaced in the Discord embed footer. */
export type ErrorSource = 'server' | 'edge' | 'client';

export interface DiscordErrorInput {
  type: string;
  message: string;
  source: ErrorSource;
  environment?: string | undefined;
  route?: string | undefined;
  url?: string | undefined;
  stack?: string | undefined;
  eventId?: string | undefined;
}

/**
 * Post a single error to the Discord channel via an incoming webhook.
 *
 * This replaces Sentry's native Discord integration (which requires a paid Team
 * plan). Best-effort and self-contained: it never throws and never rejects, so a
 * failed Discord post can't break event processing or the request itself.
 *
 * The webhook URL is server-only — never import this into client code.
 */
export async function postErrorToDiscord(input: DiscordErrorInput): Promise<void> {
  if (!WEBHOOK_URL) return;

  try {
    const env = input.environment ?? process.env.NODE_ENV ?? 'unknown';
    const issueUrl = input.eventId
      ? `https://hogalid-summer.sentry.io/issues/?query=${input.eventId}`
      : undefined;

    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: 'Environment', value: env, inline: true },
      { name: 'Source', value: input.source, inline: true },
    ];
    if (input.route) {
      fields.push({ name: 'Route', value: truncate(input.route, 200) });
    }
    if (input.url) {
      fields.push({ name: 'URL', value: truncate(input.url, 300) });
    }
    if (issueUrl) {
      fields.push({ name: 'Sentry', value: `[View event](${issueUrl})` });
    }

    const description = input.stack
      ? truncate(`${input.message}\n\n\`\`\`\n${input.stack}\n\`\`\``, MAX_DESC)
      : truncate(input.message, MAX_DESC);

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(POST_TIMEOUT_MS),
      body: JSON.stringify({
        username: 'Hogalid Errors',
        // Error text is partly user-controlled; never let it ping @everyone/roles.
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: truncate(`🔴 ${input.type}`, 256),
            description,
            color: RED,
            fields,
          },
        ],
      }),
    });
    if (!res.ok) {
      // Best-effort: log for visibility but never throw (e.g. rate-limited webhook).
      console.error('[discord-notify] webhook returned', res.status);
    }
  } catch {
    // Never let a notification failure surface — Sentry still records the event.
  }
}

/**
 * Adapter: forward a Sentry server/edge error event to Discord. Called from
 * `beforeSend` in the server/edge Sentry configs (never the client, where the
 * webhook secret must not be exposed — client errors route through
 * `/api/client-error` instead).
 */
export async function notifyDiscordOfError(
  event: ErrorEvent,
  hint?: EventHint,
  source: ErrorSource = 'server',
): Promise<void> {
  const exception = event.exception?.values?.[0];
  const stack = hint?.originalException instanceof Error ? hint.originalException.stack : undefined;

  await postErrorToDiscord({
    type: exception?.type ?? 'Error',
    message: exception?.value ?? event.message ?? 'Unknown error (no message)',
    source,
    environment: event.environment,
    route: event.transaction,
    url: event.request?.url,
    stack,
    eventId: event.event_id,
  });
}
