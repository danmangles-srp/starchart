#!/usr/bin/env sh
# Standard Gate — the single source of truth for "is this green".
# install (if needed) -> prisma generate -> typecheck -> lint -> format check
#   -> test + coverage floor -> next build.
# Identical to the pre-push hook. Run before every push, from anywhere in the repo.
#
# The Next.js app is the repo root. Coverage is enforced by Vitest's own
# coverage.thresholds (see vitest config) — a failing floor fails `pnpm test`.
#
# Fast inner-loop cycle: `gate.sh fast` (or `--fast`, or GATE_FAST=1) skips the
#   (slow) `next build` — everything else still runs.
# Force a dependency (re)install with GATE_INSTALL=1 (CI should always install
#   with a frozen lockfile before the gate).
set -e

root="$(git rev-parse --show-toplevel)"
cd "$root"

# Fast mode: skip `next build`.
FAST=
if [ "$1" = "fast" ] || [ "$1" = "--fast" ] || [ -n "${GATE_FAST:-}" ]; then
  FAST=1
fi

# 0. Dependencies — install when node_modules is missing or explicitly forced.
#    Frozen lockfile so the gate reflects exactly what's committed.
if [ -n "${GATE_INSTALL:-}" ] || [ ! -d "$root/node_modules" ]; then
  echo "gate: install (frozen lockfile)"
  pnpm install --frozen-lockfile
fi

# 1. Prisma client — only once a schema exists (added in M0 T0.3).
if [ -f "$root/prisma/schema.prisma" ]; then
  echo "gate: prisma generate"
  pnpm prisma generate
fi

# 2. Types.
echo "gate: typecheck"
pnpm typecheck

# 3. Lint.
echo "gate: lint"
pnpm lint

# 4. Format (CI-style: fail if anything is unformatted).
echo "gate: format"
pnpm format:check

# 5. Full test suite with coverage. Vitest enforces the >=80% logic-surface floor
#    via coverage.thresholds — never scope this run (a scoped path reports
#    untouched files as 0% and fails the floor).
echo "gate: test + coverage"
pnpm test

# 6. Production build. Catches what unit/component tests can't — RSC/server-action
#    boundaries, route types, bundling. Skipped in --fast.
if [ -z "$FAST" ]; then
  echo "gate: build"
  pnpm build
else
  echo "gate: build skipped (--fast)"
fi

echo "gate: PASS"
