# SB-32-02 — Shell Chrome Rebuilt to the Standard

- **Project:** serfbound
- **Phase:** 32
- **Status:** backlog
- **Depends on:** SB-32-01
- **Unblocks:** SB-32-05
- **Owner:** unassigned

## Problem

The shell is a canvas with a stacked debug aside: raw labeled values,
a column of utilitarian buttons, no hierarchy, no states. A player
should see a product: the game as hero, chrome that recedes during
play, and panels that present information instead of dumping it.

## Scope

- **In:** The shell layout rebuilt on the SB-32-01 tokens: a designed
  header/toolbar (title treatment, status as a quiet pill), the game
  canvas as the composition's hero at every viewport, the status
  panels redesigned into purposeful groups (play, data, save) with
  designed value/detail presentation, the action buttons as a
  coherent control system (primary/secondary hierarchy, hover/focus/
  disabled states), **state-driven chrome**: pre-import, title-ready,
  and running each get their own composition (running minimizes
  chrome), notifications/toasts styled, mobile layout designed rather
  than stacked. All testids and dataset attributes preserved.
- **Out:** First-run journey content (SB-32-03), online surfaces
  (SB-32-04), any in-game rendering change, feature changes.

## Acceptance criteria

- [ ] Every visible shell element traces to a standard component; no
  unstyled or default-styled control remains.
- [ ] The three chrome states (pre-import / title / running) are
  visibly distinct compositions; running mode demonstrably yields
  the screen to the game.
- [ ] `npm run ci:release` green with zero test edits beyond additive
  selectors; Phase 8 a11y positions green.
- [ ] Desktop + phone captures from real local data land under phase
  artifacts.

## Test plan

- **Unit:** Existing suites unchanged (the compatibility contract is
  the test).
- **Integration / e2e:** Full browser suite; a new chrome-state spec
  asserting the three compositions via dataset attributes.
- **Manual / device:** Real-data review on desktop + phone, captured.
- **Design handoff:** Before/after captures per surface.

## Notes / open questions

- Preserves: every behavior and selector; presentation only.
- Browser boundary: none new — DOM/CSS.
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
