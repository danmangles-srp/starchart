---
name: testing
description: Testing standards, the TDD loop, test tiers (Vitest unit/component, Playwright E2E, Prisma data-access), coverage floor, and what is/isn't provable without a browser. Use when writing tests, debugging failures, or setting up test infra.
---

# Testing: How We Break/Fix

## Frameworks

- **Runner**: `vitest` (`describe`, `it`, `expect`, `beforeEach`, `vi`).
- **Component**: `@testing-library/react` + `@testing-library/jest-dom` on `jsdom`; query by role/label,
  interact with `@testing-library/user-event`.
- **Mocking**: `vi.fn()` / `vi.mock()` for server actions, the data-access layer, the clock, and the
  session. No network, no real OAuth in unit/component tests.
- **Data-access**: a **transactional Postgres test database** (a dedicated `DATABASE_URL`), each test in
  a rolled-back transaction, to verify Prisma queries, team scoping, and row↔domain mapping for real.
- **E2E**: `@playwright/test` drives the running app for the few flows only a browser can prove.
- **Location**: tests sit next to code (`*.test.ts` / `*.test.tsx`) or under `src/**/__tests__`;
  Playwright specs under `e2e/`.

## TDD: Red-Green-Refactor

Hard requirement. Smallest testable chunk at a time, each mapped to a `requirements.md` AC.

1. **Red**: write a failing test first; show the failing output before writing solution code.
2. **Green**: implement the minimum to pass.
3. **Refactor**: clean up while keeping tests green.

## Self-Validation Loop (no browser required)

The app runs in a browser against Postgres, but the agent validates most of its work **on Node** — no
real OAuth, no deployed DB. This works because logic is pure TS behind injectable seams (the Prisma
client, `AppClock`, the session, the data-access layer).

- **Tier 1 — Unit (every TDD cycle):** pure TS with fakes/mocks. Covers all domain rules — permission
  predicates (the full FR-1.2 matrix), quarter + ISO-week math, goal/comparator evaluation, overdue/age
  logic, aggregation for My Week / dashboards, Zod schemas, verified-email/domain allow logic.
- **Tier 2 — Component (in `vitest` + Testing Library):** each screen renders **every state** of its
  data (loading / empty / error / content); an interaction calls the right server action (mocked);
  optimistic update shows immediately and **rolls back** on a rejected mutation; status/overdue cues are
  present as **icon + label**, not color alone; read-only mode hides edit affordances for non-members.
- **Tier 2.5 — Data-access (against the test DB):** a `data/` function scopes to the right team, maps
  rows to domain objects, enforces uniqueness (e.g. one WeeklyEntry per measurable/week), and refuses a
  cross-team write.
- **Tier 3 — E2E (`playwright`, CI only):** the handful of flows a browser must prove end to end — the
  sign-in gate (unauthenticated → sign-in; the two provider buttons present), create a Rock, type a
  Scorecard value and see it persist, solve an Issue and convert it to a Todo. **Not** in the per-commit
  gate (needs the app + a DB running); runs in CI.

`pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` is the complete, trustworthy
self-validation loop for logic and wiring.

**What the loop canNOT prove (needs a real browser / real IdP / deploy — NOT in the gate):** the live
Google/Microsoft OAuth round-trip and the domain/tenant rejection on a real IdP; Vercel deploy +
migration-on-deploy; true cross-browser rendering; and the performance NFRs (page interactive < 2.0s,
Scorecard smooth at ≥40 measurables × 13 weeks, optimistic save < 300ms perceived). These are the
**manual-acceptance tier** — say so honestly in the PR. Green Tier 1–2 means the logic is correct and
wired; it is **not** "shippable" proof on its own. Pair it with the design loop in `ui-ux.md`.

## Visual / design review loop (UI quality is testable too)

Logic tests say nothing about whether a screen *looks* right. Close that gap with the **AI design
self-review loop** (`/design-review`): run the app (or capture the screen), and grade it against the
rubric in `ui-ux.md` — light + dark, default + 200% zoom, empty + populated. Run it before every UI PR.

## What to test (generic map — fill in from requirements.md)

| Component | Test focus |
| --------- | ---------- |
| Domain logic / math | Correct output for fixtures incl. boundaries + empty input (quarter edges, ISO-week window, each comparator, empty ≠ 0, overdue/age, milestone progress, rollup) |
| Permissions | The full FR-1.2 matrix: member/lead/admin × on-team/off-team × read/edit/manage; off-team edit is refused |
| Data-access | Scopes to the team; maps rows ↔ domain; enforces uniqueness; refuses cross-team writes; archive not delete |
| Server actions | Rejects invalid input (Zod); refuses unauthorized actors; writes + logs the activity on success |
| Controllers / mutations | Optimistic update applies then reconciles on success / **rolls back on failure** (no lost input) |
| Aggregation | My Week + team-dashboard counts across multiple teams; bounded queries |
| Component states | Every data branch (loading/empty/error/content) renders; status/overdue as icon+label; read-only cue off-team; a11y roles/labels present |

Keep every collaborator injectable (Prisma client, `AppClock`, session, data-access) so unit/component
tests need no browser.

## Example (Vitest + Testing Library)

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('checking a todo optimistically marks it done, then rolls back on failure', async () => {
  const toggle = vi.fn().mockRejectedValueOnce(new Error('offline'));
  render(<TodoRow todo={todo({ id: 't1', done: false })} onToggle={toggle} />);

  await userEvent.click(screen.getByRole('checkbox', { name: /mark .* done/i }));

  expect(toggle).toHaveBeenCalledWith('t1');
  // optimistic tick shown, then reverted when the mutation rejects:
  expect(await screen.findByRole('checkbox', { name: /mark .* done/i })).not.toBeChecked();
  expect(screen.getByText(/couldn.t save/i)).toBeInTheDocument();
});
```

## Validation Commands

The **Standard Gate** is the single source of truth for "is this green" — `scripts/gate.sh`, identical
to the `pre-push` hook. Run it before every push:

```bash
sh scripts/gate.sh
```

which runs: `prisma generate` → `pnpm typecheck` → `pnpm lint` → `pnpm format:check` →
`vitest run --coverage` (enforcing the **≥80% logic-surface floor** via Vitest `coverage.thresholds`) →
`next build`.

**Never gate on a scoped test path.** `pnpm test src/features/rocks` reports every untouched file as 0%
and fails the floor — run a scoped path only for fast red-green iteration, then the full
`sh scripts/gate.sh` before pushing. If any step fails, fix the **root cause** — a flaky/partial gate is
a defect, not a retry.

> **Coverage is a floor, not a goal.** 80% line coverage of behavior-focused tests is the bar — don't
> write assertion-free tests to hit a number. If something is hard to test, that's usually a missing seam
> (inject the dependency), not a reason to skip it.
