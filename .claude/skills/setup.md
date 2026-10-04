---
name: setup
description: Next.js project bootstrap, pinned package versions, Prisma/Postgres, Auth.js (Google + Microsoft), MUI theme wiring, env/secrets discipline, static analysis, test infra, the gate, and git hooks. Use when initializing the app or troubleshooting the build.
---

# Setup: How We Start

The deterministic build foundation for **Cadence**. A CLI agent creates these files directly (no IDE GUI
required). Bootstrap is blind-executable with Node + pnpm on PATH.

## Before you bootstrap — what's already decided

The product + stack choices are pinned in `CLAUDE.md` + `plan.md` → "Architecture decisions". Don't
re-litigate them at bootstrap:

- **Web app**, Next.js (App Router, TypeScript strict), repo root, source in `src/`.
- **MUI v6 + MUI X**, Material 3 seeded from Google blue `#1a73e8`, light + dark.
- **Prisma + PostgreSQL** single source of truth.
- **Auth.js (NextAuth v5)**, **Google + Microsoft Entra ID**, domain/tenant-restricted.
- Deploy **Vercel**; Postgres via Vercel Postgres / Neon.

The one still-open "name" door is cosmetic: the working product name is **Cadence**, repo/package id
`eos-app`. It's an internal tool (no store submission), so it's safe to rename later — don't block on it.

## Prerequisites (verify, don't assume)

```bash
node --version      # Node LTS >= 20
pnpm --version      # pnpm >= 9  (corepack enable || npm i -g pnpm)
git --version
```

Plus, for a working dev environment:
- A **PostgreSQL** the app can reach — local Docker (`postgres:16`) or a Neon/Vercel Postgres dev branch.
- **Google OAuth** client (Authorized redirect `.../api/auth/callback/google`).
- **Microsoft Entra ID** app registration (redirect `.../api/auth/callback/microsoft-entra-id`, a client
  secret, and the tenant id).

## Project location

The Next.js app is the **repo root** (no `app/` subdirectory wrapper — note Next's own route folder is
`src/app/`). Create once:

```bash
pnpm create next-app@latest . --ts --app --eslint --src-dir --import-alias "@/*" --use-pnpm
```

All commands below run from the repo root.

## Pinned Version Matrix (single source of truth)

The **project's authoritative matrix is `plan.md` → "Dependency matrix".** The core below is the
bootstrap baseline; add a milestone's domain packages (dnd-kit, charts, etc.) when that milestone needs
them. Declare everything in `package.json`. **If a version is unavailable/incompatible, bump to the
nearest compatible stable, keep related packages in lockstep (e.g. `@mui/material`↔`@mui/x-*`,
`prisma`↔`@prisma/client`, `next`↔`eslint-config-next`), and record the change in the PR.**

