export type ItemCategory = 'weapon' | 'scrap' | 'food';
export type ItemId =
  | 'handgun'
  | 'smg'
  | 'rifle'
  | 'shotgun'
  | 'grenade'
  | 'tire'
  | 'wrench'
  | 'scrap-wood'
  | 'metal-sheeting'
  | 'cardboard'
  | 'copper-wire'
  | 'battery'
  | 'broken-radio'
  | 'beans'
  | 'meat'
  | 'water'
  | 'wine'
  | 'berries'
  | 'nuts'
  | 'mushroom-jerky'
  | 'honeycomb';

export interface ItemDefinition {
  id: ItemId;
  name: string;
  category: ItemCategory;
  width: number;
  height: number;
  symbol: string;
  color: string;
  scrap?: number;
  price?: number;
}

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  handgun: {
    id: 'handgun',
    name: 'Handgun',
    category: 'weapon',
    width: 2,
    height: 2,
    symbol: '⌐',
    color: '#c0c7b8',
  },
  smg: {
    id: 'smg',
    name: 'SMG',
    category: 'weapon',
    width: 3,
    height: 2,
    symbol: '╾─',
    color: '#bac6a5',
  },
  rifle: {
    id: 'rifle',
    name: 'M4A',
    category: 'weapon',
    width: 4,
    height: 2,
    symbol: '╾━',
    color: '#c0c7b8',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    category: 'weapon',
    width: 4,
    height: 2,
    symbol: '╾═',
    color: '#c0c7b8',
  },
  grenade: {
    id: 'grenade',
    name: 'Grenade',
    category: 'weapon',
    width: 1,
    height: 1,
    symbol: '✹',
    color: '#bbca9a',
  },
  tire: {
    id: 'tire',
    name: 'Tire',
    category: 'scrap',
    width: 5,
    height: 5,
    symbol: '◎',
    color: '#8c8f86',
    scrap: 25,
  },
  wrench: {
    id: 'wrench',
    name: 'Wrench',
    category: 'scrap',
    width: 2,
    height: 1,
    symbol: '⚒',
    color: '#b9b7a6',
    scrap: 3,
  },
  'scrap-wood': {
    id: 'scrap-wood',
    name: 'Scrap wood',
    category: 'scrap',
    width: 3,
    height: 1,
    symbol: '▤',
    color: '#a98259',
    scrap: 4,
  },
  'metal-sheeting': {
    id: 'metal-sheeting',
    name: 'Metal sheeting',
    category: 'scrap',
    width: 4,
    height: 3,
    symbol: '▦',
    color: '#9ba5a1',
    scrap: 13,
  },
  cardboard: {
    id: 'cardboard',
    name: 'Cardboard',
    category: 'scrap',
    width: 3,
    height: 2,
    symbol: '▣',
    color: '#bd9e70',
    scrap: 6,
  },
  'copper-wire': {
    id: 'copper-wire',
    name: 'Copper wire',
    category: 'scrap',
    width: 2,
    height: 2,
    symbol: '〰',
    color: '#cc895f',
    scrap: 5,
  },
  battery: {
    id: 'battery',
    name: 'Old battery',
    category: 'scrap',
    width: 2,
    height: 2,
    symbol: '▰',
    color: '#a3ad92',
    scrap: 6,
  },
  'broken-radio': {
    id: 'broken-radio',
    name: 'Broken radio',
    category: 'scrap',
    width: 3,
    height: 2,
    symbol: '▣',
    color: '#a79c83',
    scrap: 7,
  },
  beans: {
    id: 'beans',
    name: 'Tin of beans',
    category: 'food',
    width: 1,
    height: 2,
    symbol: '◉',
    color: '#d5aa77',
    price: 14,
  },
  meat: {
    id: 'meat',
    name: 'Tin of meat',
    category: 'food',
    width: 1,
    height: 2,
    symbol: '▥',
    color: '#d79983',
    price: 18,
  },
  water: {
    id: 'water',
    name: 'Water bottle',
    category: 'food',
    width: 1,
    height: 2,
    symbol: '♧',
    color: '#8bc7ce',
    price: 12,
  },
  wine: {
    id: 'wine',
    name: 'Wine bottle',
    category: 'food',
    width: 1,
    height: 3,
    symbol: '♜',
    color: '#bd8396',
    price: 28,
  },
  berries: {
    id: 'berries',
    name: 'Berries',
    category: 'food',
    width: 1,
    height: 1,
    symbol: '●',
    color: '#d18191',
    price: 8,
  },
  nuts: {
    id: 'nuts',
    name: 'Nuts',
    category: 'food',
    width: 1,
    height: 1,
    symbol: '◇',
    color: '#c8af7d',
    price: 9,
  },
  'mushroom-jerky': {
    id: 'mushroom-jerky',
    name: 'Mushroom jerky',
    category: 'food',
    width: 2,
    height: 1,
    symbol: '♠',
    color: '#d0ad89',
    price: 17,
  },
  honeycomb: {
    id: 'honeycomb',
    name: 'Wild honeycomb',
    category: 'food',
    width: 2,
    height: 2,
    symbol: '⬡',
    color: '#e1bb6b',
    price: 24,
  },
};

