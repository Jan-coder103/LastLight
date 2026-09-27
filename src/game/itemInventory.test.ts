import { describe, expect, it } from 'vitest';
import {
  addItem,
  bankScavengedItems,
  canPlace,
  emptyItemGrid,
  gridRows,
  itemDefinitions,
  moveItem,
  parseItemGrid,
  removeItem,
} from './itemInventory';
import { createDefaultSave, parseSave } from './saveData';

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
    expect(parseSave(JSON.stringify(record)).storedItems.items).toEqual([]);
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

  it('keeps banked camp items safe and reserves recovered overflow', () => {
    const save = createDefaultSave();
    addItem(save.storedItems, 'water', 6);
    const carried = emptyItemGrid();
    const issued = addItem(carried, 'rifle', 6)!;
    addItem(carried, 'tire', 8);
    expect(
      bankScavengedItems(carried, save.storedItems, save.storedReserve, new Set([issued.uid]), 6),
    ).toBe(1);
    expect(save.storedItems.items.map((item) => item.id)).toEqual(['water', 'tire']);
    expect(save.storedReserve).toEqual([]);
    expect(
      bankScavengedItems(carried, save.storedItems, save.storedReserve, new Set([issued.uid]), 6),
    ).toBe(1);
    expect(save.storedReserve).toEqual(['tire']);
  });
});
