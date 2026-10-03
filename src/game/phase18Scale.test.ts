import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { GridNavigator } from '../navigation/GridNavigator';
import { generateWorld, terrainHeightAt } from '../world/generateWorld';
import { HordeSimulation } from './HordeSimulation';
import { Follower } from './Followers';
import { FirePatchPool } from './FirePatches';
it('keeps a high-yield horde, companion and bounded fire intact at the 10,000-agent ceiling', () => {
  const world = generateWorld('PHASE18-SCALE'),
    nav = new GridNavigator(world),
    scout = new Vector3(world.spawn.x, world.spawn.y, world.spawn.z);
  const horde = new HordeSimulation(10000, 'PHASE18-HIGH', 'ring', world, nav, 10000, {
    dormantActivation: true,
  });
  const companion = new Follower('companion', true);
  companion.regroup(scout);
  const fire = new FirePatchPool<number>();
  for (let i = 0; i < 3; i++) fire.add(scout.clone().add(new Vector3(10 * i, 0, 0)), undefined, i);
  const samples: number[] = [];
  horde.emitNoise(scout.x, scout.z, 1);
  for (let i = 0; i < 120; i++) {
    const start = performance.now();
    horde.tick(1 / 60, scout.x, scout.z);
    companion.tick(1 / 60, scout, nav, (x, z) => terrainHeightAt(world.seed, x, z));
    for (const point of fire.tick(1 / 60, undefined).damage)
      horde.damageAgentsInRadius(point.x, point.z, 3, 8);
    if (i >= 8) samples.push(performance.now() - start);
  }
  expect(horde.spawnOne(scout.x, scout.z)).toBeUndefined();
  expect(Array.from(horde.x).every(Number.isFinite)).toBe(true);
  expect(companion.alive).toBe(true);
  expect(fire.patches).toHaveLength(3);
  samples.sort((a, b) => a - b);
  console.log(
    `Phase 18 10k simulation + companion + fire: mean ${(samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2)} ms, p95 ${samples[Math.ceil(samples.length * 0.95) - 1]!.toFixed(2)} ms (112 samples; excludes rendering).`,
  );
});
