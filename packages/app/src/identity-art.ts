// The identity library (SB-30-05): first-party Settlers-style avatars
// and guild heraldry, forged via PixelLab per the design standard §8
// (kin to the game's palette and pixel idiom, never imitating its
// sprites). Local-first customization — these ids live in the profile
// and never widen any service schema.

export type IdentityArtEntry = {
  readonly id: string;
  readonly name: string;
  readonly src: string;
};

export const serfboundAvatars: readonly IdentityArtEntry[] = [
  { id: "knight", name: "The Knight", src: "./avatars/knight.png" },
  { id: "builder", name: "The Builder", src: "./avatars/builder.png" },
  { id: "farmer", name: "The Farmer", src: "./avatars/farmer.png" },
  { id: "miner", name: "The Miner", src: "./avatars/miner.png" },
  { id: "fisher", name: "The Fisher", src: "./avatars/fisher.png" },
  { id: "smith", name: "The Smith", src: "./avatars/smith.png" },
  { id: "monk", name: "The Monk", src: "./avatars/monk.png" },
  { id: "trader", name: "The Trader", src: "./avatars/trader.png" },
];

export const serfboundGuilds: readonly IdentityArtEntry[] = [
  { id: "wolf", name: "Guild of the Wolf", src: "./guilds/wolf.png" },
  { id: "eagle", name: "Guild of the Eagle", src: "./guilds/eagle.png" },
  { id: "boar", name: "Guild of the Boar", src: "./guilds/boar.png" },
  { id: "oak", name: "Guild of the Oak", src: "./guilds/oak.png" },
  { id: "tower", name: "Guild of the Tower", src: "./guilds/tower.png" },
  { id: "axes", name: "Guild of the Axes", src: "./guilds/axes.png" },
  { id: "ship", name: "Guild of the Ship", src: "./guilds/ship.png" },
  { id: "stag", name: "Guild of the Stag", src: "./guilds/stag.png" },
];

export function avatarById(id: string | undefined): IdentityArtEntry | undefined {
  return serfboundAvatars.find((entry) => entry.id === id);
}

export function guildById(id: string | undefined): IdentityArtEntry | undefined {
  return serfboundGuilds.find((entry) => entry.id === id);
}
