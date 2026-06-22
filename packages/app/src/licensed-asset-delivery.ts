import {
  decodeLicensedAssetPackageBytes,
  inspectLicensedAssetPackageBytes,
  licensedAssetPackageFormatVersion,
  verifyLicensedAssetPackageBytes,
  type LicensedAssetPackage,
  type LicensedAssetPackageChecksum,
  type LicensedAssetPackageInspection,
} from "@serfbound/assets";
import { cloneToArrayBuffer, errorMessage } from "./imported-data-store.js";

export const licensedAssetPackageDatabaseName = "serfbound-licensed-assets";
export const licensedAssetPackageStoreName = "packages";
export const currentLicensedAssetPackageKey = "current-licensed-package";
export const defaultLicensedAssetManifestUrl = "./licensed-assets/manifest.json";

export type LicensedAssetDeliveryConfig = {
  readonly packageUrl: string;
  readonly expectedPackageChecksum?: LicensedAssetPackageChecksum;
};

export type LicensedAssetDeliveryManifest = {
  readonly kind: "serfbound.licensed-asset-delivery";
  readonly schemaVersion: 1;
  readonly formatVersion: typeof licensedAssetPackageFormatVersion;
  readonly permissionRecord: "LICENSE-CONSENT.md";
  readonly pmoStory: "SB-31-01";
  readonly packageUrl: string;
  readonly packageChecksum: LicensedAssetPackageChecksum;
};

export type StoredLicensedAssetPackageMetadata = {
  readonly schemaVersion: 1;
  readonly storageKey: typeof currentLicensedAssetPackageKey;
  readonly source: "licensed-asset-package";
  readonly packageUrl: string;
  readonly formatVersion: typeof licensedAssetPackageFormatVersion;
  readonly packageChecksum: LicensedAssetPackageChecksum;
  readonly contentChecksum: LicensedAssetPackageChecksum;
  readonly archiveName: string;
  readonly byteLength: number;
  readonly entryCount: number;
  readonly definedArchiveEntries: number;
  readonly fixupCount: number;
  readonly cachedAtIso: string;
  readonly permissionRecord: "LICENSE-CONSENT.md";
  readonly pmoStory: "SB-31-01";
};

export type StoredLicensedAssetPackageRecord = StoredLicensedAssetPackageMetadata & {
  readonly bytes: ArrayBuffer;
};

export type LicensedAssetPackageStore = {
  loadCurrentIfPresent?(): Promise<StoredLicensedAssetPackageRecord | null>;
  loadCurrent(): Promise<StoredLicensedAssetPackageRecord | null>;
  saveCurrent(record: StoredLicensedAssetPackageRecord): Promise<void>;
  clearCurrent(): Promise<void>;
};

export type LicensedAssetPackageStorageOperationResult =
  | {
      readonly state: "cleared";
    }
  | {
      readonly state: "error";
      readonly message: string;
    };

export type LicensedAssetPackageActivation = {
  readonly record: StoredLicensedAssetPackageRecord;
  readonly licensedPackage: LicensedAssetPackage;
  readonly inspection: LicensedAssetPackageInspection;
};

export type LicensedAssetDeliveryResult =
  | {
      readonly state: "not-configured";
    }
  | ({
      readonly state: "restored" | "downloaded";
      readonly cacheState: "persisted";
    } & LicensedAssetPackageActivation)
  | ({
      readonly state: "downloaded";
      readonly cacheState: "error";
      readonly message: string;
    } & LicensedAssetPackageActivation)
  | {
      readonly state: "error";
      readonly message: string;
    };

export type LicensedAssetFetch = (
  input: string,
  init?: RequestInit,
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}>;

export class InvalidStoredLicensedAssetPackageRecordError extends Error {
  public constructor() {
    super("Saved licensed asset package has an unsupported storage version or corrupt metadata.");
    this.name = "InvalidStoredLicensedAssetPackageRecordError";
  }
}

export class BrowserIndexedDbLicensedAssetPackageStore implements LicensedAssetPackageStore {
  public constructor(
    private readonly databaseName = licensedAssetPackageDatabaseName,
    private readonly storeName = licensedAssetPackageStoreName,
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
  ) {}

