import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createProfile,
  deleteIdentity,
  fetchIdentity,
  generateIdentityKeys,
  identityAccountId,
  registerIdentity,
  renameIdentity,
  signIdentityPayload,
  withAccount,
  withoutAccount,
} from "@serfbound/app";

// SB-25-02: the identity service contract — anonymous device keys,
// signed mutations, the exhaustively-minimal schema, verifiable
// deletion — driven against a real local instance.

let server;
let serviceUrl;
let storeDir;
let storePath;

const oidcAssertionSecret =
  process.env.SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET ?? "service-identity-test-oidc";

before(async () => {
  // SB-29-02: with SERFBOUND_IDENTITY_URL set, the same contract suite
  // targets an externally running (e.g. containerized) instance.
  if (process.env.SERFBOUND_IDENTITY_URL) {
    serviceUrl = process.env.SERFBOUND_IDENTITY_URL;
    return;
  }

  storeDir = mkdtempSync(join(tmpdir(), "serfbound-identity-"));
  process.env.SERFBOUND_IDENTITY_AUTOSTART = "0";
  process.env.SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET = oidcAssertionSecret;
  storePath = join(storeDir, "accounts.json");
  process.env.SERFBOUND_IDENTITY_STORE = storePath;
  ({ server } = await import("../../services/identity/server.mjs"));
  await new Promise((resolve) => server.listen(0, resolve));
  serviceUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server?.close();
  if (storeDir) {
    rmSync(storeDir, { recursive: true, force: true });
  }
});

test("register, fetch, rename, and delete flow end to end, signed", async () => {
  const keys = await generateIdentityKeys();
  const identity = await registerIdentity(serviceUrl, keys, "karol");
  assert.equal(identity.accountId, await identityAccountId(keys), "the id is the key fingerprint");

  const fetched = await fetchIdentity(serviceUrl, identity.accountId);
  assert.equal(fetched.name, "KAROL", "names sanitize server-side too");

  const renamed = await renameIdentity(identity, "serf lord");
  assert.equal(renamed, "SERFLORD");

  await deleteIdentity(identity);
  assert.equal(
    await fetchIdentity(serviceUrl, identity.accountId),
    null,
    "deletion is verifiable: the record is gone",
  );
});

