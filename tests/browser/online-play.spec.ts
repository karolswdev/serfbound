import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Server } from "node:http";
import { expect, test, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";
import { startProviderHandoffServer } from "./provider-handoff-server.js";

// SB-29-04 (gate): the shell online surface completes a real
// correspondence match through real identity + mailbox services — two
// isolated browser contexts (two devices), device-key sign-in, the
// challenge lobby, signed window moves, recap verification, and the
// dual-attestation finish. The services here are the same code the
// deployed backbone runs; the public-URL run is recorded as manual
// evidence.

const identityPort = 43271;
const mailboxPort = 43272;
const providerHandoffPort = 43273;
const identityV2SessionSecret = "playwright-online-v2-session-secret";
const oidcAssertionSecret = "playwright-online-oidc-assertion-secret";
let identityService: ChildProcess;
let mailboxService: ChildProcess;
let providerHandoffService: Server;
let storeDir: string;

async function waitForHttp(url: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1000) });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw new Error(`service did not answer at ${url}`);
}

test.beforeAll(async () => {
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-online-e2e-"));
  identityService = spawn("node", ["services/identity/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_IDENTITY_PORT: String(identityPort),
      SERFBOUND_IDENTITY_STORE: join(storeDir, "accounts.json"),
      SERFBOUND_IDENTITY_V2_SESSION_SECRET: identityV2SessionSecret,
      SERFBOUND_IDENTITY_OIDC_ASSERTION_SECRET: oidcAssertionSecret,
    },
    stdio: "ignore",
  });
  mailboxService = spawn("node", ["services/mailbox/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_MAILBOX_PORT: String(mailboxPort),
      SERFBOUND_MAILBOX_STORE: join(storeDir, "matches.json"),
      SERFBOUND_IDENTITY_V2_SESSION_SECRET: identityV2SessionSecret,
    },
    stdio: "ignore",
  });
  await waitForHttp(`http://127.0.0.1:${identityPort}`);
  await waitForHttp(`http://127.0.0.1:${mailboxPort}`);
  providerHandoffService = await startProviderHandoffServer({
    port: providerHandoffPort,
    identityUrl: `http://127.0.0.1:${identityPort}`,
    oidcAssertionSecret,
    subjectPrefix: "online-play",
  });
});

test.afterAll(() => {
  identityService?.kill();
  mailboxService?.kill();
  providerHandoffService?.close();
  rmSync(storeDir, { recursive: true, force: true });
});

async function openShell(
  page: Page,
  name: string,
  options: { readonly providerHandoff?: boolean } = {},
): Promise<void> {
  await page.goto(
    `/?seed=6235842872325272&window=512` +
      `&identityApi=http://127.0.0.1:${identityPort}` +
      `&mailboxApi=http://127.0.0.1:${mailboxPort}` +
      (options.providerHandoff === true
        ? `&providerHandoffApi=http://127.0.0.1:${providerHandoffPort}/provider-handoff`
        : ""),
  );
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  const profileInput = page.getByTestId("profile-name-input");
  await profileInput.fill(name);
  await profileInput.blur();
}

type RecordedWrite = {
  readonly path: string;
  readonly authorization: string | null;
  readonly body: string | null;
};

function recordMailboxWrites(page: Page, writes: RecordedWrite[]): void {
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.origin !== `http://127.0.0.1:${mailboxPort}` ||
      request.method() !== "POST" ||
      !(
        url.pathname === "/challenges" ||
        url.pathname.endsWith("/accept") ||
        url.pathname.endsWith("/moves") ||
        url.pathname.endsWith("/results")
      )
    ) {
      return;
    }

    writes.push({
      path: url.pathname,
      authorization: request.headers()["authorization"] ?? null,
      body: request.postData(),
    });
  });
}

function recordIdentityPosts(page: Page, paths: string[]): void {
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === `http://127.0.0.1:${identityPort}` && request.method() === "POST") {
      paths.push(url.pathname);
    }
  });
}

function recordProviderHandoffPosts(page: Page, writes: RecordedWrite[]): void {
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === `http://127.0.0.1:${providerHandoffPort}` && request.method() === "POST") {
      writes.push({
        path: url.pathname,
        authorization: request.headers()["authorization"] ?? null,
        body: request.postData(),
      });
    }
  });
}

