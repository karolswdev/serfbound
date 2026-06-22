import {
  DosPaArchive,
  decodeDosResourceSprite,
  dosSpriteArchiveIndex,
  type DecodedDosSprite,
} from "./dos-sprites.js";
import { parseSerfAnimationTable, composeSerfTorso, type SerfAnimationTable } from "./serf-sprites.js";
import { decodeSfxSamples } from "./audio-sfx.js";
import { parseXmiTrack, type XmiEvent } from "./audio-xmi.js";
import type { DosPaResourceCatalogEntry } from "./index.js";

export const licensedAssetPackageKind = "serfbound.licensed-assets" as const;
export const licensedAssetPackageSchemaVersion = 1 as const;
export const licensedAssetPackageFormatVersion = "sb31-runtime-v1" as const;
export const licensedAssetPackageChecksumAlgorithm = "fnv1a32" as const;

export type LicensedAssetPackageChecksum = {
  readonly algorithm: typeof licensedAssetPackageChecksumAlgorithm;
  readonly value: string;
};

export type LicensedAssetPackagePermission = {
  readonly recordPath: "LICENSE-CONSENT.md";
  readonly pmoStory: "SB-31-01";
  readonly scope: "converted-browser-runtime-package";
};

export type LicensedAssetPackageSource = {
  readonly archiveName: string;
  readonly byteLength: number;
  readonly checksum: LicensedAssetPackageChecksum;
  readonly catalog: {
    readonly entryCount: number;
    readonly definedArchiveEntries: number;
    readonly fixupCount: number;
  };
};

export type LicensedAssetSpritePayload = {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly rgbaBase64: string;
  readonly rgbaChecksum: LicensedAssetPackageChecksum;
};

export type LicensedAssetPackageSprite = LicensedAssetSpritePayload & {
  readonly resourceName: string;
  readonly spriteIndex: number;
  readonly archiveIndex: number;
};

export type LicensedAssetPackageSerfTorso = {
  readonly bodyIndex: number;
  readonly sprite: LicensedAssetSpritePayload;
  readonly playerMask: LicensedAssetSpritePayload;
};

export type LicensedAssetPackageSfx = {
  readonly sfxId: number;
  readonly sampleRate: 8000;
  readonly sampleCount: number;
  readonly pcm16Base64: string;
  readonly pcm16Checksum: LicensedAssetPackageChecksum;
};

export type LicensedAssetPackageMusicTrack = {
  readonly trackId: number;
  readonly events: readonly XmiEvent[];
};

export type LicensedAssetPackageResourceSummary = Pick<
  DosPaResourceCatalogEntry,
  | "name"
  | "type"
  | "spriteType"
  | "dosIndex"
  | "count"
  | "availableCount"
  | "missingCount"
  | "dosPalette"
>;

export type LicensedAssetPackageContents = {
  readonly resources: readonly LicensedAssetPackageResourceSummary[];
  readonly sprites: readonly LicensedAssetPackageSprite[];
  readonly serfAnimationTable: SerfAnimationTable | null;
  readonly serfTorsos: readonly LicensedAssetPackageSerfTorso[];
  readonly sfx: readonly LicensedAssetPackageSfx[];
  readonly music: readonly LicensedAssetPackageMusicTrack[];
};

export type LicensedAssetPackage = {
  readonly kind: typeof licensedAssetPackageKind;
  readonly schemaVersion: typeof licensedAssetPackageSchemaVersion;
  readonly formatVersion: typeof licensedAssetPackageFormatVersion;
  readonly converter: "@serfbound/assets";
  readonly permission: LicensedAssetPackagePermission;
  readonly licenseNote: string;
  readonly source: LicensedAssetPackageSource;
  readonly contents: LicensedAssetPackageContents;
  readonly integrity: {
    readonly contentChecksum: LicensedAssetPackageChecksum;
  };
};

export type LicensedAssetPackageConversionOptions = {
  readonly archiveName?: string;
};

export type LicensedAssetPackageConversionResult = {
  readonly package: LicensedAssetPackage;
  readonly bytes: Uint8Array;
  readonly packageChecksum: LicensedAssetPackageChecksum;
};

export type LicensedAssetPackageInspection = {
  readonly packageChecksum: LicensedAssetPackageChecksum;
  readonly contentChecksumValid: boolean;
  readonly sourceChecksum: LicensedAssetPackageChecksum;
  readonly archiveName: string;
  readonly byteLength: number;
  readonly resourceCount: number;
  readonly spriteCount: number;
  readonly serfTorsoCount: number;
  readonly sfxCount: number;
  readonly musicTrackCount: number;
};

export class LicensedAssetPackageError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "LicensedAssetPackageError";
  }
}

