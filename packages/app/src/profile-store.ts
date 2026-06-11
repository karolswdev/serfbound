import { mapCharacterToGlyphIndex } from "@serfbound/assets";

// Local-first profiles (SB-25-01): who you are before any server
// exists. The profile (display name + local match history) lives in
// IndexedDB next to the saves, travels into multiplayer handshakes,
// and never requires an account.

export const profileDatabaseName = "serfbound-profile";
export const profileStoreName = "profiles";
export const currentProfileKey = "current-profile";
export const profileNameMaxLength = 12;
export const defaultProfileName = "PLAYER";
export const matchHistoryCap = 50;

export type SerfboundMatchHistoryEntry = {
  readonly mode: "realtime-loopback" | "async-loopback" | "hotseat" | "online";
  readonly opponentName: string;
  readonly localPlayer: number;
  readonly result: "won" | "lost" | "completed" | "abandoned";
  readonly endedAtIso: string;
};

export type StoredProfileAccount = {
  readonly accountId: string;
  readonly serviceUrl: string;
  readonly publicKeyJwk: JsonWebKey;
  // Exportable on purpose: cross-device transfer is the player moving
  // their own key, the same philosophy as their game data.
  readonly privateKeyJwk: JsonWebKey;
};

export type StoredSerfboundProfile = {
  readonly schemaVersion: 1;
  readonly storageKey: typeof currentProfileKey;
  readonly name: string;
  readonly history: readonly SerfboundMatchHistoryEntry[];
  // Optional hosted identity (SB-25-02); accountless play loses nothing.
  readonly account?: StoredProfileAccount;
  // Local-first self-representation (SB-30-05): ids into the identity
  // library. Never sent anywhere — the wire format has no field for
  // them, by the Phase 30 schema constraint.
  readonly avatarId?: string;
  readonly guildId?: string;
  // The campaign ledger (SB-30-02): mission ids the player has won on
  // this device. A game record like the saves — never uploaded.
  readonly missionsCompleted?: readonly string[];
  // Unlocked deeds (SB-30-03): achievement ids with their moment.
  readonly achievements?: readonly { readonly id: string; readonly unlockedAtIso: string }[];
};

export type ProfileStore = {
  load(): Promise<StoredSerfboundProfile | null>;
  save(profile: StoredSerfboundProfile): Promise<void>;
  clear(): Promise<void>;
};

// Names render in the game font: A-Z, digits, and the few symbol
// glyphs. Anything else drops; empty falls back to PLAYER.
export function sanitizeProfileName(input: string): string {
  let name = "";
  for (const character of input.toUpperCase()) {
    if (name.length >= profileNameMaxLength) {
      break;
    }

    if (character === " ") {
      continue;
    }

    const glyph = mapCharacterToGlyphIndex(character);
    if (glyph !== 42 || character === "?") {
      name += character;
    }
  }

  return name.length > 0 ? name : defaultProfileName;
}

export function createProfile(name?: string): StoredSerfboundProfile {
  return {
    schemaVersion: 1,
    storageKey: currentProfileKey,
    name: sanitizeProfileName(name ?? defaultProfileName),
    history: [],
  };
}

export function withProfileName(
  profile: StoredSerfboundProfile,
  name: string,
): StoredSerfboundProfile {
  return { ...profile, name: sanitizeProfileName(name) };
}

export function withAccount(
  profile: StoredSerfboundProfile,
  account: StoredProfileAccount,
): StoredSerfboundProfile {
  return { ...profile, account };
}

export function withoutAccount(profile: StoredSerfboundProfile): StoredSerfboundProfile {
  const { account: _dropped, ...rest } = profile;
  return rest;
}

export function withAvatar(
  profile: StoredSerfboundProfile,
  avatarId: string,
): StoredSerfboundProfile {
  return { ...profile, avatarId };
}

export function withGuild(
  profile: StoredSerfboundProfile,
  guildId: string,
): StoredSerfboundProfile {
  return { ...profile, guildId };
}

export function withMissionCompleted(
  profile: StoredSerfboundProfile,
  missionId: string,
): StoredSerfboundProfile {
  const existing = profile.missionsCompleted ?? [];
  if (existing.includes(missionId)) {
    return profile;
  }

  return { ...profile, missionsCompleted: [...existing, missionId] };
}

export function withAchievement(
  profile: StoredSerfboundProfile,
  id: string,
  unlockedAtIso: string,
): StoredSerfboundProfile {
  const existing = profile.achievements ?? [];
  if (existing.some((entry) => entry.id === id)) {
    return profile;
  }

  return { ...profile, achievements: [...existing, { id, unlockedAtIso }] };
}

// Newest first, capped — a local record, not a ladder.
export function withMatchHistoryEntry(
  profile: StoredSerfboundProfile,
  entry: SerfboundMatchHistoryEntry,
): StoredSerfboundProfile {
  return {
    ...profile,
    history: [entry, ...profile.history].slice(0, matchHistoryCap),
  };
}

export function isStoredSerfboundProfile(input: unknown): input is StoredSerfboundProfile {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Record<string, unknown>;
  return (
    record["schemaVersion"] === 1 &&
    record["storageKey"] === currentProfileKey &&
    typeof record["name"] === "string" &&
    Array.isArray(record["history"])
  );
}

export class MemoryProfileStore implements ProfileStore {
  #profile: StoredSerfboundProfile | null = null;

  load(): Promise<StoredSerfboundProfile | null> {
    return Promise.resolve(this.#profile);
  }

  save(profile: StoredSerfboundProfile): Promise<void> {
    this.#profile = profile;
    return Promise.resolve();
  }

  clear(): Promise<void> {
    this.#profile = null;
    return Promise.resolve();
  }
}

export class BrowserIndexedDbProfileStore implements ProfileStore {
  async load(): Promise<StoredSerfboundProfile | null> {
    const database = await this.#open();
    try {
      const record = await requestAsPromise<unknown>(
        database
          .transaction(profileStoreName, "readonly")
          .objectStore(profileStoreName)
          .get(currentProfileKey),
      );
      return isStoredSerfboundProfile(record) ? record : null;
    } finally {
      database.close();
    }
  }

  async save(profile: StoredSerfboundProfile): Promise<void> {
    const database = await this.#open();
    try {
      await requestAsPromise(
        database
          .transaction(profileStoreName, "readwrite")
          .objectStore(profileStoreName)
          .put(profile, currentProfileKey),
      );
    } finally {
      database.close();
    }
  }

  async clear(): Promise<void> {
    const database = await this.#open();
    try {
      await requestAsPromise(
        database
          .transaction(profileStoreName, "readwrite")
          .objectStore(profileStoreName)
          .delete(currentProfileKey),
      );
    } finally {
      database.close();
    }
  }

  #open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(profileDatabaseName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(profileStoreName)) {
          request.result.createObjectStore(profileStoreName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
    });
  }
}

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}
