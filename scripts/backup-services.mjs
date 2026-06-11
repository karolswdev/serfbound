// SB-29-03: zero-cost store backups for the deployed services. Reads
// each service's JSON store out of its running pod into the local
// gitignored boundary; restore writes a snapshot back and restarts
// the deployment so the service reloads it. Maintainer-run (no paid
// off-cluster storage at current stakes — the hosting decision
// record's cost ceiling).
//
//   node scripts/backup-services.mjs backup
//   node scripts/backup-services.mjs restore <backup-dir>
//
// Requires KUBECONFIG (or the default at
// serfbound-local-data/infra/dev-kubeconfig.yaml).

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SERVICES = [
  { name: "identity", storeFile: "accounts.json" },
  { name: "mailbox", storeFile: "matches.json" },
];
const BACKUP_ROOT = join("serfbound-local-data", "backups");

if (!process.env.KUBECONFIG) {
  process.env.KUBECONFIG = join("serfbound-local-data", "infra", "dev-kubeconfig.yaml");
}

function kubectl(args, options = {}) {
  const result = spawnSync("kubectl", ["-n", "serfbound", ...args], {
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`kubectl ${args.join(" ")} failed: ${result.stderr ?? ""}`);
  }
  return result.stdout ?? "";
}

const mode = process.argv[2];

if (mode === "backup") {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(BACKUP_ROOT, stamp);
  mkdirSync(dir, { recursive: true });
  for (const service of SERVICES) {
    const body = kubectl([
      "exec", `deploy/${service.name}`, "--",
      "sh", "-c", `cat /data/${service.storeFile} 2>/dev/null || echo '{}'`,
    ]);
    JSON.parse(body); // refuse to write a corrupt snapshot
    writeFileSync(join(dir, service.storeFile), body);
    console.log(`backed up ${service.name} → ${join(dir, service.storeFile)} (${body.length} bytes)`);
  }
  console.log(`backup complete: ${dir}`);
} else if (mode === "restore") {
  const dir = process.argv[3];
  if (!dir || !existsSync(dir)) {
    console.error("restore requires an existing backup directory");
    process.exit(1);
  }
  for (const service of SERVICES) {
    const snapshot = readFileSync(join(dir, service.storeFile), "utf8");
    JSON.parse(snapshot); // refuse to restore a corrupt snapshot
    kubectl(
      ["exec", "-i", `deploy/${service.name}`, "--", "sh", "-c", `cat > /data/${service.storeFile}`],
      { input: snapshot },
    );
    kubectl(["rollout", "restart", `deploy/${service.name}`]);
    kubectl(["rollout", "status", `deploy/${service.name}`, "--timeout=120s"]);
    console.log(`restored ${service.name} from ${join(dir, service.storeFile)}`);
  }
  console.log("restore complete");
} else {
  console.error("usage: node scripts/backup-services.mjs backup | restore <backup-dir>");
  process.exit(1);
}
