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
| Errors               | **Sentry**                                                           | Surface production errors fast — directly serves "no issues"      |
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

- [x] Scaffold Next.js 15 in place (preserving `public/`, `README.md`, `.git/`); removed `index.html` + `vite.config.js`
- [x] `tsconfig.json` with strict settings (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- [x] Tailwind v4 config via `@theme` in `app/globals.css` (Högalid brand tokens from `constants/colors.js`)
- [x] ESLint 9 flat config (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@next/eslint-plugin-next`); ignores the old Vite app + build artifacts
- [x] Prettier 3 + `prettier-plugin-tailwindcss`
- [x] Husky + lint-staged:
  - `pre-commit`: lint-staged (ESLint fix + Prettier write on staged files)
  - `commit-msg`: commitlint
  - `pre-push`: `tsc --noEmit && vitest run`
- [x] Vitest + React Testing Library + jsdom config (with `cn()` util + tests)
- [x] Playwright installed but skipped until Session 12
- [x] GitHub Actions workflow (`.github/workflows/ci.yml`): typecheck, lint, test, build
- [x] Sentry SDK wired up (`@sentry/nextjs`, client/server/edge + `global-error.tsx`), DSN from env, inert without it. _(Emil: create the Sentry project + add `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` to Netlify env.)_
- [x] Sanity-check: `/` "Hello Högalid" page builds and prerenders

**End of session**: ✅ `npm run typecheck`, `lint`, `test`, and `build` all pass. Hooks fire on commit. Netlify config switched to `@netlify/plugin-nextjs`.

---

## Session 2 — Constants, utils, types

**Goal**: port the pure, UI-free code first. No risk, builds typing confidence.

- [x] Migrate `src/constants/*.js` → `src/constants/*.ts` (all: colors, exercises, levels, challenges, avatar, badges, cards, celebrations, playerCards, stickers + barrel)
  - Tailwind theme tokens already live in `app/globals.css` (`@theme`, S1)
- [x] Migrate `src/utils/*.js` → `src/utils/*.ts` (api, date, levels, stats, challenges, feed, weeklyHistory, stickers, usersCache, photosCache + barrel). `api.ts` rewritten as generic typed `fetch` helpers (Route Handlers in S3).
- [x] Define shared domain types in `src/types/` (`User`, `Log`, `Exercise`, `Level`, `BingoTile`, `Stats`, `Badge`, `Card`, `FeedEvent`, …). `BuddyChallenge`/`Invite`/`Config` deferred to S3 where the server defines them.
- [x] Zod schemas in `src/schemas/` — initial log/login input schemas (expanded in S3)
- [x] Unit tests for the pure utils (date, levels, challenges, stats — 21 tests). Broader coverage grows alongside S3+.
- [x] Delete old `.js` files (constants + utils are now 100% TS; components stay `.jsx` until their session)

**End of session**: ✅ `npm run typecheck`, `lint`, `test` (21), and `build` all pass. No UI changes yet.

---

## Session 3 — API routes (server side) — **security-critical session** ✅

**Goal**: move the backend off Netlify Functions onto Next.js Route Handlers, with Zod validation, real auth, and tests. This session lands most of the security fixes.

- [x] Keep the existing Turso schema (no multi-tenant). Port `netlify/functions/db.js` → `src/server/db.ts` (memoized singleton + idempotent `initDb`).
- [x] Port `netlify/functions/auth.js` → `src/server/auth.ts` (PBKDF2-SHA256 via Node `crypto`, timing-safe verify).
- [x] Port `netlify/functions/buddyProgress.js` → `src/server/buddyProgress.ts` (typed; also `buddyChallenges.ts` for row mapping + baseline snapshot).
- [x] **[SEC C1] Real auth**: signed httpOnly session cookie (`src/server/session.ts` — HMAC-SHA256 via Web Crypto so it stays edge-portable for S4 middleware; SameSite=Lax, Secure in prod). `requireUser`/`requireAdmin` guards. Every mutating handler derives the acting alias from the cookie — never from the body. Admin handlers verify the signed `admin` claim server-side.
- [x] **[SEC C2] Drop plaintext passwords**: `display_password` column gone from `initDb`; never read/written. PBKDF2 hash only; admin reset stores a new hash, never the cleartext (verified by a test). (Matching UI removal still in S10.)
- [x] **[SEC H1] Server-authoritative points** (`src/server/points.ts`): the logs handler **recomputes** `points`/`minutes` from clamped exercises and ignores any client score (the schema doesn't even accept one). Exercise values clamped to per-exercise maxima; summer activities clamped; penalty score clamped 0..10. Bingo/daily bonus logs are created **server-side** from constants; the bingo line-bonus is accepted but hard-clamped (`MAX_LINE_BONUS`) — TODO(S9) to port the full line engine. Bingo/daily completion is idempotent (replays award nothing).
- [x] **[SEC M1] Photo storage = Netlify Blobs**: `PhotoStorage` interface + `NetlifyBlobsStorage` impl (`src/server/photoStorage.ts`). Bytes in Blobs; DB keeps metadata + `blob_key`. List endpoint paginated (`limit`/`offset`), returns `url`s not bytes; bytes served through the **auth-gated** `app/api/photos/[id]` route with `Cache-Control: private`. (Client-side downscale lands with the PhotoAlbum screen in S10.)
- [x] **[SEC M3/M4]** In-memory rate limiting (`src/server/rateLimit.ts`) on login, register/invite redemption, and invite validation; generic `{ error: code }` client messages with full detail logged server-side (`src/server/responses.ts` `handle` wrapper + `ApiError`).
- [x] Create Route Handlers (22 total): `auth/{login,register,logout,me}`, `users` + `users/display-name` + `users/secret-progress`, `config`, `logs`, `bingo`, `daily`, `cheers`, `reactions`, `weekly-results`, `buddy-challenges` (+ `/respond`, `/cancel`), `photos` (+ `/[id]`), `invites` (+ `/validate`), `admin` (dispatch route for all privileged actions).
- [x] All request bodies validated with Zod schemas (`src/schemas` expanded to ~20 schemas).
- [x] Handler tests with Vitest (mock DB + injected fake blob storage): 66 tests — session signing, server-side points/clamps, auth, **authz** (unauthenticated → 401, non-admin → 403, can't edit/delete another user's log), photo upload + auth-gated bytes, admin gating, no-plaintext-password on reset.
- [x] Deleted `netlify/functions/`; `netlify.toml` had no functions block to drop (functions were auto-detected from the now-removed directory). `src/utils/api.ts` base switched to `/api`.

**End of session**: ✅ typecheck, lint, test (66), and build all pass. All 22 endpoints build as dynamic route handlers; auth and admin gating verified by tests.

---

## Session 4 — App shell, routing, auth context ✅

**Goal**: replace the manual screen dispatcher with Next.js file-based routing. Set up auth + data fetching primitives.

- [x] Route structure — `app/layout.tsx` (providers + TopBar slot), and pages for `/`, `/login`, `/log`, `/log/history`, `/profile`, `/challenges`, `/bingo`, `/cards`, `/team`, `/team/photos`, `/admin`. All real screens are `<PlaceholderScreen>` stand-ins (shared `src/components/PlaceholderScreen.tsx` with session display + nav) until their porting session; `/login` is its own placeholder (form in S7).
- [x] `middleware.ts` — edge guard: unauthed → `/login` (except `/login`, which bounces authed users to `/`); `/admin` requires the signed `admin` claim. Verifies the cookie via `verifySessionValue` (Web Crypto, edge-safe). Matcher excludes `/api`, `_next`, and static files.
- [x] Providers (`src/providers/`): `QueryProvider` (TanStack Query client, one per session) + `UserProvider` (typed rebuild of `UserContext.jsx`, **no localStorage** — session from the httpOnly cookie via `/api/auth/me`; exposes `user`/`isAdmin`/`isAuthenticated`/`refresh`/`logout`). Composed in `src/providers/index.tsx`.
- [x] TanStack Query hooks (`src/hooks/`): `useMe`, `useConfig`, `useAllUsers`, `useBuddyChallenges`, `usePhotos`, `useLogs` (selector over `useMe`). Added shared client types `Config`, `BuddyChallenge`, `PhotosPage`, `Me` and reshaped `Photo` (no inlined bytes → `url`).
- [x] Deleted old `src/App.jsx`, `src/main.jsx`, `src/context/UserContext.jsx`.
- [x] Auth-redirect tests: fast **vitest** `middleware.test.ts` (6 cases — unauthed→/login, authed→away from /login, non-admin blocked from /admin, admin allowed) + a **Playwright** `e2e/auth.spec.ts` smoke test for S12.

**End of session**: ✅ every route renders a placeholder under the right URL; middleware auth redirects verified. typecheck + lint + test (72) + build all green; middleware registered in the build.

---

## Session 5 — Common components ✅

**Goal**: port `src/components/common/` to TSX + Tailwind. Used everywhere, so they come first. Keep existing animations (CSS/canvas) — just port them.

- [x] `Card.tsx` — cva variants (`elevation`/`glow`/`interactive`); keyboard-activatable when clickable.
- [x] `TopBar.tsx` — logo (Link home), user pill, logout — driven by `useUser` (no props).
- [x] `ProgressBar.tsx` — `role="progressbar"` + aria values; dynamic fill stays inline.
- [x] `LoadingSpinner.tsx` + `SkeletonBar`/`TopLoadingBar`/`ButtonLoader` (animations moved to `globals.css`).
- [x] `Countdown.tsx` — now reads the target from `useConfig` (was `UserContext`).
- [x] `Confetti.tsx` — kept the DOM/CSS-keyframe implementation (per-piece timing via CSS vars).
- [x] `LevelUpModal.tsx` + `BuddyCelebration.tsx` — focus-safe backdrop (close on direct click / Escape), `role="dialog"`.
- [x] `CollectorCard.tsx` — `CardFront`/`CardBack`; size-scaled dimensions stay inline (genuinely dynamic).
- [x] `PenaltyGame.tsx` — ported with the goal/keeper as an internal `GoalNet` (the natural "Goalie" split); no separate BallTrajectory — there isn't one.
- [x] Component tests for each (render + interaction): 23 new tests.
- [x] Fonts (Fredoka One + Nunito) + shared keyframes/animation utilities added to `globals.css`; brand `--font-*` tokens.
- [x] `PlaceholderScreen` now uses `TopBar` + `Card` so the components are exercised in real pages.

**End of session**: ✅ common components ported, used in pages, and tested. Inline styles remain only for genuinely dynamic values (progress fill, confetti timing, size-scaled cards, keeper transform). typecheck + lint + test (92) + build all green.

---

## Session 6 — Avatar components ✅

**Goal**: port the avatar system. Small, isolated.

- [x] `AvatarSVG.tsx` — typed; imports `adventurer` from `@dicebear/collection` (the old `@dicebear/adventurer` package isn't a dep). DiceBear's literal-union option fields are asserted once via a documented cast.
- [x] `AvatarBuilder.tsx` — ported to TSX + Tailwind; internal `AvatarPreviewButton`/`ColorButton`/`NoneButton`; tabs + starter/unlocked option grids; `compact` mode.
- [x] DiceBear config typed via the existing `AvatarConfig` (`Record<string, string | null>`).
- [x] Tests: AvatarSVG renders an SVG data-URI; AvatarBuilder category switching + option/none selection (3 tests).

---

## Session 7 — Login + Home screens

**Goal**: the two entry-point screens. Battle-tests hooks + providers end-to-end.

- [x] `app/login/page.tsx` — ported `LoginScreen.jsx` → TSX + Tailwind
  - [x] React Hook Form + Zod for the login/register form
  - [x] Invite code/token validation via `/api/invites/validate` (token read from `?invite=` on mount)
  - [x] Avatar shuffle on register (`AvatarBuilder` + `randomAvatarConfig`)
  - [x] Login/register POST the new cookie endpoints → invalidate `['me']` → redirect home
  - [x] Page test (login posts to `/auth/login`; register gated on invite)
- [x] `app/page.tsx` — port `HomeScreen.jsx` (1285 lines) **(S7b ✅)**
  - [x] Extracted into `src/components/home/`: `IntroCarousel`, `CheerToast`, `NewsTicker`, `ActionNudge`, `ChallengesWidget` (daily+weekly), `BuddyWidget`, `LastWeekResult`, `StatTiles` (streak + points/coins), `CollectorCardsCta`
  - [x] All inline styles eliminated except genuinely-dynamic ones (per-ball `animationDelay`, nudge tint from `nudge.color`, ticker duration from item count); shared keyframes (`fire-glow`, `ticker`, `cheer-*`) moved to `globals.css`
  - [x] New primitives: `useStats` (computeStats over `useMe`), `useCheers` (pending-cheers query + `markSeen`/`sendCheer` mutations), `computeCoins` util (points − pack costs, with tests); nav via `useRouter` (`/challenges?target=`, `/team?feed=open`)
  - [x] Data via hooks: `useUser`/`useStats`/`useConfig`/`useAllUsers`/`usePhotos`/`useBuddyChallenges`/`useCheers` (replaces the old localStorage stale-while-revalidate caches); admin landing on `/` redirects to `/admin`
  - [x] Page test (greets user, Dagbok → `/log`, bingo progress) — 3 tests
- [ ] Playwright: login flow, home renders for authed user _(deferred to S12 E2E suite)_

**End of session (S7 ✅)**: you can register, log in, and land on a fully-ported HomeScreen in the new app. **Next: Session 8 (Log + Profile + Challenges screens).**

---

## Session 8 — Log + Profile + Challenges screens

**Goal**: the three medium-heavy screens.

- [x] `app/log/page.tsx` ← `LogScreen.jsx` (905) **(S8a ✅)**
  - [x] Extracted to `src/components/log/`: `WeekCalendar`, `ExerciseInput`, `ActivityInput`, `SaveSummary`
  - [x] `useLogMutations` hook (save/edit/delete log + penalty + secret-progress) via `/logs` + `PUT /auth/me` (highscores) + `/users/secret-progress`. Invalidate-on-success rather than naive optimism — points are recomputed server-side (SEC H1), so an optimistic patch would flash the wrong score; the screen shows its own instant save summary for perceived speed.
  - [x] Ported faithfully: week date-picker, threshold validation, 37-skott penalty Easter egg, scroll-aware sticky save button, save-summary overlay (+ level-up). Inline styles only for per-exercise colors + animation delays.
- [x] `app/log/history/page.tsx` ← `LogHistoryScreen.jsx` (144) **(S8d ✅)** — list + edit/delete via `useLogMutations`; edit now preserves summer-activity values (the old screen zeroed them — minor bug fix)
- [x] `app/profile/page.tsx` ← `ProfileScreen.jsx` (808) **(S8b ✅)**
  - [x] Extracted to `src/components/profile/`: `ProfileHeader` (avatar + inline name edit + level/progress), `AvatarTab` (builder + point-gated reward bundles w/ arch preview), `StickersTab`, `BadgesTab`, `StatsTab`
  - [x] `useProfileMutations` (avatar + unlocks via `PUT /auth/me`, display name via `/users/display-name`); unlocks are point-threshold gated (not coin-spending). Inner `ProfileContent` mounts only with a real user.
- [x] `app/challenges/page.tsx` ← `ChallengesScreen.jsx` (1179) **(S8c ✅)**
  - [x] Extracted to `src/components/challenges/`: `DailySection`, `WeeklySection` (10-level ladder), `BuddySection` (orchestrator) + `QuickChallenge`, `ChallengeForm`, `BuddyChallengeList`
  - [x] `useChallengeMutations` (daily completion + buddy create/respond/cancel). Reads `?target=` (from S7 Home nav) and smooth-scrolls to the daily/weekly/buddy section.
- [x] Component + integration tests for each (3 page tests across log/profile/challenges)

---

## Session 9 — Bingo + Cards screens

- [x] `app/cards/page.tsx` ← `CardsScreen.jsx` (774) — pack shop + gallery **(S9a ✅)**
  - [x] Extracted `src/components/cards/`: `PackOpeningOverlay` (3D shake→flip→reveal), `CardDetailModal`, `CardCollectionGrid`
  - [x] `useCardMutations.openPack` appends the drawn card to `unlockedItems` via `PUT /auth/me` (alias from cookie, SEC C1) + invalidates me/users; coins derive from `computeCoins` (points − pack costs)
  - [x] Pack-opening keyframes moved to `globals.css`; inline styles only for the phase-driven flip + random sparkle positions
- [x] `app/bingo/page.tsx` ← `BingoScreen.jsx` (1176) — multiple bingo grids **(S9b ✅)**
  - [x] Extracted `src/components/bingo/`: `BoardGrid`, `LineIndicators`, `FilterTabs`, `ChallengeList`, `SlotMachine`, `BonusBingoModal`, `AdultIntroModal`, `AdultBingoModal`
  - [x] Pure board logic → `src/utils/bingo.ts` (`getBoardLineState`/`getBoardCounts`/`computeLineBonus`/`shuffleOpenFirst`) with 10 unit tests
  - [x] `useBingoMutations.markTile` posts `{ board, challengeId, lineBonus, lineTitle }` to `/bingo`; base bonus + line bonus are server-authoritative/clamped (SEC H1), so the screen sends one call instead of the old `handleBingoDone` + separate `handleSaveLog`; secret adult board flips `foundAdultBingo`
- [x] Extract reusable grid/cell components (above)

---

## Session 10 — Team + Photos + Admin ✅

- [x] `app/team/photos/page.tsx` ← `PhotoAlbumScreen.jsx` (880) — upload + gallery **(S10a ✅)**
  - [x] Now a real route (not a modal); `src/components/photos/` (`AlbumPage`, `AlbumLightbox`, `albumLayout`, `compress`); `usePhotoAlbum` (infinite query + compress-then-upload, SEC M1); next/image (`unoptimized` for the auth-gated bytes route)
- [x] `app/team/page.tsx` ← `TeamScreen.jsx` (994) — leaderboard + feed + cheers **(S10b ✅)**
  - [x] `src/components/team/` (PhotoAlbumCard, RosterCard, ActivityFeed, WeeklyTeamChallenge, WeeklyHistoryCard, TeamStats); `computeTeamAggregate` util + tests; `useReactions` (optimistic); cheers via `/cheers`; fixed `saveWeeklyResult` → `/weekly-results`
- [x] `app/admin/page.tsx` ← `AdminScreen.jsx` (606) **(S10c ✅)**
  - **[SEC C1]** All writes go through the `/admin` dispatch (+ `/invites`) routes, which re-verify the signed `admin` claim server-side; the page's client gating is convenience only. `src/components/admin/` (SeasonControls, InviteManager, PlayerCard); `useAdmin` (invites query + mutations).
  - **[SEC C2]** Did **not** port the "Visa lösenord" (show-password) feature — only a reset to a fresh PBKDF2 hash. A test asserts no "Visa" control exists.
- [x] Convert `/public/spelarbilder/*.jpg` loads to Next `Image` (CollectorCard + album, S10a)

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

| Risk                                                     | Mitigation                                                                                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **8-day deadline vs. full rewrite**                      | Scope frozen to port + security + bugs (no new features). Sessions are independent; if time runs short, the app is shippable after S10 + S12 essentials |
| Turso schema drift during migration                      | Route handlers read/write the same tables as the old functions — no schema changes beyond dropping `display_password`                                   |
| Session 8/9 screens bigger than expected                 | Each screen is a self-contained session — can slip into the next without blocking anything else                                                         |
| Inline-style → Tailwind conversion misses dynamic styles | Keep `style={{...}}` only for truly computed values (e.g. `transform: translateX(${px})`). Grep for remaining inline styles at the end of each session  |
| Tailwind v4 is new; plugins may lag                      | Pin versions; prettier-plugin-tailwindcss v0.6+ supports v4                                                                                             |

---

## Progress log

_Add a line here at the end of every session._

- **2026-04-22** — Plan written. Decisions resolved (Netlify, `rewrite/next`, custom cookie auth).
- **2026-04-26** — Pre-S1 cleanup: README rewrite (removed leaked admin pw + real Turso URL), `.claude/` untracked, repo public, two rulesets enforcing, `claude-respond-to-copilot.yml` wired up. Ready to start main S1 work.
- **2026-05-29** — Security review of live `master` + production Turso DB (findings in local, gitignored `SHIP_REVIEW.md`). Confirmed `master` not live with real players → all fixes land in the rewrite. Folded gaps in as `[SEC …]` tasks. Action for Emil: rotate the Turso token.
- **2026-05-30** — **Scope frozen for an 8-day launch (target 2026-06-07): stack upgrade + security + bugs only, no new features.** Removed from plan: multi-tenant future-proofing (teams/memberships/email/TeamConfig), Commitizen + commit-banner script, Framer Motion rewrites (keep existing animations), Storybook, server-component optimization, Lighthouse-90/dark-mode. (Sentry re-added 2026-05-30 — it serves the "no issues" goal.)
- **2026-05-30 (Session 1 ✅)** — Scaffolded Next.js 15 + React 19 + strict TypeScript + Tailwind v4 in place on `rewrite/next-s1-foundation`. Full tooling wired: ESLint 9 flat config, Prettier, Husky (pre-commit/commit-msg/pre-push) + lint-staged + commitlint, Vitest + RTL + jsdom (3 passing tests), Playwright (installed, skipped till S12), GitHub Actions CI, Sentry (inert without DSN) + `global-error.tsx`, `@netlify/plugin-nextjs`. Removed `index.html`/`vite.config.js`. typecheck + lint + test + build all green. Merged locally into `rewrite/next`.
- **2026-05-30 (Session 2 ✅)** — Ported all of `src/constants` and `src/utils` from JS to strict TS on `rewrite/next-s2-constants`, plus `src/types` (domain types) and initial `src/schemas` (Zod). Data-heavy constants renamed via `git mv` (data byte-identical, then typed); logic files (utils + avatar/cards) rewritten with full types and strict-mode fixes (Date math, safe indexing). 21 Vitest tests. `src/constants` + `src/utils` are now 100% TypeScript; components remain `.jsx` (ported in their sessions, excluded from tsc/lint/build for now). typecheck + lint + test + build all green. **Next: Session 3 (API Route Handlers + the security-critical work — auth, no-plaintext-passwords, server-side points, Netlify Blobs photos).** Admin model simplified to single env-var admin with a signed cookie claim (was `team_memberships.role`). S11 reduced to an a11y/QA pass; S12 now includes the pre-launch DB steps. Still pre-S1.
- **Workflow change (2026-05-30)** — Emil dropped per-session branches: from S3 onward all rewrite work is committed **directly on `rewrite/next`** (S1/S2 used `rewrite/next-sN-*` merged locally; those branches deleted). Still no pushing — Emil pushes/PRs at the very end.
- **2026-05-30 (Session 3 ✅)** — Ported the entire backend off Netlify Functions onto 22 Next.js Route Handlers (committed on `rewrite/next`), landing the security-critical fixes. New `src/server/` layer: `db`, `auth` (PBKDF2), `session` (signed httpOnly HMAC cookie + `requireUser`/`requireAdmin`), `responses` (`ApiError` + generic-error `handle` wrapper), `rateLimit`, `points` (server-authoritative scoring), `photoStorage` (Blobs), `buddyProgress`/`buddyChallenges`, `invites`, `repo` (row→domain mappers), `dates`. **[SEC C1]** every mutation derives the alias from the cookie; admin actions verify the signed `admin` claim. **[SEC C2]** `display_password` gone; admin reset stores only a new hash. **[SEC H1]** points recomputed + clamped server-side; bingo/daily bonus logs created server-side from constants (bingo line-bonus clamped, full engine TODO in S9); completions idempotent. **[SEC M1]** photo bytes in Netlify Blobs, metadata + `blob_key` in DB, paginated list returns URLs, bytes auth-gated. **[SEC M3/M4]** rate limiting + generic client errors. Zod validates every body (~20 schemas). 66 Vitest tests (incl. authz + points + admin gating). Deleted `netlify/functions/`; `api.ts` base → `/api`. typecheck + lint + test + build all green. **Decision (Emil):** bonus-point authoritativeness = "move bonus creation server-side, clamp line bonus." Merged into `rewrite/next`.
- **2026-05-30 (Session 4 ✅)** — App shell on `rewrite/next`: file-based routing replaced the manual `pushState` screen dispatcher. 11 route pages (all `<PlaceholderScreen>` stand-ins until their porting session) + `app/layout.tsx` wired with `Providers` (TanStack Query + typed `UserProvider`). `middleware.ts` edge guard redirects unauthed→/login and gates `/admin` on the signed `admin` claim. Six TanStack Query hooks (`useMe`/`useConfig`/`useAllUsers`/`useBuddyChallenges`/`usePhotos`/`useLogs`); added shared types (`Config`, `BuddyChallenge`, `PhotosPage`, `Me`) and reshaped `Photo` (URL, not bytes). **No more localStorage session — cookie-only via `/api/auth/me`.** Deleted `App.jsx`/`main.jsx`/`UserContext.jsx`. 72 vitest tests (incl. 6 new middleware tests) + a Playwright redirect spec for S12. typecheck + lint + test + build green. **Next: Session 5 (common components → TSX + Tailwind: Card, TopBar, ProgressBar, spinners, Countdown, Confetti, modals, CollectorCard, PenaltyGame).**
- **2026-05-30 (Session 5 ✅)** — Ported all 10 `src/components/common/` to TSX + Tailwind on `rewrite/next`: Card (cva), TopBar, ProgressBar, LoadingSpinner(+skeletons), Countdown (now via `useConfig`), Confetti, LevelUpModal, BuddyCelebration, CollectorCard, PenaltyGame (internal `GoalNet`). Fonts (Fredoka One/Nunito) + shared keyframes/animation utilities moved into `globals.css`; brand `--font-*` tokens added. Inline styles kept only for genuinely dynamic values. a11y: clickable Card/cards are keyboard-activatable; modals close on Escape/backdrop with `role="dialog"`. 23 component tests (92 total). `PlaceholderScreen` now renders `TopBar`+`Card`. Deleted the old `.jsx`. typecheck + lint + test + build green. **Smoke-tested S3/S4 live against real Turso** (config/login/me/users all correct; existing 11 users intact; `/api/users` leaks no password — C2 confirmed). **Next: Session 6 (avatar components — AvatarSVG, AvatarBuilder, typed DiceBear config).**
- **2026-05-30 (Session 6 ✅)** — Ported the avatar system to TSX on `rewrite/next`: `AvatarSVG` (DiceBear adventurer via `@dicebear/collection`, typed against `AvatarConfig`, literal-union options asserted once) and `AvatarBuilder` (Tailwind, typed, internal preview/color/none buttons, `compact` mode). 3 component tests (95 total). Deleted the old `.jsx`. typecheck + lint + test + build green. **Next: Session 7 (Login + Home screens — React Hook Form + Zod, invite validation, avatar shuffle; HomeScreen extraction).**
- **2026-05-30 (Session 7 — login half ✅)** — Ported `LoginScreen` → `app/login/page.tsx` on `rewrite/next`: React Hook Form + Zod, invite validation via `/api/invites/validate` (token from `?invite=`), avatar shuffle via `AvatarBuilder`, login/register hit the new cookie endpoints then invalidate `['me']` + redirect. 2 page tests (97 total). typecheck + lint + test + build green. **HomeScreen (1285 lines) deferred to a focused follow-up (S7b)** — it needs a `useCheers` hook + cheer/seen mutations, a `useStats` selector, nav helpers, and pulls feed/weekly-history/team-preview, so it's a session on its own. Recommend a fresh session for it. **Next: Session 7b (HomeScreen port + the small hooks it needs).**
- **2026-05-30 (Session 7b ✅ — HomeScreen)** — Ported `HomeScreen.jsx` (1285 lines) → `app/page.tsx` on `rewrite/next`, completing S7. Split into 9 components under `src/components/home/` (`IntroCarousel`, `CheerToast`, `NewsTicker`, `ActionNudge`, `ChallengesWidget`, `BuddyWidget`, `LastWeekResult`, `StatTiles`, `CollectorCardsCta`); `app/page.tsx` is the orchestrator (an inner `HomeContent` only mounts once a real user is loaded, so its hooks stay unconditional; splash + admin→/admin redirect otherwise). New primitives: `useStats` (computeStats selector over `useMe`), `useCheers` (pending-cheers query + `markSeen`/`sendCheer` mutations over `/api/cheers`), and a `computeCoins` util (points − opened-pack costs) with 4 tests. Data now flows through TanStack Query hooks instead of the old localStorage stale-while-revalidate caches (`fetchAllUsersStale`/`fetchTeamPhotosStale`); nav via `useRouter` with query params (`/challenges?target=…`, `/team?feed=open`) that S8/S10 will read. Inline styles eliminated except genuinely-dynamic ones; `fire-glow`/`ticker`/`cheer-*` keyframes moved to `globals.css`. 7 new tests (3 page + 4 coins) → 104 total. typecheck + lint + test + build all green; `/` prerenders at 13.7 kB. **Next: Session 8 (Log + Profile + Challenges screens).**
- **2026-05-30 (live smoke-test, post-S7)** — Smoke-tested the S7 work against the temporary Turso DB via the running app: admin login + signed-claim `/auth/me` ✓; registered a fresh player through the real invite-gated flow ✓; player session cookie round-trips; **all 6 endpoints HomeScreen reads return 200** (`/auth/me`,`/config`,`/users`,`/photos`,`/buddy-challenges`,`/cheers`); `/api/users` still leaks no password (C2 live ✓); middleware gates `/` (unauth→/login 307, authed→200, no error overlay). Emil eyeballed the hydrated HomeScreen — looks good. Note: admin `delete-user` throws `server_error` **locally** because it calls `getPhotoStorage()` (Netlify Blobs), unavailable outside the Netlify runtime — works in prod; left the `s7smoke` test user for S12's season reset.
- **2026-05-30 (Session 8a ✅ — LogScreen)** — Ported `LogScreen.jsx` (905 lines) → `app/log/page.tsx` on `rewrite/next`. Extracted `src/components/log/` (`WeekCalendar`, `ExerciseInput`, `ActivityInput`, `SaveSummary`) + `useLogMutations` hook (`/logs` POST/PUT/DELETE, penalty `kind`, `PUT /auth/me` highscores, `/users/secret-progress`). Invalidate-on-success (not optimistic) since points are server-authoritative (SEC H1); the screen's own save summary covers perceived speed. Ported the week date-picker, threshold validation, 37-skott penalty Easter egg, scroll-aware sticky button, save overlay + level-up. `save-fly-in`/`save-points-pop` keyframes → `globals.css`. Inner `LogContent` mounts only with a real user (hooks stay unconditional). 3 page tests → 107 total. typecheck + lint + test + build green; `/log` at 5.82 kB. **Next: S8b (ProfileScreen), then S8c (ChallengesScreen).**
- **2026-05-30 (Session 8b ✅ — ProfileScreen)** — Ported `ProfileScreen.jsx` (808 lines) → `app/profile/page.tsx` on `rewrite/next`. Extracted `src/components/profile/` (`ProfileHeader`, `AvatarTab`, `StickersTab`, `BadgesTab`, `StatsTab`) + `useProfileMutations` (avatar + unlocked-items via `PUT /auth/me`, display name via `PUT /users/display-name`, each invalidating `['me']`). Tabs (Avatar/Stickers/Medaljer/Stats), inline display-name editing, point-threshold-gated avatar reward bundles with the decorative arch preview (dynamic transforms kept inline), streak/totals/records. `allUsers` via `useAllUsers`; stats via `computeStats(user)`. 2 page tests → 109 total. typecheck + lint + test + build green; `/profile` at 5.91 kB. **Next: S8c (ChallengesScreen — the last S8 screen).**
- **2026-05-30 (Session 8c ✅ — ChallengesScreen)** — Ported `ChallengesScreen.jsx` (1179 lines) → `app/challenges/page.tsx` on `rewrite/next`. Extracted `src/components/challenges/`: `DailySection` (daily card + completed history + confetti), `WeeklySection` (team weekly card + 10-level ladder + skeleton loading), `BuddySection` (orchestrator) composed of `QuickChallenge` (one-tap suggestion generator), `ChallengeForm` (teammate/exercise/amount picker), `BuddyChallengeList` (incoming/outgoing/active/finished). `useChallengeMutations` (`/daily`, `/buddy-challenges` create/respond/cancel) with cache invalidation; generic API error codes mapped to Swedish. Reads `?target=` from the Home nav helpers and smooth-scrolls to the right section (via `window.location.search`, matching the login `?invite=` pattern — no `useSearchParams` Suspense needed). `daily-pop`/`daily-slide` keyframes → `globals.css`. 2 page tests → 111 total. typecheck + lint + test + build green; `/challenges` at 8.08 kB. **Remaining S8: the small `LogHistoryScreen` (144 lines) → `/log/history`.**
- **2026-05-30 (Session 8d ✅ — LogHistoryScreen, S8 complete)** — Ported `LogHistoryScreen.jsx` (144 lines) → `app/log/history/page.tsx` on `rewrite/next`: list of past training logs with edit (inline form) + delete (confirm) via `useLogMutations` (`editLog`/`deleteLog`). Edit now **preserves** the log's summer-activity values (ice cream/swim/pages) instead of zeroing them — a small bug fix over the original. 2 page tests → 113 total. typecheck + lint + test + build green; `/log/history` at 4.71 kB. **Session 8 fully complete (Log, Log History, Profile, Challenges). Next: Session 9 (Bingo + Cards).**
- **2026-05-30 (Session 9a ✅ — CardsScreen)** — Ported `CardsScreen.jsx` (774 lines) → `app/cards/page.tsx` on `rewrite/next`. Extracted `src/components/cards/`: `PackOpeningOverlay` (real 3D shake→flip→reveal), `CardDetailModal`, `CardCollectionGrid`. `useCardMutations.openPack` appends the drawn card to `unlockedItems` via `PUT /auth/me` (alias from cookie, SEC C1) and invalidates `['me']`+`['users']`; coins derive from `computeCoins` (points − pack costs) — no separate balance to persist. Pack-opening keyframes (`card-shake`/`card-flip-to-front`/`reveal-pulse`/`fade-in-up`/`sparkle`/`gentle-pulse`) moved into `globals.css`; inline styles kept only for the phase-driven flip transform + random sparkle positions. 2 page tests → 115 total. typecheck + lint + test + build green; `/cards` at 4.28 kB.
- **2026-05-30 (Session 9b ✅ — BingoScreen, S9 complete)** — Ported `BingoScreen.jsx` (1176 lines) → `app/bingo/page.tsx` on `rewrite/next`. Extracted `src/components/bingo/`: `BoardGrid`, `LineIndicators`, `FilterTabs`, `ChallengeList`, `SlotMachine` (random-pick wheel), `BonusBingoModal`, `AdultIntroModal`, `AdultBingoModal` (light theme). Pure board logic lifted to `src/utils/bingo.ts` (`getBoardLineState`/`getBoardCounts`/`computeLineBonus`/`shuffleOpenFirst`) with 10 unit tests. `useBingoMutations.markTile` posts `{ board, challengeId, lineBonus, lineTitle }` to `/bingo` — the per-tile base bonus comes from server constants and the line bonus is clamped server-side (SEC H1), so the old `handleBingoDone` + separate `handleSaveLog` collapse into **one** call; the secret 🌞 five-tap flips `foundAdultBingo` via `/users/secret-progress`. Per-board busy/justDone/selected state + slot-machine timers preserved; theme-/data-driven cell colors + animated transforms kept inline (genuinely dynamic). 2 page tests + 10 util tests → 127 total. typecheck + lint + test + build green; `/bingo` at 7.85 kB. **Session 9 complete. Next: Session 10 (Team + Photos + Admin).**
- **2026-05-30 (Session 10a ✅ — PhotoAlbumScreen)** — Ported `PhotoAlbumScreen.jsx` (880 lines) → `app/team/photos/page.tsx` on `rewrite/next`, turning the old modal into a real route. Extracted `src/components/photos/`: `AlbumPage` (12-col scrapbook layout), `AlbumLightbox`, `albumLayout.ts` (pure page-building helpers), `compress.ts` (client-side downscale before upload, SEC M1). `usePhotoAlbum` = `useInfiniteQuery` that accumulates all pages + an upload mutation that compresses then POSTs `/photos` (alias from cookie, SEC C1) and invalidates the `['photos']` keyspace. Album/lightbox images use `next/image` (`unoptimized` — `/api/photos/:id` is auth-gated so it can't be optimized server-side); also converted `CollectorCard`'s `/public/spelarbilder/*.jpg` to `next/image` (static, optimizable). Page-turn keyframes → `globals.css`. 2 page tests → 117 total. typecheck + lint + test + build green; `/team/photos` at 8.47 kB.
- **2026-05-30 (Session 10b ✅ — TeamScreen)** — Ported `TeamScreen.jsx` (994 lines) → `app/team/page.tsx` on `rewrite/next`. Extracted `src/components/team/`: `PhotoAlbumCard` (links to `/team/photos`), `RosterCard` (one-tap cheer/day), `ActivityFeed` (per-event emoji reactions + pagination), `WeeklyTeamChallenge` (10-level ladder), `WeeklyHistoryCard`, and `TeamStats` (level/upcoming/streak/totals/contribution). Lifted team aggregation to `src/utils/team.ts` (`computeTeamAggregate`) + 3 tests. `useReactions` = reactions query + optimistic toggle (alias from cookie, SEC C1); cheers via `apiPost('/cheers')` (already-cheered-today read off the 429). Fixed `saveWeeklyResult` to POST the new `/weekly-results` route (was the old `/users?action=`). 1 page test + 3 util tests → 121 total. typecheck + lint + test + build green; `/team` at 7.33 kB.
- **2026-05-30 (Session 10c ✅ — AdminScreen, S10 complete)** — Ported `AdminScreen.jsx` (606 lines) → `app/admin/page.tsx` on `rewrite/next`. Extracted `src/components/admin/`: `SeasonControls` (reset season + countdown/season-start editors), `InviteManager` (create + enable/disable/reset/copy), `PlayerCard` (stats + password reset + delete). `useAdmin` = invites query + `useAdminMutations` (all actions via the `/admin` dispatch + `/invites`). **[SEC C1]** every write re-verifies the signed `admin` claim server-side — the page's client gating is convenience only. **[SEC C2]** dropped the "Visa lösenord" feature entirely (only a reset to a fresh PBKDF2 hash); a test asserts no "Visa" control renders. 2 page tests → 135 total. typecheck + lint + test + build green. **Session 10 complete (Photos, Team, Admin). Next: Session 11 (a11y & QA pass).**

---

## How to resume work between sessions

Each new Claude Code session starts with **zero memory** of prior conversations. To pick up cleanly:

1. **Be on the right branch**: most session work happens on `rewrite/next-sN-<topic>` branched off `rewrite/next`. Check `git branch` first.
2. **Tell Claude**: `"Read PLAN.md and continue from where we left off. Use the conventions in the plan exactly."`
3. **For a fresh session number**: `"Read PLAN.md and start Session N. Follow the branching convention (branch off rewrite/next as rewrite/next-sN-<topic>)."`
4. **Update the Progress log** at the end of every session before stopping.
