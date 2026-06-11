# SB-31-01 — Permission Record and Boundary Revision

- **Project:** serfbound
- **Phase:** 31
- **Status:** backlog
- **Depends on:** none
- **Unblocks:** SB-31-02, SB-31-03, SB-31-04
- **Owner:** unassigned

## Problem

A 2026-06-11 phone conversation with Blue Byte reportedly confirmed
Serfbound may convert original asset files to a browser-native format
and host them for players where that permission is documented. A
phone call cannot revise the asset boundary that every phase since 0
has enforced. This story produces the document — or establishes that
it cannot be produced, which closes the phase unshipped.

## Scope

- **In:** Obtaining the permission in writing (email confirmation,
  letter, or license text — whatever the rights-holder issues),
  committing it (or, if its terms forbid publication, committing a
  faithful record of parties, date, scope, and conditions with the
  document retained privately and referenced), revising
  `adoption/asset-and-legal-boundary.md` to define the licensed
  hosted-package path alongside the unchanged import path, deriving
  the condition checklist (domains, formats, attribution, revocation
  terms) that later stories must mechanically honor.
- **Out:** Any conversion or hosting work shipping player-facing
  (SB-31-02/03), changes to the import path.

## Acceptance criteria

- [ ] The written record is committed and states parties, date, what
  may be converted, what may be hosted, and under what conditions.
- [ ] The boundary canon revision cites the record and enumerates the
  derived conditions as testable obligations.
- [ ] The README/player-docs messaging split is drafted: hosted
  package (Serfbound-distributed under documented permission) vs
  imported data (never leaves the machine) — no conflation.

## Test plan

- **Unit:** n/a — legal/canon record.
- **Integration / e2e:** n/a.
- **Manual / device:** n/a.
- **Design handoff:** n/a — non-visual.

## Notes / open questions

- Preserves: the entire asset boundary unless and until the document
  says otherwise; the import path is untouched regardless.
- Browser boundary: none — canon.
- .NET reference use: none.
- Phase gate advanced: exit criterion 1; the phase's hard gate.
- Open: who at Blue Byte/Ubisoft issues the written form, and whether
  the grant is to the project, the maintainer, or the public — the
  record must say.
