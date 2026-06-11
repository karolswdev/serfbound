import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-32-02: the shell's chrome follows the player's journey — three
// distinct compositions (design standard §4), keyed by
// data-serfbound-chrome on the root.

test("the chrome walks pre-import -> title -> running", async ({ page }) => {
  await page.goto("/?seed=6235842872325272");
  const app = page.locator("#app");

  // A cold visit: the data group leads the journey.
  await expect(app).toHaveAttribute("data-serfbound-chrome", "pre-import");
  await expect(page.getByTestId("onboarding-banner")).toBeVisible();

  // Imported data: the title composition, START in the realm group.
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(app).toHaveAttribute("data-serfbound-chrome", "title");

  // Running: the chrome yields — the wordmark shrinks, the kicker
  // goes, the game owns the screen.
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await expect(app).toHaveAttribute("data-serfbound-chrome", "running");
  const kicker = page.locator(".scene__toolbar .scene__kicker");
  await expect(kicker).toBeHidden();
  const heroSize = await page
    .locator("h1")
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  expect(heroSize).toBeLessThan(24);

  // One surface, one moment: running hides the start surface, keeps
  // the session controls, and the diagnostics stay in the closed
  // ledger (the in-game original-art UI is the control surface).
  await expect(page.getByTestId("save-game-button")).toBeEnabled();
  await expect(page.getByTestId("start-game-button")).toBeHidden();
  await expect(page.getByTestId("build-flag-button")).toBeHidden();
  await expect(page.getByTestId("dev-ledger")).toBeVisible();
  await expect(page.getByTestId("pointer-state")).toBeHidden();
});
