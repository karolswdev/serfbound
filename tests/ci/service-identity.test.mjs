import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
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
  withAccount,
  withoutAccount,
} from "@serfbound/app";

// SB-25-02: the identity service contract — anonymous device keys,
// signed mutations, the exhaustively-minimal schema, verifiable
// deletion — driven against a real local instance.

let server;
let serviceUrl;
let storeDir;

before(async () => {
  // SB-29-02: with SERFBOUND_IDENTITY_URL set, the same contract suite
  // targets an externally running (e.g. containerized) instance.
  if (process.env.SERFBOUND_IDENTITY_URL) {
    serviceUrl = process.env.SERFBOUND_IDENTITY_URL;
    return;
  }

  storeDir = mkdtempSync(join(tmpdir(), "serfbound-identity-"));
  process.env.SERFBOUND_IDENTITY_AUTOSTART = "0";
  process.env.SERFBOUND_IDENTITY_STORE = join(storeDir, "accounts.json");
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
