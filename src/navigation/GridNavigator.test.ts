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
    expect(route.length).toBeGreaterThan(1);
    for (const point of route) expect(navigator.isWalkable(point.x, point.z)).toBe(true);
    expect(navigator.isPathWalkable(start, route)).toBe(true);
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

  it('routes to a reachable interaction range around a blocked target', () => {
    const generated = generateWorld('NAV-APPROACH');
    const world = {
      ...generated,
      colliders: [
        {
          id: 'test-building',
          minX: -4,
          maxX: 4,
          minY: 0,
          maxY: 8,
          minZ: -4,
          maxZ: 4,
        },
      ],
    };
    const navigator = new GridNavigator(world);
    const route = navigator.findPathToRange(-12, 0, 0, 0, 5.5);

    expect(route.length).toBeGreaterThan(0);
    expect(route.at(-1)!.x ** 2 + route.at(-1)!.z ** 2).toBeLessThanOrEqual(5.5 ** 2);
    expect(navigator.isPathWalkable({ x: -12, z: 0 }, route)).toBe(true);
  });

  it('routes around moving obstacles and can validate a route after they move', () => {
    const generated = generateWorld('NAV-DYNAMIC');
    const world = { ...generated, colliders: [] };
    const navigator = new GridNavigator(world);
    const start = { x: -12, z: 0 };
    const goal = { x: 12, z: 0 };

    const openRoute = navigator.findPath(start.x, start.z, goal.x, goal.z);
    expect(openRoute.length).toBeGreaterThan(0);
    expect(navigator.isPathWalkable(start, openRoute)).toBe(true);

    navigator.setDynamicObstacles([{ x: 0, z: 0, radius: 1.2 }]);
    const detour = navigator.findPath(start.x, start.z, goal.x, goal.z);
    expect(detour.length).toBeGreaterThan(0);
    expect(navigator.isPathWalkable(start, detour)).toBe(true);
    expect(navigator.isPathWalkable(start, openRoute)).toBe(false);

    navigator.setDynamicObstacles([]);
    expect(navigator.isPathWalkable(start, openRoute)).toBe(true);
  });
});
