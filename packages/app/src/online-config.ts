// Online endpoint resolution (SB-29-04). The shell talks to the
// deployed backbone at api.serfbound.com by default; tests and
// self-hosters override it. Accountless play never reads this — the
// config only matters once a player opens the online surface.

export type OnlineConfig = {
  readonly identityUrl: string;
  readonly mailboxUrl: string;
};

export const defaultOnlineApiBase = "https://api.serfbound.com";
export const onlineApiStorageKey = "serfbound.api-url";

type StorageLike = { getItem(key: string): string | null };

// Order: explicit per-service URL params (tests run the two services on
// separate local ports), then a `?api=` base, then a persisted base,
// then the deployed default. Bases get the gateway's path split
// appended (`/identity`, `/mailbox`).
export function resolveOnlineConfig(search: string, storage?: StorageLike): OnlineConfig {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = new URLSearchParams();
  }

  let storedBase: string | null = null;
  try {
    storedBase = storage?.getItem(onlineApiStorageKey) ?? null;
  } catch {
    storedBase = null;
  }

  const base = trimBase(params.get("api") ?? storedBase ?? defaultOnlineApiBase);
  return {
    identityUrl: trimBase(params.get("identityApi") ?? `${base}/identity`),
    mailboxUrl: trimBase(params.get("mailboxApi") ?? `${base}/mailbox`),
  };
}

function trimBase(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
