---
name: structure
description: Architecture, file organization, naming, RSC vs client components, server actions, the data-access + authorization layer, TanStack Query, forms/validation, error handling, and types for Cadence. Use when building features or reviewing implementation patterns.
---

# Structure: How We Build

> This skill is **stack and process**, not product. The *what* (features, models, screens) lives in
> `requirements.md` + `CLAUDE.md` + `plan.md`. When this skill and the project docs disagree, the project
> docs win — but raise the conflict with the user first.

## Tech Stack (the project default — see `plan.md` for the full matrix)

- **Language**: TypeScript, **strict**. Avoid `any`; avoid the non-null assertion `!` — narrow with
  guards, `??`, or an explicit throw instead.
- **Framework**: Next.js **App Router** (React Server Components by default; client components only where
  interactivity needs them).
- **UI**: MUI (Material UI) v6 + MUI X. All visual values come from the theme (see `ui-ux.md`).
- **Data**: **PostgreSQL via Prisma** — the single source of truth. No second store.
- **Mutations**: **server actions** (`'use server'`) / route handlers, each **validated with Zod** and
  **authorized server-side** before any write.
- **Client cache**: **TanStack Query** for anything interactive — optimistic writes with rollback.
- **Forms**: `react-hook-form` + `zod` (the *same* Zod schema validates on the client and the server).
- **Auth**: Auth.js (NextAuth v5), Google + Microsoft Entra ID, domain/tenant-restricted.

## Architecture: server-backed, multi-user, feature-first

The UI reads from Postgres (via Prisma, usually in a Server Component or a TanStack Query fetch) and
**writes through server actions** that validate input and re-check authorization every time. **Every
team-scoped read/write goes through the data-access + authorization layer** — never a raw Prisma call
from a component or route file.

```
Server Component (read)  ─┐
Client Component (TanStack Query) ─┤→ data-access fn ─→ authz check ─→ Prisma ─→ Postgres
Client Component (mutation) ─→ server action ─→ Zod validate ─→ authz check ─→ data-access ─→ Prisma
                                                   ↑ on success: revalidate / invalidate query cache
```

> **One authorization seam.** `src/lib/auth/permissions.ts` holds the pure permission predicates
> (`canEditTeam`, `isTeamLead`, `isAdmin`, …). Every server action calls `requireUser()` then a predicate
> before writing. Cross-team reads check too (a team is readable only by its members and an org Admin). The client may *also* hide
> an affordance, but the server is the gate.

## File Organization

Feature-first under `src/`. Feature names come from `requirements.md`.

```
src/
  app/                         # Next.js App Router — routing + layouts ONLY (thin)
    (auth)/sign-in/            # the sign-in screen
    (app)/                     # authed route group (shell layout: drawer + app bar)
      page.tsx                 # My Week home
      t/[teamId]/
        page.tsx               # team dashboard
        rocks/ scorecard/ issues/ todos/   # module pages
      admin/
    api/auth/[...nextauth]/    # Auth.js handler
  features/
    <feature>/                 # one per product module (rocks, scorecard, issues, todos, org, home)
      components/              # React components (client or server) for this feature
      server/                  # server actions + route handlers (mutations, 'use server')
      domain/                  # pure TS: rules, math, types, Zod schemas (no React, no Prisma)
      data/                    # data-access: Prisma queries/mutations behind the authz seam
  lib/
    db.ts                      # Prisma client singleton
    env.ts                     # typed, fail-fast env
    auth/                      # Auth.js config, session helpers (requireUser), permissions.ts
    time/                      # ISO-week + quarter helpers (date-fns), AppClock seam
    logger.ts                  # AppLogger (pino), tagged (see CLAUDE.md)
    query/                     # TanStack Query client + shared query keys
    result.ts                  # Result<T> / typed AppError
  components/                  # shared, cross-feature UI (AppShell, StatusChip, states)
  theme/                       # MUI theme: palette (light/dark), tokens, status→color+icon map
```

