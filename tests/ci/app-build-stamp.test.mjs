import assert from "node:assert/strict";
import { test } from "node:test";

import { formatBuildStamp } from "@serfbound/app";

// SB-20-05: the pure formatter behind serfbound.com's visible build
// stamp. It turns the deploy-time version.json into a short label so a
// player can tell which tag and commit they are on.

test("a tagged release reads as tag · short-commit", () => {
  const label = formatBuildStamp({
    version: "v0.2.0",
    tag: "v0.2.0",
    commit: "c13ba0b8b29366b327924614029dd10d0c8858a5",
    builtAtIso: "2026-06-13T00:00:00.000Z",
  });
  assert.equal(label, "v0.2.0 · c13ba0b");
});

test("a tag wins over a branch-name version", () => {
  const label = formatBuildStamp({
    version: "main",
    tag: "v0.2.0",
    commit: "abcdef0123456789",
  });
  assert.equal(label, "v0.2.0 · abcdef0");
});

test("a dispatch off a branch with no tag reads as dev build", () => {
  // The old shape (version=main, no tag) the site served before this story.
  assert.equal(
    formatBuildStamp({ version: "main", commit: "c13ba0b8b29366" }),
    "dev build · c13ba0b",
  );
  assert.equal(formatBuildStamp({ version: "dev" }), "dev build");
});

test("a real version (no tag field) still reads as the release", () => {
  assert.equal(formatBuildStamp({ version: "v0.1.0", commit: "0123456" }), "v0.1.0 · 0123456");
});

test("garbage and missing input degrade to a bare dev build, not a throw", () => {
  assert.equal(formatBuildStamp(null), "dev build");
  assert.equal(formatBuildStamp(undefined), "dev build");
  assert.equal(formatBuildStamp("not an object"), "dev build");
  assert.equal(formatBuildStamp({}), "dev build");
  // A non-hex / too-short commit is not appended.
  assert.equal(formatBuildStamp({ tag: "v9.9.9", commit: "nothex" }), "v9.9.9");
  assert.equal(formatBuildStamp({ tag: "v9.9.9", commit: "abc" }), "v9.9.9");
});
