# Hogalid Summer — Migration Plan

Full rewrite from **React + Vite + JS + inline styles + Netlify Functions**
to **Next.js 15 (App Router) + TypeScript + Tailwind v4 + Route Handlers**, with
modern tooling, tests, and a polished commit workflow.

Each session below is scoped to roughly one working session. Check off items as we go.
Keep this file updated at the end of every session — it is the source of truth for
where we are.

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

## Target stack (to be confirmed — see "Open questions" below)

| Area | Pick | Why |
|---|---|---|
| Framework | **Next.js 15, App Router** | Modern default, SSR + route handlers, file-based routing |
| Language | **TypeScript (strict)** | Catch bugs at compile time, self-documenting code |
| Styling | **Tailwind v4** | Already in use, great with Next.js |
| Class helpers | **clsx + tailwind-merge** (via `cn()`) | Standard pattern for conditional classes |
| Component variants | **cva** (class-variance-authority) | Typed variants for Card, Button, etc. |
| Server state / cache | **TanStack Query v5** | Replaces ad-hoc `fetch` + manual caches |
| Forms | **React Hook Form + Zod** | Best-in-class, shared schemas with API |
| Validation (runtime) | **Zod** | Request/response validation on API routes, single source of truth |
| Animations | **Framer Motion** | Replaces `@keyframes` inline + manual transitions |
| Icons | **lucide-react** (keep) | Already used |
| Avatar | **@dicebear** (keep) | Already used |
| DB client | **@libsql/client** (keep) | Already used, Turso-compatible |
| Auth | **httpOnly cookies + PBKDF2** | Replace `localStorage` — fixes XSS risk |
| Linting | **ESLint 9 (flat config) + typescript-eslint + eslint-plugin-react** | Modern flat config |
| Formatting | **Prettier 3 + prettier-plugin-tailwindcss** | Auto-sorts Tailwind classes |
| Git hooks | **Husky + lint-staged + commitlint** | Conventional Commits enforced |
| Commit UX | **Commitizen + custom Node script** | Interactive prompts + colorful commit summary |
| Unit/component tests | **Vitest + React Testing Library** | Fast, Vite-compatible |
| E2E tests | **Playwright** | Standard for Next.js |
| CI | **GitHub Actions** | Typecheck, lint, test, build on PR |
| Errors | **Sentry** | Cheap now, painful to retrofit across tenants later |
| Deployment | **Netlify** (via `@netlify/plugin-nextjs`) | Confirmed |

---

## Resolved decisions

1. **Deployment**: **Netlify** (keep). Next.js runs via `@netlify/plugin-nextjs`.
2. **Rewrite strategy**: **in-place on branch `rewrite/next`**. Git history is our safety net.
3. **Auth**: **custom httpOnly signed cookie + PBKDF2**. Not `next-auth` / Auth.js yet — the current alias+password scheme doesn't map cleanly to it, and custom cookie auth is ~100 lines. We keep the option to migrate to Auth.js later when OAuth / magic links become a requirement (see "Future: multi-tenant" below).
4. **API**: Next.js **Route Handlers** (`app/api/*/route.ts`) replace Netlify Functions. Netlify still deploys them.
5. **Screen splitting**: extract sub-components where it's natural (`<ChallengeCard>`, `<StatTile>`). No over-engineering.
6. **Server vs Client Components**: start everything client-side during migration. Move static pieces to server components in the Session 11 polish pass.

---

## Future: multi-tenant ("any football team can apply")

This is not being built now, but **several decisions change shape** if we don't think about it today:

### What we change now (cheap future-proofing)

- **DB schema in Session 3**: add a `teams` table and a `team_id` foreign key on every domain table (`users`, `logs`, `buddy_challenges`, `album_photos`, `invites`, `config`, `bingo`, `weekly_results`, `cheers`). Seed it with one row (`hogalid-f15`) and hardcode that ID via env var `DEFAULT_TEAM_ID` for now. When we add team-signup later, we just remove the hardcode.
- **`isAdmin` → `team_memberships.role`**: replace the global admin flag with a join table `team_memberships (user_id, team_id, role)` where role ∈ `player | coach | admin`. Single-team today, multi-team tomorrow, same schema.
- **No hardcoded "hogalid" in code**: move team name, logo path, brand colors to a `TeamConfig` record loaded from DB. The app reads it at boot. Today there's one record; tomorrow there are many.
- **Env var naming**: `TURSO_URL` stays generic (good). Avoid anything named `HOGALID_*`.
- **Users keyed by email (not alias)**: current auth is `alias + password`. For multi-tenant we need email for password reset / invite flow. Add `email` as a nullable column in Session 3, keep `alias` as display handle, and make email required in a future migration. Log in still works by alias for now.
- **File storage escape hatch**: photos are stored as base64 blobs in SQLite today. That breaks fast at multi-team scale (~10 MB per photo × N teams). Flag it, don't fix it now — but isolate `photos.ts` behind a `PhotoStorage` interface so swapping to R2 / UploadThing / S3 later is a one-file change.
- **Sentry from day one**: errors across many tenants are painful to debug without it. Cheap to add now.

