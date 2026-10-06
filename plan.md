# plan.md — Cadence

> The ordered **HOW** for **Cadence** — an internal, multi-user web platform running our company's EOS
> operations (Rocks, Data/Scorecard, Issues, Todos) for ~100 people across a Leadership Team and 4
> departments of 5 teams each.
>
> **Restart here:** the [Plan of Attack](#plan-of-attack-restart-here) is the single source of truth for
> **what is done** and **what to do next**. One **ticket = 1 PR** off `main`, in dependency order; don't
> start the next until the current one's gate exits `0` and its PR is open.
>
> **Read first, in order:** [Architecture decisions](#architecture-decisions) →
> [Engineering invariants](#engineering-invariants) → [Autonomous execution loop](#autonomous-execution-loop).
> The invariants are the cross-cutting rules **every ticket inherits by reference** — a ticket lists only
> what's *special* to it. Source of truth for *what* is `requirements.md` (FR-\*/NFR-\*); its ACs are the
> definition of done. Where plan and requirements disagree, fix the mismatch — don't silently diverge.

## Architecture decisions

1. **Web, not mobile.** Desktop-first responsive (usable to tablet; phone for quick actions). No native app.
2. **Full-stack Next.js (App Router) + TypeScript strict.** RSC for reads; **server actions/route
   handlers** for every mutation. Feature-first `src/features/<feature>/{components,server,domain,data}`.
3. **PostgreSQL via Prisma is the single source of truth.** No second store; schema changes ship as
   committed migrations.
4. **Auth = Google or Microsoft, domain/tenant-restricted, via Auth.js (NextAuth v5).** Server-side
   allowlist; a person is keyed by **verified work email** so either provider resolves to one user;
   secure http-only session cookies.
5. **Authorization is server-side on every mutation + every cross-team read.** Roles **Admin** (global),
   **Team Lead** (per team), **Member**. Reads are team-scoped; an Admin reads/manages every team in the
   org. Enforcement is centralized (see INV-1/INV-2), never ad-hoc.
6. **UI = MUI v6 + MUI X**, Material 3 seeded from Google blue `#1a73e8`, light **and** dark (system +
   toggle). DataGrid → Scorecard; Charts → trends; Date Pickers → quarter/week. Dense where it earns it.
7. **Client data = TanStack Query**, optimistic writes with rollback (INV-5). Server actions own the
   write; React Query owns perceived latency.
8. **Validation = Zod everywhere** — the *same* schema validates client (RHF) and server.
9. **Status is never color-alone** — color + icon + label, via one shared primitive (INV-6).
10. **Archive, don't hard-delete** teams/measurables/issues; sensitive changes hit the activity log.
11. **No external egress in v1** beyond the Google/Microsoft OAuth handshake.
12. **Deploy Vercel**; Postgres via Vercel Postgres / Neon; secrets in env/Vercel only.
13. **v1 cut = M0–M7.** M0 shell/infra → M1 identity/org/RBAC → M2–M5 the four modules → M6 aggregated
    home + dashboards → M7 cross-cutting polish.
14. **Org-ready multi-tenancy, one org in v1.** A top-level `Organization` is the tenant; every table
    carries `orgId` and the data-access layer scopes every query by it (INV-2), so cross-org isolation is
    structural. Sign-in resolves a user's org from their email domain/tenant.
15. **Quarters are org-configurable.** Each Organization defines its quarters' start/end dates (an Admin
    setting), **defaulting to calendar quarters** (Q1 = Jan–Mar) when unset — so a non-calendar fiscal
    year is data, not code. Rock quarter math reads these definitions with a calendar fallback (INV-4).

## Engineering invariants

The rules **every ticket honors without restating them**. A ticket's `Inv:` field lists the ones it leans
on most; all still apply. Each is backed by a skill (`structure` / `ui-ux` / `testing` / `setup`).

- **INV-1 — One write path.** Every mutation is a server action built with the shared
  `authorizedAction(schema, authorize, handler)` wrapper (M1/T1.3): **Zod-parse → `requireUser()` →
  authorize predicate (role + team) → `data/` call → activity-log if sensitive → revalidate/invalidate**.
  No mutation bypasses it; no raw `prisma` import outside `data/`. Never leak a Prisma error to the UI.
- **INV-2 — Scoped data layer.** All Prisma lives in `features/*/data` (or `lib/db`); every query is
  filtered by `orgId`, then membership/role, and returns **domain-shaped** objects (no Prisma types in
  components). Lists are bounded/paginated (NFR-2.3). Cross-org access is impossible by construction.
- **INV-3 — Pure logic behind seams.** Domain rules, quarter/ISO-week math, goal eval, permissions, and
  aggregation are **pure TS** in `domain/` (no React, no Prisma); collaborators (Prisma, `AppClock`,
  session) are **injected** so unit tests need no DB/browser. This surface carries the **≥80% coverage
  floor**.
- **INV-4 — Time.** `lib/time` owns all "now"/quarter/week; `AppClock` is injected; store **UTC**; weeks
  are keyed `(isoYear, isoWeek)`, **Monday start, newest-left** on the grid (FR-4.2); **quarters resolve
  from the org's `QuarterDefinition`s, calendar fallback** (Q1 Jan–Mar).
- **INV-5 — Optimism, uniform.** Interactive writes use the shared `useOptimisticMutation` helper
  (snapshot → apply → **rollback + retry on error** → invalidate on settle); **input is never dropped**
  (NFR-5). Query keys are centralized in `lib/query`.
- **INV-6 — Never color-alone.** Status / goal / overdue render through shared `StatusChip` / `GoalCell`
  primitives driven by the theme's `status → {color, icon, label}` map — always color **+ icon + an
  accessible label** (NFR-3.3).
- **INV-7 — Four states, always.** Every screen renders **loading** (skeleton) / **empty** (inviting CTA)
  / **error** (plain cause + retry) / **content**. An off-team deep link lands on a friendly not-found;
  an Admin can open any team.
- **INV-8 — Route contract.** Authed app under `(app)`; **team context lives in the URL** —
  `/t/[teamId]/{rocks,scorecard,issues,todos}`, team dashboard `/t/[teamId]`, My Week `/`, admin
  `/admin`. Deep links encode team + time context so a shared URL reopens the same view.
- **INV-9 — Aggregation contracts.** As each module's data layer is built it **exposes
  `myItemsFor(user)` and `teamSummary(teamId)`** (bounded). M6 (My Week / dashboards) consumes these — it
  never reaches into a module's internals.
- **INV-10 — Archive, log, don't delete.** Soft `archivedAt` for teams/measurables/issues; sensitive
  changes (role, team retire, rock status, issue solved, measurable archived) append to the activity log
  **via INV-1** so logging can't be forgotten per-feature.
- **INV-11 — Secrets, logging, migrations.** No secret in repo/client (typed, fail-fast env only); tagged
  `AppLogger` (pino), **no `console.log`** in shipped paths; **one committed Prisma migration per schema
  PR**, never hand-edited.

## Dependency matrix

Pinned at **M0**; exact versions recorded in the M0 PR. If a version is unavailable/incompatible, bump to
the nearest compatible stable, keep codegen/runtime and UI pairs in lockstep
(`prisma`↔`@prisma/client`, `@mui/material`↔`@mui/x-*`↔`@emotion/*`, `next`↔`eslint-config-next`), and
record it in the PR.

| Concern | Package(s) |
| --- | --- |
| Framework | `next` (App Router, RSC), `react`, `react-dom` |
| Language/tooling | `typescript`, `eslint` (`next/core-web-vitals`, `@typescript-eslint`, `eslint-config-prettier`), `prettier` |
| UI | `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` |
| Grid / charts / pickers | `@mui/x-data-grid`, `@mui/x-charts`, `@mui/x-date-pickers` |
| Auth | `next-auth` (v5), `@auth/prisma-adapter` — Google + Microsoft Entra ID |
| DB / ORM | `prisma` (dev), `@prisma/client`, PostgreSQL |
| Client cache / mutations | `@tanstack/react-query` |
| Forms / validation | `react-hook-form`, `zod`, `@hookform/resolvers` |
| Dates | `date-fns`, `date-fns-tz` |
| Drag-reorder | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Env safety | `@t3-oss/env-nextjs` (+ `zod`) |
| Logging | `pino`, `pino-pretty` (dev) |
| Unit/component tests | `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |
| E2E | `@playwright/test` (CI only, not the per-commit gate) |
| Package manager | `pnpm` |
| Deploy / DB host | Vercel + Vercel Postgres / Neon |

---

## Autonomous execution loop

The canonical loop is `workflow.md`; this is its **autonomous profile** — the order that avoids rework.
Per ticket:

1. **Frame.** Read the ticket + its ACs in `requirements.md`. If the ticket's **`Ask`** is not `—` and is
   unresolved, **ask it first** (batched, recommended option led) before coding. Restate scope +
   out-of-scope in the PR.
2. **Branch** `<type>/t<n>-<slug>` off `main` (e.g. `feat/t2-1-rocks-schema`). PRs target **`main`** (the
   trunk); releases are cut from `main` as **GitHub Releases**. No long-lived `dev` branch.
3. **Contracts first → inward-out.** Build in this order; **UI never precedes a settled schema/domain**:
   **Prisma schema + migration → domain types + Zod + pure logic (red→green) → `data/` (DB tests,
   scoping) → server actions via `authorizedAction` → UI (component tests, four states) → wire optimism.**
4. **Self-review (blocking).** `/code-review` on the diff, address every CONFIRMED/PLAUSIBLE finding;
   `/design-review` **iff screens changed** (≥ 4/5, light + dark). Run both critiques as **subagents**.
5. **Gate.** `sh scripts/gate.sh` exits `0` (typecheck → lint → format → `vitest run --coverage` ≥80% →
   `next build`). **Never** gate on a scoped test path.
6. **Definition of done.** Gate `0` **and** the ticket's ACs are demoable **and** a "How to verify"
   (concrete browser steps + an explicit *not covered by the gate* list) is written.
7. **PR → `main`**, Conventional Commits (lowercase, no emoji, no Co-authored-by), migrations committed;
   squash-merge; mark the ticket **`COMPLETE (#PR)`** on the board.

**Ask-policy (autonomy bounds).** Ask only for: (a) the ticket's declared `Ask`; (b) a *new* product /
UX / data-shape / irreversible fork you hit mid-build; or (c) a skill ↔ project-doc conflict. Everything
mechanical — deps in the matrix, a type, file layout, which token, test shape — **just do, and note it in
the PR.** Don't re-ask a resolved decision.

**Per-ticket schema.** `Build` (what to make) · `Gate` (the tests that pin it) · `ACs` (requirements) ·
`Inv` (the invariants it leans on) · `Deps` · `Ask` (the one decision to confirm first, or `—`).

---

## Plan of Attack (restart here)

> Status as of **2026-10-06**. M0–M2 complete; M3 in progress (T3.1–T3.4 merged). Execute top-down;
> one ticket = one PR off `main`.

### Status board

| Milestone | State |
| --- | --- |
| M0 Foundation, app shell & shared primitives | **COMPLETE** |
| M1 Identity, Org, Teams & RBAC | **COMPLETE** |
| M2 Rocks | **COMPLETE** |
| M3 Data / Scorecard | **IN PROGRESS** (T3.1–T3.6 done; T3.7 Google-login bug blocked on console/env) |
| M4 Todos | **COMPLETE** |
| M5 Issues (incl. solve → convert) | **IN PROGRESS** |
| M6 My Week home + Team dashboards | PLANNED |
| M7 Polish: search, notifications, a11y/perf/responsive | PLANNED |

---

## Milestone 0 — Foundation, app shell & shared primitives

**Objective:** a building, type-checked, test-covered Next.js skeleton — MUI theme, Prisma/Postgres, the
app shell, the **shared primitives every later ticket reuses**, and a green gate + CI — before any feature
or auth lands. **Exit:** `sh scripts/gate.sh` = 0 on the empty app; the shell renders light/dark with a
persisted toggle; a Playwright smoke loads it; CI runs the gate on PRs to `main`; a Vercel preview deploys.

- **COMPLETE (#2) · T0.1 — Repo & toolchain bootstrap.**
  `Build:` pnpm + Next.js (App Router, TS strict, `noUncheckedIndexedAccess`) + ESLint
  (`next/core-web-vitals`, `@typescript-eslint`, ban `console.log`) + Prettier; base scripts; `git init`,
  `.gitignore`, `.env.example`. `Gate:` `pnpm build` + `pnpm lint` clean on the starter.
  `ACs:` infra. `Inv:` INV-11. `Deps:` none. `Ask:` —
- **COMPLETE (#3) · T0.2 — MUI theme system.**
  `Build:` Material 3 CSS-vars theme (`extendTheme` + `CssVarsProvider`) seeded from `#1a73e8`, light +
  dark; type/spacing/radius/motion tokens; **`status → {color, icon, label}` map**; SSR-safe emotion
  cache; persisted light/dark/system toggle. No hardcoded visual values anywhere after this. `Gate:` token
  + status-map unit tests. `ACs:` FR-8.3, NFR-3.1. `Inv:` INV-6. `Deps:` T0.1. `Ask:` —
- **COMPLETE (#4) · T0.3 — Prisma + Postgres + env + logger.**
  `Build:` Prisma init, Postgres connection, `lib/db` singleton, typed fail-fast `lib/env`, baseline
  migration, tagged `AppLogger` (pino) + `lib/time` (`AppClock` seam). `Gate:` DB round-trip test (test
  DB) + env-parse unit test. `ACs:` NFR-1.1, NFR-1.4, NFR-8.1. `Inv:` INV-3, INV-4, INV-11. `Deps:` T0.1.
  `Ask:` —
- **COMPLETE (#5) · T0.4 — App shell, navigation & route contract.**
  `Build:` authed `(app)` route group layout — left drawer (team-switcher slot + module nav), app bar
  (title, search/quarter/week/profile slots, theme toggle), responsive collapse; **the INV-8 route
  helper** (`/t/[teamId]/…`); placeholder module pages; app-wide not-found + error boundary. `Gate:`
  component tests (shell + each placeholder; drawer toggle; route builder). `ACs:` FR-2.3 (shell),
  NFR-7.2, NFR-9.1. `Inv:` INV-7, INV-8. `Deps:` T0.2. `Ask:` —
- **COMPLETE (#6) · T0.5 — Gate, CI & test infra.**
  `Build:` `scripts/gate.sh` (+ the ≥80% logic-surface coverage thresholds in Vitest config); Vitest +
  Testing Library config; **a transactional test-DB harness + test-data factories**; Playwright config +
  one smoke E2E; GitHub Actions running the gate on PRs to `main`; git hooks + `install-hooks.sh`;
  `prisma/seed.ts` scaffold. `Gate:` the gate runs green in CI. `ACs:` NFR-6.4. `Inv:` INV-3, INV-11.
  `Deps:` T0.3, T0.4. `Ask:` —
- **COMPLETE (#7) · T0.6 — Shared primitives & client-data layer.**
  `Build:` state components (`LoadingState`/`EmptyState`/`ErrorState`/`NotFound`), the **`StatusChip`**
  primitive (from T0.2's map), `lib/query` (TanStack Query client + centralized keys) wired SSR-safe, and
  the **`useOptimisticMutation`** helper (snapshot → rollback+retry → invalidate). `Gate:` component tests
  for each state; an optimistic-rollback unit test for the helper. `ACs:` NFR-5.1, NFR-3.3, NFR-9.1.
  `Inv:` INV-5, INV-6, INV-7. `Deps:` T0.2, T0.4. `Ask:` —

---

## Milestone 1 — Identity, Org, Teams & RBAC

**Objective:** everyone signs in with Google or Microsoft; the org (one `Organization` holding a
Leadership Team + 4 depts × 5 teams) exists as data; team context, team-scoped read (Admins read all),
role-scoped edit, org-scoped data-access, the **`authorizedAction` seam**, and the Admin area all work.
The backbone every module depends on. **ACs:** FR-1, FR-2 (+ FR-2.7).

- **COMPLETE (#9) · T1.1 — Google + Microsoft sign-in & session.**
  `Build:` Auth.js v5 + `@auth/prisma-adapter`, Google + Microsoft Entra ID providers, **server-side
  domain/tenant allowlist in the `signIn` callback**, **verified-email account-linking** (either provider
  → one user — enabled deliberately per AC-1.1.4, both IdPs verify email), **`Organization` resolved from
  the email domain/tenant**, the two-button sign-in screen, sign-out, route protection. `Gate:` unit
  tests for allow/deny × both providers + email-match/link + org resolution; sign-in component test.
  `ACs:` FR-1.1, FR-1.3, FR-1.4, FR-2.7. `Inv:` INV-2, INV-11. `Deps:` T0.3. `Ask:` the exact allowed
  domain(s) + Entra tenant id.
- **COMPLETE (#8) · T1.2 — Org/identity schema + seed.**
  `Build:` Prisma models `Organization`, `User` (+ `isAdmin`, `jobTitle`, `homeTeamId`), `Department`,
  `Team` (dept FK; Leadership flag; `archivedAt`), `Membership` (`teamRole` ∈ {LEAD, MEMBER}),
  `ActivityLog`, **`QuarterDefinition` (`orgId`, `fiscalYear`, `index` 1–4, `label`, `startsOn`,
  `endsOn`)** — **every table carries `orgId`**. Migration + `seed.ts`: one org, Leadership + 4 depts × 5
  teams, demo users/memberships, **and this & adjacent years' calendar quarter definitions** (the
  configurable default). `Gate:` migration applies; seed idempotency; cross-org isolation test (org A
  query never returns org B). `ACs:` FR-2.1, FR-2.2, FR-2.6, FR-2.7, FR-3.2 (AC-3.2.4 storage). `Inv:`
  INV-2, INV-4, INV-10, INV-11. `Deps:` T0.3. `Ask:` seed a demo org only, or also import the real
  100-person roster (CSV)?
- **COMPLETE (#10) · T1.3 — Authorization layer + `authorizedAction` seam.**
  `Build:` pure predicates `canReadTeam` (member **or** admin), `canEditTeam`, `isTeamLead`, `isAdmin`,
  `canManageOrg`; the `requireUser()` session helper; the **`authorizedAction` wrapper** (INV-1); and the
  data-access wrappers applying **org + team scoping in one place** (INV-2). Fully unit-tested against the
  FR-1.2 matrix. `Gate:` exhaustive permission-matrix unit tests + org-scoping test + an
  `authorizedAction` test (rejects bad Zod, rejects unauthorized, logs on success). `ACs:` FR-1.2, FR-2.7,
  NFR-1.2, NFR-1.3, NFR-1.5, NFR-4.1. `Inv:` INV-1, INV-2, INV-3. `Deps:` T1.1, T1.2. `Ask:` confirm "any
  member of a team may edit that team's Issues/Todos/Scorecard entries" (structure = Lead/Admin).
- **COMPLETE (#11) · T1.4 — Team switcher & context.**
  `Build:` left-drawer switcher listing the user's teams (Admin sees all), grouped by department,
  Leadership pinned; active team persisted per user + encoded in the route (INV-8); an unreadable team
  isn't listed and a direct link → not-found. `Gate:` component tests (grouping, active state, non-member
  link refused, admin-sees-all). `ACs:` FR-2.3, FR-2.4. `Inv:` INV-7, INV-8. `Deps:` T1.3, T0.4. `Ask:` —
- **COMPLETE (#13) · T1.5 — Admin area.**
  `Build:` manage departments & teams (create/rename/**archive**), users list, memberships, role
  assignment, **and the org's quarter/fiscal definitions** (each quarter's start/end, calendar default);
  confirm dialogs on destructive actions; all writes via `authorizedAction` (→ activity log). Admin-only.
  `Gate:` component tests per flow + server-authz tests (non-admin blocked) + quarter-definition edit
  test. `ACs:` FR-2.5, FR-1.2, FR-2.6, FR-3.2 (AC-3.2.4). `Inv:` INV-1, INV-6, INV-7, INV-10. `Deps:`
  T1.3, T1.2. `Ask:` —
- **COMPLETE (#12) · T1.6 — Activity log viewer.**
  `Build:` the append-only log is written **through `authorizedAction`** (INV-10); a viewer (Admin sees
  all; a team sees its own activity). `Gate:` log-write unit test; viewer component + scoping test. `ACs:`
  FR-2.6. `Inv:` INV-1, INV-2, INV-7. `Deps:` T1.3. `Ask:` —

---

## Milestone 2 — Rocks

**Objective:** quarterly priorities at Company/Team/Individual levels — milestones, statuses, the
quarter selector (org-configurable), and company→team roll-up. **ACs:** FR-3 (+ FR-7.3 selector).

- **COMPLETE (#14) · T2.1 — Rocks schema + data access.**
  `Build:` `Rock` (title, description, ownerId, level ∈ {COMPANY, TEAM, INDIVIDUAL}, teamId nullable,
  quarterRef, dueDate, status), `Milestone` (rockId, title, dueDate, done, order), `RockLink`
  (companyRockId ↔ teamRockId); migration + scoped data-access; **expose `myItemsFor`/`teamSummary`**
  (INV-9). `Gate:` repository + scoping tests. `ACs:` FR-3.1–3.4, NFR-1.3. `Inv:` INV-2, INV-9. `Deps:`
  T1.3. `Ask:` —
- **COMPLETE (#15) · T2.2 — Rocks domain (pure).**
  `Build:` **quarter resolution from `QuarterDefinition`s with calendar fallback** (current quarter,
  quarter list, **quarter-closed** check), status model, milestone progress, company→team status roll-up.
  `Gate:` domain unit tests — quarter boundaries for **calendar and a custom fiscal year**, closed check,
  rollup, progress. `ACs:` FR-3.2 (incl. AC-3.2.3, AC-3.2.4), FR-3.3, FR-3.4. `Inv:` INV-3, INV-4.
  `Deps:` none. `Ask:` —
- **COMPLETE (#16) · T2.3 — Rocks list + quarter selector + filters.**
  `Build:` team Rocks for the selected quarter — owner, `StatusChip`, milestone progress; filter by
  owner/status/level; **quarter selector (driven by definitions)** in the app bar, default current; four
  states. `Gate:` component tests per state + filter. `ACs:` FR-3.5, FR-7.3, NFR-9.1. `Inv:` INV-6,
  INV-7, INV-8. `Deps:` T2.1, T2.2, T0.4. `Ask:` —
- **COMPLETE (#17) · T2.4 — Create/edit Rock + status update.**
  `Build:` RHF + Zod form (title/owner/level/quarter/due); status change optimistic; **edits to a Rock in
  a closed quarter are refused server-side (Admin override)** (AC-3.2.3); permission-gated per level; all
  writes via `authorizedAction`. `Gate:` form-validation + optimistic-rollback + server-authz +
  closed-quarter-refused tests. `ACs:` FR-3.1, FR-3.2 (incl. AC-3.2.3), NFR-5.1. `Inv:` INV-1, INV-5,
  INV-6. `Deps:` T2.3, T1.6. `Ask:` —
- **COMPLETE (#18) · T2.5 — Milestones.**
  `Build:` Rock detail with a milestone checklist — add/complete/reorder (dnd-kit); `done/total` progress.
  `Gate:` component + reorder-persist tests. `ACs:` FR-3.3. `Inv:` INV-1, INV-5. `Deps:` T2.4. `Ask:` —
- **COMPLETE (#19) · T2.6 — Company→Team linking + roll-up.**
  `Build:` link supporting Team Rocks to a Company Rock; Company Rock shows the rolled-up status; each
  Team Rock links back. `Gate:` rollup component test. `ACs:` FR-3.4. `Inv:` INV-6. `Deps:` T2.2, T2.4.
  `Ask:` —

---

## Milestone 3 — Data / Scorecard

**Objective:** the signature EOS screen — a 13-week grid of measurables with inline weekly entry, goal
evaluation, and trends. **ACs:** FR-4.

- **COMPLETE (#20) · T3.1 — Scorecard schema + data access.**
  `Build:` `Measurable` (name, ownerId, teamId, goalValue, comparator, format/unit, order, `archivedAt`)
  + `WeeklyEntry` (measurableId, isoYear, isoWeek, value nullable), **unique (measurable, isoYear,
  isoWeek)**; scoped data-access. `myItemsFor` (red measurables I own) + `teamSummary` (INV-9) fold into
  T3.2 — they need the comparator/goal eval. `Gate:` repository + scoping + uniqueness tests.
  `ACs:` FR-4.1, FR-4.2, NFR-1.3. `Inv:` INV-2, INV-9. `Deps:` T1.3. `Ask:` —
- **COMPLETE (#21) · T3.2 — Scorecard domain (pure).**
  `Build:` comparator/goal evaluation (≥, ≤, =, >, <, between; **empty = neutral, empty ≠ 0**); ISO-week
  math (13-week trailing window, Monday start, window paging); row summary (avg/total + hit-rate "9/13 on
  goal"). `Gate:` domain unit tests (each comparator, week boundaries, empty vs 0). `ACs:` FR-4.3, FR-4.2.
  `Inv:` INV-3, INV-4. `Deps:` none. `Ask:` —
- **COMPLETE (#22) · T3.3 — Scorecard grid (MUI X DataGrid).**
  `Build:` rows = measurables, **columns = 13 ISO weeks, newest-left** (FR-4.2), current-week highlight,
  window paging, `GoalCell` (green/red **+ marker + a11y label**), keyboard nav (arrows/Enter), row header
  = measurable. Admin can view/edit any team. `Gate:` component tests (render, color+marker, keyboard nav,
  access control). `ACs:` FR-4.2, FR-4.3, FR-4.4, NFR-3.2, NFR-3.3. `Inv:` INV-6, INV-7, INV-8. `Deps:`
  T3.1, T3.2, T0.4. `Ask:` —
- **COMPLETE (#23) · T3.4 — Inline weekly entry (optimistic).**
  `Build:` edit/clear a cell inline; `useOptimisticMutation` save + visible rollback on failure; **empty
  vs 0 preserved**. `Gate:` optimistic-rollback + empty/0 tests; server-authz (non-member cell blocked).
  `ACs:` FR-4.2, NFR-5.1. `Inv:` INV-1, INV-5. `Deps:` T3.3. `Ask:` —
- **T3.5 — Manage measurables.**
  `Build:` add/edit/reorder (dnd-kit)/**archive** measurable + assign owner (Team Lead/Admin); **archive
  writes the activity log** (INV-10). `Gate:` form + reorder + archive-logs-activity tests; authz test.
  `ACs:` FR-4.1, FR-2.6. `Inv:` INV-1, INV-10. `Deps:` T3.3, T1.6. `Ask:` —
- **COMPLETE · T3.6 — Trend & summary.**
  `Build:` row 13-week summary cell; expand a measurable → MUI X Charts trend with the goal line + entry
  history + a **chart text alternative**. `Gate:` summary unit test; chart component test incl. text-alt.
  `ACs:` FR-4.3, FR-4.5, NFR-3.5. `Inv:` INV-3, INV-7. `Deps:` T3.2, T3.3. `Ask:` —
- **T3.7 — BUG: Google sign-in fails (400 invalid_request, `flowName=GeneralOAuthFlow`).**
  `Symptom:` clicking "Sign in with Google" returns Google error 400 `invalid_request` before consent.
  `Build:` make Google OAuth complete end-to-end in dev + prod. Likely causes, check in order:
  (1) the **Authorized redirect URI** in the Google Cloud OAuth client doesn't exactly match Auth.js's
  callback — must list `http://localhost:3000/api/auth/callback/google` (dev) **and** the deployed
  `https://<domain>/api/auth/callback/google` (no trailing slash, scheme + host exact);
  (2) **Authorized JavaScript origins** missing `http://localhost:3000` / the prod origin;
  (3) env: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` set + loaded, `AUTH_URL` correct, `AUTH_TRUST_HOST=true`
  behind the proxy, `AUTH_SECRET` present;
  (4) OAuth consent screen still in **Testing** without the signing-in address on the test-user list;
  (5) the Google client is **Web application** type (not Desktop/other).
  `Gate:` document the fixed config in the PR; add an `AUTH`-tagged log on sign-in start/callback for the
  debug surface; manual acceptance: a domain user signs in with Google and lands authenticated (OAuth
  round-trip can't run in the gate). Confirm Microsoft Entra still works with the same callback shape.
  `ACs:` FR-1.1, NFR (identity). `Inv:` INV-11 (secrets in env only). `Deps:` M0 auth. `Ask:` — report
  the exact prod domain + which providers/envs are configured if the cause isn't obvious from the console.

---

## Milestone 4 — Todos

**Objective:** 7-day action items — owner, due date, completion, carry-over, and a cross-team "My Todos".
Built **before** Issues so the Issues→Todo conversion has a target. **ACs:** FR-6.

- **COMPLETE (#27) · T4.1 — Todos schema + data access.**
  `Build:` `Todo` (title, notes, ownerId, teamId, dueDate, done, completedAt, sourceIssueId?,
  sourceRockId?); scoped data-access; expose `myItemsFor` + `teamSummary` (INV-9). `Gate:` repository +
  scoping tests. `ACs:` FR-6.1, FR-6.2, NFR-1.3. `Inv:` INV-2, INV-9. `Deps:` T1.3. `Ask:` —
- **COMPLETE (#28) · T4.2 — Team Todos screen.**
  `Build:` open/done lists; add (RHF + Zod, **due default +7**), edit/delete; four states. `Gate:`
  component tests per state + add/validation. `ACs:` FR-6.1, NFR-9.1. `Inv:` INV-1, INV-7. `Deps:` T4.1,
  T0.4. `Ask:` —
- **COMPLETE (#29) · T4.3 — Complete, overdue & carry-over.**
  `Build:` optimistic done/undone; **overdue cue = color + icon/label**; age indicator on carried-over
  items (pure overdue/age helper). `Gate:` overdue/age unit tests + optimistic-rollback test. `ACs:`
  FR-6.3, FR-6.4, NFR-3.3, NFR-5.1. `Inv:` INV-3, INV-5, INV-6. `Deps:` T4.2. `Ask:` —
- **COMPLETE (#30) · T4.4 — My Todos (cross-team).**
  `Build:` aggregate the user's open+overdue Todos across all teams (via INV-9), due-sorted,
  grouped/filterable by team, deep-linking into each team. `Gate:` aggregation unit + component test.
  `ACs:` FR-6.5. `Inv:` INV-8, INV-9. `Deps:` T4.3. `Ask:` —

---

## Milestone 5 — Issues (IDS)

**Objective:** short-term + long-term lists with ranking, the solve flow, and conversion of a solved
issue into a Todo or Rock with a two-way link. **ACs:** FR-5.

- **COMPLETE (#31) · T5.1 — Issues schema + data access.**
  `Build:` `Issue` (title, description, raiserId, ownerId?, listType ∈ {SHORT, LONG}, rank, solved,
  solvedAt, solvedById, resolutionNote, createdTodoId?, createdRockId?); scoped data-access; expose
  `myItemsFor` (assigned to me) + `teamSummary` (INV-9). `Gate:` repository + scoping tests. `ACs:`
  FR-5.1, FR-5.2, NFR-1.3. `Inv:` INV-2, INV-9. `Deps:` T1.3. `Ask:` —
- **COMPLETE (#32) · T5.2 — Issues screen.**
  `Build:` short-term + long-term lists, add issue (title required, raiser defaults to me), **top-3 of
  short-term emphasized**; four states. `Gate:` component tests per state + add. `ACs:` FR-5.1, FR-5.2,
  FR-5.3 (emphasis), NFR-9.1. `Inv:` INV-1, INV-7. `Deps:` T5.1, T0.4. `Ask:` —
- **COMPLETE · T5.3 — Rank & move.**
  `Build:` reorder within a list (dnd-kit) with persisted rank; move an issue between short-term and
  long-term. `Gate:` reorder-persist + move tests. `ACs:` FR-5.3, FR-5.1. `Inv:` INV-1, INV-5. `Deps:`
  T5.2. `Ask:` —
- **COMPLETE · T5.4 — Solve flow.**
  `Build:` mark solved (+ optional resolution note), record solver/solved-at (activity log), move to a
  solved/archived view (still readable); optimistic. `Gate:` solve + archive + rollback tests. `ACs:`
  FR-5.4, FR-2.6, NFR-5.1. `Inv:` INV-1, INV-5, INV-10. `Deps:` T5.2, T1.6. `Ask:` —
- **T5.5 — Convert to Todo / Rock.**
  `Build:` from a solving issue, create a Todo (due +7) or a Rock, pre-filled, on the same team, with a
  **two-way link** both directions. `Gate:` conversion unit tests (fields carried, links set both ways).
  `ACs:` FR-5.5. `Inv:` INV-1. `Deps:` T5.4, T4.1, T2.1. `Ask:` —

---

## Milestone 6 — My Week home + Team dashboards

**Objective:** replace the placeholder landing with the aggregated personal "My Week", and give each team
a summary dashboard as its landing — **assembled from the INV-9 contracts**, not new reach-ins. **ACs:**
FR-7.

- **T6.1 — Aggregation assembly.**
  `Build:` compose each module's `myItemsFor(user)` (current-quarter Rocks, open/overdue Todos, red
  measurables I own, Issues assigned to me) and `teamSummary(teamId)` into My-Week and team-dashboard
  view models; pure shaping; bounded (NFR-2.3). `Gate:` aggregation unit tests across multiple teams.
  `ACs:` FR-7.1, FR-7.2. `Inv:` INV-3, INV-9. `Deps:` T2.1, T3.1, T4.1, T5.1. `Ask:` —
- **T6.2 — My Week home.**
  `Build:` the personal landing — four aggregate panels, deep links (INV-8), four states (inviting
  empty); becomes the post-login route. `Gate:` component tests per state + deep-link targets. `ACs:`
  FR-7.1, NFR-9.1. `Inv:` INV-6, INV-7, INV-8. `Deps:` T6.1. `Ask:` —
- **T6.3 — Team dashboard.**
  `Build:` per-team landing summarizing all four modules (Rocks on-track, this week's Scorecard
  red/green, open Issues short/long, Todos open/due) with quick links. `Gate:` component test + counts.
  `ACs:` FR-7.2. `Inv:` INV-6, INV-7, INV-8. `Deps:` T6.1. `Ask:` —
- **T6.4 — Time context wiring.**
  `Build:` quarter selector (Rocks) + current-week anchor (Scorecard/Todos) in the app bar, default
  today, persisted, historical browse — consumed consistently by the modules. `Gate:` context
  unit/component tests. `ACs:` FR-7.3. `Inv:` INV-4, INV-8. `Deps:` T2.3, T3.3. `Ask:` —

---

## Milestone 7 — Polish: search, notifications, a11y/perf/responsive

**Objective:** the cross-cutting layer that makes it feel finished. **ACs:** FR-8, NFR-2/3/7/9.

- **T7.1 — Global search.**
  `Build:` cross-module search over **readable teams only**, grouped results with deep links. `Gate:`
  search-query unit tests + component test. `ACs:` FR-8.1. `Inv:` INV-2, INV-8. `Deps:` M2–M5. `Ask:` —
- **T7.2 — In-app notifications.**
  `Build:` notify on assignment (Todo/Issue/Rock) + an owned Todo going overdue; non-blocking center,
  dismissable. `Gate:` notification-trigger unit tests + component test. `ACs:` FR-8.2. `Inv:` INV-3,
  INV-7. `Deps:` M2–M5. `Ask:` —
- **T7.3 — Accessibility pass.**
  `Build:` sweep every screen for keyboard operability, focus states, contrast (both themes),
  screen-reader labels/roles, 200% zoom, chart text-alternatives; fix gaps. `Gate:` a11y assertions in
  component tests; documented manual SR/zoom checks. `ACs:` NFR-3.\*. `Inv:` INV-6, INV-7. `Deps:` M6.
  `Ask:` —
- **T7.4 — Performance pass.**
  `Build:` Scorecard virtualization/efficiency to NFR-2.2, route prefetch, bundle trim, bounded-query
  audit. `Gate:` perf-sensitive unit tests; documented measurements vs NFR-2. `ACs:` NFR-2.\*. `Inv:`
  INV-2. `Deps:` M6. `Ask:` —
- **T7.5 — Responsive & design-review sweep.**
  `Build:` tablet/phone layouts (drawer collapse, grid horizontal scroll, stacked dashboards),
  empty/error polish, and a full `/design-review` pass across all screens to ≥ 4/5. `Gate:` responsive
  component tests at breakpoints; design scorecards in the PR. `ACs:` NFR-7.2, NFR-9.1. `Inv:` INV-6,
  INV-7. `Deps:` M6. `Ask:` —

---

## Ideas & future opportunities (explicitly OUT of v1 scope)

Captured so they're not lost — **do not build without the user's go-ahead** (each would be a new
milestone). v1 is exactly the four modules.

1. **Meeting / L10 mode** — a guided weekly-meeting view (Scorecard → Rocks → Todos → IDS on a timer),
   read-mostly. The natural first extension.
2. **Email / Slack digests** — would add the project's first external egress (revisit NFR-4.4).
3. **V/TO, Accountability Chart / People, Headlines, 1-on-1s** — the rest of the EOS toolset.
4. **Real-time co-editing** — live multiplayer on the Scorecard (websockets/CRDT); today's model is
   optimistic single-field writes (NFR-5.3).
5. **Analytics & history** — quarter-over-quarter Rock completion, measurable trends beyond 13 weeks,
   issue cycle-time.
6. **CSV / Sheets import/export** for measurables and weekly data.

## Open decisions

Surface each at its ticket's `Ask` (above) rather than up front.

1. **Quarter definition — RESOLVED (2026-10-04):** quarters are **org-configurable** with explicit
   start/end dates (Admin-set in T1.5), **defaulting to calendar quarters** (Q1 = Jan–Mar). Storage
   `QuarterDefinition` (T1.2); math (T2.2); selectors (T2.3/T6.4).
2. **Scorecard column order — RESOLVED (2026-10-04):** **newest-left** (FR-4.2). CLAUDE.md aligned.
3. **Week start / timezone** — assume ISO week, Monday start, stored UTC, displayed in the viewer's tz.
   Confirm at T3.2 if different.
4. **Who may edit a team's Issues/Todos/Scorecard entries** — assume **any member of that team** (Lead/
   Admin for structure). Confirm at T1.3 (`Ask`).
5. **Allowed domain(s) + Entra tenant** — single Workspace domain + single tenant assumed; get the exact
   values at T1.1 (`Ask`).
6. **Seed vs. real org import** — M1 seeds a demo org; decide at T1.2 (`Ask`) whether to also import the
   real 100-person roster (CSV).
7. **Company name / branding** — working name "Cadence", Google-blue seed; swap for the real brand
   whenever (reversible — internal tool).
