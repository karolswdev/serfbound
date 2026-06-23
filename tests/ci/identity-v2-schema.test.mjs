import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const workspaceRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const schema = JSON.parse(
  readFileSync(join(workspaceRoot, "services/identity/identity-v2-schema.json"), "utf8"),
);

test("identity v2 retires the four-field ceiling without breaking accountless play", () => {
  assert.equal(schema.schemaId, "serfbound.identity.v2");
  assert.equal(schema.version, 2);
  assert.equal(schema.legacyV1.retiredAsCeiling, true);
  assert.deepEqual(schema.legacyV1.formerFields, [
    "accountId",
    "publicKeyJwk",
    "name",
    "createdAtIso",
  ]);
  assert.ok(
    schema.legacyV1.migration.includes("one-time signed standing claim"),
    "legacy device keys are migration-only, not a v2 credential kind",
  );
  assert.equal(schema.legacyV1.v2CredentialKind, false);
  assert.equal(schema.legacyStandingClaim.signInCredential, false);
  assert.equal(schema.legacyStandingClaim.storedFields.includes("legacyKeyId"), true);
  assert.equal(schema.legacyStandingClaim.forbiddenFields.includes("publicKeyJwk"), true);
  assert.equal(schema.legacyStandingClaim.forbiddenFields.includes("privateKeyJwk"), true);

  assert.equal(schema.accountlessPlay.requiresAccount, false);
  assert.equal(schema.accountlessPlay.requiresNetwork, false);
  assert.equal(schema.accountlessPlay.requiredForLocalImport, false);
  assert.equal(schema.accountlessPlay.requiredForLocalSave, false);
  assert.equal(schema.accountlessPlay.requiredForCampaign, false);
  assert.equal(schema.accountlessPlay.visuallyPrimary, true);
});

test("identity v2 credential kinds are explicit and do not store secrets", () => {
  assert.deepEqual(Object.keys(schema.credentialKinds).sort(), [
    "oidc",
    "passkey",
    "password",
  ]);
  assert.deepEqual(schema.credentialKinds.oidc.allowedProviders, ["apple", "google", "meta"]);

  for (const [kind, contract] of Object.entries(schema.credentialKinds)) {
    assert.ok(contract.storedFields.includes("credentialId"), `${kind} has a stable credential id`);
    for (const forbiddenField of contract.forbiddenFields) {
      assert.equal(
        contract.storedFields.includes(forbiddenField),
        false,
        `${kind} must not store forbidden field ${forbiddenField}`,
      );
    }
  }

  assert.ok(schema.credentialKinds.password.storedFields.includes("passwordHash"));
  assert.ok(schema.credentialKinds.password.storedFields.includes("passwordAlgorithm"));
  assert.equal(schema.credentialKinds.password.storedFields.includes("password"), false);
  assert.ok(schema.credentialKinds.passkey.storedFields.includes("publicKeyJwk"));
  assert.equal(schema.credentialKinds.passkey.storedFields.includes("privateKeyJwk"), false);
  assert.equal(
    Object.hasOwn(schema.credentialKinds, "deviceKey"),
    false,
    "v2 does not keep device keys as a sign-in credential",
  );
});

test("identity v2 privacy posture is printed where players read it", () => {
  const required = [
    "Online identity is optional",
    "stores only the credential data required",
    "public name",
    "game data never uploads",
  ];
  const surfaces = new Map([
    ["README.md", normalizedText("README.md")],
    ["docs/player-guide.md", normalizedText("docs/player-guide.md")],
    ["packages/app/src/main.ts", normalizedText("packages/app/src/main.ts")],
  ]);

  for (const [path, text] of surfaces) {
    for (const phrase of required) {
      assert.ok(text.includes(phrase), `${path} prints identity v2 posture: ${phrase}`);
    }

    assert.equal(text.includes("nothing to leak"), false, `${path} retired the v1 privacy phrase`);
    assert.equal(text.includes("no email, no password"), false, `${path} does not deny v2 credentials`);
  }
});

test("mailbox challenge hardening is part of the identity v2 contract", () => {
  assert.equal(schema.mailboxChallenge.requiresChallengerName, true);
  assert.ok(schema.mailboxChallenge.lobbyFields.includes("challengerKeyId"));
  assert.equal(schema.mailboxChallenge.forbiddenLobbyFields.includes("publicKeyJwk"), true);
  assert.equal(schema.mailboxChallenge.forbiddenLobbyFields.includes("providerSubject"), true);
});

function normalizedText(path) {
  return readFileSync(join(workspaceRoot, path), "utf8").replace(/\s+/g, " ");
}
