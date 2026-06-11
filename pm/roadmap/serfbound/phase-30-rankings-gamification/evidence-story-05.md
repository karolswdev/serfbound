# Evidence — SB-30-05 — Avatars and Guild Heraldry

- **Shipped:** 2026-06-11
- **Commit:** this commit
- **Owner:** KC (agent-assisted)

## Files touched

- `public/avatars/*.png` (8) + `public/guilds/*.png` (8) — the
  identity library, first-party Settlers-idiom pixel art forged via
  PixelLab raw MCP-over-HTTP (~100KB total). Forge note: rapid-fire
  queueing got rejected by the generation API after four creates; the
  sequential forge (create → poll to completion → next) finished
  16/16 cleanly.
- `packages/app/src/identity-art.ts` — the typed manifest
  (`serfboundAvatars`, `serfboundGuilds`, lookups).
- `packages/app/src/profile-store.ts` — additive `avatarId`/`guildId`
  + `withAvatar`/`withGuild`; older profiles stay valid.
- `packages/app/src/main.ts` — the identity row (portrait, name,
  guild banner) and the disclosure picker (4-column pressable
  choices, `aria-pressed` selection) in the company group;
  `data-serfbound-avatar`/`-guild` for tests.
- `packages/app/src/styles.css` — the §3 "Identity row & picker"
  component, plus a global `[hidden] { display: none !important; }`
  guard (a component's explicit `display` must never resurrect a
  hidden element — this also fixed the match strip's latent
  empty-state visibility).
- `docs/design/design-standard.md` — the component entered §3 first.
- `tests/ci/profile-identity.test.mjs` (3 tests) +
  `tests/browser/identity-customization.spec.ts` (1 spec).
- `pm/.../story-05-avatars-and-guilds.md` — scaffolded and shipped
  this commit (maintainer-directed addition to Phase 30).

## Verification artifacts

```
profile-identity unit: # tests 3 / # pass 3 / # fail 0
  (manifest <-> disk integrity: all 16 entries exist;
   additive schema: choice-less profiles stay valid)
identity-customization.spec: 1 passed
  (pick smith + stag -> row renders -> reload -> persists)
npm run ci:release -> exit=0 (captured directly)
serfbound-design-tokens-ok: 43/43, 0 reserved, ratchet 0/0
```

Real-data captures (local `SPAU.PA`) under `artifacts/`:
`story-05-identity-picker-{desktop,mobile}.png`,
`story-05-identity-row-{desktop,mobile}.png`.

## Acceptance criteria — re-checked

- [x] The 16-piece library is committed and manifest-verified by CI.
- [x] Pick → render → persist proven in the browser spec; the row
  shows portrait, name, and banner.
- [x] Additive schema proven; no network call carries identity — the
  service contract tests are untouched and the picker path performs
  zero fetches (local store only).

## Deviations from plan

- The first forge run queued all 16 creations at once and the API
  rejected everything after the fourth — recorded above; the
  sequential forge is the pattern for future asset batches.
- The `[hidden]` CSS guard exceeded the story's literal scope but
  fixed a live bug the story exposed (match-strip empty state);
  recorded rather than split, since it is one line of base CSS.

## Follow-ups

- SB-30-02 presents the identity on the full profile surface.
- Showing your avatar/guild to opponents requires a wire-format
  decision — the Phase 30 stop-and-decide stands.
- Future asset batches: reuse the sequential forge pattern.
