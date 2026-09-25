import { createRandom } from '../core/seededRandom';
import type { GridNavigator } from '../navigation/GridNavigator';
import type { WorldData } from '../world/generateWorld';
import type { ResourceKind } from './saveData';

export interface CacheSite {
  id: string;
  x: number;
  z: number;
}

export interface LootDrop {
  id: string;
  cacheId: string;
  kind: ResourceKind;
  amount: number;
  x: number;
  z: number;
  collected: boolean;
}

const lootKinds: ResourceKind[] = ['gear', 'supplies', 'money', 'fuel'];

export function placeLootCaches(
  world: WorldData,
  navigator: GridNavigator,
  targetCount = 7,
): CacheSite[] {
  const random = createRandom(`${world.seed}:phase-3-loot`);
  const sites: CacheSite[] = [];
  for (let attempt = 0; attempt < 500 && sites.length < targetCount; attempt += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 16 + random() * 58;
    const x = world.spawn.x + Math.cos(angle) * distance;
    const z = world.spawn.z + Math.sin(angle) * distance;
    if (!navigator.isWalkable(x, z)) continue;
    if (Math.hypot(x - world.spawn.x, z - world.spawn.z) < 14) continue;
    if (sites.some((site) => Math.hypot(x - site.x, z - site.z) < 18)) continue;
    sites.push({ id: `cache-${sites.length + 1}`, x, z });
  }
  return sites;
}

export function openCache(site: CacheSite, seed: string): LootDrop[] {
  const random = createRandom(`${seed}:contents:${site.id}`);
  const count = 2 + Math.floor(random() * 2);
  return Array.from({ length: count }, (_, index) => {
    const kind = lootKinds[Math.floor(random() * lootKinds.length)];
    const amount = kind === 'money' ? 12 + Math.floor(random() * 29) : 1 + Math.floor(random() * 2);
    const spread = (index - (count - 1) / 2) * 1.15;
    return {
      id: `${site.id}-drop-${index + 1}`,
      cacheId: site.id,
      kind,
      amount,
      x: site.x + spread,
      z: site.z + (index % 2 === 0 ? 0.65 : -0.65),
      collected: false,
    };
  });
}
