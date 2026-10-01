import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const tankMaterial = new MeshStandardMaterial({ color: '#9a9280', roughness: 0.95, flatShading: true });
tankMaterial.name = 'reservoir-tank';
const tankBandMaterial = new MeshStandardMaterial({ color: '#837f72', roughness: 1, flatShading: true });
tankBandMaterial.name = 'reservoir-band';
const plinthMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
plinthMaterial.name = 'reservoir-plinth';
const metalMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 0.85, metalness: 0.3 });
metalMaterial.name = 'reservoir-metal';
const pipeMaterial = new MeshStandardMaterial({ color: '#59635b', roughness: 0.9, metalness: 0.25 });
pipeMaterial.name = 'reservoir-pipe';
const rustMaterial = new MeshStandardMaterial({ color: '#9b624d', roughness: 1, metalness: 0.15 });
rustMaterial.name = 'reservoir-rust';
const darkMaterial = new MeshStandardMaterial({ color: '#292f2b', roughness: 0.9, metalness: 0.2 });
darkMaterial.name = 'reservoir-dark';
const signalMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.8 });
signalMaterial.name = 'reservoir-signal';

const Y_AXIS = new Vector3(0, 1, 0);
const TANK_R = 1.9;
const TANK_H = 3.4;
const TANK_Y = 0.34;
const SIDES = 14;
/** Flat face of an N-gon sits at radius * cos(pi/N) from the axis. */
const COS_FACET = Math.cos(Math.PI / SIDES);

function addMesh(group: Group, mesh: Mesh): Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
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

function addCylinder(
  group: Group,
  radius: number,
  height: number,
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
  segments: number,
  rot: { x?: number; y?: number; z?: number } = {},
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(at.x, at.y, at.z);
  if (rot.x) mesh.rotation.x = rot.x;
  if (rot.y) mesh.rotation.y = rot.y;
  if (rot.z) mesh.rotation.z = rot.z;
  return addMesh(group, mesh);
}

function spanTo(
  group: Group,
  from: Vector3,
  to: Vector3,
  radius: number,
  material: MeshStandardMaterial,
  segments = 5,
): Mesh {
  const dir = to.clone().sub(from);
  const length = dir.length();
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  return addMesh(group, mesh);
}

export const waterReservoir: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-water-reservoir',
  name: 'Ground-Level Water Reservoir',
  category: 'prop',
  dimensions: { x: 4.5, y: 4.8, z: 5.0 },
  collider: { center: { x: 0, y: 2.0, z: 0 }, size: { x: 3.4, y: 4.0, z: 3.4 } },
  interactionPoints: [
    { id: 'reservoir-valve', label: 'Reservoir Outlet Valve', position: { x: 0, y: 0, z: 2.3 } },
  ],
  createVisual(variant = 0) {
    const group = new Group();

    addCylinder(group, TANK_R + 0.36, 0.34, { x: 0, y: 0.17, z: 0 }, plinthMaterial, SIDES);
    addCylinder(group, TANK_R, TANK_H, { x: 0, y: TANK_Y + TANK_H / 2, z: 0 }, tankMaterial, SIDES);
    for (const y of [0.9, 2.0, 3.1]) {
      addCylinder(group, TANK_R + 0.07, 0.14, { x: 0, y, z: 0 }, tankBandMaterial, SIDES);
    }
    const shoulder = new Mesh(
      new CylinderGeometry(TANK_R * 0.66, TANK_R, 0.4, SIDES, 1),
      tankMaterial,
    );
    shoulder.position.y = TANK_Y + TANK_H + 0.2;
    addMesh(group, shoulder);
    addCylinder(group, TANK_R * 0.68, 0.16, { x: 0, y: TANK_Y + TANK_H + 0.48, z: 0 }, tankBandMaterial, SIDES);
    addCylinder(group, 0.26, 0.3, { x: 0, y: TANK_Y + TANK_H + 0.8, z: 0 }, metalMaterial, 8);
    addCylinder(group, 0.3, 0.06, { x: 0, y: TANK_Y + TANK_H + 0.98, z: 0 }, rustMaterial, 8);

    const LADDER_X = 1.0;
    const ladderZ = TANK_R + 0.24;
    for (const x of [LADDER_X - 0.28, LADDER_X + 0.28]) {
      spanTo(group, new Vector3(x, TANK_Y, ladderZ), new Vector3(x, TANK_Y + TANK_H + 0.5, ladderZ), 0.04, metalMaterial);
    }
    for (let y = 0.6; y < TANK_Y + TANK_H + 0.3; y += 0.36) {
      spanTo(
        group,
        new Vector3(LADDER_X - 0.28, y, ladderZ),
        new Vector3(LADDER_X + 0.28, y, ladderZ),
        0.028,
        metalMaterial,
        4,
      );
    }

    addCylinder(group, 0.16, 0.6, { x: -0.85, y: 0.9, z: TANK_R + 0.2 }, pipeMaterial, 8, { x: Math.PI / 2 });
    addBox(group, { x: 0.26, y: 0.26, z: 0.26 }, { x: -0.85, y: 0.9, z: TANK_R + 0.44 }, rustMaterial);
    addCylinder(
      group,
      0.05,
      0.34,
      { x: -0.69, y: 0.9, z: TANK_R + 0.6 },
      signalMaterial,
      6,
      { x: Math.PI / 2 },
    );
    spanTo(group, new Vector3(-0.85, 0.62, TANK_R + 0.5), new Vector3(-0.85, 0.2, TANK_R + 0.62), 0.07, pipeMaterial, 6);

    if (variant !== 1) {
      addCylinder(group, 0.07, 0.3, { x: 0, y: 1.2, z: TANK_R * COS_FACET - 0.1 }, metalMaterial, 6);
      addCylinder(
        group,
        0.19,
        0.09,
        { x: 0, y: 1.46, z: TANK_R * COS_FACET - 0.02 },
        darkMaterial,
        10,
        { x: 0 },
      );
      addCylinder(
        group,
        0.21,
        0.05,
        { x: 0, y: 1.44, z: TANK_R * COS_FACET - 0.05 },
        signalMaterial,
        10,
        { x: 0 },
      );
    }

    if (variant === 0) {
      const hoop = new Mesh(new TorusGeometry(TANK_R + 0.16, 0.05, 4, SIDES * 2), metalMaterial);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = 2.45;
      addMesh(group, hoop);
    }
    if (variant === 2) {
      const patch = addBox(group, { x: 0.7, y: 0.6, z: 0.1 }, { x: -1.15, y: 1.5, z: 1.5 }, rustMaterial, 0.5);
      patch.rotation.x = -0.3;
      addBox(group, { x: 0.5, y: 0.5, z: 0.12 }, { x: 1.4, y: 0.25, z: 1.4 }, darkMaterial, 0.3);
    }

    group.userData.assetId = 'candidate-water-reservoir';
    return group;
  },
};