export function convertDosPaArchiveToLicensedAssetPackage(
  input: ArrayBuffer | ArrayBufferView,
  options: LicensedAssetPackageConversionOptions = {},
): LicensedAssetPackageConversionResult {
  const sourceBytes = asUint8Array(input);
  const archive = new DosPaArchive(sourceBytes);
  const basePackage = {
    kind: licensedAssetPackageKind,
    schemaVersion: licensedAssetPackageSchemaVersion,
    formatVersion: licensedAssetPackageFormatVersion,
    converter: "@serfbound/assets",
    permission: {
      recordPath: "LICENSE-CONSENT.md",
      pmoStory: "SB-31-01",
      scope: "converted-browser-runtime-package",
    },
    licenseNote:
      "Converted runtime package distributed under the written consent recorded in LICENSE-CONSENT.md; raw original archives are not redistributed.",
    source: {
      archiveName: options.archiveName ?? "SPAU.PA",
      byteLength: sourceBytes.byteLength,
      checksum: checksumBytes(sourceBytes),
      catalog: {
        entryCount: archive.catalog.header.entryCount,
        definedArchiveEntries: archive.catalog.entrySummary.defined,
        fixupCount: archive.catalog.fixupSummary.count,
      },
    },
    contents: {
      resources: packageResourceSummaries(archive),
      sprites: packageSprites(archive),
      serfAnimationTable: packageSerfAnimationTable(archive),
      serfTorsos: packageSerfTorsos(archive),
      sfx: packageSfx(archive),
      music: packageMusic(archive),
    },
  } satisfies Omit<LicensedAssetPackage, "integrity">;
  const contentChecksum = checksumString(stableStringify(basePackage));
  const licensedPackage: LicensedAssetPackage = {
    ...basePackage,
    integrity: { contentChecksum },
  };
  const bytes = encodeLicensedAssetPackage(licensedPackage);

  return {
    package: licensedPackage,
    bytes,
    packageChecksum: checksumBytes(bytes),
  };
}

export function encodeLicensedAssetPackage(licensedPackage: LicensedAssetPackage): Uint8Array {
  return new TextEncoder().encode(stableStringify(licensedPackage));
}

export function decodeLicensedAssetPackageBytes(bytes: ArrayBuffer | ArrayBufferView): LicensedAssetPackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(asUint8Array(bytes)));
  } catch (error) {
    throw new LicensedAssetPackageError(`Licensed asset package is not valid JSON: ${errorMessage(error)}.`);
  }

  return assertLicensedAssetPackage(parsed);
}

export function inspectLicensedAssetPackageBytes(
  bytes: ArrayBuffer | ArrayBufferView,
): LicensedAssetPackageInspection {
  const sourceBytes = asUint8Array(bytes);
  const licensedPackage = decodeLicensedAssetPackageBytes(sourceBytes);
  const contentChecksum = checksumString(stableStringify(stripIntegrity(licensedPackage)));

  return {
    packageChecksum: checksumBytes(sourceBytes),
    contentChecksumValid:
      licensedPackage.integrity.contentChecksum.algorithm === licensedAssetPackageChecksumAlgorithm &&
      licensedPackage.integrity.contentChecksum.value === contentChecksum.value,
    sourceChecksum: licensedPackage.source.checksum,
    archiveName: licensedPackage.source.archiveName,
    byteLength: licensedPackage.source.byteLength,
    resourceCount: licensedPackage.contents.resources.length,
    spriteCount: licensedPackage.contents.sprites.length,
    serfTorsoCount: licensedPackage.contents.serfTorsos.length,
    sfxCount: licensedPackage.contents.sfx.length,
    musicTrackCount: licensedPackage.contents.music.length,
  };
}

export function verifyLicensedAssetPackageBytes(bytes: ArrayBuffer | ArrayBufferView): LicensedAssetPackageInspection {
  const inspection = inspectLicensedAssetPackageBytes(bytes);
  if (!inspection.contentChecksumValid) {
    throw new LicensedAssetPackageError("Licensed asset package content checksum mismatch.");
  }

  return inspection;
}

export function decodeLicensedPackageSprite(payload: LicensedAssetSpritePayload): DecodedDosSprite {
  return {
    deltaX: payload.deltaX,
    deltaY: payload.deltaY,
    width: payload.width,
    height: payload.height,
    offsetX: payload.offsetX,
    offsetY: payload.offsetY,
    rgba: Uint8ClampedArray.from(base64ToBytes(payload.rgbaBase64)),
  };
}

export function decodeLicensedPackagePcm16(payload: LicensedAssetPackageSfx): Int16Array {
  const bytes = base64ToBytes(payload.pcm16Base64);
  if (bytes.byteLength % 2 !== 0) {
    throw new LicensedAssetPackageError(`SFX ${payload.sfxId} has an odd PCM16 byte count.`);
  }

  const samples = new Int16Array(bytes.byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(index * 2, true);
  }

  return samples;
}

