# Phase 25 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes, with one named gap. Players can be someone and challenge each
other: local-first profiles (game-font names, match history) with zero
hosted dependency; an identity layer where an account IS a device
keypair — no email, no password, nothing to leak, deletion verifiable,
the four-field schema enforced by contract test; the turn mailbox where
a real correspondence match flows challenge → lobby → accept → signed
moves → client-side re-simulation → agreeing checksums, with pickup
deadlines forfeiting absentees; and a ladder where only dual-attested
outcomes rate (Elo, modest stakes, disputes quarantined). Accountless
play lost nothing anywhere.

**The named gap:** the shell's online UI (sign-in, lobby, your-turn
badge, ladder view) awaits a deployed service URL — deployment is the
maintainer's activation step (`services/README.md` is the runbook).
Every flow the UI will call is shipped and CI-proven against the real
services. Recorded as the phase's follow-up, not hidden.

## Exit criteria — final state

- [x] Local profiles persist and travel into sessions (SB-25-01).
- [x] The identity decision record + the service implementing exactly
  it (SB-25-02).
- [x] Challenges, the mailbox, deadlines/forfeits (SB-25-03).
- [x] The dual-attested ladder + the ops/abuse posture; gates green
  (SB-25-04, with the shell-surface gap recorded).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-25-01 | Local-first profiles | evidence-story-01.md |
| SB-25-02 | Identity decision and account service | evidence-story-02.md |
| SB-25-03 | Challenges and the turn mailbox | evidence-story-03.md |
| SB-25-04 | Ladder and operations gate | evidence-story-04.md |

## Decisions and honest records

- Anonymous device keys over passkeys/OAuth/magic links: the only
  mechanism with literally nothing to collect; no recovery by design;
  passkeys recorded as the upgrade path.
- The mailbox never referees: structural validation + size caps on the
  wire; clients re-simulate everything (Phase 23's model, unchanged).
- `pickupSeconds: 0` = no clock (casual matches).
- Abuse posture states its limits plainly: collusion farming and
  smurfing are undefended at these stakes; rate limiting is a
  deployment checklist item.
- Suite growth this phase: 208 → 222 unit tests; services join CI
  in-process (real instances, ephemeral stores).

## What's next

Phase 26 — data breadth and localization; the shell online surface
lands when the maintainer deploys the services and a public URL
exists.