| Package | Role |
| ------- | ---- |
| `next`, `react`, `react-dom` | Framework (App Router, RSC) + UI runtime |
| `typescript`, `@types/*` | Strict typing |
| `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` | UI + Material 3 theme |
| `@mui/x-data-grid`, `@mui/x-charts`, `@mui/x-date-pickers` | Scorecard grid, trend charts, date/quarter/week |
| `next-auth` (v5), `@auth/prisma-adapter` | Auth.js — Google + Microsoft Entra ID |
| `prisma` (dev), `@prisma/client` | ORM + migrations (Postgres) |
| `@tanstack/react-query` | Client cache + optimistic mutations |
| `react-hook-form`, `zod`, `@hookform/resolvers` | Forms + shared validation (client & server) |
| `date-fns`, `date-fns-tz` | ISO-week + quarter math, tz-aware display |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Drag-reorder (issues, measurables, milestones) |
| `pino`, `pino-pretty` (dev) | Structured tagged logging |
| `@t3-oss/env-nextjs` (+ `zod`) | Typed, fail-fast env parsing |
| `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | Unit + component tests |
| `@playwright/test` | E2E (CI only, not the per-commit gate) |
| `eslint`, `eslint-config-next`, `@typescript-eslint/*`, `eslint-config-prettier` | Lint surface |
| `prettier` | Formatter |

> **Lockstep pairs:** `prisma`↔`@prisma/client`; `@mui/material`↔`@mui/x-*`↔`@emotion/*`;
> `next`↔`eslint-config-next`. Bump them together.

## Code generation & migrations

Prisma is the only codegen. Run after any schema change:

```bash
pnpm prisma generate                      # regenerate the typed client
pnpm prisma migrate dev --name <change>   # create + apply a dev migration
pnpm prisma migrate deploy                # apply committed migrations (CI/prod)
```

Migrations under `prisma/migrations/` are **committed** with the PR. Never hand-edit the DB.

## Static analysis

- **TypeScript strict** in `tsconfig.json` (`"strict": true`, `noUncheckedIndexedAccess` on).
- **ESLint** extends `next/core-web-vitals` + `@typescript-eslint` + `eslint-config-prettier`. Add a
  rule to ban `console.log` in shipped paths (use `AppLogger`).
- **Prettier** for formatting; CI checks with `--check`.

```bash
pnpm typecheck     # tsc --noEmit
pnpm lint          # eslint .
pnpm format:check  # prettier --check .
```

## Keys & secrets discipline (non-negotiable)

**No secrets in the client bundle or the repo.** All secrets are server-side env vars, provided via a
gitignored `.env` locally and Vercel project settings in deploy. Commit a **`.env.example`** with the
keys and dummy values. Required vars:

```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=...                       # openssl rand -base64 33
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_MICROSOFT_ENTRA_ID_ID=...
AUTH_MICROSOFT_ENTRA_ID_SECRET=...
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=...
ALLOWED_EMAIL_DOMAINS=example.com     # comma-separated; checked server-side on sign-in
```

- Parse env through the typed env module so a **missing/invalid var fails fast at boot**, not at first
  request.
- The allowed-domain / tenant check runs **server-side in the Auth.js `signIn` callback** — never
  trust the client. Only `NEXT_PUBLIC_*` vars reach the browser; no secret is ever `NEXT_PUBLIC_*`.

## Test infrastructure (set up once in M0)

`vitest` + Testing Library cover the per-commit gate (no browser needed); Playwright covers critical
flows in CI. See `testing.md`.

- Configure **Vitest coverage thresholds** (`coverage.thresholds`, lines ≥ 80 on the logic surface —
  `src/features/**/domain`, `**/server`, `**/data`, `src/lib/**`; exclude `**/components/**`,
  `src/app/**` route files, generated Prisma client, and config). A failing threshold fails `pnpm test`,
  so the floor is enforced by the test runner itself (no separate coverage script).
- Delete the sample content `create-next-app` scaffolds; add a trivial passing `smoke.test.ts` and one
  Playwright smoke so the suite is green at the end of bootstrap.
- Keep collaborators injectable (the Prisma client, the clock, the session) so logic tests need no DB or
  browser — use a transactional test database for the data-access tests that do.

Committed harness, all under `scripts/` (see `scripts/README.md`):

- **`scripts/gate.sh`** — the **Standard Gate**, the single source of truth for "is this green":
  `pnpm install --frozen-lockfile` (CI) → `prisma generate` → typecheck → lint → format check →
  `vitest run --coverage` (with the ≥80% floor) → `next build`. The `pre-push` hook calls exactly this.
- **`scripts/git-hooks/*`** + **`scripts/install-hooks.sh`** — repo-local hooks (below).

## Git hooks (committed, repo-local)

Activate once with `sh scripts/install-hooks.sh` (sets `core.hooksPath`, makes scripts executable). Each
resolves the repo root with `git rev-parse --show-toplevel`.

| Hook | Runs |
| ---- | ---- |
| `commit-msg` | Reject non-Conventional-Commit messages (`^(feat\|fix\|refactor\|test\|docs\|chore\|ci)(\(.+\))?: .+`) |
| `pre-commit` (fast) | `pnpm typecheck` + `pnpm lint` + `pnpm format:check` |
| `pre-push` (full) | `sh scripts/gate.sh` |

## Command reference

```bash
sh scripts/gate.sh                 # THE GATE (run before every push)
pnpm install                       # resolve deps
pnpm dev                           # local dev server
pnpm prisma migrate dev --name x   # create + apply a migration
pnpm prisma studio                 # inspect the dev DB
pnpm typecheck                     # tsc --noEmit
pnpm lint                          # eslint
pnpm format                        # prettier --write
pnpm test                          # vitest run --coverage (enforces the floor)
pnpm test src/features/rocks       # scoped run — fast iteration ONLY, not the gate
pnpm test:e2e                      # playwright (CI; needs the app running)
pnpm build                         # next build
```

## Verification Checklist (end of bootstrap)

- [ ] `pnpm install` resolves with the pinned matrix; lockfile committed
- [ ] `pnpm prisma migrate dev` applies the baseline; generated client works
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` all clean
- [ ] `sh scripts/gate.sh` is green (smoke test; coverage floor satisfied or "no logic lines yet")
- [ ] Sample scaffold tests removed; `smoke.test.ts` + one Playwright smoke present
- [ ] No real secrets in the repo; `.env.example` committed; env parsed fail-fast
- [ ] `sh scripts/install-hooks.sh` run (`core.hooksPath` set)
- [ ] App identity, stack, Google + Microsoft auth, and env keys recorded in `CLAUDE.md` / `.env.example`
- [ ] Vercel project linked; a preview deploy succeeds

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Prisma client out of date after schema change | `pnpm prisma generate`; restart the dev server/TS server |
| "table does not exist" | You changed the schema without a migration — `pnpm prisma migrate dev` |
| Auth callback mismatch | The provider's redirect URI must match `.../api/auth/callback/<provider>` exactly (per env) |
| Microsoft sign-in rejected | Check the tenant id + that the app registration allows your tenant; verify `AUTH_MICROSOFT_ENTRA_ID_*` |
| Allowed-domain user still blocked | `ALLOWED_EMAIL_DOMAINS` not set/typo'd; the `signIn` callback reads it server-side |
| MUI styles flash / mismatch on SSR | Emotion cache not wired for the App Router — add the cache provider in the root layout |
| Env var undefined at runtime | It isn't in `.env`/Vercel, or you expected a secret in the browser (only `NEXT_PUBLIC_*` cross over) |
| Coverage floor fails unexpectedly | You ran a scoped path — coverage must be the full `vitest run --coverage` (see `testing.md`) |
