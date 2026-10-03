import type { SaveData } from './saveData';
import { addItem, gridRows, removeItem, type ItemGrid, type ItemId } from './itemInventory';

export type Firearm = 'handgun' | 'smg' | 'rifle' | 'shotgun';
export const firearms: Record<Firearm, { damage: number; cooldown: number; range: number }> = {
  handgun: { damage: 35, cooldown: 0.33, range: 90 },
  smg: { damage: 22, cooldown: 0.12, range: 65 },
  rifle: { damage: 50, cooldown: 0.24, range: 90 },
  shotgun: { damage: 100, cooldown: 0.7, range: 16 },
};
export function isFirearm(id: ItemId): id is Firearm {
  return Object.hasOwn(firearms, id);
}
export interface SkillNode {
  id: string;
  name: string;
  parents: string[];
  cost: number;
  currency: 'credits' | 'points';
  preview: string;
  x: number;
  y: number;
  weapon?: Firearm;
}
const node = (
  id: string,
  name: string,
  parents: string[],
  cost: number,
  preview: string,
  x: number,
  y: number,
  weapon?: Firearm,
): SkillNode => ({
  id,
  name,
  parents,
  cost,
  preview,
  x,
  y,
  currency: weapon ? 'credits' : 'points',
  weapon,
});
export const skillNodes: SkillNode[] = [
  node('core', 'Field Operator', [], 0, 'Handgun · one free grenade each run', 500, 420),
  node('arsenal', 'Arsenal', ['core'], 0, 'Permanent firearm unlocks use banked credits', 250, 280),
  node(
    'smg',
    'SMG',
    ['arsenal'],
    100,
    '22 damage · 8 shots/sec · permanent unlock',
    70,
    170,
    'smg',
  ),
  node(
    'm4a',
    'M4A',
    ['arsenal'],
    150,
    '50 damage · 4 shots/sec · permanent unlock',
    260,
    100,
    'rifle',
  ),
  node(
    'control',
    'SMG control',
    ['smg'],
    1,
    'SMG firing interval 0.11 instead of 0.12 sec',
    70,
    50,
  ),
  node('accuracy', 'M4A accuracy', ['m4a'], 1, 'M4A effective range 105 instead of 90 m', 430, 60),
  node('grenadier', 'Grenadier', ['core'], 0, 'Free grenade refill between runs', 730, 280),
  node('capacity2', 'Second charge', ['grenadier'], 1, 'Carry two free grenade charges', 730, 170),
  node('capacity3', 'Third charge', ['capacity2'], 1, 'Carry three free grenade charges', 920, 110),
  node('blast', 'Larger blast', ['capacity2'], 2, 'Grenade radius 5.4 m', 620, 50),
  node(
    'fire',
    'Incendiary',
    ['capacity3'],
    2,
    '30 sec fire · maximum three patches · no duration stacking',
    950,
    30,
  ),
  node('fieldcraft', 'Fieldcraft', ['core'], 0, 'Choose toughness or mobility', 230, 500),
  node('health', 'Toughness', ['fieldcraft'], 1, '+15 maximum health', 60, 430),
  node('speed', 'Light feet', ['fieldcraft'], 1, '+8% movement speed', 60, 580),
  node('dash', 'Dash recovery', ['speed'], 2, 'Dash cooldown 1.6 sec', 70, 710),
  node('turret', 'Turret Workshop', ['core'], 0, 'Improve the existing turret', 450, 610),
  node('setup', 'Quick setup', ['turret'], 1, 'Turret cooldown 8 sec', 310, 750),
  node('uptime', 'Long uptime', ['turret'], 2, 'Turret lifetime 7 sec', 480, 790),
  node('coverage', 'Coverage', ['turret'], 1, 'Turret targeting radius 12 m', 650, 760),
  node('companion', 'Companion Bench', ['core'], 0, 'Hire for 40 credits per run', 770, 510),
  node(
    'regroup',
    'Tight formation',
    ['companion'],
    1,
    'Faster regroup and closer follow',
    940,
    440,
  ),
  node(
    'durability',
    'Body armor',
    ['companion'],
    1,
    'Companion health 120 instead of 80',
    950,
    600,
  ),
  node(
    'defense',
    'Close response',
    ['companion'],
    2,
    'Defensive radius 9 instead of 6 m',
    820,
    740,
  ),
  node(
    'veteran',
    'Veteran handling',
    ['accuracy', 'health'],
    2,
    '+10% handgun damage · either connected route unlocks',
    260,
    410,
  ),
];
export interface Progression {
  skillPoints: number;
  allocatedNodes: string[];
  unlockedWeapons: Firearm[];
  activeWeapon: Firearm;
  completedObjectives: string[];
  residents: string[];
}
export function defaultProgression(): Progression {
  return {
    skillPoints: 0,
    allocatedNodes: ['core', 'arsenal', 'grenadier', 'fieldcraft', 'turret', 'companion'],
    unlockedWeapons: ['handgun'],
    activeWeapon: 'handgun',
    completedObjectives: [],
    residents: [],
  };
}
export function owns(save: SaveData, id: string): boolean {
  return save.progression.allocatedNodes.includes(id);
}
export function canPurchase(save: SaveData, node: SkillNode): boolean {
  return (
    !owns(save, node.id) &&
    node.parents.some((id) => owns(save, id)) &&
    (node.currency === 'credits' ? save.base.money : save.progression.skillPoints) >= node.cost
  );
}
export function purchaseNode(save: SaveData, id: string): boolean {
  const node = skillNodes.find((n) => n.id === id);
  if (!node || !canPurchase(save, node)) return false;
  if (node.currency === 'credits') save.base.money -= node.cost;
  else save.progression.skillPoints -= node.cost;
  save.progression.allocatedNodes.push(id);
  if (node.weapon && !save.progression.unlockedWeapons.includes(node.weapon))
    save.progression.unlockedWeapons.push(node.weapon);
  return true;
}
export function respec(save: SaveData): void {
  for (const node of skillNodes)
    if (node.currency === 'points' && owns(save, node.id))
      save.progression.skillPoints += node.cost;
  save.progression.allocatedNodes = [
    ...defaultProgression().allocatedNodes,
    ...skillNodes
      .filter((n) => n.weapon && save.progression.unlockedWeapons.includes(n.weapon))
      .map((n) => n.id),
  ];
}
export function grenadeCapacity(save: SaveData): number {
  return owns(save, 'capacity3') ? 3 : owns(save, 'capacity2') ? 2 : 1;
}
export const sortieRules = {
  standard: { fuel: 0, crates: 1, initial: 20, spawnSeconds: 2, encounters: 1, value: 1 },
  high: { fuel: 2, crates: 2, initial: 40, spawnSeconds: 1, encounters: 2, value: 1.5 },
} as const;
export type Sortie = keyof typeof sortieRules;
export function payForSortie(save: SaveData, sortie: Sortie): boolean {
  const cost = sortieRules[sortie].fuel;
  if (save.base.fuel < cost) return false;
  save.base.fuel -= cost;
  return true;
}
export function awardObjectives(save: SaveData, objectives: string[], residents: string[]): number {
  let bonus = 0;
  for (const id of objectives)
    if (!save.progression.completedObjectives.includes(id)) {
      save.progression.completedObjectives.push(id);
      bonus++;
    }
  for (const id of residents)
    if (!save.progression.residents.includes(id)) {
      save.progression.residents.push(id);
      if (id === 'eli-mechanic') save.base.gear += 1;
      else if (id === 'noor-scout') save.base.money += 25;
      else save.base.supplies += 1;
    }
  save.progression.skillPoints += bonus;
  return bonus;
}

export function weaponStats(
  save: SaveData,
  weapon: Firearm,
): { damage: number; cooldown: number; range: number } {
  const stats = { ...firearms[weapon] };
  if (weapon === 'smg' && owns(save, 'control')) stats.cooldown = 0.11;
  if (weapon === 'rifle' && owns(save, 'accuracy')) stats.range = 105;
  if (weapon === 'handgun' && owns(save, 'veteran')) stats.damage *= 1.1;
  return stats;
}

export function refillGrenades(save: SaveData, items: ItemGrid): void {
  const capacity = grenadeCapacity(save),
    charges = items.items.filter((item) => item.id === 'grenade');
  for (const extra of charges.slice(capacity)) removeItem(items, extra.uid);
  for (let i = charges.length; i < capacity; i++)
    addItem(items, 'grenade', gridRows(save.cargoUpgrade));
}
