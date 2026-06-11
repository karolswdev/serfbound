# SB-30-05 — Avatars and Guild Heraldry

- **Project:** serfbound
- **Phase:** 30
- **Status:** done
- **Depends on:** none (added 2026-06-11 by maintainer direction;
  independent of SB-30-01..04 ordering)
- **Unblocks:** enriches SB-30-02 (profiles)
- **Owner:** unassigned

## Problem

Players are a name in a game font. The maintainer wants a
customizable platform: a face and a banner — an avatar and a guild —
both unmistakably in the Settlers idiom, generated as first-party art
through PixelLab per the design standard §8.

## Scope

- **In:** A generated identity library (8 avatars: knight, builder,
  farmer, miner, fisher, smith, monk, trader; 8 guild banners: wolf,
  eagle, boar, oak, tower, axes, ship, stag) committed under
  `public/avatars` and `public/guilds` with a typed manifest
  (`identity-art.ts`); local-first profile fields (`avatarId`,
  `guildId`, additive — older profiles stay valid); the identity row
  and disclosure picker in the shell per the standard's new §3
  component; persistence across reloads.
- **Out:** Sending identity over the wire (the Phase 30 schema
  constraint stands — the four-field identity schema and the mailbox
  format do not widen; opponents seeing your avatar is a future
  stop-and-decide), custom uploads, guild membership mechanics
  (rosters, shared ladders — future phase material).

## Acceptance criteria

- [ ] The 16-piece library is committed, manifest-verified by a CI
  test (every entry's art exists on disk).
- [ ] A player picks an avatar and a guild from the shell; the row
  shows portrait, name, and banner; choices persist across reloads —
  browser-proven.
- [ ] Profiles without choices remain valid (additive schema); no
  network call carries identity (wire format untouched).

## Test plan

- **Unit:** `tests/ci/profile-identity.test.mjs` — manifest/disk
  integrity, helper round-trips, additive-schema validity.
- **Integration / e2e:** `tests/browser/identity-customization.spec.ts`
  — pick, render, reload, persist.
- **Manual / device:** Picker reviewed on desktop + phone, captured.
- **Design handoff:** Identity row/picker captures under phase
  artifacts; the §3 component amendment in the same commit.

## Notes / open questions

- Preserves: the privacy posture — identity is self-representation,
  stored beside the saves, never uploaded.
- Browser boundary: persistence (profile store, additive fields).
- .NET reference use: none.
- Phase gate advanced: feeds exit criterion 2's profile surface
  (SB-30-02 will present these on the profile proper).
- Generated via PixelLab raw MCP-over-HTTP (the SB-32-02 pattern);
  asset rules per design standard §8.
