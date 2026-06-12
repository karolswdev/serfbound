import { FreeserfRandom, type Direction } from "./index.js";
import {
  buildingConstructionCosts,
  isMilitaryBuildingType,
  militaryGoldCap,
  militaryKnightsNeeded,
  type FlagResourceSlot,
  type SerfboundGameWorld,
  type WorldBuilding,
  type WorldFlag,
} from "./game-world.js";
import {
  inventoryPromoteSerfToKnight,
  inventoryTakeResource,
  inventoryTakeSerf,
  resourceType,
} from "./inventory.js";
import {
  buildingType,
  isStoneObject,
  isTreeObject,
  mapObject,
} from "./map-generator-extra.js";

// Serf state machine core ported from Freeserf.Core/Serf.cs (spawning,
// walking, entering/leaving buildings). Professions, transport, and combat
// land in later stories. The reference update pattern is preserved exactly:
//   delta = gameTick - serf.tick; serf.tick = gameTick; counter -= delta;
//   while (counter < 0) step();

export const serfState = {
  null: 0,
  idleInStock: 1,
  walking: 2,
  transporting: 3,
  enteringBuilding: 4,
  leavingBuilding: 5,
  readyToEnter: 6,
  readyToLeave: 7,
  digging: 8,
  building: 9,
  idleOnPath: 10,
  working: 11,
  knightMarching: 12,
  knightAttacking: 13,
  knightDefending: 14,
  knightAttackingVictory: 15,
  dead: 16,
  // Reference DropResourceOut (SB-36-01): a serf stands at the
  // inventory's flag with the resource in his arms, waiting to set
  // it down.
  dropResourceOut: 17,
} as const;

export type SerfStateValue = (typeof serfState)[keyof typeof serfState];

// lumberjack, stonecutter, forester, sawmill, fisher, farm, mill, baker,
// pig farm, butcher, the four mines, both smelters, toolmaker, weaponsmith
const workedBuildingTypes = new Set<number>([
  2, 4, 9, 17, 1, 12, 15, 16, 14, 13, 5, 6, 7, 8, 18, 23, 19, 20,
]);

// Demand routing: which completed buildings consume a product directly.
const productConsumers: Readonly<Record<number, readonly number[]>> = {
  6: [17], // lumber -> sawmill
  3: [15, 14], // wheat -> mill, pig farm
  4: [16], // flour -> baker
  1: [13], // pig -> butcher
  0: [5, 6, 7, 8], // fish -> mines
  5: [5, 6, 7, 8], // bread -> mines
  2: [5, 6, 7, 8], // meat -> mines
  12: [18, 20, 23], // coal -> steel smelter, weaponsmith, gold smelter
  10: [18], // iron ore -> steel smelter
  13: [23], // gold ore -> gold smelter
  11: [19, 20], // steel -> toolmaker, weaponsmith
  14: [11, 21, 22], // gold bars -> occupied huts, towers, fortresses
};

// The reference building stock book (SB-36-05): slots from the
// worker's InitBuilding calls (maximum 8 per input), priorities from
// Building.Update — a player distribution policy decayed by the
// delivered + in-flight total (policy >> (8 + total)), or the
// always-hungry inputs at 0xff >> total. The policies are the
// Player.Reset*Priority defaults until SB-36-07's priority book
// makes them player data.
type StockSlotSpec = {
  readonly resources: readonly number[];
  readonly maximum: number;
  readonly policy: number | "always";
};

const groupFood: readonly number[] = [
  resourceType.fish,
  resourceType.bread,
  resourceType.meat,
];

const buildingStockSpecs: Readonly<Record<number, readonly StockSlotSpec[]>> = {
  3: [{ resources: [resourceType.plank], maximum: 8, policy: 3275 }], // boatbuilder
  5: [{ resources: groupFood, maximum: 8, policy: 13100 }], // stone mine
  6: [{ resources: groupFood, maximum: 8, policy: 45850 }], // coal mine
  7: [{ resources: groupFood, maximum: 8, policy: 45850 }], // iron mine
  8: [{ resources: groupFood, maximum: 8, policy: 65500 }], // gold mine
  13: [{ resources: [resourceType.pig], maximum: 8, policy: "always" }], // butcher
  14: [{ resources: [resourceType.wheat], maximum: 8, policy: 65500 }], // pig farm
  15: [{ resources: [resourceType.wheat], maximum: 8, policy: 32750 }], // mill
  16: [{ resources: [resourceType.flour], maximum: 8, policy: "always" }], // baker
  17: [{ resources: [resourceType.lumber], maximum: 8, policy: "always" }], // sawmill
  18: [
    { resources: [resourceType.coal], maximum: 8, policy: 32750 },
    { resources: [resourceType.ironOre], maximum: 8, policy: "always" },
  ], // steel smelter
  19: [
    { resources: [resourceType.plank], maximum: 8, policy: 19650 },
    { resources: [resourceType.steel], maximum: 8, policy: 45850 },
  ], // toolmaker
  20: [
    { resources: [resourceType.coal], maximum: 8, policy: 52400 },
    { resources: [resourceType.steel], maximum: 8, policy: 65500 },
  ], // weaponsmith
  23: [
    { resources: [resourceType.coal], maximum: 8, policy: 65500 },
    { resources: [resourceType.goldOre], maximum: 8, policy: "always" },
  ], // gold smelter
};

// Mine building type -> [deposit mineral value, ore resource value].
const mineDeposits: Readonly<Record<number, readonly [number, number]>> = {
  5: [4, 9], // stone mine -> stone deposit -> stone
  6: [3, 12], // coal mine -> coal -> coal
  7: [2, 10], // iron mine -> iron -> iron ore
  8: [1, 13], // gold mine -> gold -> gold ore
};

const minerFoods: readonly number[] = [resourceType.fish, resourceType.bread, resourceType.meat];

// Serf.RoadBuildingSlope per building type (SB-35-02): scales the
// door slide when entering (slope) and leaving (31 - slope) a
// finished building; unfinished sites use 1 entering / 30 leaving.
const roadBuildingSlope: readonly number[] = [
  5, 18, 18, 15, 18, 22, 22, 22, 22, 18, 16, 18, 1, 10, 1, 15,
  15, 16, 15, 15, 10, 15, 20, 15, 18,
];

// Flag.MaxTransporters by road length category (SB-36-04).
const maxTransportersByCategory: readonly number[] = [1, 2, 3, 4, 6, 8, 11, 15];

// Player.ResetFlagPriority defaults, indexed by resource type value
// (SB-36-02): the transport pecking order when several scheduled
// resources contest one direction — higher rides first (plank 26
// tops the list, gold ore 1 trails it). SB-36-07 moves this into
// the player's priority book; until then everyone runs the
// reference defaults.
const defaultFlagPriorities: readonly number[] = [
  20, 5, 19, 3, 4, 18, 22, 26, 6, 25, 21, 24, 23, 1, 2,
  14, 15, 9, 10, 8, 12, 11, 13, 7, 17, 16,
];

// Flag.routableResources: resources a flag may re-home to a consuming
// building when their destination is lost. Everything else (boat,
// tools, weapons) goes back to an inventory.
const routableResources = new Set<number>([
  resourceType.fish, resourceType.pig, resourceType.meat, resourceType.wheat,
  resourceType.flour, resourceType.bread, resourceType.lumber, resourceType.plank,
  resourceType.stone, resourceType.ironOre, resourceType.steel, resourceType.coal,
  resourceType.goldOre, resourceType.goldBar,
]);

// The working pose (SB-35-03): reference staged work at the target.
// Logging fells the tree in five visible stages (animation 116 +
// stage, the reference per-stage counters), each stage laying the
// next felled-tree map object; stonecutting is one 1535-tick cut
// (animation 123) that shrinks the pile a single slice per visit.
// INTERIM pacing (recorded): the reference stage counters are
// [1023, 31, 767, 767, 255] and 1535 — four times these. The
// condensed transport economy (single transporters, no inventory
// re-export scheduling) starves at full reference durations; the
// true constants return with Phase 36's scheduling throughput.
const loggingStageTicks: readonly number[] = [255, 31, 191, 191, 63];
const loggingAnimationBase = 116;
const stoneCuttingTicks = 383;
const stoneCuttingAnimation = 123;
// Reference Map.Object: FelledPine0 = 93, FelledTree0 = 98.
const felledPineBase = 93;
const felledTreeBase = 98;

// The reference tool order for the toolmaker's round-robin output.
const toolOutputs: readonly number[] = [15, 16, 17, 18, 19, 20, 21, 22, 23];

// Serf.cs combat tables, copied flat exactly as the reference declares them
// (the later rows are 15 entries, so sequence starts chosen by
// RandomInt() & 0x70 land mid-row — a reference quirk preserved).
const knightAttackMoves: readonly number[] = [
  1, 2, 4, 2, 0, 2, 4, 2, 1, 0, 2, 2, 3, 0, 0, -1,
  3, 2, 2, 3, 0, 4, 1, 3, 2, 4, 2, 2, 3, 0, 0, -1,
  2, 1, 4, 3, 2, 2, 2, 3, 0, 3, 1, 2, 0, 2, 0, -1,
  2, 1, 3, 2, 4, 2, 3, 0, 0, 4, 2, 0, 2, 1, 0, -1,
  3, 1, 0, 2, 2, 1, 0, 2, 4, 2, 2, 3, 0, 0, -1,
  0, 3, 1, 2, 3, 4, 2, 1, 2, 0, 2, 4, 0, 2, 0, -1,
  0, 2, 1, 2, 4, 2, 3, 0, 2, 4, 3, 2, 0, 0, -1,
  0, 0, 1, 4, 3, 2, 2, 1, 2, 0, 0, 4, 3, 0, -1,
];

const knightFightAnim: readonly number[] = [
  24, 35, 41, 56, 67, 72, 83, 89, 100, 121, 0, 0, 0, 0, 0, 0,
  26, 40, 42, 57, 73, 74, 88, 104, 106, 120, 122, 0, 0, 0, 0, 0,
  17, 18, 23, 33, 34, 38, 39, 98, 102, 103, 113, 114, 118, 119, 0, 0,
  130, 133, 134, 135, 147, 148, 161, 162, 164, 166, 167, 0, 0, 0, 0, 0,
  50, 52, 53, 70, 129, 131, 132, 146, 149, 151, 0, 0, 0, 0, 0, 0,
];

const knightFightAnimMax: readonly number[] = [10, 11, 14, 11, 10];

const directionOrder: readonly Direction[] = ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"];
const reverseOf: Record<Direction, Direction> = {
  Right: "Left",
  DownRight: "UpLeft",
  Down: "Up",
  Left: "Right",
  UpLeft: "DownRight",
  Up: "Down",
};

// Serf.CounterFromAnimation, walking rows 0..80 plus waiting 81..86.
const walkingCounterRow = [511, 447, 383, 319, 255, 319, 511, 767, 1023] as const;
export function counterFromAnimation(animation: number): number {
  if (animation < 81) {
    return walkingCounterRow[animation % 9]!;
  }

  if (animation < 87) {
    return 127;
  }

  return 255;
}

// Serf.GetWalkingAnimation: 4 + heightDifference + 9 * directionIndex.
export function walkingAnimation(
  heightDifference: number,
  direction: Direction,
  switchPosition: boolean,
): number {
  let directionIndex = directionOrder.indexOf(direction);
  if (switchPosition && directionIndex < 3) {
    directionIndex += 6;
  }

  return 4 + heightDifference + 9 * directionIndex;
}

export type WorldSerf = {
  readonly index: number;
  player: number;
  state: SerfStateValue;
  position: number;
  tick: number;
  animation: number;
  counter: number;
  // Walking state: direction stores the REVERSE of the movement direction
  // (reference encoding); negative values mean waiting (direction - 6).
  walkingDirection: number;
  walkingDestination: number;
  walkingWaitCounter: number;
  // Entering/leaving slide state.
  slopeLength: number;
  nextState: SerfStateValue;
  // Transporter assignment: the road is identified by one end flag and the
  // direction the road leaves it.
  roadFlagIndex: number;
  roadDirection: Direction | null;
  carriedResource: number;
  carriedDestination: number;
  // Builder assignment: the building this serf constructs.
  buildTargetIndex: number;
  // Profession assignment: the completed building this serf works.
  workBuildingIndex: number;
  // Profession work phase bookkeeping.
  workPhase: number;
  workCounter: number;
  workTargetPosition: number;
  // Knight assignment: the military building this knight garrisons.
  isKnight: boolean;
  garrisonTargetIndex: number;
  // Combat state: rank (Knight0..Knight4), the building under attack, the
  // fight opponent, the position in the attack-move sequence, and the
  // outcome decided up front by SetFightOutcome.
  knightRank: number;
  attackTargetIndex: number;
  fightOpponentIndex: number;
  fightMove: number;
  fightWon: boolean;
};

