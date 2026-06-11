# SB-32-05 — Experience Gate

- **Project:** serfbound
- **Phase:** 32
- **Status:** backlog
- **Depends on:** SB-32-02, SB-32-03, SB-32-04
- **Unblocks:** none
- **Owner:** unassigned

## Problem

"Looks designed to the person who designed it" is not a gate. The
phase closes only when the whole journey — cold landing to an online
match's closing ceremony — is captured, conformance-checked against
the standard, and signed off by the maintainer whose verdict opened
this phase.

## Scope

- **In:** The full-journey capture set from real local data (cold
  landing → import → title → play → save → sign-in → lobby → match →
  attest), desktop and phone, before/after pairs against the
  pre-phase shell; a written conformance pass (every visible element
  ↦ standard component, exceptions justified); the Phase 8
  accessibility positions re-run green; the standing visual-artifact
  suite regenerated so older phase artifacts reflect the shipped
  shell; `serfbound.com` redeployed and re-captured; the maintainer's
  sign-off recorded in evidence (the gate is their eyes, not ours).
- **Out:** New design work (defects found here file as stories or
  amend the standard first).

## Acceptance criteria

- [ ] The before/after journey set exists under phase artifacts,
  desktop + phone, real data.
- [ ] The conformance checklist is green or carries written
  exceptions; a11y positions green; full ci:release green.
- [ ] `serfbound.com` serves the redesigned shell (re-deploy
  verified, landing re-captured).
- [ ] The maintainer's sign-off (or their punch list, looping back
  through the standard) is recorded in evidence.

## Test plan

- **Unit:** n/a — gate story.
- **Integration / e2e:** Full suite + the journey capture run.
- **Manual / device:** The maintainer's own pass on desktop and
  phone — the actual gate.
- **Design handoff:** The complete before/after capture set.

## Notes / open questions

- Preserves: the Phase 10 standing rule, now explicitly extended to
  shell chrome: visual gates capture from real local data.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 5 (re-proving 1–4 through the
  journey).
