import { createRandom } from '../core/seededRandom';
import type { BuildingEntrance, WorldData } from '../world/generateWorld';

export interface CampService {
  id: string;
  kind:
    | 'camp-shop'
    | 'camp-storage'
    | 'camp-operations'
    | 'camp-departure'
    | 'camp-scrap'
    | 'camp-food';
  x: number;
  z: number;
}

export const campServices: readonly CampService[] = [
  { id: 'camp-quartermaster', kind: 'camp-shop', x: -7, z: 2 },
  { id: 'camp-storage', kind: 'camp-storage', x: -18, z: 8 },
  { id: 'camp-operations', kind: 'camp-operations', x: 0, z: -23 },
  { id: 'camp-departure', kind: 'camp-departure', x: 17, z: 17 },
  { id: 'camp-scrap', kind: 'camp-scrap', x: 18, z: -4.5 },
  { id: 'camp-food', kind: 'camp-food', x: -8, z: 8 },
];

export const campEntrances: readonly BuildingEntrance[] = [
  {
    id: 'camp-barracks',
    x: -15,
    z: -7,
    doorX: -15,
    doorZ: -8.2,
    outwardX: 0,
    outwardZ: 1,
    rotationY: Math.PI,
  },
  {
    id: 'camp-clinic',
    x: 15,
    z: -7,
    doorX: 15,
    doorZ: -8.2,
    outwardX: 0,
    outwardZ: 1,
    rotationY: Math.PI,
  },
];

function collider(
  id: string,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  minY = 0,
  maxY = 4,
) {
  return { id, minX, maxX, minY, maxY, minZ, maxZ };
}

/** Flat safe-zone navigation data shared by the hub visuals, player, camera, and pathfinder. */
export function createCampWorld(gateOpen = false): WorldData {
  return {
    seed: 'WAYFARER-CAMP',
    rotationQuarterTurns: 0,
    size: 128,
    roads: [],
    districts: [],
    waterAreas: [],
    lootZones: [],
    landmarks: [],
    accessPoints: [],
    entrances: [...campEntrances],
    placements: [],
    colliders: [
      collider('west-perimeter', -29.5, -28.5, -29.5, 29.5, 0, 2.6),
      collider('east-perimeter', 28.5, 29.5, -29.5, 29.5, 0, 2.6),
      collider('north-perimeter', -29.5, 29.5, -29.5, -28.5, 0, 2.6),
      collider('south-perimeter-west', -29.5, -5.5, 28.5, 29.5, 0, 2.6),
      collider('south-perimeter-east', 5.5, 29.5, 28.5, 29.5, 0, 2.6),
      ...(!gateOpen ? [collider('closed-gate', -5.5, 5.5, 28.5, 29.1, 0, 2.7)] : []),
      collider('barracks-shell', -20.5, -9.5, -17.5, -8.5, 0, 4.8),
      collider('clinic-shell', 9.5, 20.5, -17.5, -8.5, 0, 4.8),
      collider('storehouse-shell', -24, -12, 10, 20, 0, 4.2),
      collider('quartermaster-counter', -10.7, -3.3, -0.2, 0.7, 0, 1.3),
      collider('scrap-hut', 21.1, 24.9, -6.4, -3.6, 0, 2.8),
      collider('scrap-pile-large', 18, 24.5, -2.8, 2.8, 0, 2.7),
      collider('scrap-pile-small', 22.7, 27.7, -1.5, 3.1, 0, 2.1),
      collider('camp-tent-west', -27, -23, 4.8, 8, 0, 2.7),
      collider('camp-tent-east-south', 21.2, 25.8, 8.4, 12, 0, 2.7),
      collider('camp-tent-east-north', 21.7, 26.3, -14.2, -9.8, 0, 2.7),
      collider('camp-tent-west-north', -26.5, -21.9, -8.7, -4.3, 0, 2.7),
      collider('camp-tent-east-center', 6.1, 10.7, 10, 14.4, 0, 2.7),
      collider('camp-tent-center-west', -7.6, -4, -14.8, -10.2, 0, 2.7),
      collider('communal-fire', 5.1, 7.5, -4.8, -2.4, 0, 1.4),
      ...campExteriorTrees.map((tree, i) =>
        collider(
          `exterior-tree-${i}`,
          tree.x - Math.max(0.8, tree.scale * 0.525),
          tree.x + Math.max(0.8, tree.scale * 0.525),
          tree.z - Math.max(0.8, tree.scale * 0.525),
          tree.z + Math.max(0.8, tree.scale * 0.525),
          campHeightAt(tree.x, tree.z),
          campHeightAt(tree.x, tree.z) + 1.6 * tree.scale,
        ),
      ),
    ],
    objectCount: 40,
    spawn: { x: 0, y: 0, z: 21 },
  };
}

export function campHeightAt(x: number, z: number): number {
  const edge = Math.max(0, Math.max(Math.abs(x), Math.abs(z)) - 33);
  const trailClearance = Math.min(1, Math.max(0, Math.abs(x) - 5) / 8);
  return (
    Math.min(1, edge / 15) * trailClearance * (0.8 + Math.sin(x * 0.1) * Math.cos(z * 0.13) * 0.65)
  );
}

export const campExteriorTrees = (() => {
  const random = createRandom('camp-exterior');
  const trees: { x: number; z: number; scale: number }[] = [];
  for (let i = 0; i < 55; i++) {
    const x = (random() - 0.5) * 115,
      z = (random() - 0.5) * 115;
    if (Math.max(Math.abs(x), Math.abs(z)) < 35 || Math.abs(x) < 9) continue;
    trees.push({ x, z, scale: 0.7 + random() * 0.6 });
  }
  return trees;
})();