export class SerfboundSerfEngine {
  readonly world: SerfboundGameWorld;
  readonly serfs = new Map<number, WorldSerf>();
  // Map position -> serf index (Map.SetSerfIndex equivalent; 0 = none).
  readonly serfIndexes: Uint32Array;
  // Game.RandomInt source for combat (seeded for deterministic outcomes).
  readonly random: FreeserfRandom;
  // Production event hook (the app maps products to work-loop sounds).
  onProduct: ((buildingType: number, product: number) => void) | undefined;
  #nextSerfIndex = 1;
  readonly #dispatchedBuildings = new Set<number>();

  constructor(world: SerfboundGameWorld, random?: FreeserfRandom) {
    this.world = world;
    this.serfIndexes = new Uint32Array(world.tileCount);
    this.random = random ?? FreeserfRandom.fromWord(0x5a5a);
  }

  hasSerfAt(position: number): boolean {
    return this.serfIndexes[position] !== 0;
  }

  serfAt(position: number): WorldSerf | null {
    const index = this.serfIndexes[position]!;
    return index === 0 ? null : (this.serfs.get(index) ?? null);
  }

  // Serf.InitGeneric: spawn inside the castle inventory, consuming one of
  // its stocked generic serfs.
  spawnGenericSerf(player: number, gameTick: number): WorldSerf | null {
    const castlePosition = this.world.players[player]?.castlePosition;
    if (castlePosition === undefined || castlePosition === null) {
      return null;
    }

    const inventory = this.world.inventoryForPlayer(player);
    if (inventory === null || !inventoryTakeSerf(inventory)) {
      return null;
    }

    const serf: WorldSerf = {
      index: this.#nextSerfIndex,
      player,
      state: serfState.idleInStock,
      position: castlePosition,
      tick: gameTick,
      animation: 0,
      counter: 0,
      walkingDirection: 0,
      walkingDestination: 0,
      walkingWaitCounter: 0,
      slopeLength: 0,
      nextState: serfState.null,
      roadFlagIndex: 0,
      roadDirection: null,
      carriedResource: -1,
      carriedDestination: 0,
      buildTargetIndex: 0,
      workBuildingIndex: 0,
      workPhase: 0,
      workCounter: 0,
      workTargetPosition: -1,
      isKnight: false,
      garrisonTargetIndex: 0,
      knightRank: 0,
      attackTargetIndex: 0,
      fightOpponentIndex: 0,
      fightMove: 0,
      fightWon: false,
    };
    this.#nextSerfIndex += 1;
    this.serfs.set(serf.index, serf);
    return serf;
  }

  // Spawn a knight from the inventory's recruited knight stock.
  spawnKnightSerf(player: number, gameTick: number): WorldSerf | null {
    const inventory = this.world.inventoryForPlayer(player);
    if (inventory === null || inventory.knights <= 0) {
      return null;
    }

    // Borrow the generic spawn path, then restore the generic pool the
    // knight did not consume (knights were already promoted out of it).
    inventory.genericSerfs += 1;
    const serf = this.spawnGenericSerf(player, gameTick);
    if (serf === null) {
      inventory.genericSerfs -= 1;
      return null;
    }

    inventory.knights -= 1;
    serf.isKnight = true;
    return serf;
  }

  // Send an idle castle serf walking toward a destination flag.
  // (Condensed reference path IdleInStock -> ReadyToLeaveInventory ->
  // LeavingBuilding -> Walking; the inventory queueing arrives with
  // SB-13-03 transport scheduling.)
  callOutSerf(serf: WorldSerf, destinationFlagIndex: number, gameTick: number): boolean {
    if (serf.state !== serfState.idleInStock) {
      return false;
    }

    const castlePosition = serf.position;
    const flagPosition = this.world.move(castlePosition, "DownRight");

    serf.tick = gameTick;
    // Serf.LeaveBuilding: slide down-right from the castle door to its
    // flag at the castle's leaving slope (31 - RoadBuildingSlope).
    this.#leaveBuilding(serf, castlePosition, 31 - roadBuildingSlope[24]!, serfState.walking);
    serf.position = flagPosition;
    serf.walkingDestination = destinationFlagIndex;
    return true;
  }

  // Assign an idle castle serf as the transporter of a road. The serf walks
  // out to the road's flag and then serves it (condensed reference
  // IdleOnPath path; full wake/park behavior follows with congestion work).
  assignTransporter(
    serf: WorldSerf,
    flagIndex: number,
    direction: Direction,
    gameTick: number,
  ): boolean {
    const flag = this.world.flags.get(flagIndex);
    if (flag === undefined || !flag.paths[direction].hasPath) {
      return false;
    }

    serf.roadFlagIndex = flagIndex;
    serf.roadDirection = direction;
    flag.paths[direction].freeTransporters += 1;
    const otherFlag = this.world.flags.get(flag.paths[direction].otherFlagIndex);
    const otherDirection = flag.paths[direction].otherEndDirection;
    if (otherFlag !== undefined && otherDirection !== null) {
      otherFlag.paths[otherDirection].freeTransporters += 1;
    }

    return this.callOutSerf(serf, flagIndex, gameTick);
  }

  // Game.UpdateSerfs equivalent.
  update(gameTick: number): void {
    this.#updateAmbientDecay();
    this.#handlePathSplits(gameTick);
    this.#sweepFlagScheduling();
    this.#sweepTransportStaffing(gameTick);
    this.#sweepWorkerRequests(gameTick);
    this.#sweepInventoryExports(gameTick);
    this.#dispatchResourceOut(gameTick);
    this.#sweepMilitary(gameTick);
    for (const serf of [...this.serfs.values()]) {
      switch (serf.state) {
        case serfState.walking:
          this.#handleWalking(serf, gameTick);
          break;
        case serfState.transporting:
          this.#handleTransporting(serf, gameTick);
          break;
        case serfState.idleOnPath:
          this.#handleIdleOnPath(serf, gameTick);
          break;
        case serfState.building:
          this.#handleBuilding(serf, gameTick);
          break;
        case serfState.working:
          this.#handleWorking(serf, gameTick);
          break;
        case serfState.leavingBuilding:
          this.#handleLeavingBuilding(serf, gameTick);
          break;
        case serfState.dropResourceOut:
          this.#handleDropResourceOut(serf, gameTick);
          break;
        case serfState.enteringBuilding:
          this.#handleEnteringBuilding(serf, gameTick);
          break;
        case serfState.knightMarching:
          this.#handleKnightMarching(serf, gameTick);
          break;
        case serfState.knightAttacking:
          this.#handleKnightAttacking(serf, gameTick);
          break;
        case serfState.knightAttackingVictory:
          this.#handleKnightAttackingVictory(serf, gameTick);
          break;
        case serfState.dead:
          this.#handleDead(serf, gameTick);
          break;
        default:
          break;
      }
    }
  }

