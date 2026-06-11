# SB-32-06 — The Product Cut

- **Project:** serfbound
- **Phase:** 32
- **Status:** done
- **Depends on:** SB-32-02
- **Unblocks:** SB-32-05 (the gate re-presents after this)
- **Owner:** unassigned

## Problem

The maintainer's gate verdict on the first redesign round, verbatim
in spirit: "still basically feels like a debugging tool and not a
real product." Diagnosis accepted: SB-32-02 restyled the rig instead
of questioning it — diagnostic readouts (hover coordinates, selected
tile, command state, pipeline source) and dev controls (sidebar build
buttons duplicating the in-game Phase 16 UI) remained on the player
surface, just prettier. The standard lacked the law that forbids
them.

## Scope

- **In:** Two new standard laws (§4): *no diagnostics on the player
  surface* and *one surface, one moment*; the dev ledger (§3) — one
  collapsed disclosure holding all diagnostics and dev controls,
  opened by `?dev=1`; chrome-state group gating (pre-import hides
  realm/saves; running hides the start surface); START as the title
  moment's hero; the sidebar build buttons retired to the ledger
  (the in-game original-art UI is the only in-game control surface).
- **Out:** New player features; in-game UI changes; removing any
  testid (the suite's surface moves behind `?dev=1`, it does not
  shrink).

## Acceptance criteria

- [ ] No diagnostic row or dev control is visible on the default
  player surface in any chrome state; the ledger holds them all,
  collapsed.
- [ ] Pre-import shows welcome + data (+ identity/online); title
  leads with START; running shows session controls only —
  spec-asserted.
- [ ] The full suite passes: product specs on the player surface,
  the three dev-control specs via `?dev=1` (the recorded contract
  evolution); compatibility 5/5.

## Test plan

- **Unit:** Existing suites unchanged.
- **Integration / e2e:** chrome-states.spec extended (start hidden
  running, ledger closed, diagnostics hidden); static-shell /
  decoded-scene / high-dpi on `?dev=1`; full ci:release +
  compatibility.
- **Manual / device:** The three states reviewed and captured with
  real data, desktop + phone.
- **Design handoff:** Before/after captures under phase artifacts.

## Notes / open questions

- Preserves: every testid and behavior — the dev surface is the old
  surface, one query param away.
- Contract evolution, recorded: three specs' goto URLs gained
  `dev=1` (mechanical, behavior-identical); authorized by the
  maintainer's gate verdict, which outranks the phase's zero-edit
  constraint. The phase risk table's stop signal fired exactly as
  designed: rework only after the standard changed.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: re-arms exit criterion 5 (SB-32-05).
