// The Serfbound identity service (SB-25-02): anonymous device-key
// accounts, exactly the schema in the identity decision record and
// nothing more. Zero dependencies, JSON-file storage — small enough to
// self-host anywhere. The service verifies signatures; it never holds
// a secret and never referees a game.

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { webcrypto } from "node:crypto";

const port = Number(process.env.SERFBOUND_IDENTITY_PORT ?? "4310");
const storePath = process.env.SERFBOUND_IDENTITY_STORE ?? ".tmp/identity-accounts.json";

const allowedAccountFields = new Set(["publicKeyJwk", "name", "signedAtIso", "signature"]);
const nameMaxLength = 12;

function loadAccounts() {
  if (!existsSync(storePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(storePath, "utf8"));
  } catch {
    return {};
  }
}

function saveAccounts(accounts) {
  writeFileSync(storePath, JSON.stringify(accounts, null, 2));
}

async function fingerprint(publicKeyJwk) {
  const canonical = JSON.stringify({
    crv: publicKeyJwk.crv,
    kty: publicKeyJwk.kty,
    x: publicKeyJwk.x,
    y: publicKeyJwk.y,
  });
  const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Buffer.from(digest).toString("hex");
}

async function verifySignature(publicKeyJwk, payloadText, signatureBase64) {
  try {
    const key = await webcrypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return await webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      Buffer.from(signatureBase64, "base64"),
      new TextEncoder().encode(payloadText),
    );
  } catch {
    return false;
  }
}

function sanitizeName(input) {
  const upper = String(input ?? "").toUpperCase();
  let name = "";
  for (const character of upper) {
    if (name.length >= nameMaxLength) {
      break;
    }

    if (/[A-Z0-9ÄÖÜ.\-:?%]/.test(character)) {
      name += character;
    }
  }

  return name.length > 0 ? name : "PLAYER";
}

function send(response, status, body) {
  const text = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  response.end(text);
}

function readBody(request) {
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

export const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    if (request.method === "OPTIONS") {
      send(response, 204, {});
      return;
    }

    // POST /accounts — register {publicKeyJwk, name, signedAtIso,
    // signature(over name|signedAtIso)}.
    if (request.method === "POST" && url.pathname === "/accounts") {
      const body = JSON.parse((await readBody(request)) || "{}");
      const extraFields = Object.keys(body).filter((key) => !allowedAccountFields.has(key));
      if (extraFields.length > 0) {
        send(response, 400, {
          error: "unexpected-fields",
          message: `Data minimization: rejected fields ${extraFields.join(", ")}.`,
        });
        return;
      }

      const { publicKeyJwk, name, signedAtIso, signature } = body;
      if (
        typeof publicKeyJwk !== "object" ||
        publicKeyJwk === null ||
        typeof name !== "string" ||
        typeof signedAtIso !== "string" ||
        typeof signature !== "string"
      ) {
        send(response, 400, { error: "malformed", message: "Missing registration fields." });
        return;
      }

      const verified = await verifySignature(publicKeyJwk, `${name}|${signedAtIso}`, signature);
      if (!verified) {
        send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
        return;
      }

      const accountId = await fingerprint(publicKeyJwk);
      const accounts = loadAccounts();
      accounts[accountId] = {
        accountId,
        publicKeyJwk,
        name: sanitizeName(name),
        createdAtIso: accounts[accountId]?.createdAtIso ?? new Date().toISOString(),
      };
      saveAccounts(accounts);
      send(response, 200, { accountId, name: accounts[accountId].name });
      return;
    }

    const accountMatch = url.pathname.match(/^\/accounts\/([0-9a-f]{64})$/);
    if (accountMatch !== null) {
      const accountId = accountMatch[1];
      const accounts = loadAccounts();
      const account = accounts[accountId];

      if (request.method === "GET") {
        if (account === undefined) {
          send(response, 404, { error: "not-found" });
          return;
        }

        send(response, 200, { accountId, name: account.name, createdAtIso: account.createdAtIso });
        return;
      }

      if (account === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      // PUT — rename {name, signedAtIso, signature(over name|signedAtIso)}.
      if (request.method === "PUT") {
        const body = JSON.parse((await readBody(request)) || "{}");
        const verified = await verifySignature(
          account.publicKeyJwk,
          `${body.name}|${body.signedAtIso}`,
          body.signature,
        );
        if (!verified) {
          send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
          return;
        }

        account.name = sanitizeName(body.name);
        saveAccounts(accounts);
        send(response, 200, { accountId, name: account.name });
        return;
      }

      // DELETE — {signedAtIso, signature(over delete|signedAtIso)}.
      if (request.method === "DELETE") {
        const body = JSON.parse((await readBody(request)) || "{}");
        const verified = await verifySignature(
          account.publicKeyJwk,
          `delete|${body.signedAtIso}`,
          body.signature,
        );
        if (!verified) {
          send(response, 401, { error: "bad-signature", message: "The signature does not verify." });
          return;
        }

        delete accounts[accountId];
        saveAccounts(accounts);
        send(response, 200, { deleted: true });
        return;
      }
    }

    send(response, 404, { error: "unknown-route" });
  } catch (error) {
    send(response, 400, { error: "bad-request", message: String(error?.message ?? error) });
  }
});

if (process.env.SERFBOUND_IDENTITY_AUTOSTART !== "0") {
  server.listen(port, () => {
    console.log(`serfbound-identity listening on :${port} (store: ${storePath})`);
  });
}
