# Contributing

Thanks for working on Högalid F15. This project values small, well-tested,
conventionally-committed changes. The git hooks below enforce most of it for you.

## Branch strategy

- **`master`** — production. Auto-deploys to Netlify. Protected: changes land via PR
  with at least one approval.
- **`rewrite/next`** — the integration branch for the Next.js rewrite. Day-to-day work
  is committed here directly; it merges into `master` at launch.

Branch off `rewrite/next` for substantial features if you prefer, then PR back into it.

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint on every commit (`commit-msg` hook). Format:

```
<type>: <short summary in the imperative>
```

Allowed types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `ci`,
`perf`, `build`, `revert`.

Examples:

```
feat: port the bingo screen to app/bingo
fix: preserve summer-activity values when editing a log
test: add handler test for admin invite gating
```

Keep the subject under ~72 chars. Add a body (after a blank line) when the _why_ isn't
obvious from the subject.

## Local checks

Run before pushing — these are the same checks CI runs:

```bash
npm run typecheck   # strict TypeScript
npm run lint        # ESLint (incl. jsx-a11y)
npm run test        # Vitest
npm run build       # production build
```

Formatting is handled by Prettier (`npm run format`); Tailwind classes are auto-sorted.

## Git hooks (Husky)

| Hook         | Runs                                                      |
| ------------ | --------------------------------------------------------- |
| `pre-commit` | `lint-staged` — ESLint `--fix` + Prettier on staged files |
| `commit-msg` | `commitlint` — validates the Conventional Commit message  |
| `pre-push`   | `npm run typecheck && npm run test`                       |

Don't bypass hooks (`--no-verify`) unless you have a specific reason and say so in the PR.

## Tests

- **Every utility function** gets a unit test (`src/utils/*.test.ts`).
- **Every API route** gets a handler test (mock DB + injected fake photo storage).
- **Critical user flows** are covered by Playwright (`e2e/`). The E2E suite boots the dev
  server and needs the environment variables from the README (`TURSO_URL`, `TURSO_TOKEN`,
  `SESSION_SECRET`, `ADMIN_ALIAS`, `ADMIN_PASSWORD`).

Run unit/component/handler tests with `npm run test`, E2E with `npm run e2e`.

## Code style

- Strict TypeScript: no `any` without a comment explaining why.
- Tailwind for styling; reserve inline `style={{…}}` for genuinely dynamic values
  (computed transforms, animated positions).
- Delete dead code — don't comment it out. Git remembers.
- Derive the acting user from the session cookie server-side, never from the request
  body. Never trust client-supplied scores.
