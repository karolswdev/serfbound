// SB-29-02: prove the containerized services are the same services.
// Builds the identity and mailbox images, runs them with stores on a
// mounted volume, points the existing contract suites at them via the
// URL-override mode, and proves the store survives a container
// restart. Opt-in: requires a running Docker daemon. Nothing here
// talks to any cluster.

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const IDENTITY_PORT = 43110;
const MAILBOX_PORT = 43120;
const IDENTITY_NAME = "serfbound-identity-test";
const MAILBOX_NAME = "serfbound-mailbox-test";
const volumeRoot = join(repoRoot, ".tmp", `service-containers-${process.pid}`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  }
}

function docker(...args) {
  run("docker", args);
}

function cleanup() {
  spawnSync("docker", ["rm", "-f", IDENTITY_NAME], { stdio: "ignore" });
  spawnSync("docker", ["rm", "-f", MAILBOX_NAME], { stdio: "ignore" });
  rmSync(volumeRoot, { recursive: true, force: true });
}

async function waitForHttp(url, label, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fetch(url, { signal: AbortSignal.timeout(1000) });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error(`${label} did not answer at ${url}`);
}

const daemon = spawnSync("docker", ["info"], { stdio: "ignore" });
if (daemon.status !== 0) {
  console.error("test-services-containers: the Docker daemon is not running.");
  process.exit(1);
}

try {
  console.log("== building images");
  docker("build", "-t", "serfbound-identity:test", "services/identity");
  docker("build", "-t", "serfbound-mailbox:test", "services/mailbox");

  if (!existsSync(join(repoRoot, "packages", "app", "dist"))) {
    console.log("== building workspace (contract suites import @serfbound/app)");
    run("npm", ["run", "build"]);
  }

  console.log("== starting containers (stores on mounted volumes)");
  cleanup();
  mkdirSync(join(volumeRoot, "identity"), { recursive: true });
  docker(
    "run", "-d", "--name", IDENTITY_NAME,
    "-p", `127.0.0.1:${IDENTITY_PORT}:4310`,
    "-v", `${join(volumeRoot, "identity")}:/data`,
    "serfbound-identity:test",
  );

  const identityUrl = `http://127.0.0.1:${IDENTITY_PORT}`;
  const mailboxUrl = `http://127.0.0.1:${MAILBOX_PORT}`;
  await waitForHttp(identityUrl, "identity container");

  // Each mailbox-backed suite gets a fresh container store, mirroring
  // the per-file isolation the in-process mode provides.
  async function freshMailbox() {
    spawnSync("docker", ["rm", "-f", MAILBOX_NAME], { stdio: "ignore" });
    rmSync(join(volumeRoot, "mailbox"), { recursive: true, force: true });
    mkdirSync(join(volumeRoot, "mailbox"), { recursive: true });
    docker(
      "run", "-d", "--name", MAILBOX_NAME,
      "-p", `127.0.0.1:${MAILBOX_PORT}:4320`,
      "-v", `${join(volumeRoot, "mailbox")}:/data`,
      "serfbound-mailbox:test",
    );
    await waitForHttp(mailboxUrl, "mailbox container");
  }

  console.log("== running the contract suites against the containers");
  run("node", ["--test", "tests/ci/service-identity.test.mjs"], {
    env: { ...process.env, SERFBOUND_IDENTITY_URL: identityUrl },
  });
  await freshMailbox();
  run("node", ["--test", "tests/ci/service-mailbox.test.mjs"], {
    env: { ...process.env, SERFBOUND_MAILBOX_URL: mailboxUrl },
  });
  await freshMailbox();
  run("node", ["--test", "tests/ci/service-ladder.test.mjs"], {
    env: { ...process.env, SERFBOUND_MAILBOX_URL: mailboxUrl },
  });

  console.log("== proving the store survives a container restart");
  const { fetchIdentity, generateIdentityKeys, registerIdentity } = await import("@serfbound/app");
  const keys = await generateIdentityKeys();
  const identity = await registerIdentity(identityUrl, keys, "restart");
  docker("restart", IDENTITY_NAME);
  await waitForHttp(identityUrl, "restarted identity container");
  const survived = await fetchIdentity(identityUrl, identity.accountId);
  if (survived === null || survived.name !== "RESTART") {
    throw new Error("the registered account did not survive the container restart");
  }
  console.log(`   account ${identity.accountId.slice(0, 12)}… survived the restart`);

  console.log("test-services-containers: all checks passed.");
} finally {
  cleanup();
}
