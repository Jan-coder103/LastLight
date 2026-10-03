import { describe, expect, it } from 'vitest';
import { GridNavigator } from '../navigation/GridNavigator';
import { campEntrances, campServices, createCampWorld } from './campWorld';

describe('Wayfarer Camp layout', () => {
  it('provides a reachable path from the gate to every service and enterable building', () => {
    const camp = createCampWorld();
    const navigator = new GridNavigator(camp);
    const destinations = [
      ...campServices.map(({ id, x, z }) => ({ id, x, z })),
      ...campEntrances.map(({ id, x, z }) => ({ id, x, z })),
    ];

    for (const destination of destinations) {
      const path = navigator.findPathToRange(
        camp.spawn.x,
        camp.spawn.z,
        destination.x,
        destination.z,
        2.1,
      );
      expect(path, destination.id).not.toHaveLength(0);
      expect(navigator.isPathWalkable(camp.spawn, path), destination.id).toBe(true);
    }
  });

  it('closes the perimeter and allows passage in both directions when opened', () => {
    const closed = new GridNavigator(createCampWorld());
    expect(closed.findPath(0, 34, 0, 21)).toHaveLength(0);
    const camp = createCampWorld(true);
    const navigator = new GridNavigator(camp);
    expect(navigator.isWalkable(0, 28)).toBe(true);
    expect(navigator.isWalkable(-12, 28)).toBe(false);
    for (const [from, to] of [
      [{ x: 0, z: 48 }, camp.spawn],
      [camp.spawn, { x: 0, z: 48 }],
    ]) {
      const path = navigator.findPath(from.x, from.z, to.x, to.z);
      expect(path).not.toHaveLength(0);
      expect(navigator.isPathWalkable(from, path)).toBe(true);
    }
    expect(navigator.isWalkable(0, 62)).toBe(true);
    expect(navigator.isWalkable(0, 66)).toBe(false);
  });

  it('keeps both overlapping scrap piles clear of the chopper landing ring', () => {
    const camp = createCampWorld();
    const piles = camp.colliders.filter((collider) => collider.id.startsWith('scrap-pile'));
    expect(piles).toHaveLength(2);
    for (const pile of piles) {
      const nearestX = Math.max(pile.minX, Math.min(17, pile.maxX));
      const nearestZ = Math.max(pile.minZ, Math.min(17, pile.maxZ));
      expect(Math.hypot(nearestX - 17, nearestZ - 17)).toBeGreaterThan(10);
    }
    expect(piles[0]!.maxX).toBeGreaterThan(piles[1]!.minX);
    expect(piles[0]!.maxZ).toBeGreaterThan(piles[1]!.minZ);
    expect(piles[0]!.maxX - piles[0]!.minX).toBeGreaterThan(6);
  });
});

it('shares deterministic tree collider positions with the exterior scene and preserves the return path', async () => {
  const { campExteriorTrees, campHeightAt } = await import('./campWorld');
  const camp = createCampWorld(true),
    nav = new GridNavigator(camp);
  expect(campExteriorTrees.length).toBeGreaterThan(10);
  for (const tree of campExteriorTrees) {
    expect(nav.isWalkable(tree.x, tree.z)).toBe(false);
    expect(Math.abs(tree.x)).toBeGreaterThan(9);
  }
  expect(campHeightAt(0, 50)).toBe(0);
  expect(campHeightAt(40, 50)).toBeGreaterThan(0);
  expect(nav.findPath(0, 50, 0, 21)).not.toHaveLength(0);
});
