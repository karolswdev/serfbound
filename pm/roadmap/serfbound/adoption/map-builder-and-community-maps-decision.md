# Map Builder & Community Maps — Proposal

**Status:** ACCEPTED into the roadmap as Phases 42–43 (2026-06-13).
Scaffolds live at `phase-42-map-builder/` and
`phase-43-community-maps/`. This document is the design canon those
phases build to.
**Date:** 2026-06-12, amended 2026-06-13.
**Author:** design spike, refined with the maintainer's directive.

> **Maintainer directive (2026-06-13), and the spine of this design:**
> *"The map builder should totally be usable without even providing
> [SPAU.PA]. That's not a game… that's a tool."*
>
> The editor and the gallery are **asset-free tools.** They render
> maps **schematically** — false-color terrain (the existing
> `minimapTerrainColors`, `popup.ts:225`) and simple geometric object
> markers — and need no original game data whatsoever. You build,
> validate, save, publish, browse, and download maps with **zero
> imported data and zero account.** Original assets are required only
> to *play* a map in the authentic game — exactly today's rule
> (`local-game.ts` rejects a play start with `missing-imported-data`).
> This makes the asset-boundary argument (§7) far stronger: the tool
> ships and needs no game data, and the open question that gated this
> proposal is **resolved by construction** — see §7.0.

---

## 1. Vision & player journey

Today every Serfbound map is a *seed*: `landscapeForLocalGameSettings`
calls `generateClassicMap(mapSize, [seed0, seed1, seed2])` from a
16-digit seed string (`local-game.ts:282`), and the multiplayer
handshake matches on `seedString` + `mapSize` and regenerates the
identical map on each peer (`session-protocol.ts:178`). You cannot
*author* a map — you can only roll the dice.

The map builder closes that gap. A player opens the editor from the
start screen, picks a size (1–23, the `MapGeometry` range,
`index.ts:162`), and gets a blank or seed-prefilled landscape rendered
through the *same* WebGL2 path the live game uses. They paint terrain,
drop trees and stones, seed mineral deposits in the mountains, and set
each player's castle start. A live validation strip tells them, at all
times, whether the map is *playable* (every player has a legal
castle site, enough buildable land, no unreachable starts). They name
it, generate a thumbnail, and either keep it local or **publish to
serfbound.com** with one tap. Other players browse a gallery —
filter by size and player count, sort by rating — download a map, and
it drops straight into the same "start game" flow a generated map
uses. A downloaded map is rendered and played entirely with *their own*
imported `SPAU.PA` sprites; the map file itself carries no art.

The whole journey is "Workshop for hand-authored Settlers maps," but
honoring the two Serfbound unbreakables: **accountless serverless play
stays first-class** (you can build and play custom maps with no
account and no network — only *sharing* touches the backbone), and
**no original game data ever crosses the wire or the service.**

The player journey, end to end:

1. **Author.** Start screen → "Build a map" → editor canvas. Paint,
   place, seed, set starts, undo. Save drafts to IndexedDB.
