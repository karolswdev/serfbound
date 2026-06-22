import { expect, test } from "@playwright/test";

import { convertDosPaArchiveToLicensedAssetPackage } from "@serfbound/assets";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

test.use({ serviceWorkers: "block" });

function generatedPackageFixture(): {
  readonly archive: Uint8Array;
  readonly packageBytes: Buffer;
  readonly packageChecksum: string;
} {
  const archive = createDecodableGeneratedPaArchive();
  const converted = convertDosPaArchiveToLicensedAssetPackage(archive, {
    archiveName: "SPAU.PA",
  });
  return {
    archive,
    packageBytes: Buffer.from(converted.bytes),
    packageChecksum: converted.packageChecksum.value,
  };
}

test("hosted licensed package downloads once, restores offline from IndexedDB, and coexists with import", async ({
  page,
}) => {
  const fixture = generatedPackageFixture();
  const packagePath = "/fixtures/serfbound-assets.sb31.json";
  let packageDownloads = 0;

  await page.route(`**${packagePath}`, async (route) => {
    packageDownloads += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: fixture.packageBytes,
    });
  });

  await page.goto(
    `/?licensedAssetPackage=${encodeURIComponent(packagePath)}` +
      `&licensedAssetChecksum=${fixture.packageChecksum}`,
  );
  await expect(page.getByTestId("data-state")).toHaveText("Licensed package ready");
  await expect(page.getByTestId("data-source-state")).toHaveText("Licensed package");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-active-data-source",
    "licensed-asset-package",
  );
  await expect(page.getByTestId("start-game-button")).toBeEnabled();
  expect(packageDownloads).toBe(1);

  await page.unroute(`**${packagePath}`);
  await page.route(`**${packagePath}`, async (route) => {
    packageDownloads += 1;
    await route.abort();
  });
  await page.reload();
  await expect(page.getByTestId("data-state")).toHaveText("Licensed package ready");
  await expect(page.getByTestId("data-source-state")).toHaveText("Licensed package");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-licensed-asset-state", "restored");
  expect(packageDownloads).toBe(1);

  await page.getByTestId("data-import-input").setInputFiles({
    name: "SPAU.PA",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(fixture.archive),
  });
  await expect(page.getByTestId("data-state")).toHaveText("Data imported");
  await expect(page.getByTestId("data-source-state")).toHaveText("Imported data");
  await expect(page.locator("#app")).toHaveAttribute(
    "data-serfbound-active-data-source",
    "imported-dos-pa",
  );
});

test("checksum-mismatched hosted package is recoverable and never activates", async ({ page }) => {
  const fixture = generatedPackageFixture();
  const packagePath = "/fixtures/serfbound-assets-bad.sb31.json";

  await page.route(`**${packagePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: fixture.packageBytes,
    });
  });

  await page.goto(`/?licensedAssetPackage=${encodeURIComponent(packagePath)}&licensedAssetChecksum=00000000`);
  await expect(page.getByTestId("data-state")).toHaveText("Licensed package unavailable");
  await expect(page.getByTestId("data-source-state")).toHaveText("No data");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-licensed-asset-state", "error");
  await expect(page.locator("#app")).toHaveAttribute("data-serfbound-active-data-source", "none");
  await expect(page.getByTestId("start-game-button")).toBeDisabled();
});
