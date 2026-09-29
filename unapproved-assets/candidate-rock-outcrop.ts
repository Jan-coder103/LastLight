import { Group, IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

const rockMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1, flatShading: true });
rockMaterial.name = 'rock-light';
const rockDarkMaterial = new MeshStandardMaterial({ color: '#77796a', roughness: 1, flatShading: true });
rockDarkMaterial.name = 'rock-dark';
const rockShadeMaterial = new MeshStandardMaterial({ color: '#6a6b60', roughness: 1, flatShading: true });
rockShadeMaterial.name = 'rock-shade';
const lichenMaterial = new MeshStandardMaterial({ color: '#58624d', roughness: 1, flatShading: true });
lichenMaterial.name = 'rock-lichen';

const BOULDER = new IcosahedronGeometry(1, 0);
BOULDER.computeBoundingBox();
const BOULDER_MIN_Y = BOULDER.boundingBox?.min.y ?? -1;
const BOULDER_HALF_X = Math.max(Math.abs(BOULDER.boundingBox?.min.x ?? 1), Math.abs(BOULDER.boundingBox?.max.x ?? 1));
const BOULDER_HALF_Y = Math.max(Math.abs(BOULDER.boundingBox?.min.y ?? 1), Math.abs(BOULDER.boundingBox?.max.y ?? 1));
const SHARD = new IcosahedronGeometry(1, 0);

/** Centre height that rests a Y-scaled boulder on the ground after a roll of `roll` about Z. */
function rolledCentre(scaleX: number, scaleY: number, roll: number): number {
  return Math.abs(Math.sin(roll)) * BOULDER_HALF_X * scaleX + Math.abs(Math.cos(roll)) * BOULDER_HALF_Y * scaleY;
}

function addMesh(group: Group, mesh: Mesh): Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

interface BoulderSpec {
  at: { x: number; z: number };
  scale: { x: number; y: number; z: number };
  yaw: number;
  material: MeshStandardMaterial;
}

function addBoulder(group: Group, spec: BoulderSpec): void {
  const mesh = new Mesh(BOULDER, spec.material);
  mesh.scale.set(spec.scale.x, spec.scale.y, spec.scale.z);
  mesh.rotation.y = spec.yaw;
  mesh.position.set(spec.at.x, -BOULDER_MIN_Y * spec.scale.y, spec.at.z);
  addMesh(group, mesh);
}

export const rockOutcrop: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-rock-outcrop',
  name: 'Rock Outcrop',
  category: 'prop',
  dimensions: { x: 4.0, y: 2.2, z: 4.6 },
  collider: { center: { x: 0, y: 0.85, z: 0 }, size: { x: 3.2, y: 1.7, z: 2.9 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    const group = new Group();

    // No ground pad. Owner review removed the old 3.9 x 3.4 m scree slab: the asset is placed on
    // existing terrain, so a flush box under the boulders only read as a base plate and fought
    // the ground plane. The boulders seat themselves on y = 0 and the terrain does the rest.

    addBoulder(group, {
      at: { x: -0.75, z: -0.4 },
      scale: { x: 1.05, y: 1.15, z: 0.95 },
      yaw: 0.4,
      material: rockMaterial,
    });
    addBoulder(group, {
      at: { x: 0.62, z: 0.5 },
      scale: { x: 0.9, y: 0.78, z: 1.05 },
      yaw: 1.5,
      material: rockDarkMaterial,
    });
    if (variant !== 1) {
      addBoulder(group, {
        at: { x: 0.95, z: -0.95 },
        scale: { x: 0.72, y: 0.62, z: 0.68 },
        yaw: 2.4,
        material: rockShadeMaterial,
      });
    }
    addBoulder(group, {
      at: { x: -1.35, z: 0.85 },
      scale: { x: 0.5, y: 0.4, z: 0.55 },
      yaw: 0.9,
      material: rockShadeMaterial,
    });

    const slab = new Mesh(SHARD, rockMaterial);
    slab.scale.set(1.34, 0.36, 0.72);
    slab.rotation.y = 0.55;
    slab.position.set(-0.1, 0.34, 1.24);
    addMesh(group, slab);

    for (const m of [
      { at: { x: -0.88, y: 1.98, z: -0.3 }, s: { x: 0.34, y: 0.09, z: 0.28 }, yaw: 0.4 },
      { at: { x: 0.7, y: 1.22, z: 0.6 }, s: { x: 0.24, y: 0.08, z: 0.2 }, yaw: -0.5 },
      { at: { x: -0.34, y: 1.62, z: 0.42 }, s: { x: 0.19, y: 0.08, z: 0.16 }, yaw: 0.9 },
    ]) {
      const patch = new Mesh(SHARD, lichenMaterial);
      patch.scale.set(m.s.x, m.s.y, m.s.z);
      patch.rotation.y = m.yaw;
      patch.position.set(m.at.x, m.at.y, m.at.z);
      addMesh(group, patch);
    }

    for (const [i, spec] of [
      { at: { x: 1.5, z: 0.9 }, s: 0.22, yaw: 0.2 },
      { at: { x: -1.75, z: -0.9 }, s: 0.18, yaw: 1.1 },
      { at: { x: 0.15, z: -1.5 }, s: 0.26, yaw: 2.2 },
    ].entries()) {
      const stone = new Mesh(BOULDER, i % 2 === 0 ? rockShadeMaterial : rockDarkMaterial);
      stone.scale.set(spec.s, spec.s * 0.7, spec.s * 0.9);
      stone.rotation.y = spec.yaw;
      stone.position.set(spec.at.x, -BOULDER_MIN_Y * spec.s * 0.7, spec.at.z);
      addMesh(group, stone);
    }

    if (variant === 2) {
      const toppled = new Mesh(BOULDER, rockDarkMaterial);
      const scale = { x: 0.95, y: 0.5, z: 0.8 };
      toppled.scale.set(scale.x, scale.y, scale.z);
      toppled.rotation.set(0, 0.3, 1.15);
      toppled.position.set(-1.2, rolledCentre(scale.x, scale.y, 1.15), -1.35);
      addMesh(group, toppled);
    }

    group.userData.assetId = 'candidate-rock-outcrop';
    return group;
  },
};
