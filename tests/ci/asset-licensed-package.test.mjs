import assert from "node:assert/strict";
import { test } from "node:test";

import {
  convertDosPaArchiveToLicensedAssetPackage,
  decodeDosResourceSprite,
  decodeLicensedAssetPackageBytes,
  decodeLicensedPackagePcm16,
  decodeLicensedPackageSprite,
  inspectLicensedAssetPackageBytes,
  verifyLicensedAssetPackageBytes,
  DosPaArchive,
  LicensedAssetPackageError,
} from "@serfbound/assets";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

test("licensed asset conversion is deterministic and records SB-31-01 provenance", () => {
  const archiveBytes = createDecodableGeneratedPaArchive();
  const first = convertDosPaArchiveToLicensedAssetPackage(archiveBytes, {
    archiveName: "SPAU.PA",
  });
  const second = convertDosPaArchiveToLicensedAssetPackage(archiveBytes, {
    archiveName: "SPAU.PA",
  });

  assert.deepEqual(Array.from(first.bytes), Array.from(second.bytes));
  assert.deepEqual(first.packageChecksum, second.packageChecksum);
  assert.equal(first.package.kind, "serfbound.licensed-assets");
  assert.equal(first.package.schemaVersion, 1);
  assert.equal(first.package.formatVersion, "sb31-runtime-v1");
  assert.deepEqual(first.package.permission, {
    recordPath: "LICENSE-CONSENT.md",
    pmoStory: "SB-31-01",
    scope: "converted-browser-runtime-package",
  });
  assert.equal(first.package.source.archiveName, "SPAU.PA");
  assert.equal(first.package.source.byteLength, archiveBytes.byteLength);
  assert.equal(first.package.source.catalog.entryCount, 4000);

  const inspection = verifyLicensedAssetPackageBytes(first.bytes);
  assert.equal(inspection.contentChecksumValid, true);
  assert.equal(inspection.spriteCount > 100, true);
  assert.equal(inspection.serfTorsoCount > 0, true);
  assert.equal(inspection.sfxCount, 7);
  assert.equal(inspection.musicTrackCount, 1);
});

test("licensed package payloads match the direct DOS decoders", () => {
  const archiveBytes = createDecodableGeneratedPaArchive();
  const archive = new DosPaArchive(archiveBytes);
  const converted = convertDosPaArchiveToLicensedAssetPackage(archiveBytes);
  const licensedPackage = decodeLicensedAssetPackageBytes(converted.bytes);

  const packagedGround = licensedPackage.contents.sprites.find(
    (sprite) => sprite.resourceName === "map_ground" && sprite.spriteIndex === 0,
  );
  assert.notEqual(packagedGround, undefined);
  const decodedGround = decodeLicensedPackageSprite(packagedGround);
  const directGround = decodeDosResourceSprite(archive, "map_ground", 0);
  assert.deepEqual(
    {
      deltaX: decodedGround.deltaX,
      deltaY: decodedGround.deltaY,
      width: decodedGround.width,
      height: decodedGround.height,
      offsetX: decodedGround.offsetX,
      offsetY: decodedGround.offsetY,
      rgba: Array.from(decodedGround.rgba),
    },
    {
      deltaX: directGround.deltaX,
      deltaY: directGround.deltaY,
      width: directGround.width,
      height: directGround.height,
      offsetX: directGround.offsetX,
      offsetY: directGround.offsetY,
      rgba: Array.from(directGround.rgba),
    },
  );

  const packagedSfx = licensedPackage.contents.sfx.find((sfx) => sfx.sfxId === 1);
  assert.notEqual(packagedSfx, undefined);
  assert.equal(decodeLicensedPackagePcm16(packagedSfx).length, packagedSfx.sampleCount);

  const music = licensedPackage.contents.music.find((track) => track.trackId === 0);
  assert.notEqual(music, undefined);
  assert.equal(music.events.some((event) => event.kind === "tempo"), true);
  assert.equal(music.events.some((event) => event.kind === "noteOn"), true);
});

test("licensed package verification rejects content drift", () => {
  const converted = convertDosPaArchiveToLicensedAssetPackage(createDecodableGeneratedPaArchive());
  const parsed = JSON.parse(new TextDecoder().decode(converted.bytes));
  parsed.contents.sprites[0].width += 1;
  const corrupted = new TextEncoder().encode(JSON.stringify(parsed));

  const inspection = inspectLicensedAssetPackageBytes(corrupted);
  assert.equal(inspection.contentChecksumValid, false);
  assert.throws(
    () => verifyLicensedAssetPackageBytes(corrupted),
    LicensedAssetPackageError,
  );
});
