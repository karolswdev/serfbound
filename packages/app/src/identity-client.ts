// The identity client (SB-25-02): anonymous device-key accounts per
// the identity decision record. The keypair lives with the player
// (exportable, like their game data); the service only ever sees the
// public key and signed requests.

export type IdentityKeys = {
  readonly publicKeyJwk: JsonWebKey;
  readonly privateKeyJwk: JsonWebKey;
};

export type LinkedIdentity = {
  readonly accountId: string;
  readonly serviceUrl: string;
  readonly keys: IdentityKeys;
};

export class IdentityServiceError extends Error {
  readonly reason: string;

  constructor(reason: string, message: string) {
    super(message);
    this.name = "IdentityServiceError";
    this.reason = reason;
  }
}

const algorithm = { name: "ECDSA", namedCurve: "P-256" } as const;
const signing = { name: "ECDSA", hash: "SHA-256" } as const;

export async function generateIdentityKeys(): Promise<IdentityKeys> {
  const pair = await crypto.subtle.generateKey(algorithm, true, ["sign", "verify"]);
  return {
    publicKeyJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
    privateKeyJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
  };
}

export async function signIdentityPayload(keys: IdentityKeys, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("jwk", keys.privateKeyJwk, algorithm, false, ["sign"]);
  const signature = await crypto.subtle.sign(signing, key, new TextEncoder().encode(payload));
  return bytesToBase64(new Uint8Array(signature));
}

// The account id is the public key's fingerprint — computable locally,
// verified by the service.
export async function identityAccountId(keys: IdentityKeys): Promise<string> {
  const canonical = JSON.stringify({
    crv: keys.publicKeyJwk.crv,
    kty: keys.publicKeyJwk.kty,
    x: keys.publicKeyJwk.x,
    y: keys.publicKeyJwk.y,
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function registerIdentity(
  serviceUrl: string,
  keys: IdentityKeys,
  name: string,
): Promise<LinkedIdentity> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(keys, `${name}|${signedAtIso}`);
  const result = await requestJson(`${serviceUrl}/accounts`, "POST", {
    publicKeyJwk: keys.publicKeyJwk,
    name,
    signedAtIso,
    signature,
  });
  return {
    accountId: (result as { accountId: string }).accountId,
    serviceUrl,
    keys,
  };
}

export async function renameIdentity(identity: LinkedIdentity, name: string): Promise<string> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(identity.keys, `${name}|${signedAtIso}`);
  const result = await requestJson(
    `${identity.serviceUrl}/accounts/${identity.accountId}`,
    "PUT",
    { name, signedAtIso, signature },
  );
  return (result as { name: string }).name;
}

export async function deleteIdentity(identity: LinkedIdentity): Promise<void> {
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(identity.keys, `delete|${signedAtIso}`);
  await requestJson(`${identity.serviceUrl}/accounts/${identity.accountId}`, "DELETE", {
    signedAtIso,
    signature,
  });
}

export async function fetchIdentity(
  serviceUrl: string,
  accountId: string,
): Promise<{ accountId: string; name: string } | null> {
  const response = await fetch(`${serviceUrl}/accounts/${accountId}`);
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new IdentityServiceError("service-error", `Identity service returned ${response.status}.`);
  }

  return (await response.json()) as { accountId: string; name: string };
}

async function requestJson(url: string, method: string, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new IdentityServiceError("unreachable", "The identity service is unreachable.");
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new IdentityServiceError(
      typeof payload["error"] === "string" ? (payload["error"] as string) : "service-error",
      typeof payload["message"] === "string"
        ? (payload["message"] as string)
        : `Identity service returned ${response.status}.`,
    );
  }

  return payload;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
