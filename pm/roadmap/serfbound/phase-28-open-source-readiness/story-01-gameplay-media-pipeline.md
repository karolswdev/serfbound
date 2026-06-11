# SB-28-01 — Gameplay Media Pipeline

- **Project:** serfbound
- **Phase:** 28
- **Status:** backlog
- **Depends on:** none
- **Unblocks:** SB-28-02, SB-28-03
- **Owner:** unassigned

## Problem

The README has no visuals, and the only honest visuals are real play:
screenshots of an active game captured through the e2e machinery from
the maintainer's own data. Committing media that depicts decoded
original art also needs a recorded boundary decision before the first
image lands.

## Scope

- **In:** A decision record extending
  `adoption/asset-and-legal-boundary.md` to committed gameplay media
  (rationale, precedent, what may never be committed), an opt-in
  capture script (extending `capture:local:screenshots`) that drives a
  seed-pinned live game and produces the curated README set (desktop +
  mobile, named scenes: settlement, economy, combat, interface,
  start screen), the curated set committed under `docs/media/` with a
  size budget, regeneration documented.
- **Out:** README prose (SB-28-02), social preview asset (SB-28-03),
  video/trailer production.

## Acceptance criteria

- [ ] The media decision record exists and names what is and is not
  committable.
- [ ] One opt-in command regenerates every committed image from a
  seed-pinned game; scene list and seed are recorded.
- [ ] The committed set stays within the recorded size budget, and a
  CI-safe check fails if referenced media files are missing.

## Test plan

- **Unit:** n/a — capture tooling, covered by the docs/media check.
- **Integration / e2e:** Opt-in local capture run against real
  `SPAU.PA`; output paths and checksums in evidence.
- **Manual / device:** Visual review of the curated set at README
  rendering sizes.
- **Design handoff:** The curated set itself, under `docs/media/`.

## Notes / open questions

- Preserves: the asset boundary — no original archives committed;
  screenshots are captures of decoded art from user-owned data, the
  same posture as phase-10 evidence artifacts.
- Browser boundary: none new (capture reuses the e2e path).
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
- Open: animated capture (GIF) — decide against the size budget;
  default stills only.
