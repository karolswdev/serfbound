# Serfbound Asset And Legal Boundary

**Status:** accepted baseline for local import; amended by SB-31-01 for
licensed hosted converted asset packages.
**Date:** 2026-06-09; amended 2026-06-22.
**Story:** SB-0-05; SB-31-01.

## Purpose

Define how Serfbound may use original DOS/Amiga data while remaining a
browser-native project that does not commit, host, bundle, redistribute, or
silently download copyrighted original game assets except through the
documented Phase 31 licensed converted-package path.

This is an engineering policy, not legal advice. If the project later wants to
ship any third-party original asset payload, that must be treated as a new
rights/licensing decision with explicit written permission and a new PMO review.
Phase 31 is that review for converted runtime packages; raw original archives
remain outside the boundary.

## Existing Repository Constraint

The current `freeserf.net` README says the project does not provide copyrighted
original music or graphics and that players need original DOS or Amiga data
files to play. It also states that the current desktop game needs a DOS
`SPAx.PA` data file, where `x` is the language shortcut, or Amiga disk/extracted
files.

Serfbound preserves that local-import boundary in browser form:

- The browser app may ask the player to select local original data files.
- The browser app may parse and persist those files locally after explicit user
  selection.
- The repo and release artifact must not include raw original DOS/Amiga
  archives, extracted sprites, music, sound effects, palettes, title art,
  executable files, manuals, or other raw original payloads.
- The app must not fetch raw original assets from abandonware, archive, forum,
  torrent, CDN, or project-hosted URLs.
- A separate Phase 31 licensed path may host browser-native converted runtime
  packages only under the written consent record in `LICENSE-CONSENT.md` and
  only after the conversion/hosting stories prove provenance, integrity, and
  player-facing messaging.

## Copyright Baseline

The U.S. Copyright Office describes copyright as protection for original works
fixed in a tangible form and identifies computer programs, music, graphics, and
sound recordings as protected subject matter. It also explains that a work
enters the public domain when the copyright term expires. A game being old,
hard to buy, or commonly called "abandonware" is not the same thing as a
redistribution license, public-domain status, or verified rights-holder
permission.

For Serfbound policy, "abandonware" is never accepted as redistribution
permission. Treat original game data as user-provided local data unless a
rights review records a specific redistributable license or written
rights-holder grant. `LICENSE-CONSENT.md` is the Phase 31 written grant for
converted browser-native runtime packages; it is not permission to redistribute
raw original archives.

## Current Local Verification Source

`pm/roadmap/serfbound/adoption/local-asset-inventory.md` is the only committed
record of the user's local data. It contains metadata only.

Current verification source:

| Field | Value |
|---|---|
| Local source label | `Serf-City-Life-is-Feudal_DOS_EN` |
| Local path | `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/` |
| Loader-relevant file | `SPAU.PA` |
| `SPAU.PA` SHA-256 | `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2` |
| Git policy | ignored by `.gitignore` via `serfbound-local-data/` |

Phase 1 may use this local `SPAU.PA` for metadata-only oracle output. Phase 4
may use it for local/manual browser import verification. CI must not require it.

## Initial Browser Import Path

Serfbound chooses a staged import model:

1. **Phase 4 baseline:** direct file selection with an `<input type="file">`
   style path accepting `.PA` files, including `SPAU.PA`, `SPAE.PA`, `SPAF.PA`,
   and `SPAD.PA`.
2. **Same-boundary convenience:** drag/drop of one or more local files may use
   the same validation and parsing path as direct file selection.
3. **Persistence:** after explicit user import, store imported data or derived
   asset records in IndexedDB unless Phase 4 evidence proves a no-persistence
   or metadata-only persistence model is safer.
4. **Progressive enhancement:** directory picker support may be added later for
   players with folder-based DOS/Amiga data, but it must not be required for
   normal play because browser support and permission UX differ.
5. **No server upload:** normal play must parse data in the browser. Original
   asset files are not uploaded to a Serfbound server.

This matches browser API reality: the File API covers user-selected files and
drag/drop files; IndexedDB is appropriate for larger structured client-side
data including blobs; file/directory handles require explicit user selection
and should stay optional.

## Allowed And Forbidden Files

