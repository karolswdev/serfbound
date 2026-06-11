# SB-30-03 — Achievements in Original Art

- **Project:** serfbound
- **Phase:** 30
- **Status:** done
- **Depends on:** SB-30-02
- **Unblocks:** SB-30-04
- **Owner:** unassigned

## Problem

The game already knows when a player does something remarkable —
first castle, a mission won, every production chain running, a
conquest victory — but nothing marks it. A small, curated set of
achievements, earned locally and drawn in the game's own decoded art,
rewards progress without inventing a meta-game.

## Scope

- **In:** A curated starter set (~10–15) tied to real milestones the
  engine already proves (first castle, first completed road network,
  each economy tier running, first knight victory, mission/campaign
  milestones, a correspondence match completed), local evaluation
  from existing engine events/records (no new tracking), unlock
  toasts using the original notification language, an achievements
  panel on the profile rendered with decoded icon/art assets,
  persistence in the local store.
- **Out:** Server-side anything (no upload, no comparison),
  meta-rewards affecting gameplay, achievement sprawl beyond the
  curated set.

## Acceptance criteria

- [ ] The curated set is recorded with its trigger conditions, each
  mapped to an existing engine-proven event.
- [ ] Unlocks fire from real play, render with decoded original art,
  persist across reloads, and never block or alter gameplay.
- [ ] Accountless offline players get the identical experience.

## Test plan

- **Unit:** Trigger evaluation against fixture event streams (each
  achievement provably reachable and not over-firing).
- **Integration / e2e:** Playwright: play to a milestone → toast →
  achievements panel shows it → reload persists.
- **Manual / device:** Unlock moment captured on desktop + phone
  under phase artifacts.
- **Design handoff:** Toast + panel screenshots under phase
  artifacts.

## Notes / open questions

- Preserves: the asset boundary (badge art decoded from the player's
  data) and the original notification idiom (Phase 16).
- Browser boundary: persistence (local store).
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
- Open: whether unlocks surface inside the original-art popup system
  or the DOM shell — default original-art, consistent with Phase 16.
