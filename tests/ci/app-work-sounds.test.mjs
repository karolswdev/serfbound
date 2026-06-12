import assert from "node:assert/strict";
import { test } from "node:test";

import { workActionSound } from "@serfbound/app";
import { sfxType } from "@serfbound/assets";

const at = (overrides) => ({
  workBuildingType: 0,
  state: 11,
  workStage: 0,
  frameSprite: 0,
  previousFrameSprite: -1,
  ...overrides,
});

test("the sound of work rides the animation frames (SB-38-05)", () => {
  // The lumberjack's axe lands on the swing frames...
  assert.equal(
    workActionSound(at({ workBuildingType: 2, frameSprite: 0x85, previousFrameSprite: 0x84 })),
    sfxType.axeBlow,
  );
  // ...a held frame stays silent...
  assert.equal(
    workActionSound(at({ workBuildingType: 2, frameSprite: 0x85, previousFrameSprite: 0x85 })),
    null,
  );
  // ...and the last chop is the crash of the fall.
  assert.equal(
    workActionSound(
      at({ workBuildingType: 2, workStage: 4, frameSprite: 0x86, previousFrameSprite: 0x84 }),
    ),
    sfxType.treeFall,
  );

  // The stonecutter's pick and the forester's planting dig.
  assert.equal(
    workActionSound(at({ workBuildingType: 4, frameSprite: 0x86, previousFrameSprite: 0x84 })),
    sfxType.pickBlow,
  );
  assert.equal(
    workActionSound(at({ workBuildingType: 9, frameSprite: 0x87, previousFrameSprite: 0x85 })),
    sfxType.planting,
  );

  // The saw in the sawmill's frame windows; off-window is silence.
  assert.equal(
    workActionSound(at({ workBuildingType: 17, frameSprite: 0xbb, previousFrameSprite: 0xb9 })),
    sfxType.sawing,
  );
  assert.equal(
    workActionSound(at({ workBuildingType: 17, frameSprite: 0xb4, previousFrameSprite: 0xb3 })),
    null,
  );

  // The butcher's backsword, the farmer's scythe, the fisher's reel
  // (but not on his idle holds).
  assert.equal(
    workActionSound(at({ workBuildingType: 13, frameSprite: 0xc2, previousFrameSprite: 0xc1 })),
    sfxType.backswordBlow,
  );
  assert.equal(
    workActionSound(at({ workBuildingType: 12, frameSprite: 0x88, previousFrameSprite: 0x87 })),
    sfxType.mowing,
  );
  assert.equal(
    workActionSound(at({ workBuildingType: 1, frameSprite: 0x89, previousFrameSprite: 0x88 })),
    sfxType.fishingRodReel,
  );
  assert.equal(
    workActionSound(at({ workBuildingType: 1, frameSprite: 0x87, previousFrameSprite: 0x89 })),
    null,
  );

  // The builder's hammer on (frame & 7) == 4/5; the digger's shovel;
  // the geologist's sample tap; the clash of a fight.
  assert.equal(
    workActionSound(at({ state: 9, frameSprite: 0x84, previousFrameSprite: 0x83 })),
    sfxType.hammerBlow,
  );
  assert.equal(
    workActionSound(at({ state: 8, frameSprite: 0x83, previousFrameSprite: 0x82 })),
    sfxType.digging,
  );
  assert.equal(
    workActionSound(at({ state: 18, frameSprite: 0x8e, previousFrameSprite: 0x8d })),
    sfxType.geologistSampling,
  );
  const fightClip = workActionSound(at({ state: 13, frameSprite: 0x91, previousFrameSprite: 0x90 }));
  assert.equal(
    [sfxType.fight01, sfxType.fight02, sfxType.fight03, sfxType.fight04].includes(fightClip),
    true,
  );

  // A profession with no rule stays silent.
  assert.equal(
    workActionSound(at({ workBuildingType: 15, frameSprite: 0x85, previousFrameSprite: 0x84 })),
    null,
  );
});
