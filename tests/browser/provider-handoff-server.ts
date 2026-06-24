import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

type Provider = "apple" | "google" | "meta";

export type ProviderHandoffRequest = {
  readonly path: string;
  readonly body: Record<string, unknown>;
};

export async function startProviderHandoffServer(options: {
  readonly port: number;
  readonly identityUrl: string;
  readonly oidcAssertionSecret: string;
  readonly subjectPrefix: string;
  readonly requests?: ProviderHandoffRequest[];
}): Promise<Server> {
  const server = createServer(async (request, response) => {
    if (request.method === "OPTIONS") {
      send(response, 204, {});
      return;
    }

    if (request.method !== "POST" || request.url !== "/provider-handoff") {
      send(response, 404, { error: "not-found" });
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse((await readBody(request)) || "{}") as Record<string, unknown>;
    } catch {
      send(response, 400, { error: "malformed", message: "Provider handoff payload is malformed." });
      return;
    }
    options.requests?.push({ path: request.url, body });

    if (
      Object.hasOwn(body, "idToken") ||
      Object.hasOwn(body, "accessToken") ||
      Object.hasOwn(body, "refreshToken") ||
      Object.hasOwn(body, "authorizationCode") ||
      Object.hasOwn(body, "providerSubject")
    ) {
      send(response, 400, {
        error: "unexpected-fields",
        message: "Provider handoff accepts only the selected provider and display name.",
      });
      return;
    }

    const provider = body["provider"];
    const displayName = String(body["displayName"] ?? "").trim();
    if (!isProvider(provider) || displayName === "") {
      send(response, 400, { error: "malformed", message: "A provider and display name are required." });
      return;
    }

    const subject = `${options.subjectPrefix}-${provider}-${displayName.toLowerCase()}`;
    const identityResponse = await fetch(`${options.identityUrl}/v2/accounts/oidc`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-serfbound-oidc-assertion": options.oidcAssertionSecret,
      },
      body: JSON.stringify({
        provider,
        providerSubject: subject,
        email: `${subject}@example.test`,
        emailVerified: true,
        displayName,
      }),
    });
    const payload = (await identityResponse.json().catch(() => ({}))) as Record<string, unknown>;
    send(response, identityResponse.status, payload);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(options.port, "127.0.0.1", resolve);
    server.once("error", reject);
  });
  return server;
}

function isProvider(input: unknown): input is Provider {
  return input === "apple" || input === "google" || input === "meta";
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 16_384) {
        reject(new Error("payload too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function send(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  response.end(status === 204 ? "" : JSON.stringify(body));
}
