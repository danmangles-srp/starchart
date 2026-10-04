# scripts/ — build toolkit

Repo-local tooling for Cadence (Next.js + pnpm). The Next.js app is the **repo root**, so there's no
app-directory indirection; every script resolves the repo root with `git rev-parse --show-toplevel` and
runs from there.

## The Standard Gate

`gate.sh` is the single source of truth for "is this green". From the repo root it runs:

1. **install** — `pnpm install --frozen-lockfile` (only when `node_modules` is missing or `GATE_INSTALL=1`)
2. **prisma generate** — only once `prisma/schema.prisma` exists
3. **typecheck** — `pnpm typecheck` (`tsc --noEmit`)
4. **lint** — `pnpm lint` (eslint)
5. **format** — `pnpm format:check` (prettier `--check`)
6. **test + coverage** — `pnpm test` (`vitest run --coverage`; the ≥80% logic-surface floor is enforced
   by Vitest `coverage.thresholds` — never scope this run)
7. **build** — `pnpm build` (`next build`)

```sh
sh scripts/gate.sh            # run before every push — must exit 0
sh scripts/gate.sh fast       # inner loop: skip `next build` (everything else runs)
GATE_INSTALL=1 sh scripts/gate.sh   # force a frozen install first (CI does this)
```

It is identical to the `pre-push` hook, so a clean push proves a clean gate.

## Coverage floor

There is **no separate coverage script** — the floor lives in the Vitest config
(`coverage.thresholds`, lines ≥ 80 over the logic surface: `src/features/**/domain`, `**/server`,
`**/data`, and `src/lib/**`; components, `src/app/**` route files, the generated Prisma client, and
config are excluded). A coverage miss fails `pnpm test`, which fails the gate. Tune the threshold in the
config, not here.

## Git hooks

Committed, repo-local hooks in `git-hooks/`. Install once after cloning:

```sh
sh scripts/install-hooks.sh   # sets core.hooksPath + chmod +x
```

| Hook | Runs |
| ---- | ---- |
| `commit-msg` | Rejects non-Conventional-Commit messages (`feat\|fix\|refactor\|test\|docs\|chore\|ci`) |
| `pre-commit` | Fast: `pnpm typecheck` + `pnpm lint` + `pnpm format:check` |
| `pre-push` | Full: `gate.sh` |

## Notes

- POSIX `sh`; runs on macOS/Linux and Git Bash on Windows.
- Playwright E2E is **not** in the gate (it needs the app + a DB running) — it runs in CI. See
  `.claude/skills/testing.md`.
