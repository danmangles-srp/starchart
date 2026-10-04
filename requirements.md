# requirements.md — Cadence

> **WHAT to build** (scope source of truth). Functional (`FR-*`) and non-functional (`NFR-*`)
> requirements for **Cadence** — an internal web platform that runs our company's EOS operations
> (Rocks, Data/Scorecard, Issues, Todos) for ~100 people across a Leadership Team and 4 departments of
> 5 teams each.
>
> **Acceptance criteria (ACs) are the definition of done.** Each AC is written Given / When / Then so a
> test or a human can confirm it. `plan.md` is the ordered HOW; this file is the WHAT. Where the two
> disagree, fix the mismatch — don't silently diverge.
>
> **Product working name is "Cadence"** (the EOS weekly/quarterly rhythm). It is a *placeholder*: this is
> an internal tool with no app-store submission, so the name is **not** a one-way door — rename freely.
> npm package / repo id: `eos-app`.

## Product shape (the one-paragraph version)

Cadence is a **multi-user, server-backed web app**. IT's possible to create totally separate organisations.
Everyone signs in with their company Google **or Microsoft** account.
The company is modeled as a **Leadership Team plus 4 departments, each holding 5 teams (21 team
workspaces total)**. Every team runs the same four EOS modules against its own data: **Rocks** (quarterly
priorities), **Data** (a weekly Scorecard of measurables), **Issues** (an IDS list), and **Todos**
(7-day action items). A person can belong to several teams; **visibility and editing are scoped** by team membership and role — you see only the teams you're on, while an **Admin can read (and manage) every team in their organization**. After login a person lands on a personal **"My Week"** home that aggregates their own work across every team they're on. The look is
**Google-grade Material 3** — calm, fast, trustworthy, accessible.

## Scope guard — build these four modules, nothing more

In scope for v1: **Identity/Access, Organization/Teams, Rocks, Data/Scorecard, Issues, Todos, the
My-Week home + per-team dashboard, and the cross-cutting UX that makes those usable.** Explicitly **out
of scope** (see `plan.md` → "Ideas & future opportunities"): a dedicated Meeting/L10 mode, Headlines, and any public/external-facing surface. Do not build them, and do not add a fifth module 
without the user's say-so.

---

## FR-1 — Identity & Access

### FR-1.1 Google / Microsoft OAuth sign-in, domain-restricted
Users authenticate **only** via **Google** (Auth.js Google provider) **or Microsoft** (Auth.js Microsoft
Entra ID provider). Only accounts on the company's Google Workspace domain(s) / Microsoft Entra tenant
may sign in. A person is keyed by their **verified work email**, so signing in with either provider
resolves to the **same user record** (no duplicate accounts).
- **AC-1.1.1** *Given* a signed-out visitor, *when* they open any app route, *then* they are redirected
  to a sign-in screen offering exactly two actions: "Sign in with Google" and "Sign in with Microsoft".
- **AC-1.1.2** *Given* an account **on** an allowed domain/tenant (via either provider), *when* they
  complete OAuth, *then* a user record is created or **matched by verified email** and they land on
  their My-Week home; *given* a user who has previously signed in with one provider, *when* they sign in
  with the other using the same verified work email, *then* they reach the **same** user (not a second
  account).
- **AC-1.1.3** *Given* an account **not** on an allowed domain/tenant (either provider), *when* they
  complete OAuth, *then* access is denied with a plain-language message and no user/session is created.
- **AC-1.1.4** Allowed domain(s) + the allowed Entra tenant are configuration, not hard-coded, and are
  validated **server-side** on every sign-in (never trusted from the client). Email-based account linking
  is permitted **only** because both providers verify email against company-controlled identity sources;
  it is never extended to unverified or non-allowed emails.

