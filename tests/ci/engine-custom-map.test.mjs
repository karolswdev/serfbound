import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundGameWorld,
  computeGameChecksum,
  customMapContentHash,
  decodeCustomMapLandscape,
  encodeCustomMap,
  generateClassicMap,
} from "@serfbound/engine";

const meta = {
  title: "TEST VALLEY",
  authorKeyId: "abc123",
  authorName: "TESTER",
  createdAtIso: "2026-06-13T00:00:00.000Z",
};

function sampleMap() {
  return generateClassicMap(3, [0x1234, 0x5678, 0x9abc]);
}

test("a custom map round-trips byte-identically and plays to the same checksum (SB-42-01)", () => {
  const original = sampleMap();
  const record = encodeCustomMap(original, meta, {
    playerCount: 2,
    starts: [
      { player: 0, position: 100, supplies: 20 },
      { player: 1, position: 4000, supplies: 20 },
    ],
  });

  assert.equal(record.kind, "serfbound.custom-map");
  assert.equal(record.schemaVersion, 1);
  assert.equal(record.size, original.size);
  assert.equal(record.playerCount, 2);
  assert.equal(record.starts.length, 2);

  const decoded = decodeCustomMapLandscape(record);
  for (const name of ["heights", "typesUp", "typesDown", "objects", "minerals", "resourceAmounts"]) {
    assert.deepEqual(
      Array.from(decoded[name]),
      Array.from(original[name]),
      `${name} round-trips byte-identically`,
    );
  }

  // The decoded landscape plays through the same pipeline; the worlds
  // hash identically.
  const before = computeGameChecksum({ world: new SerfboundGameWorld(original, 2) });
  const after = computeGameChecksum({ world: new SerfboundGameWorld(decoded, 2) });
  assert.equal(after, before, "the decoded map produces the identical world checksum");
});

test("malformed custom maps reject, never clamp (SB-42-01)", () => {
  const good = encodeCustomMap(sampleMap(), meta, { playerCount: 1, starts: [] });

  const rejects = (mutate, reason) => {
    const bad = mutate(structuredClone(good));
    assert.throws(
      () => decodeCustomMapLandscape(bad),
      (error) => error.name === "CustomMapDecodeError" && error.reason === reason,
      `expected ${reason}`,
    );
  };

  rejects((m) => ({ ...m, schemaVersion: 2 }), "invalid-schema");
  rejects((m) => ({ ...m, kind: "something-else" }), "invalid-schema");
  rejects((m) => ({ ...m, size: 99 }), "invalid-size");
  rejects((m) => ({ ...m, landscape: m.landscape.slice(0, 8) }), "invalid-payload-length");
  // A tampered hash (bytes unchanged) is caught by the hash check.
  rejects((m) => ({ ...m, contentHash: (m.contentHash ^ 0xffff) >>> 0 }), "content-hash-mismatch");
});

test("out-of-range enum bytes reject (SB-42-01)", () => {
  // Hand-build a payload with a terrain byte of 99 (> 15), matching its
  // own (wrong-range) content hash so the range guard is what fires.
  const original = sampleMap();
  const tampered = {
    ...original,
    typesUp: Uint8Array.from(original.typesUp),
  };
  tampered.typesUp[0] = 99;
  const record = encodeCustomMap(tampered, meta, { playerCount: 1, starts: [] });
  assert.equal(customMapContentHash(tampered), record.contentHash, "hash matches the bad bytes");

  assert.throws(
    () => decodeCustomMapLandscape(record),
    (error) => error.name === "CustomMapDecodeError" && error.reason === "out-of-range-terrain",
  );
});

test("the customMap seam feeds the decoded landscape into the game (SB-42-01)", async () => {
  const { landscapeForLocalGameSettings } = await import("@serfbound/engine");
  const original = sampleMap();
  const record = encodeCustomMap(original, meta, { playerCount: 1, starts: [] });

  // With a customMap present, the local-game landscape seam returns the
  // decoded landscape, not a seed-generated one.
  const fromCustom = landscapeForLocalGameSettings({
    mapSize: 99, // deliberately wrong — the custom map must win, not the seed
    seedString: "0000000000000000",
    initialSupplies: 20,
    customMap: record,
  });
  assert.equal(fromCustom.size, original.size, "the custom map's size wins, not mapSize");
  assert.deepEqual(
    Array.from(fromCustom.objects),
    Array.from(original.objects),
    "the seam returns the authored landscape",
  );
});
