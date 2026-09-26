import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../game/saveData';
import { buyCampItem, sellCampItem } from './campEconomy';

describe('camp trading', () => {
  it('buys stock and installs the cargo harness once at the listed prices', () => {
    const save = createDefaultSave();
    save.base.money = 140;
    expect(buyCampItem(save, 'gear')).toBe(true);
    expect(buyCampItem(save, 'supplies')).toBe(true);
    expect(buyCampItem(save, 'cargoUpgrade')).toBe(false);
    expect(save.base).toEqual({ gear: 3, supplies: 5, money: 55, fuel: 2 });
    save.base.money = 90;
    expect(buyCampItem(save, 'cargoUpgrade')).toBe(true);
    expect(buyCampItem(save, 'cargoUpgrade')).toBe(false);
    expect(save.cargoUpgrade).toBe(true);
    expect(save.base.money).toBe(0);
  });

  it('sells only stored gear or supplies and caps credits at the save limit', () => {
    const save = createDefaultSave();
    expect(sellCampItem(save, 'gear')).toBe(true);
    expect(sellCampItem(save, 'supplies')).toBe(true);
    expect(save.base).toEqual({ gear: 1, supplies: 2, money: 117, fuel: 2 });
    save.base.money = 9998;
    expect(sellCampItem(save, 'gear')).toBe(true);
    expect(save.base.money).toBe(9999);
    expect(sellCampItem(save, 'gear')).toBe(false);
  });
});
