import assert from "node:assert/strict";
import { test } from "node:test";

import { defaultOnlineApiBase, onlineApiStorageKey, resolveOnlineConfig } from "@serfbound/app";

// SB-29-04: endpoint resolution — deployed default, persisted base,
// `?api=` base, and explicit per-service test overrides.

test("defaults to the deployed backbone with the gateway path split", () => {
  const config = resolveOnlineConfig("");
  assert.equal(config.identityUrl, `${defaultOnlineApiBase}/identity`);
  assert.equal(config.mailboxUrl, `${defaultOnlineApiBase}/mailbox`);
  assert.equal(config.mapsUrl, `${defaultOnlineApiBase}/maps`);
  assert.equal(config.providerHandoffUrl, null);
});

test("?api= overrides the base and trims trailing slashes", () => {
  const config = resolveOnlineConfig("?api=https://example.test/");
  assert.equal(config.identityUrl, "https://example.test/identity");
  assert.equal(config.mailboxUrl, "https://example.test/mailbox");
  assert.equal(config.mapsUrl, "https://example.test/maps");
});

test("explicit per-service params win (tests run split local ports)", () => {
  const config = resolveOnlineConfig(
    "?identityApi=http://127.0.0.1:4310&mailboxApi=http://127.0.0.1:4320/&mapsApi=http://127.0.0.1:4330/",
  );
  assert.equal(config.identityUrl, "http://127.0.0.1:4310");
  assert.equal(config.mailboxUrl, "http://127.0.0.1:4320");
  assert.equal(config.mapsUrl, "http://127.0.0.1:4330");
  assert.equal(config.providerHandoffUrl, null);
});

test("provider handoff is explicit so browsers do not call the assertion endpoint directly", () => {
  const config = resolveOnlineConfig(
    "?providerHandoffApi=http://127.0.0.1:4340/provider-handoff/",
  );
  assert.equal(config.providerHandoffUrl, "http://127.0.0.1:4340/provider-handoff");
});

test("blank provider handoff param keeps provider sign-in unconfigured", () => {
  const config = resolveOnlineConfig("?providerHandoffApi=");
  assert.equal(config.providerHandoffUrl, null);
});

test("a persisted base applies when no param overrides it", () => {
  const storage = {
    getItem: (key) => (key === onlineApiStorageKey ? "https://self-hosted.test" : null),
  };
  assert.equal(
    resolveOnlineConfig("", storage).identityUrl,
    "https://self-hosted.test/identity",
  );
  assert.equal(
    resolveOnlineConfig("", storage).mapsUrl,
    "https://self-hosted.test/maps",
  );
  assert.equal(
    resolveOnlineConfig("?api=https://param.test", storage).identityUrl,
    "https://param.test/identity",
  );
});

test("a throwing storage degrades to the default, never throws", () => {
  const storage = {
    getItem: () => {
      throw new Error("storage denied");
    },
  };
  assert.equal(resolveOnlineConfig("", storage).identityUrl, `${defaultOnlineApiBase}/identity`);
  assert.equal(resolveOnlineConfig("", storage).mapsUrl, `${defaultOnlineApiBase}/maps`);
});
