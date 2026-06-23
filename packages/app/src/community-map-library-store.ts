import type { SerfboundCustomMap } from "@serfbound/engine";
import { errorMessage } from "./imported-data-store.js";
import type { MapGalleryEntry } from "./maps-client.js";

// Downloaded community maps live locally, next to saves and imported data.
// The map payload is already self-verifying (`contentHash`); this store only
// records the user's local library membership and the last gallery view.

export const communityMapDatabaseName = "serfbound-custom-maps";
export const communityMapStoreName = "maps";

export type StoredCommunityMapRecord = {
  readonly schemaVersion: 1;
  readonly storageKey: string;
  readonly mapId: string;
  readonly downloadedAtIso: string;
  readonly map: SerfboundCustomMap;
  readonly view: MapGalleryEntry;
};

export type CommunityMapLibraryStore = {
  list(): Promise<readonly StoredCommunityMapRecord[]>;
  save(record: StoredCommunityMapRecord): Promise<void>;
  delete(mapId: string): Promise<void>;
  clear(): Promise<void>;
};

export type CommunityMapLibraryOperationResult =
  | { readonly state: "persisted" | "deleted" | "cleared" }
  | { readonly state: "error"; readonly message: string };

export class InvalidStoredCommunityMapRecordError extends Error {
  public constructor() {
    super("Community map library entry has an unsupported storage version or corrupt metadata.");
    this.name = "InvalidStoredCommunityMapRecordError";
  }
}

export function createStoredCommunityMapRecord(input: {
  readonly mapId: string;
  readonly map: SerfboundCustomMap;
  readonly view: MapGalleryEntry;
  readonly downloadedAtIso?: string;
}): StoredCommunityMapRecord {
  return {
    schemaVersion: 1,
    storageKey: input.mapId,
    mapId: input.mapId,
    downloadedAtIso: input.downloadedAtIso ?? new Date().toISOString(),
    map: cloneJson(input.map),
    view: cloneJson(input.view),
  };
}

export async function saveCommunityMapRecord(
  store: CommunityMapLibraryStore,
  record: StoredCommunityMapRecord,
): Promise<CommunityMapLibraryOperationResult> {
  try {
    await store.save(record);
    return { state: "persisted" };
  } catch (error) {
    return { state: "error", message: errorMessage(error) };
  }
}

export async function deleteCommunityMapRecord(
  store: CommunityMapLibraryStore,
  mapId: string,
): Promise<CommunityMapLibraryOperationResult> {
  try {
    await store.delete(mapId);
    return { state: "deleted" };
  } catch (error) {
    return { state: "error", message: errorMessage(error) };
  }
}

export async function clearCommunityMapLibrary(
  store: CommunityMapLibraryStore,
): Promise<CommunityMapLibraryOperationResult> {
  try {
    await store.clear();
    return { state: "cleared" };
  } catch (error) {
    return { state: "error", message: errorMessage(error) };
  }
}

export class BrowserIndexedDbCommunityMapLibraryStore implements CommunityMapLibraryStore {
  public constructor(
    private readonly databaseName = communityMapDatabaseName,
    private readonly storeName = communityMapStoreName,
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
  ) {}

  public async list(): Promise<readonly StoredCommunityMapRecord[]> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readonly");
      const result = await requestToPromise<unknown[]>(
        transaction.objectStore(this.storeName).getAll(),
      );
      await transactionDone(transaction);
      return result
        .map((record) => assertStoredCommunityMapRecord(record))
        .sort((a, b) => b.downloadedAtIso.localeCompare(a.downloadedAtIso))
        .map((record) => cloneCommunityMapRecord(record));
    } finally {
      database.close();
    }
  }

  public async save(record: StoredCommunityMapRecord): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put(cloneCommunityMapRecord(record));
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  public async delete(mapId: string): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).delete(mapId);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  public async clear(): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).clear();
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
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Could not open community map storage."));
      request.onblocked = () =>
        reject(new Error("Community map storage is blocked by another browser tab."));
    });
  }
}

export function assertStoredCommunityMapRecord(input: unknown): StoredCommunityMapRecord {
  if (isStoredCommunityMapRecord(input)) {
    return input;
  }

  throw new InvalidStoredCommunityMapRecordError();
}

function isStoredCommunityMapRecord(input: unknown): input is StoredCommunityMapRecord {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Partial<StoredCommunityMapRecord>;
  return (
    record.schemaVersion === 1 &&
    typeof record.storageKey === "string" &&
    record.storageKey === record.mapId &&
    typeof record.mapId === "string" &&
    typeof record.downloadedAtIso === "string" &&
    isCustomMap(record.map) &&
    isGalleryEntry(record.view)
  );
}

function isCustomMap(input: unknown): input is SerfboundCustomMap {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const map = input as Partial<SerfboundCustomMap>;
  const meta = map.meta as Partial<SerfboundCustomMap["meta"]> | undefined;
  return (
    map.schemaVersion === 1 &&
    map.kind === "serfbound.custom-map" &&
    Number.isInteger(map.size) &&
    typeof map.landscape === "string" &&
    Number.isInteger(map.playerCount) &&
    Number.isInteger(map.contentHash) &&
    Array.isArray(map.starts) &&
    typeof meta?.title === "string" &&
    typeof meta?.authorKeyId === "string" &&
    typeof meta?.authorName === "string" &&
    typeof meta?.createdAtIso === "string"
  );
}

function isGalleryEntry(input: unknown): input is MapGalleryEntry {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const entry = input as Partial<MapGalleryEntry>;
  return (
    typeof entry.mapId === "string" &&
    typeof entry.title === "string" &&
    typeof entry.authorName === "string" &&
    typeof entry.authorKeyId === "string" &&
    Number.isInteger(entry.size) &&
    Number.isInteger(entry.playerCount) &&
    Number.isInteger(entry.contentHash) &&
    (typeof entry.thumbnail === "string" || entry.thumbnail === null) &&
    typeof entry.rating === "number" &&
    Number.isInteger(entry.ratingCount) &&
    Number.isInteger(entry.downloads) &&
    Number.isInteger(entry.timesPlayed) &&
    typeof entry.publishedAtIso === "string"
  );
}

function cloneCommunityMapRecord(record: StoredCommunityMapRecord): StoredCommunityMapRecord {
  return cloneJson(record);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function requestToPromise<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error("Community map storage request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Community map storage transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Community map storage transaction aborted."));
  });
}
