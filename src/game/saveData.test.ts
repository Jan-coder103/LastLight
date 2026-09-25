import { describe, expect, it } from 'vitest';
import { generateWorld } from '../world/generateWorld';
import { GridNavigator } from '../navigation/GridNavigator';
import { openCache, placeLootCaches } from './loot';
import {
  addCargo,
  cargoCapacity,
  cargoWeight,
  createDefaultSave,
  emptyInventory,
  parseSave,
  resolveRunOutcome,
} from './saveData';

describe('Phase 3 run resources', () => {
  it('keeps failed-run cargo out of camp and banks it after extraction', () => {
    const save = createDefaultSave();
    const cargo = { gear: 2, supplies: 1, money: 27, fuel: 1 };
    const startingBase = { ...save.base };

    resolveRunOutcome(save, cargo, false);
    expect(save.base).toEqual(startingBase);
    expect(save.completedRuns).toBe(0);

    resolveRunOutcome(save, cargo, true);
    expect(save.base).toEqual({ gear: 4, supplies: 4, money: 107, fuel: 3 });
    expect(save.completedRuns).toBe(1);
  });

  it('enforces weighted cargo capacity while credits remain weightless', () => {
    const save = createDefaultSave();
    save.cargoUpgrade = true;
    const cargo = emptyInventory();
    expect(cargoCapacity(save)).toBe(15);
    expect(addCargo(cargo, 'gear', 9, 10)).toBe(9);
    expect(addCargo(cargo, 'fuel', 4, 10)).toBe(1);
    expect(addCargo(cargo, 'money', 50, 10)).toBe(50);
    expect(cargoWeight(cargo)).toBe(10);
    expect(cargo).toEqual({ gear: 9, supplies: 0, money: 50, fuel: 1 });
  });

  it('reloads a valid saved camp and replaces corrupt or unknown versions with safe defaults', () => {
    const save = createDefaultSave();
    save.base.money = 142;
    save.cargoUpgrade = true;
    save.completedRuns = 3;
    expect(parseSave(JSON.stringify(save))).toEqual(save);
    expect(parseSave('{not json')).toEqual(createDefaultSave());
    expect(parseSave(JSON.stringify({ version: 99, base: {} }))).toEqual(createDefaultSave());
  });

  it('reproduces cache sites and contents from the run seed', () => {
    const world = generateWorld('RUN-LOOT-1');
    const navigator = new GridNavigator(world);
    const first = placeLootCaches(world, navigator);
    const second = placeLootCaches(world, navigator);
    expect(first).toHaveLength(7);
    expect(second).toEqual(first);
    expect(openCache(first[0], world.seed)).toEqual(openCache(first[0], world.seed));
    const changedWorld = generateWorld('RUN-LOOT-2');
    expect(placeLootCaches(changedWorld, new GridNavigator(changedWorld))).not.toEqual(first);
  });
});
