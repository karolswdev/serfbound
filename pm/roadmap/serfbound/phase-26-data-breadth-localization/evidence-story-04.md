# Evidence — SB-26-04 — Localized UI Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `packages/app/src/main.ts` — language selection: `?lang=` wins, then
  the persisted choice (`serfbound.language` in localStorage), then
  English; the shell "Language" button toggles, persists, and
  re-renders; `data-serfbound-language` exposes the state.
- `scripts/capture-local-screenshots.mjs` — `SERFBOUND_CAPTURE_LANG`
  captures the visual gate in either language.
- Tests: `tests/browser/localized.spec.ts` — the German sweep: a
  hot-seat match's whole notice pipeline in German ("SPIELER 1 - DEIN
  ZUG" → "SPIELER 2 ENTER - 60" → "RÜCKBLICK - SPIELER 2 SIEHT ZU" →
  the digest "ZUG 1 - SPIELER 1 ZOG"), persistence across a reload
  without `?lang`, and the toggle back to English persisting too.

## Verification artifacts

```text
npm run test:ci -> # tests 225 / pass 225 / fail 0; 14 passed (1.2m)
boundaries / independence / docs -> all ok
npx playwright test tests/browser/localized.spec.ts -> 1 passed (8.6s)
npm run capture:local:screenshots (LANG=de, real SPAU.PA) ->
  artifacts/capture-de-*: the hand-over screen reads
  "SPIELER 2 ENTER - 60" in the shadowed game font over the live world
```

Layout audit (longer German strings vs their surfaces, at the 8px
advance): the widest popup row is exactly the interior — "GEFAHR 3
STUFE 4" and "TON AN MUSIK AUS" are 16 characters = 128px = the popup
interior width; the init rows max at "STARTWERT" (9) and "MISSION
FREI" (12) inside the 16-character box; notices center on the canvas
with ample width. Nothing wraps or clips.

## Deviations from plan

- The extended-script decision is recorded in the final summary:
  scripts beyond the original font's A–Z/digits/umlauts (Cyrillic,
  CJK, …) cannot render from the player's data; supporting them would
  mean shipping a custom bitmap font — deferred until a community
  translation demands it, with the glyph-coverage test as the
  tripwire.
- The proving pair is en/de per plan; further languages are community
  follow-ups (the table format is the contribution surface).

## Follow-ups

- Phase 27 (realtime WebRTC) is the roadmap's last scaffolded phase.