function packageResourceSummaries(archive: DosPaArchive): LicensedAssetPackageResourceSummary[] {
  return Object.values(archive.catalog.resources)
    .sort((left, right) => left.dosIndex - right.dosIndex || left.name.localeCompare(right.name))
    .map((resource) => ({
      name: resource.name,
      type: resource.type,
      spriteType: resource.spriteType,
      dosIndex: resource.dosIndex,
      count: resource.count,
      availableCount: resource.availableCount,
      missingCount: resource.missingCount,
      dosPalette: resource.dosPalette,
    }));
}

function packageSprites(archive: DosPaArchive): LicensedAssetPackageSprite[] {
  const packaged: LicensedAssetPackageSprite[] = [];
  const resources = Object.values(archive.catalog.resources)
    .filter((resource) => resource.type === "Sprite")
    .sort((left, right) => left.dosIndex - right.dosIndex || left.name.localeCompare(right.name));

  for (const resource of resources) {
    for (let spriteIndex = 0; spriteIndex < resource.count; spriteIndex += 1) {
      const sprite = decodeSafely(() => decodeDosResourceSprite(archive, resource.name, spriteIndex));
      if (sprite === null) {
        continue;
      }

      packaged.push({
        resourceName: resource.name,
        spriteIndex,
        archiveIndex: dosSpriteArchiveIndex(resource.name, spriteIndex),
        ...packageSpritePayload(sprite),
      });
    }
  }

  return packaged;
}

function packageSerfAnimationTable(archive: DosPaArchive): SerfAnimationTable | null {
  try {
    return parseSerfAnimationTable(archive);
  } catch {
    return null;
  }
}

function packageSerfTorsos(archive: DosPaArchive): LicensedAssetPackageSerfTorso[] {
  const torsos: LicensedAssetPackageSerfTorso[] = [];
  for (let bodyIndex = 0; bodyIndex < 629; bodyIndex += 1) {
    try {
      const torso = composeSerfTorso(archive, bodyIndex);
      if (torso !== null) {
        torsos.push({
          bodyIndex,
          sprite: packageSpritePayload(torso.sprite),
          playerMask: packageSpritePayload(torso.playerMask),
        });
      }
    } catch {
      // Partial fixture and language archives may omit a body; packages record
      // only successfully decoded runtime assets.
    }
  }

  return torsos;
}

function packageSfx(archive: DosPaArchive): LicensedAssetPackageSfx[] {
  const sfx: LicensedAssetPackageSfx[] = [];
  const sound = Object.values(archive.catalog.resources).find((resource) => resource.name === "sound");
  const count = sound?.count ?? 0;

  for (let sfxId = 0; sfxId < count; sfxId += 1) {
    try {
      const samples = decodeSfxSamples(archive, sfxId);
      if (samples === null) {
        continue;
      }

      const bytes = int16ToLittleEndianBytes(samples);
      sfx.push({
        sfxId,
        sampleRate: 8000,
        sampleCount: samples.length,
        pcm16Base64: bytesToBase64(bytes),
        pcm16Checksum: checksumBytes(bytes),
      });
    } catch {
      // Missing or malformed optional clips are omitted.
    }
  }

  return sfx;
}

function packageMusic(archive: DosPaArchive): LicensedAssetPackageMusicTrack[] {
  const tracks: LicensedAssetPackageMusicTrack[] = [];
  const music = Object.values(archive.catalog.resources).find((resource) => resource.name === "music");
  const count = music?.count ?? 0;

  for (let trackId = 0; trackId < count; trackId += 1) {
    try {
      const events = parseXmiTrack(archive, trackId);
      if (events !== null) {
        tracks.push({ trackId, events });
      }
    } catch {
      // Missing or malformed optional tracks are omitted.
    }
  }

  return tracks;
}

function packageSpritePayload(sprite: DecodedDosSprite): LicensedAssetSpritePayload {
  const rgba = Uint8Array.from(sprite.rgba);
  return {
    deltaX: sprite.deltaX,
    deltaY: sprite.deltaY,
    width: sprite.width,
    height: sprite.height,
    offsetX: sprite.offsetX,
    offsetY: sprite.offsetY,
    rgbaBase64: bytesToBase64(rgba),
    rgbaChecksum: checksumBytes(rgba),
  };
}

function stripIntegrity(licensedPackage: LicensedAssetPackage): Omit<LicensedAssetPackage, "integrity"> {
  const { integrity: _integrity, ...withoutIntegrity } = licensedPackage;
  return withoutIntegrity;
}

