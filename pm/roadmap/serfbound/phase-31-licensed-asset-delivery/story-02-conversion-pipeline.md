# SB-31-02 — Deterministic Asset Conversion Pipeline

- **Project:** serfbound
- **Phase:** 31
- **Status:** done
- **Depends on:** SB-31-01
- **Unblocks:** SB-31-03
- **Owner:** unassigned

## Problem

The browser already decodes `SPAU.PA` at import time, every session.
The licensed path wants that work done once, ahead of time: a
conversion step that turns the original archives into a deterministic,
inspectable runtime package — same decoded results, packaged for
download-once caching instead of per-player import.

## Scope

- **In:** A conversion tool (Node, repo-resident) that reads original
  archives and emits a versioned package (decoded sprite atlases,
  palettes, audio, map/animation tables — the same data the runtime
  asset layer already produces), byte-deterministic output (same input
  → same package checksum), a provenance block inside the artifact
  (format version, source checksums, the SB-31-01 permission
  reference, license note), an inspection command that lists package
  contents and verifies checksums, runtime loading of the package
  through the existing `@serfbound/assets` boundary proving decoded
  parity with the import path (same scenes, same checksums).
- **Out:** Hosting and download (SB-31-03), raw-archive
  redistribution in any form, changes to import-path decoding.

## Acceptance criteria

- [x] Two conversion runs over the same archives produce
  byte-identical packages; the checksum and provenance block are
  verified by the inspection command.
- [x] A package-loaded game renders scenes identical to the
  import-path game (parity checks recorded; opt-in real-data run).
- [x] CI covers the pipeline with the existing generated fixture
  archive — no original data committed, unchanged.

## Test plan

- **Unit:** Package format encode/decode round-trip; provenance
  validation; determinism (double-run checksum equality) on fixture
  archives.
- **Integration / e2e:** CI: fixture archive → convert → load →
  rendered-scene assertions. Opt-in local: real `SPAU.PA` parity run.
- **Manual / device:** n/a beyond the opt-in run.
- **Design handoff:** Parity screenshots (import vs package) under
  phase artifacts.

## Notes / open questions

- Preserves: every decoder Phase 10/17 proved — conversion reuses
  them; the package is their output serialized, not a new decode.
- Browser boundary: none new at this story (tooling + load path).
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
- Open for SB-31-03: one package per corpus (DOS EN, demo, German
  strings) or a manifest of variants. The converter records a single
  `archiveName` and source checksum today; hosted selection is the
  delivery story.
