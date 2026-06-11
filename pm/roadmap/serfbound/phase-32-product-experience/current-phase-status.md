# Phase 32 — Product Experience

**Last updated:** 2026-06-11 (after SB-32-07; the SB-32-05 gate re-presents on the material chrome).
**Status:** in progress.

## Goal

Make everything around the simulation worthy of what's inside it.
The in-game UI is decoded original art (Phases 16/21); the shell
wrapping it — landing, import, panels, buttons, the online surface —
still looks like the engineering rig it grew up as. This phase writes
the design standard the shell never had, rebuilds the chrome to it,
turns first-run into a welcome instead of a checklist, styles the
competitive surfaces like a platform that means it, and gates on the
maintainer looking at the product and recognizing care.

## Background

Maintainer direction, 2026-06-11, verbatim in spirit: the player UI
and shell "look like a development tool" — where is the design
standard, where is the soul, where is the caring? Diagnosis accepted:
every shell story to date gated on function and testids; the standing
visual gate (Phase 10 rule) covered the game world, never the chrome.
No written standard existed, so no bar could fail. The fix is
structural, not cosmetic: a standard first, then conformance,
mechanically encouraged.

## Scope

- **In:** A design-standard canon (tokens, components, layout, voice,
  accessibility floor) with a PMO project extension making UI-facing
  changes answer to it; the shell chrome rebuilt to the standard
  (landing/title composition, the game as hero, designed panels and
  controls, state-driven views); the first-run/import journey as a
  designed experience; the online/multiplayer/profile surfaces styled
  as a competitive platform (cards, badges, empty/loading/error
  states); the experience gate with full-journey captures and the
  maintainer's sign-off.
- **Out:** The in-game original-art UI (Phases 16/21 — untouchable;
  the shell defers to it), new features or surfaces (this phase
  redesigns what exists), UI frameworks/component libraries (the
  zero-dependency posture holds; first-party CSS with design tokens),
  rebranding the name/logo.

## Non-negotiable constraints

- The in-game decoded-art UI is the soul; the shell extends its
  language (palette derived from the game's own decoded palette,
  its typographic feel, its materials) — it never competes with it.
- Every existing test keeps passing: testids and dataset attributes
  are a compatibility contract; restyling must not rewire behavior.
- Accessibility floor: the Phase 8 contrast/focus/reduced-motion
  checks remain green; the redesign raises them, never trades them.
- No new dependencies for UI. Tokens and CSS are first-party.
- Player-facing copy carries the game's voice — no lorem, no
  developer jargon leaking into the product.

## Exit criteria (evidence required)

- [x] The design standard exists as canon (tokens, component
  inventory, layout system, voice, a11y floor) and the PMO extension
  holds UI-facing changes to it. (SB-32-01)
- [x] The shell chrome conforms: landing/title, panels, controls,
  state-driven views — desktop and mobile captures from real data.
  (SB-32-02)
- [x] First-run is a designed journey: a stranger lands, understands,
  imports, and plays — captured end to end. (SB-32-03)
- [x] The competitive surfaces (sign-in, lobby, your-turn, attest,
  profile) read as a platform — all states designed, captured.
  (SB-32-04)
- [ ] The experience gate: full-journey before/after captures, the
  conformance checklist green, existing visual-artifact suite
  regenerated, and the maintainer's recorded sign-off. (SB-32-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-32-01 | The design standard and its enforcement | done | story-01-design-standard.md | evidence-story-01.md |
| SB-32-02 | Shell chrome rebuilt to the standard | done | story-02-shell-chrome-redesign.md | evidence-story-02.md |
| SB-32-03 | First-run and import as a designed journey | done | story-03-first-run-experience.md | evidence-story-03.md |
| SB-32-04 | Competitive surfaces styled as a platform | done | story-04-competitive-surfaces.md | evidence-story-04.md |
| SB-32-05 | Experience gate | in-progress | story-05-experience-gate.md | — |
| SB-32-06 | The product cut | done | story-06-the-product-cut.md | evidence-story-06.md |
| SB-32-07 | Gumps: the material chrome | done | story-07-gumps-material-chrome.md | evidence-story-07.md |

## Where we are

