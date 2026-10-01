import { describe, expect, it } from 'vitest';
import { GridNavigator } from '../navigation/GridNavigator';
import { generateWorld } from '../world/generateWorld';
import { HordeSimulation } from './HordeSimulation';

describe('HordeSimulation', () => {
  const world = generateWorld('HORDE-TEST');
  const navigator = new GridNavigator(world);

  it('creates the same identities and spawn positions from the same seed and pattern', () => {
    const first = new HordeSimulation(100, 'STRESS-5', 'clusters', world, navigator);
    const second = new HordeSimulation(100, 'STRESS-5', 'clusters', world, navigator);
    expect(Array.from(first.ids)).toEqual(Array.from(second.ids));
    expect(Array.from(first.x)).toEqual(Array.from(second.x));
    expect(Array.from(first.z)).toEqual(Array.from(second.z));
    expect(new Set(first.ids).size).toBe(100);
  });

  it('starts a grid formation outside the immediate player ring so it can visibly close in', () => {
    const horde = new HordeSimulation(100, 'GRID-APPROACH', 'grid', world, navigator);
    const nearestDistance = Math.min(
      ...Array.from(horde.x, (x, index) =>
        Math.hypot(x - world.spawn.x, horde.z[index]! - world.spawn.z),
      ),
    );
    expect(nearestDistance).toBeGreaterThan(35);
  });

  it('tracks 10,000 agents through an update without invalid state', () => {
    const horde = new HordeSimulation(10_000, 'STRESS-10K', 'grid', world, navigator);
    horde.tick(1 / 60, world.spawn.x, world.spawn.z);
    expect(horde.livingCount).toBe(10_000);
    expect(new Set(horde.ids).size).toBe(10_000);
    expect(Array.from(horde.x).every(Number.isFinite)).toBe(true);
    expect(Array.from(horde.z).every(Number.isFinite)).toBe(true);
    expect(Array.from(horde.health).every((health) => health === 100)).toBe(true);
    expect(horde.tiers.near + horde.tiers.mid + horde.tiers.far).toBe(10_000);
  });

  it('reports only visual transforms and colors that need an upload', () => {
    const horde = new HordeSimulation(2, 'STRESS-DIRTY', 'ring', world, navigator);
    const initial: number[] = [];
    horde.consumeVisualChanges((index) => initial.push(index));
    expect(initial).toEqual([0, 1]);

    horde.tick(0, world.spawn.x, world.spawn.z);
    const unchanged: number[] = [];
    horde.consumeVisualChanges((index) => unchanged.push(index));
    expect(unchanged).toEqual([]);

    horde.damageAgent(1, 50);
    const changed: Array<[number, boolean, boolean]> = [];
    horde.consumeVisualChanges((index, transform, color) =>
      changed.push([index, transform, color]),
    );
    expect(changed).toEqual([[1, true, false]]);
  });

  it('queries nearby agents and preserves identity and health as an agent changes tiers', () => {
    const horde = new HordeSimulation(100, 'STRESS-TIER', 'ring', world, navigator);
    const before = horde.snapshot(0);
    expect(horde.damageAgent(0, 37)).toBe(true);
    expect(horde.findNearestAgent(before.x, before.z, 1)).toBe(0);

    horde.tick(0.3, before.x, before.z);
    const after = horde.snapshot(0);
    expect(after.id).toBe(before.id);
    expect(after.health).toBe(63);
    expect(after.tier).toBe(0);
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThan(1);
    expect(horde.findNearestAgent(after.x, after.z, 1)).toBe(0);
  });

  it('gives an individual horde hit a small walkable knockback without changing agent identity', () => {
    const horde = new HordeSimulation(10, 'STRESS-KNOCKBACK', 'ring', world, navigator);
    const before = horde.snapshot(0);
    expect(horde.applyShotKnockback(0, before.x - 1, before.z)).toBe(true);
    const after = horde.snapshot(0);
    expect(after.id).toBe(before.id);
    expect(after.x - before.x).toBeCloseTo(0.26);
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThan(0.31);
  });

  it('removes a defeated agent from living counts and spatial queries without reusing its ID', () => {
    const horde = new HordeSimulation(4, 'STRESS-DAMAGE', 'ring', world, navigator);
    const id = horde.ids[0];
    expect(horde.damageAgent(0, 100)).toBe(true);
    expect(horde.damageAgent(0, 1)).toBe(false);
    expect(horde.livingCount).toBe(3);
    horde.tick(1 / 60, world.spawn.x, world.spawn.z);
    const defeated = horde.snapshot(0);
    expect(defeated.id).toBe(id);
    expect(defeated.alive).toBe(false);
    expect(horde.findNearestAgent(defeated.x, defeated.z, 0)).not.toBe(0);
  });

  it('moves agents toward the player and applies nearby attack pressure', () => {
    const horde = new HordeSimulation(1, 'STRESS-CHASE', 'ring', world, navigator);
    const spawn = horde.snapshot(0);
    const targetX = world.spawn.x;
    const targetZ = world.spawn.z;
    const startDistance = Math.hypot(spawn.x - targetX, spawn.z - targetZ);
    for (let step = 0; step < 180; step += 1) horde.tick(1 / 60, targetX, targetZ);
    const moved = horde.snapshot(0);
    expect(Math.hypot(moved.x - targetX, moved.z - targetZ)).toBeLessThan(startDistance);

    const nearHorde = new HordeSimulation(1, 'STRESS-ATTACK', 'ring', world, navigator);
    const nearAgent = nearHorde.snapshot(0);
    nearHorde.x[0] = world.spawn.x + 1;
    nearHorde.z[0] = world.spawn.z;
    nearHorde.y[0] = 0;
    nearHorde.health[0] = 51;
    nearHorde.tick(1 / 60, world.spawn.x, world.spawn.z);
    for (let step = 0; step < 90; step += 1) nearHorde.tick(1 / 60, world.spawn.x, world.spawn.z);
    expect(nearHorde.totalPlayerHits).toBeGreaterThan(0);
    expect(nearHorde.playerHealth).toBeLessThan(100);
    expect(nearHorde.snapshot(0).id).toBe(nearAgent.id);
    expect(nearHorde.snapshot(0).health).toBe(51);
  });
});
