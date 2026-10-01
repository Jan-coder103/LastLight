import { createRandom, hashSeed } from '../core/seededRandom';
import type { GridNavigator } from '../navigation/GridNavigator';
import { terrainHeightAt, type WorldData } from '../world/generateWorld';

export type HordeSpawnPattern = 'ring' | 'clusters' | 'grid';
export type HordeTier = 0 | 1 | 2;
export type HordeBehavior = 'dormant' | 'roaming' | 'investigating' | 'focused' | 'defeated';

export interface HordeSimulationOptions {
  /** Keeps far agents asleep until they enter the local activation radius. */
  dormantActivation?: boolean;
}

export interface HordeTierCounts {
  near: number;
  mid: number;
  far: number;
}

export interface HordeAgentSnapshot {
  id: number;
  x: number;
  z: number;
  health: number;
  alive: boolean;
  tier: HordeTier;
  behavior: HordeBehavior;
}

const nearRange = 34;
const midRange = 92;
const activationRadius = 92;
const maximumAwarenessRadius = 140;
const noiseDecayPerSecond = 0.12;
const investigationDuration = 1.1;
const focusDecayDuration = 1.6;
const tierIntervals = [1 / 30, 0.16, 0.5] as const;
const attackRange = 1.7;
const attackInterval = 1.3;
const attackDamage = 8;
const cellSize = 4;
const maximumNeighbors = 12;
const transformChanged = 1;
const colorChanged = 2;
const dormantState = 0;
const roamingState = 1;
const investigatingState = 2;
const focusedState = 3;
const defeatedState = 4;

/** A seeded horde with stable array-index identity across behavior and render tiers. */
export class HordeSimulation {
  readonly count: number;
  activeCount = 0;
  readonly ids: Uint32Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly facing: Float32Array;
  readonly health: Float32Array;
  readonly alive: Uint8Array;
  readonly tier: Uint8Array;
  readonly attacks: Uint16Array;
  readonly behavior: Uint8Array;
  private readonly cooldown: Float32Array;
  private readonly tierAccumulator: Float32Array;
  private readonly behaviorTimer: Float32Array;
  private readonly focusRemaining: Float32Array;
  private readonly roamTargetX: Float32Array;
  private readonly roamTargetZ: Float32Array;
  private readonly roamAnchorX: Float32Array;
  private readonly roamAnchorZ: Float32Array;
  private readonly roamRandomState: Uint32Array;
  private readonly visualChangeFlags: Uint8Array;
  private pendingVisualChanges: number[] = [];
  private readonly nextInCell: Int32Array;
  private readonly cellHeads: Int32Array;
  private readonly dormantNext: Int32Array;
  private readonly dormantPrevious: Int32Array;
  private readonly dormantCellHeads: Int32Array;
  private readonly activeIndices: number[] = [];
  private readonly activeIndexByAgent: Int32Array;
  private readonly gridWidth: number;
  private readonly gridOrigin: number;
  private readonly world: WorldData;
  private readonly navigator: GridNavigator;
  private readonly dormantActivationEnabled: boolean;
  private seed = 'HORDE-01';
  private random: () => number = () => 0.5;
  private tierRefreshRemaining = 0;
  private tierCounts: HordeTierCounts = { near: 0, mid: 0, far: 0 };
  private dormantCountValue = 0;
  private noiseLevelValue = 0;
  private noiseX = 0;
  private noiseZ = 0;
  playerHealth = 100;
  totalPlayerHits = 0;
  lastStepMs = 0;

  constructor(
    count: number,
    seed: string,
    pattern: HordeSpawnPattern,
    world: WorldData,
    navigator: GridNavigator,
    initialCount = count,
    options: HordeSimulationOptions = {},
  ) {
    if (!Number.isInteger(count) || count < 1 || count > 10_000)
      throw new RangeError('Horde count must be an integer from 1 to 10,000.');
    this.count = count;
    this.world = world;
    this.navigator = navigator;
    this.dormantActivationEnabled = options.dormantActivation ?? false;
    this.ids = new Uint32Array(count);
    this.x = new Float32Array(count);
    this.y = new Float32Array(count);
    this.z = new Float32Array(count);
    this.facing = new Float32Array(count);
    this.health = new Float32Array(count);
    this.alive = new Uint8Array(count);
    this.tier = new Uint8Array(count);
    this.attacks = new Uint16Array(count);
    this.behavior = new Uint8Array(count);
    this.cooldown = new Float32Array(count);
    this.tierAccumulator = new Float32Array(count);
    this.behaviorTimer = new Float32Array(count);
    this.focusRemaining = new Float32Array(count);
    this.roamTargetX = new Float32Array(count);
    this.roamTargetZ = new Float32Array(count);
    this.roamAnchorX = new Float32Array(count);
    this.roamAnchorZ = new Float32Array(count);
    this.roamRandomState = new Uint32Array(count);
    this.visualChangeFlags = new Uint8Array(count);
    this.nextInCell = new Int32Array(count);
    this.dormantNext = new Int32Array(count);
    this.dormantPrevious = new Int32Array(count);
    this.activeIndexByAgent = new Int32Array(count);
    this.gridWidth = Math.ceil(world.size / cellSize);
    this.gridOrigin = -world.size / 2;
    this.cellHeads = new Int32Array(this.gridWidth * this.gridWidth);
    this.dormantCellHeads = new Int32Array(this.gridWidth * this.gridWidth);
    this.reset(seed, pattern, initialCount);
  }

