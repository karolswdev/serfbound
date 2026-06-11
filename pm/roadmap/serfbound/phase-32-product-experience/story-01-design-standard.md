# SB-32-01 — The Design Standard and Its Enforcement

- **Project:** serfbound
- **Phase:** 32
- **Status:** done
- **Depends on:** none
- **Unblocks:** SB-32-02, SB-32-03, SB-32-04
- **Owner:** unassigned

## Problem

The shell has no written design standard, so thirty phases of
function-gated stories produced a development tool. Taste cannot be
enforced; a standard can. This story writes the canon every later
surface answers to, and wires the PMO extension that keeps future
UI-facing work honest.

## Scope

- **In:** `docs/design/design-standard.md` as project canon: design
  tokens (palette derived from the game's decoded palette and the
  existing `#12161a` idiom, spacing scale, radii, elevation, motion),
  typography system, the component inventory with states (buttons,
  panels/cards, inputs, badges, toasts, lobby entries, empty/loading/
  error patterns), layout grid (the game canvas as hero; chrome
  recedes), voice-and-tone for player-facing copy, the accessibility
  floor (contrast ratios, focus visibility, reduced-motion); tokens
  shipped as first-party CSS custom properties; the PMO project
  extension (rule #8 per `PMO-CONTRACT.md` §Extending): UI-facing
  changes certify design-standard conformance, with a
  `.tmp/DESIGN-OK.md` rationale override and `EXPECTED_BOXES=8`.
- **Out:** Applying the standard to surfaces (SB-32-02..04), custom
  font procurement (deferred decision), any in-game UI change.

## Acceptance criteria

- [ ] The standard answers, in writing: colors, type, spacing,
  components and their states, layout, voice, and the a11y floor —
  with rationale tied to the game's own art.
- [ ] Tokens exist as CSS custom properties consumed by at least one
  reference component, rendered in a committed sample capture.
- [ ] The pre-commit extension is live: a UI-facing diff without the
  conformance checkbox (or `DESIGN-OK` rationale) blocks; the
  contract template and `PMO-CONTRACT.md` document rule #8.

## Test plan

- **Unit:** Token file lints (valid CSS, no orphan tokens) via the
  docs/check scripts.
- **Integration / e2e:** A hook dry-run proving the block and the
  override both work (recorded).
- **Manual / device:** The reference component reviewed at desktop
  and phone widths.
- **Design handoff:** The standard itself + the sample capture.

## Notes / open questions

- Preserves: the decoded-art in-game UI as the source of the
  language; the zero-dependency posture.
- Browser boundary: none new — CSS and process.
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
- Open: whether the standard also governs the GitHub-facing media
  (Phase 28) — recommend yes, noted for SB-28-01.
