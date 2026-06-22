# Licensed Asset Consent Record

**Project:** Serfbound.
**Record date:** 2026-06-22.
**PMO story:** SB-31-01 — Permission Record and Boundary Revision.
**Status:** accepted project record for Phase 31 licensed asset delivery.

This record documents the written rights-holder confirmation supplied to the
project for the Phase 31 licensed asset-delivery path. It is an engineering
scope record for Serfbound's PMO process, not legal advice.

## Parties

| Role | Party |
|---|---|
| Rights-holder representative | Antoine, Authorized Blue Byte Representative, Blue Byte |
| Requesting project party | Karol, Serfbound Project Lead |
| Project | Serfbound, a browser-native remake of The Settlers I / Serf City |

The maintainer-supplied email transcript does not include sent/received
timestamps. This PMO record was created on 2026-06-22 from that written
transcript.

## Written Confirmation

The supplied confirmation states that Blue Byte authorizes Serfbound to convert
original Settlers asset files into a browser-native runtime format and host
those converted assets for player use.

The supplied confirmation further describes the conversion purpose as making
legacy data deterministic, inspectable, cacheable, and suitable for web
delivery, so players can download converted asset packages once, store them in
the browser cache, and reuse them for faster subsequent runs.

## Engineering Scope

This consent record authorizes Phase 31 to proceed with:

- converting original Settlers asset files into a browser-native runtime
  package;
- hosting those converted runtime packages for player use;
- caching those converted packages locally in the player's browser;
- documenting a zero-import play path that uses the hosted converted package.

This record does not authorize or change:

- redistribution of raw original archives such as `SPAU.PA`, `SOUNDS.PA`, disk
  images, or original executables;
- uploading a player's imported local data to Serfbound services;
- removing or degrading the import-your-own-data path;
- shipping any converted package without provenance, integrity checks, and a
  license/permission note inside or alongside the package;
- monetization or any scope outside the written confirmation above.

## Derived PMO Obligations

Phase 31 follow-up stories must enforce these obligations mechanically where
possible:

- SB-31-02 conversion artifacts include a format version, source checksums,
  package checksum, this permission reference, and a license note.
- SB-31-03 hosted delivery verifies package integrity before activation and
  never serves raw original archives.
- SB-31-03 release checks record the chosen Serfbound-controlled HTTPS host for
  asset delivery and verify the served artifact carries the required
  provenance.
- SB-31-04 player-facing copy distinguishes the Serfbound-distributed licensed
  converted package from a player's imported local data. Imported local data
  still never uploads.
- Normal CI remains data-free; real original assets stay opt-in for local
  conversion/parity evidence until a licensed package is deliberately published
  by the Phase 31 delivery stories.
