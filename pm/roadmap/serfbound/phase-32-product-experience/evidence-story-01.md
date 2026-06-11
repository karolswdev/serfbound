# Evidence — SB-32-01 — The Design Standard and Its Enforcement

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `docs/design/design-standard.md` — the canon: soul statement, the
  full token table (materials palette, type, space/shape/depth/
  motion), the component inventory with states, layout and chrome
  states, voice and tone, the accessibility floor, conformance
  process, generated-asset rules.
- `packages/app/src/tokens.css` — 38 tokens as CSS custom properties,
  reduced-motion collapse included.
- `packages/app/src/styles.css` — reference components converted:
  buttons (with the standard's hover/active/disabled states, which
  the shell previously lacked), the runtime pill, root colors, and
  the focus ring all consume tokens.
- `scripts/check-design-tokens.mjs` + `npm run check:design` (wired
  into `ci:release`) — undefined-consumption, orphan-token (with a
  named reserved list for SB-32-02..04), and a raw-color ratchet
  (15 literals remain; may only decrease; SB-32-02 drives to 0).
- `.githooks/pre-commit.config` — `EXPECTED_BOXES=8`.
- `.githooks/pre-commit.local` — the rule #8 structural check.
- `pm/roadmap/PMO-CONTRACT.md` — §8 project extension + the 8th
  template checkbox.

## Verification artifacts

Token hygiene:

```
serfbound-design-tokens-ok: 38 tokens defined, 19 consumed,
  19 reserved, raw-color ratchet 15/15.
```

Regression after the reference-component conversion:

```
unit: # tests 234 / # pass 234 / # fail 0
browser smoke (online-outage, hotseat-play): 2 passed (14.3s)
vite build green; @import bundling verified.
```

Rule #8 enforcement, proven live. The block (a styles.css change
staged with no design canon and no override):

```
✗ Design conformance — UI-facing files staged without design canon:
    - packages/app/src/styles.css
  Rule #8: UI-facing changes answer to docs/design/design-standard.md.
```

The override (`.tmp/DESIGN-OK.md` present):

```
✓ Contract acknowledged (8/8 checkboxes).
  Design conformance (rule #8) satisfied for UI-facing changes.
```

(The override proof commit was reset immediately; a banner formatting
bug it exposed — a literal `\n` — was fixed in the same story.)

Sample capture of the reference components (tokens rendering):
`artifacts/story-01-reference-components.png`.

## Acceptance criteria — re-checked

- [x] The standard answers colors, type, spacing, components and
  states, layout, voice, and the a11y floor, with rationale tied to
  the game's art — `docs/design/design-standard.md` §1–§8.
- [x] Tokens exist as CSS custom properties consumed by reference
  components, rendered in a committed sample capture — tokens.css,
  styles.css buttons/pill/focus, the artifact above.
- [x] The pre-commit extension is live: the block and the override
  both proven above; `PMO-CONTRACT.md` documents rule #8 and the
  template carries checkbox 8.

## Deviations from plan

- The orphan-token check uses an explicit reserved list (token →
  consuming story) rather than failing on tokens defined ahead of
  their surfaces — the list must shrink as SB-32-02..04 land, and
  the check fails if a reserved token gets consumed without being
  delisted.
- A raw-color ratchet (count may only decrease) stands in for "no
  raw hex" until SB-32-02 converts the remaining 15 literals.
- Note for SB-32-02..04: pixellab MCP (offered by the maintainer for
  generated assets) was not connected in this session — connect it
  before the asset-hungry stories.

## Follow-ups

- SB-32-02 consumes most of the reserved tokens and drives the
  ratchet toward 0.
- The display-font and landing-hero decisions stay deferred (phase
  status doc).