async function signInEmailV2(page: Page, name: string, email: string): Promise<void> {
  const app = page.locator("#app");
  await openShell(page, name);
  await page.getByTestId("signin-email-input").fill(email);
  await page.getByTestId("signin-password-input").fill("long-enough-password");
  await page.getByTestId("signin-email-submit").click();
  await expect(app).toHaveAttribute("data-serfbound-signin-status", "ready", {
    timeout: 15_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-identity-v2-session", "true");
  await expect(app).toHaveAttribute("data-serfbound-online-auth", "identity-v2");
  await expect(page.getByTestId("online-state")).toHaveText(`Signed in as ${name}`, {
    timeout: 15_000,
  });
  await expect(page.getByTestId("online-signin-button")).toBeDisabled();
}

async function signInPasskeyV2(page: Page, name: string): Promise<void> {
  const app = page.locator("#app");
  await openShell(page, name);
  await page.getByTestId("signin-method-passkey").click();
  await page.getByTestId("signin-passkey-button").click();
  await expect(app).toHaveAttribute("data-serfbound-signin-status", "ready", {
    timeout: 15_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-identity-v2-session", "true");
  await expect(app).toHaveAttribute("data-serfbound-online-auth", "identity-v2");
  await expect(page.getByTestId("online-state")).toHaveText(`Signed in as ${name}`, {
    timeout: 15_000,
  });
  await expect(page.getByTestId("online-signin-button")).toBeDisabled();
}

async function signInProviderV2(page: Page, name: string): Promise<void> {
  const app = page.locator("#app");
  await openShell(page, name, { providerHandoff: true });
  await page.getByTestId("signin-method-google").click();
  await page.getByTestId("signin-provider-button").click();
  await expect(app).toHaveAttribute("data-serfbound-signin-status", "ready", {
    timeout: 15_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-identity-v2-session", "true");
  await expect(app).toHaveAttribute("data-serfbound-online-auth", "identity-v2");
  await expect(page.getByTestId("online-state")).toHaveText(`Signed in as ${name}`, {
    timeout: 15_000,
  });
  await expect(page.getByTestId("online-signin-button")).toBeDisabled();
}

test("two devices play an online match to dual attestation", async ({ browser }) => {
  test.setTimeout(180_000);
  // Two isolated contexts: separate storage, separate device keys —
  // genuinely two players, not two tabs sharing a profile.
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  await openShell(alice, "ALICE");
  await openShell(bob, "BOB");
  const aliceApp = alice.locator("#app");
  const bobApp = bob.locator("#app");

  // Sign in on both devices.
  await alice.getByTestId("online-signin-button").click();
  await expect(alice.getByTestId("online-state")).toHaveText("Signed in as ALICE", {
    timeout: 15_000,
  });
  await bob.getByTestId("online-signin-button").click();
  await expect(bob.getByTestId("online-state")).toHaveText("Signed in as BOB", {
    timeout: 15_000,
  });

  // Alice posts a challenge; Bob finds it in the lobby and accepts.
  await alice.getByTestId("online-challenge-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-lobby-count", "1", {
    timeout: 15_000,
  });
  await bob.getByTestId("online-refresh-button").click();
  await expect(bob.getByTestId("online-accept-button")).toBeVisible({ timeout: 15_000 });
  await bob.getByTestId("online-accept-button").click();

  // Bob (seat 1) waits; Alice's background poll discovers the accepted
  // match and starts window 0 automatically.
  await expect(bob.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-player", "1");
  await expect(alice.getByTestId("game-state")).toHaveText("Running", { timeout: 30_000 });
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-player", "0");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 15_000,
  });

  // Alice's window plays out and posts; Bob's poll brings it down.
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 30_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 15_000,
  });
  await bob.keyboard.press("Enter");
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await expect(bobApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);

  // Bob's window goes back; Alice verifies it through the recap.
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 45_000,
  });
  await alice.keyboard.press("Enter");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });

  // Both sides stand on the same verified boundary — the checksum that
  // dual attestation will sign.
  const aliceBoundary = await aliceApp.getAttribute("data-serfbound-cor-boundary");
  expect(aliceBoundary).not.toBeNull();
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-boundary", aliceBoundary as string);

  // Dual attestation: both declare the same outcome; the mailbox ends
  // and rates the match only when the declarations agree.
  await alice.getByTestId("online-attest-win-button").click();
  await bob.getByTestId("online-attest-loss-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:won", {
    timeout: 15_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:lost", {
    timeout: 15_000,
  });

  // The match landed in both local histories.
  await expect(aliceApp).toHaveAttribute("data-serfbound-profile-history-count", "1");
  await expect(bobApp).toHaveAttribute("data-serfbound-profile-history-count", "1");

  // The ladder (SB-30-01): the dual-attested result rates, the
  // winner leads, and your own row is locatable.
  await alice.getByTestId("online-ladder").locator("summary").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-ladder-count", "2", {
    timeout: 15_000,
  });
  const ownRow = alice.locator(".ladder__row--own");
  await expect(ownRow).toContainText("ALICE (you)");
  await expect(ownRow).toContainText("1516");
  await expect(alice.locator(".ladder__row").nth(1)).toContainText("1484");
  await expect(alice.getByTestId("online-ladder-note")).toBeHidden();

  await aliceContext.close();
  await bobContext.close();
});