test("data minimization is a contract: unexpected fields reject", async () => {
  const keys = await generateIdentityKeys();
  const response = await fetch(`${serviceUrl}/accounts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKeyJwk: keys.publicKeyJwk,
      name: "KAROL",
      signedAtIso: new Date().toISOString(),
      signature: "irrelevant",
      email: "karol@example.com",
    }),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "unexpected-fields");
  assert.equal(body.message.includes("email"), true, "the rejected field is named");
});

test("v2 password accounts store hashes, recover by hash, and redact secrets", async () => {
  const created = await postJson("/v2/accounts/password", {
    email: "Karol@example.com",
    password: "long-enough-password",
    displayName: "karol",
    recoveryCode: "backup-code-123",
  }, 201);
  assert.match(created.accountId, /^acct_[0-9a-f]{32}$/);
  assert.equal(created.displayName, "KAROL");
  assert.equal(created.credentials[0].kind, "password");
  assert.equal(created.credentials[0].email, "karol@example.com");
  assert.equal("passwordHash" in created.credentials[0], false, "password hashes never leave the service");
  assert.deepEqual(created.recovery, {
    configuredAtIso: created.recovery.configuredAtIso,
    recoveryAlgorithm: "scrypt",
  });

  const signedIn = await postJson("/v2/sessions/password", {
    email: "karol@example.com",
    password: "long-enough-password",
  });
  assert.equal(signedIn.accountId, created.accountId);

  const bad = await fetch(`${serviceUrl}/v2/sessions/password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "karol@example.com", password: "wrong-password" }),
  });
  assert.equal(bad.status, 401);

  const recovered = await postJson("/v2/accounts/password/recovery", {
    email: "karol@example.com",
    recoveryCode: "backup-code-123",
    newPassword: "new-long-enough-password",
  });
  assert.equal(recovered.accountId, created.accountId);

  const oldPassword = await fetch(`${serviceUrl}/v2/sessions/password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "karol@example.com", password: "long-enough-password" }),
  });
  assert.equal(oldPassword.status, 401, "password recovery rotates the password hash");
  assert.equal(
    (await postJson("/v2/sessions/password", {
      email: "karol@example.com",
      password: "new-long-enough-password",
    })).accountId,
    created.accountId,
  );

  if (storePath !== undefined) {
    const stored = readStoredV2Account(created.accountId);
    const passwordCredential = stored.credentials.find((credential) => credential.kind === "password");
    assert.equal(passwordCredential.passwordAlgorithm, "scrypt");
    assert.notEqual(passwordCredential.passwordHash.includes("long-enough-password"), true);
    assert.notEqual(passwordCredential.passwordHash.includes("new-long-enough-password"), true);
    assert.equal(JSON.stringify(stored).includes("backup-code-123"), false);
    assert.equal(stored.recovery.recoveryAlgorithm, "scrypt");
  }
});

test("v2 OIDC accounts accept configured provider assertions without storing tokens", async () => {
  const created = await postJson(
    "/v2/accounts/oidc",
    {
      provider: "google",
      providerSubject: "google-subject-1",
      email: "settler@example.com",
      emailVerified: true,
      displayName: "settler",
    },
    201,
    { "x-serfbound-oidc-assertion": oidcAssertionSecret },
  );
  assert.equal(created.displayName, "SETTLER");
  assert.equal(created.credentials[0].kind, "oidc");
  assert.equal(created.credentials[0].provider, "google");
  assert.equal(created.credentials[0].emailVerified, true);

  const repeated = await postJson(
    "/v2/accounts/oidc",
    {
      provider: "google",
      providerSubject: "google-subject-1",
      email: "settler@example.com",
      emailVerified: true,
      displayName: "ignored",
    },
    200,
    { "x-serfbound-oidc-assertion": oidcAssertionSecret },
  );
  assert.equal(repeated.accountId, created.accountId, "provider subject signs into the same v2 account");

  const tokenLeak = await fetch(`${serviceUrl}/v2/accounts/oidc`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-serfbound-oidc-assertion": oidcAssertionSecret,
    },
    body: JSON.stringify({
      provider: "google",
      providerSubject: "google-subject-2",
      displayName: "leaky",
      idToken: "must-not-enter-service",
    }),
  });
  assert.equal(tokenLeak.status, 400);
  assert.equal((await tokenLeak.json()).error, "unexpected-fields");
});

test("v2 passkey accounts verify public-key proofs and advance sign counts", async () => {
  const passkey = await generateIdentityKeys();
  const credentialId = "passkey-test-1";
  const userHandle = "user-handle-1";
  const displayName = "shield";
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(
    passkey,
    `passkey-register|${credentialId}|${userHandle}|${displayName}|${signedAtIso}`,
  );
  const created = await postJson("/v2/accounts/passkey", {
    displayName,
    credentialId,
    publicKeyJwk: passkey.publicKeyJwk,
    signCount: 1,
    transports: ["internal"],
    userHandle,
    signedAtIso,
    signature,
  }, 201);
  assert.equal(created.displayName, "SHIELD");
  assert.equal(created.credentials[0].kind, "passkey");
  assert.equal(created.credentials[0].signCount, 1);
  assert.equal("publicKeyJwk" in created.credentials[0], false, "passkey public key is not exposed in account reads");

  const nextSignedAtIso = new Date().toISOString();
  const nextSignature = await signIdentityPayload(
    passkey,
    `passkey-signin|${credentialId}|2|${nextSignedAtIso}`,
  );
  const signedIn = await postJson("/v2/sessions/passkey", {
    credentialId,
    signCount: 2,
    signedAtIso: nextSignedAtIso,
    signature: nextSignature,
  });
  assert.equal(signedIn.accountId, created.accountId);
  assert.equal(signedIn.credentials[0].signCount, 2);

  const replay = await fetch(`${serviceUrl}/v2/sessions/passkey`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      credentialId,
      signCount: 2,
      signedAtIso: nextSignedAtIso,
      signature: nextSignature,
    }),
  });
  assert.equal(replay.status, 401, "replayed sign counts reject");
});

test("v2 migration claims legacy standing once without keeping device keys as credentials", async () => {
  const legacyKeys = await generateIdentityKeys();
  const legacyIdentity = await registerIdentity(serviceUrl, legacyKeys, "legacy");

  const v2 = await postJson("/v2/accounts/password", {
    email: "legacy@example.com",
    password: "long-enough-password",
    displayName: "legacy",
  }, 201);
  const migrationBatchId = "phase-33-test";
  const signedAtIso = new Date().toISOString();
  const signature = await signIdentityPayload(
    legacyKeys,
    `migrate|${v2.accountId}|${legacyIdentity.accountId}|${migrationBatchId}|${signedAtIso}`,
  );
  const migrated = await postJson(`/v2/accounts/${v2.accountId}/legacy-standing-claim`, {
    legacyKeyId: legacyIdentity.accountId,
    migrationBatchId,
    signedAtIso,
    signature,
  });
  assert.deepEqual(migrated.legacyStandingClaim, {
    legacyKeyId: legacyIdentity.accountId,
    claimedAtIso: migrated.legacyStandingClaim.claimedAtIso,
    migrationBatchId,
  });
  assert.equal(
    migrated.credentials.some((credential) => credential.kind === "deviceKey"),
    false,
    "legacy device keys are not v2 credentials",
  );

  const replay = await fetch(`${serviceUrl}/v2/accounts/${v2.accountId}/legacy-standing-claim`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      legacyKeyId: legacyIdentity.accountId,
      migrationBatchId,
      signedAtIso,
      signature,
    }),
  });
  assert.equal(replay.status, 409);

  if (storePath !== undefined) {
    const stored = readStoredV2Account(v2.accountId);
    assert.equal(JSON.stringify(stored.legacyStandingClaim).includes("publicKeyJwk"), false);
    assert.equal(stored.credentials.some((credential) => credential.kind === "deviceKey"), false);
  }

  await deleteIdentity(legacyIdentity);
});

test("unsigned or wrongly-signed mutations reject", async () => {
  const keys = await generateIdentityKeys();
  const identity = await registerIdentity(serviceUrl, keys, "KAROL");

  // A different key cannot rename this account.
  const attacker = await generateIdentityKeys();
  const stolen = { ...identity, keys: attacker };
  await assert.rejects(
    () => renameIdentity(stolen, "PWNED"),
    (error) => error.reason === "bad-signature",
  );
  assert.equal((await fetchIdentity(serviceUrl, identity.accountId)).name, "KAROL");

  // Nor delete it.
  await assert.rejects(
    () => deleteIdentity(stolen),
    (error) => error.reason === "bad-signature",
  );
  assert.notEqual(await fetchIdentity(serviceUrl, identity.accountId), null);

  await deleteIdentity(identity);
});

test("sign-in links the local profile; sign-out loses nothing", async () => {
  const keys = await generateIdentityKeys();
  const identity = await registerIdentity(serviceUrl, keys, "KAROL");

  let profile = createProfile("karol");
  profile = withAccount(profile, {
    accountId: identity.accountId,
    serviceUrl,
    publicKeyJwk: keys.publicKeyJwk,
    privateKeyJwk: keys.privateKeyJwk,
  });
  assert.equal(profile.account.accountId, identity.accountId);
  assert.equal(profile.name, "KAROL", "the local profile is untouched by linking");

  profile = withoutAccount(profile);
  assert.equal(profile.account, undefined);
  assert.equal(profile.name, "KAROL", "sign-out keeps the local profile and history");

  await deleteIdentity(identity);
});

async function postJson(path, body, expectedStatus = 200, headers = {}) {
  const response = await fetch(`${serviceUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  assert.equal(response.status, expectedStatus, `${path} returned ${response.status}: ${JSON.stringify(payload)}`);
  return payload;
}

function readStoredV2Account(accountId) {
  const store = JSON.parse(readFileSync(storePath, "utf8"));
  return store.v2.accounts[accountId];
}
