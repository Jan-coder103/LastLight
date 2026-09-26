import type { AssetPlacement, Vec3Data } from '../assets/assetTypes';
import { getAsset } from '../assets/catalog';
import { createRandom, hashSeed } from '../core/seededRandom';
import { GridNavigator } from '../navigation/GridNavigator';

export const WORLD_SIZE = 280;
export const LANDING_CLEARANCE = 18;
const HALF_WORLD = WORLD_SIZE / 2;

export interface WorldRoad {
  id: string;
  centerX: number;
  centerZ: number;
  sizeX: number;
  sizeZ: number;
  kind: 'road' | 'trail';
}

export interface WorldCollider {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface WorldDistrict {
  id: string;
  name: string;
  kind: 'urban' | 'forest';
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  density: number;
}

export interface WorldLootZone {
  id: string;
  name: string;
  centerX: number;
  centerZ: number;
  radius: number;
  cacheCount: number;
}

export interface WorldLandmark {
  id: string;
  name: string;
  assetId: string;
  x: number;
  z: number;
  approachX: number;
  approachZ: number;
}

export interface BuildingEntrance {
  id: string;
  x: number;
  z: number;
  doorX: number;
  doorZ: number;
  outwardX: number;
  outwardZ: number;
  rotationY: number;
}

export interface WorldData {
  seed: string;
  rotationQuarterTurns: number;
  size: number;
  roads: WorldRoad[];
  districts: WorldDistrict[];
  lootZones: WorldLootZone[];
  landmarks: WorldLandmark[];
  entrances: BuildingEntrance[];
  placements: AssetPlacement[];
  colliders: WorldCollider[];
  objectCount: number;
  spawn: Vec3Data;
}

const roadsCache = new Map<string, WorldRoad[]>();

function cleanSeed(seed: string): string {
  return seed.trim().slice(0, 32) || 'RAVEN-07';
}

function rotationForSeed(seed: string): number {
  return hashSeed(seed) % 4;
}

function rotateXZ(x: number, z: number, quarterTurns: number): { x: number; z: number } {
  switch (quarterTurns) {
    case 1:
      return { x: -z, z: x };
    case 2:
      return { x: -x, z: -z };
    case 3:
      return { x: z, z: -x };
    default:
      return { x, z };
  }
}

function createRoads(seed: string): WorldRoad[] {
  const random = createRandom(`${seed}:roads`);
  const jitter = (amount: number): number => (random() - 0.5) * amount;
  return [
    {
      id: 'main-crossroad',
      centerX: 0,
      centerZ: 7,
      sizeX: WORLD_SIZE,
      sizeZ: 13,
      kind: 'road',
    },
    { id: 'city-arterial', centerX: -28, centerZ: 0, sizeX: 13, sizeZ: WORLD_SIZE, kind: 'road' },
    {
      id: 'city-grid-street-a',
      centerX: -81 + jitter(8),
      centerZ: -55 + jitter(8),
      sizeX: 106 + jitter(10),
      sizeZ: 7,
      kind: 'road',
    },
    {
      id: 'city-grid-street-b',
      centerX: -81 + jitter(8),
      centerZ: 55 + jitter(8),
      sizeX: 106 + jitter(10),
      sizeZ: 7,
      kind: 'road',
    },
    {
      id: 'city-grid-cross-street-a',
      centerX: -98 + jitter(8),
      centerZ: -2 + jitter(12),
      sizeX: 7,
      sizeZ: 158 + jitter(12),
      kind: 'road',
    },
    {
      id: 'city-grid-cross-street-b',
      centerX: -62 + jitter(8),
      centerZ: -1 + jitter(12),
      sizeX: 7,
      sizeZ: 158 + jitter(12),
      kind: 'road',
    },
    {
      id: 'forest-trail-a',
      centerX: 68 + jitter(12),
      centerZ: -17 + jitter(12),
      sizeX: 130,
      sizeZ: 5.5,
      kind: 'trail',
    },
    {
      id: 'forest-trail-spine',
      centerX: 92 + jitter(12),
      centerZ: -11 + jitter(10),
      sizeX: 5.5,
      sizeZ: 196,
      kind: 'trail',
    },
    {
      id: 'forest-trail-b',
      centerX: 74 + jitter(12),
      centerZ: 72 + jitter(10),
      sizeX: 118,
      sizeZ: 5.5,
      kind: 'trail',
    },
  ];
}

function roadsForSeed(seed: string): WorldRoad[] {
  const key = cleanSeed(seed);
  let roads = roadsCache.get(key);
  if (!roads) {
    const rotation = rotationForSeed(key);
    roads = createRoads(key).map((road) => {
      const center = rotateXZ(road.centerX, road.centerZ, rotation);
      const swap = rotation % 2 === 1;
      return {
        ...road,
        centerX: center.x,
        centerZ: center.z,
        sizeX: swap ? road.sizeZ : road.sizeX,
        sizeZ: swap ? road.sizeX : road.sizeZ,
      };
    });
    roadsCache.set(key, roads);
    if (roadsCache.size > 16) roadsCache.delete(roadsCache.keys().next().value!);
  }
  return roads;
}

function isOnRoad(x: number, z: number, roads: WorldRoad[], margin = 0): boolean {
  return roads.some(
    (road) =>
      Math.abs(x - road.centerX) <= road.sizeX / 2 + margin &&
      Math.abs(z - road.centerZ) <= road.sizeZ / 2 + margin,
  );
}

function createDistricts(seed: string): WorldDistrict[] {
  const random = createRandom(`${seed}:districts`);
  const jitter = (amount: number): number => (random() - 0.5) * amount;
  return [
    {
      id: 'old-quarter',
      name: 'Old Quarter',
      kind: 'urban',
      centerX: -89 + jitter(9),
      centerZ: -76 + jitter(11),
      radiusX: 43,
      radiusZ: 47,
      density: 0.78,
    },
    {
      id: 'mill-row',
      name: 'Mill Row',
      kind: 'urban',
      centerX: -87 + jitter(11),
      centerZ: 75 + jitter(11),
      radiusX: 45,
      radiusZ: 47,
      density: 0.75,
    },
    {
      id: 'junction',
      name: 'Junction Blocks',
      kind: 'urban',
      centerX: -48 + jitter(6),
      centerZ: jitter(12),
      radiusX: 20,
      radiusZ: 102,
      density: 0.44,
    },
    {
      id: 'north-pines',
      name: 'Pine District A',
      kind: 'forest',
      centerX: 82 + jitter(16),
      centerZ: -70 + jitter(14),
      radiusX: 60,
      radiusZ: 65,
      density: 0.82,
    },
    {
      id: 'south-pines',
      name: 'Pine District B',
      kind: 'forest',
      centerX: 82 + jitter(16),
      centerZ: 72 + jitter(14),
      radiusX: 60,
      radiusZ: 60,
      density: 0.78,
    },
  ];
}

function createLootZones(seed: string): WorldLootZone[] {
  const random = createRandom(`${seed}:loot-zones`);
  const jitter = (amount: number): number => (random() - 0.5) * amount;
  return [
    {
      id: 'market-block',
      name: 'Market Block',
      centerX: -79 + jitter(8),
      centerZ: -27 + jitter(8),
      radius: 23,
      cacheCount: 2,
    },
    {
      id: 'mill-yard',
      name: 'Mill Yard',
      centerX: -76 + jitter(8),
      centerZ: 73 + jitter(8),
      radius: 22,
      cacheCount: 1,
    },
    {
      id: 'canal-verge',
      name: 'Canal Verge',
      centerX: 38 + jitter(8),
      centerZ: -43 + jitter(8),
      radius: 24,
      cacheCount: 2,
    },
    {
      id: 'north-pine-loop',
      name: 'Pine Loop A',
      centerX: 87 + jitter(9),
      centerZ: -42 + jitter(9),
      radius: 24,
      cacheCount: 1,
    },
    {
      id: 'south-pine-road',
      name: 'Pine Loop B',
      centerX: 82 + jitter(9),
      centerZ: 61 + jitter(9),
      radius: 23,
      cacheCount: 1,
    },
  ];
}

function createLandmarks(seed: string): WorldLandmark[] {
  const random = createRandom(`${seed}:landmarks`);
  const towerX = 105 + (random() - 0.5) * 18;
  const towerZ = -92 + (random() - 0.5) * 18;
  const mastX = 109 + (random() - 0.5) * 16;
  const mastZ = 89 + (random() - 0.5) * 16;
  return [
    {
      id: 'water-tower',
      name: 'Water Tower',
      assetId: 'water-tower',
      x: towerX,
      z: towerZ,
      approachX: towerX + 10,
      approachZ: towerZ,
    },
    {
      id: 'radio-mast',
      name: 'Relay Mast',
      assetId: 'radio-mast',
      x: mastX,
      z: mastZ,
      approachX: mastX - 10,
      approachZ: mastZ,
    },
  ];
}

function rotateDistricts(districts: WorldDistrict[], quarterTurns: number): WorldDistrict[] {
  return districts.map((district) => {
    const center = rotateXZ(district.centerX, district.centerZ, quarterTurns);
    const swap = quarterTurns % 2 === 1;
    return {
      ...district,
      centerX: center.x,
      centerZ: center.z,
      radiusX: swap ? district.radiusZ : district.radiusX,
      radiusZ: swap ? district.radiusX : district.radiusZ,
    };
  });
}

function rotateLootZones(zones: WorldLootZone[], quarterTurns: number): WorldLootZone[] {
  return zones.map((zone) => {
    const center = rotateXZ(zone.centerX, zone.centerZ, quarterTurns);
    return { ...zone, centerX: center.x, centerZ: center.z };
  });
}

function rotateLandmarks(landmarks: WorldLandmark[], quarterTurns: number): WorldLandmark[] {
  return landmarks.map((landmark) => {
    const position = rotateXZ(landmark.x, landmark.z, quarterTurns);
    const approach = rotateXZ(landmark.approachX, landmark.approachZ, quarterTurns);
    return {
      ...landmark,
      x: position.x,
      z: position.z,
      approachX: approach.x,
      approachZ: approach.z,
    };
  });
}

function rotatePlacements(
  placements: AssetPlacement[],
  seed: string,
  quarterTurns: number,
): AssetPlacement[] {
  const yawOffset = quarterTurns * (Math.PI / 2);
  return placements.map((placement) => {
    const position = rotateXZ(placement.position.x, placement.position.z, quarterTurns);
    return {
      ...placement,
      position: { x: position.x, y: terrainHeightAt(seed, position.x, position.z), z: position.z },
      rotationY: placement.rotationY - yawOffset,
    };
  });
}

/** Returns 1 for fully urban ground and 0 for fully forest ground, blending near district edges. */
export function terrainBiomeBlendAt(districts: WorldDistrict[], x: number, z: number): number {
  const score = (district: WorldDistrict): number =>
    Math.hypot(
      (x - district.centerX) / district.radiusX,
      (z - district.centerZ) / district.radiusZ,
    );
  const urbanDistance = Math.min(
    ...districts.filter((district) => district.kind === 'urban').map(score),
  );
  const forestDistance = Math.min(
    ...districts.filter((district) => district.kind === 'forest').map(score),
  );
  if (!Number.isFinite(urbanDistance)) return 0;
  if (!Number.isFinite(forestDistance)) return 1;
  const totalDistance = urbanDistance + forestDistance;
  return totalDistance < 0.0001 ? 0.5 : forestDistance / totalDistance;
}

export function terrainHeightAt(seed: string, x: number, z: number): number {
  const roads = roadsForSeed(seed);
  if (isOnRoad(x, z, roads, 0.4)) return 0;
  let phase = 0;
  for (let index = 0; index < seed.length; index += 1)
    phase += seed.charCodeAt(index) * (index + 1);
  const a = phase * 0.017;
  const b = phase * 0.031;
  return (
    Math.sin(x * 0.034 + a) * 0.38 +
    Math.cos(z * 0.029 + b) * 0.32 +
    Math.sin((x + z) * 0.016 + a * 0.42) * 0.2
  );
}

function colliderFor(placement: AssetPlacement): WorldCollider | undefined {
  const collider = getAsset(placement.assetId).collider;
  if (!collider) return undefined;
  const cosine = Math.cos(placement.rotationY);
  const sine = Math.sin(placement.rotationY);
  const centerOffsetX = (collider.center.x * cosine + collider.center.z * sine) * placement.scale;
  const centerOffsetZ = (-collider.center.x * sine + collider.center.z * cosine) * placement.scale;
  const centerX = placement.position.x + centerOffsetX;
  const centerY = placement.position.y + collider.center.y * placement.scale;
  const centerZ = placement.position.z + centerOffsetZ;
  const halfX =
    ((Math.abs(cosine) * collider.size.x + Math.abs(sine) * collider.size.z) * placement.scale) / 2;
  const halfY = (collider.size.y * placement.scale) / 2;
  const halfZ =
    ((Math.abs(sine) * collider.size.x + Math.abs(cosine) * collider.size.z) * placement.scale) / 2;
  return {
    id: `${placement.assetId}-${placement.position.x.toFixed(1)}-${placement.position.z.toFixed(1)}`,
    minX: centerX - halfX,
    maxX: centerX + halfX,
    minY: centerY - halfY,
    maxY: centerY + halfY,
    minZ: centerZ - halfZ,
    maxZ: centerZ + halfZ,
  };
}

function addPlacement(
  placements: AssetPlacement[],
  assetId: string,
  seed: string,
  x: number,
  z: number,
  scale = 1,
  rotationY = 0,
  variant = 0,
): void {
  placements.push({
    assetId,
    position: { x, y: terrainHeightAt(seed, x, z), z },
    rotationY,
    scale,
    variant,
  });
}

function isClearOfLanding(x: number, z: number, spawn: Vec3Data): boolean {
  return Math.hypot(x - spawn.x, z - spawn.z) >= LANDING_CLEARANCE;
}

function addDistrictBuildings(
  placements: AssetPlacement[],
  seed: string,
  roads: WorldRoad[],
  districts: WorldDistrict[],
  landmarks: WorldLandmark[],
): void {
  const random = createRandom(`${seed}:buildings`);
  const targets = new Map<string, number>([
    ['old-quarter', 13],
    ['mill-row', 12],
    ['junction', 5],
  ]);
  const spawn = { x: 0, y: 0, z: -5 };
  for (const district of districts.filter((entry) => entry.kind === 'urban')) {
    const target = targets.get(district.id) ?? 0;
    let placed = 0;
    for (let attempt = 0; attempt < 2400 && placed < target; attempt += 1) {
      const x = district.centerX + (random() * 2 - 1) * district.radiusX;
      const z = district.centerZ + (random() * 2 - 1) * district.radiusZ;
      if (
        Math.abs(x) > HALF_WORLD - 13 ||
        Math.abs(z) > HALF_WORLD - 12 ||
        isOnRoad(x, z, roads, 12) ||
        !isClearOfLanding(x, z, spawn) ||
        landmarks.some((landmark) => Math.hypot(x - landmark.x, z - landmark.z) < 18)
      )
        continue;
      const overlapsBuilding = placements.some(
        (placement) =>
          placement.assetId === 'building-shell' &&
          Math.abs(placement.position.x - x) < 23 &&
          Math.abs(placement.position.z - z) < 20,
      );
      if (overlapsBuilding || random() > district.density) continue;
      addPlacement(
        placements,
        'building-shell',
        seed,
        x,
        z,
        0.88 + random() * 0.2,
        random() < 0.5 ? 0 : Math.PI,
        Math.floor(random() * 3),
      );
      placed += 1;
    }
  }
}

function addForestProps(
  placements: AssetPlacement[],
  seed: string,
  roads: WorldRoad[],
  districts: WorldDistrict[],
  landmarks: WorldLandmark[],
): void {
  const random = createRandom(`${seed}:forest-props`);
  const spawn = { x: 0, y: 0, z: -5 };
  const forestProps: Array<{ x: number; z: number; radius: number }> = [];
  const targetByDistrict = new Map([
    ['north-pines', 43],
    ['south-pines', 38],
  ]);
  for (const district of districts.filter((entry) => entry.kind === 'forest')) {
    const target = targetByDistrict.get(district.id) ?? 0;
    let placed = 0;
    for (let attempt = 0; attempt < 2800 && placed < target; attempt += 1) {
      const x = district.centerX + (random() * 2 - 1) * district.radiusX;
      const z = district.centerZ + (random() * 2 - 1) * district.radiusZ;
      if (
        Math.abs(x) > HALF_WORLD - 8 ||
        Math.abs(z) > HALF_WORLD - 8 ||
        isOnRoad(x, z, roads, 5) ||
        !isClearOfLanding(x, z, spawn) ||
        landmarks.some((landmark) => Math.hypot(x - landmark.x, z - landmark.z) < 15)
      )
        continue;
      const nearExisting = forestProps.some(
        (prop) => Math.hypot(x - prop.x, z - prop.z) < prop.radius + 4.6,
      );
      if (nearExisting || random() > district.density) continue;
      const tree = random() > 0.24;
      const scale = tree ? 0.74 + random() * 0.42 : 0.72 + random() * 0.5;
      forestProps.push({ x, z, radius: tree ? 2.3 * scale : 1.8 * scale });
      addPlacement(
        placements,
        tree ? 'pine-tree' : 'boulder',
        seed,
        x,
        z,
        scale,
        random() * Math.PI * 2,
        Math.floor(random() * 3),
      );
      placed += 1;
    }
  }
}

export function generateWorld(seed: string): WorldData {
  const resolvedSeed = cleanSeed(seed);
  const rotationQuarterTurns = rotationForSeed(resolvedSeed);
  const roads = createRoads(resolvedSeed);
  const districts = createDistricts(resolvedSeed);
  const lootZones = createLootZones(resolvedSeed);
  const landmarks = createLandmarks(resolvedSeed);
  const canonicalSpawn = { x: 0, z: -5 };
  const placements: AssetPlacement[] = [];

  for (const landmark of landmarks)
    addPlacement(placements, landmark.assetId, resolvedSeed, landmark.x, landmark.z);
  addDistrictBuildings(placements, resolvedSeed, roads, districts, landmarks);
  addForestProps(placements, resolvedSeed, roads, districts, landmarks);

  const spawnPosition = rotateXZ(canonicalSpawn.x, canonicalSpawn.z, rotationQuarterTurns);
  const spawn: Vec3Data = {
    ...spawnPosition,
    y: terrainHeightAt(resolvedSeed, spawnPosition.x, spawnPosition.z),
  };
  const rotatedPlacements = rotatePlacements(placements, resolvedSeed, rotationQuarterTurns);
  const colliders = rotatedPlacements.flatMap((placement) => {
    const collider = colliderFor(placement);
    return collider ? [collider] : [];
  });
  const generatedWorld: WorldData = {
    seed: resolvedSeed,
    rotationQuarterTurns,
    size: WORLD_SIZE,
    roads: roadsForSeed(resolvedSeed),
    districts: rotateDistricts(districts, rotationQuarterTurns),
    lootZones: rotateLootZones(lootZones, rotationQuarterTurns),
    landmarks: rotateLandmarks(landmarks, rotationQuarterTurns),
    entrances: [],
    placements: rotatedPlacements,
    colliders,
    objectCount: placements.length + roads.length + 1,
    spawn,
  };
  const entranceNavigator = new GridNavigator(generatedWorld);
  const entrances = rotatedPlacements.flatMap((placement, index) => {
    if (placement.assetId !== 'building-shell') return [];
    const outwardX = Math.sin(placement.rotationY);
    const outwardZ = Math.cos(placement.rotationY);
    const doorX = placement.position.x + outwardX * 8.57 * placement.scale;
    const doorZ = placement.position.z + outwardZ * 8.57 * placement.scale;
    const sideX = -outwardZ;
    const sideZ = outwardX;
    let approach: { x: number; z: number } | undefined;
    for (const distance of [3.4, 4.4, 5.4, 6.4]) {
      for (const lateral of [0, -1.4, 1.4, -2.8, 2.8]) {
        const x = doorX + outwardX * distance + sideX * lateral;
        const z = doorZ + outwardZ * distance + sideZ * lateral;
        if (entranceNavigator.isWalkable(x, z)) {
          approach = { x, z };
          break;
        }
      }
      if (approach) break;
    }
    if (!approach) return [];
    return [
      {
        id: `building-${index}`,
        x: approach.x,
        z: approach.z,
        doorX,
        doorZ,
        outwardX,
        outwardZ,
        rotationY: placement.rotationY,
      },
    ];
  });

  return { ...generatedWorld, entrances };
}

function distanceToCollider(x: number, z: number, collider: WorldCollider): number {
  const dx = Math.max(collider.minX - x, 0, x - collider.maxX);
  const dz = Math.max(collider.minZ - z, 0, z - collider.maxZ);
  return Math.hypot(dx, dz);
}

function placementInBounds(placement: AssetPlacement, size: number): boolean {
  const asset = getAsset(placement.assetId);
  const dimensions = asset.collider?.size ?? asset.dimensions;
  const cosine = Math.abs(Math.cos(placement.rotationY));
  const sine = Math.abs(Math.sin(placement.rotationY));
  const halfX = (cosine * dimensions.x + sine * dimensions.z) * placement.scale * 0.5;
  const halfZ = (sine * dimensions.x + cosine * dimensions.z) * placement.scale * 0.5;
  return (
    Math.abs(placement.position.x) + halfX <= size / 2 &&
    Math.abs(placement.position.z) + halfZ <= size / 2
  );
}

/** Reports static generation defects so seed suites can keep precise regression evidence. */
export function validateWorld(world: WorldData): string[] {
  const issues: string[] = [];
  if (
    Math.abs(world.spawn.x) > world.size / 2 ||
    Math.abs(world.spawn.z) > world.size / 2 ||
    world.colliders.some(
      (collider) => distanceToCollider(world.spawn.x, world.spawn.z, collider) < LANDING_CLEARANCE,
    )
  )
    issues.push('chopper landing area lacks the required clearance');

  for (const placement of world.placements) {
    if (!placementInBounds(placement, world.size))
      issues.push(
        `${placement.assetId} at ${placement.position.x},${placement.position.z} is out of bounds`,
      );
  }

  for (let first = 0; first < world.colliders.length; first += 1) {
    const a = world.colliders[first];
    for (let second = first + 1; second < world.colliders.length; second += 1) {
      const b = world.colliders[second];
      const overlapX = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
      const overlapZ = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
      if (overlapX > 0.25 && overlapZ > 0.25) {
        issues.push(`collider overlap: ${a.id} and ${b.id}`);
        if (issues.length >= 20) return issues;
      }
    }
  }

  for (const landmark of world.landmarks) {
    if (
      !world.colliders.every(
        (collider) => distanceToCollider(landmark.approachX, landmark.approachZ, collider) > 1,
      )
    )
      issues.push(`${landmark.name} has a blocked approach point`);
  }
  for (const road of world.roads) {
    if (
      Math.abs(road.centerX) + road.sizeX / 2 > world.size / 2 ||
      Math.abs(road.centerZ) + road.sizeZ / 2 > world.size / 2
    )
      issues.push(`${road.id} extends beyond the map`);
  }
  return issues;
}
