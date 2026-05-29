# Hogalid Summer — Migration Plan

Full rewrite from **React + Vite + JS + inline styles + Netlify Functions**
to **Next.js 15 (App Router) + TypeScript + Tailwind v4 + Route Handlers**, with
modern tooling and tests.

Each session below is scoped to roughly one working session. Check off items as we go.
Keep this file updated at the end of every session — it is the source of truth for
where we are.

---

## 🎯 Launch scope & deadline

**Target: live, working, no known issues by 2026-06-07 (8 days).**

Scope is deliberately tight: **upgrade the stack + fix all security issues + fix bugs.**
**No new features.** Anything that isn't part of porting the existing app, hardening it,
or fixing a bug is explicitly out of scope for this launch (see "Out of scope" below).

### Out of scope for launch (do NOT build)
- Multi-tenant / "any team can apply" (teams table, memberships, per-team config, email-based accounts)
- Sentry / external error monitoring
- Commitizen + custom commit-banner script (keep plain commitlint only)
- Framer Motion / animation rewrites — keep the existing CSS/canvas animations as-is
- Server-component optimization, Lighthouse-90 chase, Storybook, dark mode

---

## Current state (snapshot, 2026-04-22)

- **Stack**: React 18.2, Vite 5, JavaScript/JSX, Tailwind v4 (via `@tailwindcss/vite`)
- **Backend**: Netlify Functions (6 files, 1,481 lines) talking to Turso (libsql)
- **Code size**: ~11,735 lines across `src/` + ~1,481 in `netlify/functions/`
- **Routing**: manual screen dispatcher in `UserContext` with `pushState`/`popState`
- **State**: one big React Context + `localStorage` session
- **Styling**: mostly inline style objects, some Tailwind sprinkled in
- **Tests / lint / format / TS**: none
- **Language**: UI in Swedish, code comments English

Full file inventory is in the exploration notes (archived in git history of this file).

---

## Target stack

| Area                 | Pick                                                                 | Why                                                               |
| -------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Framework            | **Next.js 15, App Router**                                           | Modern default, SSR + route handlers, file-based routing          |
| Language             | **TypeScript (strict)**                                              | Catch bugs at compile time, self-documenting code                 |
| Styling              | **Tailwind v4**                                                      | Already in use, great with Next.js                                |
| Class helpers        | **clsx + tailwind-merge** (via `cn()`)                               | Standard pattern for conditional classes                          |
| Component variants   | **cva** (class-variance-authority)                                   | Typed variants for Card, Button, etc.                             |
| Server state / cache | **TanStack Query v5**                                                | Replaces ad-hoc `fetch` + manual caches                           |
| Forms                | **React Hook Form + Zod**                                            | Best-in-class, shared schemas with API                            |
| Validation (runtime) | **Zod**                                                              | Request/response validation on API routes, single source of truth |
| Animations           | **Keep existing CSS `@keyframes` + canvas**                          | Already work; rewriting them adds risk and no value before launch |
| Icons                | **lucide-react** (keep)                                              | Already used                                                      |
| Avatar               | **@dicebear** (keep)                                                 | Already used                                                      |
| DB client            | **@libsql/client** (keep)                                            | Already used, Turso-compatible                                    |
| Photo storage        | **Netlify Blobs** (`@netlify/blobs`)                                 | Move image bytes out of the DB (see [SEC M1])                     |
| Auth                 | **httpOnly signed cookie + PBKDF2**                                  | Replace `localStorage` — fixes XSS risk and the no-auth API       |
| Linting              | **ESLint 9 (flat config) + typescript-eslint + eslint-plugin-react** | Modern flat config                                                |
| Formatting           | **Prettier 3 + prettier-plugin-tailwindcss**                         | Auto-sorts Tailwind classes                                       |
| Git hooks            | **Husky + lint-staged + commitlint**                                 | Conventional Commits enforced                                     |
| Unit/component tests | **Vitest + React Testing Library**                                   | Fast, Vite-compatible                                             |
| E2E tests            | **Playwright**                                                       | Standard for Next.js; one focused happy-path suite                |
| CI                   | **GitHub Actions**                                                   | Typecheck, lint, test, build on PR                                |
| Deployment           | **Netlify** (via `@netlify/plugin-nextjs`)                           | Confirmed                                                         |

---

## Resolved decisions

