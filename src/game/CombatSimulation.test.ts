import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { GridNavigator } from '../navigation/GridNavigator';
import { generateWorld } from '../world/generateWorld';
import { CombatSimulation } from './CombatSimulation';

function makeCombat(): CombatSimulation {
  const world = generateWorld('COMBAT-TEST');
  return new CombatSimulation(world, new GridNavigator(world));
}

function advance(combat: CombatSimulation, seconds: number, player: Vector3): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) combat.tick(0.05, player);
}

describe('CombatSimulation', () => {
  it('applies damage and marks the player down at zero health', () => {
    const combat = makeCombat();
    for (let hit = 0; hit < 9; hit += 1) combat.damagePlayer(10);
    expect(combat.health).toBe(10);
    expect(combat.alive).toBe(true);
    combat.damagePlayer(10);
    expect(combat.health).toBe(0);
    expect(combat.alive).toBe(false);
    expect(combat.damagePlayer(10)).toBe(false);
  });

  it('limits weapon fire rate and can eliminate a hostile with repeated hits', () => {
    const combat = makeCombat();
    expect(combat.tryFire('hostile-1')).toBe(true);
    expect(combat.zombies[0].health).toBe(50);
    expect(combat.tryFire('hostile-1')).toBe(false);
    advance(combat, 0.25, new Vector3(0, 0, -5));
    expect(combat.tryFire('hostile-1')).toBe(true);
    expect(combat.zombies[0].alive).toBe(false);
  });

  it('gives dash and abilities cooldowns without a resource cost', () => {
    const combat = makeCombat();
    const player = new Vector3(0, 0, -5);
    expect(combat.tryDash()).toBe(true);
    expect(combat.tryDash()).toBe(false);
    advance(combat, 2.5, player);
    expect(combat.tryDash()).toBe(true);

    combat.damagePlayer(20);
    expect(combat.activateAbility(1, player)).toBe(true);
    expect(combat.health).toBe(100);
    expect(combat.activateAbility(1, player)).toBe(false);
    expect(combat.activateAbility(3, player)).toBe(true);
    expect(combat.adrenalineRemaining).toBe(5);
    expect(combat.activateAbility(3, player)).toBe(false);
  });

  it('damages and stuns nearby hostiles with the shock pulse', () => {
    const combat = makeCombat();
    const player = combat.zombies[0].position.clone();
    expect(combat.activateAbility(2, player)).toBe(true);
    expect(combat.zombies.some((zombie) => zombie.health < zombie.maxHealth)).toBe(true);
    expect(combat.zombies.some((zombie) => zombie.stunRemaining > 0)).toBe(true);
    expect(combat.activateAbility(2, new Vector3(0, 0, -5))).toBe(false);
  });

  it('adds a small, individually tracked reinforcement wave around the current run position', () => {
    const combat = makeCombat();
    const added = combat.addReinforcements(2, new Vector3(22, 0, -12));
    expect(added).toHaveLength(2);
    expect(added.map((zombie) => zombie.id)).toEqual(['hostile-4', 'hostile-5']);
    expect(combat.zombies).toHaveLength(5);
    expect(added.every((zombie) => zombie.alive && zombie.health === zombie.maxHealth)).toBe(true);
  });
});
