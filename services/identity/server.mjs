// The Serfbound identity service. The original Phase 25 `/accounts`
// endpoint remains as the legacy device-key bridge. Phase 33 adds
// `/v2/*` account credentials beside it: password, OIDC assertion,
// passkey, and one-time legacy standing migration. The service keeps
// secrets out of responses and logs and never accepts device keys as a
// v2 sign-in credential.

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes, scryptSync, timingSafeEqual, webcrypto } from "node:crypto";

const port = Number(process.env.SERFBOUND_IDENTITY_PORT ?? "4310");
const storePath = process.env.SERFBOUND_IDENTITY_STORE ?? ".tmp/identity-accounts.json";
const oidcAssertionSecret = process.env.SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET ?? "";
const identityV2Schema = JSON.parse(
  readFileSync(new URL("./identity-v2-schema.json", import.meta.url), "utf8"),
);

const allowedAccountFields = new Set(["publicKeyJwk", "name", "signedAtIso", "signature"]);
const allowedPasswordAccountFields = new Set(["email", "password", "displayName", "recoveryCode"]);
const allowedPasswordSessionFields = new Set(["email", "password"]);
const allowedPasswordRecoveryFields = new Set(["email", "recoveryCode", "newPassword"]);
const allowedOidcAccountFields = new Set([
  "provider",
  "providerSubject",
  "email",
  "emailVerified",
  "displayName",
]);
const allowedPasskeyAccountFields = new Set([
  "displayName",
  "credentialId",
  "publicKeyJwk",
  "signCount",
  "transports",
  "userHandle",
  "signedAtIso",
  "signature",
]);
const allowedPasskeySessionFields = new Set([
  "credentialId",
  "signCount",
  "signedAtIso",
  "signature",
]);
const allowedLegacyStandingClaimFields = new Set([
  "legacyKeyId",
  "migrationBatchId",
  "signedAtIso",
  "signature",
]);
const allowedOidcProviders = new Set(identityV2Schema.credentialKinds.oidc.allowedProviders);
const nameMaxLength = 12;
const passwordMinLength = 8;
const secretHashAlgorithm = "scrypt";

function emptyStore() {
  return {
    legacyAccounts: {},
    v2: {
      accounts: {},
      indexes: {
        passwordEmails: {},
        oidcSubjects: {},
        passkeyCredentialIds: {},
        legacyKeyIds: {},
      },
    },
  };
}

function normalizeStore(raw) {
  const store = emptyStore();
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return store;
  }

  if (typeof raw.legacyAccounts === "object" && raw.legacyAccounts !== null) {
    store.legacyAccounts = raw.legacyAccounts;
  } else {
    // Backward-compatible read of the old Phase 25 store shape:
    // { "<legacyKeyId>": { accountId, publicKeyJwk, name, createdAtIso } }.
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "object" && value !== null && value.publicKeyJwk !== undefined) {
        store.legacyAccounts[key] = value;
      }
    }
  }

  if (typeof raw.v2 === "object" && raw.v2 !== null) {
    const v2 = raw.v2;
    if (typeof v2.accounts === "object" && v2.accounts !== null) {
      store.v2.accounts = v2.accounts;
    }
  }

  rebuildV2Indexes(store);
  return store;
}

function rebuildV2Indexes(store) {
  const indexes = emptyStore().v2.indexes;
  for (const [accountId, account] of Object.entries(store.v2.accounts)) {
    if (typeof account !== "object" || account === null || !Array.isArray(account.credentials)) {
      continue;
    }

    for (const credential of account.credentials) {
      if (credential.kind === "password") {
        indexes.passwordEmails[credential.email] = accountId;
      } else if (credential.kind === "oidc") {
        indexes.oidcSubjects[oidcIndexKey(credential.provider, credential.providerSubject)] = accountId;
      } else if (credential.kind === "passkey") {
        indexes.passkeyCredentialIds[credential.credentialId] = accountId;
      }
    }

    if (account.legacyStandingClaim?.legacyKeyId !== undefined) {
      indexes.legacyKeyIds[account.legacyStandingClaim.legacyKeyId] = accountId;
    }
  }

  store.v2.indexes = indexes;
}

function loadStore() {
  if (!existsSync(storePath)) {
    return emptyStore();
  }

  try {
    return normalizeStore(JSON.parse(readFileSync(storePath, "utf8")));
  } catch {
    return emptyStore();
  }
}