### FR-1.2 Roles & permissions
Three roles: **Admin**, **Team Lead**, **Member**. Permissions are enforced **server-side on every
mutation**, never only in the UI.
- Permission matrix (v1):
  | Capability | Member | Team Lead | Admin |
  | --- | :-: | :-: | :-: |
  | Read data for teams they belong to | ✅ | ✅ | ✅ |
  | Read every team's data across the organization | — | — | ✅ |
  | Create/edit own Individual Rocks & own Todos | ✅ | ✅ | ✅ |
  | Add/edit Issues, Todos & Scorecard entries on **teams they're on** | ✅ | ✅ | ✅ (any team) |
  | Manage a team's Rocks/measurables structure (create/delete/reorder), team membership | — | ✅ (their teams) | ✅ (all) |
  | Manage departments, teams, users, role assignment, app settings | — | — | ✅ |
- **AC-1.2.1** *Given* a Member/Team Lead **not** on team T, *when* they attempt to **read or edit** T's
  Rocks/Issues/Todos/Scorecard via any path (UI or direct API), *then* the server refuses — a read
  returns not-found/forbidden, a write returns 403 — and no data is exposed or written.
- **AC-1.2.2** *Given* a Team Lead of team T, *when* they add a measurable or remove a member on T,
  *then* it succeeds; *when* they attempt the same on a team they do not lead, *then* it is rejected.
- **AC-1.2.3** *Given* an Admin, *when* they perform any org/team/user management action, *then* it
  succeeds and is recorded in the activity log (FR-2.6).
- **AC-1.2.4** Reads are **team-scoped**: a Member/Team Lead can read only the teams they belong to; an
  **Admin** can read every team in their organization. The server enforces this on every cross-team read
  — there is no global "everyone can read everything" surface.

### FR-1.3 Profile
- **AC-1.3.1** *Given* a signed-in user, *then* their name and avatar are sourced from Google on first
  sign-in and shown in the app bar; they may set an optional job title.
- **AC-1.3.2** A user's role and team memberships are visible on their profile (read-only to non-admins).

### FR-1.4 Session & sign-out
- **AC-1.4.1** Sessions use secure, http-only cookies; *given* a signed-in user, *when* they choose Sign
  out, *then* the session is invalidated and they return to the sign-in screen.
- **AC-1.4.2** *Given* an expired/invalid session, *when* the user acts, *then* they are re-prompted to
  sign in without a raw error.

---

## FR-2 — Organization & Teams

### FR-2.1 Departments & teams
The org is a **Leadership Team** plus **4 departments**, each containing **5 teams** (21 team workspaces).
"Department" is an organizing grouping/filter, not its own data workspace.
- **AC-2.1.1** *Given* a seeded/admin-configured org, *then* exactly one Leadership Team and 4
  departments each with 5 teams exist; each team is an independent workspace for all four modules.
- **AC-2.1.2** The team count/shape is **data**, not hard-coded — an Admin can add/rename/retire a team
  or department (FR-2.5) and the structure updates everywhere (switcher, filters, dashboards).

### FR-2.2 Membership (multi-team) & home team
- **AC-2.2.1** A user may belong to **multiple** teams; one is marked their **home team** (used to
  pre-select context and for dashboard defaults).
- **AC-2.2.2** *Given* a user on teams {A, B}, *then* "my" views (My Week, my rocks/todos/issues)
  aggregate across A and B.

### FR-2.3 Team switcher & context
- **AC-2.3.1** *Given* a signed-in user, *then* a team switcher in the left drawer lists **the teams they
  belong to** (an **Admin** sees all teams in the organization), grouped by department, Leadership pinned
  on top; choosing one sets the active team context.
- **AC-2.3.2** The active team persists across navigation and reloads (per-user, server- or
  cookie-stored); deep links encode the team so a shared URL opens the same context.

### FR-2.4 Visibility & edit scoping
- **AC-2.4.1** *Given* a Member/Team Lead, *when* they try to open a team they are **not** on (via the UI
  or a direct URL), *then* its data is not exposed — the team isn't listed in their switcher and a direct
  link lands on a friendly not-found/forbidden view; the server enforces this regardless of the client.
- **AC-2.4.2** *Given* an **Admin**, *when* they open any team in their organization, *then* they can
  read it (and manage it per FR-1.2); an admin action on a team they don't belong to is attributed to
  them in the activity log (FR-2.6).

