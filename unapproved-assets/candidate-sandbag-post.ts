import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const sandMaterial = new MeshStandardMaterial({ color: '#7d7358', roughness: 1, flatShading: true });
sandMaterial.name = 'sandbag-sand';
const sandShadeMaterial = new MeshStandardMaterial({ color: '#6b6449', roughness: 1, flatShading: true });
sandShadeMaterial.name = 'sandbag-sand-shade';
const timberMaterial = new MeshStandardMaterial({ color: '#594332', roughness: 1 });
timberMaterial.name = 'sandbag-timber';
const metalMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 0.85, metalness: 0.3 });
metalMaterial.name = 'sandbag-metal';
const boxMaterial = new MeshStandardMaterial({ color: '#58624d', roughness: 0.9, metalness: 0.15, flatShading: true });
boxMaterial.name = 'sandbag-crate';
const darkMaterial = new MeshStandardMaterial({ color: '#292f2b', roughness: 0.9, metalness: 0.25 });
darkMaterial.name = 'sandbag-dark';
const signalMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.8 });
signalMaterial.name = 'sandbag-signal';

const Y_AXIS = new Vector3(0, 1, 0);
const ROW_Y = [0.105, 0.305, 0.505, 0.705];
const ROW_W = [3.6, 3.3, 3.0, 2.7];
const ROW_GAP = 0.6;

function addMesh(group: Group, mesh: Mesh): Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/**
 * One sandbag: a low-sided cylinder lying along the wall, flattened and given a
 * deterministic per-bag size and skew so a course does not read as a row of bricks.
 */
function addBag(
  group: Group,
  index: number,
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
): void {
  const wobble = ((index * 37) % 11) / 11;
  const radius = 0.17 + wobble * 0.012;
  const bag = new Mesh(new CylinderGeometry(radius, radius * 0.9, ROW_GAP, 6), material);
  bag.scale.x = 0.6;
  bag.rotation.set(0, 0, Math.PI / 2);
  bag.rotation.y = (wobble - 0.5) * 0.24;
  bag.position.set(at.x, at.y, at.z + (wobble - 0.5) * 0.06);
  addMesh(group, bag);
}

function addBox(
  group: Group,
  size: { x: number; y: number; z: number },
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
  rotY = 0,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(at.x, at.y, at.z);
  if (rotY !== 0) mesh.rotation.y = rotY;
  return addMesh(group, mesh);
}

function spanTo(
  group: Group,
  from: Vector3,
  to: Vector3,
  radius: number,
  material: MeshStandardMaterial,
  segments = 6,
): Mesh {
  const dir = to.clone().sub(from);
  const length = dir.length();
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  return addMesh(group, mesh);
}

export const sandbagPost: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-sandbag-post',
  name: 'Sandbag Emplacement',
  category: 'prop',
  dimensions: { x: 4.4, y: 1.1, z: 2.3 },
  collider: { center: { x: 0, y: 0.42, z: 0 }, size: { x: 3.6, y: 0.84, z: 0.34 } },
  interactionPoints: [{ id: 'sandbag-supply', label: 'Sandbag Supply Crate', position: { x: -1.9, y: 0, z: 1.1 } }],
  createVisual(variant = 0) {
    const group = new Group();

    for (let row = 0; row < ROW_Y.length; row += 1) {
      const y = ROW_Y[row] ?? 0;
      const width = ROW_W[row] ?? 3;
      if (variant === 2 && row === 3) continue;
      const count = Math.round(width / ROW_GAP);
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        addBag(
          group,
          row * 7 + i,
          { x: -width / 2 + t * width, y, z: 0 },
          (i + row) % 2 === 0 ? sandMaterial : sandShadeMaterial,
        );
      }
    }

    if (variant === 1) {
      addBag(group, 21, { x: 0.7, y: 0.725, z: 0.06 }, sandShadeMaterial);
      addBag(group, 22, { x: 1.3, y: 0.695, z: 0.34 }, sandMaterial);
    }
    if (variant === 2) {
      addBag(group, 23, { x: 1.1, y: 0.11, z: 0.62 }, sandMaterial);
      addBag(group, 24, { x: 1.58, y: 0.11, z: 0.38 }, sandShadeMaterial);
      for (const x of [0.2, 0.9, 1.6]) {
        addBox(group, { x: 0.1, y: 0.5, z: 0.1 }, { x, y: 0.25, z: -0.7 }, timberMaterial, 0.1);
      }
    }

    addBox(group, { x: 2.2, y: 0.06, z: 0.42 }, { x: -0.3, y: 0.84, z: 0.56 }, timberMaterial, 0.04);
    spanTo(group, new Vector3(-1.3, 0.82, 0.56), new Vector3(-1.34, 0.04, 0.9), 0.05, timberMaterial, 5);
    spanTo(group, new Vector3(0.7, 0.82, 0.56), new Vector3(0.74, 0.04, 0.9), 0.05, timberMaterial, 5);

    addBox(group, { x: 0.66, y: 0.4, z: 0.44 }, { x: -1.9, y: 0.2, z: 0.95 }, boxMaterial);
    addBox(group, { x: 0.7, y: 0.06, z: 0.48 }, { x: -1.9, y: 0.43, z: 0.95 }, metalMaterial);
    addBox(group, { x: 0.22, y: 0.1, z: 0.03 }, { x: -1.9, y: 0.26, z: 1.18 }, signalMaterial);
    addBox(group, { x: 0.14, y: 0.14, z: 0.1 }, { x: -1.66, y: 0.44, z: 0.95 }, darkMaterial);

    for (let i = 0; i < 4; i += 1) {
      const band = addBox(
        group,
        { x: 0.12, y: 0.32, z: 0.02 },
        { x: -1.45 + i * 0.2, y: 0.72, z: 0.3 },
        darkMaterial,
      );
      band.rotation.x = -0.5;
    }

    group.userData.assetId = 'candidate-sandbag-post';
    return group;
  },
};
