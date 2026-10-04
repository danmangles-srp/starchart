# Cadence — Master Map

Collaborative Senior Full-Stack Engineer building **Cadence** — an internal, multi-user **web** platform
that runs our company's **EOS operations** (Rocks, Data/Scorecard, Issues, Todos) for ~100 people across
a Leadership Team and 4 departments of 5 teams each. Think Ninety.io / MonsterOps, trimmed to exactly
those four modules. Must be beautiful, fast, trustworthy, and accessible — the UX bar is **Google-grade
Material**.

**Work collaboratively.** Own the mechanics autonomously (deps, types, migrations, codegen, wiring).
**Ask the user early and often** on product, UX, data-model, and irreversible decisions — batched, each
led by a recommended option (see `workflow.md` → "How to ask well"). Before claiming done, review with a
fresh eye: `/code-review` for code, `/design-review` for UI. *Mechanics* autonomous; *direction* is a
conversation.

## Where to start

1. **`requirements.md`** — WHAT to build (scope source of truth): functional (`FR-*`) + non-functional
   (`NFR-*`) requirements, each with Given/When/Then acceptance criteria that are the definition of done.
   The product is **server-backed and multi-user** (NFR-1): **PostgreSQL via Prisma is the single source
   of truth**; everyone signs in with **Google or Microsoft** (domain/tenant-restricted); **reads are
   scoped to a user's teams** (an Admin reads the whole org), **edits are role-scoped** and enforced **server-side on every mutation**. Scope is exactly
   four modules — **Rocks, Data/Scorecard, Issues, Todos** — plus identity/org, the personal home, and
   per-team dashboards. Do not add a fifth module.
2. **`plan.md`** — the ordered HOW: **eight milestones** (M0 Foundation → M7 Polish). Execute in
   milestone order; within a milestone, each **ticket = 1 PR** off `dev`. Don't start the next milestone
   until the current one's ACs are met and its PRs are merged. The "Plan of Attack" board says what's
   next.
3. **Skills below** — standards for every step; consult the relevant skill before acting. The skills are
   written for **this** stack (Next.js / TypeScript / MUI / Prisma). Where a skill and the project docs
   disagree, the project docs win — raise the conflict first.

## Skills

| Skill | File | When to use |
| ----- | ---- | ----------- |
| Setup | `.claude/skills/setup.md` | Bootstrapping the Next.js app, pinned versions, Prisma/Postgres, auth, env/secrets, static analysis, the gate, git hooks, troubleshooting |
| Structure | `.claude/skills/structure.md` | Building features: file layout, naming, RSC vs client, server actions, the data-access + authorization layer, TanStack Query, error handling, types |
| Testing | `.claude/skills/testing.md` | Writing tests, the TDD loop, test tiers (Vitest unit/component, Playwright E2E), coverage floor, what is/isn't provable without a browser |
| UI/UX | `.claude/skills/ui-ux.md` | Screens, MUI theming/tokens, Material 3, motion, accessibility (WCAG AA), loading/empty/error states, the design self-review scorecard |
| Workflow | `.claude/skills/workflow.md` | The collaborative loop, when/how to ask, self-review feedback loops, commits, PRs |

## Commands

| Command | Use |
| ------- | --- |
| `/feature <story>` | Start a feature: confirm scope with batched questions, then run the TDD + self-review loop |
| `/clarify [topic]` | Surface the open decisions in the current work and ask — batched, with recommendations |
| `/design-review [scope]` | Render changed screens, score against the UI/UX rubric; fix what falls short |
| `/ship` | Run both self-review loops + the full gate, then prepare and open the PR |

## Quick Reference

- **App identity**: product working name **Cadence** (placeholder — internal tool, no app store, so
  renaming is **not** a one-way door); repo/package id **`eos-app`**; platform **web, desktop-first
  responsive** (usable to tablet; phone for quick actions) — **no native mobile app**. Target the latest
  2 versions of Chrome/Edge/Firefox/Safari. The Next.js app lives at the **repo root** (source in
  `src/`). Deploy target **Vercel**; Postgres via Vercel Postgres / Neon. *Pinned versions recorded in
  the M0 PR, following `setup.md` + `plan.md` → Dependency matrix.*
- **Stack**: **Next.js (App Router, React, TypeScript strict)** full-stack / **MUI (Material UI) v6 +
  MUI X** (DataGrid for the Scorecard, Charts for trends, Date Pickers for quarter/week) / **Prisma +
  PostgreSQL** as the **single source of truth** / **Auth.js (NextAuth v5)** with **Google + Microsoft
  Entra ID** providers, domain/tenant-restricted / **TanStack Query** for client cache + optimistic
  writes / **react-hook-form + Zod** for forms and server-action validation / **date-fns** for ISO-week
  and quarter math / **@dnd-kit** for drag-reorder / **Vitest + Testing Library** and **Playwright** for
  tests / **pino** logging. Versions: `plan.md` matrix, pinned at M0.