### What we don't build now

- Team-signup flow, team-admin UI, onboarding wizard
- Subdomain / path-based tenant routing (`/[teamSlug]/...`)
- i18n (app stays Swedish; `next-intl` when the time comes)
- Email (password reset, invite emails) — **Resend** is the pick when we need it
- Billing — **Stripe** when we need it
- Per-team theming beyond `TeamConfig` (brand color + logo is enough for now)
- Turso's multi-DB-per-tenant pattern. Start with one DB, all teams inside. Revisit if scale demands.

### Stack additions for multi-tenant future (not installed yet)

| Need | Pick (future) |
|---|---|
| Email | Resend |
| Object storage | Cloudflare R2 or UploadThing |
| OAuth / magic links | Auth.js (migrate from custom cookie auth) |
| i18n | next-intl |
| Billing | Stripe |
| Errors | **Sentry (install in Session 1)** |
| Analytics | PostHog (when we care) |

---

## Conventions & ground rules

- **Commit style**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `style:`, `ci:`). Enforced by commitlint.
- **Branch**: all migration work on `rewrite/next`. Merge to `main` only when Session 12 passes.
- **No patches on old code**: we're rewriting, not porting. If a component needs a different shape to be idiomatic in Next + TS + Tailwind, change the shape.
- **Delete, don't comment out**. Git remembers.
- **No back-compat shims**. The old app goes away.
- **Type strictness**: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`. No `any` without a comment explaining why.
- **Styling**: zero inline `style={{...}}` objects in the final code, except for truly dynamic values (computed transforms, animated positions). Everything else is Tailwind.
- **Tests**: every utility function gets unit tests; every API route gets a handler test; critical user flows get Playwright E2E.

---

# Sessions

## Session 1 — Planning & foundation **(this session)**

**Goal**: lock in decisions, scaffold the new project, wire up tooling so every future commit is linted/formatted/tested.

- [x] Plan written, open questions resolved (Netlify, `rewrite/next` branch, custom cookie auth)
- [ ] Create branch `rewrite/next`
- [ ] Scaffold Next.js 15 in place (preserving `public/`, `README.md`, `.git/`)
- [ ] `tsconfig.json` with strict settings
- [ ] Tailwind v4 config (theme tokens for Högalid brand colors from `constants/colors.js`)
- [ ] ESLint 9 flat config: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@next/eslint-plugin-next`
- [ ] Prettier 3 + `prettier-plugin-tailwindcss`
- [ ] Husky + lint-staged:
  - `pre-commit`: lint-staged (ESLint fix + Prettier write on staged files)
  - `commit-msg`: commitlint
  - `pre-push`: `tsc --noEmit && vitest run`
- [ ] Commitizen config (conventional-changelog)
- [ ] **Fancy commit script** (`scripts/commit-banner.mjs`):
  - Runs on `post-commit`
  - Prints colored ASCII banner with:
    - Commit hash + conventional-commit type
    - Files changed / lines +/−
    - Test coverage delta (if tests ran)
    - Branch + ahead/behind remote
    - Random Högalid-themed emoji based on commit type
- [ ] Vitest + React Testing Library + jsdom config
- [ ] Playwright installed but skipped until Session 12
- [ ] GitHub Actions workflow (`.github/workflows/ci.yml`): typecheck, lint, test, build
- [ ] Sentry SDK wired up (client + server), DSN from env, disabled locally
- [ ] Sanity-check commit: empty Next.js "Hello Högalid" page renders

**End of session**: `npm run dev` shows a blank Next.js page. Hooks fire. CI is green.

---

## Session 2 — Constants, utils, types

**Goal**: port the pure, UI-free code first. No risk, builds typing confidence.