  get livingCount(): number {
    let living = 0;
    for (let index = 0; index < this.activeCount; index += 1) living += this.alive[index]!;
    return living;
  }

  get dormantCount(): number {
    return this.dormantCountValue;
  }

  get activeSimulationCount(): number {
    return this.activeIndices.length;
  }

  get noiseLevel(): number {
    return this.noiseLevelValue;
  }

  get awarenessRadius(): number {
    return this.noiseLevelValue * maximumAwarenessRadius;
  }

  get tiers(): HordeTierCounts {
    return { ...this.tierCounts };
  }

  emitNoise(x: number, z: number, intensity: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(intensity) || intensity <= 0)
      return;
    this.noiseLevelValue = Math.max(this.noiseLevelValue, Math.min(1, intensity));
    this.noiseX = x;
    this.noiseZ = z;
  }

  reset(seed: string, pattern: HordeSpawnPattern, initialCount = this.count): void {
    if (!Number.isInteger(initialCount) || initialCount < 0 || initialCount > this.count)
      throw new RangeError(`Initial horde count must be an integer from 0 to ${this.count}.`);
    this.pendingVisualChanges.length = 0;
    this.visualChangeFlags.fill(0);
    this.seed = seed.trim() || 'HORDE-01';
    this.random = createRandom(this.seed);
    this.activeCount = initialCount;
    this.activeIndices.length = 0;
    this.activeIndexByAgent.fill(-1);
    this.nextInCell.fill(-1);
    this.dormantNext.fill(-1);
    this.dormantPrevious.fill(-1);
    this.cellHeads.fill(-1);
    this.dormantCellHeads.fill(-1);
    this.dormantCountValue = 0;
    this.noiseLevelValue = 0;
    this.noiseX = this.world.spawn.x;
    this.noiseZ = this.world.spawn.z;
    const columns = Math.ceil(Math.sqrt(this.count));
    for (let index = 0; index < this.count; index += 1) {
      const wasAlive = this.alive[index] === 1;
      this.alive[index] = 0;
      this.health[index] = 0;
      this.behavior[index] = defeatedState;
      if (index >= initialCount) {
        if (wasAlive) this.markVisualChanged(index, transformChanged | colorChanged);
        continue;
      }
      const point = this.spawnPoint(index, this.random, pattern, columns);
      const walkable = this.nearestWalkable(point.x, point.z);
      this.initializeAgent(index, walkable.x, walkable.z);
      if (this.dormantActivationEnabled) this.addDormantAgent(index);
      else this.addActiveAgent(index);
    }
    this.playerHealth = 100;
    this.totalPlayerHits = 0;
    this.tierRefreshRemaining = 0;
    this.tierCounts = { near: 0, mid: 0, far: initialCount };
    this.rebuildSpatialGrid();
  }

  spawnOne(centerX = this.world.spawn.x, centerZ = this.world.spawn.z): number | undefined {
    if (this.activeCount >= this.count) return undefined;
    const index = this.activeCount;
    let point: { x: number; z: number } | undefined;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const angle = this.random() * Math.PI * 2;
      const radius = 82 + Math.sqrt(this.random()) * 46;
      const candidate = this.nearestWalkable(
        centerX + Math.cos(angle) * radius,
        centerZ + Math.sin(angle) * radius,
      );
      if (Math.hypot(candidate.x - centerX, candidate.z - centerZ) >= 64) {
        point = candidate;
        break;
      }
    }
    if (!point) {
      const fallback = this.spawnPoint(
        index,
        this.random,
        'ring',
        Math.ceil(Math.sqrt(this.count)),
      );
      point = this.nearestWalkable(fallback.x, fallback.z);
    }
    this.initializeAgent(index, point.x, point.z);
    this.activeCount += 1;
    if (this.dormantActivationEnabled) this.addDormantAgent(index);
    else this.addActiveAgent(index);
    this.rebuildSpatialGrid();
    return index;
  }

  snapshot(index: number): HordeAgentSnapshot {
    if (!Number.isInteger(index) || index < 0 || index >= this.count)
      throw new RangeError('Horde agent index is outside the simulation.');
    return {
      id: this.ids[index]!,
      x: this.x[index]!,
      z: this.z[index]!,
      health: this.health[index]!,
      alive: this.alive[index] === 1,
      tier: this.tier[index]! as HordeTier,
      behavior: this.behaviorName(index),
    };
  }

  damageAgent(index: number, damage: number): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.activeCount ||
      this.alive[index] === 0 ||
      damage <= 0
    )
      return false;
    this.health[index] = Math.max(0, this.health[index]! - damage);
    if (this.health[index] === 0) {
      this.alive[index] = 0;
      if (this.behavior[index] === dormantState) this.removeDormantAgent(index);
      else this.removeActiveAgent(index);
      this.behavior[index] = defeatedState;
    }
    this.markVisualChanged(index, transformChanged);
    return true;
  }

  applyShotKnockback(index: number, sourceX: number, sourceZ: number, distance = 0.26): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.activeCount ||
      this.alive[index] === 0
    )
      return false;
    const directionX = this.x[index]! - sourceX;
    const directionZ = this.z[index]! - sourceZ;
    const length = Math.hypot(directionX, directionZ);
    if (length < 0.001) return false;
    const step = Math.min(0.3, Math.max(0, distance)) / length;
    const x = this.x[index]! + directionX * step;
    const z = this.z[index]! + directionZ * step;
    if (!this.navigator.isWalkable(x, z)) return false;
    this.x[index] = x;
    this.z[index] = z;
    this.y[index] = terrainHeightAt(this.world.seed, x, z);
    this.markVisualChanged(index, transformChanged);
    return true;
  }

  damageAgentsInRadius(x: number, z: number, radius: number, damage: number): number {
    if (radius < 0 || damage <= 0) return 0;
    let affected = 0;
    const radiusSquared = radius * radius;
    for (let index = 0; index < this.activeCount; index += 1) {
      if (this.alive[index] === 0) continue;
      const dx = this.x[index]! - x;
      const dz = this.z[index]! - z;
      if (dx * dx + dz * dz > radiusSquared) continue;
      this.damageAgent(index, damage);
      affected += 1;
    }
    return affected;
  }

  consumeVisualChanges(visit: (index: number, transform: boolean, color: boolean) => void): void {
    for (const index of this.pendingVisualChanges) {
      const flags = this.visualChangeFlags[index]!;
      visit(index, (flags & transformChanged) !== 0, (flags & colorChanged) !== 0);
      this.visualChangeFlags[index] = 0;
    }
    this.pendingVisualChanges.length = 0;
  }

  findNearestAgent(x: number, z: number, radius: number): number | undefined {
    const cellX = this.cellCoordinate(x);
    const cellZ = this.cellCoordinate(z);
    const cellRange = Math.ceil(radius / cellSize);
    let nearest: number | undefined;
    let nearestDistanceSquared = radius * radius;
    const searchGrid = (heads: Int32Array, links: Int32Array): void => {
      for (let offsetZ = -cellRange; offsetZ <= cellRange; offsetZ += 1) {
        const row = cellZ + offsetZ;
        if (row < 0 || row >= this.gridWidth) continue;
        for (let offsetX = -cellRange; offsetX <= cellRange; offsetX += 1) {
          const column = cellX + offsetX;
          if (column < 0 || column >= this.gridWidth) continue;
          let index = heads[row * this.gridWidth + column]!;
          while (index >= 0) {
            if (this.alive[index] === 1) {
              const dx = x - this.x[index]!;
              const dz = z - this.z[index]!;
              const distanceSquared = dx * dx + dz * dz;
              if (distanceSquared <= nearestDistanceSquared) {
                nearestDistanceSquared = distanceSquared;
                nearest = index;
              }
            }
            index = links[index]!;
          }
        }
      }
    };
    searchGrid(this.cellHeads, this.nextInCell);
    searchGrid(this.dormantCellHeads, this.dormantNext);
    return nearest;
  }

  tick(deltaSeconds: number, playerX: number, playerZ: number): void {
    const started = performance.now();
    const delta = Math.max(0, Math.min(deltaSeconds, 0.1));
    if (delta === 0) {
      this.lastStepMs = performance.now() - started;
      return;
    }

    this.noiseLevelValue = Math.max(0, this.noiseLevelValue - noiseDecayPerSecond * delta);
    if (this.dormantActivationEnabled) {
      this.tickDormantSimulation(delta, playerX, playerZ);
      this.lastStepMs = performance.now() - started;
      return;
    }

    this.rebuildSpatialGrid();
    this.tierRefreshRemaining -= delta;
    const refreshTiers = this.tierRefreshRemaining <= 0;
    if (refreshTiers) this.tierRefreshRemaining = 0.25;
    const counts: HordeTierCounts = { near: 0, mid: 0, far: 0 };

    for (const index of this.activeIndices) {
      if (this.alive[index] === 0) continue;
      const dx = playerX - this.x[index]!;
      const dz = playerZ - this.z[index]!;
      const distanceSquared = dx * dx + dz * dz;
      if (refreshTiers) {
        const nextTier = this.classifyTier(distanceSquared);
        if (this.tier[index] !== nextTier) {
          this.tier[index] = nextTier;
          this.markVisualChanged(index, colorChanged);
        }
      }
      const tier = this.tier[index]! as HordeTier;
      if (tier === 0) counts.near += 1;
      else if (tier === 1) counts.mid += 1;
      else counts.far += 1;

      this.tierAccumulator[index] += delta;
      if (this.tierAccumulator[index]! < tierIntervals[tier]) continue;
      const elapsed = this.tierAccumulator[index]!;
      this.tierAccumulator[index] = 0;
      this.advanceAgent(index, elapsed, dx, dz, distanceSquared, playerX, playerZ);
    }

    this.tierCounts = counts;
    this.lastStepMs = performance.now() - started;
  }

  private behaviorName(index: number): HordeBehavior {
    switch (this.behavior[index]) {
      case dormantState:
        return 'dormant';
      case roamingState:
        return 'roaming';
      case investigatingState:
        return 'investigating';
      case focusedState:
        return 'focused';
      default:
        return 'defeated';
    }
  }

  private addActiveAgent(index: number): void {
    if (this.activeIndexByAgent[index]! >= 0) return;
    this.activeIndexByAgent[index] = this.activeIndices.length;
    this.activeIndices.push(index);
  }

  private removeActiveAgent(index: number): void {
    const activeIndex = this.activeIndexByAgent[index]!;
    if (activeIndex < 0) return;
    const lastIndex = this.activeIndices.length - 1;
    const movedAgent = this.activeIndices[lastIndex]!;
    this.activeIndices.pop();
    this.activeIndexByAgent[index] = -1;
    if (activeIndex < lastIndex) {
      this.activeIndices[activeIndex] = movedAgent;
      this.activeIndexByAgent[movedAgent] = activeIndex;
    }
    this.nextInCell[index] = -1;
  }

  private addDormantAgent(index: number): void {
    const cellX = this.cellCoordinate(this.x[index]!);
    const cellZ = this.cellCoordinate(this.z[index]!);
    const cellIndex = cellZ * this.gridWidth + cellX;
    const head = this.dormantCellHeads[cellIndex]!;
    this.dormantPrevious[index] = -1;
    this.dormantNext[index] = head;
    if (head >= 0) this.dormantPrevious[head] = index;
    this.dormantCellHeads[cellIndex] = index;
    this.dormantCountValue += 1;
  }

  private removeDormantAgent(index: number): void {
    const cellX = this.cellCoordinate(this.x[index]!);
    const cellZ = this.cellCoordinate(this.z[index]!);
    const cellIndex = cellZ * this.gridWidth + cellX;
    const previous = this.dormantPrevious[index]!;
    const next = this.dormantNext[index]!;
    if (previous >= 0) this.dormantNext[previous] = next;
    else if (this.dormantCellHeads[cellIndex] === index) this.dormantCellHeads[cellIndex] = next;
    if (next >= 0) this.dormantPrevious[next] = previous;
    this.dormantPrevious[index] = -1;
    this.dormantNext[index] = -1;
    this.dormantCountValue = Math.max(0, this.dormantCountValue - 1);
  }

  private sleepDistantAgents(playerX: number, playerZ: number): void {
    const radiusSquared = activationRadius * activationRadius;
    let cursor = 0;
    while (cursor < this.activeIndices.length) {
      const index = this.activeIndices[cursor]!;
      const dx = playerX - this.x[index]!;
      const dz = playerZ - this.z[index]!;
      if (dx * dx + dz * dz <= radiusSquared) {
        cursor += 1;
        continue;
      }
      this.removeActiveAgent(index);
      this.behavior[index] = dormantState;
      this.behaviorTimer[index] = 0;
      this.focusRemaining[index] = 0;
      this.setTier(index, 2);
      this.addDormantAgent(index);
    }
  }

  private wakeNearbyAgents(playerX: number, playerZ: number): void {
    const cellX = this.cellCoordinate(playerX);
    const cellZ = this.cellCoordinate(playerZ);
    const cellRange = Math.ceil(activationRadius / cellSize);
    const radiusSquared = activationRadius * activationRadius;
    const awareness = this.awarenessRadius;
    const awarenessSquared = awareness * awareness;
    for (let offsetZ = -cellRange; offsetZ <= cellRange; offsetZ += 1) {
      const row = cellZ + offsetZ;
      if (row < 0 || row >= this.gridWidth) continue;
      for (let offsetX = -cellRange; offsetX <= cellRange; offsetX += 1) {
        const column = cellX + offsetX;
        if (column < 0 || column >= this.gridWidth) continue;
        let index = this.dormantCellHeads[row * this.gridWidth + column]!;
        while (index >= 0) {
          const next = this.dormantNext[index]!;
          const dx = playerX - this.x[index]!;
          const dz = playerZ - this.z[index]!;
          const distanceSquared = dx * dx + dz * dz;
          if (this.alive[index] === 1 && distanceSquared <= radiusSquared) {
            this.removeDormantAgent(index);
            this.addActiveAgent(index);
            this.setTier(index, this.classifyTier(distanceSquared));
            this.roamAnchorX[index] = this.x[index]!;
            this.roamAnchorZ[index] = this.z[index]!;
            this.chooseRoamTarget(index);
            if (awareness > 0 && distanceSquared <= awarenessSquared)
              this.beginInvestigation(index);
            else this.behavior[index] = roamingState;
          }
          index = next;
        }
      }
    }
  }

  private tickDormantSimulation(delta: number, playerX: number, playerZ: number): void {
    this.sleepDistantAgents(playerX, playerZ);
    this.wakeNearbyAgents(playerX, playerZ);
    this.rebuildSpatialGrid();
    this.tierRefreshRemaining -= delta;
    const refreshTiers = this.tierRefreshRemaining <= 0;
    if (refreshTiers) this.tierRefreshRemaining = 0.25;
    const counts: HordeTierCounts = { near: 0, mid: 0, far: this.dormantCountValue };

    for (const index of this.activeIndices) {
      if (this.alive[index] === 0) continue;
      const dx = playerX - this.x[index]!;
      const dz = playerZ - this.z[index]!;
      const distanceSquared = dx * dx + dz * dz;
      if (refreshTiers) this.setTier(index, this.classifyTier(distanceSquared));
      const tier = this.tier[index]! as HordeTier;
      if (tier === 0) counts.near += 1;
      else if (tier === 1) counts.mid += 1;
      else counts.far += 1;

      this.tierAccumulator[index] += delta;
      if (this.tierAccumulator[index]! < tierIntervals[tier]) continue;
      const elapsed = this.tierAccumulator[index]!;
      this.tierAccumulator[index] = 0;
      this.advanceLifecycleAgent(index, elapsed, distanceSquared, playerX, playerZ);
    }

    this.tierCounts = counts;
  }

  private beginInvestigation(index: number): void {
    this.behavior[index] = investigatingState;
    this.behaviorTimer[index] = investigationDuration;
    this.focusRemaining[index] = focusDecayDuration;
  }

  private beginRoaming(index: number): void {
    this.behavior[index] = roamingState;
    this.behaviorTimer[index] = 0;
    this.focusRemaining[index] = 0;
    this.roamAnchorX[index] = this.x[index]!;
    this.roamAnchorZ[index] = this.z[index]!;
    this.chooseRoamTarget(index);
  }

  private advanceLifecycleAgent(
    index: number,
    delta: number,
    distanceSquared: number,
    playerX: number,
    playerZ: number,
  ): void {
    const awareness = this.awarenessRadius;
    const aware = awareness > 0 && distanceSquared <= awareness * awareness;
    let state = this.behavior[index]!;
    if (aware) {
      this.focusRemaining[index] = focusDecayDuration;
      if (state === roamingState) this.beginInvestigation(index);
      state = this.behavior[index]!;
    } else {
      this.focusRemaining[index] = Math.max(0, this.focusRemaining[index]! - delta);
      if (
        (state === investigatingState || state === focusedState) &&
        this.focusRemaining[index] === 0
      ) {
        this.beginRoaming(index);
        state = roamingState;
      }
    }

    let targetX = this.roamTargetX[index]!;
    let targetZ = this.roamTargetZ[index]!;
    let speed = 0.52;
    if (state === investigatingState) {
      this.behaviorTimer[index] = Math.max(0, this.behaviorTimer[index]! - delta);
      targetX = this.noiseX;
      targetZ = this.noiseZ;
      speed = 1.35;
      const noiseDistance = Math.hypot(targetX - this.x[index]!, targetZ - this.z[index]!);
      if (noiseDistance <= 1.8 || this.behaviorTimer[index] === 0) {
        this.behavior[index] = focusedState;
        state = focusedState;
      }
    }
    if (state === focusedState) {
      targetX = playerX;
      targetZ = playerZ;
      speed = this.tier[index] === 0 ? 1.85 : 1.6;
    } else if (state === roamingState) {
      const roamDistance = Math.hypot(targetX - this.x[index]!, targetZ - this.z[index]!);
      if (roamDistance <= 1.2) {
        this.chooseRoamTarget(index);
        targetX = this.roamTargetX[index]!;
        targetZ = this.roamTargetZ[index]!;
      }
    }

    this.cooldown[index] = Math.max(0, this.cooldown[index]! - delta);
    if (state === focusedState && distanceSquared <= attackRange * attackRange) {
      if (this.cooldown[index] === 0) {
        this.cooldown[index] = attackInterval;
        this.attacks[index] = Math.min(65_535, this.attacks[index]! + 1);
        this.totalPlayerHits += 1;
        this.playerHealth = Math.max(0, this.playerHealth - attackDamage);
      }
      return;
    }
    this.moveAgentToward(index, targetX, targetZ, playerX, playerZ, delta, speed);
  }

  private moveAgentToward(
    index: number,
    targetX: number,
    targetZ: number,
    playerX: number,
    playerZ: number,
    delta: number,
    speed: number,
  ): void {
    const dx = targetX - this.x[index]!;
    const dz = targetZ - this.z[index]!;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.001) return;
    let directionX = dx / distance;
    let directionZ = dz / distance;
    const separation = this.separationVector(index);
    directionX += separation.x * 0.8;
    directionZ += separation.z * 0.8;
    const magnitude = Math.hypot(directionX, directionZ);
    if (magnitude < 0.0001) return;
    directionX /= magnitude;
    directionZ /= magnitude;
    const travel = Math.min(speed * delta, distance);
    let nextX = this.x[index]! + directionX * travel;
    let nextZ = this.z[index]! + directionZ * travel;
    if (!this.navigator.isWalkable(nextX, nextZ)) {
      const leftX = -directionZ;
      const leftZ = directionX;
      const rightX = directionZ;
      const rightZ = -directionX;
      const canMoveLeft = this.navigator.isWalkable(
        this.x[index]! + leftX * travel,
        this.z[index]! + leftZ * travel,
      );
      const canMoveRight = this.navigator.isWalkable(
        this.x[index]! + rightX * travel,
        this.z[index]! + rightZ * travel,
      );
      if (canMoveLeft && canMoveRight) {
        const leftDistance = Math.hypot(
          playerX - (this.x[index]! + leftX * travel),
          playerZ - (this.z[index]! + leftZ * travel),
        );
        const rightDistance = Math.hypot(
          playerX - (this.x[index]! + rightX * travel),
          playerZ - (this.z[index]! + rightZ * travel),
        );
        const useLeft = leftDistance <= rightDistance;
        nextX = this.x[index]! + (useLeft ? leftX : rightX) * travel;
        nextZ = this.z[index]! + (useLeft ? leftZ : rightZ) * travel;
      } else if (canMoveLeft) {
        nextX = this.x[index]! + leftX * travel;
        nextZ = this.z[index]! + leftZ * travel;
      } else if (canMoveRight) {
        nextX = this.x[index]! + rightX * travel;
        nextZ = this.z[index]! + rightZ * travel;
      } else {
        return;
      }
    }
    this.x[index] = nextX;
    this.y[index] = terrainHeightAt(this.world.seed, nextX, nextZ);
    this.z[index] = nextZ;
    this.facing[index] = Math.atan2(-directionX, -directionZ);
    this.markVisualChanged(index, transformChanged);
  }

  private chooseRoamTarget(index: number): void {
    const angle = this.nextRoamRandom(index) * Math.PI * 2;
    const distance = 4 + Math.sqrt(this.nextRoamRandom(index)) * 12;
    const anchorX = this.roamAnchorX[index]!;
    const anchorZ = this.roamAnchorZ[index]!;
    let point = this.nearestWalkable(
      anchorX + Math.cos(angle) * distance,
      anchorZ + Math.sin(angle) * distance,
    );
    if (Math.hypot(point.x - anchorX, point.z - anchorZ) > 16) point = { x: anchorX, z: anchorZ };
    this.roamTargetX[index] = point.x;
    this.roamTargetZ[index] = point.z;
  }

  private nextRoamRandom(index: number): number {
    let value = this.roamRandomState[index]!;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.roamRandomState[index] = value >>> 0;
    return (value >>> 0) / 4_294_967_296;
  }

  private setTier(index: number, nextTier: HordeTier): void {
    if (this.tier[index] === nextTier) return;
    this.tier[index] = nextTier;
    this.markVisualChanged(index, colorChanged);
  }

  private spawnPoint(
    index: number,
    random: () => number,
    pattern: HordeSpawnPattern,
    columns: number,
  ): { x: number; z: number } {
    const baseX = this.world.spawn.x;
    const baseZ = this.world.spawn.z;
    if (pattern === 'grid') {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const rows = Math.ceil(this.count / columns);
      const gridSide = (columns - 1) * 2.45;
      const gridDepth = (rows - 1) * 2.3;
      const centerOffset = Math.min(72, Math.max(0, this.world.size / 2 - gridDepth / 2 - 4));
      return {
        x: baseX - gridSide / 2 + column * 2.45,
        z: baseZ - centerOffset - gridDepth / 2 + row * 2.3,
      };
    }
    if (pattern === 'clusters') {
      const clusterCount = 8;
      const cluster = index % clusterCount;
      const angle = (cluster / clusterCount) * Math.PI * 2;
      const centerRadius = 72;
      const spread = 8 + Math.sqrt(random()) * 22;
      const offsetAngle = random() * Math.PI * 2;
      const centerX = baseX + Math.cos(angle) * centerRadius;
      const centerZ = baseZ + Math.sin(angle) * centerRadius;
      return {
        x: centerX + Math.cos(offsetAngle) * spread,
        z: centerZ + Math.sin(offsetAngle) * spread,
      };
    }

    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 112 + 20;
    return { x: baseX + Math.cos(angle) * radius, z: baseZ + Math.sin(angle) * radius };
  }

  private nearestWalkable(x: number, z: number): { x: number; z: number } {
    const clamp = (value: number): number =>
      Math.max(-this.world.size / 2 + 2, Math.min(value, this.world.size / 2 - 2));
    const targetX = clamp(x);
    const targetZ = clamp(z);
    if (this.navigator.isWalkable(targetX, targetZ)) return { x: targetX, z: targetZ };
    const step = this.navigator.cellSize;
    for (let radius = 1; radius <= 8; radius += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const candidateX = clamp(targetX + dx * step);
          const candidateZ = clamp(targetZ + dz * step);
          if (this.navigator.isWalkable(candidateX, candidateZ))
            return { x: candidateX, z: candidateZ };
        }
      }
    }
    return { x: clamp(this.world.spawn.x), z: clamp(this.world.spawn.z) };
  }

  private classifyTier(distanceSquared: number): HordeTier {
    if (distanceSquared <= nearRange * nearRange) return 0;
    if (distanceSquared <= midRange * midRange) return 1;
    return 2;
  }

  private initializeAgent(index: number, x: number, z: number): void {
    this.ids[index] = index + 1;
    this.x[index] = x;
    this.y[index] = terrainHeightAt(this.world.seed, x, z);
    this.z[index] = z;
    this.facing[index] = 0;
    this.health[index] = 100;
    this.alive[index] = 1;
    this.tier[index] = 2;
    this.behavior[index] = this.dormantActivationEnabled ? dormantState : focusedState;
    this.attacks[index] = 0;
    this.cooldown[index] = 0.25 + (index % 11) * 0.07;
    this.tierAccumulator[index] = 0;
    this.nextInCell[index] = -1;
    this.dormantNext[index] = -1;
    this.dormantPrevious[index] = -1;
    this.activeIndexByAgent[index] = -1;
    this.behaviorTimer[index] = 0;
    this.focusRemaining[index] = 0;
    this.roamAnchorX[index] = x;
    this.roamAnchorZ[index] = z;
    this.roamTargetX[index] = x;
    this.roamTargetZ[index] = z;
    this.roamRandomState[index] = hashSeed(`${this.seed}:agent-${index + 1}:roam`) || 0x6d2b79f5;
    this.markVisualChanged(index, transformChanged | colorChanged);
  }

  private rebuildSpatialGrid(): void {
    this.cellHeads.fill(-1);
    for (const index of this.activeIndices) {
      if (this.alive[index] === 0) {
        this.nextInCell[index] = -1;
        continue;
      }
      const cellX = this.cellCoordinate(this.x[index]!);
      const cellZ = this.cellCoordinate(this.z[index]!);
      const cellIndex = cellZ * this.gridWidth + cellX;
      this.nextInCell[index] = this.cellHeads[cellIndex]!;
      this.cellHeads[cellIndex] = index;
    }
  }

  private cellCoordinate(value: number): number {
    return Math.max(
      0,
      Math.min(this.gridWidth - 1, Math.floor((value - this.gridOrigin) / cellSize)),
    );
  }

  private advanceAgent(
    index: number,
    delta: number,
    dx: number,
    dz: number,
    distanceSquared: number,
    playerX: number,
    playerZ: number,
  ): void {
    const distance = Math.sqrt(distanceSquared);
    this.cooldown[index] = Math.max(0, this.cooldown[index]! - delta);
    if (distance <= attackRange) {
      if (this.cooldown[index] === 0) {
        this.cooldown[index] = attackInterval;
        this.attacks[index] = Math.min(65_535, this.attacks[index]! + 1);
        this.totalPlayerHits += 1;
        this.playerHealth = Math.max(0, this.playerHealth - attackDamage);
      }
      return;
    }

    let directionX = dx / Math.max(distance, 0.001);
    let directionZ = dz / Math.max(distance, 0.001);
    const separation = this.separationVector(index);
    directionX += separation.x * 0.95;
    directionZ += separation.z * 0.95;
    const magnitude = Math.hypot(directionX, directionZ);
    if (magnitude < 0.0001) return;
    directionX /= magnitude;
    directionZ /= magnitude;

    const speed = this.tier[index] === 0 ? 1.85 : this.tier[index] === 1 ? 1.6 : 1.3;
    const travel = speed * delta;
    let nextX = this.x[index]! + directionX * travel;
    let nextZ = this.z[index]! + directionZ * travel;
    if (!this.navigator.isWalkable(nextX, nextZ)) {
      const leftX = -directionZ;
      const leftZ = directionX;
      const rightX = directionZ;
      const rightZ = -directionX;
      const canMoveLeft = this.navigator.isWalkable(
        this.x[index]! + leftX * travel,
        this.z[index]! + leftZ * travel,
      );
      const canMoveRight = this.navigator.isWalkable(
        this.x[index]! + rightX * travel,
        this.z[index]! + rightZ * travel,
      );
      if (canMoveLeft && canMoveRight) {
        const leftDistance = Math.hypot(
          playerX - (this.x[index]! + leftX * travel),
          playerZ - (this.z[index]! + leftZ * travel),
        );
        const rightDistance = Math.hypot(
          playerX - (this.x[index]! + rightX * travel),
          playerZ - (this.z[index]! + rightZ * travel),
        );
        const useLeft = leftDistance <= rightDistance;
        nextX = this.x[index]! + (useLeft ? leftX : rightX) * travel;
        nextZ = this.z[index]! + (useLeft ? leftZ : rightZ) * travel;
      } else if (canMoveLeft) {
        nextX = this.x[index]! + leftX * travel;
        nextZ = this.z[index]! + leftZ * travel;
      } else if (canMoveRight) {
        nextX = this.x[index]! + rightX * travel;
        nextZ = this.z[index]! + rightZ * travel;
      } else {
        return;
      }
    }
    this.x[index] = nextX;
    this.y[index] = terrainHeightAt(this.world.seed, nextX, nextZ);
    this.z[index] = nextZ;
    this.facing[index] = Math.atan2(-directionX, -directionZ);
    this.markVisualChanged(index, transformChanged);
  }

  private markVisualChanged(index: number, flags: number): void {
    if (this.visualChangeFlags[index] === 0) this.pendingVisualChanges.push(index);
    this.visualChangeFlags[index] = this.visualChangeFlags[index]! | flags;
  }

  private separationVector(index: number): { x: number; z: number } {
    const ownX = this.x[index]!;
    const ownZ = this.z[index]!;
    const cellX = this.cellCoordinate(ownX);
    const cellZ = this.cellCoordinate(ownZ);
    let repelX = 0;
    let repelZ = 0;
    let neighbors = 0;
    for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
      const row = cellZ + offsetZ;
      if (row < 0 || row >= this.gridWidth) continue;
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const column = cellX + offsetX;
        if (column < 0 || column >= this.gridWidth) continue;
        let other = this.cellHeads[row * this.gridWidth + column]!;
        while (other >= 0 && neighbors < maximumNeighbors) {
          if (other !== index && this.alive[other] === 1) {
            const dx = ownX - this.x[other]!;
            const dz = ownZ - this.z[other]!;
            const distanceSquared = dx * dx + dz * dz;
            if (distanceSquared > 0.0001 && distanceSquared < 6.25) {
              const weight = (2.5 - Math.sqrt(distanceSquared)) / 2.5;
              repelX += (dx / Math.sqrt(distanceSquared)) * weight;
              repelZ += (dz / Math.sqrt(distanceSquared)) * weight;
              neighbors += 1;
            }
          }
          other = this.nextInCell[other]!;
        }
        if (neighbors >= maximumNeighbors) return { x: repelX, z: repelZ };
      }
    }
    return { x: repelX, z: repelZ };
  }
}