  public async loadCurrent(): Promise<StoredLicensedAssetPackageRecord | null> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).get(currentLicensedAssetPackageKey);
      const result = await requestToPromise<unknown>(request);
      await transactionDone(transaction);

      if (result === undefined) {
        return null;
      }

      return assertStoredLicensedAssetPackageRecord(result);
    } finally {
      database.close();
    }
  }

  public async loadCurrentIfPresent(): Promise<StoredLicensedAssetPackageRecord | null> {
    if (!(await this.databaseExists())) {
      return null;
    }

    return this.loadCurrent();
  }

  public async saveCurrent(record: StoredLicensedAssetPackageRecord): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put({
        ...record,
        bytes: cloneToArrayBuffer(record.bytes),
      });
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  public async clearCurrent(): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).delete(currentLicensedAssetPackageKey);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    const factory = this.factory;
    if (factory === undefined) {
      return Promise.reject(new Error("IndexedDB is not available in this browser."));
    }

    return new Promise((resolve, reject) => {
      const request = factory.open(this.databaseName, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(this.storeName)) {
          database.createObjectStore(this.storeName, { keyPath: "storageKey" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Could not open licensed asset package storage."));
      };

      request.onblocked = () => {
        reject(new Error("Licensed asset package storage is blocked by another browser tab."));
      };
    });
  }

  private async databaseExists(): Promise<boolean> {
    const factory = this.factory;
    if (factory === undefined) {
      throw new Error("IndexedDB is not available in this browser.");
    }

    const withDatabaseListing = factory as IDBFactory & {
      databases?: () => Promise<ReadonlyArray<{ readonly name?: string | null }>>;
    };
    if (typeof withDatabaseListing.databases !== "function") {
      return true;
    }

    const databases = await withDatabaseListing.databases();
    return databases.some((database) => database.name === this.databaseName);
  }
}

export function resolveLicensedAssetDeliveryConfig(
  search = globalThis.location?.search ?? "",
): LicensedAssetDeliveryConfig | null {
  const params = new URLSearchParams(search);
  const packageUrl = params.get("licensedAssetPackage");
  if (packageUrl === null || packageUrl.trim() === "") {
    return null;
  }

  const expected = params.get("licensedAssetChecksum");
  return {
    packageUrl,
    ...(expected === null || expected.trim() === ""
      ? {}
      : { expectedPackageChecksum: normalizePackageChecksum(expected) }),
  };
}

