# SB-25-04 — Ladder and Operations Gate

- **Project:** serfbound
- **Phase:** 25
- **Status:** done
- **Depends on:** SB-25-03
- **Unblocks:** SB-26-01
- **Owner:** Claude

## Problem

Ratings make matches matter — and hosted features need an honest
operations story. Match results both peers sign (the final checksum
agreement is the natural receipt) feed a simple ladder; the phase closes
on abuse posture, ops runbook, and a full gate rerun.

## Scope

- **In:** Opponent-verified result submission (both peers attest the
  outcome + final checksum), a simple rating (Elo-family, recorded),
  ladder display, forfeit/abandon semantics, abuse posture (forgery,
  smurfing, queue manipulation — what is and is not defended), ops
  runbook for the hosted pieces, docs, phase final summary.
- **Out:** Seasons, rewards, anti-cheat beyond determinism receipts.

## Acceptance criteria

- [x] Only dual-attested results rate; mismatched attestations quarantine.
- [x] The ladder updates and displays; forfeits/abandons resolve per the
  recorded semantics. (Display = the sorted /ladder endpoint and its
  client; the shell view is the recorded follow-up pending a deployed
  service URL.)
- [x] Ops runbook + abuse posture ship; all standing gates rerun green.

## Test plan

- **Unit:** Rating math and attestation rules in CI.
- **Integration / e2e:** Rated match end-to-end with ladder assertion.
- **Manual / device:** Deployed-stack rated match in evidence.
- **Design handoff:** Ladder UI screenshots under phase artifacts.

## Notes / open questions

- Preserves: determinism checksums as the integrity primitive.
- Browser boundary: network (result submission).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (phase close).
