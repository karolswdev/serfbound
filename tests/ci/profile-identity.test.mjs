import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import {
  avatarById,
  createProfile,
  guildById,
  isStoredSerfboundProfile,
  serfboundAvatars,
  serfboundGuilds,
  withAvatar,
  withGuild,
} from "@serfbound/app";

// SB-30-05: local-first identity — the library is complete on disk,
// the profile carries the choice, and older profiles stay valid.

test("the identity library manifest matches the committed art", () => {
  assert.equal(serfboundAvatars.length, 8);
  assert.equal(serfboundGuilds.length, 8);
  for (const entry of [...serfboundAvatars, ...serfboundGuilds]) {
    const path = join("public", entry.src.replace("./", ""));
    assert.equal(existsSync(path), true, `${entry.id} art exists at ${path}`);
    assert.equal(entry.name.length > 0, true);
  }
});

test("avatar and guild choices persist on the profile, locally", () => {
  const profile = withGuild(withAvatar(createProfile("karol"), "miner"), "oak");
  assert.equal(profile.avatarId, "miner");
  assert.equal(profile.guildId, "oak");
  assert.equal(avatarById(profile.avatarId)?.name, "The Miner");
  assert.equal(guildById(profile.guildId)?.name, "Guild of the Oak");
  assert.equal(
    isStoredSerfboundProfile(profile),
    true,
    "a customized profile is still a valid stored profile",
  );
});

test("profiles without identity choices stay valid (additive schema)", () => {
  const plain = createProfile();
  assert.equal(plain.avatarId, undefined);
  assert.equal(plain.guildId, undefined);
  assert.equal(isStoredSerfboundProfile(plain), true);
  assert.equal(avatarById(undefined), undefined);
  assert.equal(guildById("no-such-guild"), undefined, "unknown ids resolve to nothing, never throw");
});
