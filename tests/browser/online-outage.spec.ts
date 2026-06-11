import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-29-04 (outage regression): with the online backbone unreachable,
// import, play, and save are untouched, and the online surface reports
// unavailability recoverably. The phase's non-negotiable: the shell
// must never block play when api.serfbound.com is down.

test("a dead online service costs accountless play nothing", async ({ page }) => {
  // Port 9 (discard) — nothing answers; every online call fails fast.
  await page.goto("/?seed=6235842872325272&api=http://127.0.0.1:9");
  const app = page.locator("#app");

  // The online surface reports the outage recoverably when asked...
  await page.getByTestId("online-refresh-button").click();
  await expect(page.getByTestId("online-state")).toHaveText("Online unavailable", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("online-detail")).toContainText("Local play is unaffected");
  await expect(app).toHaveAttribute("data-serfbound-online-status", "unavailable");

  // ...and sign-in failure is a message, not a hang or a crash.
  await page.getByTestId("online-signin-button").click();
  await expect(page.getByTestId("online-state")).toHaveText("Online unavailable", {
    timeout: 15_000,
  });

  // Meanwhile the entire local loop works: import, start, save.
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await page.getByTestId("save-game-button").click();
  await expect(page.getByTestId("save-state")).toContainText("Game saved", { timeout: 15_000 });

  // The outage stays recoverable — retrying is always allowed and
  // play continues underneath.
  await page.getByTestId("online-refresh-button").click();
  await expect(app).toHaveAttribute("data-serfbound-online-status", "unavailable");
  await expect(page.getByTestId("game-state")).toHaveText("Running");
});
