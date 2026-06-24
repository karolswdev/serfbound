export type IdentityV2Credential =
  | {
      readonly kind: "password";
      readonly credentialId: string;
      readonly email: string;
      readonly emailVerifiedAtIso: string | null;
      readonly linkedAtIso: string;
      readonly lastUsedAtIso: string;
    }
  | {
      readonly kind: "oidc";
      readonly credentialId: string;
      readonly provider: "apple" | "google" | "meta";
      readonly email: string | null;
      readonly emailVerifiedAtIso: string | null;
      readonly linkedAtIso: string;
      readonly lastUsedAtIso: string;
    }
  | {
      readonly kind: "passkey";
      readonly credentialId: string;
      readonly transports: readonly string[];
      readonly linkedAtIso: string;
      readonly lastUsedAtIso: string;
    };

export type IdentityV2Account = {
  readonly accountId: string;
  readonly displayName: string;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
  readonly credentials: readonly IdentityV2Credential[];
  readonly recovery?: {
    readonly configuredAtIso: string;
    readonly recoveryAlgorithm: string;
  };
};

export class IdentityV2ServiceError extends Error {
  readonly reason: string;

  constructor(reason: string, message: string) {
    super(message);
    this.name = "IdentityV2ServiceError";
    this.reason = reason;
  }
}

export async function createPasswordIdentityV2Account(
  serviceUrl: string,
  options: {
    readonly email: string;
    readonly password: string;
    readonly displayName: string;
  },
): Promise<IdentityV2Account> {
  return requestIdentityV2Json(`${serviceUrl}/v2/accounts/password`, {
    email: options.email,
    password: options.password,
    displayName: options.displayName,
  });
}

export async function signInPasswordIdentityV2(
  serviceUrl: string,
  options: {
    readonly email: string;
    readonly password: string;
  },
): Promise<IdentityV2Account> {
  return requestIdentityV2Json(`${serviceUrl}/v2/sessions/password`, {
    email: options.email,
    password: options.password,
  });
}

async function requestIdentityV2Json(
  url: string,
  body: Record<string, string>,
): Promise<IdentityV2Account> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new IdentityV2ServiceError("unreachable", "The identity service is unreachable.");
  }

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new IdentityV2ServiceError(
      typeof payload["error"] === "string" ? payload["error"] : "service-error",
      typeof payload["message"] === "string"
        ? payload["message"]
        : `Identity service returned ${response.status}.`,
    );
  }

  return payload as IdentityV2Account;
}
