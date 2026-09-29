import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const padMaterial = new MeshStandardMaterial({ color: '#a29b88', roughness: 1, flatShading: true });
padMaterial.name = 'helipad-pad';
const kerbMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 1,
  flatShading: true,
});
kerbMaterial.name = 'helipad-kerb';
const markMaterial = new MeshStandardMaterial({ color: '#b5a06b', roughness: 0.95 });
markMaterial.name = 'helipad-marking';
const markWornMaterial = new MeshStandardMaterial({ color: '#9a8f6d', roughness: 1 });
markWornMaterial.name = 'helipad-marking-worn';
const metalMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
});
metalMaterial.name = 'helipad-metal';
const fabricMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 1,
  flatShading: true,
});
fabricMaterial.name = 'helipad-fabric';
const darkMaterial = new MeshStandardMaterial({ color: '#292f2b', roughness: 0.9, metalness: 0.2 });
darkMaterial.name = 'helipad-dark';
const signalMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.75 });
signalMaterial.name = 'helipad-signal';

const PAD = 9;
const PAD_H = 0.36;

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

function addMark(
  group: Group,
  size: { x: number; z: number },
  at: { x: number; z: number },
  worn: boolean,
): void {
  addBox(
    group,
    { x: size.x, y: 0.02, z: size.z },
    { x: at.x, y: PAD_H + 0.01, z: at.z },
    worn ? markWornMaterial : markMaterial,
  );
}

export const helipad: AuthoredAsset = {
  schemaVersion: 1,
  id: 'helipad',
  name: 'Helipad',
  category: 'prop',
  dimensions: { x: 9.5, y: 3.1, z: 9.1 },
  collider: { center: { x: 0, y: 0.18, z: 0 }, size: { x: 9, y: 0.36, z: 9 } },
  interactionPoints: [
    {
      id: 'helipad-equipment',
      label: 'Helipad Equipment Box',
      position: { x: -3.3, y: 0, z: 3.5 },
    },
  ],
  createVisual(variant = 0) {
    const group = new Group();

    addBox(group, { x: PAD, y: PAD_H, z: PAD }, { x: 0, y: PAD_H / 2, z: 0 }, padMaterial);
    for (const [x, z, w, d] of [
      [0, PAD / 2 - 0.15, PAD, 0.3],
      [0, -PAD / 2 + 0.15, PAD, 0.3],
      [PAD / 2 - 0.15, 0, 0.3, PAD - 0.6],
      [-PAD / 2 + 0.15, 0, 0.3, PAD - 0.6],
    ] as const) {
      if (variant === 2 && x > 0 && z > 0) continue;
      addBox(group, { x: w, y: 0.2, z: d }, { x, y: PAD_H + 0.1, z }, kerbMaterial);
    }

    addMark(group, { x: 0.75, z: 4.4 }, { x: -1.5, z: 0 }, variant === 1);
    addMark(group, { x: 0.75, z: 4.4 }, { x: 1.5, z: 0 }, variant === 1);
    if (variant !== 1) {
      addMark(group, { x: 3.0, z: 0.75 }, { x: 0, z: 0 }, false);
    } else {
      addMark(group, { x: 1.4, z: 0.7 }, { x: -0.6, z: 0 }, true);
    }

    const ring = new Mesh(new TorusGeometry(3.3, 0.07, 4, 20), markWornMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = PAD_H + 0.01;
    addMesh(group, ring);

    const postX = 3.6;
    addCylinder(group, 0.07, 2.5, { x: postX, y: PAD_H + 1.25, z: 3.3 }, metalMaterial, 6);
    addBox(
      group,
      { x: 0.5, y: 0.05, z: 0.05 },
      { x: postX, y: PAD_H + 2.3, z: 3.3 },
      metalMaterial,
    );
    addBox(
      group,
      { x: 0.34, y: 0.34, z: 0.34 },
      { x: postX, y: PAD_H + 0.17, z: 3.3 },
      darkMaterial,
    );
    if (variant !== 1) {
      const sock = new Mesh(new ConeGeometry(0.3, 1.3, 8, 1, true), fabricMaterial);
      sock.position.set(postX + 0.62, PAD_H + 2.16, 3.3);
      sock.rotation.set(0, 0, Math.PI / 2 + 0.35);
      addMesh(group, sock);
    }

    addBox(group, { x: 0.8, y: 0.7, z: 0.5 }, { x: -3.3, y: PAD_H + 0.35, z: 3.5 }, darkMaterial);
    addBox(
      group,
      { x: 0.84, y: 0.1, z: 0.54 },
      { x: -3.3, y: PAD_H + 0.72, z: 3.5 },
      metalMaterial,
    );
    addBox(
      group,
      { x: 0.16, y: 0.16, z: 0.04 },
      { x: -3.3, y: PAD_H + 0.44, z: 3.76 },
      signalMaterial,
    );
    for (let i = 0; i < 3; i += 1) {
      const lamp = addCylinder(
        group,
        0.1,
        0.16,
        { x: -3.3 + (i - 1) * 0.26, y: PAD_H + 0.86, z: 3.5 },
        i === 0 ? signalMaterial : darkMaterial,
        6,
      );
      lamp.castShadow = true;
      group.add(lamp);
    }

    if (variant === 2) {
      const slab = addBox(
        group,
        { x: 1.3, y: 0.14, z: 0.9 },
        { x: 2.6, y: PAD_H + 0.1, z: 3.0 },
        kerbMaterial,
      );
      slab.rotation.set(0.2, 0.5, 0.14);
      addBox(
        group,
        { x: 1.0, y: 0.02, z: 0.3 },
        { x: -2.4, y: PAD_H + 0.02, z: 2.6 },
        markWornMaterial,
        0.6,
      );
    }

    group.userData.assetId = 'helipad';
    return group;
  },
};

function addCylinder(
  group: Group,
  radius: number,
  height: number,
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
  segments: number,
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(at.x, at.y, at.z);
  return addMesh(group, mesh);
}
