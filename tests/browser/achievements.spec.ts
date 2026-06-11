import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-30-03: deeds unlock from real play, speak once through the
// original notice, render in the chronicle, and persist — accountless,
// offline, never blocking the game.

test("deeds unlock from play, render, and persist", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/?dev=1&seed=6235842872325272");
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  // The first deed needs only the data (the evaluator runs every 4s).
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-achievement-count", "1", {
    timeout: 15_000,
  });
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-notification",
    /DEED DONE - THE REALM AWAKENS/,
    { timeout: 15_000 },
  );

  // Play continues untouched underneath; the chronicle shows the deed.
  await page.getByTestId("start-game-button").click();
  await expect(page.getByTestId("game-state")).toHaveText("Running", { timeout: 15_000 });
  await page.getByTestId("chronicle").locator("summary").click();
  await expect(page.locator(".deed[data-achievement-id='realm-awakens']")).toBeVisible();
  await expect(page.locator(".deed[data-achievement-id='realm-awakens']")).toContainText(
    "THE REALM AWAKENS",
  );

  // Saving earns KEEPER.
  await page.getByTestId("save-game-button").click();
  await expect(page.locator(".deed[data-achievement-id='keeper']")).toBeVisible({
    timeout: 15_000,
  });

  // Deeds survive the reload — accountless, offline, local.
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-achievement-count",
    /^[12]/,
    { timeout: 15_000 },
  );
  await page.getByTestId("chronicle").locator("summary").click();
  await expect(page.locator(".deed[data-achievement-id='realm-awakens']")).toBeVisible();
});
