import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-33-05 gate slice: accountless play must not merely survive a
// dead backbone; it must avoid the online backbone entirely until the
// player chooses an online action.

test("accountless import, start, and save emit zero online requests", async ({ page }) => {
  const onlineRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin === "http://127.0.0.1:9" || url.hostname === "api.serfbound.com") {
      onlineRequests.push(request.url());
    }
  });

  await page.goto("/?seed=6235842872325272&api=http://127.0.0.1:9");
  const app = page.locator("#app");

  await expect(page.getByTestId("signin-accountless-note")).toContainText(
    "no registration, no sign-in, no network",
  );
  await expect(page.getByTestId("online-state")).toHaveText("Signed out");
  await expect(app).toHaveAttribute("data-serfbound-signin-status", "idle");
  await expect(app).toHaveAttribute("data-serfbound-online-status", "signed-out");

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported", { timeout: 15_000 });

  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });

  await page.getByTestId("save-game-button").click();
  await expect(page.getByTestId("save-state")).toContainText("Game saved", { timeout: 15_000 });

  expect(onlineRequests, "accountless local play should not touch online APIs").toEqual([]);
  await expect(app).toHaveAttribute("data-serfbound-online-status", "signed-out");
});
