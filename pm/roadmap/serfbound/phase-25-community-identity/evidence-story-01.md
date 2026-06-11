# Evidence — SB-25-01 — Local-First Profiles

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `packages/app/src/profile-store.ts` — the profile: a display name
  sanitized to the game font's alphabet (A–Z, digits, the symbol
  glyphs; 12 chars; PLAYER fallback) plus a newest-first match history
  capped at 50, persisted in its own IndexedDB store
  (Browser/Memory implementations on the established store pattern).
- `packages/engine/src/session-protocol.ts` — the hello message carries
  an optional `profile.name` (validated on decode; never part of the
  determinism handshake — names may differ, worlds may not).
- `packages/app/src/multiplayer.ts` / `async-match.ts` — both session
  classes announce the local profile name, surface the opponent's
  (`status.opponentName`), and fire `onEnded` so the shell records
  finished matches.
- `packages/app/src/main.ts` — the profile loads with the shell and
  persists on edit (the "Profile name" input;
  `data-serfbound-profile-name` / `-profile-history-count`); sessions
  start with the profile name; opponents surface as
  `data-serfbound-mp-opponent` / `data-serfbound-cor-opponent`; match
  endings append history (won/lost from defeat flags in realtime,
  abandoned on leave).
- Tests: `tests/ci/app-profile.test.mjs` (sanitization, store
  round-trip + rename + history cap, names across the realtime
  handshake, the ended-match surfacing); `tests/browser/loopback-play.spec.ts`
  (the name persists to the attribute and the joiner sees "ALICE" as
  its opponent in the live session).

## Verification artifacts

```text
npm run test:ci -> # tests 212 / pass 212 / fail 0; 13 passed (1.2m)
node --test tests/ci/app-profile.test.mjs -> 4/4
```

## Deviations from plan

- "Profiles travel into sessions" ships as the handshake name; colors
  and richer cards join the Phase 25 challenge UX (SB-25-03) where they
  have a surface.
- Two same-origin tabs share one local profile (the e2e sets the name
  once); distinct-name testing runs in CI with injected channels.
- Hot-seat matches record no history (one human, both seats).

## Follow-ups

- SB-25-02: the identity decision record and the optional account
  service.
