import { defaultProgression, isFirearm, skillNodes, type Progression } from './progression';
import {
  createStarterBackpack,
  gridRows,
  itemDefinitions,
  parseItemGrid,
  type ItemGrid,
  type ItemId,
} from './itemInventory';

export type ResourceKind = 'gear' | 'supplies' | 'money' | 'fuel';

export type ResourceInventory = Record<ResourceKind, number>;

export interface SaveData {
  version: 1;
  progression: Progression;
  base: ResourceInventory;
  cargoUpgrade: boolean;
  completedRuns: number;
  scrap: number;
  storedItems: ItemGrid;
  storedReserve: ItemId[];
  backpackInitialized: boolean;
}

export const cargoCapacityBase = 10;
export const cargoCapacityUpgrade = 5;

export function emptyInventory(): ResourceInventory {
  return { gear: 0, supplies: 0, money: 0, fuel: 0 };
}

export function createDefaultSave(): SaveData {
  return {
    version: 1,
    progression: defaultProgression(),
    base: { gear: 2, supplies: 3, money: 80, fuel: 2 },
    cargoUpgrade: false,
    completedRuns: 0,
    scrap: 0,
    storedItems: createStarterBackpack(),
    storedReserve: [],
    backpackInitialized: true,
  };
}

function validCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(9999, Math.floor(value)))
    : 0;
}

export function parseSave(raw: string | null): SaveData {
  if (!raw) return createDefaultSave();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createDefaultSave();
    const record = parsed as Record<string, unknown>;
    if (record.version !== 1 || !record.base || typeof record.base !== 'object')
      return createDefaultSave();
    const base = record.base as Record<string, unknown>;
    const storedItems = parseItemGrid(record.storedItems, gridRows(record.cargoUpgrade === true));
    if (record.backpackInitialized !== true && storedItems.items.length === 0) {
      const starter = createStarterBackpack(gridRows(record.cargoUpgrade === true));
      storedItems.items = starter.items;
      storedItems.nextUid = starter.nextUid;
    }
    const progression = defaultProgression();
    const rawProgression = record.progression as Partial<Progression> | undefined;
    if (rawProgression && typeof rawProgression === 'object') {
      progression.skillPoints = validCount(rawProgression.skillPoints);
      const wanted = Array.isArray(rawProgression.allocatedNodes)
        ? rawProgression.allocatedNodes
        : [];
      for (let pass = 0; pass < skillNodes.length; pass++)
        for (const node of skillNodes) {
          if (
            wanted.includes(node.id) &&
            !progression.allocatedNodes.includes(node.id) &&
            node.parents.some((id) => progression.allocatedNodes.includes(id))
          )
            progression.allocatedNodes.push(node.id);
        }
      for (const weapon of Array.isArray(rawProgression.unlockedWeapons)
        ? rawProgression.unlockedWeapons
        : [])
        if (isFirearm(weapon) && !progression.unlockedWeapons.includes(weapon))
          progression.unlockedWeapons.push(weapon);
      for (const key of ['completedObjectives', 'residents'] as const)
        progression[key] = Array.isArray(rawProgression[key])
          ? [
              ...new Set(
                rawProgression[key].filter(
                  (id) => typeof id === 'string' && /^[a-z0-9:-]{1,80}$/.test(id),
                ),
              ),
            ].slice(0, 256)
          : [];
      if (
        rawProgression.activeWeapon &&
        progression.unlockedWeapons.includes(rawProgression.activeWeapon)
      )
        progression.activeWeapon = rawProgression.activeWeapon;
    }
    if (!rawProgression) {
      const legacyCharges = storedItems.items.filter((item) => item.id === 'grenade').length;
      if (legacyCharges >= 2) progression.allocatedNodes.push('capacity2');
      if (legacyCharges >= 3) progression.allocatedNodes.push('capacity3');
    }
    // Legacy carried/reserve firearms become permanent unlocks without removing the items.
    for (const id of [
      ...storedItems.items.map((item) => item.id),
      ...(Array.isArray(record.storedReserve) ? record.storedReserve : []),
    ])
      if (
        typeof id === 'string' &&
        isFirearm(id as ItemId) &&
        !progression.unlockedWeapons.includes(id as import('./progression').Firearm)
      )
        progression.unlockedWeapons.push(id as import('./progression').Firearm);
    for (const node of skillNodes)
      if (
        node.weapon &&
        progression.unlockedWeapons.includes(node.weapon) &&
        !progression.allocatedNodes.includes(node.id)
      )
        progression.allocatedNodes.push(node.id);
    return {
      version: 1,
      progression,
      base: {
        gear: validCount(base.gear),
        supplies: validCount(base.supplies),
        money: validCount(base.money),
        fuel: validCount(base.fuel),
      },
      cargoUpgrade: record.cargoUpgrade === true,
      completedRuns: validCount(record.completedRuns),
      scrap: validCount(record.scrap),
      storedItems,
      storedReserve: Array.isArray(record.storedReserve)
        ? record.storedReserve
            .filter(
              (id): id is ItemId => typeof id === 'string' && Object.hasOwn(itemDefinitions, id),
            )
            .slice(0, 256)
        : [],
      backpackInitialized: true,
    };
  } catch {
    return createDefaultSave();
  }
}

export function resetBackpackAfterDeath(save: SaveData): ItemGrid {
  save.storedItems = createStarterBackpack(gridRows(save.cargoUpgrade));
  return save.storedItems;
}

export function loadSave(storage?: Storage): SaveData {
  try {
    return parseSave((storage ?? window.localStorage).getItem('last-light-save'));
  } catch {
    return createDefaultSave();
  }
}

export function storeSave(data: SaveData, storage?: Storage): boolean {
  try {
    (storage ?? window.localStorage).setItem('last-light-save', JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function cargoCapacity(save: SaveData): number {
  return cargoCapacityBase + (save.cargoUpgrade ? cargoCapacityUpgrade : 0);
}

export function cargoWeight(inventory: ResourceInventory): number {
  return inventory.gear + inventory.supplies + inventory.fuel;
}

export function addCargo(
  inventory: ResourceInventory,
  kind: ResourceKind,
  amount: number,
  capacity: number,
): number {
  const requested = Math.max(0, Math.floor(amount));
  const accepted =
    kind === 'money'
      ? requested
      : Math.min(requested, Math.max(0, capacity - cargoWeight(inventory)));
  inventory[kind] += accepted;
  return accepted;
}

export function bankCargo(base: ResourceInventory, cargo: ResourceInventory): void {
  base.gear += cargo.gear;
  base.supplies += cargo.supplies;
  base.money += cargo.money;
  base.fuel += cargo.fuel;
}

export function resolveRunOutcome(
  save: SaveData,
  cargo: ResourceInventory,
  extracted: boolean,
): void {
  if (!extracted) return;
  bankCargo(save.base, cargo);
  save.completedRuns += 1;
  save.progression.skillPoints += 1;
}
