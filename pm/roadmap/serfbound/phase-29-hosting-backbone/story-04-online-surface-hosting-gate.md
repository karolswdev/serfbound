# SB-29-04 — Online Surface and Hosting Gate

- **Project:** serfbound
- **Phase:** 29
- **Status:** backlog
- **Depends on:** SB-29-03
- **Unblocks:** SB-30-01
- **Owner:** unassigned

## Problem

Phase 25 shipped every online flow CI-proven but left one named gap:
"the shell's online UI (sign-in, lobby, your-turn badge, ladder view)
awaits a deployed service URL." The URL now exists. This story lands
the surface, points `serfbound.com` at the game, and proves a real
match end to end through the public backbone.

## Scope

- **In:** The shell online surface — device-key sign-in/registration,
  challenge lobby, your-turn badge — wired to `api.serfbound.com`
  (configurable endpoint, accountless play untouched and visually
  primary), `serfbound.com` serving the game per the SB-29-01 domain
  decision, an outage-mode regression (API unreachable → play is
  unaffected, online UI degrades quietly), a real correspondence
  match driven challenge → accept → signed moves → dual attestation
  through the public endpoint, the Phase 25 final summary's follow-up
  cross-linked closed.
- **Out:** Ladder/leaderboard views and anything gamified
  (Phase 30), realtime signaling relay (Phase 27).

## Acceptance criteria

- [ ] `serfbound.com` loads the playable game.
- [ ] The shell surface completes a real two-browser correspondence
  match through `https://api.serfbound.com` with agreeing checksums
  (recorded e2e or two-machine manual evidence).
- [ ] With the API blocked, import/play/save flows pass unchanged and
  the online UI reports unavailability recoverably (CI test).
- [ ] Accountless play remains the default path — no sign-in prompt
  gates any existing flow.

## Test plan

- **Unit:** Online-surface state logic (signed-out, signed-in,
  unavailable).
- **Integration / e2e:** Two-context Playwright match against a local
  service pair in CI; the public-URL run recorded as manual evidence.
- **Manual / device:** The real match through `serfbound.com` on two
  machines, screenshots under phase artifacts.
- **Design handoff:** Online-surface screenshots (lobby, your-turn
  badge) under phase artifacts.

## Notes / open questions

- Preserves: Phase 23/25 trustless model — the server stores and
  forwards; clients re-simulate; only dual-attested outcomes rate.
- Browser boundary: network (public HTTPS API), persistence (device
  key remains local).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4; closes the Phase 25 named
  follow-up.
