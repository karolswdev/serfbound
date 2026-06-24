import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-43-07: the browser shell owns the community-map flow end to end.
// Services are local instances of the deployed code: the test signs in
// with a device key, publishes the open editor map, browses the gallery,
// rates/reports it, downloads into the local library, and plays it with
// the user's own imported data.

const identityPort = 43291;
const mapsPort = 43293;
const identityV2SessionSecret = "playwright-community-maps-v2-session-secret";
let identityService: ChildProcess;
let mapsService: ChildProcess;
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
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-community-maps-"));
  identityService = spawn("node", ["services/identity/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_IDENTITY_PORT: String(identityPort),
      SERFBOUND_IDENTITY_STORE: join(storeDir, "accounts.json"),
      SERFBOUND_IDENTITY_V2_SESSION_SECRET: identityV2SessionSecret,
    },
    stdio: "ignore",
  });
  mapsService = spawn("node", ["services/maps/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_MAPS_PORT: String(mapsPort),
      SERFBOUND_MAPS_STORE: join(storeDir, "maps.json"),
      SERFBOUND_IDENTITY_V2_SESSION_SECRET: identityV2SessionSecret,
    },
    stdio: "ignore",
  });
  await waitForHttp(`http://127.0.0.1:${identityPort}`);
  await waitForHttp(`http://127.0.0.1:${mapsPort}/maps`);
});

test.afterAll(() => {
  identityService?.kill();
  mapsService?.kill();
  rmSync(storeDir, { recursive: true, force: true });
});

test("publishes, browses, downloads, and plays a community map", async ({ page }) => {
  test.setTimeout(180_000);
  const app = page.locator("#app");
  await page.goto(
    `/?dev=1&seed=6235842872325272` +
      `&identityApi=http://127.0.0.1:${identityPort}` +
      `&mailboxApi=http://127.0.0.1:9` +
      `&mapsApi=http://127.0.0.1:${mapsPort}`,
  );

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  const profileInput = page.getByTestId("profile-name-input");
  await profileInput.fill("MAPPER");
  await profileInput.blur();
  await page.getByTestId("maps-signin-button").click();
  await expect(page.getByTestId("online-state")).toHaveText("Signed in as MAPPER", {
    timeout: 15_000,
  });

  await page.getByTestId("open-editor-button").click();
  await expect(app).toHaveAttribute("data-serfbound-chrome", "editor");
  await page.getByTestId("maps-title-input").fill("GATE MAP");
  await expect(page.getByTestId("maps-publish-button")).toBeEnabled();
  await page.getByTestId("maps-publish-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "published", {
    timeout: 15_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-maps-gallery-count", "1");
  await expect(page.getByTestId("maps-gallery")).toContainText("GATE MAP");

  await page.getByTestId("maps-rate-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "rated", {
    timeout: 15_000,
  });
  await page.getByTestId("maps-report-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "reported", {
    timeout: 15_000,
  });

  await page.getByTestId("maps-download-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "downloaded", {
    timeout: 15_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-maps-library-count", "1");
  await expect(page.getByTestId("maps-library")).toContainText("GATE MAP");

  await page.getByTestId("maps-library-play-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "playing");
  await expect(app).toHaveAttribute("data-serfbound-local-game-state", "running");
  await expect(app).toHaveAttribute("data-serfbound-community-map-id", /[0-9a-f-]{36}/);
});

test("email v2 session publishes, rates, reports, and counts play without device keys", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const app = page.locator("#app");
  const mapWrites: {
    readonly path: string;
    readonly authorization: string | null;
    readonly body: string | null;
  }[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      url.origin !== `http://127.0.0.1:${mapsPort}` ||
      request.method() !== "POST" ||
      !(
        url.pathname === "/maps" ||
        url.pathname.endsWith("/rate") ||
        url.pathname.endsWith("/report") ||
        url.pathname.endsWith("/played")
      )
    ) {
      return;
    }

    mapWrites.push({
      path: url.pathname,
      authorization: request.headers()["authorization"] ?? null,
      body: request.postData(),
    });
  });

  await page.goto(
    `/?dev=1&seed=6235842872325272` +
      `&identityApi=http://127.0.0.1:${identityPort}` +
      `&mailboxApi=http://127.0.0.1:9` +
      `&mapsApi=http://127.0.0.1:${mapsPort}`,
  );
  await expect(app).toHaveAttribute("data-serfbound-maps-auth", "signed-out");
  await expect(app).toHaveAttribute("data-serfbound-online-status", "signed-out");

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  const profileInput = page.getByTestId("profile-name-input");
  await profileInput.fill("V2MAPPER");
  await profileInput.blur();
  await page.getByTestId("signin-email-input").fill("v2mapper@example.com");
  await page.getByTestId("signin-password-input").fill("long-enough-password");
  await page.getByTestId("signin-email-submit").click();
  await expect(app).toHaveAttribute("data-serfbound-signin-status", "ready", {
    timeout: 15_000,
  });
  await expect(app).toHaveAttribute("data-serfbound-identity-v2-session", "true");
  await expect(app).toHaveAttribute("data-serfbound-maps-auth", "identity-v2");
  await expect(page.getByTestId("online-state")).toHaveText("Signed out");

  await page.getByTestId("open-editor-button").click();
  await expect(app).toHaveAttribute("data-serfbound-chrome", "editor");
  await page.getByTestId("maps-title-input").fill("V2 GATE MAP");
  await expect(page.getByTestId("maps-publish-button")).toBeEnabled();
  await page.getByTestId("maps-publish-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "published", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("maps-gallery")).toContainText("V2 GATE MAP");
  await expect(page.getByTestId("maps-gallery")).toContainText("V2MAPPER");
  const v2MapCard = page.locator(".community-map-card").filter({ hasText: "V2 GATE MAP" });

  await v2MapCard.getByTestId("maps-rate-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "rated", {
    timeout: 15_000,
  });
  await v2MapCard.getByTestId("maps-report-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "reported", {
    timeout: 15_000,
  });

  await v2MapCard.getByTestId("maps-download-button").click();
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "downloaded", {
    timeout: 15_000,
  });
  await page.getByTestId("maps-library-play-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(app).toHaveAttribute("data-serfbound-maps-status", "playing");
  await expect(app).toHaveAttribute("data-serfbound-online-status", "signed-out");

  await expect
    .poll(() => mapWrites.some((entry) => entry.path.endsWith("/played")))
    .toBe(true);
  expect(mapWrites).toHaveLength(4);
  expect(mapWrites[0]?.path).toBe("/maps");
  expect(mapWrites[1]?.path).toMatch(/\/rate$/);
  expect(mapWrites[2]?.path).toMatch(/\/report$/);
  expect(mapWrites[3]?.path).toMatch(/\/played$/);
  for (const write of mapWrites) {
    expect(write.authorization).toMatch(/^Bearer sbv2\./);
    const body = JSON.parse(write.body ?? "{}") as Record<string, unknown>;
    expect(body["publicKeyJwk"]).toBeUndefined();
    expect(body["signature"]).toBeUndefined();
    expect(body["signedAtIso"]).toBeUndefined();
  }
});