test("two passkey v2 accounts play and rate without device-key payloads", async ({ browser }) => {
  test.setTimeout(180_000);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  const mailboxWrites: RecordedWrite[] = [];
  const identityPosts: string[] = [];
  recordMailboxWrites(alice, mailboxWrites);
  recordMailboxWrites(bob, mailboxWrites);
  recordIdentityPosts(alice, identityPosts);
  recordIdentityPosts(bob, identityPosts);

  await signInPasskeyV2(alice, "ALICEPK");
  await signInPasskeyV2(bob, "BOBPK");
  const aliceApp = alice.locator("#app");
  const bobApp = bob.locator("#app");

  await alice.getByTestId("online-challenge-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-lobby-count", "1", {
    timeout: 15_000,
  });
  await bob.getByTestId("online-refresh-button").click();
  await expect(bob.getByTestId("online-accept-button")).toBeVisible({ timeout: 15_000 });
  await bob.getByTestId("online-accept-button").click();

  await expect(bob.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-player", "1");
  await expect(alice.getByTestId("game-state")).toHaveText("Running", { timeout: 30_000 });
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-player", "0");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 15_000,
  });

  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 30_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 15_000,
  });
  await bob.keyboard.press("Enter");
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await expect(bobApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);

  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 45_000,
  });
  await alice.keyboard.press("Enter");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  const aliceBoundary = await aliceApp.getAttribute("data-serfbound-cor-boundary");
  expect(aliceBoundary).not.toBeNull();
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-boundary", aliceBoundary as string);

  await alice.getByTestId("online-attest-win-button").click();
  await bob.getByTestId("online-attest-loss-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:won", {
    timeout: 15_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:lost", {
    timeout: 15_000,
  });

  await alice.getByTestId("online-ladder").locator("summary").click();
  await expect(alice.locator(".ladder__row--own")).toContainText("ALICEPK (you)", {
    timeout: 15_000,
  });
  await expect(alice.locator(".ladder__row--own")).toContainText("1516");

  await expect.poll(() => mailboxWrites.length).toBe(6);
  expect(mailboxWrites.filter((entry) => entry.path === "/challenges")).toHaveLength(1);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/accept"))).toHaveLength(1);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/moves"))).toHaveLength(2);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/results"))).toHaveLength(2);
  for (const write of mailboxWrites) {
    expect(write.authorization).toMatch(/^Bearer sbv2\./);
    const body = JSON.parse(write.body ?? "{}") as Record<string, unknown>;
    expect(body["publicKeyJwk"]).toBeUndefined();
    expect(body["signature"]).toBeUndefined();
    expect(body["signedAtIso"]).toBeUndefined();
  }
  expect(identityPosts).toEqual(["/v2/accounts/passkey", "/v2/accounts/passkey"]);

  await aliceContext.close();
  await bobContext.close();
});

test("two provider handoff accounts play and rate without browser token payloads", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  const mailboxWrites: RecordedWrite[] = [];
  const providerWrites: RecordedWrite[] = [];
  const identityPosts: string[] = [];
  recordMailboxWrites(alice, mailboxWrites);
  recordMailboxWrites(bob, mailboxWrites);
  recordProviderHandoffPosts(alice, providerWrites);
  recordProviderHandoffPosts(bob, providerWrites);
  recordIdentityPosts(alice, identityPosts);
  recordIdentityPosts(bob, identityPosts);

  await signInProviderV2(alice, "ALICEGOOG");
  await signInProviderV2(bob, "BOBGOOG");
  const aliceApp = alice.locator("#app");
  const bobApp = bob.locator("#app");

  expect(identityPosts).toEqual([]);
  expect(providerWrites.map((entry) => entry.path)).toEqual([
    "/provider-handoff",
    "/provider-handoff",
  ]);
  for (const write of providerWrites) {
    expect(write.authorization).toBeNull();
    const body = JSON.parse(write.body ?? "{}") as Record<string, unknown>;
    expect(body["provider"]).toBe("google");
    expect(typeof body["displayName"]).toBe("string");
    expect(body["providerSubject"]).toBeUndefined();
    expect(body["idToken"]).toBeUndefined();
    expect(body["accessToken"]).toBeUndefined();
    expect(body["refreshToken"]).toBeUndefined();
    expect(body["authorizationCode"]).toBeUndefined();
  }

  await alice.getByTestId("online-challenge-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-lobby-count", "1", {
    timeout: 15_000,
  });
  await bob.getByTestId("online-refresh-button").click();
  await expect(bob.getByTestId("online-accept-button")).toBeVisible({ timeout: 15_000 });
  await bob.getByTestId("online-accept-button").click();

  await expect(bob.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-player", "1");
  await expect(alice.getByTestId("game-state")).toHaveText("Running", { timeout: 30_000 });
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-player", "0");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 15_000,
  });

  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 30_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 15_000,
  });
  await bob.keyboard.press("Enter");
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await expect(bobApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);

  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 45_000,
  });
  await alice.keyboard.press("Enter");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  const aliceBoundary = await aliceApp.getAttribute("data-serfbound-cor-boundary");
  expect(aliceBoundary).not.toBeNull();
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-boundary", aliceBoundary as string);

  await alice.getByTestId("online-attest-win-button").click();
  await bob.getByTestId("online-attest-loss-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:won", {
    timeout: 15_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:lost", {
    timeout: 15_000,
  });

  await alice.getByTestId("online-ladder").locator("summary").click();
  await expect(alice.locator(".ladder__row--own")).toContainText("ALICEGOOG (you)", {
    timeout: 15_000,
  });
  await expect(alice.locator(".ladder__row--own")).toContainText("1516");

  await expect.poll(() => mailboxWrites.length).toBe(6);
  expect(mailboxWrites.filter((entry) => entry.path === "/challenges")).toHaveLength(1);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/accept"))).toHaveLength(1);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/moves"))).toHaveLength(2);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/results"))).toHaveLength(2);
  for (const write of mailboxWrites) {
    expect(write.authorization).toMatch(/^Bearer sbv2\./);
    const body = JSON.parse(write.body ?? "{}") as Record<string, unknown>;
    expect(body["publicKeyJwk"]).toBeUndefined();
    expect(body["signature"]).toBeUndefined();
    expect(body["signedAtIso"]).toBeUndefined();
  }

  await aliceContext.close();
  await bobContext.close();
});

