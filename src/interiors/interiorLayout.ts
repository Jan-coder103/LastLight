import { createRandom } from '../core/seededRandom';
import type { ResourceKind } from '../game/saveData';
import type { WorldCollider, WorldData } from '../world/generateWorld';

export interface InteriorRoom {
  id: string;
  name: string;
  theme: 'living' | 'kitchen' | 'storage' | 'bedroom';
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}

export interface InteriorWall {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

export interface InteriorFurniture {
  id: string;
  theme: InteriorRoom['theme'];
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

export interface InteriorLoot {
  id: string;
  x: number;
  z: number;
  kind: ResourceKind;
  amount: number;
}

export interface InteriorLayout {
  seed: string;
  size: number;
  rooms: InteriorRoom[];
  walls: InteriorWall[];
  furniture: InteriorFurniture[];
  loot: InteriorLoot[];
  encounter: { id: string; x: number; z: number };
  entry: { x: number; z: number };
  exit: { x: number; z: number };
  colliders: WorldCollider[];
}

const themes: InteriorRoom['theme'][] = ['living', 'kitchen', 'storage', 'bedroom'];
const lootKinds: ResourceKind[] = ['gear', 'supplies', 'money', 'fuel'];
const wallHeight = 3.2;
const wallThickness = 0.24;
const doorWidth = 3.2;
const outerX = 10;
const outerZ = 8.4;
const roomWidth = 9.5;
const roomDepth = 8;
const roomCenters = [
  { x: -4.8, z: 4, row: 'front', column: 'left' },
  { x: 4.8, z: 4, row: 'front', column: 'right' },
  { x: -4.8, z: -4, row: 'back', column: 'left' },
  { x: 4.8, z: -4, row: 'back', column: 'right' },
] as const;

function wall(id: string, x: number, z: number, width: number, depth: number): InteriorWall {
  return { id, x, z, width, depth, height: wallHeight };
}

function splitInterval(
  id: string,
  axis: 'x' | 'z',
  fixed: number,
  start: number,
  end: number,
  gapCenter: number,
  hasDoor: boolean,
): InteriorWall[] {
  const span = end - start;
  if (!hasDoor) {
    return [
      axis === 'x'
        ? wall(id, fixed, (start + end) / 2, wallThickness, span)
        : wall(id, (start + end) / 2, fixed, span, wallThickness),
    ];
  }
  const gapStart = gapCenter - doorWidth / 2;
  const gapEnd = gapCenter + doorWidth / 2;
  const pieces: InteriorWall[] = [];
  if (gapStart > start + 0.01) {
    pieces.push(
      axis === 'x'
        ? wall(`${id}-a`, fixed, (start + gapStart) / 2, wallThickness, gapStart - start)
        : wall(`${id}-a`, (start + gapStart) / 2, fixed, gapStart - start, wallThickness),
    );
  }
  if (end > gapEnd + 0.01) {
    pieces.push(
      axis === 'x'
        ? wall(`${id}-b`, fixed, (gapEnd + end) / 2, wallThickness, end - gapEnd)
        : wall(`${id}-b`, (gapEnd + end) / 2, fixed, end - gapEnd, wallThickness),
    );
  }
  return pieces;
}

function makeWalls(activeCells: Set<number>): InteriorWall[] {
  const walls: InteriorWall[] = [];
  for (const row of [0, 1]) {
    const frontZ = row === 0;
    const zStart = frontZ ? 0 : -outerZ;
    const zEnd = frontZ ? outerZ : 0;
    for (const column of [0, 1]) {
      const cell = row * 2 + column;
      if (!activeCells.has(cell)) continue;
      const xStart = column === 0 ? -outerX : 0;
      const xEnd = column === 0 ? 0 : outerX;

      if (frontZ) {
        walls.push(...splitInterval(`outside-front-${column}`, 'z', outerZ, xStart, xEnd, 0, true));
      } else {
        walls.push(
          wall(
            `outside-back-${column}`,
            (xStart + xEnd) / 2,
            -outerZ,
            xEnd - xStart,
            wallThickness,
          ),
        );
      }

      if (column === 0) {
        walls.push(
          wall(`outside-left-${row}`, -outerX, (zStart + zEnd) / 2, wallThickness, zEnd - zStart),
        );
        const hasRightRoom = activeCells.has(row * 2 + 1);
        walls.push(
          ...splitInterval(`divider-x-${row}`, 'x', 0, zStart, zEnd, frontZ ? 4 : -4, hasRightRoom),
        );
      } else {
        walls.push(
          wall(`outside-right-${row}`, outerX, (zStart + zEnd) / 2, wallThickness, zEnd - zStart),
        );
      }

      if (frontZ) {
        const hasBackRoom = activeCells.has(2 + column);
        walls.push(
          ...splitInterval(
            `divider-z-${column}`,
            'z',
            0,
            xStart,
            xEnd,
            column === 0 ? -4.8 : 4.8,
            hasBackRoom,
          ),
        );
      }
    }
    const hasLeftRoom = activeCells.has(row * 2);
    const hasRightRoom = activeCells.has(row * 2 + 1);
    if (!hasLeftRoom && hasRightRoom) {
      walls.push(wall(`divider-x-${row}`, 0, (zStart + zEnd) / 2, wallThickness, zEnd - zStart));
    }
  }
  return walls;
}

function colliderForWall(entry: InteriorWall): WorldCollider {
  return {
    id: `wall-${entry.id}`,
    minX: entry.x - entry.width / 2,
    maxX: entry.x + entry.width / 2,
    minY: 0,
    maxY: entry.height,
    minZ: entry.z - entry.depth / 2,
    maxZ: entry.z + entry.depth / 2,
  };
}

function colliderForFurniture(entry: InteriorFurniture): WorldCollider {
  return {
    id: `furniture-${entry.id}`,
    minX: entry.x - entry.width / 2,
    maxX: entry.x + entry.width / 2,
    minY: 0,
    maxY: entry.height,
    minZ: entry.z - entry.depth / 2,
    maxZ: entry.z + entry.depth / 2,
  };
}

/** Generates a connected, repeatable 2–4 room scavenging interior. */
export function generateInterior(seed: string): InteriorLayout {
  const resolvedSeed = seed.trim().slice(0, 64) || 'RAVEN-07:building-0';
  const random = createRandom(`${resolvedSeed}:interior-v1`);
  const roomCount = 2 + Math.floor(random() * 3);
  const activeCells = new Set([0, 1]);
  if (roomCount >= 3) activeCells.add(3);
  if (roomCount >= 4) activeCells.add(2);
  const rooms = [...activeCells]
    .sort((a, b) => a - b)
    .map((cell, index) => {
      const center = roomCenters[cell]!;
      return {
        id: `room-${index + 1}`,
        name: ['Front Left', 'Front Right', 'Rear Right', 'Rear Left'][cell]!,
        theme: themes[Math.floor(random() * themes.length)]!,
        centerX: center.x,
        centerZ: center.z,
        width: roomWidth,
        depth: roomDepth,
      };
    });
  const furniture = rooms.map((room): InteriorFurniture => ({
    id: `${room.id}-furnishing`,
    theme: room.theme,
    x: room.centerX - 2.2,
    z: room.centerZ - 1.3,
    width: room.theme === 'bedroom' ? 2.2 : 1.8,
    depth: room.theme === 'storage' ? 1.4 : 1.1,
    height: room.theme === 'storage' ? 1.55 : 0.9,
  }));
  const lootRooms = rooms.slice(1);
  const loot = lootRooms.map((room, index): InteriorLoot => {
    const kind = lootKinds[Math.floor(random() * lootKinds.length)]!;
    return {
      id: `${resolvedSeed}:loot-${index + 1}`,
      x: room.centerX + 1.8,
      z: room.centerZ + 1.45,
      kind,
      amount: kind === 'money' ? 12 + Math.floor(random() * 29) : 1 + Math.floor(random() * 2),
    };
  });
  const encounterRoom = rooms[rooms.length - 1]!;
  const walls = makeWalls(activeCells);
  const furnitureColliders = furniture.map(colliderForFurniture);
  return {
    seed: resolvedSeed,
    size: 24,
    rooms,
    walls,
    furniture,
    loot,
    encounter: {
      id: `${resolvedSeed}:infected-1`,
      x: encounterRoom.centerX + 1.75,
      z: encounterRoom.centerZ - 1.8,
    },
    entry: { x: 0, z: 6.1 },
    exit: { x: 0, z: 6.1 },
    colliders: [...walls.map(colliderForWall), ...furnitureColliders],
  };
}

/** Provides the wall/furniture collision context used by the player and room encounter. */
export function interiorWorld(layout: InteriorLayout, outerWorld: WorldData): WorldData {
  return {
    ...outerWorld,
    seed: layout.seed,
    size: layout.size,
    roads: [],
    districts: [],
    lootZones: [],
    landmarks: [],
    entrances: [],
    placements: [],
    colliders: layout.colliders,
    objectCount: layout.rooms.length + layout.walls.length + layout.furniture.length,
    spawn: { x: layout.entry.x, y: 0, z: layout.entry.z },
  };
}
