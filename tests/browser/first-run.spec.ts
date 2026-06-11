import { expect, test } from "@playwright/test";

import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

// SB-32-03: a stranger's first minute — the welcome answers
// what/why/how, drag-drop and the picker share one import path,
// errors are designed and recoverable, and a returning player is
// not re-greeted.

test("the welcome greets, takes a dropped file, and steps aside", async ({ page }) => {
  await page.goto("/?seed=6235842872325272");

  // The welcome composition answers the journey without the docs.
  await expect(page.getByTestId("welcome-screen")).toBeVisible();
  await expect(page.getByTestId("welcome-drop-zone")).toBeVisible();
  await expect(page.getByTestId("welcome-screen")).toContainText(
    "Your data never leaves this device",
  );
  await expect(page.getByTestId("welcome-screen")).toContainText("demo");

  // Drag-drop import: same path as the picker.
  await page.evaluate((bytes) => {
    const data = new DataTransfer();
    data.items.add(new File([new Uint8Array(bytes)], "SPAU.PA"));
    const zone = document.querySelector("[data-testid='welcome-drop-zone']");
    zone?.dispatchEvent(
      new DragEvent("drop", { dataTransfer: data, bubbles: true, cancelable: true }),
    );
  }, Array.from(createDecodableGeneratedPaArchive()));

  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-chrome", "title");
  await expect(page.getByTestId("welcome-screen")).toBeHidden();
});

test("a wrong file is a designed, recoverable moment", async ({ page }) => {
  await page.goto("/?seed=6235842872325272");

  await page.getByTestId("data-import-input").setInputFiles({
    name: "README.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not game data"),
  });

  // The error speaks where the player is looking — on the welcome —
  // and in the data group; nothing is lost.
  await expect(page.getByTestId("welcome-error")).toBeVisible();
  await expect(page.getByTestId("welcome-error")).toContainText("README.txt cannot be used");
  await expect(page.getByTestId("data-state")).toHaveText("File not usable");
  await expect(page.getByTestId("welcome-screen")).toBeVisible();

  // Recovery is the same gesture again.
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.getByTestId("welcome-error")).toBeHidden();
  await expect(page.getByTestId("welcome-screen")).toBeHidden();
});

test("a returning settler is not re-greeted", async ({ page }) => {
  await page.goto("/?seed=6235842872325272");
  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(createDecodableGeneratedPaArchive()),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");

  // Reload: stored data restores straight to the title composition.
  await page.reload();
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-chrome", "title", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("welcome-screen")).toBeHidden();
});
