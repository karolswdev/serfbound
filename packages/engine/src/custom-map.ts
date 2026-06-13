import { MapGeometry } from "./index.js";
import { StateHasher } from "./checksum.js";
import type { ClassicMapLandscape } from "./map-generator.js";

// The custom-map format (SB-42-01): a self-describing, self-verifying
// record of a hand-authored landscape. The six landscape arrays are
// the *only* world state a custom map needs — SerfboundGameWorld's
// constructor takes a ClassicMapLandscape value, not a seed, so a
// decoded custom map plays through the exact same pipeline a generated
// map does. The format carries integer terrain/object/mineral indices
// and authoring metadata; it physically cannot carry sprite data (no
// blob field, and decode rejects any payload that is not exactly the
// six byte arrays) — the asset-boundary guarantee in bytes.

export const customMapSchemaVersion = 1 as const;
export const customMapKind = "serfbound.custom-map" as const;

// The fixed canonical order the landscape arrays serialize and hash in.
// Pinned forever — the content hash and every peer depend on it.
const landscapeArrayOrder = [
  "heights",
  "typesUp",
  "typesDown",
  "objects",
  "minerals",
  "resourceAmounts",
] as const;

// Inclusive byte-range guards (reject, never clamp): terrain enums
// 0..15 (mapTerrain), object enums 0..127 (mapSpaceFromObject domain),
// mineral enums 0..4 (mapMinerals). heights and resourceAmounts use the
// full 0..255 byte range.
const terrainMax = 15;
const objectMax = 127;
const mineralMax = 4;

export type CustomMapStart = {
  readonly player: number;
  readonly position: number;
  readonly supplies: number;
};

export type CustomMapMeta = {
  readonly title: string;
  readonly authorKeyId: string;
  readonly authorName: string;
  readonly createdAtIso: string;
  readonly thumbnail?: string;
};

export type SerfboundCustomMap = {
  readonly schemaVersion: typeof customMapSchemaVersion;
  readonly kind: typeof customMapKind;
  readonly size: number;
  // base64 of the six arrays concatenated in landscapeArrayOrder,
  // 6 * tileCount bytes.
  readonly landscape: string;
  readonly playerCount: number;
  readonly starts: readonly CustomMapStart[];
  // FNV-1a over the canonical bytes (size + the six arrays).
  readonly contentHash: number;
  readonly meta: CustomMapMeta;
};

export type CustomMapDecodeRejection =
  | "invalid-schema"
  | "invalid-size"
  | "invalid-payload-length"
  | "out-of-range-terrain"
  | "out-of-range-object"
  | "out-of-range-mineral"
  | "content-hash-mismatch";

export class CustomMapDecodeError extends Error {
  readonly reason: CustomMapDecodeRejection;
  constructor(reason: CustomMapDecodeRejection, message: string) {
    super(message);
    this.name = "CustomMapDecodeError";
    this.reason = reason;
  }
}

// --- base64 (isomorphic, no Buffer/btoa dependency) -------------------------

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64Lookup = (() => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < base64Alphabet.length; i += 1) {
    table[base64Alphabet.charCodeAt(i)] = i;
  }
  return table;
})();

function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out +=
      base64Alphabet[(n >> 18) & 63]! +
      base64Alphabet[(n >> 12) & 63]! +
      base64Alphabet[(n >> 6) & 63]! +
      base64Alphabet[n & 63]!;
  }

  const remaining = bytes.length - i;
  if (remaining === 1) {
    const n = bytes[i]! << 16;
    out += base64Alphabet[(n >> 18) & 63]! + base64Alphabet[(n >> 12) & 63]! + "==";
  } else if (remaining === 2) {
    const n = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out +=
      base64Alphabet[(n >> 18) & 63]! +
      base64Alphabet[(n >> 12) & 63]! +
      base64Alphabet[(n >> 6) & 63]! +
      "=";
  }

  return out;
}

function base64ToBytes(text: string): Uint8Array | null {
  let length = text.length;
  if (length % 4 !== 0) {
    return null;
  }

  let padding = 0;
  if (length > 0 && text[length - 1] === "=") {
    padding += 1;
  }
  if (length > 1 && text[length - 2] === "=") {
    padding += 1;
  }

  const outLength = (length / 4) * 3 - padding;
  const out = new Uint8Array(outLength);
  let outIndex = 0;
  for (let i = 0; i < length; i += 4) {
    const c0 = base64Lookup[text.charCodeAt(i)] ?? -1;
    const c1 = base64Lookup[text.charCodeAt(i + 1)] ?? -1;
    const c2 = text[i + 2] === "=" ? 0 : (base64Lookup[text.charCodeAt(i + 2)] ?? -1);
    const c3 = text[i + 3] === "=" ? 0 : (base64Lookup[text.charCodeAt(i + 3)] ?? -1);
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) {
      return null;
    }

    const n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    if (outIndex < outLength) out[outIndex++] = (n >> 16) & 0xff;
    if (outIndex < outLength) out[outIndex++] = (n >> 8) & 0xff;
    if (outIndex < outLength) out[outIndex++] = n & 0xff;
  }

  return out;
}