export async function resolveLicensedAssetDeliveryManifest(
  manifestUrl = defaultLicensedAssetManifestUrl,
  fetchManifest: LicensedAssetFetch = (input, init) => fetch(input, init),
): Promise<LicensedAssetDeliveryConfig | null> {
  try {
    const response = await fetchManifest(manifestUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const manifest = assertLicensedAssetDeliveryManifest(
      JSON.parse(new TextDecoder().decode(new Uint8Array(await response.arrayBuffer()))),
    );
    return {
      packageUrl: resolveManifestPackageUrl(manifest.packageUrl, manifestUrl),
      expectedPackageChecksum: manifest.packageChecksum,
    };
  } catch {
    return null;
  }
}

export async function loadLicensedAssetPackage(
  config: LicensedAssetDeliveryConfig | null,
  store: LicensedAssetPackageStore,
  fetchPackage: LicensedAssetFetch = (input, init) => fetch(input, init),
): Promise<LicensedAssetDeliveryResult> {
  if (config === null) {
    try {
      const cached = await loadCurrentIfPresent(store);
      if (cached === null) {
        return { state: "not-configured" };
      }

      return {
        state: "restored",
        cacheState: "persisted",
        ...activateRecord(cached),
      };
    } catch {
      try {
        await store.clearCurrent();
      } catch {
        // A failed cleanup should not turn "no configured package" into a fatal app state.
      }

      return { state: "not-configured" };
    }
  }

  let cached: StoredLicensedAssetPackageRecord | null = null;
  try {
    cached = await store.loadCurrent();
  } catch {
    try {
      await store.clearCurrent();
    } catch {
      // A failed cleanup must not block a fresh, verified download.
    }
  }

  if (cached !== null) {
    if (cachedRecordMatchesConfig(cached, config)) {
      try {
        return {
          state: "restored",
          cacheState: "persisted",
          ...activateRecord(cached),
        };
      } catch {
        try {
          await store.clearCurrent();
        } catch {
          // A failed cleanup must not block a fresh, verified download.
        }
      }
    } else {
      try {
        await store.clearCurrent();
      } catch {
        // A failed cleanup must not block a fresh, verified download.
      }
    }
  }

  try {
    const response = await fetchPackage(config.packageUrl, { cache: "no-store" });
    if (!response.ok) {
      return {
        state: "error",
        message: `Licensed asset package download failed with HTTP ${response.status}.`,
      };
    }

    const bytes = await response.arrayBuffer();
    const record = createStoredLicensedAssetPackageRecord({
      packageUrl: config.packageUrl,
      bytes,
    });
    const activation = activateRecord(record);
    if (!packageChecksumMatches(activation.inspection.packageChecksum, config.expectedPackageChecksum)) {
      return {
        state: "error",
        message: "Licensed asset package checksum did not match the configured release checksum.",
      };
    }

    try {
      await store.saveCurrent(record);
      return {
        state: "downloaded",
        cacheState: "persisted",
        ...activation,
      };
    } catch (error) {
      return {
        state: "downloaded",
        cacheState: "error",
        message: errorMessage(error),
        ...activation,
      };
    }
  } catch (error) {
    return {
      state: "error",
      message: errorMessage(error),
    };
  }
}

async function loadCurrentIfPresent(
  store: LicensedAssetPackageStore,
): Promise<StoredLicensedAssetPackageRecord | null> {
  return store.loadCurrentIfPresent === undefined ? store.loadCurrent() : store.loadCurrentIfPresent();
}

export async function clearLicensedAssetPackageRecord(
  store: LicensedAssetPackageStore,
): Promise<LicensedAssetPackageStorageOperationResult> {
  try {
    await store.clearCurrent();
    return { state: "cleared" };
  } catch (error) {
    return {
      state: "error",
      message: errorMessage(error),
    };
  }
}

export function createStoredLicensedAssetPackageRecord(input: {
  readonly packageUrl: string;
  readonly bytes: ArrayBuffer | ArrayBufferView;
  readonly cachedAtIso?: string;
}): StoredLicensedAssetPackageRecord {
  const bytes = cloneToArrayBuffer(input.bytes);
  const licensedPackage = decodeLicensedAssetPackageBytes(bytes);
  const inspection = verifyLicensedAssetPackageBytes(bytes);

  return {
    schemaVersion: 1,
    storageKey: currentLicensedAssetPackageKey,
    source: "licensed-asset-package",
    packageUrl: input.packageUrl,
    formatVersion: licensedAssetPackageFormatVersion,
    packageChecksum: inspection.packageChecksum,
    contentChecksum: licensedPackage.integrity.contentChecksum,
    archiveName: licensedPackage.source.archiveName,
    byteLength: licensedPackage.source.byteLength,
    entryCount: licensedPackage.source.catalog.entryCount,
    definedArchiveEntries: licensedPackage.source.catalog.definedArchiveEntries,
    fixupCount: licensedPackage.source.catalog.fixupCount,
    cachedAtIso: input.cachedAtIso ?? new Date().toISOString(),
    permissionRecord: "LICENSE-CONSENT.md",
    pmoStory: "SB-31-01",
    bytes,
  };
}

export function assertStoredLicensedAssetPackageRecord(
  input: unknown,
): StoredLicensedAssetPackageRecord {
  if (!isStoredLicensedAssetPackageRecord(input)) {
    throw new InvalidStoredLicensedAssetPackageRecordError();
  }

  const record = input as StoredLicensedAssetPackageRecord;
  const inspection = inspectLicensedAssetPackageBytes(record.bytes);
  if (
    !inspection.contentChecksumValid ||
    !checksumsEqual(record.packageChecksum, inspection.packageChecksum)
  ) {
    throw new InvalidStoredLicensedAssetPackageRecordError();
  }

  return {
    ...record,
    bytes: cloneToArrayBuffer(record.bytes),
  };
}

function activateRecord(record: StoredLicensedAssetPackageRecord): LicensedAssetPackageActivation {
  const inspection = verifyLicensedAssetPackageBytes(record.bytes);
  return {
    record,
    licensedPackage: decodeLicensedAssetPackageBytes(record.bytes),
    inspection,
  };
}

function cachedRecordMatchesConfig(
  record: StoredLicensedAssetPackageRecord,
  config: LicensedAssetDeliveryConfig,
): boolean {
  return (
    record.packageUrl === config.packageUrl &&
    record.formatVersion === licensedAssetPackageFormatVersion &&
    packageChecksumMatches(record.packageChecksum, config.expectedPackageChecksum)
  );
}

function packageChecksumMatches(
  actual: LicensedAssetPackageChecksum,
  expected: LicensedAssetPackageChecksum | undefined,
): boolean {
  return expected === undefined || checksumsEqual(actual, expected);
}

function checksumsEqual(
  left: LicensedAssetPackageChecksum,
  right: LicensedAssetPackageChecksum,
): boolean {
  return left.algorithm === right.algorithm && left.value.toLowerCase() === right.value.toLowerCase();
}

function normalizePackageChecksum(value: string): LicensedAssetPackageChecksum {
  return {
    algorithm: "fnv1a32",
    value: value.trim().toLowerCase(),
  };
}

function assertLicensedAssetDeliveryManifest(input: unknown): LicensedAssetDeliveryManifest {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Licensed asset manifest must be an object.");
  }

  const manifest = input as Partial<LicensedAssetDeliveryManifest>;
  if (
    manifest.kind !== "serfbound.licensed-asset-delivery" ||
    manifest.schemaVersion !== 1 ||
    manifest.formatVersion !== licensedAssetPackageFormatVersion ||
    manifest.permissionRecord !== "LICENSE-CONSENT.md" ||
    manifest.pmoStory !== "SB-31-01" ||
    typeof manifest.packageUrl !== "string" ||
    manifest.packageChecksum?.algorithm !== "fnv1a32" ||
    typeof manifest.packageChecksum.value !== "string"
  ) {
    throw new Error("Licensed asset manifest metadata is unsupported or corrupt.");
  }

  return input as LicensedAssetDeliveryManifest;
}

