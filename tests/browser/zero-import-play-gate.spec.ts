import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { extname, resolve, sep } from "node:path";
import { expect, test } from "@playwright/test";

import { convertDosPaArchiveToLicensedAssetPackage } from "@serfbound/assets";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

function generatedPackageFixture(): {
  readonly packageBytes: Buffer;
  readonly packageChecksum: string;
} {
  const converted = convertDosPaArchiveToLicensedAssetPackage(createDecodableGeneratedPaArchive(), {
    archiveName: "SPAU.PA",
  });
  return {
    packageBytes: Buffer.from(converted.bytes),
    packageChecksum: converted.packageChecksum.value,
  };
}

const packagePath = "serfbound-generated.sb31.json";

const mimeTypes = new Map<string, string>([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
]);

async function withLicensedAssetServer(
  fixture: ReturnType<typeof generatedPackageFixture>,
  run: (origin: string) => Promise<void>,
): Promise<void> {
  const distRoot = resolve(process.cwd(), "dist");
  const manifestBytes = Buffer.from(
    `${JSON.stringify({
      kind: "serfbound.licensed-asset-delivery",
      schemaVersion: 1,
      formatVersion: "sb31-runtime-v1",
      permissionRecord: "LICENSE-CONSENT.md",
      pmoStory: "SB-31-01",
      packageUrl: packagePath,
      packageChecksum: {
        algorithm: "fnv1a32",
        value: fixture.packageChecksum,
      },
    })}\n`,
  );
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/licensed-assets/manifest.json") {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
      });
      response.end(manifestBytes);
      return;
    }
    if (url.pathname === `/licensed-assets/${packagePath}`) {
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
      });
      response.end(fixture.packageBytes);
      return;
    }

    const relativePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    let filePath = resolve(distRoot, relativePath);
    if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = resolve(distRoot, "index.html");
    }
    response.writeHead(200, {
      "content-type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
    });
    response.end(readFileSync(filePath));
  });

  await new Promise<void>((resolveListen) => {
    server.listen(0, "127.0.0.1", resolveListen);
  });
  try {
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await closeServer(server);
  }
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) {
        rejectClose(error);
        return;
      }
      resolveClose();
    });
  });
}

test("zero-import first visit starts from a hosted manifest, then starts offline from cache", async ({
  page,
}) => {
  const fixture = generatedPackageFixture();
  let packageDownloads = 0;
  page.on("request", (request) => {
    if (request.url().endsWith(`/licensed-assets/${packagePath}`)) {
      packageDownloads += 1;
    }
  });

  await withLicensedAssetServer(fixture, async (origin) => {
    await page.goto(`${origin}/`);
    await expect(page.getByTestId("data-state")).toHaveText("Licensed package ready");
    await expect(page.getByTestId("data-source-state")).toHaveText("Licensed package");
    await expect(page.locator("#app")).toHaveAttribute(
      "data-serfbound-active-data-source",
      "licensed-asset-package",
    );
    await page.getByTestId("start-game-button").click();
    await expect(page.getByTestId("game-state")).toHaveText("Running");
    await expect(page.locator("#app")).toHaveAttribute("data-serfbound-start-mode", "licensed-package");
    expect(packageDownloads).toBe(1);

    await page.evaluate(async () => {
      await navigator.serviceWorker?.ready;
    });
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByTestId("data-state")).toHaveText("Licensed package ready");
    await expect(page.locator("#app")).toHaveAttribute("data-serfbound-licensed-asset-state", "restored");
    await page.getByTestId("start-game-button").click();
    await expect(page.getByTestId("game-state")).toHaveText("Running");
    expect(packageDownloads).toBe(1);
    await page.context().setOffline(false);
  });
});