// --- content hash -----------------------------------------------------------

// The canonical content hash: FNV-1a over size then the six arrays in
// the pinned order. Self-verifying — a tampered or corrupted payload
// cannot match, so every client reaches the same verdict.
export function customMapContentHash(landscape: ClassicMapLandscape): number {
  const hasher = new StateHasher();
  hasher.int(landscape.size);
  for (const name of landscapeArrayOrder) {
    hasher.bytes(landscape[name]);
  }

  return hasher.value;
}

// --- encode -----------------------------------------------------------------

export function encodeCustomMap(
  landscape: ClassicMapLandscape,
  meta: CustomMapMeta,
  options: {
    readonly playerCount: number;
    readonly starts: readonly CustomMapStart[];
  },
): SerfboundCustomMap {
  const concatenated = new Uint8Array(6 * landscape.tileCount);
  let offset = 0;
  for (const name of landscapeArrayOrder) {
    concatenated.set(landscape[name], offset);
    offset += landscape.tileCount;
  }

  return {
    schemaVersion: customMapSchemaVersion,
    kind: customMapKind,
    size: landscape.size,
    landscape: bytesToBase64(concatenated),
    playerCount: options.playerCount,
    starts: options.starts.map((start) => ({ ...start })),
    contentHash: customMapContentHash(landscape),
    meta: { ...meta },
  };
}

// --- decode -----------------------------------------------------------------

// Decode + structurally validate + verify the content hash. Throws a
// typed CustomMapDecodeError on any fault — reject, never clamp, so
// peers never silently diverge on a malformed map.
export function decodeCustomMapLandscape(record: SerfboundCustomMap): ClassicMapLandscape {
  if (record.schemaVersion !== customMapSchemaVersion || record.kind !== customMapKind) {
    throw new CustomMapDecodeError("invalid-schema", "Not a serfbound.custom-map v1 record.");
  }

  if (!Number.isInteger(record.size) || record.size < 1 || record.size > 23) {
    throw new CustomMapDecodeError("invalid-size", `Map size ${record.size} is out of 1..23.`);
  }

  const geometry = new MapGeometry(record.size);
  const tileCount = geometry.tileCount;
  const bytes = base64ToBytes(record.landscape);
  if (bytes === null || bytes.length !== 6 * tileCount) {
    throw new CustomMapDecodeError(
      "invalid-payload-length",
      `Landscape payload must be exactly ${6 * tileCount} bytes.`,
    );
  }

  const slice = (index: number): Uint8Array =>
    bytes.subarray(index * tileCount, (index + 1) * tileCount);
  const heights = slice(0);
  const typesUp = slice(1);
  const typesDown = slice(2);
  const objects = slice(3);
  const minerals = slice(4);
  const resourceAmounts = slice(5);

  // Range guards on the enum arrays (heights/resourceAmounts use the
  // full byte range, so they need none).
  for (let i = 0; i < tileCount; i += 1) {
    if (typesUp[i]! > terrainMax || typesDown[i]! > terrainMax) {
      throw new CustomMapDecodeError("out-of-range-terrain", `Terrain byte out of 0..${terrainMax}.`);
    }
    if (objects[i]! > objectMax) {
      throw new CustomMapDecodeError("out-of-range-object", `Object byte out of 0..${objectMax}.`);
    }
    if (minerals[i]! > mineralMax) {
      throw new CustomMapDecodeError("out-of-range-mineral", `Mineral byte out of 0..${mineralMax}.`);
    }
  }

  const landscape: ClassicMapLandscape = {
    size: record.size,
    columns: geometry.columns,
    rows: geometry.rows,
    tileCount,
    heights: Uint8Array.from(heights),
    typesUp: Uint8Array.from(typesUp),
    typesDown: Uint8Array.from(typesDown),
    objects: Uint8Array.from(objects),
    minerals: Uint8Array.from(minerals),
    resourceAmounts: Uint8Array.from(resourceAmounts),
  };

  if (customMapContentHash(landscape) !== record.contentHash) {
    throw new CustomMapDecodeError(
      "content-hash-mismatch",
      "The landscape bytes do not match the declared content hash.",
    );
  }

  return landscape;
}
