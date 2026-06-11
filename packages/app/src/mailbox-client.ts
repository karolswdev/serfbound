import type { CorrespondenceWindowMove } from "@serfbound/engine";
import { IdentityServiceError, signIdentityPayload, type IdentityKeys } from "./identity-client.js";

// The turn-mailbox client (SB-25-03): challenges with match terms,
// posting/fetching window moves, and "your turn" listings. The mailbox
// stores and forwards; every received move still re-verifies locally
// through the CorrespondenceMatch — the service is never the referee.

export type MatchTerms = {
  readonly seedString: string;
  readonly mapSize: number;
  readonly playerCount: number;
  readonly initialSupplies: number;
  readonly windowTicks: number;
  readonly pickupSeconds: number;
};

export type MailboxMatchView = {
  readonly matchId: string;
  readonly terms: MatchTerms;
  readonly players: readonly { readonly name: string; readonly keyId: string }[];
  readonly moves: readonly CorrespondenceWindowMove[];
  readonly nextPlayer: number;
  readonly nextDeadlineIso: string;
  readonly state: "active" | "forfeited" | "ended";
  readonly forfeitedPlayer?: number;
  readonly yourSeat?: number;
};

export async function createChallenge(
  serviceUrl: string,
  keys: IdentityKeys,
  name: string,
  terms: MatchTerms,
): Promise<string> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(
    keys,
    `challenge|${JSON.stringify(terms)}|${signedAtIso}`,
  );
  const result = (await requestJson(`${serviceUrl}/challenges`, "POST", {
    publicKeyJwk: keys.publicKeyJwk,
    name,
    terms,
    signedAtIso,
    signature,
  })) as { challengeId: string };
  return result.challengeId;
}

export async function listChallenges(serviceUrl: string): Promise<
  readonly {
    readonly challengeId: string;
    readonly terms: MatchTerms;
    readonly challengerName: string;
  }[]
> {
  const result = (await requestJson(`${serviceUrl}/challenges`, "GET")) as {
    challenges: { challengeId: string; terms: MatchTerms; challengerName: string }[];
  };
  return result.challenges;
}

export async function acceptChallenge(
  serviceUrl: string,
  keys: IdentityKeys,
  name: string,
  challengeId: string,
): Promise<MailboxMatchView> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `accept|${challengeId}|${signedAtIso}`);
  const result = (await requestJson(`${serviceUrl}/challenges/${challengeId}/accept`, "POST", {
    publicKeyJwk: keys.publicKeyJwk,
    name,
    signedAtIso,
    signature,
  })) as { match: MailboxMatchView };
  return result.match;
}

export async function fetchMatch(serviceUrl: string, matchId: string): Promise<MailboxMatchView> {
  const result = (await requestJson(`${serviceUrl}/matches/${matchId}`, "GET")) as {
    match: MailboxMatchView;
  };
  return result.match;
}

export async function postMove(
  serviceUrl: string,
  keys: IdentityKeys,
  matchId: string,
  move: CorrespondenceWindowMove,
): Promise<MailboxMatchView> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(
    keys,
    `move|${matchId}|${move.window}|${move.endChecksum}|${signedAtIso}`,
  );
  const result = (await requestJson(`${serviceUrl}/matches/${matchId}/moves`, "POST", {
    move,
    signedAtIso,
    signature,
  })) as { match: MailboxMatchView };
  return result.match;
}

export async function listMatchesForKey(
  serviceUrl: string,
  keyId: string,
): Promise<readonly MailboxMatchView[]> {
  const result = (await requestJson(`${serviceUrl}/players/${keyId}/matches`, "GET")) as {
    matches: MailboxMatchView[];
  };
  return result.matches;
}

async function requestJson(url: string, method: string, body?: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    throw new IdentityServiceError("unreachable", "The mailbox service is unreachable.");
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new IdentityServiceError(
      typeof payload["error"] === "string" ? (payload["error"] as string) : "service-error",
      typeof payload["message"] === "string"
        ? (payload["message"] as string)
        : `The mailbox service returned ${response.status}.`,
    );
  }

  return payload;
}
