# Phase 25 — Community and Identity

**Last updated:** 2026-06-10.
**Status:** in progress — SB-25-01..03 done.

## Goal

Let players be someone and challenge each other: local-first profiles,
an optional account service with a hard privacy boundary, challenges
plus the correspondence turn mailbox (store-and-forward moves, pickup
deadlines, "your turn" surfacing) serving the Phase 23 async matches,
and a ladder — all while the game itself stays fully playable with zero
accounts and zero servers.

## Scope

- **In:** Local profiles (name, colors, match history) with no server,
  the identity decision record (what an account is for, what is stored,
  what is never stored), an optional minimal account service,
  challenge issue/accept with match terms and the turn mailbox with
  server-side pickup deadlines and forfeit semantics, opponent-verified
  match results feeding a ladder, abuse/operations posture for the
  hosted pieces.
- **Out:** Monetization (none — GPL project, standing rule), social
  graphs/chat platforms, federation, realtime play (Phase 27).

## Non-negotiable constraints

- Accountless play is first-class forever: identity is optional
  convenience, never a gate on playing.
- Data minimization: the service stores what the decision record
  enumerates and nothing else; no emails-for-the-sake-of-it, no
  tracking, nothing sellable.
- Original game data never touches any hosted service.

## Exit criteria (evidence required)

- [x] Local profiles persist and travel into multiplayer sessions with
  no hosted dependency. (SB-25-01)
- [x] The identity decision record ships and the optional account
  service implements exactly it. (SB-25-02)
- [x] Challenges create matches with agreed terms; turn moves flow
  through the mailbox (re-verified client-side, always) and missed
  pickups forfeit per the recorded semantics. (SB-25-03)
- [ ] Verified match results produce a ladder with an honest
  abuse/operations posture; phase gate reruns green. (SB-25-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-25-01 | Local-first profiles | done | story-01-local-first-profiles.md | evidence-story-01.md |
| SB-25-02 | Identity decision and account service | done | story-02-identity-account-service.md | evidence-story-02.md |
| SB-25-03 | Challenges and the turn mailbox | done | story-03-challenges-turn-mailbox.md | evidence-story-03.md |
| SB-25-04 | Ladder and operations gate | backlog | story-04-ladder-operations-gate.md | — |

## Where we are

SB-25-01..03 shipped: local profiles, the device-key identity layer,
and now the turn mailbox — a real correspondence match plays through
the real service in CI (challenge → lobby → accept → signed moves →
client-side re-verification → agreeing checksums), with whose-turn
listings and deadline forfeits enforced. Next: SB-25-04 closes the
phase with the ladder, the ops posture, and the shell surface.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Hosted identity erodes the privacy posture | medium | Decision record first; data-minimization contract tests | Any field stored beyond the record |
| The mailbox grows into a game server | medium | Store-and-forward only; clients re-verify every move | Any rules logic at the service |
| Ladder gaming/abuse | high | Opponent-verified results; modest stakes (no rewards) | Result forgery without detection |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Auth mechanism (passkeys vs OAuth vs magic links) — decided in
  SB-25-02's record.
- Ranked seasons/resets.