- **Architecture**: feature-first under `src/features/<feature>/{components,server,domain,data}`.
  **Server-backed, multi-user** — the UI reads from Postgres (via Prisma, often in RSC) and writes
  through **server actions / route handlers** that **validate (Zod) + authorize (role + team) on the
  server every time**. All org-scoping, team-scoping and permission checks live in one **data-access + authorization
  layer** — never ad-hoc per query. Business logic (quarter/ISO-week math, goal evaluation, permission
  rules, aggregation) is **pure TypeScript**, unit-testable without a browser or DB.
- **Identity & access**: sign-in is **Google or Microsoft only**, restricted to the company's Workspace
  domain(s) / Entra tenant; the check is **server-side**. A person is keyed by **verified work email**,
  so either provider resolves to the **same user**. Roles: **Admin** (global), **Team Lead** (per team),
  **Member**. **Reads are team-scoped** — a user sees only the teams they're on, while an **Admin reads
  (and manages) every team in the organization**; **edits require team membership + role**.
- **Org model**: everything lives under a top-level **Organization** (the tenant — **org-ready** schema,
  **one org in v1**, every table carries `orgId`, no cross-org reads/writes). Within an org: a
  **Leadership Team** + **4 departments × 5 teams = 21 team workspaces**; "department"
  is a grouping/filter. A person may be on **multiple teams** (one is their home team). Each team runs
  its own Rocks / Scorecard / Issues / Todos.
- **Data model** (canonical names — use everywhere):
  - **Rock** = quarterly priority at level {COMPANY, TEAM, INDIVIDUAL}; fields: title, owner, team
    (for team rocks), target **quarter**, due date, **status** ∈ {on-track, at-risk, off-track, done};
    has ordered **Milestones** (checklist); Company Rocks link to supporting Team Rocks (roll-up).
  - **Measurable** (Scorecard) = name, owner, **goalValue** + **comparator** ∈ {≥, ≤, =, >, <, between},
    format/unit, order; weekly **WeeklyEntry** values keyed by (ISO year, ISO week). The Scorecard is the
    **trailing 13 ISO weeks** (Monday start), newest-left; a cell is green/red vs goal **+ a non-color
    marker**; empty ≠ 0.
  - **Issue** = title, raiser, owner?, **listType** ∈ {SHORT, LONG}, **rank**; **solve** records
    solver + solvedAt + resolution note; a solved issue can **convert** to a Todo or Rock with a two-way
    link.
  - **Todo** = 7-day action item: title, owner, **due** (default +7 days), **done**, team, optional
    source link (issue/rock). "My Todos" aggregates across a person's teams.
- **Quarter / week** (canonical): Rocks use **org-configurable quarter definitions** — each quarter has
  explicit start/end dates, set per Organization by an Admin, **defaulting to calendar quarters**
  (Q1 = Jan–Mar) when unset (so a non-calendar fiscal year is data, not code). Scorecard/Todos use
  **ISO weeks, Monday start**; store UTC, display in the viewer's timezone.
- **Loop**: Confirm scope + ask (requirements/plan AC) → branch off `dev` → test (red) → code (green) →
  refactor → self-review (`/code-review` + `/design-review`) → gate → check in → commit → PR to `dev`.
- **Validate** — **Standard Gate** `sh scripts/gate.sh` (typecheck → lint → format check → `vitest run
  --coverage` with the **≥80% logic-coverage floor** → `next build`). Identical to the `pre-push` hook.
  Run before every push; never gate on a scoped test path (coverage instruments the whole logic surface).
  Playwright E2E runs in CI, not in the per-commit gate.
- **Debug surface**: tagged logs via an injected `AppLogger` (pino) — `AUTH` / `ORG` / `ROCKS` / `DATA` /
  `ISSUES` / `TODOS` / `HOME` / `DB` / `API` (plus `CORE` for cross-cutting). Never `console.log` in
  shipped paths.
- **Commits**: Conventional Commits, lowercase, no emojis. **No "Co-authored-by".** Scopes track features
  and layers: `auth`, `org`, `team`, `rocks`, `data`, `issues`, `todos`, `home`, `admin`, `ui`, `db`,
  `core`, `ci`.
- **Rules**: **No secrets in the client or the repo** — OAuth client IDs/secrets (Google + Microsoft),
  `DATABASE_URL`, `AUTH_SECRET` live in env / Vercel project settings only (local dev via a gitignored
  `.env`). **Authorize every mutation server-side** (role + team); **validate every input with Zod**.
  **Never encode meaning by color alone.** **Archive, don't hard-delete** teams/measurables/issues.
  **No external egress in v1** beyond the Google/Microsoft OAuth handshake (no email/Slack/third-party
  analytics — those are Ideas in `plan.md`). Honour the accessibility bar (**WCAG 2.1 AA**), the perf
  NFRs (page interactive <2.0s; Scorecard smooth at ≥40 measurables × 13 weeks; optimistic save <300ms),
  and the **Google-grade UX bar** (NFR-9). **No enhancements beyond `requirements.md`; no unrelated
  changes; no fifth module.**
