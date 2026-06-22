import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { test } from "node:test";

import { convertDosPaArchiveToLicensedAssetPackage } from "@serfbound/assets";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

test("public licensed asset audit accepts a served manifest and verified package", async () => {
  const root = mkdtempSync(join(tmpdir(), "serfbound-public-asset-audit-"));
  const assetDir = join(root, "licensed-assets");
  const converted = convertDosPaArchiveToLicensedAssetPackage(createDecodableGeneratedPaArchive(), {
    archiveName: "SPAU.PA",
  });
  try {
    writeFileSync(join(root, "index.html"), "<!doctype html><title>Serfbound</title>\n");
    mkdirSync(assetDir, { recursive: true });
    writeFileSync(join(assetDir, "serfbound-assets.sb31.json"), converted.bytes);
    writeFileSync(
      join(assetDir, "manifest.json"),
      `${JSON.stringify({
        kind: "serfbound.licensed-asset-delivery",
        schemaVersion: 1,
        formatVersion: "sb31-runtime-v1",
        permissionRecord: "LICENSE-CONSENT.md",
        pmoStory: "SB-31-01",
        packageUrl: "serfbound-assets.sb31.json",
        packageChecksum: converted.packageChecksum,
      })}\n`,
    );

    const server = await serveStatic(root);
    try {
      const result = await runNode([
        "scripts/audit-licensed-asset-public-url.mjs",
        "--base",
        server.origin,
      ]);

      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, /serfbound-public-licensed-asset-audit-ok/);
      assert.match(result.stdout, /packageChecksum=fnv1a32:/);
      assert.match(result.stdout, /archiveName=SPAU\.PA/);
    } finally {
      await server.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

async function serveStatic(root) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const relativePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const filePath = resolve(root, relativePath);
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": mimeTypes.get(extname(filePath)) ?? "application/octet-stream",
    });
    response.end(readFileSync(filePath));
  });

  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      });
    },
  };
}

async function runNode(args) {
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = [];
  const stderr = [];
  child.stdout.on("data", (chunk) => stdout.push(chunk));
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  const code = await new Promise((resolveExit) => {
    child.on("close", resolveExit);
  });
  return {
    code,
    stdout: Buffer.concat(stdout).toString("utf8"),
    stderr: Buffer.concat(stderr).toString("utf8"),
  };
}
