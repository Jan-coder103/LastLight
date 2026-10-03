import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { FirePatchPool } from './FirePatches';
it('caps fire patches, refuses overlap without refreshing duration, pauses outdoors in interiors, and expires after 30 active seconds', () => {
  const pool = new FirePatchPool<string>();
  expect(pool.add(new Vector3(), undefined, 'a')).toBe(true);
  pool.tick(10, undefined);
  expect(pool.add(new Vector3(1, 0, 0), undefined, 'overlap')).toBe(false);
  expect(pool.patches[0]!.remaining).toBe(20);
  expect(pool.add(new Vector3(10, 0, 0), undefined, 'b')).toBe(true);
  expect(pool.add(new Vector3(), 'room', 'c')).toBe(true);
  expect(pool.add(new Vector3(20, 0, 0), undefined, 'd')).toBe(false);
  const indoors = pool.tick(5, 'room');
  expect(indoors.damage).toHaveLength(1);
  expect(pool.patches[0]!.remaining).toBe(20);
  const expired = pool.tick(20, undefined);
  expect(expired.expired).toEqual(['a']);
  expect(pool.add(new Vector3(20, 0, 0), undefined, 'd')).toBe(true);
  expect(pool.clear().sort()).toEqual(['b', 'c', 'd']);
  expect(pool.patches).toHaveLength(0);
});
it('limits fire damage to one tick every half second', () => {
  const pool = new FirePatchPool<number>();
  pool.add(new Vector3(), undefined, 1);
  expect(pool.tick(0.01, undefined).damage).toHaveLength(1);
  expect(pool.tick(0.1, undefined).damage).toHaveLength(0);
  expect(pool.tick(0.4, undefined).damage).toHaveLength(1);
});
