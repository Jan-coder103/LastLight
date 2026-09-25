import { describe, expect, it } from 'vitest';
import { generateWorld } from '../world/generateWorld';
import { GridNavigator } from './GridNavigator';

describe('GridNavigator', () => {
  it('finds a clear route around a generated building', () => {
    const world = generateWorld('NAV-OBSTACLE');
    const building = world.placements.find((placement) => placement.assetId === 'building-shell')!;
    const navigator = new GridNavigator(world);
    const start = { x: building.position.x - 16, z: building.position.z };
    const goal = { x: building.position.x + 16, z: building.position.z };
    const route = navigator.findPath(start.x, start.z, goal.x, goal.z);

    expect(navigator.isWalkable(building.position.x, building.position.z)).toBe(false);
    expect(route.length).toBeGreaterThan(5);
    for (const point of route) expect(navigator.isWalkable(point.x, point.z)).toBe(true);
  });

  it('snaps a blocked click to nearby walkable ground and rejects points outside the map', () => {
    const world = generateWorld('NAV-SNAP');
    const building = world.placements.find((placement) => placement.assetId === 'building-shell')!;
    const navigator = new GridNavigator(world);
    const route = navigator.findPath(0, -5, building.position.x, building.position.z);
    expect(route.length).toBeGreaterThan(0);
    expect(navigator.isWalkable(route.at(-1)!.x, route.at(-1)!.z)).toBe(true);
    expect(navigator.findPath(0, -5, world.size, world.size)).toEqual([]);
  });
});
