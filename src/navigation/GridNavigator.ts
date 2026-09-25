import type { WorldCollider, WorldData } from '../world/generateWorld';

export interface NavPoint {
  x: number;
  z: number;
}

export interface DynamicNavObstacle extends NavPoint {
  radius: number;
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

export class GridNavigator {
  readonly cellSize: number;
  readonly width: number;
  readonly origin: number;
  private readonly blocked: Uint8Array;
  private readonly dynamicBlocked: Uint8Array;

  constructor(world: WorldData, cellSize = 2, actorRadius = 0.65) {
    this.cellSize = cellSize;
    this.width = Math.ceil(world.size / cellSize);
    this.origin = -world.size / 2;
    this.blocked = new Uint8Array(this.width * this.width);
    this.dynamicBlocked = new Uint8Array(this.width * this.width);
    for (const collider of world.colliders) this.markCollider(collider, actorRadius);
  }

  isWalkable(x: number, z: number): boolean {
    const cell = this.toCell(x, z);
    return cell !== undefined && !this.isBlocked(cell.x, cell.z);
  }

  setDynamicObstacles(obstacles: readonly DynamicNavObstacle[]): void {
    this.dynamicBlocked.fill(0);
    for (const obstacle of obstacles) this.markDynamicObstacle(obstacle);
  }

  findPath(startX: number, startZ: number, goalX: number, goalZ: number): NavPoint[] {
    const goal = this.nearestWalkable(this.toCell(goalX, goalZ));
    if (!goal) return [];
    const goalPoint = this.cellCenter(goal.x, goal.z);
    return this.search(startX, startZ, goalPoint.x, goalPoint.z, 0, goal);
  }

  findPathToRange(
    startX: number,
    startZ: number,
    goalX: number,
    goalZ: number,
    range: number,
  ): NavPoint[] {
    if (range <= 0) return this.findPath(startX, startZ, goalX, goalZ);
    return this.search(startX, startZ, goalX, goalZ, range);
  }

  isPathWalkable(start: NavPoint, path: readonly NavPoint[]): boolean {
    let previous = start;
    for (const point of path) {
      const distance = Math.hypot(point.x - previous.x, point.z - previous.z);
      const steps = Math.max(1, Math.ceil(distance / (this.cellSize * 0.3)));
      for (let step = 1; step <= steps; step += 1) {
        const blend = step / steps;
        const x = previous.x + (point.x - previous.x) * blend;
        const z = previous.z + (point.z - previous.z) * blend;
        if (!this.isWalkable(x, z)) return false;
      }
      previous = point;
    }
    return true;
  }

  private search(
    startX: number,
    startZ: number,
    goalX: number,
    goalZ: number,
    goalRadius: number,
    exactGoal?: { x: number; z: number },
  ): NavPoint[] {
    const start = this.nearestWalkable(this.toCell(startX, startZ));
    if (!start) return [];
    const startIndex = this.index(start.x, start.z);
    const exactGoalIndex = exactGoal ? this.index(exactGoal.x, exactGoal.z) : undefined;
    const count = this.width * this.width;
    const costs = new Float32Array(count);
    costs.fill(Number.POSITIVE_INFINITY);
    const cameFrom = new Int32Array(count);
    cameFrom.fill(-1);
    const closed = new Uint8Array(count);
    const open = new MinHeap();
    costs[startIndex] = 0;
    open.push({
      index: startIndex,
      priority: this.heuristic(start.x, start.z, goalX, goalZ, goalRadius),
    });

    while (open.size > 0) {
      const current = open.pop()!;
      if (closed[current.index]) continue;
      const currentX = current.index % this.width;
      const currentZ = Math.floor(current.index / this.width);
      if (
        current.index === exactGoalIndex ||
        (exactGoalIndex === undefined &&
          this.distanceToGoal(currentX, currentZ, goalX, goalZ) <= goalRadius)
      ) {
        return this.smoothPath(this.reconstruct(cameFrom, startIndex, current.index), {
          x: startX,
          z: startZ,
        });
      }
      closed[current.index] = 1;

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
          priority: candidate + this.heuristic(nextX, nextZ, goalX, goalZ, goalRadius),
        });
      }
    }
    return [];
  }

  private heuristic(x: number, z: number, goalX: number, goalZ: number, radius: number): number {
    return Math.max(0, this.distanceToGoal(x, z, goalX, goalZ) - radius) / this.cellSize;
  }

  private distanceToGoal(x: number, z: number, goalX: number, goalZ: number): number {
    const center = this.cellCenter(x, z);
    return Math.hypot(center.x - goalX, center.z - goalZ);
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
        const point = this.cellCenter(x, z);
        const nearestX = Math.max(collider.minX, Math.min(point.x, collider.maxX));
        const nearestZ = Math.max(collider.minZ, Math.min(point.z, collider.maxZ));
        if ((point.x - nearestX) ** 2 + (point.z - nearestZ) ** 2 <= paddedRadiusSq) {
          this.blocked[this.index(x, z)] = 1;
        }
      }
    }
  }

  private markDynamicObstacle(obstacle: DynamicNavObstacle): void {
    const padding = this.cellSize * 0.35;
    const radius = Math.max(0, obstacle.radius) + padding;
    const minX = Math.max(0, Math.floor((obstacle.x - radius - this.origin) / this.cellSize));
    const maxX = Math.min(
      this.width - 1,
      Math.floor((obstacle.x + radius - this.origin) / this.cellSize),
    );
    const minZ = Math.max(0, Math.floor((obstacle.z - radius - this.origin) / this.cellSize));
    const maxZ = Math.min(
      this.width - 1,
      Math.floor((obstacle.z + radius - this.origin) / this.cellSize),
    );
    for (let z = minZ; z <= maxZ; z += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const center = this.cellCenter(x, z);
        if (Math.hypot(center.x - obstacle.x, center.z - obstacle.z) <= radius) {
          this.dynamicBlocked[this.index(x, z)] = 1;
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
      return this.cellCenter(x, z);
    });
  }

  private smoothPath(path: NavPoint[], start: NavPoint): NavPoint[] {
    if (path.length < 3) return path;
    const smoothed: NavPoint[] = [];
    let from = start;
    let fromIndex = -1;
    while (fromIndex < path.length - 1) {
      let candidate = path.length - 1;
      while (candidate > fromIndex + 1 && !this.hasClearLine(from, path[candidate])) {
        candidate -= 1;
      }
      const next = path[candidate];
      smoothed.push(next);
      from = next;
      fromIndex = candidate;
    }
    return smoothed;
  }

  private hasClearLine(from: NavPoint, to: NavPoint): boolean {
    const distance = Math.hypot(to.x - from.x, to.z - from.z);
    const steps = Math.max(1, Math.ceil(distance / (this.cellSize * 0.3)));
    for (let step = 1; step <= steps; step += 1) {
      const blend = step / steps;
      if (!this.isWalkable(from.x + (to.x - from.x) * blend, from.z + (to.z - from.z) * blend))
        return false;
    }
    return true;
  }

  private cellCenter(x: number, z: number): NavPoint {
    return {
      x: this.origin + x * this.cellSize + this.cellSize / 2,
      z: this.origin + z * this.cellSize + this.cellSize / 2,
    };
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
    if (x < 0 || z < 0 || x >= this.width || z >= this.width) return true;
    const index = this.index(x, z);
    return this.blocked[index] === 1 || this.dynamicBlocked[index] === 1;
  }
}
