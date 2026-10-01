import type { AssetPlacement, Vec3Data } from '../assets/assetTypes';
import { getAsset } from '../assets/catalog';
import { createRandom, hashSeed } from '../core/seededRandom';
import { GridNavigator } from '../navigation/GridNavigator';
import { eligibleAssetIds, WORLD_THEME_DEFINITIONS, type WorldTheme } from './regionThemes';

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
  kind: WorldTheme;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  density: number;
}

export interface WorldLootZone {
  id: string;
  name: string;
  theme: WorldTheme;
  regionId: string;
  centerX: number;
  centerZ: number;
  radius: number;
  cacheCount: number;
}

export interface WorldLandmark {
  id: string;
  name: string;
  assetId: string;
  theme: WorldTheme;
  regionId: string;
  variant: number;
  x: number;
  z: number;
  approachX: number;
  approachZ: number;
}

export interface WorldWaterArea {
  id: string;
  centerX: number;
  centerZ: number;
  sizeX: number;
  sizeZ: number;
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

export interface WorldAccessPoint {
  id: string;
  assetId: string;
  pointId: string;
  theme: WorldTheme;
  regionId: string;
  placementX: number;
  placementZ: number;
  targetX: number;
  targetZ: number;
  x: number;
  z: number;
}

export interface WorldData {
  seed: string;
  rotationQuarterTurns: number;
  size: number;
  roads: WorldRoad[];
  districts: WorldDistrict[];
  waterAreas: WorldWaterArea[];
  lootZones: WorldLootZone[];
  landmarks: WorldLandmark[];
  accessPoints: WorldAccessPoint[];
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
    { id: 'farm-lane', centerX: -3, centerZ: -59, sizeX: 5.5, sizeZ: 110, kind: 'trail' },
    { id: 'military-access-road', centerX: -74, centerZ: 86, sizeX: 132, sizeZ: 6.5, kind: 'road' },
    { id: 'coastal-trail', centerX: 104, centerZ: -72, sizeX: 5.5, sizeZ: 70, kind: 'trail' },
    { id: 'camp-track', centerX: 48, centerZ: 78, sizeX: 5.5, sizeZ: 68, kind: 'trail' },
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
      centerX: -87 + jitter(7),
      centerZ: -38 + jitter(7),
      radiusX: 37,
      radiusZ: 34,
      density: 0.78,
    },
    {
      id: 'mill-row',
      name: 'Mill Row',
      kind: 'urban',
      centerX: -87 + jitter(7),
      centerZ: 38 + jitter(7),
      radiusX: 37,
      radiusZ: 34,
      density: 0.75,
    },
    {
      id: 'junction',
      name: 'Junction Blocks',
      kind: 'urban',
      centerX: -48 + jitter(5),
      centerZ: jitter(12),
      radiusX: 16,
      radiusZ: 69,
      density: 0.44,
    },
    {
      id: 'north-pines',
      name: 'Pine District A',
      kind: 'forest',
      centerX: 83 + jitter(10),
      centerZ: -39 + jitter(8),
      radiusX: 40,
      radiusZ: 44,
      density: 0.82,
    },
    {
      id: 'south-pines',
      name: 'Pine District B',
      kind: 'forest',
      centerX: 83 + jitter(10),
      centerZ: 39 + jitter(8),
      radiusX: 40,
      radiusZ: 44,
      density: 0.78,
    },
    {
      id: 'highfield-farm',
      name: 'Highfield Farm',
      kind: 'farm',
      centerX: jitter(8),
      centerZ: -107 + jitter(5),
      radiusX: 40,
      radiusZ: 25,
      density: WORLD_THEME_DEFINITIONS.farm.density,
    },
    {
      id: 'north-coast',
      name: 'North Coast',
      kind: 'coastal',
      centerX: 110 + jitter(5),
      centerZ: -107 + jitter(5),
      radiusX: 24,
      radiusZ: 25,
      density: WORLD_THEME_DEFINITIONS.coastal.density,
    },
    {
      id: 'field-base',
      name: 'Field Base',
      kind: 'military',
      centerX: -110 + jitter(5),
      centerZ: 108 + jitter(5),
      radiusX: 24,
      radiusZ: 26,
      density: WORLD_THEME_DEFINITIONS.military.density,
    },
    {
      id: 'wayfarer-outpost',
      name: 'Wayfarer Outpost',
      kind: 'camp',
      centerX: 46 + jitter(6),
      centerZ: 108 + jitter(5),
      radiusX: 40,
      radiusZ: 26,
      density: WORLD_THEME_DEFINITIONS.camp.density,
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
      theme: 'urban',
      regionId: 'old-quarter',
      centerX: -88 + jitter(8),
      centerZ: -35 + jitter(8),
      radius: 20,
      cacheCount: 1,
    },
    {
      id: 'lighthouse-access',
      name: 'Lighthouse Access',
      theme: 'coastal',
      regionId: 'north-coast',
      centerX: 104 + jitter(5),
      centerZ: -96 + jitter(5),
      radius: 13,
      cacheCount: 1,
    },
    {
      id: 'highfield-yard',
      name: 'Highfield Yard',
      theme: 'farm',
      regionId: 'highfield-farm',
      centerX: jitter(8),
      centerZ: -106 + jitter(8),
      radius: 18,
      cacheCount: 1,
    },
    {
      id: 'north-pine-loop',
      name: 'Pine Loop A',
      theme: 'forest',
      regionId: 'north-pines',
      centerX: 84 + jitter(8),
      centerZ: -38 + jitter(8),
      radius: 19,
      cacheCount: 1,
    },
    {
      id: 'south-pine-road',
      name: 'Pine Loop B',
      theme: 'forest',
      regionId: 'south-pines',
      centerX: 82 + jitter(8),
      centerZ: 40 + jitter(8),
      radius: 19,
      cacheCount: 1,
    },
    {
      id: 'base-perimeter',
      name: 'Field Base Perimeter',
      theme: 'military',
      regionId: 'field-base',
      centerX: -103 + jitter(6),
      centerZ: 104 + jitter(6),
      radius: 15,
      cacheCount: 1,
    },
    {
      id: 'wayfarer-supply',
      name: 'Wayfarer Supply Camp',
      theme: 'camp',
      regionId: 'wayfarer-outpost',
      centerX: 45 + jitter(8),
      centerZ: 107 + jitter(8),
      radius: 18,
      cacheCount: 1,
    },
  ];
}

