---
name: ui-ux
description: Design system, MUI / Material 3 styling, visual hierarchy, motion, accessibility (WCAG AA), states, and the AI design self-review loop for Cadence. Use when building screens, components, theming, states, or reviewing how the UI looks and feels.
---

# UI/UX: How We Look

> The bar is **Google-grade**: every screen should feel like a polished, premium internal tool people are
> glad to use daily. Design is decided per screen, reviewed with the loop below, and gated before any UI
> PR. The product's specific screens live in `requirements.md`; this skill is *how to make any screen
> excellent* with **MUI (Material UI) v6 + MUI X**.

## North Star — what "good" means here

1. **Calm and confident.** Generous whitespace, few elements, one clear focal point per screen. When in
   doubt, remove.
2. **One primary action per screen.** Make it obvious (a single filled button / FAB); everything else is
   visually quieter.
3. **Content first, chrome last.** The team's data is the hero; navigation and controls recede.
4. **Effortless.** The core action (check a Todo, type a Scorecard number, update a Rock) is reachable in
   one click and never makes the user hunt.
5. **Consistent.** The same action looks and lives in the same place on every screen. Reuse components;
   don't reinvent a button.
6. **Alive but not noisy.** Motion confirms and guides; it never decorates or delays.

This is a **data tool** (meetings run from the Scorecard and lists), so it's also **dense where it earns
it**: compact grids/tables, comfortable everywhere else. Dense ≠ cramped — hierarchy still rules.

## Design tokens — never hardcode

**Everything visual comes from the MUI theme in `src/theme/`** — no literal colors, px font sizes, ad-hoc
paddings, radii, or durations in components. This is what makes the app consistent, themeable, and
light/dark-correct, and it is enforced in design review.

| Token group | Source | Rule |
| ----------- | ------ | ---- |
| Color | `theme.palette` (Material 3 scheme seeded from Google blue `#1a73e8`) | Use semantic roles (`primary`, `error`, `text.secondary`, `background.paper`, `divider`). Never a raw hex in a component. |
| Status | custom `theme.palette.status` = `{ onTrack, atRisk, offTrack }` + an **icon map** | Status is always color **+ icon + label** (below). |
| Type | `theme.typography` roles (`h1…h6`, `subtitle*`, `body*`, `caption`, `overline`) | Pick a role; never a literal `fontSize`. |
| Spacing | `theme.spacing()` (8-pt base: `spacing(1)=8`) | All padding/margin via `spacing()` / `sx` multiples. |
| Radius | `theme.shape.borderRadius` (one small scale) | One corner-radius family across the app. |
| Elevation / surface | M3 tonal surfaces (`background.paper`, elevation levels) | Prefer tonal elevation over heavy shadows. |
| Motion | `theme.transitions` (durations + easings) | Standard durations/easings; no magic `ms`. |

- Implement light + dark with MUI's **CSS variables theme** (`extendTheme` + `CssVarsProvider`,
  `colorSchemes: { light, dark }`) so the theme switches with the OS and a manual toggle, with no flash.
- `body` and every surface get an explicit background from the palette in both schemes.

## Visual hierarchy & layout

A user should know **where to look first** within half a second.

- **One focal point** per screen, set by size/weight/color/isolation — not all four.
- **Proximity = relationship.** Group related things tightly; separate with whitespace, not dividers.
- **Alignment.** Pick a grid and hold it; left-align to a shared edge. Use MUI `Grid`/`Stack` with
  consistent `spacing`.
- **Breathe.** Page gutters ≥ 16px (often 24); don't fill the canvas.
- **Density by context:** compact on the Scorecard grid and Issues/Todos tables; comfortable on Home,
  dashboards, forms, and detail screens. Be consistent within a screen.

## Typography

- Use the `theme.typography` roles; 4–6 distinct styles across the whole app, not a dozen.
- Hierarchy by **weight + size + color**, in that order.
- Body text ~1.4–1.5 line height; measure ~60–75 characters; never center long runs.
- Numbers/labels in tables use **tabular figures** so columns align (Scorecard, Todos due dates).
- Long text truncates with ellipsis + a tooltip/title; layouts survive the longest realistic string.

## Color & theming

