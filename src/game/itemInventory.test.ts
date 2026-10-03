import { describe, expect, it } from 'vitest';
import {
  addItem,
  canPlace,
  emptyItemGrid,
  gridRows,
  itemDefinitions,
  moveItem,
  parseItemGrid,
  removeItem,
} from './itemInventory';
import { createDefaultSave, parseSave, resetBackpackAfterDeath } from './saveData';

describe('shaped backpack', () => {
  it('respects connected footprints, overlap, and the upgrade boundary', () => {
    const grid = emptyItemGrid();
    const tire = addItem(grid, 'tire', 6)!;
    expect(tire).toMatchObject({ x: 0, y: 0 });
    expect(canPlace(grid, 'rifle', 3, 2, 6)).toBe(false);
    expect(canPlace(grid, 'rifle', 4, 4, 6)).toBe(false);
    expect(canPlace(grid, 'rifle', 4, 5, 6)).toBe(false);
    expect(canPlace(grid, 'rifle', 4, 5, 8)).toBe(true);
    const berries = addItem(grid, 'berries', 6)!;
    expect(berries.x).toBe(5);
    expect(moveItem(grid, berries.uid, 0, 0, 6)).toBe(false);
    expect(moveItem(grid, berries.uid, 7, 5, 6)).toBe(true);
    expect(removeItem(grid, tire.uid)?.id).toBe('tire');
    expect(canPlace(grid, 'rifle', 0, 0, 6)).toBe(true);
  });

  it('keeps shapes and scrap value proportional to size', () => {
    expect(itemDefinitions.tire.width * itemDefinitions.tire.height).toBe(25);
    expect(itemDefinitions.tire.scrap).toBeGreaterThan(itemDefinitions.wrench.scrap!);
    expect(itemDefinitions.rifle.width).toBe(4);
    expect(itemDefinitions.rifle.height).toBe(2);
    expect(gridRows(false)).toBe(6);
    expect(gridRows(true)).toBe(8);
  });

  it('loads old saves safely and discards corrupt or overlapping placements', () => {
    const old = createDefaultSave();
    const record = JSON.parse(JSON.stringify(old));
    delete record.storedItems;
    delete record.scrap;
    delete record.backpackInitialized;
    expect(parseSave(JSON.stringify(record)).storedItems.items.map((item) => item.id)).toEqual([
      'handgun',
      'grenade',
    ]);
    expect(parseSave(JSON.stringify(record)).scrap).toBe(0);
    const grid = parseItemGrid(
      {
        items: [
          { id: 'rifle', x: 0, y: 0 },
          { id: 'tire', x: 2, y: 0 },
          { id: 'water', x: 7, y: 0 },
          { id: 'unknown', x: 4, y: 4 },
          { id: 'toString', x: 4, y: 4 },
        ],
      },
      6,
    );
    expect(grid.items.map((item) => item.id)).toEqual(['rifle', 'water']);
  });

  it('keeps the same backpack through camp and a mission, then resets it after death', () => {
    const save = createDefaultSave();
    const missionBackpack = save.storedItems;
    expect(missionBackpack).toBe(save.storedItems);
    const starting = missionBackpack.items.map((item) => ({ ...item }));
    const pickedUp = addItem(missionBackpack, 'water', 6)!;
    expect(save.storedItems.items).toContain(pickedUp);
    const recovered = parseSave(JSON.stringify(save));
    expect(recovered.storedItems.items).toEqual([...starting, pickedUp]);
    const reset = resetBackpackAfterDeath(save);
    expect(reset).toBe(save.storedItems);
    expect(reset.items.map((item) => item.id)).toEqual(['handgun', 'grenade']);
  });
});

it('uses weight-based list capacity after migration and refills charges even with a full backpack', () => {
  const save = createDefaultSave();
  const grid = save.storedItems;
  expect(grid.layout).toBe('list');
  // Handgun uses 4 old capacity units; eleven 4-unit batteries fill the remaining weight.
  for (let i = 0; i < 11; i++) expect(addItem(grid, 'battery', 6)).toBeDefined();
  expect(addItem(grid, 'water', 6)).toBeUndefined();
  expect(addItem(grid, 'grenade', 6)).toBeDefined();
  const loaded = parseSave(JSON.stringify(save));
  expect(loaded.storedItems.items.map((i) => i.id)).toEqual(grid.items.map((i) => i.id));
});
