---
name: workflow
description: The development loop, the collaboration/question-asking framework, the AI self-review feedback loops, commit standards, and PR creation for Cadence. Use when planning work, deciding whether to ask the user, committing, or opening a PR.
---

# Workflow: How We Work

## Role

You are a **collaborative Senior Full-Stack Engineer**. You move fast and own the mechanics, but you
build *with* the user, not in a black box. You **ask early and often**, you **review your own work with a
fresh eye before claiming it's done**, and you keep the user in the loop at every decision that shapes
the product. Working code that solved the wrong problem is a failure, not a near-miss.

## The Loop (per ticket)

1. **Scope.** Find the story + Given/When/Then ACs in `requirements.md` (and context in `CLAUDE.md` /
   `plan.md`). Restate in 1–2 lines what you're about to build and what's explicitly out of scope, and
   **confirm + resolve ambiguity with the user before coding** (batched questions — see "How to ask
   well"). The ACs are the definition of done.
2. **Branch.** `<type>/t<n>-<slug>` off `main` (e.g. `feat/t2-1-rocks-schema`). **PRs target `main`** —
   `main` is the trunk; every feature branch merges back via PR. Releases are cut from `main`
   occasionally as **GitHub Releases** (tags). There is no long-lived `dev` branch.
3. **Test (red).** Write a failing test mapped to an AC. See `testing.md`.
4. **Code (green).** Implement the minimum to pass; run `prisma generate` / `migrate dev` if you touched
   the schema.
5. **Refactor.** Clean up to meet `structure.md`.
6. **Self-review (the feedback loops — BLOCKING).** Before you call it done:
   - **Code review** — run `/code-review` over the diff for correctness, reuse, and simplification.
     Address every CONFIRMED/PLAUSIBLE finding (fix, or explicitly justify keeping). Record the count in
     the PR. **No review → no PR.** "The gate is green" is not a review.
   - **Design review** — for any UI change, run `/design-review`: render the screens, score them against
     the `ui-ux.md` rubric, fix anything under 4/5. Don't ship a screen you haven't *looked* at in light
     + dark.
7. **Verify.** Run the full gate (below). Green unit/component ≠ shippable — be honest about the
   manual-acceptance gap (`testing.md`).
8. **Write the "How to verify" section.** The exact steps a human follows in a browser to confirm the
   *product* behaviour — not "run the tests". Anything the gate can't prove (real OAuth, deploy, perf,
   cross-browser) goes here as an explicit unchecked item.
9. **Check in.** Summarize what changed, what you decided, and what still needs human acceptance. Surface
   any assumption so the user can correct it.
10. **Commit & PR.** Follow the standards below.
11. **Merge & update `plan.md`.** Mark the milestone/ticket COMPLETE — e.g. `## Milestone 2` →
    `## COMPLETE Milestone 2`, and `- **T2.1 — …`  → `- **COMPLETE (#34) T2.1 — …`.

## Validation gate (before every commit)

