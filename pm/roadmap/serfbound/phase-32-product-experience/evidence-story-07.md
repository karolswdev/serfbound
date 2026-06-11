# Evidence — SB-32-07 — Gumps: The Material Chrome

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `packages/app/src/gumps/{frame,wood,ribbon}.png` — the forged
  material set (PixelLab, sequential pattern): the carved dark-wood
  9-slice frame with gold rivets, the tileable dark forest wood, the
  swallow-tail parchment ribbon. Bundled via CSS `url()` so vite
  hashes them and paths survive any deploy base.
- `packages/app/src/styles.css` — materials applied: frames on panel
  groups and the welcome card (`border-image`, slice 16 / 12px —
  tuned by inspecting the forged pixels: the carved bar is ~12-16px,
  slice 32 would have dragged the cream center into the edge tiles),
  wood under the new `--sb-ink-veil` on the chrome column
  (`background-clip: padding-box` keeps fills off the frames'
  transparent flanks), the ribbon carrying "Your realm awaits".
- `packages/app/src/tokens.css` — `--sb-ink-veil`.
- `docs/design/design-standard.md` — §7.5 entered canon first:
  materials texture containers, never text; contrast measured on
  solid fills; flat-CSS degradation guaranteed.
- `scripts/check-design-tokens.mjs` — gump integrity: a material
  referenced in CSS must exist on disk.

## Verification artifacts

```
serfbound-design-tokens-ok: 44 tokens defined, 44 consumed,
  0 reserved, ratchet 0/0
gump integrity proven both ways: frame.png removed ->
  "gump referenced but missing on disk"; restored -> ok
npm run ci:release -> exit=0
npm run test:compatibility -> exit=0 (5/5; contrast positions
  measured green over the veiled texture)
```

Visual verification: the forged pixels and the composed page were
both inspected before shipping (the frame's cream center is unused
by design — border-image without `fill` draws only the slices); all
state captures refreshed with real local `SPAU.PA`, desktop + phone.

## Acceptance criteria — re-checked

- [x] Column, panel groups, and welcome card render forged
  materials; text sits on solid token fills; compatibility's
  contrast measurement green.
- [x] Degradation: missing gumps leave the SB-32-02 token chrome
  (background/border fallbacks behind every `url()`), and
  `check:design` fails on a missing material — proven above.
- [x] Both gates green; captures refreshed.

## Deviations from plan

- Buttons/inputs stay token-flat this round (state-tinting pixel
  art is its own story if the maintainer wants it) — scoped Out.

## Follow-ups

- SB-32-05 re-presents the gate on the material chrome.
- If the gate wants more material reach (buttons, the canvas frame,
  scrollbars), forge additions follow §7.5 + §8.