function assertLicensedAssetPackage(input: unknown): LicensedAssetPackage {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new LicensedAssetPackageError("Licensed asset package must be an object.");
  }

  const record = input as Partial<LicensedAssetPackage>;
  if (
    record.kind !== licensedAssetPackageKind ||
    record.schemaVersion !== licensedAssetPackageSchemaVersion ||
    record.formatVersion !== licensedAssetPackageFormatVersion ||
    record.permission?.recordPath !== "LICENSE-CONSENT.md" ||
    record.permission.pmoStory !== "SB-31-01" ||
    record.permission.scope !== "converted-browser-runtime-package" ||
    typeof record.licenseNote !== "string" ||
    record.source === undefined ||
    record.contents === undefined ||
    record.integrity?.contentChecksum?.algorithm !== licensedAssetPackageChecksumAlgorithm ||
    typeof record.integrity.contentChecksum.value !== "string"
  ) {
    throw new LicensedAssetPackageError("Licensed asset package metadata is unsupported or corrupt.");
  }

  if (
    typeof record.source.archiveName !== "string" ||
    typeof record.source.byteLength !== "number" ||
    record.source.checksum?.algorithm !== licensedAssetPackageChecksumAlgorithm ||
    typeof record.source.checksum.value !== "string"
  ) {
    throw new LicensedAssetPackageError("Licensed asset package source metadata is corrupt.");
  }

  if (
    !Array.isArray(record.contents.resources) ||
    !Array.isArray(record.contents.sprites) ||
    !Array.isArray(record.contents.serfTorsos) ||
    !Array.isArray(record.contents.sfx) ||
    !Array.isArray(record.contents.music)
  ) {
    throw new LicensedAssetPackageError("Licensed asset package contents are corrupt.");
  }

  return input as LicensedAssetPackage;
}

function decodeSafely<T>(decode: () => T | null): T | null {
  try {
    return decode();
  } catch {
    return null;
  }
}

function int16ToLittleEndianBytes(samples: Int16Array): Uint8Array {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < samples.length; index += 1) {
    view.setInt16(index * 2, samples[index] ?? 0, true);
  }

  return bytes;
}

function asUint8Array(input: ArrayBuffer | ArrayBufferView): Uint8Array {
  return input instanceof ArrayBuffer
    ? new Uint8Array(input)
    : new Uint8Array(input.buffer as ArrayBuffer, input.byteOffset, input.byteLength);
}

function checksumString(value: string): LicensedAssetPackageChecksum {
  return checksumBytes(new TextEncoder().encode(value));
}

function checksumBytes(bytes: Uint8Array): LicensedAssetPackageChecksum {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return {
    algorithm: licensedAssetPackageChecksumAlgorithm,
    value: hash.toString(16).padStart(8, "0"),
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (typeof value === "object" && value !== null) {
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const member = (value as Record<string, unknown>)[key];
      if (member !== undefined) {
        output[key] = stableValue(member);
      }
    }

    return output;
  }

  return value;
}

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;
    output += base64Alphabet[(chunk >> 18) & 0x3f];
    output += base64Alphabet[(chunk >> 12) & 0x3f];
    output += index + 1 < bytes.length ? base64Alphabet[(chunk >> 6) & 0x3f] : "=";
    output += index + 2 < bytes.length ? base64Alphabet[chunk & 0x3f] : "=";
  }

  return output;
}

function base64ToBytes(input: string): Uint8Array {
  if (input.length % 4 !== 0) {
    throw new LicensedAssetPackageError("Base64 payload length must be divisible by four.");
  }

  const padding = input.endsWith("==") ? 2 : input.endsWith("=") ? 1 : 0;
  const bytes = new Uint8Array((input.length / 4) * 3 - padding);
  let cursor = 0;

  for (let index = 0; index < input.length; index += 4) {
    const first = base64Value(input[index]);
    const second = base64Value(input[index + 1]);
    const third = input[index + 2] === "=" ? 0 : base64Value(input[index + 2]);
    const fourth = input[index + 3] === "=" ? 0 : base64Value(input[index + 3]);
    const chunk = (first << 18) | (second << 12) | (third << 6) | fourth;

    if (cursor < bytes.length) bytes[cursor] = (chunk >> 16) & 0xff;
    cursor += 1;
    if (cursor < bytes.length) bytes[cursor] = (chunk >> 8) & 0xff;
    cursor += 1;
    if (cursor < bytes.length) bytes[cursor] = chunk & 0xff;
    cursor += 1;
  }

  return bytes;
}

function base64Value(char: string | undefined): number {
  if (char === undefined) {
    throw new LicensedAssetPackageError("Base64 payload is truncated.");
  }

  const value = base64Alphabet.indexOf(char);
  if (value < 0) {
    throw new LicensedAssetPackageError(`Base64 payload contains invalid character '${char}'.`);
  }

  return value;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
