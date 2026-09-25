import { describe, expect, it } from 'vitest';
import { generateWorld, WORLD_SIZE } from './generateWorld';

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
});