function resolveManifestPackageUrl(packageUrl: string, manifestUrl: string): string {
  try {
    const base = new URL(manifestUrl, globalThis.location?.href ?? "http://localhost/");
    return new URL(packageUrl, base).toString();
  } catch {
    return packageUrl;
  }
}

function isStoredLicensedAssetPackageRecord(
  input: unknown,
): input is StoredLicensedAssetPackageRecord {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Partial<StoredLicensedAssetPackageRecord>;
  return (
    record.schemaVersion === 1 &&
    record.storageKey === currentLicensedAssetPackageKey &&
    record.source === "licensed-asset-package" &&
    typeof record.packageUrl === "string" &&
    record.formatVersion === licensedAssetPackageFormatVersion &&
    record.packageChecksum?.algorithm === "fnv1a32" &&
    typeof record.packageChecksum.value === "string" &&
    record.contentChecksum?.algorithm === "fnv1a32" &&
    typeof record.contentChecksum.value === "string" &&
    typeof record.archiveName === "string" &&
    Number.isInteger(record.byteLength) &&
    Number.isInteger(record.entryCount) &&
    Number.isInteger(record.definedArchiveEntries) &&
    Number.isInteger(record.fixupCount) &&
    typeof record.cachedAtIso === "string" &&
    record.permissionRecord === "LICENSE-CONSENT.md" &&
    record.pmoStory === "SB-31-01" &&
    record.bytes instanceof ArrayBuffer
  );
}

function requestToPromise<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result as T);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Licensed asset package storage request failed."));
    };
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Licensed asset package storage transaction failed."));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("Licensed asset package storage transaction aborted."));
    };
  });
}