- [ ] Migrate `src/constants/*.js` → `src/constants/*.ts`
  - `colors.ts` → also generate Tailwind theme tokens
  - `exercises.ts` → typed `Exercise` union
  - `challenges.ts` → typed `BingoTile`, `DailyChallenge`, `WeeklyChallenge`
  - `avatar.ts`, `badges.ts`, `cards.ts`, `celebrations.ts`, `levels.ts`, `playerCards.ts`, `stickers.ts`
- [ ] Migrate `src/utils/*.js` → `src/utils/*.ts` (all pure — no UI):
  - `api.ts` (will be replaced in S3, placeholder for now)
  - `date.ts`, `levels.ts`, `stats.ts`, `challenges.ts`, `feed.ts`, `weeklyHistory.ts`, `stickers.ts`
  - `photosCache.ts`, `usersCache.ts` (may become TanStack Query hooks in S4)
- [ ] Define shared domain types in `src/types/`: `User`, `Log`, `BuddyChallenge`, `Photo`, `Invite`, `Config`
- [ ] Zod schemas in `src/schemas/` that mirror domain types (for API in S3)
- [ ] Unit tests for every util function (target: 100% coverage on utils)
- [ ] Delete old `.js` files once `.ts` versions pass tests

**End of session**: `npm run typecheck && npm test` green. No UI changes yet.

---

## Session 3 — API routes (server side)

**Goal**: move backend off Netlify Functions onto Next.js Route Handlers, with Zod validation and tests.

- [ ] **Multi-tenant-aware schema migration**: add `teams` table + `team_memberships (user_id, team_id, role)` + `team_id` FK on all domain tables. Seed one row for Högalid F15, hardcode its ID behind `DEFAULT_TEAM_ID` env var. Move the global `isAdmin` flag onto `team_memberships.role`.
- [ ] Add nullable `email` column on `users` (for future password-reset / multi-team invites)
- [ ] Wrap photo storage behind a `PhotoStorage` interface so the base64-in-DB impl can be swapped for R2 / S3 later without touching callers
- [ ] Port `netlify/functions/db.js` → `src/server/db.ts` (singleton getter)
- [ ] Port `netlify/functions/auth.js` → `src/server/auth.ts` (PBKDF2 via Node `crypto`)
- [ ] Port `netlify/functions/buddyProgress.js` → `src/server/buddyProgress.ts`
- [ ] Create Route Handlers:
  - `app/api/users/route.ts` (split into sub-routes where cleaner: `app/api/users/login/route.ts`, `.../register/route.ts`, `.../config/route.ts`, `.../cheer/route.ts`)
  - `app/api/logs/route.ts`
  - `app/api/buddy-challenges/route.ts` (+ `/accept`, `/complete`)
  - `app/api/photos/route.ts`
- [ ] All request bodies validated with Zod schemas from Session 2
- [ ] Session cookie helpers: `setSessionCookie`, `getSession`, `clearSessionCookie` (httpOnly, SameSite=Lax, Secure in prod)
- [ ] Handler tests with Vitest (mock DB, assert status codes + response shape)
- [ ] Delete `netlify/functions/` directory
- [ ] Update `netlify.toml` — drop the functions block

**End of session**: all API endpoints respond correctly via `curl`/Vitest. Old app still deployable from `main`; new API only works on `rewrite/next`.

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
- [ ] `middleware.ts` — redirect unauthed users to `/login` (except `/login` itself)
- [ ] Providers (`src/providers/`):
  - `QueryProvider` (TanStack Query client)
  - `UserProvider` — rebuilt from `UserContext.jsx`, typed, no localStorage (cookie handles session; user data comes from `/api/users/me`)
- [ ] TanStack Query hooks in `src/hooks/`: `useMe`, `useLogs`, `useConfig`, `useBuddyChallenges`, `usePhotos`, `useAllUsers`
- [ ] Delete old `src/App.jsx`, `src/main.jsx`, `src/context/UserContext.jsx`
- [ ] Playwright smoke test: unauthed visit to `/` redirects to `/login`

**End of session**: every route returns a placeholder page under the right URL. Auth redirects work. Data hooks defined but unused.

---

## Session 5 — Common components

**Goal**: port `src/components/common/` to TSX + Tailwind. These are used everywhere, so they come first.

