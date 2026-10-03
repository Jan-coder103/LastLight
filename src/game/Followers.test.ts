import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { Follower } from './Followers';
import { createCampWorld } from '../camp/campWorld';
import { GridNavigator } from '../navigation/GridNavigator';

it('follows around obstacles without blocking the scout and retains damage through interior regroup', () => {
  const nav = new GridNavigator(createCampWorld(true));
  const follower = new Follower('companion', true);
  const scout = new Vector3(0, 0, 21);
  follower.regroup(new Vector3(0, 0, 40));
  for (let i = 0; i < 240; i++) follower.tick(1 / 60, scout, nav, () => 0, true);
  expect(follower.position.distanceTo(scout)).toBeLessThan(4);
  expect(nav.isWalkable(follower.position.x, follower.position.z)).toBe(true);
  follower.health = 43;
  follower.regroup(new Vector3(1, 0, 2));
  expect(follower.health).toBe(43);
  expect(follower.position.toArray()).toEqual([1, 0, 2]);
});
describe('companion engagement', () => {
  it('mirrors a nearby scout target and defends locally while refusing idle distant threats', () => {
    const companion = new Follower('companion', true);
    const target = (x: number) => ({ position: new Vector3(x, 0, 0) });
    expect(companion.defensiveTarget(undefined, target(40), 6)).toBeUndefined();
    const close = target(4),
      chosen = target(20);
    expect(companion.defensiveTarget(chosen, close, 6)).toBe(chosen);
    expect(companion.defensiveTarget(undefined, close, 6)).toBe(close);
    expect(companion.defensiveTarget(target(90), undefined, 6)).toBeUndefined();
  });
  it('never resurrects a defeated survivor during door transitions', () => {
    const survivor = new Follower('mara', false);
    survivor.health = 0;
    survivor.regroup(new Vector3(2, 0, 3));
    expect(survivor.alive).toBe(false);
  });
});
