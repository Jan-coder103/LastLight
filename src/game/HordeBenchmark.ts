import type { HordeSpawnPattern, HordeTierCounts } from './HordeSimulation';
import { HordeSimulation } from './HordeSimulation';
import type { GridNavigator } from '../navigation/GridNavigator';
import type { WorldData } from '../world/generateWorld';

export interface HordeBenchmarkResult {
  count: number;
  meanMs: number;
  p95Ms: number;
  maxMs: number;
  living: number;
  tiers: HordeTierCounts;
}

const benchmarkCounts = [100, 1_000, 5_000, 10_000] as const;

export function benchmarkCountsForHorde(): readonly number[] {
  return benchmarkCounts;
}

/** Measures fixed simulation steps. It intentionally excludes scenario creation and rendering. */
export function benchmarkHorde(
  count: number,
  seed: string,
  pattern: HordeSpawnPattern,
  world: WorldData,
  navigator: GridNavigator,
  sampleCount = 36,
): HordeBenchmarkResult {
  const simulation = new HordeSimulation(count, seed, pattern, world, navigator);
  for (let index = 0; index < 8; index += 1) simulation.tick(1 / 60, world.spawn.x, world.spawn.z);
  const samples = new Array<number>(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    simulation.tick(1 / 60, world.spawn.x, world.spawn.z);
    samples[index] = simulation.lastStepMs;
  }
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((total, sample) => total + sample, 0);
  const p95Index = Math.max(0, Math.ceil(samples.length * 0.95) - 1);
  return {
    count,
    meanMs: sum / samples.length,
    p95Ms: samples[p95Index]!,
    maxMs: samples[samples.length - 1]!,
    living: simulation.livingCount,
    tiers: simulation.tiers,
  };
}
