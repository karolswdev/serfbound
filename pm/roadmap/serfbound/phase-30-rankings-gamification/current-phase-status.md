# Phase 30 — Rankings and Gamification

**Last updated:** 2026-06-11 (SB-30-05 added and started by maintainer direction).
**Status:** in progress (SB-30-05 only; 01-04 await their dependencies/order).

## Goal

Make competition visible and progress feel owned. Phase 25 shipped
the dual-attested Elo ladder as a service; nobody can see it yet.
This phase surfaces the ladder and leaderboard in the shell, gives
players a profile with match history and statistics, and adds
local-first achievements rendered in the original art language — all
without eroding the privacy posture or making accountless play feel
second-class.

## Scope

- **In:** Ladder/leaderboard views in the shell from the deployed
  service (ratings on challenges, disputes shown quarantined), a
  player profile surface (match history, win/loss, streaks, campaign
  progress) computed local-first, achievements earned from local
  play and campaign milestones rendered with decoded original art,
  the gamification e2e gate.
- **Out:** Seasons/decay/rewards (deferred decisions below),
  matchmaking, tournaments, any new personal data field server-side,
  realtime play (Phase 27).

## Non-negotiable constraints

- Local-first: profiles, statistics, and achievements compute from
  local history and work fully offline and accountless.
- The service schema does not widen: the four-field identity record
  and the existing mailbox/ladder fields are the whole server-side
  surface; any proposed addition is a stop-and-decide.
- Stakes stay modest by design (Phase 25 decision): reputational
  ratings, no rewards, no decay — changing that is a recorded
  decision, not scope drift.
- Achievement art comes from the player's own decoded data, same
  boundary as everything else.

## Exit criteria (evidence required)

- [ ] The shell shows the live ladder and a leaderboard; challenges
  display opponent ratings; disputed outcomes are visibly
  quarantined. (SB-30-01)
- [ ] A player profile shows match history, win/loss/streaks, and
  campaign progress, fully populated in accountless offline play.
  (SB-30-02)
- [ ] Achievements unlock from real play, render in original art,
  and persist locally. (SB-30-03)
- [ ] The gamification gate: a rated match completes, the rating
  change appears on the leaderboard, the profile updates, an
  achievement unlocks — e2e; the privacy regression stays green.
  (SB-30-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-30-01 | Ladder and leaderboard surface | backlog | story-01-ladder-leaderboard-surface.md | — |
| SB-30-02 | Profiles, history, statistics | backlog | story-02-profiles-history-statistics.md | — |
| SB-30-03 | Achievements in original art | backlog | story-03-achievements-original-art.md | — |
| SB-30-04 | Gamification gate | backlog | story-04-gamification-gate.md | — |
| SB-30-05 | Avatars and guild heraldry | done | story-05-avatars-and-guilds.md | evidence-story-05.md |

## Where we are

Scaffolded 2026-06-11 from user direction (rankings and gamification
discussed across Phases 23/25). SB-30-05 (maintainer-directed
addition) shipped same day: the 16-piece PixelLab identity library
(8 avatars, 8 guild banners), the identity row and picker in the
shell, local-first and additive — no wire-format change. SB-30-01
depends on the Phase 29 public URL (live); SB-30-02/03 are
local-first and can start any time; SB-30-02 will present the
identity on the full profile surface.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Gamification erodes the privacy posture | medium | Local-first default; schema contract tests unchanged | Any new personal field proposed server-side |
| Rating pressure distorts the game's tone | medium | Modest-stakes decision preserved; accountless surfaces stay primary | Rewards/decay creeping in without a decision record |
| Achievement sprawl (checklist fatigue) | medium | A small curated set tied to real milestones first | Achievements added without a play-tested rationale |
| Leaderboard staleness/abuse at tiny scale | low | Disputes quarantined (shipped); honest-limits note on the surface | Farming visibly dominating the top of the ladder |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Seasons (periodic ladder archive/reset) — revisit when the ladder
  has enough players that history matters; default: one continuous
  ladder.
- Rating decay and placement matches — default: none (Phase 25
  modest-stakes posture).
- Shareable/exportable profile cards — default: not yet; local-only.
