import type { SerfboundCustomMap } from "@serfbound/engine";
import { IdentityServiceError, signIdentityPayload, type IdentityKeys } from "./identity-client.js";
import { identityV2AuthorizationHeaders, type IdentityV2Session } from "./identity-v2-client.js";

// The community-maps client (SB-43-03): publish/browse/fetch/rate/
// report/delete authored maps and report plays, against the maps
// service. Every write is signed with the device key; the service
// verifies and stores, never referees.

export type MapGalleryEntry = {
  readonly mapId: string;
  readonly title: string;
  readonly authorName: string;
  readonly authorKeyId: string;
  readonly size: number;
  readonly playerCount: number;
  readonly contentHash: number;
  readonly thumbnail: string | null;
  readonly rating: number;
  readonly ratingCount: number;
  readonly downloads: number;
  readonly timesPlayed: number;
  readonly publishedAtIso: string;
};

export type MapGalleryFilter = {
  readonly size?: number;
  readonly players?: number;
};

export async function publishMap(
  serviceUrl: string,
  keys: IdentityKeys,
  map: SerfboundCustomMap,
): Promise<string> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `publish|${map.contentHash}|${signedAtIso}`);
  const result = (await requestJson(`${serviceUrl}/maps`, "POST", {
    map,
    publicKeyJwk: keys.publicKeyJwk,
    signedAtIso,
    signature,
  })) as { mapId: string };
  return result.mapId;
}

export async function publishMapWithIdentityV2(
  serviceUrl: string,
  session: IdentityV2Session,
  map: SerfboundCustomMap,
): Promise<string> {
  const result = (await requestJson(
    `${serviceUrl}/maps`,
    "POST",
    { map },
    identityV2AuthorizationHeaders(session),
  )) as { mapId: string };
  return result.mapId;
}

export async function listMaps(
  serviceUrl: string,
  filter: MapGalleryFilter = {},
): Promise<readonly MapGalleryEntry[]> {
  const params = new URLSearchParams();
  if (filter.size !== undefined) params.set("size", String(filter.size));
  if (filter.players !== undefined) params.set("players", String(filter.players));
  const query = params.toString();
  const result = (await requestJson(
    `${serviceUrl}/maps${query ? `?${query}` : ""}`,
    "GET",
  )) as { maps: readonly MapGalleryEntry[] };
  return result.maps;
}

export async function fetchMap(
  serviceUrl: string,
  mapId: string,
): Promise<{ map: SerfboundCustomMap; view: MapGalleryEntry }> {
  return (await requestJson(`${serviceUrl}/maps/${mapId}`, "GET")) as {
    map: SerfboundCustomMap;
    view: MapGalleryEntry;
  };
}

export async function rateMap(
  serviceUrl: string,
  keys: IdentityKeys,
  mapId: string,
  stars: number,
): Promise<{ rating: number; ratingCount: number }> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `rate|${mapId}|${stars}|${signedAtIso}`);
  return (await requestJson(`${serviceUrl}/maps/${mapId}/rate`, "POST", {
    publicKeyJwk: keys.publicKeyJwk,
    stars,
    signedAtIso,
    signature,
  })) as { rating: number; ratingCount: number };
}

export async function rateMapWithIdentityV2(
  serviceUrl: string,
  session: IdentityV2Session,
  mapId: string,
  stars: number,
): Promise<{ rating: number; ratingCount: number }> {
  return (await requestJson(
    `${serviceUrl}/maps/${mapId}/rate`,
    "POST",
    { stars },
    identityV2AuthorizationHeaders(session),
  )) as { rating: number; ratingCount: number };
}

export async function reportMap(
  serviceUrl: string,
  keys: IdentityKeys,
  mapId: string,
): Promise<{ quarantined: boolean; reports: number }> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `report|${mapId}|${signedAtIso}`);
  return (await requestJson(`${serviceUrl}/maps/${mapId}/report`, "POST", {
    publicKeyJwk: keys.publicKeyJwk,
    signedAtIso,
    signature,
  })) as { quarantined: boolean; reports: number };
}

export async function reportMapWithIdentityV2(
  serviceUrl: string,
  session: IdentityV2Session,
  mapId: string,
): Promise<{ quarantined: boolean; reports: number }> {
  return (await requestJson(
    `${serviceUrl}/maps/${mapId}/report`,
    "POST",
    {},
    identityV2AuthorizationHeaders(session),
  )) as { quarantined: boolean; reports: number };
}

// A signed-in player opting to report a match they played (SB-43-06).
export async function reportMapPlayed(
  serviceUrl: string,
  keys: IdentityKeys,
  mapId: string,
): Promise<{ timesPlayed: number }> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `played|${mapId}|${signedAtIso}`);
  return (await requestJson(`${serviceUrl}/maps/${mapId}/played`, "POST", {
    publicKeyJwk: keys.publicKeyJwk,
    signedAtIso,
    signature,
  })) as { timesPlayed: number };
}

export async function reportMapPlayedWithIdentityV2(
  serviceUrl: string,
  session: IdentityV2Session,
  mapId: string,
): Promise<{ timesPlayed: number }> {
  return (await requestJson(
    `${serviceUrl}/maps/${mapId}/played`,
    "POST",
    {},
    identityV2AuthorizationHeaders(session),
  )) as { timesPlayed: number };
}

export async function deleteMap(
  serviceUrl: string,
  keys: IdentityKeys,
  mapId: string,
): Promise<void> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `delete|${mapId}|${signedAtIso}`);
  await requestJson(`${serviceUrl}/maps/${mapId}`, "DELETE", {
    publicKeyJwk: keys.publicKeyJwk,
    signedAtIso,
    signature,
  });
}

export async function deleteMapWithIdentityV2(
  serviceUrl: string,
  session: IdentityV2Session,
  mapId: string,
): Promise<void> {
  await requestJson(
    `${serviceUrl}/maps/${mapId}`,
    "DELETE",
    {},
    identityV2AuthorizationHeaders(session),
  );
}

async function requestJson(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }),
      ...(body === undefined && Object.keys(headers).length > 0 ? { headers } : {}),
    });
  } catch {
    throw new IdentityServiceError("unreachable", "The maps service is unreachable.");
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new IdentityServiceError(
      typeof payload["error"] === "string" ? (payload["error"] as string) : "service-error",
      typeof payload["message"] === "string"
        ? (payload["message"] as string)
        : `The maps service returned ${response.status}.`,
    );
  }

  return payload;
}