function createLandmarks(seed: string, districts: WorldDistrict[]): WorldLandmark[] {
  const random = createRandom(`${seed}:landmarks`);
  const districtById = new Map(districts.map((district) => [district.id, district]));
  const point = (regionId: string, offsetX: number, offsetZ: number) => {
    const district = districtById.get(regionId)!;
    return {
      x: district.centerX + offsetX + (random() - 0.5) * 2.4,
      z: district.centerZ + offsetZ + (random() - 0.5) * 2.4,
    };
  };
  const specs: Array<{
    id: string;
    name: string;
    assetId: string;
    theme: WorldTheme;
    regionId: string;
    offsetX: number;
    offsetZ: number;
    approachDirection: { x: number; z: number };
  }> = [
    {
      id: 'water-tower',
      name: 'Water Tower',
      assetId: 'water-tower',
      theme: 'farm',
      regionId: 'highfield-farm',
      offsetX: 18,
      offsetZ: 0,
      approachDirection: { x: 1, z: 0 },
    },
    {
      id: 'farm-grain-silo',
      name: 'Farm Grain Silo',
      assetId: 'farm-grain-silo',
      theme: 'farm',
      regionId: 'highfield-farm',
      offsetX: -17,
      offsetZ: 0,
      approachDirection: { x: -1, z: 0 },
    },
    {
      id: 'radio-mast',
      name: 'Relay Mast',
      assetId: 'radio-mast',
      theme: 'military',
      regionId: 'field-base',
      offsetX: -14,
      offsetZ: -14,
      approachDirection: { x: -1, z: 0 },
    },
    {
      id: 'aircraft-hangar',
      name: 'Aircraft Hangar',
      assetId: 'aircraft-hangar',
      theme: 'military',
      regionId: 'field-base',
      offsetX: 0,
      offsetZ: 0,
      approachDirection: { x: 0, z: 1 },
    },
    {
      id: 'coastal-lighthouse',
      name: 'Coastal Lighthouse',
      assetId: 'coastal-lighthouse',
      theme: 'coastal',
      regionId: 'north-coast',
      offsetX: 9,
      offsetZ: 0,
      approachDirection: { x: -1, z: 0 },
    },
  ];

  return specs.map((spec) => {
    const position = point(spec.regionId, spec.offsetX, spec.offsetZ);
    const { offsetX, offsetZ, approachDirection, ...landmark } = spec;
    return {
      ...landmark,
      ...position,
      variant: selectThemeVariant(random, spec.theme, spec.assetId),
      approachX: position.x + approachDirection.x * 8,
      approachZ: position.z + approachDirection.z * 8,
    };
  });
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

function createWaterAreas(districts: WorldDistrict[]): WorldWaterArea[] {
  const coast = districts.find((district) => district.kind === 'coastal')!;
  return [
    {
      id: 'north-coast-water',
      centerX: Math.min(coast.centerX + 22.5, HALF_WORLD - 7.5),
      centerZ: coast.centerZ,
      sizeX: 15,
      sizeZ: 48,
    },
  ];
}

function rotateWaterAreas(areas: WorldWaterArea[], quarterTurns: number): WorldWaterArea[] {
  return areas.map((area) => {
    const center = rotateXZ(area.centerX, area.centerZ, quarterTurns);
    const swap = quarterTurns % 2 === 1;
    return {
      ...area,
      centerX: center.x,
      centerZ: center.z,
      sizeX: swap ? area.sizeZ : area.sizeX,
      sizeZ: swap ? area.sizeX : area.sizeZ,
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

export interface TerrainThemeBlend {
  primary: WorldTheme;
  secondary: WorldTheme;
  amount: number;
}

/** Chooses the nearest authored region and softly mixes its neighbor at transition edges. */
export function terrainThemeBlendAt(
  districts: WorldDistrict[],
  x: number,
  z: number,
): TerrainThemeBlend {
  const ranked = districts
    .map((district) => ({
      theme: district.kind,
      distance: Math.hypot(
        (x - district.centerX) / district.radiusX,
        (z - district.centerZ) / district.radiusZ,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
  const first = ranked[0];
  const second = ranked[1];
  if (!first) return { primary: 'forest', secondary: 'forest', amount: 0 };
  if (!second) return { primary: first.theme, secondary: first.theme, amount: 0 };
  const difference = Math.max(0, second.distance - first.distance);
  const amount = Math.max(0, (0.36 - difference) / 0.72);
  return { primary: first.theme, secondary: second.theme, amount };
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

interface PlacementFootprint {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function footprintFor(placement: AssetPlacement, padding = 0): PlacementFootprint {
  const dimensions = getAsset(placement.assetId).dimensions;
  const cosine = Math.abs(Math.cos(placement.rotationY));
  const sine = Math.abs(Math.sin(placement.rotationY));
  const halfX = (cosine * dimensions.x + sine * dimensions.z) * placement.scale * 0.5 + padding;
  const halfZ = (sine * dimensions.x + cosine * dimensions.z) * placement.scale * 0.5 + padding;
  return {
    minX: placement.position.x - halfX,
    maxX: placement.position.x + halfX,
    minZ: placement.position.z - halfZ,
    maxZ: placement.position.z + halfZ,
  };
}

function footprintsOverlap(a: PlacementFootprint, b: PlacementFootprint): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function overlapsWater(placement: AssetPlacement, waterAreas: WorldWaterArea[]): boolean {
  const collider = colliderFor(placement);
  if (!collider) return false;
  return waterAreas.some(
    (area) =>
      collider.minX < area.centerX + area.sizeX / 2 &&
      collider.maxX > area.centerX - area.sizeX / 2 &&
      collider.minZ < area.centerZ + area.sizeZ / 2 &&
      collider.maxZ > area.centerZ - area.sizeZ / 2,
  );
}

function waterCollider(area: WorldWaterArea): WorldCollider {
  return {
    id: area.id,
    minX: area.centerX - area.sizeX / 2,
    maxX: area.centerX + area.sizeX / 2,
    minY: -3,
    maxY: 3,
    minZ: area.centerZ - area.sizeZ / 2,
    maxZ: area.centerZ + area.sizeZ / 2,
  };
}

function worldInteractionPoint(
  placement: AssetPlacement,
  point: Vec3Data,
): { x: number; z: number } {
  const cosine = Math.cos(placement.rotationY);
  const sine = Math.sin(placement.rotationY);
  return {
    x: placement.position.x + (point.x * cosine + point.z * sine) * placement.scale,
    z: placement.position.z + (-point.x * sine + point.z * cosine) * placement.scale,
  };
}

function isClearOfInteractionApproaches(
  candidate: AssetPlacement,
  placements: AssetPlacement[],
  clearance = 6.2,
): boolean {
  const candidateFootprint = footprintFor(candidate);
  const existingApproachesClear = placements.every((placement) =>
    getAsset(placement.assetId).interactionPoints.every((point) => {
      const target = worldInteractionPoint(placement, point.position);
      const dx = Math.max(
        candidateFootprint.minX - target.x,
        0,
        target.x - candidateFootprint.maxX,
      );
      const dz = Math.max(
        candidateFootprint.minZ - target.z,
        0,
        target.z - candidateFootprint.maxZ,
      );
      return Math.hypot(dx, dz) > clearance;
    }),
  );
  const candidateApproachesClear = getAsset(candidate.assetId).interactionPoints.every((point) => {
    const target = worldInteractionPoint(candidate, point.position);
    return placements.every((placement) => {
      const existingFootprint = footprintFor(placement);
      const dx = Math.max(existingFootprint.minX - target.x, 0, target.x - existingFootprint.maxX);
      const dz = Math.max(existingFootprint.minZ - target.z, 0, target.z - existingFootprint.maxZ);
      return Math.hypot(dx, dz) > clearance;
    });
  });
  return existingApproachesClear && candidateApproachesClear;
}

function isClearOfWaterApproaches(
  placement: AssetPlacement,
  waterAreas: WorldWaterArea[],
  clearance = 6.2,
): boolean {
  return getAsset(placement.assetId).interactionPoints.every((point) => {
    const target = worldInteractionPoint(placement, point.position);
    return waterAreas.every((area) => {
      const dx = Math.max(
        area.centerX - area.sizeX / 2 - target.x,
        0,
        target.x - area.centerX - area.sizeX / 2,
      );
      const dz = Math.max(
        area.centerZ - area.sizeZ / 2 - target.z,
        0,
        target.z - area.centerZ - area.sizeZ / 2,
      );
      return Math.hypot(dx, dz) > clearance;
    });
  });
}

function findAccessPoint(
  world: WorldData,
  navigator: GridNavigator,
  placement: AssetPlacement,
  point: Vec3Data,
): { target: { x: number; z: number }; approach: { x: number; z: number } } | undefined {
  const target = worldInteractionPoint(placement, point);
  const candidates: Array<{ x: number; z: number; radius: number; direction: number }> = [];
  for (const radius of [1.8, 2.6, 3.6, 4.8, 6.2]) {
    for (let direction = 0; direction < 16; direction += 1) {
      const angle = (direction * Math.PI) / 8;
      const x = target.x + Math.cos(angle) * radius;
      const z = target.z + Math.sin(angle) * radius;
      if (
        !navigator.isWalkable(x, z) ||
        !world.colliders.every((collider) => distanceToCollider(x, z, collider) > 0.5)
      )
        continue;
      candidates.push({ x, z, radius, direction });
    }
    if (candidates.length > 0) break;
  }
  const approach = candidates.sort((a, b) => a.direction - b.direction)[0];
  return approach ? { target, approach: { x: approach.x, z: approach.z } } : undefined;
}

function addPlacement(
  placements: AssetPlacement[],
  assetId: string,
  seed: string,
  x: number,
  z: number,
  theme: WorldTheme,
  regionId: string,
  scale = 1,
  rotationY = 0,
  variant = 0,
): void {
  placements.push({
    assetId,
    theme,
    regionId,
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
        ((x - district.centerX) / district.radiusX) ** 2 +
          ((z - district.centerZ) / district.radiusZ) ** 2 >
          0.92 ||
        Math.abs(x) > HALF_WORLD - 13 ||
        Math.abs(z) > HALF_WORLD - 12 ||
        isOnRoad(x, z, roads, 12) ||
        !isClearOfLanding(x, z, spawn) ||
        landmarks.some((landmark) => Math.hypot(x - landmark.x, z - landmark.z) < 18)
      )
        continue;
      const overlapsBuilding = placements.some(
        (placement) =>
          getAsset(placement.assetId).category === 'building' &&
          Math.abs(placement.position.x - x) < 23 &&
          Math.abs(placement.position.z - z) < 20,
      );
      if (overlapsBuilding || random() > district.density) continue;
      const candidate: AssetPlacement = {
        assetId: 'building-shell',
        theme: district.kind,
        regionId: district.id,
        position: { x, y: terrainHeightAt(seed, x, z), z },
        scale: 0.88 + random() * 0.2,
        rotationY: random() < 0.5 ? 0 : Math.PI,
        variant: selectThemeVariant(random, district.kind, 'building-shell'),
      };
      const footprint = footprintFor(candidate);
      if (placements.some((placement) => footprintsOverlap(footprint, footprintFor(placement))))
        continue;
      placements.push(candidate);
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
        ((x - district.centerX) / district.radiusX) ** 2 +
          ((z - district.centerZ) / district.radiusZ) ** 2 >
          0.92 ||
        Math.abs(x) > HALF_WORLD - 8 ||
        Math.abs(z) > HALF_WORLD - 8 ||
        isOnRoad(x, z, roads, 5) ||
        !isClearOfLanding(x, z, spawn) ||
        landmarks.some((landmark) => Math.hypot(x - landmark.x, z - landmark.z) < 15)
      )
        continue;
      if (random() > district.density) continue;
      const assetId =
        placed === 0
          ? 'burned-tree-cluster'
          : chooseWeightedAsset(random, WORLD_THEME_DEFINITIONS.forest.propWeights);
      const scale =
        assetId === 'burned-tree-cluster'
          ? 0.82 + random() * 0.26
          : assetId === 'pine-tree'
            ? 0.74 + random() * 0.42
            : 0.72 + random() * 0.5;
      const candidate: AssetPlacement = {
        assetId,
        theme: district.kind,
        regionId: district.id,
        position: { x, y: terrainHeightAt(seed, x, z), z },
        rotationY: random() * Math.PI * 2,
        scale,
        variant: selectThemeVariant(random, district.kind, assetId),
      };
      if (
        placements.some((placement) =>
          footprintsOverlap(footprintFor(candidate, 0.9), footprintFor(placement)),
        )
      )
        continue;
      placements.push(candidate);
      placed += 1;
    }
  }
}

function chooseWeightedAsset(
  random: () => number,
  weights: Readonly<Record<string, number>>,
): string {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (entries.length === 0 || totalWeight <= 0)
    throw new Error('Asset pool has no positive weights');
  let selection = random() * totalWeight;
  for (const [assetId, weight] of entries) {
    selection -= weight;
    if (selection < 0) return assetId;
  }
  return entries.at(-1)![0];
}

function selectThemeVariant(random: () => number, theme: WorldTheme, assetId: string): number {
  const variantCount = Math.max(1, WORLD_THEME_DEFINITIONS[theme].variantCounts[assetId] ?? 1);
  return Math.floor(random() * variantCount);
}

function overlapsRoad(footprint: PlacementFootprint, roads: WorldRoad[], margin = 1.5): boolean {
  return roads.some(
    (road) =>
      footprint.minX < road.centerX + road.sizeX / 2 + margin &&
      footprint.maxX > road.centerX - road.sizeX / 2 - margin &&
      footprint.minZ < road.centerZ + road.sizeZ / 2 + margin &&
      footprint.maxZ > road.centerZ - road.sizeZ / 2 - margin,
  );
}

function addUrbanSetPiece(
  placements: AssetPlacement[],
  seed: string,
  districts: WorldDistrict[],
  roads: WorldRoad[],
  spawn: Vec3Data,
): void {
  const district = districts.find((entry) => entry.id === 'old-quarter');
  if (!district) return;
  const random = createRandom(`${seed}:urban-set-piece`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const x = district.centerX + 7 + (random() - 0.5) * 2.4;
    const z = district.centerZ + 2 + (random() - 0.5) * 2.4;
    const candidate: AssetPlacement = {
      assetId: 'burned-corner-store',
      theme: 'urban',
      regionId: district.id,
      position: { x, y: terrainHeightAt(seed, x, z), z },
      rotationY: random() < 0.5 ? 0 : Math.PI,
      scale: 0.96 + random() * 0.08,
      variant: selectThemeVariant(random, 'urban', 'burned-corner-store'),
    };
    const footprint = footprintFor(candidate, 1.5);
    if (
      isClearOfLanding(x, z, spawn) &&
      !overlapsRoad(footprint, roads) &&
      !placements.some((placement) => footprintsOverlap(footprint, footprintFor(placement)))
    ) {
      placements.push(candidate);
      return;
    }
  }
}

function placeAssetInTheme(
  placements: AssetPlacement[],
  assetId: string,
  theme: WorldTheme,
  seed: string,
  random: () => number,
  roads: WorldRoad[],
  districts: WorldDistrict[],
  waterAreas: WorldWaterArea[],
  spawn: Vec3Data,
  maxAttempts = 1200,
  search: {
    radius?: number;
    minSpacing?: number;
    protectInteractionApproaches?: boolean;
  } = {},
): AssetPlacement | undefined {
  const definition = WORLD_THEME_DEFINITIONS[theme];
  const regions = districts.filter((district) => district.kind === theme);
  const asset = getAsset(assetId);
  const searchRadius = search.radius ?? 0.78;
  const minSpacing = search.minSpacing ?? definition.minSpacing;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const district = regions[Math.floor(random() * regions.length)];
    if (!district) continue;
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * searchRadius;
    const x = district.centerX + Math.cos(angle) * district.radiusX * distance;
    const z = district.centerZ + Math.sin(angle) * district.radiusZ * distance;
    const rotationY = random() * Math.PI * 2;
    const scale = asset.category === 'building' ? 0.94 + random() * 0.1 : 0.9 + random() * 0.2;
    const candidate: AssetPlacement = {
      assetId,
      theme,
      regionId: district.id,
      position: { x, y: terrainHeightAt(seed, x, z), z },
      rotationY,
      scale,
      variant: selectThemeVariant(random, theme, assetId),
    };
    const footprint = footprintFor(candidate);
    if (
      footprint.minX < -HALF_WORLD + 2 ||
      footprint.maxX > HALF_WORLD - 2 ||
      footprint.minZ < -HALF_WORLD + 2 ||
      footprint.maxZ > HALF_WORLD - 2 ||
      !isClearOfLanding(x, z, spawn) ||
      overlapsRoad(footprint, roads) ||
      overlapsWater(candidate, waterAreas) ||
      !isClearOfWaterApproaches(candidate, waterAreas)
    )
      continue;
    if (
      search.protectInteractionApproaches &&
      !isClearOfInteractionApproaches(candidate, placements)
    )
      continue;
    const paddedFootprint = footprintFor(candidate, minSpacing);
    if (placements.some((placement) => footprintsOverlap(paddedFootprint, footprintFor(placement))))
      continue;
    placements.push(candidate);
    return candidate;
  }
  return undefined;
}

function addRequiredThemeAssets(
  placements: AssetPlacement[],
  seed: string,
  roads: WorldRoad[],
  districts: WorldDistrict[],
  waterAreas: WorldWaterArea[],
  landmarks: WorldLandmark[],
  spawn: Vec3Data,
  reserveEarlyAssets = false,
): void {
  const random = createRandom(`${seed}:theme-placement${reserveEarlyAssets ? ':reserve' : ''}`);
  const themes: WorldTheme[] = reserveEarlyAssets
    ? ['urban', 'forest']
    : ['urban', 'forest', 'farm', 'military', 'coastal', 'camp'];
  for (const theme of themes) {
    const definition = WORLD_THEME_DEFINITIONS[theme];
    const fixedAssets = new Set(
      landmarks.filter((landmark) => landmark.theme === theme).map((landmark) => landmark.assetId),
    );
    const requiredAssetsByFootprint = [...definition.requiredAssetIds];
    if (theme === 'urban')
      requiredAssetsByFootprint.sort((first, second) => {
        const firstDimensions = getAsset(first).dimensions;
        const secondDimensions = getAsset(second).dimensions;
        return secondDimensions.x * secondDimensions.z - firstDimensions.x * firstDimensions.z;
      });
    const assetIdsToPlace =
      reserveEarlyAssets && theme === 'urban'
        ? requiredAssetsByFootprint.slice(0, 2)
        : requiredAssetsByFootprint;
    for (const assetId of assetIdsToPlace) {
      if (
        fixedAssets.has(assetId) ||
        placements.some((placement) => placement.theme === theme && placement.assetId === assetId)
      )
        continue;
      const placeRequired = (search?: { radius?: number; minSpacing?: number }) =>
        placeAssetInTheme(
          placements,
          assetId,
          theme,
          seed,
          random,
          roads,
          districts,
          waterAreas,
          spawn,
          2600,
          search,
        );
      const placed =
        placeRequired() ??
        // Keep preferred spacing when possible, but search farther through a dense district and
        // allow tighter gaps before failing the whole world over a mandatory set piece.
        placeRequired({ radius: 0.96, minSpacing: 0 });
      if (!placed)
        throw new Error(`Could not place required ${theme} asset "${assetId}" for seed "${seed}"`);
    }
    if (reserveEarlyAssets) continue;

    const dressingCount = Math.round(definition.density * 1.5);
    for (let index = 0; index < dressingCount; index += 1) {
      if (Object.keys(definition.propWeights).length === 0) break;
      const dressingAssetId = chooseWeightedAsset(random, definition.propWeights);
      placeAssetInTheme(
        placements,
        dressingAssetId,
        theme,
        seed,
        random,
        roads,
        districts,
        waterAreas,
        spawn,
        420,
      );
    }
  }
}

function addMilitarySiteDressing(
  placements: AssetPlacement[],
  seed: string,
  districts: WorldDistrict[],
  roads: WorldRoad[],
): void {
  const district = districts.find((entry) => entry.id === 'field-base');
  if (!district) return;
  const random = createRandom(`${seed}:military-site`);
  const anchors = [
    { assetId: 'helipad', offsetX: 12, offsetZ: 21 },
    { assetId: 'communication-truck', offsetX: 20, offsetZ: -5 },
    { assetId: 'portable-floodlight-tower', offsetX: -14, offsetZ: 20 },
  ];
  for (const anchor of anchors) {
    const x = district.centerX + anchor.offsetX + (random() - 0.5) * 1.2;
    const z = district.centerZ + anchor.offsetZ + (random() - 0.5) * 1.2;
    const candidate: AssetPlacement = {
      assetId: anchor.assetId,
      theme: 'military',
      regionId: district.id,
      position: { x, y: terrainHeightAt(seed, x, z), z },
      rotationY: (random() - 0.5) * 0.35,
      scale: 0.98 + random() * 0.04,
      variant: selectThemeVariant(random, 'military', anchor.assetId),
    };
    const footprint = footprintFor(candidate, 0.6);
    const withinDistrict =
      ((x - district.centerX) / district.radiusX) ** 2 +
        ((z - district.centerZ) / district.radiusZ) ** 2 <=
      1;
    const isClear =
      withinDistrict &&
      !overlapsRoad(footprint, roads) &&
      !placements.some((placement) => footprintsOverlap(footprint, footprintFor(placement)));
    if (isClear) placements.push(candidate);
  }
}

export function generateWorld(seed: string): WorldData {
  const resolvedSeed = cleanSeed(seed);
  const rotationQuarterTurns = rotationForSeed(resolvedSeed);
  const roads = createRoads(resolvedSeed);
  const districts = createDistricts(resolvedSeed);
  const lootZones = createLootZones(resolvedSeed);
  const landmarks = createLandmarks(resolvedSeed, districts);
  const waterAreas = createWaterAreas(districts);
  const canonicalSpawn = { x: 0, z: -5 };
  const canonicalSpawnPoint = {
    x: canonicalSpawn.x,
    y: terrainHeightAt(resolvedSeed, canonicalSpawn.x, canonicalSpawn.z),
    z: canonicalSpawn.z,
  };
  const placements: AssetPlacement[] = [];

  for (const landmark of landmarks)
    addPlacement(
      placements,
      landmark.assetId,
      resolvedSeed,
      landmark.x,
      landmark.z,
      landmark.theme,
      landmark.regionId,
      1,
      0,
      landmark.variant,
    );
  addUrbanSetPiece(placements, resolvedSeed, districts, roads, canonicalSpawnPoint);
  addRequiredThemeAssets(
    placements,
    resolvedSeed,
    roads,
    districts,
    waterAreas,
    landmarks,
    canonicalSpawnPoint,
    true,
  );
  addDistrictBuildings(placements, resolvedSeed, roads, districts, landmarks);
  addForestProps(placements, resolvedSeed, roads, districts, landmarks);
  addMilitarySiteDressing(placements, resolvedSeed, districts, roads);
  addRequiredThemeAssets(
    placements,
    resolvedSeed,
    roads,
    districts,
    waterAreas,
    landmarks,
    canonicalSpawnPoint,
  );

  const spawnPosition = rotateXZ(canonicalSpawn.x, canonicalSpawn.z, rotationQuarterTurns);
  const spawn: Vec3Data = {
    ...spawnPosition,
    y: terrainHeightAt(resolvedSeed, spawnPosition.x, spawnPosition.z),
  };
  const rotatedPlacements = rotatePlacements(placements, resolvedSeed, rotationQuarterTurns);
  const rotatedWaterAreas = rotateWaterAreas(waterAreas, rotationQuarterTurns);
  const colliders = rotatedPlacements
    .flatMap((placement) => {
      const collider = colliderFor(placement);
      return collider ? [collider] : [];
    })
    .concat(rotatedWaterAreas.map(waterCollider));
  const rotatedLandmarks = rotateLandmarks(landmarks, rotationQuarterTurns);
  const generatedWorld: WorldData = {
    seed: resolvedSeed,
    rotationQuarterTurns,
    size: WORLD_SIZE,
    roads: roadsForSeed(resolvedSeed),
    districts: rotateDistricts(districts, rotationQuarterTurns),
    lootZones: rotateLootZones(lootZones, rotationQuarterTurns),
    waterAreas: rotatedWaterAreas,
    landmarks: rotatedLandmarks,
    accessPoints: [],
    entrances: [],
    placements: rotatedPlacements,
    colliders,
    objectCount: placements.length + roads.length + rotatedWaterAreas.length + 1,
    spawn,
  };
  const entranceNavigator = new GridNavigator(generatedWorld);
  generatedWorld.landmarks = rotatedLandmarks.map((landmark) => {
    const asset = getAsset(landmark.assetId);
    const clearance = Math.max(asset.dimensions.x, asset.dimensions.z) / 2 + 3;
    const intendedAngle = Math.atan2(
      landmark.approachZ - landmark.z,
      landmark.approachX - landmark.x,
    );
    const candidates: Array<{ x: number; z: number; score: number }> = [];
    for (const extra of [0, 2, 4, 7]) {
      const radius = clearance + extra;
      for (let direction = 0; direction < 16; direction += 1) {
        const angle = intendedAngle + (direction * Math.PI) / 8;
        const x = landmark.x + Math.cos(angle) * radius;
        const z = landmark.z + Math.sin(angle) * radius;
        candidates.push({
          x,
          z,
          score:
            Math.hypot(x - spawn.x, z - spawn.z) +
            Math.abs(angle - intendedAngle) * 0.25 +
            extra * 0.1,
        });
      }
    }
    const approach = candidates
      .sort((a, b) => a.score - b.score)
      .find(
        (candidate) =>
          entranceNavigator.isWalkable(candidate.x, candidate.z) &&
          generatedWorld.colliders.every(
            (collider) => distanceToCollider(candidate.x, candidate.z, collider) > 1,
          ) &&
          entranceNavigator.findPath(spawn.x, spawn.z, candidate.x, candidate.z).length > 0,
      );
    if (!approach) return landmark;
    return { ...landmark, approachX: approach.x, approachZ: approach.z };
  });
  generatedWorld.accessPoints = rotatedPlacements.flatMap((placement) => {
    const asset = getAsset(placement.assetId);
    return asset.interactionPoints.flatMap((point) => {
      const found = findAccessPoint(generatedWorld, entranceNavigator, placement, point.position);
      if (!found) return [];
      return [
        {
          id: `${placement.assetId}-${placement.position.x.toFixed(1)}-${placement.position.z.toFixed(1)}-${point.id}`,
          assetId: placement.assetId,
          pointId: point.id,
          theme: placement.theme,
          regionId: placement.regionId,
          placementX: placement.position.x,
          placementZ: placement.position.z,
          targetX: found.target.x,
          targetZ: found.target.z,
          x: found.approach.x,
          z: found.approach.z,
        },
      ];
    });
  });
  const entrances = rotatedPlacements.flatMap((placement, index) => {
    if (placement.assetId !== 'building-shell') return [];
    const doorPoint = getAsset(placement.assetId).interactionPoints.find(
      (point) => point.id === 'front-door',
    )?.position ?? { x: 0, y: 0, z: 8.57 };
    const outwardX = Math.sin(placement.rotationY);
    const outwardZ = Math.cos(placement.rotationY);
    const doorX =
      placement.position.x +
      (doorPoint.x * Math.cos(placement.rotationY) + doorPoint.z * Math.sin(placement.rotationY)) *
        placement.scale;
    const doorZ =
      placement.position.z +
      (-doorPoint.x * Math.sin(placement.rotationY) + doorPoint.z * Math.cos(placement.rotationY)) *
        placement.scale;
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
  const dimensions = asset.dimensions;
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

    const region = world.districts.find((district) => district.id === placement.regionId);
    const assetIsEligible = eligibleAssetIds(placement.theme).has(placement.assetId);
    if (!region || region.kind !== placement.theme)
      issues.push(`${placement.assetId} has no matching ${placement.theme} region`);
    else if (
      Math.hypot(
        (placement.position.x - region.centerX) / region.radiusX,
        (placement.position.z - region.centerZ) / region.radiusZ,
      ) > 1
    )
      issues.push(`${placement.assetId} is outside its ${region.name} region`);
    if (!assetIsEligible)
      issues.push(`${placement.assetId} is not eligible for the ${placement.theme} pool`);
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
    const placement = world.placements.find(
      (entry) =>
        entry.assetId === landmark.assetId &&
        Math.hypot(entry.position.x - landmark.x, entry.position.z - landmark.z) < 0.01,
    );
    if (!placement) issues.push(`${landmark.name} has no matching placed ${landmark.assetId}`);
    if (
      !world.colliders.every(
        (collider) => distanceToCollider(landmark.approachX, landmark.approachZ, collider) > 1,
      )
    )
      issues.push(`${landmark.name} has a blocked approach point`);
  }
  const expectedAccessPoints = world.placements.reduce(
    (count, placement) => count + getAsset(placement.assetId).interactionPoints.length,
    0,
  );
  if (world.accessPoints.length !== expectedAccessPoints) {
    const missingAccessPoints = world.placements.flatMap((placement) =>
      getAsset(placement.assetId)
        .interactionPoints.filter(
          (point) =>
            !world.accessPoints.some(
              (accessPoint) =>
                accessPoint.assetId === placement.assetId &&
                Math.abs(accessPoint.placementX - placement.position.x) < 0.05 &&
                Math.abs(accessPoint.placementZ - placement.position.z) < 0.05 &&
                accessPoint.pointId === point.id,
            ),
        )
        .map(
          (point) =>
            `${placement.assetId}:${point.id}@${placement.position.x.toFixed(1)},${placement.position.z.toFixed(1)}`,
        ),
    );
    issues.push(
      `only ${world.accessPoints.length} of ${expectedAccessPoints} authored interaction points have clear approaches (missing: ${missingAccessPoints.join(', ')})`,
    );
  }
  for (const accessPoint of world.accessPoints) {
    const placement = world.placements.find(
      (entry) =>
        entry.assetId === accessPoint.assetId &&
        entry.regionId === accessPoint.regionId &&
        Math.abs(entry.position.x - accessPoint.placementX) < 0.05 &&
        Math.abs(entry.position.z - accessPoint.placementZ) < 0.05,
    );
    if (!placement || placement.theme !== accessPoint.theme)
      issues.push(`${accessPoint.id} has no matching themed placement`);
    if (
      world.colliders.some(
        (collider) => distanceToCollider(accessPoint.x, accessPoint.z, collider) <= 0.5,
      )
    )
      issues.push(`${accessPoint.id} has a blocked interaction approach`);
  }
  for (const area of world.waterAreas) {
    if (
      Math.abs(area.centerX) + area.sizeX / 2 > world.size / 2 ||
      Math.abs(area.centerZ) + area.sizeZ / 2 > world.size / 2
    )
      issues.push(`${area.id} extends beyond the map`);
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