SB-32-01 shipped: `docs/design/design-standard.md` is canon (the
materials palette, type, space/shape/depth/motion, the component
inventory with states, layout/chrome states, voice, the a11y floor);
38 tokens live in `tokens.css` with the buttons/pill/focus ring
converted as reference components; `npm run check:design` rides
`ci:release` (orphan tokens, raw-color ratchet 15 → 0 over the
phase); and rule #8 is mechanically live — the hook block and the
DESIGN-OK override were both proven, and every commit now needs 8
checkboxes. SB-32-02 shipped: the chrome is rebuilt — designed header
with the PixelLab-forged emblem, six purposeful panel groups, the
three chrome states (running yields the screen to the game), raw-color
ratchet at **0**, full ci:release green with zero test edits, and
real-data captures (desktop + phone) for all three states under
artifacts/. pixellab is reachable via raw MCP-over-HTTP (recorded in
evidence) — no session restart needed. SB-32-03 shipped: the welcome
greets beneath the living preview (pitch, drop zone, the privacy
promise, the demo hint), drag-drop and the picker share one import
path with designed dragover/busy/error states, the wrong-file moment
speaks in banner-red where the player looks, and a returning settler
lands straight on the title — three new first-run tests, all tokens
consumed (43/43, reserved list empty), ci:release exit 0 captured
directly. The first overlay design stole the preview's pointer
contract and static-shell.spec caught it — the app yielded (in-flow
welcome), the test stood. SB-32-04 shipped: the lobby is challenge cards, the sign-in moment
presents the device-key model, the match strip narrates through the
closing ceremony. The first SB-32-05 gate verdict REJECTED the round
("still feels like a debugging tool") — the stop signal fired as
designed: SB-32-06 added the missing laws to the standard (*no
diagnostics on the player surface*, *one surface one moment*),
retired the diagnostic rows and dev controls into the collapsed
"Under the hood" ledger (?dev=1 for the suite), gated groups by
chrome state, and made START the title's hero. Both gates green
(ci:release, compatibility 5/5); three dev suites moved to ?dev=1 —
the recorded contract evolution. Gate round 2: "better, but
boring proper HTML/CSS — gumps, nay?" — SB-32-07 answered: §7.5
entered the standard (material chrome: containers only, contrast on
solid fills, flat degradation), three materials forged (the carved
frame, the wood, the ribbon), applied to the column, the panel
groups, and the welcome; slice tuned against the forged pixels;
gump integrity rides check:design. Both gates green. SB-32-05
re-presents on the material chrome.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Taste loops without convergence | high | The standard doc decides; disagreements amend the doc, then the UI | A second rework of the same surface with no standard change |
| Restyle breaks the test contract | medium | Testids/dataset attrs frozen; ci:release after every story | Any suite needing edits beyond additive selectors |
| Shell upstages the in-game art | medium | Palette/type derive from decoded assets; the game stays the hero | A shell element louder than the game canvas |
| A11y regression under prettier paint | low | Phase 8 checks in the gate; contrast tokens in the standard | Any Phase 8 position going red |

## Decisions made (this phase)

- 2026-06-11 — Token hygiene enforces via a reserved list (tokens
  defined ahead of their consuming story, delisted on consumption)
  and a raw-color ratchet (may only decrease) — pragmatic path to
  "no raw literals" without blocking incremental conversion —
  SB-32-01.
- 2026-06-11 — Rule #8 structural check covers CSS/index.html/public;
  `main.ts` markup conformance is certified by checkbox 8 (too much
  non-UI code in that file for a path-based check) — SB-32-01.
- 2026-06-11 — Gate verdict #1 rejected the restyle; diagnostics and
  dev controls are not product UI (standard §4 laws added) and the
  dev surface lives behind `?dev=1` — three suites' goto URLs updated,
  authorized by the maintainer verdict — SB-32-06.

## Decisions deferred

- A custom display font for shell headings (license + glyph
  questions) — default: system stack tuned by tokens until decided.
- ~~Animated/asset-rich landing hero~~ — resolved by restraint in
  SB-32-02: the emblem and composition carry the brand; no heavy hero.
- Dark-only vs dual themes — default: the game's dark idiom only.