1. **Deployment**: **Netlify** (keep). Next.js runs via `@netlify/plugin-nextjs`.
2. **Rewrite strategy**: **in-place on branch `rewrite/next`**. Git history is our safety net.
3. **Auth**: **custom httpOnly signed cookie + PBKDF2**. Not `next-auth` / Auth.js — the alias+password scheme doesn't map cleanly to it, and custom cookie auth is ~100 lines.
4. **API**: Next.js **Route Handlers** (`app/api/*/route.ts`) replace Netlify Functions. Netlify still deploys them.
5. **Screen splitting**: extract sub-components where it's natural (`<ChallengeCard>`, `<StatTile>`). No over-engineering.
6. **Server vs Client Components**: keep everything **client-side** for this launch. Server-component optimization is out of scope.
7. **Admin model**: keep the **single admin** (credentials in env vars — `ADMIN_ALIAS` / `ADMIN_PASSWORD`). No roles table, no multi-tenant. On admin login, issue a signed cookie carrying an `admin` claim; every admin Route Handler verifies that claim server-side.
8. **Security hardening (from the 2026-05-29 review of `master`)** — the rewrite must fix these by design; tasks are tagged `[SEC …]` in the sessions below:
   - **C1** no API auth/authz → signed cookie sessions; every mutation derives the acting user from the cookie (not the body); admin actions verify the `admin` claim server-side (S3/S4/S10).
   - **C2** passwords stored/served in plaintext (`display_password`) → drop the column and the admin show-password UI (S3 + S10).
   - **C3** wide-open CORS → eliminated naturally by same-origin Route Handlers.
   - **H1** client-supplied points → recompute server-side from exercises (S3).
   - **M1** base64 photos in DB → Netlify Blobs + metadata-only rows (S3).
   - **M3/M4** no rate limiting / leaked error messages → add in S3.
   - **C4** (operational, outside the rewrite): rotate the Turso token; it was shared out-of-band. Not in git history.

---

## Conventions & ground rules

- **Commit style**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `style:`, `ci:`). Enforced by commitlint.
- **Branch**: all migration work on `rewrite/next`. Merge to `master` only when Session 12 passes.
- **No patches on old code**: we're rewriting, not porting line-for-line. If a component needs a different shape to be idiomatic in Next + TS + Tailwind, change the shape.
- **Delete, don't comment out**. Git remembers.
- **No back-compat shims**. The old app goes away.
- **Type strictness**: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. No `any` without a comment explaining why.
- **Styling**: zero inline `style={{...}}` objects in the final code, except for truly dynamic values (computed transforms, animated positions). Everything else is Tailwind.
- **Tests**: every utility function gets unit tests; every API route gets a handler test; the critical user flows get one Playwright E2E pass.

---

# Sessions

## Session 1 — Foundation & tooling

**Goal**: scaffold the new project and wire up tooling so every future commit is linted/formatted/typechecked/tested.

### Already done (before main S1 work)

- [x] Plan written, decisions resolved (Netlify, `rewrite/next` branch, custom cookie auth)
- [x] Branch `rewrite/next` created and pushed to origin
- [x] README rewritten — removed leaked admin password and real Turso URL (commit `3c95e7d`)
- [x] `.claude/` untracked from git, added to `.gitignore` (commit `b6f1bd1`)
- [x] Repo made **public** on GitHub (needed for ruleset enforcement on free plan)
- [x] Two GitHub rulesets enforcing:
  - `Protect master`: requires PR + 1 approval, Emil bypasses, Copilot auto-review
  - `Auto Copilot review on rewrite/next`: Copilot auto-review on PRs into `rewrite/next`
- [x] GitHub Action `.github/workflows/claude-respond-to-copilot.yml` — Claude responds to Copilot PR reviews. Uses `ANTHROPIC_API_KEY` secret. (commit `6724ba7`, merged as `8e4fb4d`)

### Main session 1 work

