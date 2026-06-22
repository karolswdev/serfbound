import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildDecodedRenderAssetsFromLicensedPackage,
  createStoredLicensedAssetPackageRecord,
  loadLicensedAssetPackage,
  resolveLicensedAssetDeliveryManifest,
} from "@serfbound/app";
import {
  convertDosPaArchiveToLicensedAssetPackage,
  licensedAssetPackageChecksumAlgorithm,
} from "@serfbound/assets";
import { startSerfboundLocalGame } from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

class MemoryLicensedAssetPackageStore {
  record = null;
  clearCount = 0;

  async loadCurrent() {
    return this.record === null ? null : cloneRecord(this.record);
  }

  async saveCurrent(record) {
    this.record = cloneRecord(record);
  }

  async clearCurrent() {
    this.clearCount += 1;
    this.record = null;
  }
}

function generatedPackage() {
  const archive = createDecodableGeneratedPaArchive();
  const converted = convertDosPaArchiveToLicensedAssetPackage(archive, {
    archiveName: "SPAU.PA",
  });
  return {
    archive,
    package: converted.package,
    bytes: converted.bytes,
    packageChecksum: converted.packageChecksum,
  };
}

function cloneRecord(record) {
  return {
    ...record,
    packageChecksum: { ...record.packageChecksum },
    contentChecksum: { ...record.contentChecksum },
    bytes: record.bytes.slice(0),
  };
}