2. **Validate.** A persistent validity panel: green when the map
   passes the playability + determinism checks; specific red flags
   otherwise ("Player 2 has no legal castle site," "12% buildable —
   needs ≥ 20%").
3. **Play locally.** "Play this map" feeds the draft straight into a
   local game (single-player or hot-seat) with zero network.
4. **Publish.** Sign the map with the device key (the Phase 25/29
   identity), POST to the maps service. Returns a share code / gallery
   entry.
5. **Browse & download.** Gallery on serfbound.com; pick a map; it
   lands in your local library and plays exactly like a generated one.
6. **Play together.** A custom map is a first-class match definition:
   correspondence and (Phase 27) realtime sessions can run on it,
   verified by checksum the same way generated maps are.

---

## 2. Map data model

### 2.1 The landscape is already a clean, serializable value

`ClassicMapLandscape` (`map-generator.ts:135`) is six typed arrays plus
four scalars:

```ts
type ClassicMapLandscape = {
  size, columns, rows, tileCount: number;
  heights, typesUp, typesDown, objects, minerals, resourceAmounts: Uint8Array;
};
```

The crucial finding: **`SerfboundGameWorld` already accepts an
arbitrary landscape value, not a seed.** Its constructor
(`game-world.ts:418`) copies those six arrays straight in. The
generator is *one* producer of that value; `continueFromDosSavegame`
(`dos-savegame.ts:269`) is *another* — it builds a `ClassicMapLandscape`
by hand from parsed save bytes and feeds it to `new
SerfboundGameWorld(landscape, playerCount)`. A hand-authored map is a
third producer of the exact same shape. **No pipeline change is needed
to play a custom landscape** — only to *transport and persist* one.

The renderer is equally ready: `landscape-scene.ts` reads
`ClassicMapLandscape` directly (`upTriangleFacts`/`downTriangleFacts`,
lines 196/216) to compose terrain triangles. The editor renders the
draft with the production scene builder — no second renderer.

### 2.2 The custom-map file format (`serfbound.custom-map` v1)

A custom map is a self-describing, versioned record. Two layers:

- **The landscape payload** — the six arrays. Stored not as JSON
  number arrays (6 × tileCount, ~80 KB for size 6, ~1.3 MB for size
  10 as JSON) but as **base64 of the concatenated `Uint8Array`s in a
  fixed order** (heights, typesUp, typesDown, objects, minerals,
  resourceAmounts), each `tileCount` bytes. That is exactly
  `6 × tileCount` raw bytes — ~24 KB at size 6, ~393 KB at size 10 —
  before transport compression.
- **The authoring metadata** — title, author device-key fingerprint
  (the Phase 25 `keyId`), player count, per-player castle start
  positions and supplies presets (mirroring the mission `preset()`
  shape in `missions.ts`), an optional thumbnail, format version, and
  a **content hash** (FNV-1a over the canonical byte order, reusing
  `StateHasher` from `checksum.ts`).

```ts
type SerfboundCustomMap = {
  schemaVersion: 1;
  kind: "serfbound.custom-map";
  size: number;                     // 1..23
  landscape: string;                // base64, 6*tileCount bytes, fixed order
  starts: readonly { player: number; position: number; supplies: number }[];
  playerCount: number;
  contentHash: number;              // FNV-1a over the canonical bytes
  meta: {
    title: string;                  // sanitized, capped (see §6)
    authorKeyId: string;            // device-key fingerprint
    authorName: string;             // display name only, never affects sim
    createdAtIso: string;
    thumbnail?: string;             // tiny PNG data-URL, sprite-free (see §7)
  };
};
```

This nests cleanly into the existing snapshot pattern:
`SerfboundLocalGameSnapshot` already carries `schemaVersion`, `kind`,
`settings`, and `state` (`local-game.ts:148`). A custom-map game is a
local game whose landscape comes from a stored `SerfboundCustomMap`
instead of from `landscapeForLocalGameSettings`. The cleanest seam:
extend `SerfboundLocalGameSettings` with an optional
`customMap?: SerfboundCustomMap`, and make `landscape()`
(`local-game.ts:104`) return `decodeCustomMapLandscape(customMap)` when
present, falling back to seed generation otherwise. The world-action
log restore path (`local-game.ts:111`) is unchanged — it replays on top
of whatever landscape `landscape()` returns.

### 2.3 Versioning

`schemaVersion: 1` is the file gate. Because the landscape arrays are
opaque bytes keyed only by `size`, the format is stable across engine
changes that do not change `MapGeometry` (none planned — it is matched
against `map-geometry-facts.json`). If terrain/object enums ever grow,
v2 adds a capability flag; v1 maps stay loadable because their byte
ranges are a subset. This mirrors the snapshot `schemaVersion` and the
session `protocolVersion`/`appVersion` discipline.

---

## 3. The editor UX

### 3.1 The triangle/height truth the editor must respect

The reference terrain model is unusual and the editor UI must speak it
natively. Each tile position owns **two triangles**: `typesUp` (the
up-pointing triangle, apex from `heights[pos]` with neighbors down-row)
and `typesDown` (the down-pointing triangle), per the composition in
`landscape-scene.ts` (`upTriangleFacts`/`downTriangleFacts`). Heights
are per-vertex (one `heights` byte per position), and a triangle's
rendered slope comes from three vertices. So "paint terrain" and "raise
land" are *different verbs*:

- **Height brush** edits `heights[pos]` — and because a vertex feeds up
  to six triangles, the editor recomputes the terrain *type* of every
  affected triangle (or lets the user lock type and only move height).
- **Terrain brush** edits `typesUp[pos]` / `typesDown[pos]` directly
  (the 16 `mapTerrain` values, `map-generator.ts:8`), letting a player
  paint a beach or a snowfield without touching elevation.

### 3.2 Tools

- **Terrain paint** — pick a `mapTerrain` value (water0–3, grass0–3,
  desert0–2, tundra0–2, snow0–1); brush sets the up/down triangle
  type under the cursor. Brush radius walks the existing
  `MapGeometry.move`/spiral neighborhood (the generator already uses
  `classicSpiralPattern`, `map-generator.ts:119`, and the world exposes
  `positionAddSpirally`, `game-world.ts:473`).
- **Height brush** — raise/lower with a slope clamp. The generator's
  own `adjustMapHeight` rule (max delta 32 between adjacent tiles,
  `map-generator.ts:288`) is the editor's clamp too, so authored maps
  obey the same smoothness invariant generated maps do — important for
  rendering and for the "no cliff walls" feel.
- **Object placement** — drop/erase from the `mapObject` palette
  (`map-generator.ts:27`): trees, pines, palms, stones, sandstone,
  cactus, dead trees, water trees/stones. The editor refuses an object
  whose `mapSpaceFromObject` (`map-generator.ts:75`) conflicts with its
  tile (e.g. a land tree on water), reusing the generator's own
  cleanup rule (`map-generator.ts:735`).
- **Mineral seeding** — paint `minerals` + `resourceAmounts` (gold,
  iron, coal, stone; `map-generator.ts:59`) in mountain terrain
  (tundra/snow), with a cluster brush that mimics `expandMineralCluster`
  (`map-generator.ts:680`) so authored deposits feel like generated
  ones. Fish: `resourceAmounts` on shallow-water tiles.
- **Player starts** — place each player's castle anchor. The editor
  *runs `canBuildCastle` live* (`game-world.ts:1185`) against a scratch
  `SerfboundGameWorld` to confirm the site is legal (open object space,
  no paths, `canBuildLarge`, 7-tile spiral clear of other owners) and
  paints the would-be territory hex so the author sees the start zone.
- **Brush / fill / line** — flood-fill a contiguous same-type region;
  line tool for rivers and roads-of-grass.
- **Undo / redo** — a ring buffer of array deltas (position + old/new
  byte). Cheap because edits are byte writes into the six arrays.

### 3.3 Renderer & input reuse

The editor is **not a new renderer**. It mounts the same WebGL2
landscape scene (`landscape-scene.ts`) over a live draft
`ClassicMapLandscape`, re-composing affected triangles on each stroke.
Pointer→tile resolution reuses `resolveFirstRenderLayerPointer()` and
the Phase 5 projection (per `pointer-input-model.md`) — the same code
that turns a tap into a build target in the live game turns a brush
stroke into a tile edit. Touch is inherited from the Phase 21/34 gesture
work (`gestures.ts`): pan/zoom are the existing two-finger gestures;
paint is single-finger drag; a tool palette replaces the panel bar.
This is why the editor is mostly *engine + UI glue*, not a from-scratch
build.

### 3.4 Validation feedback

A persistent strip shows, recomputed (debounced) after edits:

- **Castle-placeable:** each player's start passes `canBuildCastle`.
- **Buildable ratio:** fraction of tiles that are non-water,
  non-impassable, walkable — derived from `typesUp`/`typesDown` ≥
  `grass0` and `mapSpaceFromObject` of `objects`.
- **Reachability:** each player's start can reach a minimum buildable
  area via the existing A* / flag-graph reachability the engine already
  has (`pathfinder.ts`).
- **Balance hints (advisory, non-blocking):** per-player buildable
  area, mineral totals near each start, symmetry score.

Green strip ⇒ "Publish" enables. Red ⇒ specific, located errors.

---

## 4. Validation & determinism

This is the load-bearing section: a shared map must produce **byte-
identical simulation on every client** or it breaks lockstep,
correspondence, and the dual-attested ladder.

### 4.1 Why custom maps are determinism-safe by construction

Determinism in Serfbound does not live in the *map* — it lives in the
*pipeline*. `computeGameChecksum` (`checksum.ts:224`) hashes the six
landscape arrays via `hashWorld` (`checksum.ts:90`) plus every entity
and the RNG state. Two clients that start from the *same six arrays* and
apply the *same action schedule* produce the same checksum, full stop.
Generation is just a deterministic way to *agree on those arrays from a
seed*. A custom map agrees on them a different way: **by shipping the
bytes directly.** The simulation downstream is identical.

So the integrity story is simpler than for generated maps, not harder:
there is no PRNG to reproduce, no `preserveBugs` quirk to match (the
`map-generator.ts` reference quirks at lines 256, 479, 628 only matter
when *re-deriving* a map from a seed). A custom map *is* the agreed
state.

### 4.2 The handshake change (the real work)

Today `verifySessionHandshake` (`session-protocol.ts:142`) matches on
`seedString` + `mapSize` and regenerates. For custom maps that is
insufficient — there is no seed. The change: **add the map content hash
to the deterministic game definition.** `SessionGameSettings`
(`session-protocol.ts:15`) gains an optional `mapContentHash` (and the
map travels out-of-band, see §5.4). The handshake compares the hash; a
mismatch is `settings-mismatch` exactly as a seed mismatch is today.
Two peers with the same `contentHash` provably hold the same six arrays
(FNV-1a over the canonical byte order). This is a v2 of
`sessionProtocolVersion` (currently `1`), gated by `appVersion`
equality which the handshake already enforces (`session-protocol.ts:154`).

Correspondence matches (`correspondence.ts`) inherit this for free: a
match is `(settings, seed, accepted moves)`; for a custom map the
settings carry `customMap` (or its hash + a fetch reference) and the
re-simulation runs on the decoded landscape. The checksum referee
(`endChecksum`, `correspondence.ts:33`) is unchanged.

### 4.3 Canonicalization & the "malformed map can't desync" guarantee

A malformed or hostile map must be *rejected before the first tick*,
never able to desync mid-game. Three gates, all deterministic and
client-side:

1. **Structural validation on decode.** `size` ∈ 1..23 (the
   `MapGeometry` guard, `index.ts:162`); landscape base64 decodes to
   exactly `6 × tileCount` bytes; every terrain byte ∈ 0..15, every
   object byte ∈ the `mapSpaceFromObject` domain (0..127), every
   mineral byte ∈ 0..4. Out-of-range ⇒ reject, do not clamp (clamping
   silently is how peers diverge).
2. **Canonical content hash.** `decodeCustomMap` recomputes the FNV-1a
   hash over the canonical byte order and compares to the declared
   `contentHash`. Mismatch ⇒ reject. This makes the map *self-
   verifying*: a corrupted or tampered payload cannot load.
3. **Playability assertion.** Every declared start passes
   `canBuildCastle` against a fresh `SerfboundGameWorld(landscape,
   playerCount)`. A map you can't found a castle on is not a valid
   match definition.

Because all three gates are pure functions of the bytes, every client
reaches the same verdict. A map that passes loads into the *exact same*
`SerfboundGameWorld` constructor path the generator and savegame loader
use — there is no second code path that could diverge.

### 4.4 Test posture

A round-trip parity test (CI-safe, no `SPAU.PA`): generate a map →
encode → decode → assert the six arrays are byte-identical and
`computeGameChecksum` of `new SerfboundGameWorld(decoded)` equals that
of the original. A cross-client test: two `LockstepSession`s on the
same decoded custom map run an identical action schedule and agree on
`firstChecksumDivergence` (`checksum.ts:251`) returning `null`.

---

## 5. Sharing on serfbound.com

### 5.1 Reuse the backbone, add one service

The hosting decision (`hosting-infrastructure-decision.md`) is explicit:
serfbound deploys into its own namespace on the shared LKE cluster,
reuses cert-manager + the catalyst Envoy gateway, one JSON store per
service on a PVC, `Recreate` (load-mutate-save is not concurrency-safe).
The two existing services (`identity`, `mailbox`) are zero-dependency
Node `http` servers that **verify signatures, store, and forward — they
never referee** (`services/README.md`). The maps service is a *third*
service cut to the same template: `services/maps/server.mjs`, image
`ghcr.io/karolswdev/serfbound-maps`, path `/maps` on
`api.serfbound.com`, its own PVC store `serfbound-maps.json`.

It must honor the same posture:
- **No original game data can reach it** — the wire format (`§5.2`) has
  no field for sprite bytes, exactly as the mailbox "has no field for
  it."
- **No analytics, no logs of play.** Ingress access logs follow the
  cluster default; serfbound ships nothing.
- **Rate limiting at the ingress** (the recorded abuse-posture item).
- **The game never depends on it.** serfbound.com (static Pages)
  serves the game; the maps gallery degrades to "offline — sharing
  unavailable" without touching local play.

### 5.2 The service API

Signatures use the same ECDSA P-256 device key as identity/mailbox
(`identity/server.mjs:fingerprint`/`verifySignature`). The author signs
the canonical map bytes; the service verifies the signature against the
declared `authorKeyId` before storing — so authorship is attestable and
a map can't be published under someone else's key.

| Method | Path | Body / effect |
|---|---|---|
| `POST` | `/maps` | `{ map, signature }` — verify sig over canonical bytes, structural+size validate, store, return `{ mapId }` |
| `GET` | `/maps` | gallery: `{ maps: [{ mapId, title, authorName, size, playerCount, contentHash, thumbnail, rating, downloads }] }`, filterable by `size`/`players`, sortable by `rating`/`recent` |
| `GET` | `/maps/:id` | the full `SerfboundCustomMap` payload |
| `POST` | `/maps/:id/rate` | signed `{ stars: 1..5 }`, one rating per key (dedup by `keyId`, same pattern as the mailbox ladder dedup) |
| `POST` | `/maps/:id/report` | signed report (see §6) |
| `DELETE` | `/maps/:id` | author-key-signed takedown |

Ratings reuse the mailbox `ratings` shape pattern; downloads is a counter
bumped on `GET /maps/:id`.

### 5.3 Storage cost on the cluster

This is the one place the maps service differs materially from
identity/mailbox: those store tiny records (key + name; checksums +
move lists, size-capped). Maps store *payloads* — ~24 KB (size 6) to
~400 KB (size 10) each. The decision record's cost ceiling is **no new
node pools, no new LoadBalancer, negligible object storage**. Mitigations:

- **Hard payload cap** (mirrors the mailbox `moveByteCap`,
  `mailbox/server.mjs:182`): reject maps over, say, 512 KB encoded
  (covers up to ~size 10; larger sizes are rare and can be a later
  decision).
- **Per-key publish quota** (e.g. 50 maps/key) — accounts are free
  keypairs, so this bounds a single actor, not the population.
- **The JSON-store-on-PVC model holds** to low thousands of maps
  (a few hundred MB). Beyond that, the *payloads* move to Linode
  Object Storage (the same place the backup CronJob already targets per
  the decision record) and the JSON store keeps metadata + an object
  key. This is a recorded escalation, not a Phase 42 build.

### 5.4 How a downloaded map is played

`GET /maps/:id` returns the `SerfboundCustomMap`; the client validates
(§4.3), stores it in a new IndexedDB store (`serfbound-custom-maps`,
parallel to `imported-data-store.ts` and `local-game-save-store.ts`),
and it appears in the local map library. "Play" feeds it through the
existing start-game flow (the `customMap` settings seam, §2.2). For
multiplayer the map travels **out-of-band once** (fetched by `mapId` or
exchanged over the WebRTC data channel before the session), and the
session wire carries only the `mapContentHash` (§4.2) — the session
protocol's promise that "original game data never crosses it" extends
to "and the map crosses once, hashed, before tick zero."

---

## 6. Moderation, abuse, safety

User-generated content needs a real story; the project's privacy
posture (no accounts required, no play logs, reputational-only ratings)
shapes what is even possible.

- **Names & titles:** `meta.title` and `authorName` run through the
  same `sanitizeName` discipline identity already applies
  (uppercase, length cap, charset filter — `identity/server.mjs`).
  Titles get a longer cap and a server-side denylist for slurs; this is
  best-effort, not perfect, and recorded as such.
- **Reporting:** `POST /maps/:id/report` (signed). Reports accumulate;
  a threshold flips a map to `quarantined` (hidden from the gallery,
  still reachable by direct `mapId` for the author). Adjudication is
  the maintainer's manual call — there is no automated takedown, by
  design (no server-side judgment of content).
- **Size & quota limits:** the §5.3 payload cap and per-key publish
  quota are the primary abuse bound (storage exhaustion, spam).
- **What the map *can't* carry:** a map is six byte arrays + text
  metadata + a sprite-free thumbnail. It cannot carry executable
  content, original sprite bytes, or arbitrary blobs — the schema has
  no field for them and decode rejects anything that isn't the exact
  `6 × tileCount` byte payload. The attack surface is text fields and
  a thumbnail, both validated.
- **Honest limits (the house style):** colluding keys can rate-farm a
  map exactly as colluding keys can farm the ladder ("recorded, not
  defended," `services/README.md`); smurfing is unsolved because
  accounts are free keypairs; the denylist will miss creative
  spelling. These are named, not pretended away.
- **Privacy:** the maps service holds author key fingerprint + display
  name + the map. No emails, no IPs shipped anywhere, ingress logs at
  cluster default. Consistent with the restated data posture in the
  hosting decision.

---

## 7. The asset boundary, explicitly

This is the constraint that could sink the feature if gotten wrong, so
the argument is made carefully against `asset-and-legal-boundary.md`.

### 7.0 The tool needs no game data at all (the maintainer's pivot)

The original draft argued maps render *only* with the player's own
imported assets. The maintainer's directive makes the position
stronger: **the builder and gallery are asset-free tools that render
schematically**, so the question "is a shared map clean?" is resolved
*by construction*, not by argument:

- **The editor renders without any original data.** Terrain draws as
  flat false-color (the `minimapTerrainColors` table, `popup.ts:225` —
  one solid color per `mapTerrain` value, already in the codebase);
  objects draw as simple geometric markers (a circle for a tree, a
  diamond for stone, a tinted dot for a mineral), not decoded sprites.
  A player with no `SPAU.PA` opens the editor and builds a complete,
  valid map. This is a *tool*, like any level editor, not the game.
- **The gallery renders without any original data.** Thumbnails and
  map previews are the same false-color render. Browsing and
  downloading need no imported assets.
- **Only *playing* needs your own assets** — the authentic WebGL2
  sprite scene requires imported `SPAU.PA`, exactly as a generated map
  does today. The map file still carries no art; the player's own data
  supplies the *look*, the synthetic render supplies the *tool*.

So there are two render paths, and the asset-free one is the default
for all tool surfaces: **synthetic** (false-color + markers, no
original data — editor, gallery, thumbnails) and **authentic** (the
production sprite scene, needs the player's own `SPAU.PA` — playing).
Nothing the service ever stores or ships touches original art, and a
map is usable as a *design artifact* by anyone, asset or no.

### 7.1 The legal argument: a map is user-authored data, not an asset

The boundary doc forbids committing, hosting, bundling, or
redistributing "original DOS/Amiga archives, extracted sprites, music,
palettes, title art" and "converted PNG/WAV/MIDI assets from original
data." A custom map contains **none of those.** It is:

- **Terrain layout** — `heights`, `typesUp`, `typesDown`: numbers
  describing the *shape of a landscape the author drew*. The integers
  0..15 are an *enumeration* ("this triangle is grass2"), not the grass
  sprite. They are the author's original arrangement, the same way a
  level a player builds in any map editor is the player's work.
- **Object & mineral placement** — `objects`, `minerals`,
  `resourceAmounts`: "a tree-type object sits here," "a gold deposit of
  amount N here." Again indices into an enumeration, authored by the
  player.

A map references the *idea* of a sprite by its index; it never carries
the sprite. This is the same distinction the codebase already lives by:
the session protocol carries world actions and checksums, "original
game data never crosses it (each player imports their own assets)"
(`session-protocol.ts:11`); the mailbox carries "world actions and
checksums only" and "original game data cannot reach these services —
the wire format has no field for it" (`services/README.md`). The map
file extends that exact principle to authored content. The author's
*arrangement* is their copyrightable work; it is distinct from the
underlying sprite catalog the rights-holder owns.

A useful analogy the boundary doc's spirit supports: sharing a list of
chess moves is not sharing the chess set. A custom map is the board
layout; the pieces (sprites) are the player's own imported `SPAU.PA`.

### 7.2 The technical enforcement: the tool is synthetic, playing needs your own assets

The argument is backed by enforcement, not trust:

- **The format physically cannot carry sprite data.** `landscape` is
  base64 of exactly `6 × tileCount` bytes whose ranges are the terrain/
  object/mineral *enumerations*; decode rejects any other length or
  out-of-range byte (§4.3). There is no blob field.
- **Every tool surface renders synthetically, never from sprites.**
  The editor, the gallery, thumbnails, and map previews all draw from
  the false-color terrain table + geometric object markers (§7.0) — no
  decoded sprite ever touches a tool surface, so the tool is legal and
  usable with zero imported data. Original art off the service, by
  construction.
- **Only the authentic *play* render uses imported assets.** When a
  player launches a map into the real game, the production sprite scene
  (`landscape-scene.ts`) resolves terrain/object indices to *decoded
  sprites from the player's own `SPAU.PA`* — and the local-game start
  rejects with `missing-imported-data` if absent (`local-game.ts:167`),
  exactly as a generated map does today. The map carries the
  *what-goes-where*; the player's own assets carry the
  *what-it-looks-like*; the synthetic render carries the *tool*.
- **Stop-signal:** if anyone ever proposes routing a *decoded sprite*
  into a tool surface (a "real sprite" thumbnail or editor preview), it
  goes back to a rights review — the synthetic/authentic split is the
  enforced boundary, same discipline as the boundary doc's stop
  signals.

### 7.3 Boundary-doc addendum required

If accepted, SB-42-01 must add a section to
`asset-and-legal-boundary.md` recording: (a) custom maps are
user-authored data in the "source code / data written for Serfbound"
allowed category, not the forbidden original-asset categories; (b) the
maps service stores authored maps only, never original payloads, with
the same "no field for it" guarantee as the mailbox; (c) the sprite-
free thumbnail rule. This keeps the boundary doc the single source of
truth.

---

## 8. Phasing

Two phases, each gated the house way (engineering stories → evidence →
a device/visual gate). Phase 42 ships the editor and local custom-map
play (no network — honors "serverless play first-class"); Phase 43
ships sharing on the backbone. Splitting this way means the riskiest
*engine* work (determinism of authored maps) proves out before any
*service* work, and the editor is independently shippable.

### Phase 42 — Map Builder (local)

- **SB-42-01 — The format and the boundary.** The
  `serfbound.custom-map` v1 schema, `encodeCustomMap`/`decodeCustomMap`
  with structural validation + canonical FNV-1a content hash, the
  `customMap` seam in `SerfboundLocalGameSettings.landscape()`, and the
  boundary-doc addendum (§7.3). *Exit:* round-trip parity test green —
  generate → encode → decode → byte-identical arrays and equal
  `computeGameChecksum`; malformed payloads reject (not clamp).
  *Depends on:* nothing. *Riskiest unknown:* none — this is the safe
  foundation, deliberately first.
- **SB-42-02 — The synthetic editor canvas.** A **synthetic** render of
  the live draft landscape — false-color terrain
  (`minimapTerrainColors`) + geometric object markers, **no imported
  data required** (the maintainer's pivot, §7.0); pointer→tile via the
  Phase 5 projection; terrain-paint and height brushes with the
  `adjustMapHeight` slope clamp; undo/redo ring. *Exit:* with **zero
  imported assets**, edit a blank map's terrain and heights and see the
  synthetic scene update; a CI test asserts a stroke writes the
  expected bytes. *(The authentic sprite preview, for players who have
  imported data, is an optional later enhancement — the tool's default
  is asset-free.)*
- **SB-42-03 — Objects, minerals, starts.** Object/mineral palette with
  `mapSpaceFromObject` legality, cluster brushes, and the per-player
  castle-start tool running live `canBuildCastle`. *Exit:* place all
  object/mineral classes legally; set N starts; illegal placements
  refused with located feedback.
- **SB-42-04 — Validation & play-local.** The persistent validity
  strip (castle-placeable, buildable ratio, reachability, balance
  hints); "Play this map" into a local single-player / hot-seat game.
  *Exit:* a fully authored map plays to a founded castle and a built
  building, all local, no network.
- **SB-42-05 — Device gate (visual).** The maintainer authors a real
  map on a real device (touch + desktop), plays it, saves it, reloads
  it — captured screenshots under the phase artifacts folder. *Exit:*
  the founder's own eyes (the Phase 32/34 device-gate pattern).

### Phase 43 — Community Maps (sharing)

- **SB-43-01 — The maps service.** `services/maps/server.mjs` (zero-dep,
  signature-verifying, JSON-store-on-PVC, `Recreate`); the API of §5.2;
  payload cap + per-key quota; contract test (unexpected fields reject,
  original-data fields have no home). *Exit:* publish/list/fetch a map
  locally against the service; sig verification + structural validation
  green; "no original data field exists" contract test green.
- **SB-43-02 — Deploy to the backbone.** `/maps` on `api.serfbound.com`
  via the catalyst gateway + cert-manager, own namespace store, the
  backup CronJob extended. *Exit:* `https://api.serfbound.com/maps`
  live; game-down-independence proven (gallery offline ⇒ local play
  untouched).
- **SB-43-03 — The gallery & library shell.** Browse/filter/sort/rate/
  report UI on serfbound.com; sprite-free thumbnails; download into the
  `serfbound-custom-maps` IndexedDB store and the local library; design-
  standard conformant (PMO rule #8). *Exit:* browse, download, and play
  a community map end to end.
- **SB-43-04 — Custom maps in multiplayer.** `sessionProtocolVersion`
  v2 with `mapContentHash` in the handshake; out-of-band map exchange;
  correspondence + (where available) realtime sessions on a custom map.
  *Exit:* two clients run a lockstep/correspondence match on the same
  custom map with `firstChecksumDivergence === null` through to a
  dual-attested result. *Riskiest unknown:* the handshake/transport
  change — deliberately last, after the format and determinism are
  proven.
- **SB-43-05 — Moderation & device gate.** Reporting → quarantine flow,
  name/title filtering, the per-key quota proven; maintainer publishes,
  browses, downloads, and plays a community map on a real device.
  *Exit:* the device gate + the abuse-posture checklist recorded with
  honest limits.

**Dependency spine:** SB-42-01 (format + determinism) gates everything;
SB-43-04 (multiplayer handshake) is last because it is the only place a
bad design could corrupt the existing lockstep/correspondence
guarantees. The service work (43-01/02) is independent of the editor
work (42-02/03/04) once the format exists.

---

## 9. Open questions & risks

- **[RESOLVED 2026-06-13] The asset-boundary question.** The original
  draft flagged this as the gating unknown: is a shared map clean, or
  does it need a Phase-31-style written rights review? The maintainer's
  directive resolves it *by construction* (§7.0): the builder and
  gallery are asset-free synthetic tools needing no game data at all,
  and original assets are required only to play — exactly today's rule.
  A map of integer terrain/object indices, rendered false-color, is
  categorically unlike the converted-sprite payloads the boundary
  forbids. *Verdict:* accept as engineering policy via the SB-42-01
  addendum to `asset-and-legal-boundary.md` and the synthetic/authentic
  split stop-signal. No written rights gate.
- **Determinism of hand-authored terrain.** *Risk:* an authored
  landscape that the generator would never produce (sheer cliffs,
  isolated islands, water/land patterns) could expose untested
  `SerfboundGameWorld` / serf-engine / pathfinder edge cases that
  desync or hang. *Recommendation:* enforce the generator's own
  invariants in the editor (the `adjustMapHeight` ≤32 slope clamp,
  `mapSpaceFromObject` legality, the island-removal intuition as a
  "no unreachable land" validator) so authored maps stay inside the
  space the engine already handles; add a fuzz test that runs random
  *valid* authored maps for N ticks asserting no divergence/hang.
- **Balance.** *Risk:* authored maps are trivially unfair (one player
  boxed in, all the gold by one start). *Recommendation:* balance is
  *advisory, never blocking* — show per-player buildable area, nearby
  minerals, and a symmetry score, but let players publish "unfair"
  maps (asymmetry is legitimate map design). The gallery rating is the
  real balance signal.
- **Storage cost on the LKE cluster.** *Risk:* map payloads (~24 KB–
  400 KB) are far larger than identity/mailbox records and the single
  PVC store is finite. *Recommendation:* hard 512 KB payload cap +
  per-key quota for Phase 43; record the Object-Storage escalation
  (payloads to Linode Object Storage, metadata in the JSON store) as
  the documented next step if the gallery grows past a few hundred MB —
  not built up front.
- **Moderation load.** *Risk:* UGC invites spam/abuse and there is no
  automated content judgment (by privacy design). *Recommendation:*
  report→quarantine + maintainer manual adjudication; lean on the
  structural impossibility of payload abuse (the schema has no blob
  field) so the only surfaces are text and thumbnails, both validated.
- **The handshake v2 change.** *Risk:* adding `mapContentHash` to the
  deterministic game definition touches the most safety-critical code
  (lockstep/correspondence parity). *Recommendation:* gate it behind
  `sessionProtocolVersion` v2 + the existing `appVersion` equality
  check; ship it *last* (SB-43-04) on top of a format and determinism
  story already proven in CI.

---

## Appendix — files this proposal is grounded in

- `packages/engine/src/map-generator.ts` — `ClassicMapLandscape` (135),
  `mapTerrain`/`mapObject`/`mapMinerals` (8/27/59), `mapSpaceFromObject`
  (75), `classicSpiralPattern` (119), `adjustMapHeight` (288), cleanup
  (735), `generateClassicMap` (160).
- `packages/engine/src/game-world.ts` — `SerfboundGameWorld` ctor (418,
  accepts a landscape value), `positionAddSpirally` (473),
  `canBuildCastle` (1185), `buildCastle` (1214).
- `packages/engine/src/dos-savegame.ts` — `continueFromDosSavegame`
  (269): proof a hand-built landscape feeds the world.
- `packages/engine/src/local-game.ts` — `landscape()` (104, the
  `customMap` seam), `landscapeForLocalGameSettings` (282),
  `missing-imported-data` reject (167).
- `packages/engine/src/checksum.ts` — `hashWorld` (90, the six arrays),
  `computeGameChecksum` (224), `firstChecksumDivergence` (251),
  `StateHasher` (reuse for the content hash).
- `packages/engine/src/session-protocol.ts` — `SessionGameSettings`
  (15), `verifySessionHandshake` (142), the "original game data never
  crosses it" promise (11).
- `packages/engine/src/lockstep.ts`, `correspondence.ts` — the
  determinism consumers a custom map must not break.
- `packages/engine/src/index.ts` — `MapGeometry` size guard 1..23 (162).
- `packages/app/src/landscape-scene.ts` — the renderer the editor reuses
  (`ClassicMapLandscape` in, triangle composition 196/216).
- `services/identity/server.mjs`, `services/mailbox/server.mjs`,
  `services/README.md` — the service template, signature verification,
  size caps (`moveByteCap`, mailbox:182), the "no field for original
  data" posture.
- `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md` — the
  boundary §7 extends.
- `pm/roadmap/serfbound/adoption/hosting-infrastructure-decision.md` —
  the backbone §5 reuses.
- `pm/roadmap/serfbound/adoption/pointer-input-model.md` — the
  pointer→tile path the editor reuses.