- **One seed → full Material 3 scheme.** Don't fight it with ad-hoc colors.
- **Restraint.** ~60% neutral surface / 30% secondary / 10% accent. One accent (primary) carries the
  main action.
- **Semantic roles, not raw colors**, so dark mode and re-theming "just work."
- **Light + dark parity** — verify *both* in review; dark mode is not an inverted afterthought.
- **Never encode meaning by color alone** (restated because it's the most-missed): status chips, red/
  green Scorecard cells, overdue Todos each pair color with an **icon + text**. The status→icon map lives
  in the theme:
  - on-track → ✔ (success/green) · at-risk → ▲ (warning/amber) · off-track → ✖ (error/red) · done → ●
    (neutral/primary). Scorecard: goal met → ✔ green · missed → ✖ red · empty → neutral dash.

## Motion & micro-interactions

Motion's job is to **explain change and confirm action** — fast, purposeful, skippable.

- **Durations** 150–250ms for most UI, up to ~300ms for larger transitions. Use `theme.transitions`.
- **Easing** ease-out for entrances, ease-in for exits. Never linear for UI.
- **Every action gets feedback**: ripples/hover/press states, an optimistic state change (don't pop
  content in), a subtle settle when a mutation reconciles.
- **Loading**: MUI `Skeleton` that mirrors the final layout, not a bare centered spinner, wherever the
  shape is known.
- **Respect reduce-motion**: honor `prefers-reduced-motion` (damp large motion).

## Component & screen patterns (MUI)

- **Buttons**: one hierarchy per screen — **one** `variant="contained"` (primary) → `outlined`/`text`
  (secondary/tertiary). Verb labels ("Add Rock", "Save"), never "OK/Submit" where a verb fits.
- **Interactive targets** are comfortably clickable and **fully keyboard operable** with a visible
  `:focus-visible` ring; don't remove focus outlines.
- **Tables/grids**: the Scorecard uses **MUI X DataGrid** (compact density, sticky measurable column,
  current-week highlight, inline edit). Lists (Issues/Todos) use consistent row height and spacing.
- **Dialogs** for short blocking decisions (confirm archive); **drawers/sheets** for contextual
  create/edit forms tied to an item. A confirm dialog precedes any destructive/archive action.
- **FAB / primary create**: the single most important create action on a screen, and only that.
- **Forms**: label every field; validate inline (RHF + Zod) with a clear message and a path to fix;
  disable submit until valid; show progress; **never lose input on error**.
- **Icons**: one family (`@mui/icons-material`); meaningful, not decorative; consistent size.

## Loading / Error / Empty / Content — design all four

Every screen renders every branch explicitly. A blank screen during load, or a raw error, is a bug.

| State | Design |
| ----- | ------ |
| **Loading** | **Skeleton** mirroring the final layout (grid rows, cards). Spinner only for short, shape-unknown waits. |
| **Empty** | First-run guidance: a friendly line + one clear CTA ("Add your team's first Rock"). The empty state is a *welcome*, never a blank canvas. |
| **Error** | Plain-language cause + **Retry**. Never a stack trace or `Error: …`. A permission issue reads as "read-only — you're not on this team", not a scary failure. |
| **Content** | The data, as the hero. |

**Optimistic UI**: interactive writes update immediately with a subtle pending state; on failure the
change **rolls back visibly** and is surfaced with a retry — never silently dropped (NFR-5).

## First impression & onboarding

- The **sign-in screen** is calm and obviously trustworthy: product name, one line of value, and exactly
  two actions — "Sign in with Google" and "Sign in with Microsoft".
- The **My Week** home is the first thing most people see daily — it must communicate "here's what's on
  me this week" at a glance, with inviting empty states when a section is clear.
- **No paywall, no monetization, no upsell** — this is an internal tool. Don't add entitlement gates.

## Accessibility (WCAG 2.1 AA — a requirement, not optional)

- Text contrast ≥ **4.5:1** (≥ 3:1 large), verified in **both** light and dark.
- **Full keyboard operability**, including the DataGrid (arrow keys between cells, Enter to edit, Tab
  order sane) and all dialogs/menus; visible focus states everywhere.
- Meaningful **roles and labels** (`aria-label`, `aria-describedby`, table header associations) so screen
  readers announce role + state (e.g. "Website leads, week 40, 48, below goal 50").
- Support **200% browser zoom / text scaling** without clipping — relative units, no fixed heights that
  trap text.
- **Never color-alone** (status, red/green cells, overdue) — always an icon/shape + text too.
- **Charts** (MUI X Charts trends) expose a **text alternative**: a summary sentence + the accessible
  values.

## Strings

English v1 (US EOS methodology). Keep user-facing copy out of deep component internals (a small strings
module per feature) so a later i18n pass is possible — but full localization is **not** a v1 requirement.
Dates/numbers format via `date-fns` / `Intl`, in the viewer's locale and timezone.

## Component-testing the UI (keeps the loop deterministic)

These rules make screens testable without a browser (see `testing.md`):

- **Don't await a spinner that never settles.** Drive each state by passing props / mocking the data
  hook; assert the loading / empty / error / content UI per state.
- **Query by role/label**, not by brittle text/position — which also enforces the a11y labels above.
- Assert that status/overdue cues render as **icon + text**, and that off-team screens render **read-only**
  (no edit affordances).
- Add a Playwright screenshot of each key screen state so visual regressions are catchable (see the
  design loop).

## AI design self-review loop (do this before every UI PR)

Logic tests can't see the screen. **Look at what you built and grade it** — the core feedback loop.
`/design-review` automates it; the steps:

1. **Render reality.** Run the app (`/run` or `pnpm dev`) and capture each affected screen in the states
   that matter: **light + dark**, **default + 200% zoom**, **empty + populated**. A Playwright screenshot
   script is fine; say if the review was screenshot-based rather than live.
2. **Score against the rubric** (below) as a skeptical senior product designer reviewing a premium tool —
   not the author hoping it's fine.
3. **Fix everything under 4/5**, re-render, re-score. Iterate until every row is ≥ 4 — or the remaining
   gaps are genuine product/brand decisions you **take to the user** with options (see "Ask about
   design"). Don't silently ship a 2.
4. **Record** the final scorecard in the PR.

### Design scorecard (fill this in — 1–5 each)

| # | Dimension | What a 5 looks like |
| - | --------- | ------------------- |
| 1 | Hierarchy & focus | One obvious focal point; scan path immediate; secondary stuff visually quiet |
| 2 | Spacing & alignment | Snaps to the 8-pt grid; generous margins; everything aligns to a shared edge |
| 3 | Typography | 4–6 styles, clear hierarchy, readable measure + line height, tabular figures in tables |
| 4 | Color & theming | Restrained, semantic roles only, **light/dark parity**, contrast passes |
| 5 | Consistency | Matches the system and sibling screens; reused components |
| 6 | States | Loading (skeleton) / empty (inviting CTA) / error (clear + retry) all designed; optimistic + rollback |
| 7 | Motion & feedback | Every action acknowledged; transitions purposeful and fast; reduce-motion respected |
| 8 | Accessibility | Keyboard incl. grid, contrast ≥ 4.5:1 both themes, roles/labels, 200% zoom, not color-alone |
| 9 | Microcopy | Clear, human, verb-led; friendly empty/error copy; no jargon |
| 10 | **Worth using daily?** | Honestly — does this feel like a premium internal tool people like opening? |

A screen ships when rows 1–10 are all ≥ 4 **and** row 10 is a confident yes. Otherwise: fix, or ask.

> Run the rubric as a **subagent** ("review these screenshots as a skeptical senior product designer;
> score each dimension and list concrete fixes") so the critique isn't graded by the context that built
> it. `/design-review` does this for you.

## Ask about design — early and often

Visual/product-feel decisions are the user's to make and expensive to redo. **Prefer asking over
assuming** when there's more than one reasonable direction. Ask well:

- **Show, don't describe.** Use `AskUserQuestion` with **option previews** (ASCII mockups, layout
  sketches, alternative copy) so the user picks concrete artifacts, not adjectives.
- **Batch** related design questions (1–4), lead with a **recommended** option.
- **Always ask before** committing to: brand direction (seed color / name / logo), a key screen's layout,
  navigation structure, or any irreversible visual-identity choice.
- Don't ask about things the design system already answers (which button variant, what spacing) — apply
  the tokens and move on.

See `workflow.md` → "How to ask well" for the mechanics.
