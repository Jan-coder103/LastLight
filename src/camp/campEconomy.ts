import type { SaveData } from '../game/saveData';

export const campPrices = {
  gear: 50,
  supplies: 35,
  cargoUpgrade: 90,
  gearSale: 25,
  supplySale: 12,
} as const;

export type CampSaleItem = 'gear' | 'supplies';
export type CampPurchaseItem = 'gear' | 'supplies' | 'cargoUpgrade';

export function buyCampItem(save: SaveData, item: CampPurchaseItem): boolean {
  if (item === 'cargoUpgrade' && save.cargoUpgrade) return false;
  const price = item === 'cargoUpgrade' ? campPrices.cargoUpgrade : campPrices[item];
  if (save.base.money < price) return false;
  save.base.money -= price;
  if (item === 'gear') save.base.gear += 1;
  else if (item === 'supplies') save.base.supplies += 2;
  else save.cargoUpgrade = true;
  return true;
}

export function sellCampItem(save: SaveData, item: CampSaleItem): boolean {
  if (save.base[item] < 1 || save.base.money >= 9999) return false;
  save.base[item] -= 1;
  save.base.money = Math.min(
    9999,
    save.base.money + (item === 'gear' ? campPrices.gearSale : campPrices.supplySale),
  );
  return true;
}
