# Högalid F15 — Sommarlovet 2026

A gamified summer-training app for the Högalid F15 girls' football team. Players log
exercises and summer activities, earn points and levels, unlock avatar customizations
and collector cards, complete bingo grids, and challenge each other through buddy
challenges. The UI is in Swedish; the code and comments are in English.

## Tech stack

| Layer            | Tool                                                              |
| ---------------- | ----------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router), React 19                                 |
| Language         | TypeScript (strict)                                               |
| Styling          | Tailwind CSS v4 (`@theme` tokens in `app/globals.css`)            |
| Server state     | TanStack Query v5                                                 |
| Forms/validation | React Hook Form + Zod (Zod also validates every API route)        |
| API              | Next.js Route Handlers (`app/api/*/route.ts`)                     |
| Auth             | Signed httpOnly cookie (HMAC-SHA256) + PBKDF2 password hashing    |
| Database         | Turso (libsql) via `@libsql/client`                               |
| Photo storage    | Netlify Blobs in prod; local-disk fallback in dev/test            |
| Avatars / icons  | DiceBear / lucide-react                                           |
| Errors           | Sentry (inert without a DSN)                                      |
| Hosting          | Netlify (`@netlify/plugin-nextjs`)                                |
| Tests            | Vitest + React Testing Library (unit/component), Playwright (E2E) |
| Tooling          | ESLint 9 (flat), Prettier 3, Husky + lint-staged + commitlint     |

## Prerequisites

- Node 20+
- A Turso database (https://turso.tech)

## Local development

```bash
npm install
npm run dev          # Next.js dev server on http://localhost:3000
```

## Environment variables

Create a `.env.local` in the repo root (gitignored) **or** set these in
Netlify → Site settings → Environment variables for the deployed site:

```env
# Required
TURSO_URL=libsql://<your-database>.turso.io
TURSO_TOKEN=<your-turso-auth-token>
SESSION_SECRET=<random-32+-char-secret-for-signing-session-cookies>
ADMIN_ALIAS=<admin-login-name>
ADMIN_PASSWORD=<admin-password>

# Optional
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>   # client errors; omit to disable
SENTRY_DSN=<sentry-dsn>               # server errors; omit to disable
```

The app fails fast on a missing `TURSO_URL`/`TURSO_TOKEN`/`SESSION_SECRET`. The single
admin account is defined by `ADMIN_ALIAS` / `ADMIN_PASSWORD` (no roles table); on admin
login the session cookie carries a signed `admin` claim that every privileged Route
Handler re-verifies server-side.

> **Photos:** in production, photo bytes go to **Netlify Blobs**. Under `npm run dev`
> (and in E2E) `NODE_ENV !== 'production'`, so they fall back to a gitignored
> `.photos-dev/` directory — no Netlify runtime needed locally.

## Scripts

| Script                  | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Next.js dev server (port 3000)                          |
| `npm run build`         | Production build                                        |
| `npm run start`         | Serve the production build                              |
| `npm run typecheck`     | `tsc --noEmit` (strict)                                 |
| `npm run lint`          | ESLint                                                  |
| `npm run test`          | Vitest (unit + component + handler tests)               |
| `npm run test:coverage` | Vitest with V8 coverage                                 |
| `npm run e2e`           | Playwright E2E suite (needs env vars; boots dev server) |
| `npm run format`        | Prettier write                                          |

## Project structure

```
app/
  api/             Route Handlers — the backend (auth, logs, bingo, photos, admin, ...)
  (routes)/        Pages: /, /login, /log, /log/history, /profile, /challenges,
                   /bingo, /cards, /team, /team/photos, /admin
  layout.tsx       Root layout + providers
  globals.css      Tailwind v4 @theme tokens, fonts, shared keyframes
middleware.ts      Edge auth guard (unauthed → /login; /admin requires the admin claim)
src/
  server/          Server-only logic: db, auth (PBKDF2), session (signed cookie),
                   points (server-authoritative scoring), photoStorage, rate limiting,
                   invites, repo (row → domain mappers), responses (error wrapper)
  components/       UI by feature: common/, avatar/, home/, log/, profile/, challenges/,
                   bingo/, cards/, team/, photos/, admin/
  hooks/           TanStack Query hooks + mutations (useMe, useLogMutations, ...)
  providers/       QueryProvider + UserProvider
  schemas/         Zod request/response schemas (shared client/server)
  types/           Shared domain types
  constants/       Static data (exercises, challenges, cards, levels, badges, ...)
  utils/           Pure helpers (date, levels, stats, bingo, team, coins, ...)
e2e/               Playwright specs for the critical flows
```

## Security model

The app was hardened during the rewrite (see `PLAN.md`, tagged `[SEC …]`):

- **Auth/authz** — signed httpOnly session cookie; every mutation derives the acting
  user from the cookie, never the request body; admin actions verify the signed claim.
- **No plaintext passwords** — PBKDF2 hashes only; the old `display_password` column and
  show-password UI are gone.
- **Server-authoritative scoring** — points/minutes are recomputed and clamped
  server-side; the client cannot submit a score.
- **Photos out of the DB** — bytes in Netlify Blobs, metadata-only rows, auth-gated byte
  serving.
- **Rate limiting + generic error messages** on auth and invite endpoints.

## Deployment

Netlify builds with `@netlify/plugin-nextjs` (config in [`netlify.toml`](./netlify.toml)).
`master` is the production branch. Set the environment variables above in the Netlify
site settings before deploying.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for commit conventions, branch strategy, and
the local checks enforced by git hooks.