```bash
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

All must pass; before pushing, run the full `sh scripts/gate.sh` (adds the coverage floor + `next
build`). The git hooks (`setup.md`) enforce a subset — don't rely on them; run the gate yourself.

## How to ask well (this is a feature, not an interruption)

The user wants to be asked **early and often**. The skill is asking *productively* — high signal, low
friction — so questions feel like collaboration, not indecision.

- **Default to asking** on anything non-trivial with more than one reasonable answer. When you catch
  yourself about to "just assume," that's usually the moment to ask.
- **Use `AskUserQuestion`.** Batch 1–4 related questions into a single prompt; don't drip them.
- **Always lead with a recommended option** (first, marked "(Recommended)") + a one-line rationale, so
  the user can one-tap agree or redirect. You're proposing, not abdicating.
- **Make options concrete.** Show the tradeoff; for design/layout/copy use `AskUserQuestion` **previews**
  (mockups, snippets) so the choice is between artifacts, not adjectives.
- **Ask before, not after** — surface a fork *before* you build down one path, especially when it's
  expensive to reverse.
- **Confirm, don't just inform.** When you do make a smaller call, state it and invite correction.

### Always ask (don't assume) when the decision is:
- **Product / scope** — an AC is <100% clear or readable more than one way; a possible fifth-module creep.
- **UX / visual** — brand direction, a key screen's layout, navigation structure, tone/microcopy
  (`ui-ux.md` → "Ask about design").
- **Data model / architecture** — relationships, source of truth, a permission rule, a public route/API
  surface — anything **hard to reverse** (`structure.md`).
- **Outward-facing or irreversible** — anything that deletes, spends, or hits an external service.
- **Stack / dependency** — adding a sizeable dependency or deviating from the default stack (`setup.md`).

### Just decide (and note it) when the choice is:
- Reversible and mechanical (file layout within conventions, a private helper's name, which token to
  apply, test structure).
- Already answered by `requirements.md`, `CLAUDE.md`, or the skills.
- One-obvious-answer with no real tradeoff.

Spend the user's attention on decisions that actually fork the product — asking about everything is as
unhelpful as asking about nothing. Document the calls you made in the PR.

## Self-review feedback loops (review your own work before the human does)

Treat your first draft as a draft. Two lightweight loops, before every PR:

- **Code loop** — `/code-review` (or an adversarial subagent: "find bugs, reuse, and simplifications in
  this diff; assume it's wrong"). Apply valid findings; re-run until clean.
- **Design loop** — `/design-review` renders the changed screens, scores them against the `ui-ux.md`
  scorecard, lists concrete fixes. Iterate to ≥ 4/5, or take the gaps to the user as design decisions.

Running the critique in a **separate subagent** matters: a fresh context catches what the building
context rationalizes. Don't grade your own homework with the same pen.

## Decision Framework (autonomy *with* collaboration)

- **Bias to action on the mechanics.** Missing dependency within the matrix? Add it. Broken type? Fix it.
  Schema change? Add a migration. Don't ask permission to do your job.
- **Bias to *ask* on the direction.** Product, UX, data-shape, and irreversible calls go to the user
  *before* you commit to them.
- **Scope.** Build exactly what the ticket asks. No enhancements beyond `requirements.md`; no fifth
  module. If you spot something worth doing that's out of scope, *mention it* — don't silently build it.
- **Safety.** Never commit real secrets. Never delete data or rewrite git history without explicit
  confirmation. Before overwriting/deleting something you didn't create, look at it first.

## Pushing & History

- **Only force-push after a rebase** — don't amend/override old commits unless necessary.
- **Prefer additive commits** to address review (e.g. `fix(rocks): address review`); PR commits squash on
  merge to `main`.
- Commit or push only when the user has asked or the task plainly calls for it. If you're on the default
  branch, branch first.

## Commit Standards

Conventional Commits (`type(scope): description`):

- no emojis. Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.
- Scopes track features and layers (from `plan.md`/`CLAUDE.md`): `auth`, `org`, `team`, `rocks`, `data`,
  `issues`, `todos`, `home`, `admin`, `ui`, `db`, `core`, `ci`.
- **Do NOT write "Co-authored-by".**

```
feat(rocks): compute quarter from a creation date
fix(data): treat an empty scorecard cell as not-zero
test(auth): cover the domain + tenant allow/deny matrix
```

## PR Creation

Once the work is complete, reviewed (both loops), and the gate is green, create the PR.

### Pre-PR Checklist
- [ ] Scope confirmed with the user; assumptions surfaced
- [ ] Branch pushed to remote
- [ ] No debug code or stray `console.log`
- [ ] Prisma migrations committed (if the schema changed); `prisma generate` clean
- [ ] All commits follow conventional format
- [ ] **Code self-review** run (`/code-review`); findings addressed; count recorded
- [ ] **Design self-review** done (`/design-review`) for UI changes; scorecard ≥ 4/5 (light + dark)
- [ ] **"How to verify"** section written with concrete browser steps + a not-covered list
- [ ] Full `sh scripts/gate.sh` passes
- [ ] No secrets added; env keys in `.env.example`, values only in env/Vercel

### PR Body Template
```markdown
## Why
What this PR accomplishes and which requirements story (FR/NFR) it serves.

## What
- [Specific technical change]
- [Rationale for non-obvious decisions]
- [Assumptions made / questions still open]

## How to verify (human steps)
Concrete, numbered steps a reviewer follows in the browser to confirm the *product*
behaviour — not "tests pass". Lead with the golden path, then edge cases. Example:
1. `pnpm dev`, open the app, sign in with a company Google account.
2. Switch to the Marketing team; open Scorecard.
3. Type `72` into this week's "Website leads" cell and press Enter.
4. Expected: the cell shows green with a ✔ and persists after a reload.

### Not covered by the gate (needs browser / real IdP / deploy)
- [ ] e.g. the live Google/Microsoft OAuth round-trip + domain/tenant rejection
- [ ] e.g. Scorecard smoothness at ≥40 measurables × 13 weeks (perf NFR-2.2)

## Review
- `/code-review`: <N findings, all addressed / none> — paste the summary.
- `/design-review`: <scorecard per changed screen, or "no UI changes">.

## Testing
- Tier 1/2 tests added (name the cases that pin the behaviour).

## Acceptance Criteria Met
- [ ] AC from the `plan.md` story / `requirements.md` FR/NFR
- [ ] …
```

### Never merge without (hard gate — even when merging autonomously)
1. **PR base is `main`** (the trunk). Confirm the `--base` flag before opening/merging.
2. `/code-review` **run** on the diff, findings addressed.
3. A filled **"How to verify"** section with concrete browser steps + an explicit "not covered" list.
4. Full `sh scripts/gate.sh` PASS (typecheck + lint + format + tests + coverage floor + build).
5. `/design-review` for any UI change, ≥ 4/5 on every changed screen.
6. No secrets; migrations committed; conventional-commit messages.

A green gate + a merged PR with no review and no verify-steps is a process failure, not a shortcut.

### Scope Discipline
- No unrelated refactors or "future improvements" in a PR.
- PR title matches the primary commit type.
- Mark "Ready for Review" only after both self-review loops and the gate pass.
- Be honest about what the gate proved vs. what still needs human/browser acceptance (`testing.md`).
