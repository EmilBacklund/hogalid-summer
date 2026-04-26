# Högalid F15 — Sommarlovet 2026

A gamified summer training app for the Högalid F15 girls' football team. Players log
exercises and summer activities, earn points and levels, unlock avatar customizations
and collector cards, complete bingo grids, and challenge each other through buddy
challenges. The UI is in Swedish.

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS v4 |
| Backend | Netlify Functions (Node 20) |
| Database | Turso (libsql) |
| Hosting | Netlify |
| Avatars | DiceBear |
| Icons | lucide-react |

> The project is being rewritten to **Next.js 15 + TypeScript + Tailwind v4** with
> proper tooling (ESLint, Prettier, Husky, Vitest, Playwright) and multi-tenant-aware
> database schema. The migration is tracked in [`PLAN.md`](./PLAN.md) and lives on the
> `rewrite/next` branch.

## Prerequisites

- Node 20+
- A Turso database (https://turso.tech)
- Netlify CLI (installed automatically as a dev dependency)

## Local development

```bash
npm install
npm run dev
```

`npm run dev` starts Netlify Dev on **http://localhost:8888**, which proxies Vite
(running on port 5173) and serves the Netlify Functions under `/.netlify/functions/*`.

To run only the frontend without the functions, use `npm run dev:vite`.

## Environment variables

Create a `.env` file in the repo root (it is gitignored) **or** set these in
Netlify → Site settings → Environment variables for the deployed site:

```env
TURSO_URL=libsql://<your-database>.turso.io
TURSO_TOKEN=<your-turso-auth-token>
```

Both are required. The functions will fail to initialize without them.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Netlify Dev (functions + Vite) on port 8888 |
| `npm run dev:vite` | Vite dev server only, port 5173 (no functions) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the built bundle locally |

## Project structure

```
src/
  components/        Reusable UI (common/, avatar/)
  screens/           One file per top-level screen (Home, Log, Bingo, etc.)
  context/           UserContext — global state, session, routing
  utils/             Pure helpers (api, date, levels, stats, feed, ...)
  constants/         Static data (exercises, challenges, cards, levels, ...)
netlify/
  functions/         Serverless API (users, logs, photos, buddy-challenges, ...)
public/
  spelarbilder/      Player photos used in collector cards
```

## Deployment

Netlify deploys on every push to `master`. The build command (`npm install && npm run build`)
and publish directory (`dist`) are configured in [`netlify.toml`](./netlify.toml).

## Branches

- **`master`** — production. Auto-deploys to Netlify.
- **`rewrite/next`** — ongoing rewrite to Next.js + TypeScript. Per-session feature
  branches PR into here. See `PLAN.md` for the migration roadmap.

## Admin

There is a single admin account stored in the `users` table with an admin flag.
The password is hashed (PBKDF2) like any other user. Credentials are **not** stored
in this repository — ask Emil if you need them.