  // The door, leaving (SB-35-02): slide DownRight from the building
  // onto its flag tile, counter scaled by the leaving slope. The
  // caller sets position to the flag; the slide is the visible exit.
  #leaveBuilding(
    serf: WorldSerf,
    buildingPosition: number,
    slope: number,
    nextState: SerfStateValue,
  ): void {
    const flagPosition = this.world.move(buildingPosition, "DownRight");
    const heightDifference =
      this.world.heights[flagPosition]! - this.world.heights[buildingPosition]!;
    serf.state = serfState.leavingBuilding;
    serf.animation = walkingAnimation(heightDifference, "DownRight", false);
    serf.counter += (slope * counterFromAnimation(serf.animation)) >> 5;
    serf.nextState = nextState;
  }

  // The door, entering (SB-35-02): slide UpLeft from the flag into the
  // building; the slope length is the point where the serf passes the
  // door and vanishes inside (finished buildings by type, sites at 1).
  #enterBuilding(serf: WorldSerf, building: WorldBuilding, nextState: SerfStateValue): void {
    const heightDifference =
      this.world.heights[building.position]! - this.world.heights[serf.position]!;
    this.serfIndexes[serf.position] = 0;
    serf.position = building.position;
    serf.state = serfState.enteringBuilding;
    serf.nextState = nextState;
    serf.animation = walkingAnimation(heightDifference, "UpLeft", false);
    serf.counter += counterFromAnimation(serf.animation);
    const slope = building.isDone ? (roadBuildingSlope[building.type] ?? 15) : 1;
    serf.slopeLength = (slope * serf.counter) >> 5;
  }

  #handleLeavingBuilding(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    if (serf.counter < 0) {
      serf.counter = 0;
      serf.state = serf.nextState === serfState.null ? serfState.walking : serf.nextState;
      serf.nextState = serfState.null;
      serf.walkingDirection = directionOrder.indexOf(reverseOf["DownRight"]);
      serf.walkingWaitCounter = 0;
      this.serfIndexes[serf.position] = serf.index;
    }
  }

  #handleEnteringBuilding(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    if (serf.counter < 0 || serf.counter <= serf.slopeLength) {
      serf.counter = 0;
      serf.slopeLength = 0;
      // Inside: off the collision map.
      this.serfIndexes[serf.position] = 0;
      const next = serf.nextState === serfState.null ? serfState.idleInStock : serf.nextState;
      serf.nextState = serfState.null;
      serf.state = next;

      // A garrisoning knight takes his post as he crosses the door.
      if (serf.garrisonTargetIndex !== 0) {
        const post = this.world.buildings.get(serf.garrisonTargetIndex);
        serf.garrisonTargetIndex = 0;
        if (post !== undefined) {
          post.requestedKnights = Math.max(0, post.requestedKnights - 1);
          post.knights += 1;
          if (post.knights === 1) {
            this.world.updateLandOwnership(post.position);
          }
        }
      }
    }
  }

  // Serf.HandleSerfWalkingState, core path: follow the road to the
  // destination flag; on arrival, enter idle-at-flag (transport arrives in
  // SB-13-03).
  #handleWalking(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    while (serf.counter < 0) {
      if (serf.walkingDirection < 0) {
        // Waiting: stick to the same direction (loop handling condensed).
        serf.walkingWaitCounter += 1;
        const direction = directionOrder[serf.walkingDirection + 6]!;
        if (!this.#changeDirection(serf, direction)) {
          serf.counter = 0;
          return;
        }

        continue;
      }

      if (this.world.hasFlag(serf.position)) {
        const flag = this.world.flagAt(serf.position)!;
        if (flag.index === serf.walkingDestination || serf.walkingDestination === 0) {
          // Assigned transporters take up duty at their road's flag before
          // any building entry. Idle transporters leave the collision map
          // (the reference marks idle-on-path serfs passable).
          if (serf.roadDirection !== null && flag.index === serf.roadFlagIndex) {
            serf.state = serfState.idleOnPath;
            serf.counter = 0;
            this.serfIndexes[serf.position] = 0;
            return;
          }

          // Profession workers settle into their completed building —
          // through the door (SB-35-02).
          if (serf.workBuildingIndex !== 0 && flag.buildingIndex === serf.workBuildingIndex) {
            const workplace = this.world.buildings.get(serf.workBuildingIndex);
            if (workplace !== undefined && workplace.isDone) {
              serf.workPhase = 0;
              serf.workCounter = 0;
              this.#enterBuilding(serf, workplace, serfState.working);
              return;
            }
          }

          // Knights take their garrison post — through the door; the
          // occupation bookkeeping happens as they cross it (SB-35-02).
          if (serf.garrisonTargetIndex !== 0 && flag.buildingIndex === serf.garrisonTargetIndex) {
            const post = this.world.buildings.get(serf.garrisonTargetIndex);
            if (post !== undefined && post.isDone) {
              this.#enterBuilding(serf, post, serfState.idleInStock);
              return;
            }
          }

          // Builders slide onto their construction site (unfinished
          // sites enter at slope 1 — SB-35-02) and start working.
          if (serf.buildTargetIndex !== 0 && flag.buildingIndex === serf.buildTargetIndex) {
            const site = this.world.buildings.get(serf.buildTargetIndex);
            if (site !== undefined && !site.isDone) {
              this.#enterBuilding(serf, site, serfState.building);
              return;
            }
          }

          // Destination reached: enter the building if the flag has one,
          // otherwise idle here (SB-13-03 turns these into transporters).
          const buildingIndex = flag.buildingIndex;
          if (buildingIndex !== null) {
            const building = this.world.buildings.get(buildingIndex)!;
            this.#enterBuilding(serf, building, serfState.idleInStock);
            return;
          }

          serf.state = serfState.null;
          serf.counter = 0;
          return;
        }

        // Walk toward the destination flag through the flag graph: pick the
        // connected direction whose other end is closer to the destination
        // (condensed FlagSearch; full flag search lands with transport).
        const direction = this.#directionToward(flag.index, serf.walkingDestination);
        if (direction === null) {
          serf.state = serfState.null;
          serf.counter = 0;
          return;
        }

        if (!this.#changeDirection(serf, direction)) {
          serf.counter = 0;
          return;
        }

        continue;
      }

      // Not at a flag: follow the single road path onward (excluding where we
      // came from).
      const cameFrom = serf.walkingDirection;
      let nextDirection: Direction | null = null;
      for (const direction of directionOrder) {
        if (directionOrder.indexOf(direction) === cameFrom) {
          continue;
        }

        if (this.world.hasPath(serf.position, direction)) {
          nextDirection = direction;
          break;
        }
      }

      if (nextDirection === null) {
        serf.counter = 0;
        serf.state = serfState.null;
        return;
      }

      if (!this.#changeDirection(serf, nextDirection)) {
        serf.counter = 0;
        return;
      }
    }
  }

  // Transporters idle at one end of their road and haul the slots the
  // flag sweep scheduled out over it — highest flag priority first
  // (Flag.PrioritizePickup, SB-36-02).
  #handleIdleOnPath(serf: WorldSerf, gameTick: number): void {
    serf.tick = gameTick;
    if (serf.roadDirection === null) {
      serf.state = serfState.null;
      return;
    }

    const hereFlag = this.world.flags.get(serf.roadFlagIndex);
    if (hereFlag === undefined) {
      serf.state = serfState.null;
      return;
    }

    const path = hereFlag.paths[serf.roadDirection];
    const otherFlag = this.world.flags.get(path.otherFlagIndex);
    if (!path.hasPath || otherFlag === undefined) {
      serf.state = serfState.null;
      return;
    }

    // The serf stands at one of the two end flags; prefer hauling from there.
    const standsAtHere = serf.position === hereFlag.position;
    const fromFlag = standsAtHere ? hereFlag : otherFlag;
    const toFlag = standsAtHere ? otherFlag : hereFlag;
    const outDirection = standsAtHere
      ? serf.roadDirection
      : (path.otherEndDirection ?? serf.roadDirection);

    // Among the slots the sweep scheduled out this direction, the
    // highest flag priority rides first (Flag.PrioritizePickup).
    let pick: FlagResourceSlot | null = null;
    for (const slot of fromFlag.slots) {
      if (slot.resource < 0 || slot.scheduledDirection !== outDirection) {
        continue;
      }

      // Only haul when the far end can take the hand-over: it is the final
      // destination (buildings and inventories always accept) or it has a
      // free slot. This keeps full hub flags from wedging their own carrier.
      if (
        toFlag.index !== slot.destinationFlagIndex &&
        !toFlag.slots.some((other) => other.resource < 0)
      ) {
        continue;
      }

      if (
        pick === null ||
        (defaultFlagPriorities[slot.resource] ?? 0) > (defaultFlagPriorities[pick.resource] ?? 0)
      ) {
        pick = slot;
      }
    }

    if (pick !== null) {
      // Pick up and carry across the road.
      serf.carriedResource = pick.resource;
      serf.carriedDestination = pick.destinationFlagIndex;
      pick.resource = -1;
      pick.destinationFlagIndex = 0;
      pick.scheduledDirection = null;
      serf.state = serfState.transporting;
      serf.walkingDestination = toFlag.index;
      serf.walkingDirection = 0;
      serf.counter = 0;
      this.serfIndexes[serf.position] = serf.index;
      return;
    }

    // Nothing on this side: if the opposite end has work scheduled over
    // this road, walk back empty to fetch it.
    const returnDirection = standsAtHere
      ? (path.otherEndDirection ?? serf.roadDirection)
      : serf.roadDirection;
    for (const slot of toFlag.slots) {
      if (slot.resource < 0 || slot.scheduledDirection !== returnDirection) {
        continue;
      }

      serf.state = serfState.transporting;
      serf.walkingDestination = toFlag.index;
      serf.walkingDirection = 0;
      serf.counter = 0;
      this.serfIndexes[serf.position] = serf.index;
      return;
    }
  }

  // Transporting reuses the walking mechanics; on arrival the resource is
  // delivered into the destination building or dropped for the next road.
  #handleTransporting(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    while (serf.counter < 0) {
      if (serf.walkingDirection < 0) {
        serf.walkingWaitCounter += 1;
        const direction = directionOrder[serf.walkingDirection + 6]!;
        this.#changeDirection(serf, direction);
        continue;
      }

      if (this.world.hasFlag(serf.position)) {
        const flag = this.world.flagAt(serf.position)!;
        if (flag.index === serf.walkingDestination) {
          if (!this.#deliverCarriedResource(serf, flag)) {
            // The reference switch (TransporterMoveToFlag): a loaded
            // carrier at a full flag exchanges cargo with a slot
            // scheduled back over its own road — a full flag must
            // never wall off the road that serves it.
            if (this.#swapCargoAtFlag(serf, flag)) {
              continue;
            }

            // Nothing to swap: walk back across the road with the
            // cargo in hand and return later (the reference's
            // unconditional ChangeDirection). A carrier parked on
            // the flag tile would block the very transporters that
            // must drain it — the gridlock the maintainer's full
            // settlements wedge on.
            const back = this.#roadOtherEnd(serf, flag);
            if (back !== null) {
              serf.walkingDestination = back;
              continue;
            }

            // No road anchored here (a stray carrier): wait.
            serf.counter += 200;
            return;
          }

          serf.state = serfState.idleOnPath;
          serf.counter = 0;
          this.serfIndexes[serf.position] = 0;
          return;
        }

        const direction = this.#directionToward(flag.index, serf.walkingDestination);
        if (direction === null) {
          serf.state = serfState.idleOnPath;
          serf.counter = 0;
          this.serfIndexes[serf.position] = 0;
          return;
        }

        this.#changeDirection(serf, direction);
        continue;
      }

      const cameFrom = serf.walkingDirection;
      let nextDirection: Direction | null = null;
      for (const direction of directionOrder) {
        if (directionOrder.indexOf(direction) === cameFrom) {
          continue;
        }

        if (this.world.hasPath(serf.position, direction)) {
          nextDirection = direction;
          break;
        }
      }

      if (nextDirection === null) {
        serf.counter = 0;
        serf.state = serfState.idleOnPath;
        return;
      }

      this.#changeDirection(serf, nextDirection);
    }
  }

  // Which end of the serf's road this flag is, the direction back
  // onto the road from it, and the flag index at the far end.
  #roadEndAt(
    serf: WorldSerf,
    flag: WorldFlag,
  ): { backDirection: Direction | null; returnFlagIndex: number } | null {
    if (serf.roadDirection === null) {
      return null;
    }

    const anchorFlag = this.world.flags.get(serf.roadFlagIndex);
    if (anchorFlag === undefined) {
      return null;
    }

    const anchorPath = anchorFlag.paths[serf.roadDirection];
    if (flag.index === serf.roadFlagIndex) {
      return { backDirection: serf.roadDirection, returnFlagIndex: anchorPath.otherFlagIndex };
    }

    if (flag.index === anchorPath.otherFlagIndex) {
      return { backDirection: anchorPath.otherEndDirection, returnFlagIndex: serf.roadFlagIndex };
    }

    return null;
  }

  // The far end of the serf's road as seen from this flag, or null
  // when the flag is not one of its road's ends.
  #roadOtherEnd(serf: WorldSerf, flag: WorldFlag): number | null {
    const end = this.#roadEndAt(serf, flag);
    return end === null ? null : end.returnFlagIndex;
  }

  // TransporterMoveToFlag's resource switch: the carrier takes the
  // highest-priority slot scheduled back over its own road and leaves
  // its cargo in the freed slot (rescheduled by the next sweep), then
  // hauls the exchanged resource back across. Returns false when the
  // serf has no road anchored at this flag or nothing is scheduled
  // over it.
  #swapCargoAtFlag(serf: WorldSerf, flag: WorldFlag): boolean {
    if (serf.roadDirection === null || serf.carriedResource < 0) {
      return false;
    }

    const end = this.#roadEndAt(serf, flag);
    if (end === null || end.backDirection === null) {
      return false;
    }

    const { backDirection, returnFlagIndex } = end;

    let pick: FlagResourceSlot | null = null;
    for (const slot of flag.slots) {
      if (slot.resource < 0 || slot.scheduledDirection !== backDirection) {
        continue;
      }

      if (
        pick === null ||
        (defaultFlagPriorities[slot.resource] ?? 0) > (defaultFlagPriorities[pick.resource] ?? 0)
      ) {
        pick = slot;
      }
    }

    if (pick === null) {
      return false;
    }

    const swappedResource = pick.resource;
    const swappedDestination = pick.destinationFlagIndex;
    pick.resource = serf.carriedResource;
    pick.destinationFlagIndex = serf.carriedDestination;
    pick.scheduledDirection = null;
    serf.carriedResource = swappedResource;
    serf.carriedDestination = swappedDestination;
    serf.walkingDestination = returnFlagIndex;
    serf.walkingDirection = 0;
    serf.counter = 0;
    return true;
  }

  // Returns false when the flag has no room for a hand-over; the carrier
  // keeps the resource and retries (the reference never destroys cargo).
  #deliverCarriedResource(serf: WorldSerf, flag: import("./game-world.js").WorldFlag): boolean {
    if (serf.carriedResource < 0) {
      return true;
    }

    if (flag.index === serf.carriedDestination && flag.buildingIndex !== null) {
      // Inventory flags store into the castle stock; other buildings tally.
      if (flag.hasInventory) {
        const inventory = this.world.inventoryForPlayer(flag.player);
        if (inventory !== null) {
          inventory.resources[serf.carriedResource] =
            (inventory.resources[serf.carriedResource] ?? 0) + 1;
          serf.carriedResource = -1;
          serf.carriedDestination = 0;
          return true;
        }
      }

      const building = this.world.buildings.get(flag.buildingIndex);
      if (building !== undefined) {
        building.deliveredResources[serf.carriedResource] =
          (building.deliveredResources[serf.carriedResource] ?? 0) + 1;
        if ((building.requestedResources[serf.carriedResource] ?? 0) > 0) {
          building.requestedResources[serf.carriedResource] =
            building.requestedResources[serf.carriedResource]! - 1;
        }

        serf.carriedResource = -1;
        serf.carriedDestination = 0;
        return true;
      }
    }

    // Hand over to the next road's transporter via the flag slots.
    if (!this.world.dropResource(flag.index, serf.carriedResource, serf.carriedDestination)) {
      return false;
    }

    serf.carriedResource = -1;
    serf.carriedDestination = 0;
    return true;
  }

  readonly #staffedBuildings = new Set<number>();

  // Out the castle door (SB-36-01, reference MoveResourceOut →
  // DropResourceOut): every outbound resource is CARRIED by a serf —
  // out through the door slide, set down at the flag, and the carrier
  // walks back inside. Nothing materializes on a flag.
  #dispatchResourceOut(gameTick: number): void {
    for (const inventory of this.world.inventories.values()) {
      if (inventory.pendingOut.length === 0) {
        continue;
      }

      const flag = this.world.flags.get(inventory.flagIndex);
      if (flag === undefined || !flag.slots.some((slot) => slot.resource < 0)) {
        continue;
      }

      const castlePosition = this.world.players[inventory.player]?.castlePosition;
      if (castlePosition === undefined || castlePosition === null) {
        continue;
      }

      // One serf out the door at a time (the reference queues inside
      // via WaitForResourceOut): no new carrier while one is mid-slide
      // or standing at the flag, or carriers pile up and wall off the
      // inventory flag from the very transporters that drain it.
      let carrierOut = this.hasSerfAt(flag.position);
      if (!carrierOut) {
        for (const serf of this.serfs.values()) {
          if (
            serf.position === flag.position &&
            (serf.state === serfState.dropResourceOut ||
              serf.state === serfState.leavingBuilding)
          ) {
            carrierOut = true;
            break;
          }
        }
      }

      if (carrierOut) {
        continue;
      }

      // Prefer a serf already idle in the stock; spawn from the pool
      // otherwise. One carrier launches per update per inventory.
      let carrier: WorldSerf | null = null;
      for (const serf of this.serfs.values()) {
        if (serf.state === serfState.idleInStock && serf.position === castlePosition && !serf.isKnight) {
          carrier = serf;
          break;
        }
      }

      carrier ??= this.spawnGenericSerf(inventory.player, gameTick);
      if (carrier === null) {
        continue;
      }

      const next = inventory.pendingOut.shift()!;
      carrier.carriedResource = next.resource;
      carrier.carriedDestination = next.destinationFlagIndex;
      carrier.tick = gameTick;
      this.#leaveBuilding(
        carrier,
        castlePosition,
        31 - roadBuildingSlope[24]!,
        serfState.dropResourceOut,
      );
      carrier.position = this.world.move(castlePosition, "DownRight");
    }
  }

  // The carrier at the flag: set the resource down (retrying while the
  // slots are full), then back inside through the door.
  #handleDropResourceOut(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;
    if (serf.counter > 0) {
      return;
    }

    serf.counter = 0;
    const flag = this.world.flagAt(serf.position);
    if (flag === null) {
      serf.state = serfState.null;
      return;
    }

    if (
      serf.carriedResource >= 0 &&
      !this.world.dropResource(flag.index, serf.carriedResource, serf.carriedDestination)
    ) {
      // Slots filled while we slid out: take the resource back inside
      // and requeue it — the reference waits INSIDE, never standing on
      // the flag blocking the transporters that would drain it.
      const inventory = this.world.inventoryForPlayer(serf.player);
      inventory?.pendingOut.unshift({
        resource: serf.carriedResource,
        destinationFlagIndex: serf.carriedDestination,
      });
    }

    serf.carriedResource = -1;
    serf.carriedDestination = 0;
    const home =
      flag.buildingIndex === null ? undefined : this.world.buildings.get(flag.buildingIndex);
    if (home === undefined) {
      serf.state = serfState.null;
      return;
    }

    this.#enterBuilding(serf, home, serfState.idleInStock);
  }

  #lastMoraleTick = -1;

  // Military upkeep each engine pass: refresh knight morale on the stats
  // cadence and keep the castle's knight stock recruited (Player's
  // CastleKnightsWanted promoting generic serfs with sword + shield).
  #sweepMilitary(gameTick: number): void {
    if (this.#lastMoraleTick < 0 || ((gameTick - this.#lastMoraleTick) & 0xffff) >= 1024) {
      this.#lastMoraleTick = gameTick;
      for (const player of this.world.players) {
        if (player.hasCastle) {
          this.world.updateKnightMorale(player.index);
        }
      }
    }

    for (const inventory of this.world.inventories.values()) {
      const wanted = this.world.players[inventory.player]?.castleKnightsWanted ?? 0;
      while (inventory.knights < wanted && inventoryPromoteSerfToKnight(inventory)) {
        // Promotion consumed a sword, a shield, and a generic serf.
      }
    }

    // Building.UpdateMilitary: completed military buildings request knights
    // up to their occupation level; knights walk the roads to their post.
    for (const building of this.world.buildings.values()) {
      if (!building.isDone || !isMilitaryBuildingType(building.type)) {
        continue;
      }

      const player = this.world.players[building.player];
      const inventory = this.world.inventoryForPlayer(building.player);
      if (player === undefined || player.castlePosition === null || inventory === null) {
        continue;
      }

      const needed = militaryKnightsNeeded(building, player.knightOccupation);
      if (building.knights + building.requestedKnights >= needed) {
        continue;
      }

      const castleFlag = this.world.flagAt(this.world.move(player.castlePosition, "DownRight"));
      const buildingFlag = this.world.flags.get(building.flagIndex);
      if (castleFlag === null || buildingFlag === undefined) {
        continue;
      }

      if (
        castleFlag.index !== buildingFlag.index &&
        this.#directionToward(castleFlag.index, buildingFlag.index) === null
      ) {
        continue;
      }

      while (building.knights + building.requestedKnights < needed) {
        const knight = this.spawnKnightSerf(building.player, gameTick);
        if (knight === null) {
          break;
        }

        knight.garrisonTargetIndex = building.index;
        building.requestedKnights += 1;
        this.callOutSerf(knight, buildingFlag.index, gameTick);
      }
    }
  }

  // Completed production buildings request their profession worker from the
  // castle (condensed Inventory.CallOutSerf profession dispatch).
  // Inventory dispatch (Game.UpdateInventories, SB-36-05): banked
  // stock leaves for the building whose stock priorities want it
  // most, above the reference minimum of 16. One item per cadence
  // per inventory; planks and stones keep a construction reserve
  // until SB-36-08's emergency program owns that protection
  // (recorded).
  #lastExportSweepTick = -1;
  #sweepInventoryExports(gameTick: number): void {
    if (this.#lastExportSweepTick >= 0 && ((gameTick - this.#lastExportSweepTick) & 0xffff) < 64) {
      return;
    }

    this.#lastExportSweepTick = gameTick;
    for (const inventory of this.world.inventories.values()) {
      // Inventory.IsQueueFull: the reference stages at most two
      // outbound resources behind the door. Unbounded staging floods
      // the inventory flag's eight slots with exports and gridlocks
      // the through-traffic that must hand over there.
      if (inventory.pendingOut.length >= 2) {
        continue;
      }

      for (const [productKey, count] of Object.entries(inventory.resources)) {
        const product = Number(productKey);
        if ((count ?? 0) <= 0) {
          continue;
        }

        const constructionReserve =
          product === resourceType.plank || product === resourceType.stone ? 2 : 0;
        if ((count ?? 0) <= constructionReserve) {
          continue;
        }

        // Game.UpdateInventories: serve the building whose stock
        // wants this most, above the reference's minimum priority of
        // 16 (SB-36-05).
        const consumer = this.#bestConsumerFor(product, inventory.flagIndex, 16);
        if (consumer === null) {
          continue;
        }

        inventory.resources[product] = (count ?? 0) - 1;
        consumer.requestedResources[product] =
          (consumer.requestedResources[product] ?? 0) + 1;
        inventory.pendingOut.push({
          resource: product,
          destinationFlagIndex: consumer.flagIndex,
        });
        break;
      }
    }
  }

  // Building.Update stock priorities (SB-36-05): zero above the slot
  // maximum, else the distribution policy decayed by everything
  // delivered or in flight — `policy >> (8 + total)`, or the
  // always-hungry `0xff >> total`. GroupFood slots total across all
  // three foods. Gates on isDone where the reference gates on Holder
  // (serfbound auto-staffs completed buildings; typed-serf dispatch
  // is Phase 38).
  #stockPriority(building: WorldBuilding, product: number): number {
    if (!building.isDone) {
      return 0;
    }

    const specs = buildingStockSpecs[building.type];
    if (specs === undefined) {
      return 0;
    }

    for (const spec of specs) {
      if (!spec.resources.includes(product)) {
        continue;
      }

      let total = 0;
      for (const resource of spec.resources) {
        total +=
          (building.deliveredResources[resource] ?? 0) +
          (building.requestedResources[resource] ?? 0);
      }

      if (total >= spec.maximum) {
        return 0;
      }

      return spec.policy === "always" ? 0xff >> total : spec.policy >> (8 + total);
    }

    return 0;
  }

  // The consumer whose stock wants a product most, reachable from a
  // source flag; ties keep the lower building index (map insertion
  // order). Military gold keeps the reference's cap-based dispatch —
  // its gold slot has no Update priority policy.
  #bestConsumerFor(
    product: number,
    sourceFlagIndex: number,
    minimumPriority: number,
  ): WorldBuilding | null {
    const consumerTypes = productConsumers[product];
    if (consumerTypes === undefined) {
      return null;
    }

    let best: WorldBuilding | null = null;
    let bestPriority = minimumPriority;
    for (const consumer of this.world.buildings.values()) {
      if (!consumer.isDone || !consumerTypes.includes(consumer.type)) {
        continue;
      }

      if (isMilitaryBuildingType(consumer.type)) {
        if (consumer.knights === 0) {
          continue;
        }

        const cap = militaryGoldCap(consumer.type);
        if (
          (consumer.deliveredResources[product] ?? 0) +
            (consumer.requestedResources[product] ?? 0) >= cap ||
          this.#directionToward(sourceFlagIndex, consumer.flagIndex) === null
        ) {
          continue;
        }

        return consumer;
      }

      const priority = this.#stockPriority(consumer, product);
      if (priority <= bestPriority) {
        continue;
      }

      if (this.#directionToward(sourceFlagIndex, consumer.flagIndex) === null) {
        continue;
      }

      best = consumer;
      bestPriority = priority;
    }

    return best;
  }

  // A flag split a road in two (SB-36-03, the reference
  // BuildFlagSplitPath serf handling, condensed by anchor): the old
  // transporter keeps the half his anchor flag still names; the
  // staffing counts are recomputed from the serfs that actually serve
  // each half; an unstaffed half gets a fresh transporter from the
  // castle.
  // Felled-wood decay (a minimal SB-37-01 down-payment, recorded):
  // the reference Map.Update rots FelledPine/FelledTree to stubs and
  // clears stubs at 25% odds. Without it, trunks litter the map
  // forever and choke every corridor new roads and fields need — the
  // AI suite bricked on it. Full ambience (growth, fields, fish)
  // lands with Phase 37.
  #ambientCursor = 0;
  #ambientPass = 0;
  #updateAmbientDecay(): void {
    const tiles = this.world.tileCount;
    for (let step = 0; step < 32; step += 1) {
      const position = this.#ambientCursor;
      this.#ambientCursor = (this.#ambientCursor + 1) % tiles;
      if (this.#ambientCursor === 0) {
        this.#ambientPass = (this.#ambientPass + 1) & 0xffff;
      }

      const objectValue = this.world.objectAt(position);
      if (objectValue >= 93 && objectValue <= 102) {
        this.world.setObject(position, mapObject.stub, null);
      } else if (
        objectValue === mapObject.stub &&
        ((position + this.#ambientPass) & 3) === 0
      ) {
        // 25% per sweep, position-hashed: deterministic without
        // consuming the shared random (a decay draw per update would
        // shift every downstream seeded decision — the AI suite
        // caught exactly that).
        this.world.setObject(position, mapObject.none, null);
      }
    }
  }

  #handlePathSplits(gameTick: number): void {
    while (this.world.pendingPathSplits.length > 0) {
      const flagIndex = this.world.pendingPathSplits.shift()!;
      const flag = this.world.flags.get(flagIndex);
      if (flag === undefined) {
        continue;
      }

      const halves: { direction: Direction; otherFlagIndex: number }[] = [];
      for (const direction of directionOrder) {
        const path = flag.paths[direction];
        if (path.hasPath) {
          halves.push({ direction, otherFlagIndex: path.otherFlagIndex });
        }
      }

      if (halves.length !== 2) {
        continue;
      }

      // Count the serfs serving each half first: an UNSTAFFED road
      // splits into two unstaffed halves (staffing arrives through
      // normal dispatch) — spawning for both would drain the pool on
      // every split the AI makes.
      const staffing = halves.map((half) => {
        let staffed = 0;
        for (const serf of this.serfs.values()) {
          if (serf.roadDirection === null) {
            continue;
          }

          const anchor = this.world.flags.get(serf.roadFlagIndex);
          if (anchor === undefined) {
            continue;
          }

          const anchorPath = anchor.paths[serf.roadDirection];
          if (!anchorPath.hasPath) {
            continue;
          }

          if (
            (anchor.index === half.otherFlagIndex &&
              anchorPath.otherFlagIndex === flagIndex) ||
            (anchor.index === flagIndex && serf.roadDirection === half.direction)
          ) {
            staffed += 1;
          }
        }

        return staffed;
      });
      const roadWasStaffed = staffing.some((count) => count > 0);

      halves.forEach((half, halfIndex) => {
        const staffed = staffing[halfIndex]!;
        // The truth on both ends of this half.
        flag.paths[half.direction].freeTransporters = staffed;
        const farFlag = this.world.flags.get(half.otherFlagIndex);
        const farDirection = flag.paths[half.direction].otherEndDirection;
        if (farFlag !== undefined && farDirection !== null) {
          farFlag.paths[farDirection].freeTransporters = staffed;
        }

        if (staffed === 0 && roadWasStaffed) {
          // Top up from the pool only while it has slack — the AI
          // splits roads constantly and a hard spawn per split drains
          // the serfs its builders need. A tight pool records the
          // reference serfRequested bit instead (serviced fully with
          // SB-36-04's park/wake work).
          const inventory = this.world.inventoryForPlayer(flag.player);
          if (inventory !== null && inventory.genericSerfs > 4) {
            const transporter = this.spawnGenericSerf(flag.player, gameTick);
            if (transporter !== null) {
              this.assignTransporter(transporter, flagIndex, half.direction, gameTick);
            }
          } else {
            flag.paths[half.direction].serfRequested = true;
          }
        }
      });
    }
  }

  // Flag.Update slot scheduling (SB-36-02): every slot holding a
  // resource with no scheduled direction is routed here — known
  // destinations over the reference's seeded network search, unknown
  // destinations re-homed to a consumer or the nearest inventory.
  #sweepFlagScheduling(): void {
    for (const flag of this.world.flags.values()) {
      let hasUnscheduled = false;
      for (const slot of flag.slots) {
        if (slot.resource >= 0 && slot.scheduledDirection === null) {
          hasUnscheduled = true;
          break;
        }
      }

      if (!hasUnscheduled) {
        continue;
      }

      // Per direction, how many slots are already scheduled out —
      // the reference's resourcesWaiting tiers, deciding which
      // neighbor roads seed the search first.
      const waitingByDirection: Partial<Record<Direction, number>> = {};
      for (const slot of flag.slots) {
        if (slot.resource >= 0 && slot.scheduledDirection !== null) {
          waitingByDirection[slot.scheduledDirection] =
            (waitingByDirection[slot.scheduledDirection] ?? 0) + 1;
        }
      }

      for (const slot of flag.slots) {
        if (slot.resource < 0 || slot.scheduledDirection !== null) {
          continue;
        }

        if (slot.destinationFlagIndex !== 0) {
          if (this.#scheduleSlotToKnownDestination(flag, slot, waitingByDirection)) {
            waitingByDirection[slot.scheduledDirection!] =
              (waitingByDirection[slot.scheduledDirection!] ?? 0) + 1;
          }
        } else {
          this.#scheduleSlotToUnknownDestination(flag, slot);
        }
      }
    }
  }

  // Flag.ScheduleSlotToKnownDestination: breadth-first over the
  // transporter-served flag network, seeded from this flag's staffed
  // neighbors least-loaded first; the winning seed's direction becomes
  // the slot's scheduled direction. The reference's other-endpoint
  // slot register (ScheduleOtherEndpoint / PrioritizePickup refresh)
  // is folded into pickup, which makes the same highest-priority
  // choice when a transporter actually arrives. Returns true when the
  // slot was scheduled.
  #scheduleSlotToKnownDestination(
    flag: WorldFlag,
    slot: FlagResourceSlot,
    waitingByDirection: Partial<Record<Direction, number>>,
  ): boolean {
    // Seed order: idle directions first, then 1, 2, 3 waiting, then
    // the congested rest (the reference's tier walk).
    const seeds: Direction[] = [];
    for (let tier = 0; tier <= 4; tier += 1) {
      for (const direction of directionOrder) {
        const path = flag.paths[direction];
        if (!path.hasPath || path.freeTransporters === 0) {
          continue;
        }

        const waiting = waitingByDirection[direction] ?? 0;
        if (tier < 4 ? waiting === tier : waiting >= 4) {
          seeds.push(direction);
        }
      }
    }

    if (seeds.length === 0) {
      // No road here has a transporter yet: stay unscheduled and retry
      // on a later sweep (the reference keeps HasUnscheduledResources).
      return false;
    }

    const visited = new Set<number>([flag.index]);
    const queue: { flagIndex: number; seedDirection: Direction }[] = [];
    for (const direction of seeds) {
      const otherIndex = flag.paths[direction].otherFlagIndex;
      if (!visited.has(otherIndex)) {
        visited.add(otherIndex);
        queue.push({ flagIndex: otherIndex, seedDirection: direction });
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.flagIndex === slot.destinationFlagIndex) {
        slot.scheduledDirection = current.seedDirection;
        return true;
      }

      const currentFlag = this.world.flags.get(current.flagIndex);
      if (currentFlag === undefined) {
        continue;
      }

      for (const direction of directionOrder) {
        const path = currentFlag.paths[direction];
        if (!path.hasPath || path.freeTransporters === 0 || visited.has(path.otherFlagIndex)) {
          continue;
        }

        visited.add(path.otherFlagIndex);
        queue.push({ flagIndex: path.otherFlagIndex, seedDirection: current.seedDirection });
      }
    }

    // The staffed network was searched and the destination is not on
    // it: the delivery is impossible. Release the consumer's in-flight
    // request and clear the destination; the next sweep re-homes the
    // resource (Game.CancelTransportedResource + destination reset).
    const destinationFlag = this.world.flags.get(slot.destinationFlagIndex);
    if (destinationFlag !== undefined && destinationFlag.buildingIndex !== null) {
      const consumer = this.world.buildings.get(destinationFlag.buildingIndex);
      if (consumer !== undefined && (consumer.requestedResources[slot.resource] ?? 0) > 0) {
        consumer.requestedResources[slot.resource] =
          consumer.requestedResources[slot.resource]! - 1;
      }
    }

    slot.destinationFlagIndex = 0;
    return false;
  }

  // Flag.ScheduleSlotToUnknownDest: a resource with no destination is
  // re-homed over the staffed network — raw goods to the consumer
  // whose stock wants them most (the reference ranking, early exit
  // above priority 204; BFS order breaks ties nearest-first),
  // everything else to the nearest inventory.
  #scheduleSlotToUnknownDestination(flag: WorldFlag, slot: FlagResourceSlot): void {
    const product = slot.resource;
    const consumerTypes = routableResources.has(product)
      ? productConsumers[product]
      : undefined;

    let bestConsumer: WorldBuilding | null = null;
    let bestConsumerFlagIndex = 0;
    let bestPriority = 0;
    let inventoryFlagIndex = 0;
    const visited = new Set<number>([flag.index]);
    const queue: number[] = [flag.index];
    while (queue.length > 0) {
      const currentFlag = this.world.flags.get(queue.shift()!);
      if (currentFlag === undefined) {
        continue;
      }

      if (consumerTypes !== undefined && currentFlag.buildingIndex !== null) {
        const consumer = this.world.buildings.get(currentFlag.buildingIndex);
        if (
          consumer !== undefined &&
          consumer.isDone &&
          consumerTypes.includes(consumer.type)
        ) {
          if (isMilitaryBuildingType(consumer.type)) {
            // Military gold: cap-based, taken as found (no Update
            // priority policy in the reference).
            if (
              consumer.knights > 0 &&
              (consumer.deliveredResources[product] ?? 0) +
                (consumer.requestedResources[product] ?? 0) < militaryGoldCap(consumer.type)
            ) {
              consumer.requestedResources[product] =
                (consumer.requestedResources[product] ?? 0) + 1;
              slot.destinationFlagIndex = currentFlag.index;
              return;
            }
          } else {
            const priority = this.#stockPriority(consumer, product);
            if (priority > bestPriority) {
              bestConsumer = consumer;
              bestConsumerFlagIndex = currentFlag.index;
              bestPriority = priority;
              if (bestPriority > 204) {
                break;
              }
            }
          }
        }
      }

      if (
        inventoryFlagIndex === 0 &&
        currentFlag.hasInventory &&
        currentFlag.index !== flag.index
      ) {
        inventoryFlagIndex = currentFlag.index;
        if (consumerTypes === undefined) {
          break;
        }
      }

      for (const direction of directionOrder) {
        const path = currentFlag.paths[direction];
        if (path.hasPath && path.freeTransporters > 0 && !visited.has(path.otherFlagIndex)) {
          visited.add(path.otherFlagIndex);
          queue.push(path.otherFlagIndex);
        }
      }
    }

    if (bestConsumer !== null) {
      bestConsumer.requestedResources[product] =
        (bestConsumer.requestedResources[product] ?? 0) + 1;
      slot.destinationFlagIndex = bestConsumerFlagIndex;
      return;
    }

    if (inventoryFlagIndex !== 0) {
      slot.destinationFlagIndex = inventoryFlagIndex;
    }
    // Still homeless: stay unscheduled and retry on a later sweep.
  }

  // Park, wake, and reinforce (SB-36-04): roads staff up under load.
  // The reference grants MaxTransporters by length category
  // {1,2,3,4,6,8,11,15} and parks/wakes idle serfs; condensed here to
  // a 64-tick staffing sweep — a road whose end flags hold more
  // scheduled work than its transporters can lift gets another serf
  // (up to the cap, pool slack permitting), and recorded
  // serfRequested bits are serviced the same way.
  #lastStaffingSweepTick = -1;
  #sweepTransportStaffing(gameTick: number): void {
    if (
      this.#lastStaffingSweepTick >= 0 &&
      ((gameTick - this.#lastStaffingSweepTick) & 0xffff) < 64
    ) {
      return;
    }

    this.#lastStaffingSweepTick = gameTick;
    for (const flag of this.world.flags.values()) {
      for (const direction of directionOrder) {
        const path = flag.paths[direction];
        if (!path.hasPath) {
          continue;
        }

        // Visit each road once, from its lower-index end.
        if (path.otherFlagIndex < flag.index) {
          continue;
        }

        const servers = this.#roadServers(flag, direction);
        const maxForLength = maxTransportersByCategory[path.lengthCategory] ?? 1;

        let wanted = path.serfRequested ? 1 : 0;
        if (wanted === 0 && servers.total > 0 && servers.idle === 0) {
          // Congestion: scheduled work routed over this road with every
          // server busy asks for reinforcement.
          const otherFlag = this.world.flags.get(path.otherFlagIndex);
          const backlog =
            this.#scheduledOver(flag, direction) +
            (otherFlag === undefined || path.otherEndDirection === null
              ? 0
              : this.#scheduledOver(otherFlag, path.otherEndDirection));
          if (backlog > 1) {
            wanted = 1;
          }
        }

        if (wanted === 0 || servers.total >= maxForLength) {
          path.serfRequested = servers.total >= maxForLength ? false : path.serfRequested;
          continue;
        }

        const inventory = this.world.inventoryForPlayer(flag.player);
        if (inventory === null || inventory.genericSerfs <= 4) {
          path.serfRequested = true;
          continue;
        }

        const transporter = this.spawnGenericSerf(flag.player, gameTick);
        if (transporter !== null) {
          this.assignTransporter(transporter, flag.index, direction, gameTick);
          path.serfRequested = false;
        }
      }
    }
  }

  // The serfs serving a road (anchored at either end), and how many
  // are idle at their posts versus mid-haul.
  #roadServers(flag: WorldFlag, direction: Direction): { total: number; idle: number } {
    const path = flag.paths[direction];
    let total = 0;
    let idle = 0;
    for (const serf of this.serfs.values()) {
      if (serf.roadDirection === null) {
        continue;
      }

      const serves =
        (serf.roadFlagIndex === flag.index && serf.roadDirection === direction) ||
        (serf.roadFlagIndex === path.otherFlagIndex &&
          serf.roadDirection === path.otherEndDirection);
      if (!serves) {
        continue;
      }

      total += 1;
      if (serf.state === serfState.idleOnPath) {
        idle += 1;
      }
    }

    return { total, idle };
  }

  // Scheduled work at a flag routed out through a direction — read
  // straight off the flag sweep's per-slot scheduling (SB-36-02).
  #scheduledOver(flag: WorldFlag, direction: Direction): number {
    let count = 0;
    for (const slot of flag.slots) {
      if (slot.resource >= 0 && slot.scheduledDirection === direction) {
        count += 1;
      }
    }

    return count;
  }

  #sweepWorkerRequests(gameTick: number): void {
    for (const building of this.world.buildings.values()) {
      if (!building.isDone || building.type === 24 || this.#staffedBuildings.has(building.index)) {
        continue;
      }

      if (!workedBuildingTypes.has(building.type)) {
        continue;
      }

      const worker = this.spawnGenericSerf(building.player, gameTick);
      if (worker === null) {
        continue;
      }

      this.#staffedBuildings.add(building.index);
      worker.workBuildingIndex = building.index;
      this.callOutSerf(worker, building.flagIndex, gameTick);
    }
  }

  // Profession work cycles (condensed model, recorded in the phase docs):
  // the worker stays at the building; map effects target the nearest
  // candidate within the classic spiral; products drop at the building flag
  // routed to demand (consumer buildings first, otherwise the inventory).
  #handleWorking(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.workCounter += delta;

    const building = this.world.buildings.get(serf.workBuildingIndex);
    if (building === undefined) {
      serf.state = serfState.null;
      return;
    }

    switch (building.type) {
      case buildingType.lumberjack:
        this.#workHarvest(serf, building, 400, isTreeObject, mapObject.stub, resourceType.lumber, delta);
        break;
      case buildingType.stonecutter:
        this.#workHarvest(serf, building, 450, isStoneObject, mapObject.none, resourceType.stone, delta);
        break;
      case buildingType.forester:
        if (serf.workCounter >= 500) {
          serf.workCounter = 0;
          this.#plantTree(building);
        }
        break;
      case buildingType.sawmill:
        this.#workConvert(serf, building, 350, resourceType.lumber, resourceType.plank);
        break;
      case buildingType.farm:
        // Farmer: sow a field, then harvest it into wheat (field objects use
        // the reference Seeds/Field values; growth stages are condensed).
        if (serf.workCounter >= 450) {
          serf.workCounter = 0;
          if (serf.workPhase === 0) {
            for (let offset = 1; offset < 151; offset += 1) {
              const candidate = this.world.positionAddSpirally(building.position, offset);
              if (
                this.world.objectAt(candidate) === mapObject.none &&
                this.world.pathsAt(candidate) === 0 &&
                this.world.hasOwner(candidate) &&
                this.world.canBuildSmall(candidate)
              ) {
                this.world.setObject(candidate, 105, null); // Seeds0
                serf.workPhase = 1;
                serf.workTargetPosition = candidate;
                break;
              }
            }
          } else {
            const field = serf.workTargetPosition;
            if (field >= 0 && this.world.objectAt(field) >= 105 && this.world.objectAt(field) <= 126) {
              this.world.setObject(field, mapObject.none, null);
              this.#emitProduct(building, resourceType.wheat);
            }

            serf.workPhase = 0;
            serf.workTargetPosition = -1;
          }
        }
        break;
      case buildingType.mill:
        this.#workConvert(serf, building, 400, resourceType.wheat, resourceType.flour);
        break;
      case buildingType.baker:
        this.#workConvert(serf, building, 400, resourceType.flour, resourceType.bread);
        break;
      case buildingType.fisher:
        // Fisher: catches from adjacent water fish stocks.
        if (serf.workCounter >= 500) {
          serf.workCounter = 0;
          for (let offset = 1; offset < 151; offset += 1) {
            const candidate = this.world.positionAddSpirally(building.position, offset);
            if (
              this.world.minerals[candidate] === 0 &&
              this.world.resourceAmounts[candidate]! > 0 &&
              this.world.typesUp[candidate]! <= 3
            ) {
              this.world.resourceAmounts[candidate] = this.world.resourceAmounts[candidate]! - 1;
              this.#emitProduct(building, resourceType.fish);
              break;
            }
          }
        }
        break;
      case buildingType.pigFarm:
        // Pig farm: wheat feeds pigs (one pig per two wheat, condensed).
        if (serf.workCounter >= 550) {
          const stock = building.deliveredResources[resourceType.wheat] ?? 0;
          if (stock >= 2) {
            serf.workCounter = 0;
            building.deliveredResources[resourceType.wheat] = stock - 2;
            this.#emitProduct(building, resourceType.pig);
          }
        }
        break;
      case buildingType.butcher:
        this.#workConvert(serf, building, 350, resourceType.pig, resourceType.meat);
        break;
      case buildingType.stoneMine:
      case buildingType.coalMine:
      case buildingType.ironMine:
      case buildingType.goldMine:
        this.#workMine(serf, building);
        break;
      case buildingType.steelSmelter:
        this.#workConvertMulti(
          serf, building, 450,
          [resourceType.coal, resourceType.ironOre],
          resourceType.steel,
        );
        break;
      case buildingType.goldSmelter:
        this.#workConvertMulti(
          serf, building, 450,
          [resourceType.coal, resourceType.goldOre],
          resourceType.goldBar,
        );
        break;
      case buildingType.weaponSmith:
        // HandleSerfMakingWeaponState: one coal + one steel make a sword,
        // then a shield "for free" (the reference FreeShieldPossible flip,
        // carried on the worker's phase since one smith works the forge).
        if (serf.workCounter >= 500) {
          if (serf.workPhase % 2 === 1) {
            serf.workCounter = 0;
            serf.workPhase += 1;
            this.#emitProduct(building, resourceType.shield);
          } else {
            const coal = building.deliveredResources[resourceType.coal] ?? 0;
            const steel = building.deliveredResources[resourceType.steel] ?? 0;
            if (coal > 0 && steel > 0) {
              serf.workCounter = 0;
              serf.workPhase += 1;
              building.deliveredResources[resourceType.coal] = coal - 1;
              building.deliveredResources[resourceType.steel] = steel - 1;
              this.#emitProduct(building, resourceType.sword);
            }
          }
        }
        break;
      case buildingType.toolMaker:
        if (serf.workCounter >= 500) {
          const planks = building.deliveredResources[resourceType.plank] ?? 0;
          const steel = building.deliveredResources[resourceType.steel] ?? 0;
          if (planks > 0 && steel > 0) {
            serf.workCounter = 0;
            building.deliveredResources[resourceType.plank] = planks - 1;
            building.deliveredResources[resourceType.steel] = steel - 1;
            const tool = toolOutputs[serf.workPhase % toolOutputs.length]!;
            serf.workPhase += 1;
            this.#emitProduct(building, tool);
          }
        }
        break;
      default:
        break;
    }
  }

  // Mines extract from the generator's deposits, gated on delivered food
  // (one food per extraction, per the reference miner behavior).
  #workMine(serf: WorldSerf, building: WorldBuilding): void {
    if (serf.workCounter < 500) {
      return;
    }

    const deposit = mineDeposits[building.type];
    if (deposit === undefined) {
      return;
    }

    const foodIndex = minerFoods.find(
      (food) => (building.deliveredResources[food] ?? 0) > 0,
    );
    if (foodIndex === undefined) {
      return; // hungry miners stop working
    }

    const [mineralValue, oreResource] = deposit;
    for (let offset = 0; offset < 50; offset += 1) {
      const candidate = this.world.positionAddSpirally(building.position, offset);
      if (
        this.world.minerals[candidate] === mineralValue &&
        this.world.resourceAmounts[candidate]! > 0
      ) {
        serf.workCounter = 0;
        building.deliveredResources[foodIndex] =
          (building.deliveredResources[foodIndex] ?? 0) - 1;
        this.world.resourceAmounts[candidate] = this.world.resourceAmounts[candidate]! - 1;
        this.#emitProduct(building, oreResource);
        return;
      }
    }

    serf.workCounter = 0; // deposit exhausted
  }

  // Converters needing several inputs at once (smelters).
  #workConvertMulti(
    serf: WorldSerf,
    building: WorldBuilding,
    cycleTicks: number,
    inputs: readonly number[],
    output: number,
  ): void {
    if (serf.workCounter < cycleTicks) {
      return;
    }

    if (inputs.every((input) => (building.deliveredResources[input] ?? 0) > 0)) {
      serf.workCounter = 0;
      for (const input of inputs) {
        building.deliveredResources[input] = building.deliveredResources[input]! - 1;
      }

      this.#emitProduct(building, output);
    }
  }

  // Converter buildings: consume one delivered input per work cycle and emit
  // the product (sawmill, mill, baker, butcher).
  #workConvert(
    serf: WorldSerf,
    building: WorldBuilding,
    cycleTicks: number,
    input: number,
    output: number,
  ): void {
    if (serf.workCounter < cycleTicks) {
      return;
    }

    const stock = building.deliveredResources[input] ?? 0;
    if (stock > 0) {
      serf.workCounter = 0;
      building.deliveredResources[input] = stock - 1;
      this.#emitProduct(building, output);
    }
  }

  // Outdoor harvest (SB-34 round 7, the visible cycle): rest inside,
  // walk OUT to the nearest target, work it under the player's eyes,
  // and walk the product home — the tree/stone changes only while the
  // worker stands at it, never by remote control. The walk is paced
  // by the shared reference counter tables (SB-35-01): there is no
  // second movement system.
  #workHarvest(
    serf: WorldSerf,
    building: WorldBuilding,
    cycleTicks: number,
    isTarget: (objectValue: number) => boolean,
    remainder: number,
    product: number,
    delta: number,
  ): void {
    // Phase 0: inside, resting until the cycle matures; then pick the
    // nearest target and step out. The rest takes half the cycle —
    // the walk out, the dwell, and the walk home spend the other half
    // (the pre-walk-out pacing budgeted the whole cycle to the rest).
    if (serf.workPhase === 0) {
      if (serf.workCounter < Math.trunc(cycleTicks / 2)) {
        return;
      }

      serf.workCounter = 0;
      for (let offset = 1; offset < 151; offset += 1) {
        const candidate = this.world.positionAddSpirally(building.position, offset);
        if (isTarget(this.world.objectAt(candidate))) {
          serf.workPhase = 1;
          serf.workTargetPosition = candidate;
          serf.walkingDestination = 0;
          serf.counter = 0;
          // Out through the door onto the flag (SB-35-02).
          serf.position = this.world.move(building.position, "DownRight");
          this.#leaveBuilding(
            serf,
            building.position,
            31 - (roadBuildingSlope[building.type] ?? 15),
            serfState.working,
          );
          return;
        }
      }

      // Nothing left to harvest; idle until the map changes.
      return;
    }

    // Phase 1: walk to the target.
    if (serf.workPhase === 1) {
      if (serf.position === serf.workTargetPosition) {
        serf.workPhase = 2;
        serf.workCounter = 0;
        serf.walkingWaitCounter = 0;
        serf.counter =
          building.type === buildingType.stonecutter
            ? stoneCuttingTicks
            : loggingStageTicks[0]!;
        return;
      }

      this.#freeWalkToward(serf, serf.workTargetPosition, delta);
      return;
    }

    // Phase 2: the working pose (SB-35-03) — staged reference work at
    // the target. walkingWaitCounter (free while working) is the
    // stage index; serf.counter rolls the pose frames for the render.
    if (serf.workPhase === 2) {
      serf.counter = Math.max(0, serf.counter - delta);
      const targetObject = this.world.objectAt(serf.workTargetPosition);
      if (!isTarget(targetObject) && serf.walkingWaitCounter === 0) {
        // Somebody else took it while we walked; head home empty.
        serf.workPhase = 3;
        serf.workCounter = 0;
        serf.walkingDestination = 0;
        serf.counter = 0;
        return;
      }

      if (building.type === buildingType.stonecutter) {
        // One cut per visit: the pile shrinks a slice.
        serf.animation = stoneCuttingAnimation;
        if (serf.workCounter < stoneCuttingTicks) {
          return;
        }

        const next = targetObject + 1;
        this.world.setObject(
          serf.workTargetPosition,
          isStoneObject(next) ? next : remainder,
          null,
        );
        serf.workCounter = 0;
        serf.workPhase = 3;
        serf.walkingDestination = 0;
        serf.counter = 0;
        return;
      }

      // Logging: five visible stages fell the tree; each stage lays
      // the next felled object (pines fall as pines).
      const stage = serf.walkingWaitCounter;
      serf.animation = loggingAnimationBase + Math.min(stage, loggingStageTicks.length - 1);
      if (serf.workCounter < (loggingStageTicks[stage] ?? 255)) {
        return;
      }

      // The family holds through the fall: a pine stays a felled pine
      // across stages (the object is already a felled value past
      // stage 0).
      const felledBase =
        (targetObject >= felledPineBase && targetObject < felledTreeBase) ||
        (targetObject >= mapObject.pine0 && targetObject < mapObject.palm0)
          ? felledPineBase
          : felledTreeBase;
      this.world.setObject(serf.workTargetPosition, felledBase + Math.min(stage, 4), null);
      serf.workCounter = 0;
      serf.counter = loggingStageTicks[stage + 1] ?? 0;
      serf.walkingWaitCounter += 1;
      if (serf.walkingWaitCounter >= loggingStageTicks.length) {
        serf.walkingWaitCounter = 0;
        serf.workPhase = 3;
        serf.walkingDestination = 0;
        serf.counter = 0;
      }

      return;
    }

    // Phase 3: walk home to the flag; the product arrives with the
    // serf, and he goes back inside through the door (SB-35-02).
    const homeFlag = this.world.move(building.position, "DownRight");
    if (serf.position === homeFlag) {
      serf.workPhase = 0;
      serf.workCounter = 0;
      serf.workTargetPosition = -1;
      this.#emitProduct(building, product);
      this.#enterBuilding(serf, building, serfState.working);
      return;
    }

    this.#freeWalkToward(serf, homeFlag, delta);
  }

  // Free walking on the SHARED walker (SB-35-01): greedy descent on
  // map distance (the condensed reference FreeWalking), every step
  // taken through #changeDirection so the reference animation counters
  // pace the walk — flat 255 ticks per tile, slopes slower, collisions
  // waiting — exactly like every road serf. The previous tile
  // (walkingDestination, unused while working) blocks backtracking.
  #freeWalkToward(serf: WorldSerf, target: number, delta: number): void {
    serf.counter -= delta;
    while (serf.counter < 0 && serf.position !== target) {
      let bestDirection: Direction | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const direction of directionOrder) {
        const next = this.world.move(serf.position, direction);
        // The target itself is always enterable — walking home means
        // stepping INTO the worker's own building. Standing serfs are
        // routed AROUND: a chopper dwells thousands of ticks, and a
        // greedy walker waiting behind him waits forever.
        if (
          next !== target &&
          (this.world.hasBuilding(next) ||
            next === serf.walkingDestination ||
            this.hasSerfAt(next))
        ) {
          continue;
        }

        const distance = this.#hexDistance(next, target);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestDirection = direction;
        }
      }

      if (bestDirection === null) {
        serf.counter = 0;
        return;
      }

      serf.walkingDestination = serf.position;
      if (!this.#changeDirection(serf, bestDirection)) {
        serf.counter = 0;
        return;
      }
    }

    if (serf.counter < 0) {
      serf.counter = 0;
    }
  }

  #plantTree(building: WorldBuilding): void {
    for (let offset = 1; offset < 151; offset += 1) {
      const candidate = this.world.positionAddSpirally(building.position, offset);
      if (
        this.world.objectAt(candidate) === mapObject.none &&
        this.world.pathsAt(candidate) === 0 &&
        this.world.hasOwner(candidate) &&
        this.world.canBuildSmall(candidate)
      ) {
        // Condensed growth: the forester's sapling matures immediately
        // (the reference NewTree growth timer is recorded follow-up work).
        this.world.setObject(candidate, mapObject.tree0, null);
        return;
      }
    }
  }

  // Route a product to demand: a connected consumer building wanting this
  // resource first, otherwise the player's inventory flag. Demand counts
  // both delivered stock and in-flight requests (the reference building
  // stock requested/available split), so producers stop pushing once a
  // consumer's pipeline is full instead of flooding the road network.
  #emitProduct(building: WorldBuilding, product: number): void {
    const sourceFlag = this.world.flags.get(building.flagIndex);
    if (sourceFlag === undefined) {
      return;
    }

    this.onProduct?.(building.type, product);

    // Products go to the consumer whose stock wants them most
    // (SB-36-05): the reference unknown-destination routing collapsed
    // at the source, ranked by the Building.Update priorities.
    const best = this.#bestConsumerFor(product, building.flagIndex, 0);
    let destination = 0;
    if (best !== null) {
      destination = best.flagIndex;
      best.requestedResources[product] = (best.requestedResources[product] ?? 0) + 1;
    }

    if (destination === 0) {
      const inventory = this.world.inventoryForPlayer(building.player);
      if (inventory !== null) {
        destination = inventory.flagIndex;
      }
    }

    if (destination !== 0 && destination !== building.flagIndex) {
      if (!this.world.dropResource(building.flagIndex, product, destination)) {
        // The producer's own flag is full; release the in-flight request so
        // the consumer's pipeline does not stay blocked by a phantom.
        const consumerFlag = this.world.flags.get(destination);
        const consumer =
          consumerFlag?.buildingIndex !== null && consumerFlag !== undefined
            ? this.world.buildings.get(consumerFlag.buildingIndex)
            : undefined;
        if (consumer !== undefined && (consumer.requestedResources[product] ?? 0) > 0) {
          consumer.requestedResources[product] = consumer.requestedResources[product]! - 1;
        }
      }
    } else if (destination === building.flagIndex) {
      // Producing straight onto the inventory flag (rare) stores directly.
      const inventory = this.world.inventoryForPlayer(building.player);
      if (inventory !== null) {
        inventory.resources[product] = (inventory.resources[product] ?? 0) + 1;
      }
    }
  }

  // Builders work their site on the game clock; the world's construction
  // model (leveling, then material consumption) decides progress.
  #handleBuilding(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;

    const building = this.world.buildings.get(serf.buildTargetIndex);
    if (building === undefined || building.isDone) {
      serf.buildTargetIndex = 0;
      serf.state = serfState.null;
      return;
    }

    this.world.applyBuilderWork(building, delta);
    if (building.isDone) {
      serf.buildTargetIndex = 0;
      serf.state = serfState.null;
    }
  }

  // Construction logistics for a queued building: drop the required
  // materials at the player's inventory flag destined for the site, ensure
  // every road on the route has a transporter, and send out a builder.
  dispatchConstructionLogistics(building: WorldBuilding, gameTick: number): boolean {
    if (this.#dispatchedBuildings.has(building.index) || building.isDone) {
      return false;
    }

    const player = this.world.players[building.player];
    if (player === undefined || player.castlePosition === null) {
      return false;
    }

    const castleFlag = this.world.flagAt(this.world.move(player.castlePosition, "DownRight"));
    const buildingFlag = this.world.flags.get(building.flagIndex);
    if (castleFlag === null || buildingFlag === undefined) {
      return false;
    }

    // No side effects until the site is actually reachable over roads.
    if (
      castleFlag.index !== buildingFlag.index &&
      this.#directionToward(castleFlag.index, buildingFlag.index) === null
    ) {
      return false;
    }

    this.#dispatchedBuildings.add(building.index);

    // Materials come out of the castle inventory's stock.
    const inventory = this.world.inventoryForPlayer(building.player);
    if (inventory === null) {
      return false;
    }

    const [planks, stones] = buildingConstructionCosts[building.type] ?? [0, 0];
    for (let count = 0; count < planks; count += 1) {
      if (inventoryTakeResource(inventory, resourceType.plank)) {
        inventory.pendingOut.push({
          resource: resourceType.plank,
          destinationFlagIndex: buildingFlag.index,
        });
      }
    }

    for (let count = 0; count < stones; count += 1) {
      if (inventoryTakeResource(inventory, resourceType.stone)) {
        inventory.pendingOut.push({
          resource: resourceType.stone,
          destinationFlagIndex: buildingFlag.index,
        });
      }
    }

    // Walk the flag route and staff each unmanned road with a transporter.
    let cursorFlag = castleFlag;
    for (let hop = 0; hop < 64 && cursorFlag.index !== buildingFlag.index; hop += 1) {
      const direction = this.#directionToward(cursorFlag.index, buildingFlag.index);
      if (direction === null) {
        break;
      }

      const path = cursorFlag.paths[direction];
      if (path.freeTransporters === 0) {
        const transporter = this.spawnGenericSerf(building.player, gameTick);
        if (transporter !== null) {
          this.assignTransporter(transporter, cursorFlag.index, direction, gameTick);
        }
      }

      const nextFlag = this.world.flags.get(path.otherFlagIndex);
      if (nextFlag === undefined) {
        break;
      }

      cursorFlag = nextFlag;
    }

    // Send the builder.
    const builder = this.spawnGenericSerf(building.player, gameTick);
    if (builder === null) {
      return false;
    }

    builder.buildTargetIndex = building.index;
    return this.callOutSerf(builder, buildingFlag.index, gameTick);
  }

  // Serf.ChangeDirection: move one tile; on collision, either swap with a
  // serf waiting to cross in the opposite direction (the reference
  // SwitchWaiting) or wait with the reference waiting animation.
  #changeDirection(serf: WorldSerf, direction: Direction): boolean {
    const newPosition = this.world.move(serf.position, direction);

    if (this.hasSerfAt(newPosition)) {
      const other = this.serfAt(newPosition);
      const otherWaitsOpposite =
        other !== null &&
        other.walkingDirection < 0 &&
        directionOrder[other.walkingDirection + 6] === reverseOf[direction];
      if (other !== null && otherWaitsOpposite) {
        // Swap positions, both with switch animations.
        const ourHeight = this.world.heights[serf.position]!;
        const theirHeight = this.world.heights[newPosition]!;
        other.position = serf.position;
        this.serfIndexes[other.position] = other.index;
        other.animation = walkingAnimation(ourHeight - theirHeight, reverseOf[direction], true);
        other.counter = counterFromAnimation(other.animation);
        other.walkingDirection = directionOrder.indexOf(direction);
        other.walkingWaitCounter = 0;

        serf.animation = walkingAnimation(theirHeight - ourHeight, direction, true);
        serf.walkingDirection = directionOrder.indexOf(reverseOf[direction]);
        serf.walkingWaitCounter = 0;
        serf.position = newPosition;
        this.serfIndexes[newPosition] = serf.index;
        serf.counter += counterFromAnimation(serf.animation);
        return true;
      }

      serf.animation = 81 + directionOrder.indexOf(direction);
      serf.counter = counterFromAnimation(serf.animation);
      serf.walkingDirection = directionOrder.indexOf(direction) - 6;
      return true;
    }

    this.serfIndexes[serf.position] = 0;
    serf.animation = walkingAnimation(
      this.world.heights[newPosition]! - this.world.heights[serf.position]!,
      direction,
      false,
    );
    serf.walkingDirection = directionOrder.indexOf(reverseOf[direction]);
    serf.walkingWaitCounter = 0;
    serf.position = newPosition;
    this.serfIndexes[newPosition] = serf.index;
    serf.counter += counterFromAnimation(serf.animation);
    return true;
  }

  // --- combat (Serf.cs fight states + SetFightOutcome) -------------------------------

  // Player attack initiation, condensed: pull knights from the castle and
  // march them on the target building's flag (the reference selects them
  // from nearby military buildings; supply selection lands with the war UI).
  launchAttack(
    playerIndex: number,
    targetBuildingIndex: number,
    knightCount: number,
    gameTick: number,
  ): number {
    const target = this.world.buildings.get(targetBuildingIndex);
    const player = this.world.players[playerIndex];
    if (
      target === undefined ||
      !target.isDone ||
      target.player === playerIndex ||
      player === undefined ||
      player.castlePosition === null ||
      (!isMilitaryBuildingType(target.type) && target.type !== buildingType.castle)
    ) {
      return 0;
    }

    const targetFlag = this.world.flags.get(target.flagIndex);
    if (targetFlag === undefined) {
      return 0;
    }

    let sent = 0;
    while (sent < knightCount) {
      const knight = this.spawnKnightSerf(playerIndex, gameTick);
      if (knight === null) {
        break;
      }

      knight.attackTargetIndex = targetBuildingIndex;
      knight.workTargetPosition = targetFlag.position;
      knight.state = serfState.knightMarching;
      knight.tick = gameTick;
      knight.counter = 0;
      sent += 1;
    }

    return sent;
  }

  // Map.Dist over the wrapped axial grid: opposite-sign deltas share the
  // Down/Up diagonal, same-sign deltas must be walked separately.
  #hexDistance(from: number, to: number): number {
    const dx = this.world.geometry.distanceX(from, to);
    const dy = this.world.geometry.distanceY(from, to);
    if (dx * dy < 0) {
      return Math.max(Math.abs(dx), Math.abs(dy));
    }

    return Math.abs(dx) + Math.abs(dy);
  }

  // Attacking knights march off-road toward the target flag (the reference
  // FreeWalking path, condensed to a greedy descent on map distance).
  #handleKnightMarching(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    while (serf.counter < 0) {
      if (serf.position === serf.workTargetPosition) {
        this.#engageBuilding(serf, gameTick);
        return;
      }

      // Greedy descent with sidestep: take the unblocked neighbor closest
      // to the target, never backtracking onto the previous tile, so the
      // march flows around buildings instead of wedging on them.
      let bestDirection: Direction | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const direction of directionOrder) {
        const next = this.world.move(serf.position, direction);
        if (this.world.hasBuilding(next) || next === serf.workPhase) {
          continue;
        }

        const distance = this.#hexDistance(next, serf.workTargetPosition);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestDirection = direction;
        }
      }

      if (bestDirection === null) {
        serf.counter = 0;
        return;
      }

      serf.workPhase = serf.position;

      if (!this.#changeDirection(serf, bestDirection)) {
        serf.counter = 0;
        return;
      }
    }
  }

  // Engage the target: the next defender steps out and the fight begins;
  // an empty garrison leaves the attacker victorious at the flag
  // (capture consequences land with SB-15-04).
  #engageBuilding(serf: WorldSerf, gameTick: number): void {
    const building = this.world.buildings.get(serf.attackTargetIndex);
    if (building === undefined || building.player === serf.player) {
      serf.state = serfState.null;
      serf.counter = 0;
      return;
    }

    if (building.knights <= 0) {
      // No defenders left: the conquering knight takes the post
      // (Game.OccupyEnemyBuilding). A fallen castle means defeat; a
      // military building transfers and the victor garrisons it.
      const wasCastle = building.type === buildingType.castle;
      if (this.world.captureBuilding(building.index, serf.player)) {
        if (wasCastle) {
          serf.state = serfState.null;
          serf.attackTargetIndex = 0;
          serf.counter = 0;
        } else {
          building.knights = 1;
          this.serfIndexes[serf.position] = 0;
          serf.state = serfState.idleInStock;
          serf.position = building.position;
          serf.attackTargetIndex = 0;
        }

        return;
      }

      serf.state = serfState.null;
      serf.counter = 0;
      return;
    }

    building.knights -= 1;
    const defender: WorldSerf = {
      index: this.#nextSerfIndex,
      player: building.player,
      state: serfState.knightDefending,
      position: building.position,
      tick: gameTick,
      animation: 0,
      counter: 0,
      walkingDirection: 0,
      walkingDestination: 0,
      walkingWaitCounter: 0,
      slopeLength: 0,
      nextState: serfState.null,
      roadFlagIndex: 0,
      roadDirection: null,
      carriedResource: -1,
      carriedDestination: 0,
      buildTargetIndex: 0,
      workBuildingIndex: 0,
      workPhase: 0,
      workCounter: 0,
      workTargetPosition: -1,
      isKnight: true,
      garrisonTargetIndex: 0,
      knightRank: 0,
      attackTargetIndex: 0,
      fightOpponentIndex: serf.index,
      fightMove: 0,
      fightWon: false,
    };
    this.#nextSerfIndex += 1;
    this.serfs.set(defender.index, defender);

    serf.fightOpponentIndex = defender.index;
    this.#setFightOutcome(serf, defender);
    serf.state = serfState.knightAttacking;
    serf.counter = 0;
    serf.tick = gameTick;
  }

  // Serf.SetFightOutcome, exact reference math and RandomInt order:
  // rank doubles morale per level; fighting on foreign land swaps the
  // 0x1000 land factor for the player's gold-driven knight morale.
  #setFightOutcome(attacker: WorldSerf, defender: WorldSerf): void {
    const expFactor = 1 << attacker.knightRank;
    let landFactor = 0x1000;
    if (attacker.player !== this.world.owner(attacker.position)) {
      landFactor = this.world.players[attacker.player]?.knightMorale ?? 0x1000;
    }

    const morale = Math.floor((0x400 * expFactor * landFactor) / 0x10000);

    const defenderExpFactor = 1 << defender.knightRank;
    let defenderLandFactor = 0x1000;
    if (defender.player !== this.world.owner(defender.position)) {
      defenderLandFactor = this.world.players[defender.player]?.knightMorale ?? 0x1000;
    }

    const defenderMorale = Math.floor((0x400 * defenderExpFactor * defenderLandFactor) / 0x10000);

    const result = Math.floor(((morale + defenderMorale) * this.random.next()) / 0x10000);
    attacker.fightWon = result < morale;
    attacker.fightMove = this.random.next() & 0x70;
  }

  // Serf.HandleKnightAttacking: the attacker drives both serfs through the
  // fight sequence; a negative move resolves the fight with the outcome
  // decided in SetFightOutcome.
  #handleKnightAttacking(serf: WorldSerf, gameTick: number): void {
    const defender = this.serfs.get(serf.fightOpponentIndex);
    if (defender === undefined) {
      serf.state = serfState.null;
      return;
    }

    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    defender.tick = gameTick;
    serf.counter -= delta;
    defender.counter = serf.counter;

    while (serf.counter < 0) {
      const move = knightAttackMoves[serf.fightMove]!;
      if (move < 0) {
        const building = this.world.buildings.get(serf.attackTargetIndex);
        if (!serf.fightWon) {
          // Defender won: it returns to its building, the attacker dies.
          if (building !== undefined) {
            building.knights += 1;
          }

          this.serfs.delete(defender.index);
          serf.state = serfState.dead;
          serf.animation = 152 + serf.knightRank;
          serf.counter = 255;
          serf.fightOpponentIndex = 0;
        } else {
          // Attacker won: the defender dies, the attacker re-engages once
          // the body is carried off.
          defender.state = serfState.dead;
          defender.animation = 147 + serf.knightRank;
          defender.counter = 255;
          defender.tick = gameTick;
          serf.state = serfState.knightAttackingVictory;
          serf.animation = 168;
          serf.counter = 0;
        }

        return;
      }

      // Next move in the fight sequence; the defender's view mirrors it.
      serf.fightMove += 1;
      const displayMove = serf.fightWon ? move : 4 - move;
      const animationOffset = (this.random.next() * knightFightAnimMax[displayMove]!) >> 16;
      const knightAnimation = knightFightAnim[displayMove * 16 + animationOffset]!;
      serf.animation = 146 + ((knightAnimation >> 4) & 0xf);
      defender.animation = 156 + (knightAnimation & 0xf);
      serf.counter = 72 + (this.random.next() & 0x18);
      defender.counter = serf.counter;
    }
  }

  // Serf.HandleSerfKnightAttackingVictoryState: wait out the defender's
  // death animation, then engage the building again.
  #handleKnightAttackingVictory(serf: WorldSerf, gameTick: number): void {
    const defender = this.serfs.get(serf.fightOpponentIndex);
    if (defender === undefined) {
      this.#engageBuilding(serf, gameTick);
      return;
    }

    const delta = (gameTick - defender.tick) & 0xffff;
    defender.tick = gameTick;
    defender.counter -= delta;

    if (defender.counter < 0) {
      this.serfs.delete(defender.index);
      serf.fightOpponentIndex = 0;
      serf.tick = gameTick;
      this.#engageBuilding(serf, gameTick);
    }
  }

  // Dead serfs play out their death animation and leave the map.
  #handleDead(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    if (serf.counter < 0) {
      if (this.serfIndexes[serf.position] === serf.index) {
        this.serfIndexes[serf.position] = 0;
      }

      this.serfs.delete(serf.index);
    }
  }

  // Greedy flag-graph routing toward the destination flag (condensed
  // reference FlagSearch breadth-first; sufficient for tree road networks,
  // replaced by the full search with transport scheduling).
  #directionToward(fromFlagIndex: number, destinationFlagIndex: number): Direction | null {
    const visited = new Set<number>([fromFlagIndex]);
    const queue: { flagIndex: number; firstDirection: Direction | null }[] = [
      { flagIndex: fromFlagIndex, firstDirection: null },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const flag = this.world.flags.get(current.flagIndex);
      if (flag === undefined) {
        continue;
      }

      for (const direction of directionOrder) {
        const path = flag.paths[direction];
        if (!path.hasPath || visited.has(path.otherFlagIndex)) {
          continue;
        }

        const firstDirection = current.firstDirection ?? direction;
        if (path.otherFlagIndex === destinationFlagIndex) {
          return firstDirection;
        }

        visited.add(path.otherFlagIndex);
        queue.push({ flagIndex: path.otherFlagIndex, firstDirection });
      }
    }

    return null;
  }
}

