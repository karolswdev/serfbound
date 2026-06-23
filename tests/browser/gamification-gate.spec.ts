import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-30-04 (the gamification gate): one loop, end to end — a rated
// match completes, the rating change appears on the leaderboard, both
// chronicles record it, and deeds unlock along the way. Plus the
// privacy sweep: the local stores are exactly the recorded set.

const identityPort = 43301;
const mailboxPort = 43302;
let identityService: ChildProcess;
let mailboxService: ChildProcess;
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
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-gamification-"));
  identityService = spawn("node", ["services/identity/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_IDENTITY_PORT: String(identityPort),
      SERFBOUND_IDENTITY_STORE: join(storeDir, "accounts.json"),
    },
    stdio: "ignore",
  });
  mailboxService = spawn("node", ["services/mailbox/server.mjs"], {
    env: {
      ...process.env,
      SERFBOUND_MAILBOX_PORT: String(mailboxPort),
      SERFBOUND_MAILBOX_STORE: join(storeDir, "matches.json"),
    },
    stdio: "ignore",
  });
  await waitForHttp(`http://127.0.0.1:${identityPort}`);
  await waitForHttp(`http://127.0.0.1:${mailboxPort}`);
});

test.afterAll(() => {
  identityService?.kill();
  mailboxService?.kill();
  rmSync(storeDir, { recursive: true, force: true });
});

async function openShell(page: Page, name: string): Promise<void> {
  await page.goto(
    `/?seed=6235842872325272&window=512` +
      `&identityApi=http://127.0.0.1:${identityPort}` +
      `&mailboxApi=http://127.0.0.1:${mailboxPort}`,
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
  await page.getByTestId("online-signin-button").click();
  await expect(page.getByTestId("online-state")).toHaveText(`Signed in as ${name}`, {
    timeout: 15_000,
  });
}

test("the loop: rated match -> ladder -> chronicle -> deeds", async ({ browser }) => {
  test.setTimeout(240_000);
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  const alice = await aliceContext.newPage();
  const bob = await bobContext.newPage();
  await openShell(alice, "ALICE");
  await openShell(bob, "BOB");
  const aliceApp = alice.locator("#app");
  const bobApp = bob.locator("#app");

  // The match, start to ceremony.
  await alice.getByTestId("online-challenge-button").click();
  await bob.getByTestId("online-refresh-button").click();
  await expect(bob.getByTestId("online-accept-button")).toBeVisible({ timeout: 15_000 });
  await bob.getByTestId("online-accept-button").click();
  await expect(bob.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(alice.getByTestId("game-state")).toHaveText("Running", { timeout: 30_000 });
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
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "move-arrived", {
    timeout: 45_000,
  });
  await alice.keyboard.press("Enter");
  await expect(aliceApp).toHaveAttribute("data-serfbound-cor-mode", "your-window", {
    timeout: 30_000,
  });
  await alice.getByTestId("online-attest-win-button").click();
  await bob.getByTestId("online-attest-loss-button").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-online-match-outcome", "ended:won", {
    timeout: 15_000,
  });

  // The rating change on the leaderboard.
  await alice.getByTestId("online-ladder").locator("summary").click();
  await expect(aliceApp).toHaveAttribute("data-serfbound-ladder-count", "2", { timeout: 15_000 });
  await expect(alice.locator(".ladder__row--own")).toContainText("1516");

  // Both chronicles record the match.
  await expect(aliceApp).toHaveAttribute("data-serfbound-profile-history-count", "1");
  await expect(bobApp).toHaveAttribute("data-serfbound-profile-history-count", "1");

  // Deeds unlock along the way: the winner earned the online pair
  // (ENVOY + RATED) plus FIRST DEED and VICTOR; the evaluator runs on
  // its 4-second cadence.
  await alice.getByTestId("chronicle").locator("summary").click();
  await expect(alice.locator(".deed[data-achievement-id='envoy']")).toBeVisible({
    timeout: 15_000,
  });
  await expect(alice.locator(".deed[data-achievement-id='rated']")).toBeVisible();
  await expect(alice.locator(".deed[data-achievement-id='victor']")).toBeVisible();

  // Privacy sweep: the local stores are exactly the recorded set. The
  // licensed package and custom-map library stores are expected now;
  // gamification still creates no extra storage.
  const databases = await alice.evaluate(async () =>
    (await indexedDB.databases()).map((database) => database.name).sort(),
  );
  expect(databases).toEqual([
    "serfbound-custom-maps",
    "serfbound-imported-data",
    "serfbound-licensed-assets",
    "serfbound-local-game-saves",
    "serfbound-profile",
  ]);

  await aliceContext.close();
  await bobContext.close();
});
