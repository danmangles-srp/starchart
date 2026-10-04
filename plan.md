# plan.md — Cadence

> The ordered **HOW** for **Cadence** — an internal, multi-user web platform that runs our company's EOS
> operations (Rocks, Data/Scorecard, Issues, Todos) for ~100 people across a Leadership Team and 4
> departments of 5 teams each.
>
> **Restart here:** the [Plan of Attack](#plan-of-attack-restart-here) is the single source of truth for
> **what is done** and **what to do next**, in order. Each **ticket = 1 PR** off `dev`, in dependency
> order; don't start the next until the current one's gate exits `0` and its PR is open.
>
> Read **Architecture decisions** and the **Dependency matrix** first — they're authoritative for the
> stack. Source of truth for *what* is `requirements.md` (FR-* / NFR-*); its ACs are the definition of
> done.

## Architecture decisions

1. **Web app, not mobile.** Desktop-first responsive web (usable down to tablet; phone for quick
   actions). There is **no native app** in scope.
2. **Full-stack Next.js (App Router) + TypeScript (strict).** One codebase: React Server Components for
   reads where sensible, **server actions / route handlers** for every mutation. Feature-first under
   `src/features/<feature>/{components,server,domain,data}` (see `structure`).
3. **PostgreSQL via Prisma is the single source of truth.** No second store, no client-owned state of
   record. Schema changes ship as committed Prisma migrations.
4. **Auth = Google or Microsoft, domain/tenant-restricted, via Auth.js (NextAuth v5).** Google provider
   + Microsoft Entra ID provider; only the company's Workspace domain(s) / Entra tenant may sign in; the
   check is server-side. A person is keyed by **verified work email**, so either provider resolves to the
   same user. Sessions are secure http-only cookies.
5. **Authorization is server-side on every mutation.** Three roles — **Admin** (global), **Team Lead**
   (per team), **Member**. **Reads are team-scoped** — you see only teams you're on, while an **Admin**
   reads (and manages) every team in the organization; edits scoped by membership + role. All scoping lives
   in one data-access layer, never ad-hoc per query.
6. **UI = MUI (Material UI) v6 + MUI X.** Material 3 scheme seeded from **Google blue `#1a73e8`**, light
   **and** dark (system default + toggle). **MUI X DataGrid** powers the Scorecard; **MUI X Charts** the
   trends; **MUI X Date Pickers** the quarter/week/date controls. Mixed density (compact grids,
   comfortable elsewhere).
7. **Client data layer = TanStack Query** for cache + **optimistic writes with rollback** (scorecard
   cells, todo checkboxes, rock status). Server actions do the write; React Query owns the perceived
   latency. **No lost input on failure** (NFR-5).
8. **Validation = Zod everywhere** (server action inputs + form schemas via react-hook-form). The client
   is never trusted; the server re-validates and re-authorizes.
9. **Status is never color-alone.** Green/amber/red always pairs with an icon + label (rock status,
   scorecard cells, overdue todos) — accessibility + clarity (NFR-3).
10. **Archive, don't hard-delete** teams/measurables/issues so history and the activity log survive.
11. **No external egress in v1.** No email, Slack, or third-party analytics. The only outbound call is
    Google OAuth. (Email/Slack digests are Ideas, not v1.)
12. **Deploy on Vercel**; Postgres via Vercel Postgres / Neon. Secrets live in env/Vercel settings only —
    never in the repo or the client bundle.
13. **v1 cut = M0–M7.** M0–M5 build the shell + identity + the four modules; M6 adds the aggregated home
    and team dashboards; M7 is the cross-cutting polish (search, notifications, a11y/perf/responsive).
14. **Org-ready multi-tenancy, single org in v1.** A top-level `Organization` is the tenant: every model
    carries `orgId` and the data-access layer scopes every query by it, so cross-org isolation is
    structural, not something each feature re-implements. v1 seeds and runs **one** organization; a
    second org can be added later with no migration of existing rows. Sign-in resolves a user's
    organization from their email domain/tenant. "An Admin reads the whole org" means their own org.

## Dependency matrix

Pinned at **M0**; exact versions recorded in the M0 PR. If a version is unavailable/incompatible, bump
to the nearest compatible stable, keep codegen/runtime pairs in lockstep, and record it in the PR.

| Concern | Package(s) | Notes |
| --- | --- | --- |
| Framework | `next` (App Router, RSC) + `react` / `react-dom` | TypeScript strict |
| Language/tooling | `typescript`, `eslint` (`next/core-web-vitals`, `@typescript-eslint`), `prettier` | lint + format surface |
| UI | `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` | Material 3, SSR emotion cache |
| Data grid / charts / pickers | `@mui/x-data-grid`, `@mui/x-charts`, `@mui/x-date-pickers` | Scorecard, trends, date/quarter/week |
| Auth | `next-auth` (v5 / Auth.js) + `@auth/prisma-adapter` | Google + Microsoft Entra ID providers, domain/tenant-restricted, verified-email account linking |
| DB / ORM | `prisma` (dev) + `@prisma/client`, PostgreSQL | single source of truth; migrations committed |
| Client cache / mutations | `@tanstack/react-query` | optimistic writes + rollback |
| Forms / validation | `react-hook-form`, `zod`, `@hookform/resolvers` | shared Zod schemas client+server |
| Dates | `date-fns` (+ `date-fns-tz`) | ISO weeks (Mon start), quarters, tz-aware display |
| Drag-reorder | `@dnd-kit/core` + `@dnd-kit/sortable` | Issues ranking, measurable reorder |
| Env safety | a typed env module (e.g. `@t3-oss/env-nextjs` + `zod`) | fail fast on missing secrets |
| Logging | `pino` behind an injected `AppLogger` | tags `AUTH/ORG/ROCKS/DATA/ISSUES/TODOS/HOME/DB/API/CORE` |
| Unit/component tests | `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react` | logic + screen states |
| E2E | `playwright` (`@playwright/test`) | critical flows; not in the per-commit gate |
| Package manager | `pnpm` | lockfile committed |
| Deploy / DB host | Vercel + Vercel Postgres / Neon | preview deploy per PR |

---

## Plan of Attack (restart here)

> Status as of **2026-10-04**. Greenfield — nothing built yet. The old Rivendell plan has been fully
> replaced. Execute top-down; one ticket = one PR off `dev`.

### Status board

| Milestone | State |
| --- | --- |
| M0 Foundation & app shell | **NEXT** |
| M1 Identity, Org, Teams & RBAC | PLANNED |
| M2 Rocks | PLANNED |
| M3 Data / Scorecard | PLANNED |
| M4 Todos | PLANNED |
| M5 Issues (incl. solve → convert) | PLANNED |
| M6 My Week home + Team dashboards | PLANNED |
| M7 Polish: search, notifications, a11y/perf/responsive | PLANNED |

### Execution loop (per ticket)

Confirm scope + ACs (`requirements.md`) → branch `<type>/t<n>-<slug>` off `dev` → failing test mapped to
an AC → minimum code to pass → refactor to `structure` → **self-review** (`/code-review` + `/design-review`
for UI) → `sh scripts/gate.sh` green → write the "How to verify" steps → check in with the user → commit
(Conventional Commits, lowercase, no emoji, no Co-authored-by) → PR targeting **`dev`** (never `main`) →
squash-merge → mark the ticket `COMPLETE (#PR)` here.

---

## Milestone 0 — Foundation & app shell

**Objective:** A building, type-checked, test-covered Next.js skeleton with the MUI theme, Prisma/Postgres
wired, the app shell (left drawer + app bar), and a green gate + CI — before any feature or auth lands.

### User stories
- As a developer, I want a deterministic bootstrap (one command set) so the app builds, lints, tests,
  and deploys from commit one.
- As a user, I want the app to *look* like a polished Material product the moment it loads, in light or
  dark, even before features exist.

### Acceptance criteria
- `sh scripts/gate.sh` exits 0 on the empty app (typecheck → lint → format → unit test + coverage floor →
  `next build`).
- The app shell renders the left drawer, top app bar, and a responsive content area with placeholder
  module routes; light/dark follow the OS and a toggle persists.
- A Playwright smoke test loads the shell. CI runs the gate on every PR; a Vercel preview deploys.

### Tickets
- **T0.1 — Repo & toolchain bootstrap.** `pnpm` + Next.js (App Router, TS strict) + ESLint
  (`next/core-web-vitals` + `@typescript-eslint`) + Prettier; `tsconfig` strict; base npm scripts
  (`dev/build/lint/format/typecheck/test`); `git init`, `dev` branch, `.gitignore`, `.env.example`.
  *Gate:* `pnpm build` + `pnpm lint` clean on the starter. *ACs:* none (infra). *Deps:* none.
- **T0.2 — MUI theme system.** Material 3 theme seeded from Google blue `#1a73e8`; light + dark palettes;
  type scale, spacing/radius tokens, **status colors (on-track/at-risk/off-track, each with an icon
  mapping)**; SSR-safe emotion cache (App Router); `ThemeProvider` + persisted light/dark/system toggle.
  No hardcoded colors/sizes anywhere else after this. *Gate:* theme unit test (token resolution,
  status→color+icon map). *ACs:* FR-8.3, NFR-3.1. *Deps:* T0.1.
- **T0.3 — Prisma + Postgres + env + logger.** Prisma init, Postgres connection, `db` client singleton,
  typed env module (fail fast on missing vars), baseline empty migration, and the tagged `AppLogger`
  (pino). *Gate:* a DB round-trip test against a test database; env-parse unit test. *ACs:* NFR-1.1,
  NFR-1.4, NFR-8.1. *Deps:* T0.1.
- **T0.4 — App shell & navigation.** Authed-route group layout: left drawer (team-switcher slot + module
  nav items), top app bar (title, search slot, quarter/week slot, profile slot, theme toggle), responsive
  collapse to a temporary drawer on tablet/phone; placeholder pages for Home/Rocks/Scorecard/Issues/Todos/
  Admin; app-wide `not-found` + error boundary. *Gate:* component tests render shell + each placeholder;
  drawer toggles. *ACs:* FR-2.3 (shell), NFR-7.2, NFR-9.1. *Deps:* T0.2.
- **T0.5 — Gate, CI & test infra.** `scripts/gate.sh` (typecheck → lint → format check → `vitest run
  --coverage` with the ≥80% logic floor → `next build`); Vitest + Testing Library config; Playwright
  config + one smoke E2E; GitHub Actions running the gate on PRs to `dev`; git hooks
  (`commit-msg`/`pre-commit`/`pre-push`) + `install-hooks.sh`; a `prisma/seed.ts` scaffold. *Gate:* the
  gate runs green in CI. *ACs:* NFR-6.4. *Deps:* T0.3, T0.4.

---

## Milestone 1 — Identity, Org, Teams & RBAC

**Objective:** Everyone signs in with Google or Microsoft; the org (one `Organization` tenant holding a
Leadership Team + 4 depts × 5 teams) exists as data; team context, team-scoped read (Admins read every
team in their org), role-scoped edit, org-scoped data-access, and the Admin area all work. This is the
backbone every module depends on.

### User stories
- As an employee, I want to sign in with my company Google or Microsoft account and immediately be known.
- As a member, I want to switch between the teams I'm on and read their data.
- As an Admin, I want to read every team in the organization.
- As an Admin, I want to manage departments, teams, people, and roles without a redeploy.

### Acceptance criteria (see FR-1, FR-2)
- Only allowed-domain/tenant Google or Microsoft accounts can sign in; others are cleanly refused.
- The team switcher lists the teams a user belongs to (an Admin sees all 21), grouped by department
  (Leadership pinned); the active team persists and is encoded in the URL.
- A Member/Team Lead can read only the teams they're on — another team isn't listed and a direct link is
  refused (server-enforced); an Admin can read and manage any team.
- Admins can CRUD/archive teams & departments and assign memberships + roles; sensitive actions are
  logged.

### Tickets
- **T1.1 — Google + Microsoft sign-in & session.** Auth.js v5 + `@auth/prisma-adapter`, **Google** and
  **Microsoft Entra ID** providers, **server-side domain/tenant allowlist**, **verified-email account
  linking** (either provider → one user), the user's **`Organization` resolved from their email
  domain/tenant**, sign-in screen ("Sign in with Google" + "Sign in with Microsoft"), sign-out, and
  route protection (unauthenticated → sign-in). *Gate:* unit tests for the domain/tenant-allow check
  (allow/deny, both providers) + the email-match/link rule + org resolution; a component test for the
  sign-in screen. *ACs:* FR-1.1, FR-1.3, FR-1.4, FR-2.7. *Deps:* T0.3.
- **T1.2 — Org/identity schema + seed.** Prisma models: `Organization` (the tenant), `User` (+ global
  `isAdmin`, `jobTitle`, `homeTeamId`), `Department`, `Team` (belongs to a department; Leadership
  flagged), `Membership` (`userId`, `teamId`, `teamRole` ∈ {LEAD, MEMBER}), `ActivityLog`. **Every table
  carries `orgId`** (FR-2.7). Migration + a `seed.ts` creating one organization, its Leadership team, 4
  departments × 5 teams, and demo users/memberships for local dev. *Gate:* schema/migration applies;
  seed idempotency test; a cross-org isolation test (a query for org A never returns org B rows). *ACs:*
  FR-2.1, FR-2.2, FR-2.6, FR-2.7. *Deps:* T0.3.
- **T1.3 — Authorization layer (pure + enforced).** Pure permission functions —
  `canReadTeam` (member **or** admin), `canEditTeam`, `isTeamLead`, `isAdmin`, `canManageOrg` — plus the
  session helper (`requireUser`) and the data-access wrappers that apply **org + team scoping** in one
  place (every query filtered by `orgId`, then team membership/role). Fully unit-tested against the
  matrix in FR-1.2. *Gate:* exhaustive permission-matrix unit tests + an org-scoping test. *ACs:*
  FR-1.2, FR-2.7, NFR-1.2, NFR-1.3, NFR-1.5, NFR-4.1. *Deps:* T1.1, T1.2.
- **T1.4 — Team switcher & context.** Left-drawer switcher listing the user's teams (an Admin sees all),
  grouped by department, Leadership pinned; active-team context persisted per user + encoded in the
  route; a team the user can't read is not listed and a direct link lands on a not-found/forbidden view.
  *Gate:* component tests (grouping, active state, non-member link refused, admin-sees-all). *ACs:*
  FR-2.3, FR-2.4. *Deps:* T1.3, T0.4.
- **T1.5 — Admin area.** Manage departments & teams (create/rename/**archive**), users list, memberships
  (add/remove), and role assignment (Admin, per-team Lead/Member); confirm dialogs on destructive
  actions; writes go through the activity log. Admin-only (server-enforced). *Gate:* component tests for
  each admin flow + server-authz tests (non-admin blocked). *ACs:* FR-2.5, FR-1.2, FR-2.6. *Deps:* T1.3.
- **T1.6 — Activity log viewer.** Append-only log write helper (reused by later modules) + a viewer
  (Admin sees all; a team sees its own activity). *Gate:* log-write unit test; viewer component test +
  scoping test. *ACs:* FR-2.6. *Deps:* T1.2, T1.3.

---

## Milestone 2 — Rocks

**Objective:** Quarterly priorities at company/team/individual levels, with milestones, statuses, a
quarter selector, and company→team roll-up.

### User stories
- As a team member, I want to set and track our quarterly Rocks with owners and status.
- As a leader, I want Company Rocks that roll up the supporting Team Rocks beneath them.
- As an owner, I want a milestone checklist under a Rock to show progress.

### Acceptance criteria (see FR-3)
- Rocks can be created at the level the user is permitted for; status uses green/amber/red + icon + label.
- The Rocks screen shows a team's Rocks for the selected quarter, filterable, defaulting to current.
- Milestones show `done/total`; closing a quarter freezes its Rocks (Admin-only edits after).
- A Company Rock shows a roll-up of its linked Team Rocks; each links back.

### Tickets
- **T2.1 — Rocks schema + data access.** `Rock` (title, description, ownerId, level ∈ {COMPANY, TEAM,
  INDIVIDUAL}, teamId nullable for company, quarter, dueDate, status), `Milestone` (rockId, title,
  dueDate, done, order), `RockLink` (companyRockId ↔ teamRockId). Migration + scoped data-access +
  permission wiring. *Gate:* repository + scoping tests. *ACs:* FR-3.1, FR-3.2, FR-3.3, FR-3.4, NFR-1.3.
  *Deps:* T1.3.
- **T2.2 — Rocks domain logic (pure).** Quarter math (current quarter, quarter list, quarter-closed
  check), status model, milestone progress, company→team status roll-up. Pure, fully unit-tested. *Gate:*
  domain unit tests (quarter boundaries, rollup, progress). *ACs:* FR-3.2, FR-3.3, FR-3.4. *Deps:* none.
- **T2.3 — Rocks list screen + quarter selector + filters.** Team Rocks for the selected quarter with
  owner, status chip (color+icon+label), milestone progress; filter by owner/status/level; quarter
  selector in the app bar (defaults to current); loading/empty/error/content states. *Gate:* component
  tests per state + filter. *ACs:* FR-3.5, FR-7.3, NFR-9.1. *Deps:* T2.1, T2.2, T0.4.
- **T2.4 — Create/edit Rock + status update.** RHF + Zod form (title/owner/level/quarter/due); status
  change is optimistic and writes the activity log. Permission-gated per level. *Gate:* form-validation +
  optimistic-rollback tests; server-authz test. *ACs:* FR-3.1, FR-3.2, NFR-5.1. *Deps:* T2.3, T1.6.
- **T2.5 — Milestones.** Rock detail with a milestone checklist: add/complete/reorder (dnd-kit), progress
  updates. *Gate:* component + reorder-persist tests. *ACs:* FR-3.3. *Deps:* T2.4.
- **T2.6 — Company→Team linking + roll-up.** Link supporting Team Rocks to a Company Rock; Company Rock
  shows the rolled-up status; each Team Rock links back. *Gate:* rollup component test. *ACs:* FR-3.4.
  *Deps:* T2.2, T2.4.

---

## Milestone 3 — Data / Scorecard

**Objective:** The signature EOS screen — a 13-week grid of measurables with inline weekly entry, goal
evaluation, and trends.

### User stories
- As a team, I want a weekly Scorecard of our measurables against goals, scanned at a glance.
- As a measurable owner, I want to type this week's number inline and have it save instantly.
- As a leader, I want to see a measurable's 13-week trend against its goal.

### Acceptance criteria (see FR-4)
- Grid: rows = measurables (owner, goal, comparator), columns = trailing 13 weeks (Mon start), current
  week highlighted, earlier windows pageable.
- Cells evaluate green/red vs goal with a **non-color marker** + accessible label; empty ≠ 0; inline
  entry saves optimistically with rollback.
- A Team Lead can add/edit/reorder/retire measurables; each row shows a 13-week summary; a measurable
  expands to a trend chart + history.

### Tickets
- **T3.1 — Scorecard schema + data access.** `Measurable` (name, ownerId, teamId, goalValue, comparator,
  format/unit, order, archived) + `WeeklyEntry` (measurableId, isoYear, isoWeek, value nullable). Unique
  on (measurable, isoYear, isoWeek). Migration + scoped data-access + permissions. *Gate:* repository +
  scoping + uniqueness tests. *ACs:* FR-4.1, FR-4.2, NFR-1.3. *Deps:* T1.3.
- **T3.2 — Scorecard domain (pure).** Comparator/goal evaluation (≥, ≤, =, >, <, between; empty =
  neutral), ISO-week math (13-week trailing window, Monday start, window paging), row summary (avg/total
  + hit-rate like "9/13 on goal"). Pure, fully unit-tested. *Gate:* domain unit tests (each comparator,
  week boundaries, empty vs 0). *ACs:* FR-4.3, FR-4.2. *Deps:* none.
- **T3.3 — Scorecard grid (MUI X DataGrid).** Rows=measurables, columns=13 weeks, current-week highlight,
  window paging, red/green cell render **+ marker + a11y label**, keyboard navigation (arrows/Enter), row
  header = measurable. (Non-members can't open the team; an Admin can view + edit any team.) *Gate:*
  component tests (render, color+marker, keyboard nav, access control). *ACs:* FR-4.2, FR-4.3, FR-4.4,
  NFR-3.2, NFR-3.3. *Deps:* T3.1, T3.2, T0.4.
- **T3.4 — Inline weekly entry (optimistic).** Edit/clear a cell inline; TanStack Query mutation saves
  optimistically and rolls back visibly on failure; empty vs 0 preserved. *Gate:* optimistic-rollback +
  empty/0 tests; server-authz (non-member cell blocked). *ACs:* FR-4.2, NFR-5.1. *Deps:* T3.3.
- **T3.5 — Manage measurables.** Add/edit/reorder (dnd-kit)/retire measurable + assign owner
  (Team Lead/Admin). *Gate:* form + reorder + archive tests; authz test. *ACs:* FR-4.1. *Deps:* T3.3.
- **T3.6 — Trend & summary.** Row 13-week summary cell; expand/open a measurable → MUI X Charts trend
  with the goal line + entry history + chart **text alternative**. *Gate:* summary unit test; chart
  component test incl. text-alt. *ACs:* FR-4.3, FR-4.5, NFR-3.5. *Deps:* T3.2, T3.3.

---

## Milestone 4 — Todos

**Objective:** 7-day action items with owner, due date, completion, carry-over, and a cross-team "My
Todos". (Built before Issues so the Issues→Todo conversion has a target.)

### User stories
- As a team member, I want to capture 7-day action items with an owner and due date.
- As an owner, I want to check a Todo done and see what's overdue.
- As someone on several teams, I want one list of all my open Todos.

### Acceptance criteria (see FR-6)
- Add a Todo (title + owner required, due defaults +7 days); it shows in the team's open list + the
  owner's My Todos.
- Checking done is optimistic; overdue is flagged with a non-color cue; nothing auto-deletes — incomplete
  Todos carry over with an age indicator.
- My Todos aggregates open+overdue across all my teams, sorted by due date, grouped/filterable by team.

### Tickets
- **T4.1 — Todos schema + data access.** `Todo` (title, notes, ownerId, teamId, dueDate, done,
  completedAt, sourceIssueId nullable, sourceRockId nullable). Migration + scoped data-access +
  permissions. *Gate:* repository + scoping tests. *ACs:* FR-6.1, FR-6.2, NFR-1.3. *Deps:* T1.3.
- **T4.2 — Team Todos screen.** Open/done lists, add (RHF + Zod, due default +7), edit/delete, states.
  *Gate:* component tests per state + add/validation. *ACs:* FR-6.1, NFR-9.1. *Deps:* T4.1, T0.4.
- **T4.3 — Complete, overdue & carry-over.** Optimistic done/undone; overdue flag (color + icon/label);
  age indicator on carried-over items. Pure overdue/age helper unit-tested. *Gate:* overdue/age unit
  tests + optimistic-rollback test. *ACs:* FR-6.3, FR-6.4, NFR-3.3, NFR-5.1. *Deps:* T4.2.
- **T4.4 — My Todos (cross-team).** Aggregate the signed-in user's open+overdue Todos across all their
  teams, due-sorted, grouped/filter by team, deep-linking into each team. *Gate:* aggregation unit test +
  component test. *ACs:* FR-6.5. *Deps:* T4.3.

---

## Milestone 5 — Issues (IDS)

**Objective:** Short-term + long-term issue lists with ranking, the solve flow, and conversion of a
solved issue into a Todo or a Rock with a two-way link.

### User stories
- As a team, I want short-term and long-term issue lists we can prioritize.
- As a team in a meeting, I want to solve an issue and, when it needs follow-through, turn it into a Todo
  or a Rock without retyping.

### Acceptance criteria (see FR-5)
- Short-term + long-term lists; add an issue (title required, raiser defaults to me); move between lists.
- Reorder/rank persists; the top 3 of the short-term list are emphasized.
- Solve records solver + solved-at + optional note and moves it to a solved view; converting pre-fills a
  Todo/Rock on the same team with a two-way link back.

### Tickets
- **T5.1 — Issues schema + data access.** `Issue` (title, description, raiserId, ownerId nullable, listType
  ∈ {SHORT, LONG}, rank, solved, solvedAt, solvedById, resolutionNote, createdTodoId/createdRockId
  nullable). Migration + scoped data-access + permissions. *Gate:* repository + scoping tests. *ACs:*
  FR-5.1, FR-5.2, NFR-1.3. *Deps:* T1.3.
- **T5.2 — Issues screen.** Short-term + long-term lists, add issue, top-3 emphasis on short-term, states.
  *Gate:* component tests per state + add. *ACs:* FR-5.1, FR-5.2, FR-5.3 (emphasis), NFR-9.1. *Deps:*
  T5.1, T0.4.
- **T5.3 — Rank & move.** Reorder within a list (dnd-kit) with persisted rank; move an issue between
  short-term and long-term. *Gate:* reorder-persist + move tests. *ACs:* FR-5.3, FR-5.1. *Deps:* T5.2.
- **T5.4 — Solve flow.** Mark solved (+ optional resolution note), record solver/solved-at (activity
  log), move to a solved/archived view (still readable). Optimistic. *Gate:* solve + archive + rollback
  tests. *ACs:* FR-5.4, FR-2.6, NFR-5.1. *Deps:* T5.2, T1.6.
- **T5.5 — Convert to Todo / Rock.** From a solving issue, create a Todo (due +7) or a Rock, pre-filled,
  on the same team, with a **two-way link** both directions. *Gate:* conversion unit tests (fields
  carried, links set both ways). *ACs:* FR-5.5. *Deps:* T5.4, T4.1, T2.1.

---

## Milestone 6 — My Week home + Team dashboards

**Objective:** Replace the placeholder landing with the aggregated personal "My Week" home, and give each
team a summary dashboard as its landing.

### User stories
- As a user, I want a personal home that pulls my Rocks, Todos, red measurables, and assigned Issues from
  every team I'm on.
- As a user, when I switch to a team I want a one-glance summary of all four modules before I dive in.

### Acceptance criteria (see FR-7)
- My Week aggregates across all my teams and deep-links each item into its team context; all states
  render.
- A team's dashboard summarizes Rocks on-track, this week's Scorecard red/green, open Issues (short/long),
  and Todos open/due, each with a quick link.

### Tickets
- **T6.1 — Aggregation layer.** Data-access + pure shaping for "my work across teams" (my current-quarter
  Rocks, my open/overdue Todos, red measurables I own, Issues assigned to me) and "team summary" counts.
  Bounded queries (NFR-2.3). *Gate:* aggregation unit tests. *ACs:* FR-7.1, FR-7.2. *Deps:* T2.1, T3.1,
  T4.1, T5.1.
- **T6.2 — My Week home.** The personal landing: four aggregate panels, deep links, loading/empty/error/
  content (inviting empty state). Becomes the post-login route. *Gate:* component tests per state +
  deep-link targets. *ACs:* FR-7.1, NFR-9.1. *Deps:* T6.1.
- **T6.3 — Team dashboard.** The per-team landing summarizing all four modules with quick links. *Gate:*
  component test + counts. *ACs:* FR-7.2. *Deps:* T6.1.
- **T6.4 — Time context wiring.** Quarter selector (Rocks) + current-week anchor (Scorecard/Todos) in the
  app bar, defaulting to today, persisted, with historical browse — consumed consistently by the
  modules. *Gate:* context unit/component tests. *ACs:* FR-7.3. *Deps:* T2.3, T3.3.

---

## Milestone 7 — Polish: search, notifications, a11y/perf/responsive

**Objective:** The cross-cutting layer that makes it feel finished — global search, in-app notifications,
and a hardening pass on accessibility, performance, and responsiveness.

### User stories
- As a user, I want to search across Rocks/Issues/Todos/measurables and jump straight to a result.
- As a user, I want to be nudged in-app when something is assigned to me or a Todo goes overdue.
- As any user, I want the app to be fully keyboard/screen-reader accessible, fast, and usable on a tablet.

### Acceptance criteria (see FR-8, NFR-2/3/7/9)
- Search spans the four modules across readable teams, grouped, each result deep-linking.
- In-app notifications surface assignments + overdue Todos, non-blocking and dismissable.
- Every screen passes the a11y checklist (keyboard, contrast both themes, screen-reader labels, 200%
  zoom, chart text-alts) and the design scorecard ≥ 4/5; the Scorecard meets its perf bar; the app is
  usable at tablet width.

### Tickets
- **T7.1 — Global search.** Cross-module search over readable teams, grouped results with deep links.
  *Gate:* search query unit tests + component test. *ACs:* FR-8.1. *Deps:* M2–M5.
- **T7.2 — In-app notifications.** Notify on assignment (Todo/Issue/Rock) + owned Todo going overdue;
  non-blocking center, dismissable. *Gate:* notification-trigger unit tests + component test. *ACs:*
  FR-8.2. *Deps:* M2–M5.
- **T7.3 — Accessibility pass.** Sweep every screen for keyboard operability, focus states, contrast in
  both themes, screen-reader labels/roles, 200% zoom, and chart text-alternatives; fix gaps. *Gate:*
  a11y assertions in component tests; documented manual SR/zoom checks. *ACs:* NFR-3.*. *Deps:* M6.
- **T7.4 — Performance pass.** Scorecard virtualization/efficiency to NFR-2.2, route prefetch, bundle
  trim, bounded-query audit. *Gate:* perf-sensitive unit tests; documented measurements vs NFR-2.
  *ACs:* NFR-2.*. *Deps:* M6.
- **T7.5 — Responsive & design-review sweep.** Tablet/phone layouts (drawer collapse, grid horizontal
  scroll, stacked dashboards), empty/error polish, and a full `/design-review` pass across all screens to
  ≥ 4/5. *Gate:* responsive component tests at breakpoints; design scorecards in the PR. *ACs:* NFR-7.2,
  NFR-9.1. *Deps:* M6.

---

## Ideas & future opportunities (explicitly OUT of v1 scope)

Captured so they're not lost — **do not build without the user's go-ahead** (they'd each be a new
milestone). The user scoped v1 to exactly four modules.

1. **Meeting / L10 mode** — a guided weekly-meeting view that walks Scorecard → Rocks → Todos → IDS on a
   timer, read-mostly, no new data. The natural first extension.
2. **Email / Slack digests** — weekly summary of my Rocks/Todos/red measurables; would add the project's
   first external egress (revisit NFR-4.4).
3. **Vision/Traction Organizer (V/TO)**, **Accountability Chart / People**, **Headlines**, **1-on-1s** —
   the rest of the EOS toolset.
4. **Real-time co-editing** — live multiplayer on the Scorecard during a meeting (websockets/CRDT);
   today's model is optimistic single-field writes (NFR-5.3).
5. **Analytics & history** — quarter-over-quarter Rock completion, measurable trends beyond 13 weeks,
   issue cycle-time.
6. **CSV / Sheets import/export** for measurables and weekly data.

## Open decisions (deferred — surface when the milestone approaches)

1. **Quarter definition** — assume **calendar quarters** (Q1 = Jan–Mar). Confirm at T2.2 if the company's
   fiscal year differs.
2. **Week start / timezone** — assume **ISO week, Monday start**, displayed in the viewer's timezone,
   stored UTC. Confirm at T3.2.
3. **Who may edit a team's Issues/Todos/Scorecard entries** — assume **any member of that team** (not
   just the owner); Team Lead/Admin for structure. Confirm at T1.3 if tighter ownership is wanted.
4. **Allowed domain(s) + Entra tenant** — single Workspace domain + single Microsoft Entra tenant
   assumed; list the exact domain(s) and tenant id at T1.1.
5. **Company name / branding** — product working name "Cadence", Google-blue seed; swap for the real
   brand name/logo/color whenever you like (reversible — internal tool).
6. **Seed vs. real org import** — M1 seeds a demo org; decide at T1.2 whether to also import the real
   100-person roster (CSV) or have Admins build it in-app.
