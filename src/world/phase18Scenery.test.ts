import { expect, it } from 'vitest';
import { Mesh, Vector3 } from 'three';
import { buildWorld, animateCoastalWater, updateWorldLods } from './buildWorld';
import { generateWorld } from './generateWorld';
it('keeps mission dressing batched and close-only, with waves that preserve shore boundaries', () => {
  const world = generateWorld('RAVEN-07');
  const visual = buildWorld(world);
  const decorations = visual.userData.decorationLods;
  expect(decorations.grass.length).toBeGreaterThan(0);
  expect(decorations.stones.length).toBeGreaterThan(0);
  updateWorldLods(visual, new Vector3(1000, 0, 1000));
  for (const key of ['nearGrass', 'farGrass', 'nearStones', 'farStones'])
    expect(decorations[key].count).toBe(0);
  const water = visual.children.find(
    (child) => child instanceof Mesh && child.userData.waveBase,
  ) as Mesh;
  expect(water).toBeDefined();
  const positions = water.geometry.getAttribute('position');
  const before = Array.from({ length: positions.count }, (_, i) => [
    positions.getX(i),
    positions.getY(i),
    positions.getZ(i),
  ]);
  animateCoastalWater(visual, 1);
  expect(before.some((p, i) => Math.abs(positions.getY(i) - p[1]!) > 0.001)).toBe(true);
  for (let i = 0; i < positions.count; i++) {
    expect(positions.getX(i)).toBe(before[i]![0]);
    expect(positions.getZ(i)).toBe(before[i]![2]);
  }
  animateCoastalWater(visual, 2);
  expect(water.userData.staticCollider).toBe(true);
});
