# SB-30-01 — Ladder and Leaderboard Surface

- **Project:** serfbound
- **Phase:** 30
- **Status:** done
- **Depends on:** SB-29-04
- **Unblocks:** SB-30-04
- **Owner:** unassigned

## Problem

The dual-attested Elo ladder has existed since Phase 25 — as JSON in
a service nobody can see. Ratings only motivate when they are
visible: a leaderboard, your own standing, and the opponent's rating
on a challenge.

## Scope

- **In:** A leaderboard view in the shell (rank, name in the game
  font, rating, games played) fetched from the deployed ladder,
  the signed-in player's own standing surfaced, opponent ratings
  shown on incoming/outgoing challenges, disputed outcomes rendered
  visibly quarantined (not silently dropped), an honest-limits note
  on the surface (reputational ratings, modest stakes), graceful
  unavailable state per the SB-29-04 outage model.
- **Out:** Profiles and statistics (SB-30-02), seasons (deferred),
  any ladder service changes.

## Acceptance criteria

- [ ] The leaderboard renders live ladder data in the shell; the
  player's own row is locatable.
- [ ] Challenges show opponent ratings; disputed matches are visible
  as quarantined.
- [ ] The surface degrades recoverably when the service is
  unreachable, and accountless players see the leaderboard read-only
  without any sign-in pressure.

## Test plan

- **Unit:** Leaderboard state/rendering logic against fixture ladder
  payloads (populated, empty, disputed, unavailable).
- **Integration / e2e:** Playwright against the in-process service
  pair: rated match → leaderboard reflects the rating change.
- **Manual / device:** The deployed-URL leaderboard captured under
  phase artifacts.
- **Design handoff:** Leaderboard screenshots (desktop + mobile)
  under phase artifacts.

## Notes / open questions

- Preserves: Phase 25 ladder semantics untouched — only dual-attested
  outcomes rate; the surface adds eyes, not rules.
- Browser boundary: network (read paths on the public API).
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