- [ ] Scaffold Next.js 15 in place (preserving `public/`, `README.md`, `.git/`)
- [ ] `tsconfig.json` with strict settings
- [ ] Tailwind v4 config (theme tokens for Högalid brand colors from `constants/colors.js`)
- [ ] ESLint 9 flat config: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@next/eslint-plugin-next`
- [ ] Prettier 3 + `prettier-plugin-tailwindcss`
- [ ] Husky + lint-staged:
  - `pre-commit`: lint-staged (ESLint fix + Prettier write on staged files)
  - `commit-msg`: commitlint
  - `pre-push`: `tsc --noEmit && vitest run`
- [ ] Vitest + React Testing Library + jsdom config
- [ ] Playwright installed but skipped until Session 12
- [ ] GitHub Actions workflow (`.github/workflows/ci.yml`): typecheck, lint, test, build
- [ ] Sanity-check commit: empty Next.js "Hello Högalid" page renders

**End of session**: `npm run dev` shows a blank Next.js page. Hooks fire. CI is green.

---

## Session 2 — Constants, utils, types

**Goal**: port the pure, UI-free code first. No risk, builds typing confidence.

- [ ] Migrate `src/constants/*.js` → `src/constants/*.ts`
  - `colors.ts` → also generate Tailwind theme tokens
  - `exercises.ts` → typed `Exercise` union (also the source of truth for server-side point recompute — see [SEC H1])
  - `challenges.ts` → typed `BingoTile`, `DailyChallenge`, `WeeklyChallenge`
  - `avatar.ts`, `badges.ts`, `cards.ts`, `celebrations.ts`, `levels.ts`, `playerCards.ts`, `stickers.ts`
- [ ] Migrate `src/utils/*.js` → `src/utils/*.ts` (all pure — no UI):
  - `api.ts` (replaced in S3, placeholder for now)
  - `date.ts`, `levels.ts`, `stats.ts`, `challenges.ts`, `feed.ts`, `weeklyHistory.ts`, `stickers.ts`
  - `photosCache.ts`, `usersCache.ts` (may become TanStack Query hooks in S4)
- [ ] Define shared domain types in `src/types/`: `User`, `Log`, `BuddyChallenge`, `Photo`, `Invite`, `Config`
- [ ] Zod schemas in `src/schemas/` that mirror domain types (for API in S3)
- [ ] Unit tests for every util function (target: 100% coverage on utils)
- [ ] Delete old `.js` files once `.ts` versions pass tests

**End of session**: `npm run typecheck && npm test` green. No UI changes yet.

---

## Session 3 — API routes (server side) — **security-critical session**

**Goal**: move the backend off Netlify Functions onto Next.js Route Handlers, with Zod validation, real auth, and tests. This session lands most of the security fixes.

- [ ] Keep the existing Turso schema (no multi-tenant). Port `netlify/functions/db.js` → `src/server/db.ts` (singleton getter).
- [ ] Port `netlify/functions/auth.js` → `src/server/auth.ts` (PBKDF2 via Node `crypto`).
- [ ] Port `netlify/functions/buddyProgress.js` → `src/server/buddyProgress.ts`.
- [ ] **[SEC C1] Real auth**: signed httpOnly session cookie helpers (`setSessionCookie`, `getSession`, `clearSessionCookie`; SameSite=Lax, Secure in prod). Every mutating handler derives the acting alias from the cookie — never from the request body. Admin handlers verify the signed `admin` claim server-side.
- [ ] **[SEC C2] Drop plaintext passwords**: remove the `display_password` column; never return a cleartext password from the API. PBKDF2 hash only. Admins _reset_ passwords, never view them. (Matching UI removal in S10.)
- [ ] **[SEC H1] Server-authoritative points**: the logs handler **recomputes** `points` from the submitted exercises using `constants/exercises` rules and ignores any client-sent score. Clamp minutes/reps to sane maxima.
- [ ] **[SEC M1] Photo storage = Netlify Blobs**: define a `PhotoStorage` interface and ship a `NetlifyBlobsStorage` impl. Store image _bytes_ in Netlify Blobs; keep only metadata in the DB (`alias, week_start, uploaded_at, mime_type, blob_key`). Client downscales before upload (canvas → ~1280px, WebP/JPEG q≈0.8); list endpoint is paginated and returns URLs, not bytes; bytes served through an **auth-gated** route with cache headers (minors' photos must not be publicly fetchable).
- [ ] **[SEC M3/M4]** Basic rate limiting (login attempts + invite redemption); return generic error messages to clients and log details server-side.
- [ ] Create Route Handlers:
  - `app/api/users/route.ts` (+ sub-routes: `login`, `register`, `me`, `config`, `cheer`)
  - `app/api/logs/route.ts`
  - `app/api/buddy-challenges/route.ts` (+ `/accept`, `/complete`)
  - `app/api/photos/route.ts`
- [ ] All request bodies validated with Zod schemas from Session 2.
- [ ] Handler tests with Vitest (mock DB; assert status codes, response shape, **and authz** — unauthenticated and non-admin callers are rejected).
- [ ] Delete `netlify/functions/`; update `netlify.toml` (drop the functions block).

**End of session**: all API endpoints respond correctly via Vitest/`curl`; auth and admin gating verified by tests.

---

## Session 4 — App shell, routing, auth context

**Goal**: replace the manual screen dispatcher with Next.js file-based routing. Set up auth + data fetching primitives.

- [ ] Route structure:
  - `app/layout.tsx` — root layout (fonts, providers, TopBar slot)
  - `app/page.tsx` → Home (placeholder for S7)
  - `app/login/page.tsx`
  - `app/log/page.tsx`, `app/log/history/page.tsx`
  - `app/profile/page.tsx`
  - `app/challenges/page.tsx`
  - `app/bingo/page.tsx`
  - `app/cards/page.tsx`
  - `app/team/page.tsx`, `app/team/photos/page.tsx`
  - `app/admin/page.tsx`
- [ ] `middleware.ts` — redirect unauthed users to `/login` (except `/login`); the admin route additionally requires the `admin` claim.
- [ ] Providers (`src/providers/`):
  - `QueryProvider` (TanStack Query client)
  - `UserProvider` — rebuilt from `UserContext.jsx`, typed, no localStorage (cookie handles session; user data comes from `/api/users/me`)
- [ ] TanStack Query hooks in `src/hooks/`: `useMe`, `useLogs`, `useConfig`, `useBuddyChallenges`, `usePhotos`, `useAllUsers`
- [ ] Delete old `src/App.jsx`, `src/main.jsx`, `src/context/UserContext.jsx`
- [ ] Playwright smoke test: unauthed visit to `/` redirects to `/login`

**End of session**: every route returns a placeholder under the right URL. Auth redirects work.

---

## Session 5 — Common components

**Goal**: port `src/components/common/` to TSX + Tailwind. Used everywhere, so they come first. Keep existing animations (CSS/canvas) — just port them.

- [ ] `Card.tsx` — cva variants for elevation/glow
- [ ] `TopBar.tsx` — logo, user pill, logout, nav
- [ ] `ProgressBar.tsx`
- [ ] `LoadingSpinner.tsx` + skeletons (Tailwind `animate-pulse`)
- [ ] `Countdown.tsx`
- [ ] `Confetti.tsx` — keep the existing canvas implementation
- [ ] `LevelUpModal.tsx`
- [ ] `BuddyCelebration.tsx`
- [ ] `CollectorCard.tsx` — keep the existing CSS flip animation
- [ ] `PenaltyGame.tsx` — 482 lines; split into `PenaltyGame`, `Goalie`, `BallTrajectory` if it falls out naturally
- [ ] Component tests for each (render + one interaction)

**End of session**: all common components used in Next pages. No inline styles left in this folder.

---

## Session 6 — Avatar components

**Goal**: port the avatar system. Small, isolated.

- [ ] `AvatarSVG.tsx`
- [ ] `AvatarBuilder.tsx` — the 256-line customization UI
- [ ] Type the DiceBear config properly (`AvatarConfig`)
- [ ] Tests: snapshot for AvatarSVG, interaction tests for Builder category switching

---

## Session 7 — Login + Home screens

**Goal**: the two entry-point screens. Battle-tests hooks + providers end-to-end.

- [ ] `app/login/page.tsx` — port `LoginScreen.jsx` (388 lines)
  - React Hook Form + Zod for login/register form
  - Invite code validation
  - Avatar shuffle on register
  - Login/register sets the session cookie → redirects
- [ ] `app/page.tsx` — port `HomeScreen.jsx` (1285 lines)
  - Extract: `IntroCarousel`, `DailyChallengeCard`, `WeeklyChallengeCard`, `StatTile`, `CountdownBanner`
  - Eliminate all inline styles
- [ ] Playwright: login flow, home renders for authed user

**End of session**: you can register, log in, and see your home screen in the new app.

---

## Session 8 — Log + Profile + Challenges screens

**Goal**: the three medium-heavy screens.

- [ ] `app/log/page.tsx` ← `LogScreen.jsx` (905)
  - Extract: `ExerciseInput`, `ActivityInput`, `LogEditor`
  - Optimistic updates via TanStack Query mutations
- [ ] `app/log/history/page.tsx` ← `LogHistoryScreen.jsx` (144)
- [ ] `app/profile/page.tsx` ← `ProfileScreen.jsx` (808)
  - Extract: `AvatarSection`, `StatsSection`, `StickerShelf`, `BadgeShelf`
- [ ] `app/challenges/page.tsx` ← `ChallengesScreen.jsx` (1179)
  - Extract: `BuddyChallengeList`, `QuickChallengeGenerator`, `ChallengeForm`
- [ ] Component + integration tests for each

---

## Session 9 — Bingo + Cards screens

- [ ] `app/bingo/page.tsx` ← `BingoScreen.jsx` (1176) — multiple bingo grids
- [ ] `app/cards/page.tsx` ← `CardsScreen.jsx` (774) — pack shop + gallery
- [ ] Extract reusable grid/cell components

---

## Session 10 — Team + Photos + Admin

- [ ] `app/team/page.tsx` ← `TeamScreen.jsx` (994) — leaderboard + feed + cheers
- [ ] `app/team/photos/page.tsx` ← `PhotoAlbumScreen.jsx` (880) — upload + gallery (use Next `Image`; uploads downscale client-side per [SEC M1])
- [ ] `app/admin/page.tsx` ← `AdminScreen.jsx` (606)
  - **[SEC C1]** Protected by middleware **and** a server-side `admin`-claim check in every admin Route Handler (reset season, delete user, reset password, invites, season/countdown dates) — never by the client alone.
  - **[SEC C2]** Do **not** port the "Visa lösenord" (show-password) feature — the plaintext column is gone. Admins can reset a password (new PBKDF2 hash) but never view existing ones.
- [ ] Convert all `/public/spelarbilder/*.jpg` loads to Next `Image`

---

## Session 11 — Accessibility & QA pass

**Goal**: a light, time-boxed correctness pass before launch (no animation rewrites, no server-component refactor).

- [ ] `jsx-a11y` lint sweep: fix labels, roles, focus management
- [ ] Keyboard navigation pass on the main flows
- [ ] Quick cross-device check (mobile viewport, since the app is phone-first)
- [ ] Fix any bugs surfaced during the port (track them as `fix:` commits)

---

## Session 12 — E2E tests, CI, launch

**Goal**: verify the critical flows and ship.

- [ ] Playwright E2E suite covering:
  - Register → login → log exercise → see stats update
  - Start buddy challenge → accept → complete → level up
  - Upload photo → see in album
  - Admin generates invite → new user registers with it
- [ ] CI: cache deps, run typecheck/lint/test/build, upload coverage
- [ ] `README.md` rewrite: setup, scripts, architecture, deployment
- [ ] `CONTRIBUTING.md`: commit conventions, branch strategy
- [ ] **Pre-launch DB**: rotate the Turso token; run "Nollställ säsong" to clear test data; set season start + countdown date
- [ ] Merge `rewrite/next` → `master`, deploy, smoke-test production

---

## Risk register

| Risk                                                     | Mitigation                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **8-day deadline vs. full rewrite**                      | Scope frozen to port + security + bugs (no new features). Sessions are independent; if time runs short, the app is shippable after S10 + S12 essentials |
| Turso schema drift during migration                      | Route handlers read/write the same tables as the old functions — no schema changes beyond dropping `display_password`                                  |
| Session 8/9 screens bigger than expected                 | Each screen is a self-contained session — can slip into the next without blocking anything else                                                        |
| Inline-style → Tailwind conversion misses dynamic styles | Keep `style={{...}}` only for truly computed values (e.g. `transform: translateX(${px})`). Grep for remaining inline styles at the end of each session |
| Tailwind v4 is new; plugins may lag                      | Pin versions; prettier-plugin-tailwindcss v0.6+ supports v4                                                                                            |

---

## Progress log

_Add a line here at the end of every session._

- **2026-04-22** — Plan written. Decisions resolved (Netlify, `rewrite/next`, custom cookie auth).
- **2026-04-26** — Pre-S1 cleanup: README rewrite (removed leaked admin pw + real Turso URL), `.claude/` untracked, repo public, two rulesets enforcing, `claude-respond-to-copilot.yml` wired up. Ready to start main S1 work.
- **2026-05-29** — Security review of live `master` + production Turso DB (findings in local, gitignored `SHIP_REVIEW.md`). Confirmed `master` not live with real players → all fixes land in the rewrite. Folded gaps in as `[SEC …]` tasks. Action for Emil: rotate the Turso token.
- **2026-05-30** — **Scope frozen for an 8-day launch (target 2026-06-07): stack upgrade + security + bugs only, no new features.** Removed from plan: multi-tenant future-proofing (teams/memberships/email/TeamConfig), Sentry, Commitizen + commit-banner script, Framer Motion rewrites (keep existing animations), Storybook, server-component optimization, Lighthouse-90/dark-mode. Admin model simplified to single env-var admin with a signed cookie claim (was `team_memberships.role`). S11 reduced to an a11y/QA pass; S12 now includes the pre-launch DB steps. Still pre-S1.

---

## How to resume work between sessions

Each new Claude Code session starts with **zero memory** of prior conversations. To pick up cleanly:

1. **Be on the right branch**: most session work happens on `rewrite/next-sN-<topic>` branched off `rewrite/next`. Check `git branch` first.
2. **Tell Claude**: `"Read PLAN.md and continue from where we left off. Use the conventions in the plan exactly."`
3. **For a fresh session number**: `"Read PLAN.md and start Session N. Follow the branching convention (branch off rewrite/next as rewrite/next-sN-<topic>)."`
4. **Update the Progress log** at the end of every session before stopping.
