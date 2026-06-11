import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-32-04: the competitive surfaces are designed states, not raw
// text — the sign-in explainer, the quiet lobby, the challenge card,
// and the chronicle.

const identityPort = 43281;
const mailboxPort = 43282;
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
  storeDir = mkdtempSync(join(tmpdir(), "serfbound-online-states-"));
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

test("sign-in, the quiet lobby, the challenge card, the chronicle", async ({ page }) => {
  await page.goto(
    `/?seed=6235842872325272&window=512` +
      `&identityApi=http://127.0.0.1:${identityPort}` +
      `&mailboxApi=http://127.0.0.1:${mailboxPort}`,
  );

  // The privacy posture is presented, not buried.
  await expect(page.locator(".panel-group--online")).toContainText("nothing to leak");
  await expect(page.getByTestId("profile-chronicle")).toHaveText("No matches yet");

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  const profileInput = page.getByTestId("profile-name-input");
  await profileInput.fill("HERALD");
  await profileInput.blur();
  await page.getByTestId("online-signin-button").click();
  await expect(page.getByTestId("online-state")).toHaveText("Signed in as HERALD", {
    timeout: 15_000,
  });

  // The empty lobby is a designed state.
  await page.getByTestId("online-refresh-button").click();
  await expect(page.locator(".lobby-empty")).toContainText("The lobby is quiet", {
    timeout: 15_000,
  });

  // A posted challenge becomes a card: who, on what terms, one action.
  await page.getByTestId("online-challenge-button").click();
  await expect(page.locator(".lobby-card__name")).toHaveText("HERALD", { timeout: 15_000 });
  await expect(page.locator(".lobby-card__terms")).toContainText("512-tick windows");
  await expect(page.getByTestId("online-accept-button")).toBeVisible();
});
