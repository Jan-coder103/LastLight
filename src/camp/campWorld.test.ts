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

  it('keeps the camp enclosed while leaving its front gate clear for arrival', () => {
    const camp = createCampWorld();
    const navigator = new GridNavigator(camp);
    expect(navigator.isWalkable(0, 28)).toBe(true);
    expect(navigator.isWalkable(-12, 28)).toBe(false);
    expect(navigator.isWalkable(0, 31)).toBe(true);
    expect(navigator.isWalkable(0, 34)).toBe(false);
  });
});