function saveStore(store) {
  rebuildV2Indexes(store);
  writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function loadAccounts() {
  return loadStore().legacyAccounts;
}

function saveAccounts(accounts) {
  const store = loadStore();
  store.legacyAccounts = accounts;
  saveStore(store);
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

function normalizeEmail(input) {
  const email = String(input ?? "").trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : "";
}

function oidcIndexKey(provider, providerSubject) {
  return `${provider}:${providerSubject}`;
}

function newId(prefix) {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function hashSecret(secret) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(String(secret), salt, 64).toString("base64url");
  return `${secretHashAlgorithm}$${salt}$${hash}`;
}

function verifySecret(secret, encoded) {
  const [algorithm, salt, expectedHash] = String(encoded ?? "").split("$");
  if (algorithm !== secretHashAlgorithm || !salt || !expectedHash) {
    return false;
  }

  const actual = Buffer.from(scryptSync(String(secret), salt, 64).toString("base64url"));
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function rejectUnexpectedFields(body, allowedFields, response) {
  const extraFields = Object.keys(body).filter((key) => !allowedFields.has(key));
  if (extraFields.length === 0) {
    return false;
  }

  send(response, 400, {
    error: "unexpected-fields",
    message: `Data minimization: rejected fields ${extraFields.join(", ")}.`,
  });
  return true;
}

function createV2Account(displayName, atIso = nowIso()) {
  return {
    schemaVersion: 2,
    accountId: newId("acct"),
    displayName: sanitizeName(displayName),
    createdAtIso: atIso,
    updatedAtIso: atIso,
    credentials: [],
  };
}

function credentialSummary(credential) {
  if (credential.kind === "password") {
    return {
      kind: "password",
      credentialId: credential.credentialId,
      email: credential.email,
      emailVerifiedAtIso: credential.emailVerifiedAtIso,
      linkedAtIso: credential.linkedAtIso,
      lastUsedAtIso: credential.lastUsedAtIso,
    };
  }

  if (credential.kind === "oidc") {
    return {
      kind: "oidc",
      credentialId: credential.credentialId,
      provider: credential.provider,
      providerSubject: credential.providerSubject,
      email: credential.email,
      emailVerified: credential.emailVerified,
      linkedAtIso: credential.linkedAtIso,
      lastUsedAtIso: credential.lastUsedAtIso,
    };
  }

  return {
    kind: "passkey",
    credentialId: credential.credentialId,
    signCount: credential.signCount,
    transports: credential.transports,
    userHandle: credential.userHandle,
    linkedAtIso: credential.linkedAtIso,
    lastUsedAtIso: credential.lastUsedAtIso,
  };
}

function publicV2Account(account) {
  return {
    accountId: account.accountId,
    displayName: account.displayName,
    createdAtIso: account.createdAtIso,
    updatedAtIso: account.updatedAtIso,
    credentials: account.credentials.map(credentialSummary),
    ...(account.legacyStandingClaim === undefined
      ? {}
      : { legacyStandingClaim: { ...account.legacyStandingClaim } }),
    ...(account.recovery === undefined
      ? {}
      : {
          recovery: {
            configuredAtIso: account.recovery.configuredAtIso,
            recoveryAlgorithm: account.recovery.recoveryAlgorithm,
          },
        }),
  };
}

function requireOidcAssertion(request, response) {
  if (oidcAssertionSecret === "") {
    send(response, 503, {
      error: "oidc-not-configured",
      message: "OIDC assertion handoff is not configured for this identity service.",
    });
    return false;
  }

  if (request.headers["x-serfbound-oidc-assertion"] !== oidcAssertionSecret) {
    send(response, 401, { error: "bad-oidc-assertion", message: "OIDC assertion did not verify." });
    return false;
  }

  return true;
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

    if (request.method === "GET" && url.pathname === "/v2/schema") {
      send(response, 200, identityV2Schema);
      return;
    }

    if (request.method === "POST" && url.pathname === "/v2/accounts/password") {
      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedPasswordAccountFields, response)) {
        return;
      }

      const email = normalizeEmail(body.email);
      const password = typeof body.password === "string" ? body.password : "";
      if (email === "" || password.length < passwordMinLength) {
        send(response, 400, {
          error: "malformed",
          message: "A valid email and at least 8 password characters are required.",
        });
        return;
      }

      const store = loadStore();
      if (store.v2.indexes.passwordEmails[email] !== undefined) {
        send(response, 409, { error: "credential-exists", message: "That email is already linked." });
        return;
      }

      const atIso = nowIso();
      const account = createV2Account(body.displayName, atIso);
      account.credentials.push({
        kind: "password",
        credentialId: newId("cred_pwd"),
        email,
        emailVerifiedAtIso: null,
        passwordHash: hashSecret(password),
        passwordAlgorithm: secretHashAlgorithm,
        linkedAtIso: atIso,
        lastUsedAtIso: atIso,
      });
      if (typeof body.recoveryCode === "string" && body.recoveryCode.length >= passwordMinLength) {
        account.recovery = {
          recoveryCodeHash: hashSecret(body.recoveryCode),
          recoveryAlgorithm: secretHashAlgorithm,
          configuredAtIso: atIso,
        };
      }

      store.v2.accounts[account.accountId] = account;
      saveStore(store);
      send(response, 201, publicV2Account(account));
      return;
    }

    if (request.method === "POST" && url.pathname === "/v2/sessions/password") {
      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedPasswordSessionFields, response)) {
        return;
      }

      const email = normalizeEmail(body.email);
      const store = loadStore();
      const accountId = store.v2.indexes.passwordEmails[email];
      const account = accountId === undefined ? undefined : store.v2.accounts[accountId];
      const credential = account?.credentials.find(
        (candidate) => candidate.kind === "password" && candidate.email === email,
      );
      if (
        credential === undefined ||
        typeof body.password !== "string" ||
        !verifySecret(body.password, credential.passwordHash)
      ) {
        send(response, 401, { error: "invalid-credentials", message: "Sign-in failed." });
        return;
      }

      const atIso = nowIso();
      credential.lastUsedAtIso = atIso;
      account.updatedAtIso = atIso;
      saveStore(store);
      send(response, 200, publicV2Account(account));
      return;
    }

    if (request.method === "POST" && url.pathname === "/v2/accounts/password/recovery") {
      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedPasswordRecoveryFields, response)) {
        return;
      }

      const email = normalizeEmail(body.email);
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
      const store = loadStore();
      const accountId = store.v2.indexes.passwordEmails[email];
      const account = accountId === undefined ? undefined : store.v2.accounts[accountId];
      const credential = account?.credentials.find(
        (candidate) => candidate.kind === "password" && candidate.email === email,
      );
      if (
        credential === undefined ||
        account.recovery === undefined ||
        typeof body.recoveryCode !== "string" ||
        newPassword.length < passwordMinLength ||
        !verifySecret(body.recoveryCode, account.recovery.recoveryCodeHash)
      ) {
        send(response, 401, { error: "invalid-recovery", message: "Password recovery failed." });
        return;
      }

      const atIso = nowIso();
      credential.passwordHash = hashSecret(newPassword);
      credential.passwordAlgorithm = secretHashAlgorithm;
      credential.lastUsedAtIso = atIso;
      account.updatedAtIso = atIso;
      saveStore(store);
      send(response, 200, publicV2Account(account));
      return;
    }

    if (request.method === "POST" && url.pathname === "/v2/accounts/oidc") {
      if (!requireOidcAssertion(request, response)) {
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedOidcAccountFields, response)) {
        return;
      }

      const provider = String(body.provider ?? "");
      const providerSubject = String(body.providerSubject ?? "").trim();
      if (!allowedOidcProviders.has(provider) || providerSubject === "") {
        send(response, 400, { error: "malformed", message: "A supported provider subject is required." });
        return;
      }

      const store = loadStore();
      const indexKey = oidcIndexKey(provider, providerSubject);
      const existingAccountId = store.v2.indexes.oidcSubjects[indexKey];
      const atIso = nowIso();
      if (existingAccountId !== undefined) {
        const account = store.v2.accounts[existingAccountId];
        const credential = account.credentials.find(
          (candidate) =>
            candidate.kind === "oidc" &&
            candidate.provider === provider &&
            candidate.providerSubject === providerSubject,
        );
        credential.lastUsedAtIso = atIso;
        account.updatedAtIso = atIso;
        saveStore(store);
        send(response, 200, publicV2Account(account));
        return;
      }

      const account = createV2Account(body.displayName, atIso);
      account.credentials.push({
        kind: "oidc",
        credentialId: newId("cred_oidc"),
        provider,
        providerSubject,
        email: normalizeEmail(body.email) || null,
        emailVerified: body.emailVerified === true,
        linkedAtIso: atIso,
        lastUsedAtIso: atIso,
      });
      store.v2.accounts[account.accountId] = account;
      saveStore(store);
      send(response, 201, publicV2Account(account));
      return;
    }

    if (request.method === "POST" && url.pathname === "/v2/accounts/passkey") {
      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedPasskeyAccountFields, response)) {
        return;
      }

      const credentialId = String(body.credentialId ?? "").trim();
      const userHandle = String(body.userHandle ?? "").trim();
      const signedAtIso = String(body.signedAtIso ?? "");
      const signCount = Number(body.signCount ?? 0);
      const publicKeyJwk = body.publicKeyJwk;
      const transports = Array.isArray(body.transports)
        ? body.transports.filter((transport) => typeof transport === "string").slice(0, 6)
        : [];
      if (
        credentialId === "" ||
        userHandle === "" ||
        typeof publicKeyJwk !== "object" ||
        publicKeyJwk === null ||
        typeof body.signature !== "string" ||
        !Number.isInteger(signCount) ||
        signCount < 0
      ) {
        send(response, 400, { error: "malformed", message: "A valid passkey proof is required." });
        return;
      }

      const verified = await verifySignature(
        publicKeyJwk,
        `passkey-register|${credentialId}|${userHandle}|${body.displayName}|${signedAtIso}`,
        body.signature,
      );
      if (!verified) {
        send(response, 401, { error: "bad-passkey-proof", message: "The passkey proof does not verify." });
        return;
      }

      const store = loadStore();
      if (store.v2.indexes.passkeyCredentialIds[credentialId] !== undefined) {
        send(response, 409, { error: "credential-exists", message: "That passkey is already linked." });
        return;
      }

      const atIso = nowIso();
      const account = createV2Account(body.displayName, atIso);
      account.credentials.push({
        kind: "passkey",
        credentialId,
        publicKeyJwk,
        signCount,
        transports,
        userHandle,
        linkedAtIso: atIso,
        lastUsedAtIso: atIso,
      });
      store.v2.accounts[account.accountId] = account;
      saveStore(store);
      send(response, 201, publicV2Account(account));
      return;
    }

    if (request.method === "POST" && url.pathname === "/v2/sessions/passkey") {
      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedPasskeySessionFields, response)) {
        return;
      }

      const credentialId = String(body.credentialId ?? "").trim();
      const signCount = Number(body.signCount);
      const signedAtIso = String(body.signedAtIso ?? "");
      const store = loadStore();
      const accountId = store.v2.indexes.passkeyCredentialIds[credentialId];
      const account = accountId === undefined ? undefined : store.v2.accounts[accountId];
      const credential = account?.credentials.find(
        (candidate) => candidate.kind === "passkey" && candidate.credentialId === credentialId,
      );
      if (
        credential === undefined ||
        typeof body.signature !== "string" ||
        !Number.isInteger(signCount) ||
        signCount <= credential.signCount
      ) {
        send(response, 401, { error: "invalid-credentials", message: "Passkey sign-in failed." });
        return;
      }

      const verified = await verifySignature(
        credential.publicKeyJwk,
        `passkey-signin|${credentialId}|${signCount}|${signedAtIso}`,
        body.signature,
      );
      if (!verified) {
        send(response, 401, { error: "bad-passkey-proof", message: "The passkey proof does not verify." });
        return;
      }

      const atIso = nowIso();
      credential.signCount = signCount;
      credential.lastUsedAtIso = atIso;
      account.updatedAtIso = atIso;
      saveStore(store);
      send(response, 200, publicV2Account(account));
      return;
    }

    const v2AccountMatch = url.pathname.match(/^\/v2\/accounts\/(acct_[0-9a-f]{32})$/);
    if (v2AccountMatch !== null && request.method === "GET") {
      const accountId = v2AccountMatch[1];
      const account = loadStore().v2.accounts[accountId];
      if (account === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      send(response, 200, publicV2Account(account));
      return;
    }

    const legacyClaimMatch = url.pathname.match(
      /^\/v2\/accounts\/(acct_[0-9a-f]{32})\/legacy-standing-claim$/,
    );
    if (legacyClaimMatch !== null && request.method === "POST") {
      const accountId = legacyClaimMatch[1];
      const body = JSON.parse((await readBody(request)) || "{}");
      if (rejectUnexpectedFields(body, allowedLegacyStandingClaimFields, response)) {
        return;
      }

      const store = loadStore();
      const account = store.v2.accounts[accountId];
      if (account === undefined) {
        send(response, 404, { error: "not-found" });
        return;
      }

      const legacyKeyId = String(body.legacyKeyId ?? "");
      const legacyAccount = store.legacyAccounts[legacyKeyId];
      if (legacyAccount === undefined) {
        send(response, 404, { error: "legacy-not-found" });
        return;
      }

      if (
        account.legacyStandingClaim !== undefined ||
        store.v2.indexes.legacyKeyIds[legacyKeyId] !== undefined
      ) {
        send(response, 409, { error: "legacy-claim-used", message: "Legacy standing was already claimed." });
        return;
      }

      const migrationBatchId = String(body.migrationBatchId ?? "").trim();
      const signedAtIso = String(body.signedAtIso ?? "");
      const verified = await verifySignature(
        legacyAccount.publicKeyJwk,
        `migrate|${accountId}|${legacyKeyId}|${migrationBatchId}|${signedAtIso}`,
        body.signature,
      );
      if (!verified) {
        send(response, 401, { error: "bad-signature", message: "The legacy migration signature does not verify." });
        return;
      }

      account.legacyStandingClaim = {
        legacyKeyId,
        claimedAtIso: nowIso(),
        migrationBatchId,
      };
      account.updatedAtIso = account.legacyStandingClaim.claimedAtIso;
      saveStore(store);
      send(response, 200, publicV2Account(account));
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
