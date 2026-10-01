import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const beamMaterial = new MeshStandardMaterial({ color: '#64675d', roughness: 0.85, metalness: 0.25 });
beamMaterial.name = 'guardrail-beam';
const postMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 0.9, metalness: 0.3 });
postMaterial.name = 'guardrail-post';
const rustMaterial = new MeshStandardMaterial({ color: '#9b624d', roughness: 1, metalness: 0.15 });
rustMaterial.name = 'guardrail-rust';
const darkMaterial = new MeshStandardMaterial({ color: '#292f2b', roughness: 0.9, metalness: 0.2 });
darkMaterial.name = 'guardrail-dark';
const reflectorMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.7 });
reflectorMaterial.name = 'guardrail-reflector';
const groundMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
groundMaterial.name = 'guardrail-ground';

const Y_AXIS = new Vector3(0, 1, 0);
const BEAM_Y = 0.66;
const POST_PITCH = 1.6;
const POSTS = [-1.6, 0, 1.6];

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
  rot: { x?: number; y?: number; z?: number } = {},
): Mesh {
  const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), material);
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
  segments = 6,
): Mesh {
  const dir = to.clone().sub(from);
  const length = dir.length();
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  return addMesh(group, mesh);
}

/** One 1.6 m W-beam bay: a web plus the two rolled lips that give the rail its profile. */
function addBay(group: Group, centreX: number, material: MeshStandardMaterial, drop = 0): void {
  addBox(group, { x: POST_PITCH + 0.04, y: 0.16, z: 0.05 }, { x: centreX, y: BEAM_Y + 0.09 - drop, z: 0.03 }, material);
  addBox(group, { x: POST_PITCH + 0.04, y: 0.16, z: 0.05 }, { x: centreX, y: BEAM_Y - 0.09 - drop, z: 0.03 }, material);
  addBox(
    group,
    { x: POST_PITCH + 0.04, y: 0.04, z: 0.11 },
    { x: centreX, y: BEAM_Y + 0.19 - drop, z: 0.05 },
    material,
  );
  addBox(
    group,
    { x: POST_PITCH + 0.04, y: 0.04, z: 0.11 },
    { x: centreX, y: BEAM_Y - 0.19 - drop, z: 0.05 },
    material,
  );
}

export const guardrail: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-guardrail',
  name: 'Road Guardrail Run',
  category: 'prop',
  dimensions: { x: 5.9, y: 1.0, z: 1.2 },
  collider: { center: { x: 0, y: 0.48, z: 0 }, size: { x: 4.6, y: 0.96, z: 0.36 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    const group = new Group();

    const verge = new Mesh(new BoxGeometry(4.9, 0.1, 0.7), groundMaterial);
    verge.position.y = 0.05;
    addMesh(group, verge);

    for (const x of POSTS) {
      if (variant === 2 && x === 0) continue;
      addBox(group, { x: 0.09, y: 0.86, z: 0.16 }, { x, y: 0.53, z: -0.02 }, postMaterial);
      addBox(group, { x: 0.16, y: 0.86, z: 0.05 }, { x, y: 0.53, z: -0.02 }, postMaterial);
    }

    if (variant === 2) {
      addBay(group, -0.8, beamMaterial);
      addBay(group, 0.8, rustMaterial);
    } else {
      addBay(group, -0.8, beamMaterial);
      addBay(group, 0.8, beamMaterial);
    }

    if (variant === 0) {
      addBay(group, 2.4, beamMaterial, 0.06);
      const terminal = addBox(
        group,
        { x: 0.5, y: 0.16, z: 0.06 },
        { x: 3.16, y: 0.34, z: 0.03 },
        rustMaterial,
      );
      terminal.rotation.z = -0.85;
    } else if (variant === 1) {
      const torn = addBox(
        group,
        { x: 0.9, y: 0.16, z: 0.05 },
        { x: 2.55, y: 0.5, z: 0.03 },
        rustMaterial,
      );
      torn.rotation.z = 0.95;
      torn.rotation.y = 0.2;
      addBox(group, { x: 0.7, y: 0.14, z: 0.05 }, { x: 2.0, y: 0.14, z: 0.5 }, rustMaterial, { y: 0.6, z: 0.2 });
      addBox(group, { x: 0.3, y: 0.05, z: 0.16 }, { x: 2.9, y: 0.1, z: 0.34 }, darkMaterial, { y: 1.1 });
    } else {
      addBox(group, { x: 0.6, y: 0.14, z: 0.05 }, { x: 2.5, y: 0.42, z: 0.03 }, rustMaterial, { z: -0.6 });
      addBox(group, { x: 0.22, y: 0.2, z: 0.18 }, { x: 0, y: 0.24, z: 0.16 }, darkMaterial, { z: 0.3 });
    }

    for (const x of variant === 2 ? [-1.6, 1.6] : POSTS) {
      const ref = addBox(group, { x: 0.12, y: 0.16, z: 0.04 }, { x, y: BEAM_Y + 0.02, z: 0.09 }, reflectorMaterial);
      ref.rotation.x = 0.25;
    }
    for (const [x, z, yaw] of [
      [-2.3, 0.3, 0.5],
      [0.6, 0.32, 1.2],
      [1.9, -0.26, 2.1],
    ] as const) {
      addBox(group, { x: 0.32, y: 0.1, z: 0.2 }, { x, y: 0.07, z }, rustMaterial, { y: yaw, z: 0.1 });
    }
    spanTo(group, new Vector3(1.6, 0.2, -0.1), new Vector3(2.0, 0.12, 0.5), 0.03, darkMaterial, 4);

    group.userData.assetId = 'candidate-guardrail';
    return group;
  },
};