| Category | Examples | Git policy | Release policy |
|---|---|---:|---:|
| Source code written for Serfbound | TypeScript engine/assets/UI code, generated fake archive builders, tests | allowed | allowed |
| PMO metadata about local assets | inventory rows, filenames, sizes, checksums, source path labels | allowed | allowed if docs need them |
| CI-safe generated fixtures | synthetic `.PA`-like buffers, JSON oracle fixtures with no original payload | allowed | allowed |
| Local/manual metadata summaries | `SPAU.PA` checksum, entry count, resource names/counts, derived metadata checksums | allowed in evidence if no payload bytes | allowed in docs if no payload bytes |
| Local original data | `SPAU.PA`, `SPAE.PA`, `SPAF.PA`, `SPAD.PA`, Amiga `.adf`, extracted `sounds`, `music`, graphics files | forbidden | forbidden |
| Unlicensed extracted/converted original assets | sprites, palettes, music, sound effects, title art, converted PNG/WAV/MIDI/runtime assets from original data outside Phase 31 | forbidden | forbidden |
| Licensed converted runtime packages | Browser-native packages produced under SB-31-02 from original assets, with provenance, source checksums, package checksum, and permission reference | package bytes: forbidden in source unless a later story explicitly says otherwise; manifests/checksums allowed | allowed only after SB-31-02/SB-31-03 gates prove scope, integrity, and hosted delivery |
| Original executables/tools | `SERF.EXE`, DOS drivers, setup programs, DOSBox bundles for normal play | forbidden | forbidden |
| Third-party downloads of original data | abandonware zips, mirrors, torrents, unofficial archives | forbidden | forbidden |

## Local Data Paths

Tracked repository paths:

- `pm/roadmap/serfbound/adoption/local-asset-inventory.md` - metadata only.
- `pm/roadmap/serfbound/reference-fixtures/ci/` - future CI-safe reference
  fixtures only; no original payloads.

Ignored local paths:

- `serfbound-local-data/sources/` - user-provided original data for local
  development/manual verification.
- `serfbound-local-data/reference-output/` - local/manual metadata output from
  oracle captures.
- `serfbound-local-data/browser-imports/` - optional developer scratch area if
  Phase 4 needs exported browser import artifacts for debugging.
- `pm/roadmap/serfbound/local-data/` - PMO-local scratch already ignored.

`.gitignore` already blocks `SPA*.PA`, `SOUNDS.PA`, common extracted DOS/Amiga
data folder names, `serfbound-local-data/`, and
`pm/roadmap/serfbound/local-data/`.

## Runtime Storage Policy

Browser storage may contain imported user data only after explicit local user
selection. Serfbound should store:

- asset source metadata: filename, size, checksum, type, import timestamp;
- parsed catalog metadata and derived indexes;
- imported blobs or derived browser-ready records if Phase 4 proves persistence
  is necessary and recoverable;
- browser-native save data separately from imported original data.

Serfbound should not store:

- data fetched from project-hosted original asset URLs;
- raw original files in tracked build output;
- local data in cloud sync unless a future story explicitly designs an opt-in
  account/cloud model and rights/privacy review.

Phase 8 must test recovery: missing IndexedDB records, user reset, quota/eviction
behavior, and re-import flow.

## Test Data Policy

CI-safe tests must use one of these inputs:

- generated fake `.PA`-like buffers with no original game bytes;
- small handwritten binary buffers that exercise parser structure only;
- data-free reference fixtures from Phase 1;
- metadata-only checksums and manifests.

Local/manual tests may use ignored `SPAU.PA` when explicitly enabled by an
environment variable, command flag, or browser manual step. Missing local data
must produce a clear skip, not a CI failure.

Phase 4 parser tests must prove both paths:

- generated fixtures run in CI;
- local `SPAU.PA` metadata comparison works manually and records only
  checksums/summaries in evidence.

## UX Requirements

The browser UI must:

- state which asset source is active: a player's imported local data or a
  Serfbound-distributed licensed converted package;
- keep direct `.PA` import first-class forever;
- accept `SPAU.PA` as the current known DOS verification file;
- handle missing, invalid, unsupported, or truncated files recoverably;
- show whether imported data is stored locally and provide a clear reset/remove
  path;
- avoid wording that implies imported local data uploads to Serfbound;
- avoid wording that conflates raw original archives with the Phase 31 hosted
  converted runtime package.

## Stop Signals

Stop and update this boundary before proceeding if any story proposes:

- committing original DOS/Amiga data or extracted assets;
- adding project-hosted download links for raw original data;
- serving a converted runtime package without the SB-31 permission reference,
  provenance, integrity checks, and the Phase 31 hosting gate;
- treating "abandonware" as permission to redistribute assets;
- making CI depend on local original assets;
- requiring a desktop helper, emulator, native launcher, or original executable
  for normal browser play;
- storing imported original data outside browser-local storage without a new
  explicit user/rights/privacy decision.

## Addendum — User-Authored Custom Maps (SB-42-01, 2026-06-13)

The map builder (Phases 42–43) introduces a new category of data:
**user-authored custom maps.** This addendum records where they sit
relative to the boundary.