function arrayBufferFrom(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function responseFrom(bytes) {
  return {
    ok: true,
    status: 200,
    async arrayBuffer() {
      return arrayBufferFrom(bytes);
    },
  };
}

test("licensed asset delivery downloads once and restores from cache without refetching", async () => {
  const fixture = generatedPackage();
  const store = new MemoryLicensedAssetPackageStore();
  let fetchCount = 0;
  const config = {
    packageUrl: "https://assets.serfbound.test/serfbound-assets.sb31.json",
    expectedPackageChecksum: fixture.packageChecksum,
  };

  const first = await loadLicensedAssetPackage(config, store, async () => {
    fetchCount += 1;
    return responseFrom(fixture.bytes);
  });

  assert.equal(first.state, "downloaded");
  assert.equal(first.cacheState, "persisted");
  assert.equal(first.record.permissionRecord, "LICENSE-CONSENT.md");
  assert.equal(first.record.pmoStory, "SB-31-01");
  assert.equal(first.inspection.contentChecksumValid, true);
  assert.equal(fetchCount, 1);

  const second = await loadLicensedAssetPackage(config, store, async () => {
    throw new Error("network should not be used after cache restore");
  });

  assert.equal(second.state, "restored");
  assert.equal(second.cacheState, "persisted");
  assert.equal(second.record.packageChecksum.value, first.record.packageChecksum.value);
  assert.equal(fetchCount, 1);
});

test("licensed asset manifest resolves package config relative to the manifest URL", async () => {
  const config = await resolveLicensedAssetDeliveryManifest(
    "https://serfbound.test/licensed-assets/manifest.json",
    async () => ({
      ok: true,
      status: 200,
      async arrayBuffer() {
        return new TextEncoder().encode(
          JSON.stringify({
            kind: "serfbound.licensed-asset-delivery",
            schemaVersion: 1,
            formatVersion: "sb31-runtime-v1",
            permissionRecord: "LICENSE-CONSENT.md",
            pmoStory: "SB-31-01",
            packageUrl: "serfbound-assets.sb31.json",
            packageChecksum: {
              algorithm: "fnv1a32",
              value: "1234abcd",
            },
          }),
        ).buffer;
      },
    }),
  );

  assert.deepEqual(config, {
    packageUrl: "https://serfbound.test/licensed-assets/serfbound-assets.sb31.json",
    expectedPackageChecksum: {
      algorithm: "fnv1a32",
      value: "1234abcd",
    },
  });
});

test("licensed asset delivery restores cached package when no manifest is reachable", async () => {
  const fixture = generatedPackage();
  const store = new MemoryLicensedAssetPackageStore();
  store.record = createStoredLicensedAssetPackageRecord({
    packageUrl: "https://assets.serfbound.test/serfbound-assets.sb31.json",
    bytes: fixture.bytes,
    cachedAtIso: "2026-06-22T00:00:00.000Z",
  });

  const result = await loadLicensedAssetPackage(null, store, async () => {
    throw new Error("offline restore should not fetch a package");
  });

  assert.equal(result.state, "restored");
  assert.equal(result.cacheState, "persisted");
  assert.equal(result.record.packageChecksum.value, fixture.packageChecksum.value);
});

test("licensed asset delivery does not create storage while probing an absent cache", async () => {
  const result = await loadLicensedAssetPackage(
    null,
    {
      async loadCurrentIfPresent() {
        return null;
      },
      async loadCurrent() {
        throw new Error("absent cache probe should not open/create storage");
      },
      async saveCurrent() {
        throw new Error("absent cache probe should not save storage");
      },
      async clearCurrent() {
        throw new Error("absent cache probe should not clear storage");
      },
    },
    async () => {
      throw new Error("absent cache probe should not fetch a package");
    },
  );

  assert.deepEqual(result, { state: "not-configured" });
});

test("licensed asset delivery rejects release checksum mismatches", async () => {
  const fixture = generatedPackage();
  const store = new MemoryLicensedAssetPackageStore();
  const result = await loadLicensedAssetPackage(
    {
      packageUrl: "https://assets.serfbound.test/serfbound-assets.sb31.json",
      expectedPackageChecksum: {
        algorithm: licensedAssetPackageChecksumAlgorithm,
        value: "00000000",
      },
    },
    store,
    async () => responseFrom(fixture.bytes),
  );

  assert.equal(result.state, "error");
  assert.match(result.message, /checksum/i);
  assert.equal(await store.loadCurrent(), null);
});

test("corrupt cached licensed packages are cleared before a fresh verified download", async () => {
  const fixture = generatedPackage();
  const store = new MemoryLicensedAssetPackageStore();
  const record = createStoredLicensedAssetPackageRecord({
    packageUrl: "https://assets.serfbound.test/serfbound-assets.sb31.json",
    bytes: fixture.bytes,
    cachedAtIso: "2026-06-22T00:00:00.000Z",
  });
  store.record = {
    ...record,
    packageChecksum: { ...record.packageChecksum, value: "ffffffff" },
  };

  const result = await loadLicensedAssetPackage(
    {
      packageUrl: record.packageUrl,
      expectedPackageChecksum: fixture.packageChecksum,
    },
    store,
    async () => responseFrom(fixture.bytes),
  );

  assert.equal(result.state, "downloaded");
  assert.equal(result.cacheState, "persisted");
  assert.equal(store.clearCount, 1);
  assert.equal(result.record.packageChecksum.value, fixture.packageChecksum.value);
});

test("licensed package render assets match archive-decoded start capability", () => {
  const fixture = generatedPackage();
  const archiveAssets = buildDecodedRenderAssets(fixture.archive);
  const packageAssets = buildDecodedRenderAssetsFromLicensedPackage(fixture.package);

  assert.notEqual(archiveAssets, null);
  assert.notEqual(packageAssets, null);
  assert.equal(packageAssets.definedArchiveEntries, archiveAssets.definedArchiveEntries);
  assert.equal(packageAssets.terrainTriangleCount, archiveAssets.terrainTriangleCount);
  assert.equal(packageAssets.rawSfx.size, archiveAssets.rawSfx.size);
  assert.equal(packageAssets.rawMusic?.length, archiveAssets.rawMusic?.length);

  const result = startSerfboundLocalGame({
    data: {
      kind: "licensed-asset-package",
      archiveName: fixture.package.source.archiveName,
      byteLength: fixture.package.source.byteLength,
      entryCount: fixture.package.source.catalog.entryCount,
      definedArchiveEntries: fixture.package.source.catalog.definedArchiveEntries,
      fixupCount: fixture.package.source.catalog.fixupCount,
      packageFormatVersion: fixture.package.formatVersion,
      packageChecksum: fixture.packageChecksum.value,
      permissionRecord: "LICENSE-CONSENT.md",
    },
  });

  assert.equal(result.status, "started");
  assert.equal(result.snapshot.data.kind, "licensed-asset-package");
  assert.equal(result.snapshot.renderer.sceneSource, "licensed-asset-package");
});
