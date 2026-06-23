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
    },
    stdio: "ignore",
  });
  mapsService = spawn("node", ["services/maps/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_MAPS_PORT: String(mapsPort),
      SERFBOUND_MAPS_STORE: join(storeDir, "maps.json"),
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
