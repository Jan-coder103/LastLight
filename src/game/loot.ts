import { createRandom } from '../core/seededRandom';
import type { GridNavigator } from '../navigation/GridNavigator';
import type { WorldData } from '../world/generateWorld';
import type { ResourceKind } from './saveData';
import { scavengedItems, type ItemId } from './itemInventory';

export interface CacheSite {
  id: string;
  x: number;
  z: number;
  zoneId: string;
}

export interface LootDrop {
  id: string;
  cacheId: string;
  kind: ResourceKind;
  amount: number;
  x: number;
  z: number;
  collected: boolean;
  itemId?: ItemId;
}

const lootKinds: ResourceKind[] = ['gear', 'supplies', 'money', 'fuel'];

export function placeLootCaches(
  world: WorldData,
  navigator: GridNavigator,
  targetCount = world.lootZones.reduce((count, zone) => count + zone.cacheCount, 0),
): CacheSite[] {
  const random = createRandom(`${world.seed}:phase-3-loot`);
  const sites: CacheSite[] = [];

  const routeLength = (x: number, z: number): number => {
    const path = navigator.findPath(world.spawn.x, world.spawn.z, x, z);
    if (path.length === 0) return Number.POSITIVE_INFINITY;
    let length = 0;
    let previousX = world.spawn.x;
    let previousZ = world.spawn.z;
    for (const point of path) {
      length += Math.hypot(point.x - previousX, point.z - previousZ);
      previousX = point.x;
      previousZ = point.z;
    }
    return length;
  };

  const tryZone = (
    zoneId: string,
    centerX: number,
    centerZ: number,
    radius: number,
    attemptBudget = 180,
  ): boolean => {
    for (let attempt = 0; attempt < attemptBudget; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const z = centerZ + Math.sin(angle) * distance;
      if (!navigator.isWalkable(x, z)) continue;
      if (Math.hypot(x - world.spawn.x, z - world.spawn.z) < 20) continue;
      if (sites.some((site) => Math.hypot(x - site.x, z - site.z) < (targetCount > 7 ? 10 : 18)))
        continue;
      if (routeLength(x, z) > 145) continue;
      sites.push({ id: `cache-${sites.length + 1}`, x, z, zoneId });
      return true;
    }
    return false;
  };

  for (const zone of world.lootZones) {
    for (let count = 0; count < zone.cacheCount && sites.length < targetCount; count += 1)
      tryZone(zone.id, zone.centerX, zone.centerZ, zone.radius);
  }

  // Keep the intended cache count on unusually obstructed variants by searching all zones
  // in a seeded order. The route cap and shared spacing rules still apply.
  for (let attempt = 0; attempt < 300 && sites.length < targetCount; attempt += 1) {
    const zone = world.lootZones[Math.floor(random() * world.lootZones.length)];
    if (zone) tryZone(zone.id, zone.centerX, zone.centerZ, zone.radius, 1);
  }
  return sites;
}

export function openCache(site: CacheSite, seed: string, valueMultiplier = 1): LootDrop[] {
  const random = createRandom(`${seed}:contents:${site.id}`);
  const count = 2 + Math.floor(random() * 2);
  const resources: LootDrop[] = Array.from({ length: count }, (_, index) => {
    const kind = lootKinds[Math.floor(random() * lootKinds.length)];
    const amount = kind === 'money' ? 12 + Math.floor(random() * 29) : 1 + Math.floor(random() * 2);
    const spread = (index - (count - 1) / 2) * 1.15;
    return {
      id: `${site.id}-drop-${index + 1}`,
      cacheId: site.id,
      kind,
      amount: Math.ceil(amount * valueMultiplier),
      x: site.x + spread,
      z: site.z + (index % 2 === 0 ? 0.65 : -0.65),
      collected: false,
    };
  });
  const itemId = scavengedItems[Math.floor(random() * scavengedItems.length)]!;
  resources.push({
    id: `${site.id}-item`,
    cacheId: site.id,
    kind: 'gear',
    amount: 1,
    x: site.x + 1.7,
    z: site.z + 0.5,
    collected: false,
    itemId,
  });
  return resources;
}
