import { describe, expect, it } from 'vitest';
import { GridNavigator } from '../navigation/GridNavigator';
import { generateWorld } from '../world/generateWorld';
import { CombatSimulation } from './CombatSimulation';
import {
  explosiveBarrelBlinkWindows,
  ExplosiveBarrelFuses,
  explosiveBarrelFuseDuration,
} from './ExplosiveBarrel';

describe('explosive barrel fuse and blast', () => {
  it('plays two deterministic red blink windows and detonates once at two seconds', () => {
    const fuses = new ExplosiveBarrelFuses();
    expect(fuses.trigger('barrel-1')).toBe(true);
    expect(fuses.trigger('barrel-1')).toBe(false);
    fuses.update(explosiveBarrelBlinkWindows[0]![0]);
    expect(fuses.isBlinking('barrel-1')).toBe(true);
    fuses.update(explosiveBarrelBlinkWindows[0]![1] - explosiveBarrelBlinkWindows[0]![0]);
    expect(fuses.isBlinking('barrel-1')).toBe(false);
    fuses.update(explosiveBarrelBlinkWindows[1]![0] - explosiveBarrelBlinkWindows[0]![1]);
    expect(fuses.isBlinking('barrel-1')).toBe(true);
    const detonated = fuses.update(
      explosiveBarrelFuseDuration - explosiveBarrelBlinkWindows[1]![0],
    );
    expect(detonated).toEqual(['barrel-1']);
    expect(fuses.isComplete('barrel-1')).toBe(true);
    expect(fuses.trigger('barrel-1')).toBe(false);
  });

  it('applies the same bounded radius damage used by the shared field explosion', () => {
    const world = generateWorld('BARREL-BLAST');
    const combat = new CombatSimulation(world, new GridNavigator(world));
    const center = combat.zombies[0]!.position.clone();
    expect(combat.damageHostilesInRadius(center, 7, 100)).toBeGreaterThan(0);
    expect(combat.zombies[0]!.alive).toBe(false);
  });
});
