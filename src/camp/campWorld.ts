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
  { id: 'camp-scrap', kind: 'camp-scrap', x: 9, z: 9 },
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
export function createCampWorld(): WorldData {
  return {
    seed: 'WAYFARER-CAMP',
    rotationQuarterTurns: 0,
    size: 64,
    roads: [],
    districts: [],
    lootZones: [],
    landmarks: [],
    entrances: [...campEntrances],
    placements: [],
    colliders: [
      collider('west-perimeter', -29.5, -28.5, -29.5, 29.5, 0, 2.6),
      collider('east-perimeter', 28.5, 29.5, -29.5, 29.5, 0, 2.6),
      collider('north-perimeter', -29.5, 29.5, -29.5, -28.5, 0, 2.6),
      collider('south-perimeter-west', -29.5, -5.5, 28.5, 29.5, 0, 2.6),
      collider('south-perimeter-east', 5.5, 29.5, 28.5, 29.5, 0, 2.6),
      collider('barracks-shell', -20.5, -9.5, -17.5, -8.5, 0, 4.8),
      collider('clinic-shell', 9.5, 20.5, -17.5, -8.5, 0, 4.8),
      collider('storehouse-shell', -24, -12, 10, 20, 0, 4.2),
      collider('quartermaster-counter', -10.7, -3.3, -0.2, 0.7, 0, 1.3),
    ],
    objectCount: 35,
    spawn: { x: 0, y: 0, z: 21 },
  };
}
