export const identityV2PasskeyDatabaseName = "serfbound-identity-v2";
export const identityV2PasskeyStoreName = "passkeys";
export const currentIdentityV2PasskeyKey = "current-passkey";

export type StoredIdentityV2PasskeyCredential = {
  readonly schemaVersion: 1;
  readonly storageKey: typeof currentIdentityV2PasskeyKey;
  readonly serviceUrl: string;
  readonly credentialId: string;
  readonly userHandle: string;
  readonly publicKeyJwk: JsonWebKey;
  readonly privateKey: CryptoKey;
  readonly signCount: number;
  readonly transports: readonly string[];
  readonly displayName: string;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
};

export type IdentityV2PasskeyStore = {
  load(serviceUrl: string): Promise<StoredIdentityV2PasskeyCredential | null>;
  save(credential: StoredIdentityV2PasskeyCredential): Promise<void>;
  clear(): Promise<void>;
};

const algorithm = { name: "ECDSA", namedCurve: "P-256" } as const;
const signing = { name: "ECDSA", hash: "SHA-256" } as const;

export async function createIdentityV2PasskeyCredential(
  serviceUrl: string,
  displayName: string,
): Promise<StoredIdentityV2PasskeyCredential> {
  const pair = await crypto.subtle.generateKey(algorithm, false, ["sign", "verify"]);
  const nowIso = new Date().toISOString();
  return {
    schemaVersion: 1,
    storageKey: currentIdentityV2PasskeyKey,
    serviceUrl,
    credentialId: `passkey_${randomBase64Url(18)}`,
    userHandle: `user_${randomBase64Url(18)}`,
    publicKeyJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
    privateKey: pair.privateKey,
    signCount: 1,
    transports: ["internal"],
    displayName,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

export async function signIdentityV2PasskeyPayload(
  credential: StoredIdentityV2PasskeyCredential,
  payload: string,
): Promise<string> {
  const signature = await crypto.subtle.sign(
    signing,
    credential.privateKey,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64(new Uint8Array(signature));
}

export function withIdentityV2PasskeySignCount(
  credential: StoredIdentityV2PasskeyCredential,
  signCount: number,
  displayName: string,
): StoredIdentityV2PasskeyCredential {
  return {
    ...credential,
    signCount,
    displayName,
    updatedAtIso: new Date().toISOString(),
  };
}

export class BrowserIndexedDbIdentityV2PasskeyStore implements IdentityV2PasskeyStore {
  public constructor(
    private readonly databaseName = identityV2PasskeyDatabaseName,
    private readonly storeName = identityV2PasskeyStoreName,
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
  ) {}

  public async load(serviceUrl: string): Promise<StoredIdentityV2PasskeyCredential | null> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readonly");
      const record = await requestToPromise<unknown>(
        transaction.objectStore(this.storeName).get(currentIdentityV2PasskeyKey),
      );
      await transactionDone(transaction);
      if (!isStoredIdentityV2PasskeyCredential(record) || record.serviceUrl !== serviceUrl) {
        return null;
      }

      return record;
    } finally {
      database.close();
    }
  }

  public async save(credential: StoredIdentityV2PasskeyCredential): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put(credential);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  public async clear(): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).delete(currentIdentityV2PasskeyKey);
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
        reject(request.error ?? new Error("Could not open passkey storage."));
      request.onblocked = () =>
        reject(new Error("Passkey storage is blocked by another browser tab."));
    });
  }
}

function isStoredIdentityV2PasskeyCredential(
  input: unknown,
): input is StoredIdentityV2PasskeyCredential {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Partial<StoredIdentityV2PasskeyCredential>;
  return (
    record.schemaVersion === 1 &&
    record.storageKey === currentIdentityV2PasskeyKey &&
    typeof record.serviceUrl === "string" &&
    typeof record.credentialId === "string" &&
    typeof record.userHandle === "string" &&
    typeof record.publicKeyJwk === "object" &&
    record.publicKeyJwk !== null &&
    isPrivateSigningKey(record.privateKey) &&
    typeof record.signCount === "number" &&
    Number.isInteger(record.signCount) &&
    record.signCount >= 0 &&
    Array.isArray(record.transports) &&
    record.transports.every((transport) => typeof transport === "string") &&
    typeof record.displayName === "string" &&
    typeof record.createdAtIso === "string" &&
    typeof record.updatedAtIso === "string"
  );
}

function isPrivateSigningKey(input: unknown): input is CryptoKey {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const key = input as Partial<CryptoKey>;
  return (
    key.type === "private" &&
    key.extractable === false &&
    Array.isArray(key.usages) &&
    key.usages.includes("sign")
  );
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}
