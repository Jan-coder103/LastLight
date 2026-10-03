import { describe, expect, it } from 'vitest';
import {
  createDefaultSave,
  parseSave,
  resolveRunOutcome,
  resetBackpackAfterDeath,
  emptyInventory,
} from './saveData';
import {
  awardObjectives,
  canPurchase,
  grenadeCapacity,
  payForSortie,
  purchaseNode,
  respec,
  skillNodes,
  sortieRules,
} from './progression';
import { addItem } from './itemInventory';
import { generateWorld } from '../world/generateWorld';
import { GridNavigator } from '../navigation/GridNavigator';
import { openCache, placeLootCaches } from './loot';
import { seededMissionEvents } from './missionObjectives';

describe('Phase 18 permanent progression', () => {
  it('starts with only a handgun and one charge, requires connected paths and charges the right currency', () => {
    const save = createDefaultSave();
    expect(save.progression.unlockedWeapons).toEqual(['handgun']);
    expect(grenadeCapacity(save)).toBe(1);
    save.progression.skillPoints = 8;
    save.base.money = 180;
    expect(purchaseNode(save, 'fire')).toBe(false);
    expect(purchaseNode(save, 'smg')).toBe(true);
    expect(save.base.money).toBe(80);
    expect(save.progression.skillPoints).toBe(8);
    expect(purchaseNode(save, 'smg')).toBe(false);
    expect(purchaseNode(save, 'm4a')).toBe(false);
    expect(purchaseNode(save, 'capacity2')).toBe(true);
    expect(purchaseNode(save, 'capacity3')).toBe(true);
    expect(grenadeCapacity(save)).toBe(3);
    expect(purchaseNode(save, 'fire')).toBe(true);
    expect(save.progression.skillPoints).toBe(4);
    expect(
      canPurchase(
        save,
        skillNodes.find((n) => n.id === 'control')!,
      ),
    ).toBe(true);
  });
  it('banks extraction points and first-clear bonuses only once, recruits survivors only when resolved', () => {
    const save = createDefaultSave();
    resolveRunOutcome(save, { gear: 1, supplies: 0, fuel: 1, money: 30 }, false);
    expect(save.progression.skillPoints).toBe(0);
    expect(save.progression.residents).toEqual([]);
    resolveRunOutcome(save, emptyInventory(), true);
    expect(awardObjectives(save, ['alarm-station', 'rescue:mara-medic'], ['mara-medic'])).toBe(2);
    expect(save.progression.skillPoints).toBe(3);
    expect(save.progression.residents).toEqual(['mara-medic']);
    expect(awardObjectives(save, ['alarm-station'], ['mara-medic'])).toBe(0);
    const snapshot = structuredClone(save.progression);
    resetBackpackAfterDeath(save);
    expect(save.progression).toEqual(snapshot);
    expect(parseSave(JSON.stringify(save)).progression).toEqual(snapshot);
  });
  it('refunds skill points while preserving paid firearms and supports a different connected branch', () => {
    const save = createDefaultSave();
    save.base.money = 200;
    save.progression.skillPoints = 3;
    purchaseNode(save, 'smg');
    purchaseNode(save, 'capacity2');
    purchaseNode(save, 'blast');
    respec(save);
    expect(save.progression.skillPoints).toBe(3);
    expect(grenadeCapacity(save)).toBe(1);
    expect(save.progression.unlockedWeapons).toEqual(['handgun', 'smg']);
    expect(save.base.money).toBe(100);
    expect(purchaseNode(save, 'control')).toBe(true);
    expect(purchaseNode(save, 'health')).toBe(true);
    respec(save);
    respec(save);
    expect(save.progression.skillPoints).toBe(3);
  });
  it('migrates legacy firearms, credits, reserve, carried items and grenade capacity', () => {
    const save = createDefaultSave();
    save.base.money = 321;
    addItem(save.storedItems, 'rifle', 6);
    addItem(save.storedItems, 'grenade', 6);
    addItem(save.storedItems, 'grenade', 6);
    save.storedReserve = ['shotgun'];
    const raw = JSON.parse(JSON.stringify(save));
    delete raw.progression;
    const migrated = parseSave(JSON.stringify(raw));
    expect(migrated.base.money).toBe(321);
    expect(migrated.storedItems.items.map((i) => i.id)).toEqual(
      save.storedItems.items.map((i) => i.id),
    );
    expect(migrated.progression.unlockedWeapons).toEqual(['handgun', 'rifle', 'shotgun']);
    expect(grenadeCapacity(migrated)).toBe(3);
    expect(migrated.storedReserve).toEqual(['shotgun']);
  });
  it('keeps the standard sortie free and pays high-yield fuel before failure without changing banked points', () => {
    const save = createDefaultSave();
    expect(payForSortie(save, 'standard')).toBe(true);
    expect(save.base.fuel).toBe(2);
    expect(payForSortie(save, 'high')).toBe(true);
    expect(save.base.fuel).toBe(0);
    expect(payForSortie(save, 'high')).toBe(false);
    resolveRunOutcome(save, emptyInventory(), false);
    expect(save.base.fuel).toBe(0);
    expect(sortieRules.high.initial).toBe(sortieRules.standard.initial * 2);
    expect(sortieRules.high.spawnSeconds).toBe(sortieRules.standard.spawnSeconds / 2);
    expect(sortieRules.high.encounters).toBe(2);
  });
  it('doubles seeded reachable crates, improves contents, and places reproducible optional events with escape routes', () => {
    for (const seed of ['RAVEN-07', 'SORTIE-2', 'SORTIE-3']) {
      const world = generateWorld(seed);
      const nav = new GridNavigator(world);
      const count = world.lootZones.reduce((n, z) => n + z.cacheCount, 0);
      const normal = placeLootCaches(world, nav, count);
      const high = placeLootCaches(world, nav, count * 2);
      expect(normal).toHaveLength(count);
      expect(high).toHaveLength(count * 2);
      expect(placeLootCaches(world, nav, count * 2)).toEqual(high);
      for (const site of high)
        expect(nav.findPath(world.spawn.x, world.spawn.z, site.x, site.z).length).toBeGreaterThan(
          0,
        );
      const standardDrops = openCache(normal[0]!, seed),
        highDrops = openCache(normal[0]!, seed, 1.5);
      expect(highDrops[0]!.amount).toBeGreaterThan(standardDrops[0]!.amount);
      const events = seededMissionEvents(seed, normal);
      expect(events.length).toBeGreaterThan(0);
      expect(events.length).toBeLessThanOrEqual(2);
      expect(seededMissionEvents(seed, normal)).toEqual(events);
      for (const event of events)
        expect(
          nav.findPath(world.spawn.x, world.spawn.z, event.site.x, event.site.z).length,
        ).toBeGreaterThan(0);
    }
  });
});

