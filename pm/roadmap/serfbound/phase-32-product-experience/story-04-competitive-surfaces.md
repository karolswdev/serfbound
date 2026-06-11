# SB-32-04 — Competitive Surfaces Styled as a Platform

- **Project:** serfbound
- **Phase:** 32
- **Status:** backlog
- **Depends on:** SB-32-01
- **Unblocks:** SB-32-05
- **Owner:** unassigned

## Problem

Phase 29 shipped the online backbone behind raw buttons and a text
lobby. A competitive platform earns trust through its surfaces:
sign-in that explains the device-key model in one designed moment,
a lobby of challenge cards, a your-turn badge that feels like a
heartbeat, and match states a player reads at a glance.

## Scope

- **In:** The Online area redesigned on the standard: the sign-in
  moment (what a device key is, what the service never knows — the
  privacy posture as a feature, not fine print), the challenge lobby
  as cards (challenger, terms, accept affordance; designed empty/
  loading/unavailable states), the your-turn badge as a first-class
  attention element, in-match correspondence chrome (whose window,
  recap, countdown, opponent identity) styled, the attest-result
  moment designed as the match's closing ceremony, profile/history
  presentation styled (groundwork the Phase 30 surfaces will extend),
  hot-seat/async/realtime buttons grouped into a designed "play with
  someone" area. Testids preserved; outage degradation stays quiet
  and styled.
- **Out:** New online features (ladder view, seasons — Phase 30),
  service changes, multi-match management.

## Acceptance criteria

- [ ] Every online state (signed-out, signing-in, signed-in, lobby
  empty/populated, unavailable, in-match modes, ended) is a designed
  state — none fall back to raw text.
- [ ] The sign-in moment presents the device-key model and privacy
  posture in the product voice.
- [ ] online-play and online-outage specs green unchanged; captures
  of lobby, your-turn, in-match, and ended states (desktop + phone)
  under phase artifacts.

## Test plan

- **Unit:** Existing online suites unchanged.
- **Integration / e2e:** online-play.spec.ts and
  online-outage.spec.ts as the behavior contract; an added
  state-coverage spec for the designed states.
- **Manual / device:** A real two-context match reviewed for feel,
  captured.
- **Design handoff:** State-by-state captures.

## Notes / open questions

- Preserves: Phase 29 behavior wholesale — transport, attestation,
  outage posture; presentation only.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 4.
- Open: Phase 30's ladder view should land directly on these
  components — note for SB-30-01's design handoff line.