**Where logic lives:** `domain` / `server` / `data` and `lib/` are the **coverage-counted** surface —
all testable logic is pure TS there. `components/` is verified by component tests; `app/` route files
stay thin (compose a feature's server-read + components). Neither `components/` nor `app/` is counted by
the coverage floor.

## Naming Conventions

| What | Convention | Example |
| ---- | ---------- | ------- |
| React component files | PascalCase | `RockCard.tsx`, `ScorecardGrid.tsx` |
| Other modules (domain/data/lib) | kebab-case | `rock-repository.ts`, `iso-week.ts` |
| Hooks | camelCase `use*` | `useActiveTeam.ts` |
| Server actions | camelCase verb | `createRock`, `updateMeasurableEntry` |
| Types / enums / Zod schemas | PascalCase (`*Schema` for Zod) | `Rock`, `RockLevel`, `CreateRockSchema` |
| Functions / variables | camelCase | `currentQuarter`, `assertCanEdit` |

Clarity over brevity: `authenticatedUser`, not `authUsr`.

## Implementation Rules

### Server vs client components
- Default to **Server Components** for reads (fetch via a `data/` function, render). Add `'use client'`
  only for interactivity (forms, DataGrid editing, drag, TanStack Query hooks).
- Keep client bundles lean: push data-fetching and heavy logic to the server; pass plain serializable
  props down.

### Mutations (server actions)
```ts
'use server';
export async function updateRockStatus(input: unknown) {
  const { rockId, status } = UpdateRockStatusSchema.parse(input);   // Zod — never trust the client
  const user = await requireUser();
  const rock = await rocksData.byId(rockId);
  assertCanEdit(user, rock.teamId);                                  // server-side authz, every time
  await rocksData.setStatus(rockId, status, user.id);                // writes + activity log
  revalidatePath(`/t/${rock.teamId}/rocks`);
}
```
- Validate input with Zod, authorize, then write. Return a typed result the client can render; **never
  leak a raw Prisma error** to the UI.
- Record sensitive changes in the activity log (status change, solve, membership/role change, archive).

### Data-access layer
- All Prisma access lives in a feature's `data/` (or `lib/db` for cross-cutting). It applies **org + team
  scoping** (every query filtered by `orgId`, then membership/role) and returns domain-shaped objects —
  components never see Prisma row types directly.
- **Archive, don't hard-delete** (soft `archivedAt`) for teams/measurables/issues.

### Client cache & optimism (TanStack Query)
- Interactive writes (scorecard cell, todo checkbox, rock status) use a React Query **mutation with an
  optimistic update + rollback on error**; perceived save < 300ms (NFR-5). Invalidate the relevant query
  key on settle. **Never silently drop user input** on failure — revert + surface a retry.
- Centralize query keys in `lib/query` so invalidation is consistent.

### Forms & validation
- `react-hook-form` + `zodResolver(Schema)`; the schema is **imported by the server action too**, so
  client and server validate identically. Disable submit until valid; show progress; never lose input on
  a failed submit.

### Types & errors
- Discriminated unions / enums for finite states (rock status, comparator, list type) — not booleans +
  nulls. Expose read-only arrays.
- Catch only what you can handle; wrap in a typed `AppError`; log via `AppLogger` with the right tag;
  never `console.log` in shipped paths.

### Time
- Inject an `AppClock` (seam) so "today", the current quarter, and the current ISO week are deterministic
  in tests. Store UTC; compute ISO weeks (Monday start) in `lib/time`, and resolve quarters from the
  org's `QuarterDefinition`s there (calendar-quarter fallback, Q1 = Jan–Mar).

## When to stop and ask (don't guess on these)

Default to a quick batched question (with a recommended option) rather than a silent assumption when:
- A **data-model / domain shape** has more than one reasonable design (relationships, enum sets, source
  of truth).
- A choice is **hard to reverse** (schema, a public route/API surface, a permission rule).
- The pattern here **conflicts** with `requirements.md` or `CLAUDE.md`.

Just decide (and note it in the PR) for reversible, mechanical, one-obvious-answer choices. See
`workflow.md` → "How to ask well."

## What NOT to Do

- Query Prisma directly from a component or route file — go through `data/` + the authz seam.
- Write a mutation that doesn't `requireUser()` + authorize + Zod-validate on the server.
- Trust the client for permissions, domain membership, or role.
- Put any secret in the client bundle or the repo (see `setup.md`).
- Hard-delete team/measurable/issue data.
- Add packages, modules, or a fifth EOS module beyond `requirements.md`; touch unrelated code.
- Use `any` or the `!` non-null assertion to silence the type-checker.
