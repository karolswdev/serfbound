# SB-32-07 — Gumps: The Material Chrome

- **Project:** serfbound
- **Phase:** 32
- **Status:** done
- **Depends on:** SB-32-06
- **Unblocks:** SB-32-05 (the gate re-presents)
- **Owner:** unassigned

## Problem

Gate round 2 feedback: better, but the chrome is still "boring and
proper HTML/CSS" — the maintainer wants forged pixel-art materials
("gumps") so the shell itself carries the serfy feel: carved frames,
wood, ribbon, not flat rectangles.

## Scope

- **In:** Standard §7.5 (gumps: material chrome — containers only,
  text contrast independent of texture, flat-CSS degradation); three
  forged materials via the sequential PixelLab pattern
  (`packages/app/src/gumps/`: the 9-slice carved frame, the tileable
  dark wood, the parchment ribbon); applied: frames on panel groups
  and the welcome card (border-image, slice tuned to the carved bar
  by inspecting the forged pixels), wood under an ink veil on the
  chrome column, the ribbon carrying the welcome's herald line;
  gump-integrity in `check:design` (a referenced material must exist
  on disk); assets bundled via CSS url() so vite hashes them and
  paths survive any base.
- **Out:** Texturing buttons/inputs (state-tinting pixel art is its
  own story if wanted), in-game UI, light-parchment surfaces (the
  dark idiom stands).

## Acceptance criteria

- [ ] The chrome column, panel groups, and welcome card render forged
  materials; text sits on solid token fills (a11y floor measured
  green).
- [ ] A missing gump degrades to the SB-32-02 token chrome, never to
  broken UI; `check:design` fails on a referenced-but-missing
  material.
- [ ] Full ci:release and compatibility green; captures refreshed.

## Test plan

- **Unit:** check:design gump-integrity (verified failing on a
  missing file during development).
- **Integration / e2e:** Full suites — presentation-only change.
- **Manual / device:** The rendered materials inspected (the forged
  pixels and the composed page) before shipping; captures desktop +
  phone.
- **Design handoff:** Refreshed state captures under phase artifacts.

## Notes / open questions

- Preserves: every behavior, testid, and the §6 floor; texture never
  carries text.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: re-arms exit criterion 5.
