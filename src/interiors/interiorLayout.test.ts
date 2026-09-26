import { describe, expect, it } from 'vitest';
import { GridNavigator } from '../navigation/GridNavigator';
import { generateWorld } from '../world/generateWorld';
import { generateInterior, interiorWorld } from './interiorLayout';

describe('generated building interiors', () => {
  it('repeats the same connected 2–4 room layout and contents from its seed', () => {
    const roomCounts = new Set<number>();
    for (let index = 0; index < 24; index += 1) {
      const seed = `INTERIOR-${String(index).padStart(2, '0')}`;
      const first = generateInterior(seed);
      expect(generateInterior(seed)).toEqual(first);
      expect(first.rooms.length, seed).toBeGreaterThanOrEqual(2);
      expect(first.rooms.length, seed).toBeLessThanOrEqual(4);
      roomCounts.add(first.rooms.length);
      expect(first.loot.length, seed).toBeGreaterThanOrEqual(1);

      const outdoorWorld = generateWorld('INTERIOR-BASE');
      const roomWorld = interiorWorld(first, outdoorWorld);
      const navigator = new GridNavigator(roomWorld);
      expect(navigator.isWalkable(first.entry.x, first.entry.z), `${seed} entry`).toBe(true);
      expect(
        navigator.findPath(first.entry.x, first.entry.z, first.encounter.x, first.encounter.z),
        `${seed} encounter route`,
      ).not.toHaveLength(0);
      for (const loot of first.loot)
        expect(
          navigator.findPath(first.entry.x, first.entry.z, loot.x, loot.z),
          `${seed} loot route ${loot.id}`,
        ).not.toHaveLength(0);
      for (const room of first.rooms)
        expect(
          navigator.findPath(first.entry.x, first.entry.z, room.centerX, room.centerZ),
          `${seed} ${room.id} route`,
        ).not.toHaveLength(0);
    }
    expect(roomCounts).toEqual(new Set([2, 3, 4]));
  });
});
