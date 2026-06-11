import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-29-04 (gate): the shell online surface completes a real
// correspondence match through real identity + mailbox services — two
// isolated browser contexts (two devices), device-key sign-in, the
// challenge lobby, signed window moves, recap verification, and the
// dual-attestation finish. The services here are the same code the
// deployed backbone runs; the public-URL run is recorded as manual
// evidence.

const identityPort = 43271;
const mailboxPort = 43272;
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
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-online-e2e-"));
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

  await aliceContext.close();
  await bobContext.close();
});