it('applies weapon handling to firing cadence and effective range without changing health or enemy damage', async () => {
  const { weaponStats } = await import('./progression');
  const save = createDefaultSave();
  save.base.money = 999;
  save.progression.skillPoints = 10;
  purchaseNode(save, 'smg');
  purchaseNode(save, 'm4a');
  purchaseNode(save, 'control');
  purchaseNode(save, 'accuracy');
  expect(weaponStats(save, 'smg')).toEqual({ damage: 22, cooldown: 0.11, range: 65 });
  expect(weaponStats(save, 'rifle')).toEqual({ damage: 50, cooldown: 0.24, range: 105 });
  respec(save);
  expect(weaponStats(save, 'smg').cooldown).toBe(0.12);
  expect(weaponStats(save, 'rifle').range).toBe(90);
});

it('restocks selected grenade capacity freely on each deployment, including a completely full loot list', async () => {
  const { refillGrenades } = await import('./progression');
  const save = createDefaultSave();
  save.progression.skillPoints = 2;
  purchaseNode(save, 'capacity2');
  purchaseNode(save, 'capacity3');
  save.storedItems.items = save.storedItems.items.filter((i) => i.id !== 'grenade');
  for (let i = 0; i < 11; i++) addItem(save.storedItems, 'battery', 6);
  const money = save.base.money;
  refillGrenades(save, save.storedItems);
  expect(save.storedItems.items.filter((i) => i.id === 'grenade')).toHaveLength(3);
  expect(save.base.money).toBe(money);
  save.storedItems.items = save.storedItems.items.filter((i) => i.id !== 'grenade');
  refillGrenades(save, save.storedItems);
  expect(save.storedItems.items.filter((i) => i.id === 'grenade')).toHaveLength(3);
  respec(save);
  refillGrenades(save, save.storedItems);
  expect(save.storedItems.items.filter((i) => i.id === 'grenade')).toHaveLength(1);
});