### FR-2.5 Admin management
Admins manage the org from an Admin area: departments, teams, users, memberships, role assignment.
- **AC-2.5.1** *Given* an Admin, *when* they create/rename/retire a team or department, *then* it is
  reflected in the switcher and filters immediately; retiring a team archives (never hard-deletes) its
  data.
- **AC-2.5.2** *Given* an Admin, *when* they add a user to a team or change a user's role, *then* that
  user's permissions update on their next action without a redeploy.
- **AC-2.5.3** Destructive admin actions (retire team, remove member) require an explicit confirm and are
  recorded in the activity log.

### FR-2.6 Activity log (lightweight)
- **AC-2.6.1** *Given* a sensitive change (role change, team retire, rock status change, issue solved,
  measurable deleted), *then* an append-only activity record (actor, action, target, timestamp) is
  written and viewable by Admins (and, for a team's own activity, by that team).

### FR-2.7 Organization (tenancy — org-ready)
All data lives under a top-level **Organization**. v1 runs a single seeded organization; the schema and
data-access layer are **org-ready** so additional, fully isolated organizations can be added later
without migrating existing rows.
- **AC-2.7.1** Every domain entity (users, departments, teams, rocks, measurables, weekly entries,
  issues, todos, activity log) belongs to exactly one Organization; the data-access layer scopes every
  read and write by `orgId`, and **no read or write ever crosses an org boundary**.
- **AC-2.7.2** *Given* a (future) second organization, *when* its data is created, *then* it is fully
  isolated — no user, team, or record from one org is visible or editable from another.
- **AC-2.7.3** A user belongs to exactly one organization (v1), resolved at sign-in from their verified
  email domain / tenant; "an Admin reads the whole org" (FR-1.2) means that Admin's own organization.

---

## FR-3 — Rocks (quarterly priorities)

### FR-3.1 Levels
Rocks exist at three levels: **Company**, **Team**, **Individual**.
- **AC-3.1.1** *Given* an editor, *then* they can create a Rock at a level they're permitted for: Company
  (Admin/Leadership), Team (members of that team / Team Lead), Individual (the owner).

### FR-3.2 Rock fields & status
A Rock has: title, optional description, **owner** (one person), **level**, **team** (for team rocks),
**target quarter**, (default to current quarter) **due date** within the quarter, and **status** ∈ {on-track, at-risk,
off-track, done}.
- **AC-3.2.1** *Given* a new Rock, *when* saved, *then* title + owner + level + quarter are required;
  status defaults to on-track.
- **AC-3.2.2** *Given* a Rock, *when* the owner/editor changes its status, *then* the change and its
  timestamp are recorded (FR-2.6) and the status chip uses green/amber/red **plus an icon + label**
  (never color alone — NFR-3).
- **AC-3.2.3** *Given* the quarter ends, *then* a Rock not marked done is reported as incomplete in that
  quarter's view; Rocks are immutable-by-default once a quarter is closed (editable only by Admin).

### FR-3.3 Milestones
A Rock may have an ordered **milestone checklist** (title, optional due date, done).
- **AC-3.3.1** *Given* a Rock owner, *when* they add/complete/reorder milestones, *then* the Rock shows
  `done/total` milestone progress.

### FR-3.4 Company → Team linking
- **AC-3.4.1** *Given* a Company Rock, *when* an editor links supporting Team Rocks to it, *then* the
  Company Rock shows a roll-up of its supporting rocks' statuses, and each Team Rock links back.

### FR-3.5 Views & filtering
- **AC-3.5.1** *Given* the Rocks screen for a team, *then* it shows that team's Rocks for the selected
  quarter with owner, status, and milestone progress, filterable by owner/status/level and switchable
  by quarter (default: current quarter).
- **AC-3.5.2** Every state renders: loading (skeleton), empty (inviting "Add the first Rock" CTA), error
  (plain cause + retry), content.

---

## FR-4 — Data / Scorecard

### FR-4.1 Measurable definition
A **measurable** has: name, **owner**, **goal value**, **comparator** ∈ {≥, ≤, =, >, <, between}, unit/
format (number, %, currency, time), and cadence (**weekly** in v1).
- **AC-4.1.1** *Given* a Team Lead/Admin, *when* they add a measurable, *then* name + owner + goal +
  comparator are required and it appears as a new row on the team's Scorecard.
- **AC-4.1.2** Measurables can be **reordered** and retired (archived, not hard-deleted) by a Team
  Lead/Admin.

### FR-4.2 Weekly entries & the 13-week grid
The Scorecard is a grid: **rows = measurables**, **columns = the last 13 weeks** (ISO weeks, Monday
start), newest-left. Cells hold the week's actual value.
- **AC-4.2.1** *Given* the Scorecard, *then* it shows the trailing 13 weeks by default with the current
  week highlighted; the user can page to earlier 13-week windows.
- **AC-4.2.2** *Given* an editor permitted for a cell (measurable owner, or team member per FR-1.2),
  *when* they enter/clear a value inline, *then* it saves **optimistically** (<300ms perceived) and
  persists; a failed save rolls back visibly and is never silently dropped (NFR-5).
- **AC-4.2.3** Empty cells are visually distinct from a recorded `0`.

### FR-4.3 Goal evaluation (red / green) with accessibility
- **AC-4.3.1** *Given* a cell value and its measurable's goal+comparator, *then* the cell renders green
  when the goal is met and red when missed, **always paired with a non-color marker** (e.g. ✓ / ✗ glyph
  or a shape) and an accessible label ("Website leads, week 40: 48, below goal 50"). Empty = neutral.
- **AC-4.3.2** Each row shows a **13-week summary** (e.g. average/total and a hit-rate like "9/13 on
  goal").

### FR-4.4 Navigation & history
- **AC-4.4.1** The grid supports keyboard navigation (arrow keys between cells, Enter to edit) and is
  usable with a screen reader (column = week, row header = measurable).

### FR-4.5 Trend
- **AC-4.5.1** *Given* a measurable, *when* the user expands/opens it, *then* a 13-week trend chart (with
  the goal line) and the entry history are shown.

---

## FR-5 — Issues (IDS: Identify, Discuss, Solve)

### FR-5.1 Short-term & long-term lists
Each team has a **short-term** Issues list (this quarter's working list) and a **long-term** list
(parked for later).
- **AC-5.1.1** *Given* a team's Issues screen, *then* short-term and long-term lists are shown distinctly
  and an issue can be moved between them.

### FR-5.2 Issue fields
An issue has: title, optional description/notes, **raiser**, optional **owner**, created-at, and a
**rank** within its list.
- **AC-5.2.1** *Given* a team member, *when* they add an issue, *then* title is required, raiser defaults
  to them, and it appears at the bottom of the short-term list.

### FR-5.3 Prioritize / rank
- **AC-5.3.1** *Given* the short-term list, *when* a team member reorders issues (drag or move-up/down),
  *then* the new rank persists; the top 3 are visually emphasized (the IDS focus set).

### FR-5.4 Solve
- **AC-5.4.1** *Given* an open issue, *when* a team member marks it **solved** (with optional resolution
  note), *then* solved-at + solver are recorded (FR-2.6), it leaves the active list, and it remains
  viewable in a solved/archived view.

### FR-5.5 Convert to Todo or Rock
- **AC-5.5.1** *Given* an issue being solved, *when* the user chooses "Create Todo" or "Create Rock" from
  it, *then* a Todo (default due +7 days, FR-6) or a Rock (FR-3) is created, pre-filled from the issue,
  on the same team, with a **two-way link** back to the originating issue.

### FR-5.6 Lifecycle
- **AC-5.6.1** Every state renders (loading/empty/error/content); solving and converting are optimistic
  with rollback on failure.

---

## FR-6 — Todos (7-day action items)

### FR-6.1 Fields
A Todo has: title, optional notes, **owner**, **due date** (defaults to +7 days / next meeting), **done**,
team, optional source link (issue/rock it came from).
- **AC-6.1.1** *Given* a team member, *when* they add a Todo, *then* title + owner are required and due
  defaults to +7 days; it appears in the team's open list and in the owner's "my todos".

### FR-6.2 Source
- **AC-6.2.1** A Todo created from an issue (FR-5.5) shows and links its source issue.

### FR-6.3 Complete / overdue
- **AC-6.3.1** *Given* an open Todo, *when* the owner (or a team member per FR-1.2) checks it done, *then*
  it saves optimistically, moves to done, and records completed-at.
- **AC-6.3.2** *Given* a Todo past its due date and not done, *then* it is flagged overdue with a
  non-color cue in addition to color.

### FR-6.4 Carry-over & aging
- **AC-6.4.1** *Given* incomplete Todos at week roll-over, *then* they remain visible (carried over) with
  an age indicator; nothing is auto-deleted.

### FR-6.5 My todos
- **AC-6.5.1** *Given* a user on multiple teams, *then* "My Todos" aggregates their open+overdue Todos
  across all their teams, grouped or filterable by team, sorted by due date.

---

## FR-7 — Home ("My Week") & Team Dashboard

### FR-7.1 My Week (personal landing)
- **AC-7.1.1** *Given* a signed-in user, *when* they land after login, *then* they see a personal "My
  Week" home aggregating **across all their teams**: my Rocks (with status) for the current quarter, my
  Todos due this week + overdue, Scorecard measurables I own that are currently red, and Issues assigned
  to me.
- **AC-7.1.2** Each item deep-links into the owning team's module in the correct context.
- **AC-7.1.3** My Week renders loading/empty/error/content; the empty state is inviting, not blank.

### FR-7.2 Team dashboard
- **AC-7.2.1** *Given* a user switches to team T, *then* they land on T's dashboard summarizing all four
  modules: Rocks on-track count, this week's Scorecard red/green count, open Issues count (short/long),
  Todos open/due — each with a quick link into the module.

### FR-7.3 Time context
- **AC-7.3.1** A global **quarter selector** (for Rocks) and the **current-week anchor** (for Scorecard/
  Todos) are available in the app bar; both default to "today" and allow historical browsing.

---

## FR-8 — Cross-cutting UX

### FR-8.1 Global search *(priority: polish milestone)*
- **AC-8.1.1** *Given* a signed-in user, *when* they search, *then* results span Rocks, Issues, Todos,
  and measurables across teams they can read, grouped by type, each deep-linking to its item.

### FR-8.2 In-app notifications *(priority: polish milestone)*
- **AC-8.2.1** *Given* a user is assigned a Todo/Issue/Rock or owns a Todo going overdue, *then* an
  in-app notification surfaces it; notifications are non-blocking and dismissable. (Email/Slack digests
  are out of v1 scope — see Ideas.)

### FR-8.3 Theme
- **AC-8.3.1** The app supports light and dark themes, defaults to the OS preference, and offers a manual
  toggle that persists per user.

---

# Non-Functional Requirements

## NFR-1 — Architecture & data integrity
- **NFR-1.1** Full-stack **Next.js (App Router, TypeScript)**; **PostgreSQL via Prisma** is the single
  source of truth. No second store, no client-owned source of truth.
- **NFR-1.2** Every mutation is a **server action / route handler** that (a) validates input with Zod and
  (b) re-checks auth + team/role authorization server-side before writing. The client is never trusted.
- **NFR-1.3** All team-scoped reads/writes go through a data-access layer that applies the visibility +
  permission rules in one place (no ad-hoc queries that bypass scoping).
- **NFR-1.4** Schema changes ship as **Prisma migrations** committed with the PR; no manual DB edits.
- **NFR-1.5** **Org-ready tenancy** (FR-2.7): every table carries an `orgId` and the single data-access
  layer applies it to every query, so cross-org data leakage is structurally impossible — not something
  each feature must remember.

## NFR-2 — Performance
- **NFR-2.1** First meaningful paint of an authenticated page **< 2.0s** on a mid-range laptop over
  office broadband; navigation between modules feels instant (cached/prefetched).
- **NFR-2.2** The Scorecard grid stays smooth (no dropped frames on scroll/scan) with a realistic load of
  **≥ 40 measurables × 13 weeks**; inline-edit perceived save **< 300ms** (optimistic).
- **NFR-2.3** List endpoints are paginated/bounded; no screen fetches an unbounded org-wide table.

## NFR-3 — Accessibility (WCAG 2.1 AA — required)
- **NFR-3.1** Text contrast ≥ 4.5:1 (≥ 3:1 large), verified in **both** themes.
- **NFR-3.2** Full **keyboard** operability (including the Scorecard grid) and visible focus states.
- **NFR-3.3** **Never encode meaning by color alone** — every status (rock status, red/green cell,
  overdue) pairs color with an icon, shape, or text.
- **NFR-3.4** Meaningful labels/roles for screen readers; layouts survive **200% zoom / browser text
  scaling** without clipping.
- **NFR-3.5** Charts expose a text alternative (summary + accessible values).

## NFR-4 — Security & privacy
- **NFR-4.1** Auth is **Google or Microsoft only**, **domain/tenant-restricted**, enforced server-side
  (FR-1.1). Authorization is checked on **every** mutation and on **every cross-team read** — a team's
  data is readable only by its members and by an Admin of that organization; there is no org-wide-read
  surface for ordinary members.
- **NFR-4.2** **No secrets in the client or the repo.** Both OAuth client IDs/secrets (Google +
  Microsoft Entra), the DB URL, and `AUTH_SECRET` live in environment variables / Vercel project
  settings only.
- **NFR-4.3** Secure session cookies (http-only, `secure`, `sameSite`); CSRF protection on mutations;
  all DB access parameterized via Prisma (no string-built SQL).
- **NFR-4.4** This is **org-internal** data; least-privilege by role; sensitive admin actions are logged
  (FR-2.6). No external data egress in v1 (no email/Slack/analytics-to-third-parties).

## NFR-5 — Reliability & data safety
- **NFR-5.1** Interactive writes are **optimistic with rollback**: on failure the UI reverts and surfaces
  a retry; **user input is never silently lost**.
- **NFR-5.2** Archive, don't hard-delete, for team/measurable/issue retirement, so history survives.
- **NFR-5.3** Concurrent edits (two people in a live meeting) must not corrupt data; last-write-wins on a
  single field is acceptable for v1, but a stale overwrite must not throw away an unrelated field.
  (Real-time co-editing is an Idea, not a v1 requirement.)

## NFR-6 — Maintainability & testing
- **NFR-6.1** TypeScript **strict**; ESLint + Prettier clean; feature-first structure (see `structure`).
- **NFR-6.2** Logic (domain rules, permission checks, goal evaluation, week/quarter math, aggregation)
  is **pure and unit-tested**; **≥ 80% coverage on the logic surface** (the gate's floor).
- **NFR-6.3** Key screens have component tests for every state (loading/empty/error/content); critical
  flows (sign-in gate, create rock, enter a scorecard value, solve→todo) have Playwright E2E.
- **NFR-6.4** The **Standard Gate** (`sh scripts/gate.sh`) is the single definition of "green": typecheck
  → lint → format → unit tests + coverage floor → `next build`. It must pass before every push.

## NFR-7 — Browser & responsive support
- **NFR-7.1** Supports the latest 2 versions of Chrome, Edge, Firefox, and Safari.
- **NFR-7.2** **Desktop-first**, responsive down to tablet (~768px); phone width is usable for reading
  and quick actions (check a Todo, update a status). This is a web app, **not** a native mobile app.

## NFR-8 — Observability
- **NFR-8.1** Structured, tagged server logging via an injected logger — tags `AUTH / ORG / ROCKS / DATA
  / ISSUES / TODOS / HOME / DB / API / CORE` (plus `CORE` for cross-cutting). No `console.log` in shipped
  code paths.
- **NFR-8.2** Errors are captured with enough context to diagnose (request id, actor, route) without
  leaking secrets or PII into logs beyond what's needed.

## NFR-9 — UX quality bar (Google-grade)
- **NFR-9.1** Every screen clears the `ui-ux` design scorecard (≥ 4/5 on each dimension, confident "yes"
  on "worth using daily") before its PR merges. Calm, content-first, one primary action per screen,
  consistent Material 3 system, fast purposeful motion. "The gate is green" is **not** design done.
