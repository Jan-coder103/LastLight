import { createRandom } from '../core/seededRandom';
import type { GridNavigator } from '../navigation/GridNavigator';
import { terrainHeightAt, type WorldData } from '../world/generateWorld';

export type HordeSpawnPattern = 'ring' | 'clusters' | 'grid';
export type HordeTier = 0 | 1 | 2;

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
}

const nearRange = 34;
const midRange = 92;
const tierIntervals = [1 / 30, 0.16, 0.5] as const;
const attackRange = 1.7;
const attackInterval = 1.3;
const attackDamage = 8;
const cellSize = 4;
const maximumNeighbors = 12;

/**
 * A benchmark-only horde with stable array-index identity. LOD only changes update cadence;
 * health and world position stay in the same arrays when an agent changes tier.
 */
export class HordeSimulation {
  readonly count: number;
  readonly ids: Uint32Array;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly z: Float32Array;
  readonly facing: Float32Array;
  readonly health: Float32Array;
  readonly alive: Uint8Array;
  readonly tier: Uint8Array;
  readonly attacks: Uint16Array;
  private readonly cooldown: Float32Array;
  private readonly tierAccumulator: Float32Array;
  private readonly nextInCell: Int32Array;
  private readonly cellHeads: Int32Array;
  private readonly gridWidth: number;
  private readonly gridOrigin: number;
  private readonly world: WorldData;
  private readonly navigator: GridNavigator;
  private tierRefreshRemaining = 0;
  private tierCounts: HordeTierCounts = { near: 0, mid: 0, far: 0 };
  playerHealth = 100;
  totalPlayerHits = 0;
  lastStepMs = 0;

  constructor(
    count: number,
    seed: string,
    pattern: HordeSpawnPattern,
    world: WorldData,
    navigator: GridNavigator,
  ) {
    if (!Number.isInteger(count) || count < 1 || count > 10_000)
      throw new RangeError('Horde count must be an integer from 1 to 10,000.');
    this.count = count;
    this.world = world;
    this.navigator = navigator;
    this.ids = new Uint32Array(count);
    this.x = new Float32Array(count);
    this.y = new Float32Array(count);
    this.z = new Float32Array(count);
    this.facing = new Float32Array(count);
    this.health = new Float32Array(count);
    this.alive = new Uint8Array(count);
    this.tier = new Uint8Array(count);
    this.attacks = new Uint16Array(count);
    this.cooldown = new Float32Array(count);
    this.tierAccumulator = new Float32Array(count);
    this.nextInCell = new Int32Array(count);
    this.gridWidth = Math.ceil(world.size / cellSize);
    this.gridOrigin = -world.size / 2;
    this.cellHeads = new Int32Array(this.gridWidth * this.gridWidth);
    this.reset(seed, pattern);
  }

  get livingCount(): number {
    let living = 0;
    for (let index = 0; index < this.count; index += 1) living += this.alive[index]!;
    return living;
  }

  get tiers(): HordeTierCounts {
    return { ...this.tierCounts };
  }

  reset(seed: string, pattern: HordeSpawnPattern): void {
    const random = createRandom(seed.trim() || 'HORDE-01');
    const columns = Math.ceil(Math.sqrt(this.count));
    for (let index = 0; index < this.count; index += 1) {
      const point = this.spawnPoint(index, random, pattern, columns);
      const walkable = this.nearestWalkable(point.x, point.z);
      this.ids[index] = index + 1;
      this.x[index] = walkable.x;
      this.y[index] = terrainHeightAt(this.world.seed, walkable.x, walkable.z);
      this.z[index] = walkable.z;
      this.facing[index] = 0;
      this.health[index] = 100;
      this.alive[index] = 1;
      this.tier[index] = 2;
      this.attacks[index] = 0;
      this.cooldown[index] = 0.25 + (index % 11) * 0.07;
      this.tierAccumulator[index] = 0;
    }
    this.playerHealth = 100;
    this.totalPlayerHits = 0;
    this.tierRefreshRemaining = 0;
    this.tierCounts = { near: 0, mid: 0, far: this.count };
    this.rebuildSpatialGrid();
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
    };
  }

  damageAgent(index: number, damage: number): boolean {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.count ||
      this.alive[index] === 0 ||
      damage <= 0
    )
      return false;
    this.health[index] = Math.max(0, this.health[index]! - damage);
    if (this.health[index] === 0) this.alive[index] = 0;
    return true;
  }

  findNearestAgent(x: number, z: number, radius: number): number | undefined {
    const cellX = this.cellCoordinate(x);
    const cellZ = this.cellCoordinate(z);
    const cellRange = Math.ceil(radius / cellSize);
    let nearest: number | undefined;
    let nearestDistanceSquared = radius * radius;
    for (let offsetZ = -cellRange; offsetZ <= cellRange; offsetZ += 1) {
      const row = cellZ + offsetZ;
      if (row < 0 || row >= this.gridWidth) continue;
      for (let offsetX = -cellRange; offsetX <= cellRange; offsetX += 1) {
        const column = cellX + offsetX;
        if (column < 0 || column >= this.gridWidth) continue;
        let index = this.cellHeads[row * this.gridWidth + column]!;
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
          index = this.nextInCell[index]!;
        }
      }
    }
    return nearest;
  }

  tick(deltaSeconds: number, playerX: number, playerZ: number): void {
    const started = performance.now();
    const delta = Math.max(0, Math.min(deltaSeconds, 0.1));
    if (delta === 0) {
      this.lastStepMs = performance.now() - started;
      return;
    }

    this.rebuildSpatialGrid();
    this.tierRefreshRemaining -= delta;
    const refreshTiers = this.tierRefreshRemaining <= 0;
    if (refreshTiers) this.tierRefreshRemaining = 0.25;
    const counts: HordeTierCounts = { near: 0, mid: 0, far: 0 };

    for (let index = 0; index < this.count; index += 1) {
      if (this.alive[index] === 0) continue;
      const dx = playerX - this.x[index]!;
      const dz = playerZ - this.z[index]!;
      const distanceSquared = dx * dx + dz * dz;
      if (refreshTiers) this.tier[index] = this.classifyTier(distanceSquared);
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

  private rebuildSpatialGrid(): void {
    this.cellHeads.fill(-1);
    for (let index = 0; index < this.count; index += 1) {
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