- [ ] `Card.tsx` — cva variants for elevation/glow
- [ ] `TopBar.tsx` — logo, user pill, logout, nav
- [ ] `ProgressBar.tsx`
- [ ] `LoadingSpinner.tsx` + skeletons (use Tailwind's `animate-pulse` instead of `@keyframes`)
- [ ] `Countdown.tsx`
- [ ] `Confetti.tsx` — keep canvas or replace with Framer Motion?
- [ ] `LevelUpModal.tsx`
- [ ] `BuddyCelebration.tsx`
- [ ] `CollectorCard.tsx` — flip animation via Framer Motion
- [ ] `PenaltyGame.tsx` — 482 lines, will likely split into `PenaltyGame`, `Goalie`, `BallTrajectory` sub-components
- [ ] Component tests for each (render + one interaction)
- [ ] Storybook? — **skip for now**, revisit if we feel the need in S11

**End of session**: all common components used in Next pages. No inline styles left in this folder.

---

## Session 6 — Avatar components

**Goal**: port the avatar system. Small, isolated, good practice session.

- [ ] `AvatarSVG.tsx`
- [ ] `AvatarBuilder.tsx` — the 256-line customization UI
- [ ] Type the DiceBear config properly (`AvatarConfig`)
- [ ] Tests: snapshot test for AvatarSVG, interaction tests for Builder category switching

---

## Session 7 — Login + Home screens

**Goal**: the two entry-point screens. Also battle-tests our hooks + providers end-to-end.

- [ ] `app/login/page.tsx` — port `LoginScreen.jsx` (388 lines)
  - React Hook Form + Zod for login/register form
  - Invite code validation
  - Avatar shuffle on register
  - Uses `useMe` mutation hook → sets cookie → redirects
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
- [ ] `app/team/photos/page.tsx` ← `PhotoAlbumScreen.jsx` (880) — upload + gallery (use Next `Image`)
- [ ] `app/admin/page.tsx` ← `AdminScreen.jsx` (606) — protected by middleware + server-side admin check
- [ ] Convert all `/public/spelarbilder/*.jpg` loads to Next `Image`

---

## Session 11 — Polish, animations, server components

**Goal**: move what can be server-rendered to server components. Replace custom animations with Framer Motion. Accessibility pass.

- [ ] Identify static/server-renderable sections in Home, Team, Admin → convert
- [ ] Migrate custom `@keyframes` and manual `requestAnimationFrame` to Framer Motion where it simplifies code
- [ ] `jsx-a11y` lint sweep: fix labels, roles, focus management
- [ ] Keyboard navigation pass
- [ ] Dark mode? — **out of scope** unless you ask for it
- [ ] Lighthouse audit: aim for 90+ on all categories

---

## Session 12 — E2E tests, CI polish, commit UX finish

**Goal**: wrap up. Make the repo shine.

- [ ] Playwright E2E suite covering:
  - Register → login → log exercise → see stats update
  - Start buddy challenge → accept → complete → level up
  - Upload photo → see in album
  - Admin generates invite → new user registers with it
- [ ] CI: matrix over Node 20/22, cache deps, upload coverage
- [ ] Flesh out the `commit-banner.mjs` from Session 1:
  - Detailed diff stats with color
  - Test coverage delta since last commit
  - Bundle-size delta for `app/` (via `next build` stats)
  - Fun Högalid-themed flair per commit type
- [ ] `README.md` rewrite: setup, scripts, architecture, deployment
- [ ] `CONTRIBUTING.md`: commit conventions, branch strategy
- [ ] Merge `rewrite/next` → `main`, deploy, smoke-test production

---

## Risk register

| Risk | Mitigation |
|---|---|
| Turso schema drift during migration | API routes read/write the same tables as old functions — no schema changes until the rewrite ships |
| Users logged out mid-deploy | Issue a one-time migration endpoint that accepts old `localStorage` session and issues a cookie |
| Session 8/9 screens bigger than expected | Each screen is a self-contained session — can slip one over into the next without blocking anything else |
| Inline-style → Tailwind conversion misses dynamic styles | Keep `style={{...}}` only for truly computed values (e.g. `transform: translateX(${px})`). Grep for remaining inline styles at the end of each session |
| Tailwind v4 is new; plugins may lag | Pin versions; prettier-plugin-tailwindcss v0.6+ supports v4 |

---

## Progress log

_Add a line here at the end of every session._

- **2026-04-22** — Plan written. Open questions resolved (Netlify, `rewrite/next`, custom cookie auth). Multi-tenant forward-compat folded into Sessions 1 & 3.
