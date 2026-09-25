import type { WorldCollider, WorldData } from '../world/generateWorld';

export interface NavPoint {
  x: number;
  z: number;
}

interface HeapEntry {
  index: number;
  priority: number;
}

class MinHeap {
  private entries: HeapEntry[] = [];

  push(entry: HeapEntry): void {
    this.entries.push(entry);
    let child = this.entries.length - 1;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (this.entries[parent].priority <= entry.priority) break;
      this.entries[child] = this.entries[parent];
      child = parent;
    }
    this.entries[child] = entry;
  }

  pop(): HeapEntry | undefined {
    if (this.entries.length === 0) return undefined;
    const first = this.entries[0];
    const last = this.entries.pop()!;
    if (this.entries.length > 0) {
      let parent = 0;
      while (true) {
        const left = parent * 2 + 1;
        const right = left + 1;
        if (left >= this.entries.length) break;
        const child =
          right < this.entries.length && this.entries[right].priority < this.entries[left].priority
            ? right
            : left;
        if (this.entries[child].priority >= last.priority) break;
        this.entries[parent] = this.entries[child];
        parent = child;
      }
      this.entries[parent] = last;
    }
    return first;
  }

  get size(): number {
    return this.entries.length;
  }
}

const directions = [
  [-1, -1, Math.SQRT2],
  [0, -1, 1],
  [1, -1, Math.SQRT2],
  [-1, 0, 1],
  [1, 0, 1],
  [-1, 1, Math.SQRT2],
  [0, 1, 1],
  [1, 1, Math.SQRT2],
] as const;

function octileDistance(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
}

export class GridNavigator {
  readonly cellSize: number;
  readonly width: number;
  readonly origin: number;
  private readonly blocked: Uint8Array;

  constructor(world: WorldData, cellSize = 2, actorRadius = 0.65) {
    this.cellSize = cellSize;
    this.width = Math.ceil(world.size / cellSize);
    this.origin = -world.size / 2;
    this.blocked = new Uint8Array(this.width * this.width);
    for (const collider of world.colliders) this.markCollider(collider, actorRadius);
  }

  isWalkable(x: number, z: number): boolean {
    const cell = this.toCell(x, z);
    return cell !== undefined && !this.isBlocked(cell.x, cell.z);
  }

  findPath(startX: number, startZ: number, goalX: number, goalZ: number): NavPoint[] {
    const start = this.nearestWalkable(this.toCell(startX, startZ));
    const goal = this.nearestWalkable(this.toCell(goalX, goalZ));
    if (!start || !goal || (start.x === goal.x && start.z === goal.z)) return [];

    const startIndex = this.index(start.x, start.z);
    const goalIndex = this.index(goal.x, goal.z);
    const count = this.width * this.width;
    const costs = new Float32Array(count);
    costs.fill(Number.POSITIVE_INFINITY);
    const cameFrom = new Int32Array(count);
    cameFrom.fill(-1);
    const closed = new Uint8Array(count);
    const open = new MinHeap();
    costs[startIndex] = 0;
    open.push({ index: startIndex, priority: octileDistance(start.x, start.z, goal.x, goal.z) });

    while (open.size > 0) {
      const current = open.pop()!;
      if (closed[current.index]) continue;
      if (current.index === goalIndex) return this.reconstruct(cameFrom, startIndex, goalIndex);
      closed[current.index] = 1;
      const currentX = current.index % this.width;
      const currentZ = Math.floor(current.index / this.width);

      for (const [stepX, stepZ, stepCost] of directions) {
        const nextX = currentX + stepX;
        const nextZ = currentZ + stepZ;
        if (this.isBlocked(nextX, nextZ)) continue;
        if (
          stepX !== 0 &&
          stepZ !== 0 &&
          (this.isBlocked(currentX + stepX, currentZ) || this.isBlocked(currentX, currentZ + stepZ))
        )
          continue;
        const nextIndex = this.index(nextX, nextZ);
        if (closed[nextIndex]) continue;
        const candidate = costs[current.index] + stepCost;
        if (candidate >= costs[nextIndex]) continue;
        costs[nextIndex] = candidate;
        cameFrom[nextIndex] = current.index;
        open.push({
          index: nextIndex,
          priority: candidate + octileDistance(nextX, nextZ, goal.x, goal.z),
        });
      }
    }
    return [];
  }

  private markCollider(collider: WorldCollider, radius: number): void {
    const minX = Math.max(0, Math.floor((collider.minX - radius - this.origin) / this.cellSize));
    const maxX = Math.min(
      this.width - 1,
      Math.floor((collider.maxX + radius - this.origin) / this.cellSize),
    );
    const minZ = Math.max(0, Math.floor((collider.minZ - radius - this.origin) / this.cellSize));
    const maxZ = Math.min(
      this.width - 1,
      Math.floor((collider.maxZ + radius - this.origin) / this.cellSize),
    );
    const paddedRadiusSq = radius * radius;
    for (let z = minZ; z <= maxZ; z += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const pointX = this.origin + x * this.cellSize + this.cellSize / 2;
        const pointZ = this.origin + z * this.cellSize + this.cellSize / 2;
        const nearestX = Math.max(collider.minX, Math.min(pointX, collider.maxX));
        const nearestZ = Math.max(collider.minZ, Math.min(pointZ, collider.maxZ));
        if ((pointX - nearestX) ** 2 + (pointZ - nearestZ) ** 2 <= paddedRadiusSq) {
          this.blocked[this.index(x, z)] = 1;
        }
      }
    }
  }

  private nearestWalkable(
    cell: { x: number; z: number } | undefined,
  ): { x: number; z: number } | undefined {
    if (!cell) return undefined;
    if (!this.isBlocked(cell.x, cell.z)) return cell;
    for (let radius = 1; radius <= 8; radius += 1) {
      let best: { x: number; z: number } | undefined;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let z = cell.z - radius; z <= cell.z + radius; z += 1) {
        for (let x = cell.x - radius; x <= cell.x + radius; x += 1) {
          if (
            Math.max(Math.abs(x - cell.x), Math.abs(z - cell.z)) !== radius ||
            this.isBlocked(x, z)
          )
            continue;
          const distance = (x - cell.x) ** 2 + (z - cell.z) ** 2;
          if (distance < bestDistance) {
            best = { x, z };
            bestDistance = distance;
          }
        }
      }
      if (best) return best;
    }
    return undefined;
  }

  private reconstruct(cameFrom: Int32Array, start: number, goal: number): NavPoint[] {
    const indices: number[] = [goal];
    let current = goal;
    while (current !== start) {
      current = cameFrom[current];
      if (current < 0) return [];
      indices.push(current);
    }
    indices.reverse();
    return indices.slice(1).map((index) => {
      const x = index % this.width;
      const z = Math.floor(index / this.width);
      return {
        x: this.origin + x * this.cellSize + this.cellSize / 2,
        z: this.origin + z * this.cellSize + this.cellSize / 2,
      };
    });
  }

  private toCell(x: number, z: number): { x: number; z: number } | undefined {
    const cellX = Math.floor((x - this.origin) / this.cellSize);
    const cellZ = Math.floor((z - this.origin) / this.cellSize);
    if (cellX < 0 || cellZ < 0 || cellX >= this.width || cellZ >= this.width) return undefined;
    return { x: cellX, z: cellZ };
  }

  private index(x: number, z: number): number {
    return z * this.width + x;
  }

  private isBlocked(x: number, z: number): boolean {
    return (
      x < 0 || z < 0 || x >= this.width || z >= this.width || this.blocked[this.index(x, z)] === 1
    );
  }
}