test("two email v2 accounts play and rate without device-key payloads", async ({ browser }) => {
  test.setTimeout(180_000);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  const mailboxWrites: RecordedWrite[] = [];
  const identityPosts: string[] = [];
  recordMailboxWrites(alice, mailboxWrites);
  recordMailboxWrites(bob, mailboxWrites);
  recordIdentityPosts(alice, identityPosts);
  recordIdentityPosts(bob, identityPosts);

  await signInEmailV2(alice, "ALICEV2", "alice-v2-browser@example.com");
  await signInEmailV2(bob, "BOBV2", "bob-v2-browser@example.com");
  const aliceApp = alice.locator("#app");
  const bobApp = bob.locator("#app");

  await alice.getByTestId("online-challenge-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-lobby-count", "1", {
    timeout: 15_000,
  });
  await bob.getByTestId("online-refresh-button").click();
  await expect(bob.getByTestId("online-accept-button")).toBeVisible({ timeout: 15_000 });
  await bob.getByTestId("online-accept-button").click();

  await expect(bob.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-player", "1");
  await expect(alice.getByTestId("game-state")).toHaveText("Running", { timeout: 30_000 });
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-player", "0");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 15_000,
  });

  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "awaiting-move", {
    timeout: 30_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 15_000,
  });
  await bob.keyboard.press("Enter");
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await expect(bobApp).not.toHaveAttribute("data-serfbound-cor-failure", /.+/);

  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 45_000,
  });
  await alice.keyboard.press("Enter");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  const aliceBoundary = await aliceApp.getAttribute("data-serfbound-cor-boundary");
  expect(aliceBoundary).not.toBeNull();
  await expect(bobApp).toHaveAttribute("data-serfbound-cor-boundary", aliceBoundary as string);

  await alice.getByTestId("online-attest-win-button").click();
  await bob.getByTestId("online-attest-loss-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:won", {
    timeout: 15_000,
  });
  await expect(bobApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:lost", {
    timeout: 15_000,
  });

  await alice.getByTestId("online-ladder").locator("summary").click();
  await expect(alice.locator(".ladder__row--own")).toContainText("ALICEV2 (you)", {
    timeout: 15_000,
  });
  await expect(alice.locator(".ladder__row--own")).toContainText("1516");

  await expect.poll(() => mailboxWrites.length).toBe(6);
  expect(mailboxWrites.filter((entry) => entry.path === "/challenges")).toHaveLength(1);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/accept"))).toHaveLength(1);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/moves"))).toHaveLength(2);
  expect(mailboxWrites.filter((entry) => entry.path.endsWith("/results"))).toHaveLength(2);
  for (const write of mailboxWrites) {
    expect(write.authorization).toMatch(/^Bearer sbv2\./);
    const body = JSON.parse(write.body ?? "{}") as Record<string, unknown>;
    expect(body["publicKeyJwk"]).toBeUndefined();
    expect(body["signature"]).toBeUndefined();
    expect(body["signedAtIso"]).toBeUndefined();
  }
  expect(identityPosts).toEqual(["/v2/accounts/password", "/v2/accounts/password"]);

  await aliceContext.close();
  await bobContext.close();
});
