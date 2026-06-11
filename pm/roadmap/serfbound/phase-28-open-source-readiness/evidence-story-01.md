# Evidence — SB-28-01 — Gameplay Media Pipeline

- **Shipped:** 2026-06-11 (bundled with SB-28-02; see Notes on both
  stories — the README and the media it references are inseparable
  for a green main)
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `pm/roadmap/serfbound/adoption/gameplay-media-decision.md` — the
  decision record extending the asset/legal boundary to committed
  screenshots of the running product (the Phase 10 artifact posture,
  extended to the public face; budget, regeneration, stop signal).
- `scripts/capture-readme-media.mjs` + `npm run capture:readme:media`
  — opt-in, real-data, seed-pinned (`6235842872325272`): welcome,
  title, settlement (START → castle founded → serfs at work),
  social-preview (1200×630), mobile; pngquant quantization built in
  (palette art quantizes ~losslessly; 4.3MB → 1.2MB).
- `docs/media/` — the five committed scenes (1230KB of the 1465KB
  budget).
- `scripts/check-readme-media.mjs` + `npm run check:media` (wired
  into `ci:release`): every README reference exists, every committed
  image is referenced, the budget holds.

## Verification artifacts

```
serfbound-readme-media-ok: 5 scenes from seed 6235842872325272
serfbound-readme-media-check-ok: 5 referenced, 5 committed,
  1230KB of 1465KB budget
failure-mode proven: mobile.png removed ->
  "README references missing media: docs/media/mobile.png"
npm run ci:release -> exit recorded in the bundled commit
```

The captures were visually inspected before commit (the SB-29-04
rainbow lesson): real decoded terrain, the original panel bar, the
decoded start screen — the settlement scene even caught a
"DEED DONE" notice in the game font.

## Acceptance criteria — re-checked

- [x] The media decision record exists and names what is and is not
  committable.
- [x] One opt-in command regenerates every committed image from a
  seed-pinned game; scene list and seed recorded (script + record).
- [x] The committed set stays within the recorded budget, and the
  CI-safe check fails on missing referenced media — proven both ways.

## Deviations from plan

- Animated capture (GIF): not taken — the five stills fit the budget
  with room; a GIF would not. Stands as the recorded default.
- pngquant is a maintainer-machine prerequisite for regeneration
  (the script warns if absent; the budget check enforces).

## Follow-ups

- SB-28-03 uses `social-preview.png` for the repository's social
  card (a manual repo-settings step).
