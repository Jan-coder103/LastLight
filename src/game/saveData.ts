export type ResourceKind = 'gear' | 'supplies' | 'money' | 'fuel';

export type ResourceInventory = Record<ResourceKind, number>;

export interface SaveData {
  version: 1;
  base: ResourceInventory;
  cargoUpgrade: boolean;
  completedRuns: number;
}

export const cargoCapacityBase = 10;
export const cargoCapacityUpgrade = 5;

export function emptyInventory(): ResourceInventory {
  return { gear: 0, supplies: 0, money: 0, fuel: 0 };
}

export function createDefaultSave(): SaveData {
  return {
    version: 1,
    base: { gear: 2, supplies: 3, money: 80, fuel: 2 },
    cargoUpgrade: false,
    completedRuns: 0,
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
    return {
      version: 1,
      base: {
        gear: validCount(base.gear),
        supplies: validCount(base.supplies),
        money: validCount(base.money),
        fuel: validCount(base.fuel),
      },
      cargoUpgrade: record.cargoUpgrade === true,
      completedRuns: validCount(record.completedRuns),
    };
  } catch {
    return createDefaultSave();
  }
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
}
