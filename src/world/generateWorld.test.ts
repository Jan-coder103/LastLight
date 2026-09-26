import { describe, expect, it } from 'vitest';
import {
  generateWorld,
  LANDING_CLEARANCE,
  terrainBiomeBlendAt,
  validateWorld,
  WORLD_SIZE,
} from './generateWorld';
import { GridNavigator } from '../navigation/GridNavigator';
import { placeLootCaches } from '../game/loot';

function pathLength(
  navigator: GridNavigator,
  start: { x: number; z: number },
  end: { x: number; z: number },
): number {
  const path = navigator.findPath(start.x, start.z, end.x, end.z);
  let length = 0;
  let previousX = start.x;
  let previousZ = start.z;
  for (const point of path) {
    length += Math.hypot(point.x - previousX, point.z - previousZ);
    previousX = point.x;
    previousZ = point.z;
  }
  return path.length === 0 ? Number.POSITIVE_INFINITY : length;
}

describe('generateWorld', () => {
  it('reproduces layout, collision, and landmark placement from the same named seed', () => {
    const first = generateWorld('MILL-ALPHA');
    const second = generateWorld('MILL-ALPHA');
    expect(second).toEqual(first);
    expect(first.placements.some((placement) => placement.assetId === 'water-tower')).toBe(true);
  });

  it('changes placement for a different seed while staying within explicit map bounds', () => {
    const alpha = generateWorld('MILL-ALPHA');
    const beta = generateWorld('MILL-BRAVO');
    expect(beta.placements).not.toEqual(alpha.placements);
    for (const placement of alpha.placements) {
      expect(Math.abs(placement.position.x)).toBeLessThan(WORLD_SIZE / 2);
      expect(Math.abs(placement.position.z)).toBeLessThan(WORLD_SIZE / 2);
    }
  });

  it('keeps the player spawn clear of generated obstacles', () => {
    const world = generateWorld('RAVEN-07');
    expect(
      world.colliders.some(
        (obstacle) =>
          world.spawn.x >= obstacle.minX - 0.6 &&
          world.spawn.x <= obstacle.maxX + 0.6 &&
          world.spawn.z >= obstacle.minZ - 0.6 &&
          world.spawn.z <= obstacle.maxZ + 0.6,
      ),
    ).toBe(false);
  });

  it('builds seed-specific districts, road variants, loot regions, and landmarks', () => {
    const alpha = generateWorld('MILL-ALPHA');
    const beta = generateWorld('MILL-BRAVO');
    expect(alpha.districts).toHaveLength(5);
    expect(alpha.lootZones.reduce((count, zone) => count + zone.cacheCount, 0)).toBe(7);
    expect(alpha.landmarks.map((landmark) => landmark.id)).toEqual(['water-tower', 'radio-mast']);
    expect(beta.roads).not.toEqual(alpha.roads);
    expect(beta.lootZones).not.toEqual(alpha.lootZones);
    expect(beta.landmarks).not.toEqual(alpha.landmarks);
  });

  it('moves the guaranteed city and forest regions to every map side by seed', () => {
    const worlds = Array.from({ length: 4 }, (_, index) => generateWorld(`PHASE4-0${index}`));
    expect(new Set(worlds.map((world) => world.rotationQuarterTurns)).size).toBe(4);

    for (const world of worlds) {
      const urbanDistricts = world.districts.filter((district) => district.kind === 'urban');
      const forestDistricts = world.districts.filter((district) => district.kind === 'forest');
      expect(urbanDistricts).toHaveLength(3);
      expect(forestDistricts).toHaveLength(2);
      const averageCenter = (districts: typeof urbanDistricts) => ({
        x: districts.reduce((sum, district) => sum + district.centerX, 0) / districts.length,
        z: districts.reduce((sum, district) => sum + district.centerZ, 0) / districts.length,
      });
      const urban = averageCenter(urbanDistricts);
      const forest = averageCenter(forestDistricts);
      const rotation = world.rotationQuarterTurns;
      if (rotation === 0) expect(forest.x).toBeGreaterThan(urban.x);
      if (rotation === 1) expect(forest.z).toBeGreaterThan(urban.z);
      if (rotation === 2) expect(forest.x).toBeLessThan(urban.x);
      if (rotation === 3) expect(forest.z).toBeLessThan(urban.z);

      for (const district of urbanDistricts)
        expect(
          terrainBiomeBlendAt(world.districts, district.centerX, district.centerZ),
        ).toBeGreaterThan(0.8);
      for (const district of forestDistricts)
        expect(
          terrainBiomeBlendAt(world.districts, district.centerX, district.centerZ),
        ).toBeLessThan(0.2);
      expect(validateWorld(world)).toEqual([]);
      for (const district of urbanDistricts)
        expect(
          world.placements.some(
            (placement) =>
              placement.assetId === 'building-shell' &&
              Math.abs(placement.position.x - district.centerX) <= district.radiusX &&
              Math.abs(placement.position.z - district.centerZ) <= district.radiusZ,
          ),
        ).toBe(true);
      for (const district of forestDistricts)
        expect(
          world.placements.some(
            (placement) =>
              (placement.assetId === 'pine-tree' || placement.assetId === 'boulder') &&
              Math.abs(placement.position.x - district.centerX) <= district.radiusX &&
              Math.abs(placement.position.z - district.centerZ) <= district.radiusZ,
          ),
        ).toBe(true);
    }
  });

  it('keeps a broad seed batch valid, navigable, and suitable for chopper insertion', () => {
    for (let index = 0; index < 24; index += 1) {
      const seed = `PHASE4-${String(index).padStart(2, '0')}`;
      const world = generateWorld(seed);
      expect(validateWorld(world), `${seed} layout defects`).toEqual([]);
      expect(
        world.placements.some((placement) => placement.assetId === 'building-shell'),
        `${seed} contains city buildings`,
      ).toBe(true);
      expect(
        world.placements.some(
          (placement) => placement.assetId === 'pine-tree' || placement.assetId === 'boulder',
        ),
        `${seed} contains forest props`,
      ).toBe(true);
      expect(
        world.colliders.every((collider) => {
          const dx = Math.max(collider.minX - world.spawn.x, 0, world.spawn.x - collider.maxX);
          const dz = Math.max(collider.minZ - world.spawn.z, 0, world.spawn.z - collider.maxZ);
          return Math.hypot(dx, dz) >= LANDING_CLEARANCE;
        }),
      ).toBe(true);

      const navigator = new GridNavigator(world);
      expect(navigator.isWalkable(world.spawn.x, world.spawn.z), `${seed} landing`).toBe(true);
      expect(navigator.isWalkable(world.spawn.x + 14, world.spawn.z), `${seed} disembark`).toBe(
        true,
      );
      for (const landmark of world.landmarks) {
        expect(
          navigator.isWalkable(landmark.approachX, landmark.approachZ),
          `${seed} ${landmark.id}`,
        ).toBe(true);
        expect(
          pathLength(navigator, world.spawn, { x: landmark.approachX, z: landmark.approachZ }),
          `${seed} route to ${landmark.id}`,
        ).toBeLessThan(210);
      }
      expect(world.entrances.length, `${seed} accessible building doors`).toBeGreaterThan(0);
      for (const entrance of world.entrances) {
        expect(navigator.isWalkable(entrance.x, entrance.z), `${seed} ${entrance.id} door`).toBe(
          true,
        );
        expect(
          pathLength(navigator, world.spawn, entrance),
          `${seed} route to ${entrance.id}`,
        ).toBeLessThan(260);
      }
    }
  });

  it('keeps world-data generation within a measured 50 ms p95 budget', () => {
    const durations: number[] = [];
    for (let index = 0; index < 24; index += 1) {
      const start = performance.now();
      const world = generateWorld(`PHASE4-LOAD-${String(index).padStart(2, '0')}`);
      durations.push(performance.now() - start);
      expect(world.placements.length).toBeGreaterThan(70);
    }
    const ordered = [...durations].sort((a, b) => a - b);
    const p95 = ordered[Math.ceil(ordered.length * 0.95) - 1];
    const maximum = ordered.at(-1)!;
    console.info(
      `World-data generation: p95 ${p95.toFixed(2)} ms, max ${maximum.toFixed(2)} ms (24 seeds)`,
    );
    expect(p95).toBeLessThan(50);
    expect(maximum).toBeLessThan(100);
  });

  it('distributes seven reachable caches across at least four regions with practical routes', () => {
    for (const seed of ['PHASE4-LOOT-A', 'PHASE4-LOOT-B', 'PHASE4-LOOT-C', 'PHASE4-LOOT-D']) {
      const world = generateWorld(seed);
      const navigator = new GridNavigator(world);
      const caches = placeLootCaches(world, navigator);
      expect(caches, seed).toHaveLength(7);
      expect(new Set(caches.map((cache) => cache.zoneId)).size, seed).toBeGreaterThanOrEqual(4);
      for (const cache of caches)
        expect(pathLength(navigator, world.spawn, cache), `${seed} ${cache.id}`).toBeLessThan(145);
    }
  });
});
