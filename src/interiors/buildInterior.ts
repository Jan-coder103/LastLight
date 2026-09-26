import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { interiorWorld, type InteriorFurniture, type InteriorLayout } from './interiorLayout';
import type { WorldData } from '../world/generateWorld';

const roomColors = ['#74664f', '#5e6359', '#685d51', '#756752'];

function box(
  width: number,
  height: number,
  depth: number,
  material: MeshStandardMaterial,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createFurnishing(entry: InteriorFurniture): Group {
  const group = new Group();
  group.position.set(entry.x, 0, entry.z);
  group.name = `${entry.theme} room piece`;
  const wood = new MeshStandardMaterial({ color: '#514437', roughness: 0.95, flatShading: true });
  const cloth = new MeshStandardMaterial({ color: '#716d5f', roughness: 1, flatShading: true });
  const metal = new MeshStandardMaterial({ color: '#444943', roughness: 0.8, metalness: 0.18 });
  if (entry.theme === 'bedroom') {
    group.add(box(2.15, 0.34, 1.5, wood, 0, 0.2, 0));
    group.add(box(2.05, 0.32, 1.4, cloth, 0, 0.5, -0.03));
    group.add(box(0.72, 0.3, 0.8, cloth, 0.2, 0.78, -0.25));
  } else if (entry.theme === 'kitchen') {
    group.add(box(1.65, 0.16, 1.05, wood, 0, 0.86, 0));
    for (const x of [-0.68, 0.68])
      for (const z of [-0.4, 0.4]) group.add(box(0.12, 0.84, 0.12, wood, x, 0.42, z));
    group.add(box(0.6, 0.5, 0.58, metal, 0.92, 0.28, -0.18));
  } else if (entry.theme === 'storage') {
    group.add(box(1.58, 1.42, 1.28, metal, 0, 0.72, 0));
    group.add(box(1.63, 0.1, 1.34, wood, 0, 1.47, 0));
    group.add(box(0.9, 0.55, 0.72, wood, 0.22, 1.78, 0.12));
  } else {
    group.add(box(1.88, 0.6, 0.82, cloth, 0, 0.52, 0));
    group.add(box(1.88, 0.72, 0.24, cloth, 0, 0.86, 0.28));
    group.add(box(0.42, 0.44, 0.48, wood, -1.05, 0.22, -0.55));
  }
  return group;
}

/** Builds the generated floor plan from a small set of reusable room pieces. */
export function buildInterior(layout: InteriorLayout, outerWorld: WorldData): Group {
  const root = new Group();
  root.name = `Interior ${layout.seed}`;
  const floorMaterial = new MeshStandardMaterial({
    color: '#655844',
    roughness: 1,
    flatShading: true,
  });
  const wallMaterial = new MeshStandardMaterial({
    color: '#6d685b',
    roughness: 1,
    flatShading: true,
  });
  const trimMaterial = new MeshStandardMaterial({ color: '#302e29', roughness: 0.95 });
  const signMaterial = new MeshStandardMaterial({
    color: '#92a56f',
    emissive: '#314126',
    roughness: 0.75,
  });

  for (const [index, room] of layout.rooms.entries()) {
    const baseFloor = new Mesh(
      new PlaneGeometry(room.width - 0.12, room.depth - 0.12),
      floorMaterial,
    );
    baseFloor.rotation.x = -Math.PI / 2;
    baseFloor.position.set(room.centerX, 0.01, room.centerZ);
    baseFloor.receiveShadow = true;
    baseFloor.name = 'Interior floor';
    baseFloor.userData.walkableFloor = true;
    root.add(baseFloor);

    const floor = new Mesh(
      new PlaneGeometry(room.width - 0.3, room.depth - 0.3),
      new MeshStandardMaterial({ color: roomColors[index % roomColors.length], roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(room.centerX, 0.025, room.centerZ);
    floor.receiveShadow = true;
    floor.name = `${room.name} room floor`;
    root.add(floor);
  }

  for (const entry of layout.walls) {
    const wallMesh = box(
      entry.width,
      entry.height,
      entry.depth,
      wallMaterial,
      entry.x,
      entry.height / 2,
      entry.z,
    );
    wallMesh.name = `Interior wall ${entry.id}`;
    root.add(wallMesh);
  }
  for (const entry of layout.furniture) root.add(createFurnishing(entry));

  // The front doorway stays open. A lit exit marker gives the player a clear click target.
  root.add(box(0.18, 2.5, 0.22, trimMaterial, -1.55, 1.25, 8.25));
  root.add(box(0.18, 2.5, 0.22, trimMaterial, 1.55, 1.25, 8.25));
  root.add(box(3.2, 0.18, 0.22, trimMaterial, 0, 2.55, 8.25));
  const threshold = new Mesh(new PlaneGeometry(3.2, 0.8), floorMaterial);
  threshold.rotation.x = -Math.PI / 2;
  threshold.position.set(0, 0.015, 8.05);
  threshold.receiveShadow = true;
  threshold.userData.walkableFloor = true;
  root.add(threshold);
  const exitSign = box(0.7, 0.52, 0.12, signMaterial, 2.1, 2.05, 8.16);
  exitSign.name = 'Interior exit marker';
  exitSign.userData.interactiveId = 'interior-exit';
  root.add(exitSign);

  root.userData.worldData = interiorWorld(layout, outerWorld);
  root.userData.entryPoint = layout.entry;
  root.userData.exitPoint = layout.exit;
  return root;
}