- **A custom map is user-authored data, not an original asset.** Its
  payload is the six `ClassicMapLandscape` arrays — `heights`,
  `typesUp`, `typesDown`, `objects`, `minerals`, `resourceAmounts` —
  i.e. integer *enumeration indices* describing the author's
  arrangement of terrain, objects, and minerals. The integer `7` means
  "this triangle is grass3"; it is **not** the grass sprite. A map
  contains no sprite, palette, audio, or font bytes. It belongs to the
  allowed "data written for Serfbound" category, not the forbidden
  original-asset categories.
- **The format physically cannot carry original assets.** The
  `serfbound.custom-map` format (`packages/engine/src/custom-map.ts`)
  is base64 of exactly `6 × tileCount` enum-range bytes plus text
  metadata; `decodeCustomMapLandscape` rejects any other length or
  out-of-range byte and verifies a content hash — **reject, never
  clamp.** There is no blob field. This is the same "no field for it"
  guarantee the mailbox/session wire already holds.
- **The editor renders the real tiles, import-gated like playing.** The
  builder reuses the production sprite renderer over the player's own
  imported `SPAU.PA`, rejecting with `missing-imported-data` when
  absent — exactly as a generated map does. Serfbound ships **no
  original art** for the builder.
- **The maps service touches no original art.** Gallery thumbnails are
  sprite-free false-color (`minimapTerrainColors`), never decoded
  sprites; a shared map carries only its enum bytes + text. Original
  game data never reaches `api.serfbound.com`.
- **"Baking the tiles in" stays gated.** Shipping or hosting the
  converted tile data so the builder (and the whole game) need no
  import is the Phase 31 "licensed asset delivery" work, hard-gated on
  *written* rights-holder permission. The map builder does not change
  that gate; it inherits import-free use automatically when Phase 31
  lands.

**Stop signal (extends the list above):** stop and update this boundary
before routing any *decoded original sprite* into the maps service, a
gallery thumbnail, or any map-sharing payload — the line is "real tiles
on the player's own client only, never on the wire."

## Addendum — Licensed Converted Asset Packages (SB-31-01, 2026-06-22)

`LICENSE-CONSENT.md` records the written Blue Byte confirmation supplied to the
project. The confirmation authorizes Serfbound to convert original Settlers
asset files into a browser-native runtime format and host those converted
assets for player use. The stated purpose is deterministic, inspectable,
cacheable web delivery: players download a converted package once, store it in
the browser cache, and reuse it on later runs.

This addendum opens the Phase 31 licensed path and leaves the original import
path intact.

- **What is now allowed:** SB-31-02 may build a deterministic conversion
  pipeline for browser-native runtime packages, and SB-31-03 may host those
  packages for player download and local browser caching.
- **What remains forbidden:** raw original archives, original executables,
  disk images, abandonware downloads, and player-uploaded local asset files
  remain outside the project. The permission record is for converted runtime
  packages, not raw redistribution.
- **No package ships from this story alone.** SB-31-01 records the consent and
  boundary revision. Converted packages do not reach players until SB-31-02 and
  SB-31-03 prove deterministic output, provenance, integrity verification, and
  hosted delivery.
- **The import path remains first-class.** Players may still provide their own
  local `SPAU.PA`; that data stays in their browser and is not uploaded. The
  hosted package path is Serfbound-distributed licensed content, a distinct
  source with distinct messaging.
- **Every package needs provenance.** The package or adjacent manifest must
  carry a format version, source checksums, package checksum, this consent
  reference, and a license note. Release checks must fail if those fields are
  missing.
- **Hosting stays scoped and auditable.** The current written record states no
  domain-specific restriction. SB-31-03 must record the chosen
  Serfbound-controlled HTTPS host and verify that the served artifact matches
  the documented package manifest.

## Sources Consulted

- `README.md` - current `freeserf.net` data-file requirement.
- `.gitignore` - existing ignore rules for `SPA*.PA`, extracted data folders,
  and Serfbound local data paths.
- `pm/roadmap/serfbound/adoption/local-asset-inventory.md` - current local
  verification source and checksums.
- `LICENSE-CONSENT.md` - Phase 31 written consent record for hosted converted
  runtime packages.
- `pm/roadmap/serfbound/adoption/parity-harness-design.md` - metadata-only
  local/manual oracle policy.
- U.S. Copyright Office, "What is Copyright?":
  https://www.copyright.gov/what-is-copyright/
- U.S. Copyright Office, "The Lifecycle of Copyright":
  https://www.copyright.gov/history/copyright-exhibit/lifecycle/
- MDN FileReader:
  https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- MDN File API:
  https://developer.mozilla.org/en-US/docs/Web/API/File
- MDN IndexedDB API:
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN File System API:
  https://developer.mozilla.org/en-US/docs/Web/API/File_System_API