// RenderSerf.GetActiveSerfBody, condensed (SB-34 round 7): the serf's
// profession adds its sprite-bank offset to the animation frame before
// the appearance tables resolve torso and head — this is what dresses
// a lumberjack as a lumberjack and puts the carried plank in a
// transporter's arms. Offsets apply to the walking frames (< 0x80).
const transporterCarryOffsets: readonly number[] = [
  0, 0x3000, 0x3500, 0x3b00, 0x4100, 0x4600, 0x4b00, 0x1400,
  0x700, 0x5100, 0x800, 0x1c00, 0x1d00, 0x1e00, 0x1a00, 0x1b00,
  0x6800, 0x6d00, 0x6500, 0x6700, 0x6b00, 0x6a00, 0x6600, 0x6900,
  0x6c00, 0x5700, 0x5600, 0, 0, 0, 0, 0,
];

const professionBodyOffsets: Readonly<Partial<Record<number, number>>> = {
  [buildingType.lumberjack]: 0xb00,
  [buildingType.sawmill]: 0xc00,
  [buildingType.stonecutter]: 0xd00,
  [buildingType.forester]: 0xe00,
  [buildingType.stoneMine]: 0x1800,
  [buildingType.coalMine]: 0x1800,
  [buildingType.ironMine]: 0x1800,
  [buildingType.goldMine]: 0x1800,
  [buildingType.steelSmelter]: 0x1900,
  [buildingType.goldSmelter]: 0x1900,
  [buildingType.fisher]: 0x2c00,
  [buildingType.pigFarm]: 0x3200,
  [buildingType.butcher]: 0x3700,
  [buildingType.farm]: 0x3d00,
  [buildingType.mill]: 0x4300,
  [buildingType.baker]: 0x4800,
  [buildingType.boatbuilder]: 0x4e00,
  [buildingType.toolMaker]: 0x5800,
  [buildingType.weaponSmith]: 0x5200,
};

export function serfBodyOffset(serf: WorldSerf, world: SerfboundGameWorld): number {
  if (serf.isKnight || serf.knightRank > 0 || serf.garrisonTargetIndex !== 0) {
    return 0x7800 + 0x100 * Math.min(4, serf.knightRank);
  }

  if (serf.buildTargetIndex !== 0) {
    return 0x500;
  }

  if (
    serf.carriedResource >= 0 &&
    (serf.state === serfState.transporting ||
      serf.state === serfState.dropResourceOut ||
      serf.state === serfState.leavingBuilding)
  ) {
    // The reference indexes the carry table by Resource.Type + 1.
    return transporterCarryOffsets[serf.carriedResource + 1] ?? 0;
  }

  if (serf.workBuildingIndex !== 0) {
    const workplace = world.buildings.get(serf.workBuildingIndex);
    if (workplace !== undefined) {
      return professionBodyOffsets[workplace.type] ?? 0;
    }
  }

  return 0;
}
