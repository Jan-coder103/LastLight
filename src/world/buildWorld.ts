import {
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import { getAsset } from '../assets/catalog';
import type { WorldRoad } from './generateWorld';
import {
  terrainHeightAt,
  terrainThemeBlendAt,
  type WorldData,
  type WorldWaterArea,
} from './generateWorld';
import { WORLD_THEME_DEFINITIONS } from './regionThemes';

const grassMaterial = new MeshStandardMaterial({
  vertexColors: true,
  roughness: 1,
  flatShading: true,
});
const roadMaterial = new MeshStandardMaterial({ color: '#454841', roughness: 1, side: DoubleSide });
const trailMaterial = new MeshStandardMaterial({
  color: '#82795f',
  roughness: 1,
  side: DoubleSide,
});
const lineMaterial = new MeshStandardMaterial({ color: '#c0ad69', roughness: 1, side: DoubleSide });
const edgeMaterial = new MeshStandardMaterial({
  color: '#6d7560',
  roughness: 1,
  flatShading: true,
});
const waterMaterial = new MeshStandardMaterial({
  color: '#536d70',
  roughness: 0.5,
  metalness: 0.04,
  side: DoubleSide,
});
const terrainColors = new Map(
  Object.entries(WORLD_THEME_DEFINITIONS).map(([theme, definition]) => [
    theme,
    new Color(definition.terrainColor),
  ]),
);

function makeTerrain(world: WorldData): Mesh {
  const segments = 72;
  const geometry = new PlaneGeometry(world.size, world.size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];
  const color = new Color();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const y = terrainHeightAt(world.seed, x, z);
    positions.setY(index, y);

    const blend = terrainThemeBlendAt(world.districts, x, z);
    color
      .copy(terrainColors.get(blend.primary)!)
      .lerp(terrainColors.get(blend.secondary)!, blend.amount);
    const variation = Math.sin(x * 0.21 + z * 0.08) * 0.035 + Math.cos(z * 0.19) * 0.025;
    color.offsetHSL(0, 0, variation);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const terrain = new Mesh(geometry, grassMaterial);
  terrain.receiveShadow = true;
  terrain.name = 'Seeded terrain';
  return terrain;
}

function makeWaterArea(world: WorldData, area: WorldWaterArea): Mesh {
  const geometry = new PlaneGeometry(area.sizeX, area.sizeZ, 12, 24);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index += 1) {
    const x = area.centerX + positions.getX(index);
    const z = area.centerZ + positions.getZ(index);
    positions.setY(index, terrainHeightAt(world.seed, x, z) + 0.045);
  }
  geometry.computeVertexNormals();
  const water = new Mesh(geometry, waterMaterial);
  water.position.set(area.centerX, 0, area.centerZ);
  water.receiveShadow = true;
  water.name = `Water ${area.id}`;
  water.userData.staticCollider = true;
  return water;
}

function addRoadMarkings(group: Group, road: WorldRoad): void {
  if (road.kind !== 'road') return;
  if (road.sizeX > road.sizeZ) {
    const dashCount = Math.floor(road.sizeX / 15);
    for (let index = 0; index < dashCount; index += 1) {
      const x = -road.sizeX / 2 + 8 + index * 15;
      const dash = new Mesh(new PlaneGeometry(6.2, 0.22), lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(road.centerX + x, 0.1, road.centerZ);
      group.add(dash);
    }
  } else if (road.sizeZ > 40) {
    const dashCount = Math.floor(road.sizeZ / 15);
    for (let index = 0; index < dashCount; index += 1) {
      const z = -road.sizeZ / 2 + 8 + index * 15;
      const dash = new Mesh(new PlaneGeometry(0.22, 6.2), lineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(road.centerX, 0.1, road.centerZ + z);
      group.add(dash);
    }
  }
}

function makeWorldEdgeMarkers(world: WorldData): Group {
  const markers = new Group();
  const postGeometry = new CylinderGeometry(0.42, 0.55, 1.5, 5);
  for (const x of [-world.size / 2 + 3, world.size / 2 - 3]) {
    for (const z of [-world.size / 2 + 3, world.size / 2 - 3]) {
      const marker = new Mesh(postGeometry, edgeMaterial);
      marker.position.set(x, terrainHeightAt(world.seed, x, z) + 0.72, z);
      marker.castShadow = true;
      markers.add(marker);
    }
  }
  markers.name = 'Map boundary markers';
  return markers;
}

export function buildWorld(world: WorldData): Group {
  const root = new Group();
  root.name = `World ${world.seed}`;
  root.add(makeTerrain(world));
  for (const area of world.waterAreas) root.add(makeWaterArea(world, area));

  for (const road of world.roads) {
    const roadMesh = new Mesh(
      new PlaneGeometry(road.sizeX, road.sizeZ),
      road.kind === 'road' ? roadMaterial : trailMaterial,
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(road.centerX, 0.055, road.centerZ);
    roadMesh.receiveShadow = true;
    roadMesh.name = road.id;
    root.add(roadMesh);
    addRoadMarkings(root, road);
  }

  const prototypes = new Map<string, Group>();
  for (const [placementIndex, placement] of world.placements.entries()) {
    const key = `${placement.assetId}:${placement.variant}`;
    let prototype = prototypes.get(key);
    if (!prototype) {
      prototype = getAsset(placement.assetId).createVisual(placement.variant);
      prototypes.set(key, prototype);
    }
    const visual = prototype.clone(true);
    visual.position.set(placement.position.x, placement.position.y, placement.position.z);
    visual.rotation.y = placement.rotationY;
    visual.scale.setScalar(placement.scale);
    visual.traverse((object) => {
      if (object instanceof Mesh) object.receiveShadow = true;
    });
    visual.name = `${placement.assetId} instance`;
    if (placement.assetId === 'building-shell') {
      const door = visual.children[2];
      if (door) door.userData.interactiveId = `building-${placementIndex}`;
      visual.userData.buildingId = `building-${placementIndex}`;
    }
    root.add(visual);
  }

  root.add(makeWorldEdgeMarkers(world));
  root.userData.staticColliderCount = world.colliders.length;
  root.userData.assetCount = world.placements.length;
  root.userData.terrainSample = new Vector3(0, terrainHeightAt(world.seed, 0, 0), 0);
  return root;
}
