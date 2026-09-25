import type { AssetPlacement, Vec3Data } from '../assets/assetTypes';
import { getAsset } from '../assets/catalog';
import { createRandom } from '../core/seededRandom';

export const WORLD_SIZE = 280;
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

export interface WorldData {
  seed: string;
  size: number;
  roads: WorldRoad[];
  placements: AssetPlacement[];
  colliders: WorldCollider[];
  objectCount: number;
  spawn: Vec3Data;
}

const roads: WorldRoad[] = [
  { id: 'crossroad-east-west', centerX: 0, centerZ: 7, sizeX: WORLD_SIZE, sizeZ: 13, kind: 'road' },
  { id: 'city-avenue', centerX: -28, centerZ: 0, sizeX: 13, sizeZ: WORLD_SIZE, kind: 'road' },
  { id: 'north-city-street', centerX: -81, centerZ: -55, sizeX: 106, sizeZ: 7, kind: 'road' },
  { id: 'south-city-street', centerX: -81, centerZ: 55, sizeX: 106, sizeZ: 7, kind: 'road' },
  { id: 'forest-trail', centerX: 70, centerZ: -12, sizeX: 148, sizeZ: 6, kind: 'trail' },
];

function isOnRoad(x: number, z: number, margin = 0): boolean {
  return roads.some(
    (road) =>
      Math.abs(x - road.centerX) <= road.sizeX / 2 + margin &&
      Math.abs(z - road.centerZ) <= road.sizeZ / 2 + margin,
  );
}

export function terrainHeightAt(seed: string, x: number, z: number): number {
  if (isOnRoad(x, z, 0.4)) return 0;
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
  const centerX = placement.position.x + collider.center.x * placement.scale;
  const centerY = placement.position.y + collider.center.y * placement.scale;
  const centerZ = placement.position.z + collider.center.z * placement.scale;
  const halfX = (collider.size.x * placement.scale) / 2;
  const halfY = (collider.size.y * placement.scale) / 2;
  const halfZ = (collider.size.z * placement.scale) / 2;
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

export function generateWorld(seed: string): WorldData {
  const cleanSeed = seed.trim().slice(0, 32) || 'RAVEN-07';
  const random = createRandom(cleanSeed);
  const placements: AssetPlacement[] = [];

  // A regular street grid keeps the city legible and leaves walkable gaps around shells.
  const cityX = [-111, -78, -48];
  const cityZ = [-107, -77, -27, 27, 77, 107];
  cityZ.forEach((z, row) => {
    cityX.forEach((x, column) => {
      if (random() < 0.14) return;
      const offsetX = (random() - 0.5) * 3;
      const offsetZ = (random() - 0.5) * 3;
      const scale = 0.88 + random() * 0.18;
      addPlacement(
        placements,
        'building-shell',
        cleanSeed,
        x + offsetX,
        z + offsetZ,
        scale,
        random() < 0.5 ? 0 : Math.PI,
        (row + column + Math.floor(random() * 3)) % 3,
      );
    });
  });

  const landmarkX = 94 + (random() - 0.5) * 18;
  const landmarkZ = -82 + (random() - 0.5) * 18;
  addPlacement(placements, 'water-tower', cleanSeed, landmarkX, landmarkZ, 1, 0, 0);

  // Reject placements near roads, the landmark, or another forest prop to preserve clear routes.
  const forestProps: Array<{ x: number; z: number; radius: number }> = [];
  for (let attempt = 0; attempt < 900 && forestProps.length < 58; attempt += 1) {
    const x = 37 + random() * 92;
    const z = -126 + random() * 252;
    if (x > HALF_WORLD - 8 || Math.abs(z) > HALF_WORLD - 8 || isOnRoad(x, z, 5)) continue;
    const nearTower = Math.hypot(x - landmarkX, z - landmarkZ) < 14;
    const overlapsProp = forestProps.some(
      (prop) => Math.hypot(x - prop.x, z - prop.z) < prop.radius + 4.6,
    );
    if (nearTower || overlapsProp) continue;
    const tree = random() > 0.25;
    const scale = tree ? 0.74 + random() * 0.42 : 0.72 + random() * 0.5;
    forestProps.push({ x, z, radius: tree ? 2.3 * scale : 1.8 * scale });
    addPlacement(
      placements,
      tree ? 'pine-tree' : 'boulder',
      cleanSeed,
      x,
      z,
      scale,
      random() * Math.PI * 2,
      Math.floor(random() * 3),
    );
  }

  const colliders = placements.flatMap((placement) => {
    const collider = colliderFor(placement);
    return collider ? [collider] : [];
  });

  return {
    seed: cleanSeed,
    size: WORLD_SIZE,
    roads: roads.map((road) => ({ ...road })),
    placements,
    colliders,
    objectCount: placements.length + roads.length + 1,
    spawn: { x: 0, y: terrainHeightAt(cleanSeed, 0, 0), z: -5 },
  };
}