export interface PlacedItem {
  uid: string;
  id: ItemId;
  x: number;
  y: number;
}
export interface ItemGrid {
  layout?: 'list';
  items: PlacedItem[];
  nextUid: number;
}
export const gridColumns = 8;
export function gridRows(upgraded: boolean): number {
  return upgraded ? 8 : 6;
}
export function emptyItemGrid(): ItemGrid {
  return { items: [], nextUid: 1 };
}

export function createStarterBackpack(rows = 6): ItemGrid {
  const grid = emptyItemGrid();
  grid.layout = 'list';
  addItem(grid, 'handgun', rows);
  for (let index = 0; index < 1; index += 1) addItem(grid, 'grenade', rows);
  return grid;
}

export function canPlace(
  grid: ItemGrid,
  id: ItemId,
  x: number,
  y: number,
  rows: number,
  exceptUid?: string,
): boolean {
  const item = itemDefinitions[id];
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x + item.width > gridColumns ||
    y + item.height > rows
  )
    return false;
  return grid.items.every((other) => {
    if (other.uid === exceptUid) return true;
    const shape = itemDefinitions[other.id];
    return (
      x + item.width <= other.x ||
      other.x + shape.width <= x ||
      y + item.height <= other.y ||
      other.y + shape.height <= y
    );
  });
}

export function addItem(grid: ItemGrid, id: ItemId, rows: number): PlacedItem | undefined {
  if (grid.layout === 'list') {
    const area = (itemId: ItemId) =>
      itemId === 'grenade' ? 0 : itemDefinitions[itemId].width * itemDefinitions[itemId].height;
    if (
      grid.items.length >= 256 ||
      grid.items.reduce((sum, item) => sum + area(item.id), 0) + area(id) > gridColumns * rows
    )
      return undefined;
    const item = { uid: `item-${grid.nextUid++}`, id, x: 0, y: 0 };
    grid.items.push(item);
    return item;
  }
  for (let y = 0; y < rows; y += 1)
    for (let x = 0; x < gridColumns; x += 1) {
      if (!canPlace(grid, id, x, y, rows)) continue;
      const item = { uid: `item-${grid.nextUid++}`, id, x, y };
      grid.items.push(item);
      return item;
    }
  return undefined;
}

export function moveItem(grid: ItemGrid, uid: string, x: number, y: number, rows: number): boolean {
  const item = grid.items.find((entry) => entry.uid === uid);
  if (!item || !canPlace(grid, item.id, x, y, rows, uid)) return false;
  item.x = x;
  item.y = y;
  return true;
}

export function removeItem(grid: ItemGrid, uid: string): PlacedItem | undefined {
  const index = grid.items.findIndex((item) => item.uid === uid);
  return index < 0 ? undefined : grid.items.splice(index, 1)[0];
}

export function parseItemGrid(value: unknown, rows: number): ItemGrid {
  const result = emptyItemGrid();
  if (!value || typeof value !== 'object') return result;
  const record = value as { items?: unknown; layout?: unknown };
  if (record.layout === 'list') result.layout = 'list';
  if (!Array.isArray(record.items)) return result;
  for (const raw of record.items.slice(0, 256)) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== 'string' || !Object.hasOwn(itemDefinitions, item.id)) continue;
    if (result.layout === 'list') {
      addItem(result, item.id as ItemId, rows);
      continue;
    }
    if (!canPlace(result, item.id as ItemId, item.x as number, item.y as number, rows)) continue;
    result.items.push({
      uid: `item-${result.nextUid++}`,
      id: item.id as ItemId,
      x: item.x as number,
      y: item.y as number,
    });
  }
  result.layout = 'list';
  return result;
}

export const scavengedItems: readonly ItemId[] = [
  'handgun',
  'shotgun',
  'grenade',
  'tire',
  'wrench',
  'scrap-wood',
  'metal-sheeting',
  'cardboard',
  'copper-wire',
  'battery',
  'broken-radio',
  'beans',
  'meat',
  'water',
  'wine',
  'berries',
  'nuts',
  'mushroom-jerky',
  'honeycomb',
];
