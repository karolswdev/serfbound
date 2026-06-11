# SB-32-03 — First-Run and Import as a Designed Journey

- **Project:** serfbound
- **Phase:** 32
- **Status:** done
- **Depends on:** SB-32-01
- **Unblocks:** SB-32-05
- **Owner:** unassigned

## Problem

A stranger's first minute is currently a numbered instruction banner
and a file input. The import step is Serfbound's hardest onboarding
moment — it deserves the most design, not the least: what this is,
why your own data, how to get it, what happens to it, and a confident
path to START.

## Scope

- **In:** A designed first-visit composition (the pitch in the
  game's voice, what you need, the privacy promise presented with
  pride — "your data never leaves this device"), a designed import
  affordance (drag-drop zone + picker as one component, progress and
  success states), designed recoverable error states (wrong file,
  corrupt archive, storage trouble) replacing raw status text, the
  returning-player path (data restored → straight to title) styled,
  the demo-version hint surfaced tastefully. Copy per the standard's
  voice. All flows keep their testids.
- **Out:** Hosted-asset onboarding (Phase 31 — this journey is the
  import path's), the online surfaces (SB-32-04), player-guide docs
  rewrites beyond linking.

## Acceptance criteria

- [ ] The first-visit screen answers what/why/how without reading
  the docs, in the product's voice, within the standard.
- [ ] Import succeeds via drag-drop and picker with designed
  progress/success; every recoverable error state is designed and
  reachable in tests.
- [ ] The returning-player path lands on the title state without
  re-explaining; captures (desktop + phone, real data) under phase
  artifacts; ci:release green.

## Test plan

- **Unit:** Copy/state mapping logic if extracted; otherwise n/a.
- **Integration / e2e:** Existing import/recovery specs green
  unchanged; a first-visit spec asserting the journey's states.
- **Manual / device:** A genuine cold run on desktop + phone,
  captured start to START.
- **Design handoff:** The journey as a capture sequence.

## Notes / open questions

- Preserves: the import boundary and every recovery behavior
  (Phase 8); presentation only.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
- Open: whether the first-visit pitch may show a small real-art
  preview before import (decoded from what? nothing imported yet —
  likely no; the standard's illustration tokens decide).
