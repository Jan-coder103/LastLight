import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const tarpMaterial = new MeshStandardMaterial({ color: '#74765c', roughness: 1, flatShading: true });
tarpMaterial.name = 'catchment-tarp';
const timberMaterial = new MeshStandardMaterial({ color: '#514437', roughness: 1, flatShading: true });
timberMaterial.name = 'catchment-timber';
const drumMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 0.9, metalness: 0.25, flatShading: true });
drumMaterial.name = 'catchment-drum';
const rustMaterial = new MeshStandardMaterial({ color: '#9b624d', roughness: 1, metalness: 0.15 });
rustMaterial.name = 'catchment-rust';
const pipeMaterial = new MeshStandardMaterial({ color: '#59635b', roughness: 0.9, metalness: 0.25 });
pipeMaterial.name = 'catchment-pipe';
const stoneMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1, flatShading: true });
stoneMaterial.name = 'catchment-stone';
const ashMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
ashMaterial.name = 'catchment-ash';
const charMaterial = new MeshStandardMaterial({ color: '#303832', roughness: 1, flatShading: true });
charMaterial.name = 'catchment-char';
const signalMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.8 });
signalMaterial.name = 'catchment-signal';

const Y_AXIS = new Vector3(0, 1, 0);
const STONE = new IcosahedronGeometry(1, 0);
STONE.computeBoundingBox();
const STONE_MIN_Y = STONE.boundingBox?.min.y ?? -1;
const FRAME_HALF = 1.15;
const RIDGE_Y = 2.1;

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

export const rainCatchment: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-rain-catchment',
  name: 'Camp Rain Catchment',
  category: 'prop',
  dimensions: { x: 3.3, y: 2.8, z: 4.2 },
  collider: { center: { x: 0, y: 0.42, z: 0.9 }, size: { x: 1.7, y: 0.84, z: 1.7 } },
  interactionPoints: [
    { id: 'catchment-drum', label: 'Catchment Drum', position: { x: 0, y: 0, z: 1.0 } },
  ],
  createVisual(variant = 0) {
    const group = new Group();
    const torn = variant === 2;

    for (const [px, pz] of [
      [-FRAME_HALF, -FRAME_HALF],
      [FRAME_HALF, -FRAME_HALF],
      [-FRAME_HALF, FRAME_HALF],
      [FRAME_HALF, FRAME_HALF],
    ] as const) {
      addBox(group, { x: 0.11, y: RIDGE_Y, z: 0.11 }, { x: px, y: RIDGE_Y / 2, z: pz }, timberMaterial);
      addBox(group, { x: 0.24, y: 0.1, z: 0.24 }, { x: px, y: 0.05, z: pz }, timberMaterial);
    }
    for (const [ax, az, len, horizontal] of [
      [0, -FRAME_HALF, FRAME_HALF * 2, true],
      [0, FRAME_HALF, FRAME_HALF * 2, true],
      [-FRAME_HALF, 0, FRAME_HALF * 2, false],
      [FRAME_HALF, 0, FRAME_HALF * 2, false],
    ] as const) {
      addBox(
        group,
        horizontal ? { x: len, y: 0.1, z: 0.1 } : { x: 0.1, y: 0.1, z: len },
        { x: ax, y: RIDGE_Y - 0.06, z: az },
        timberMaterial,
      );
    }

    if (variant !== 1) {
      // Funnel built from four single-axis sloped plates: a rotated 4-sided cone produced
      // a stray blade, and four explicit faces are predictable and cheap.
      const edge = FRAME_HALF + 0.15;
      const rise = 0.44;
      const slant = Math.hypot(edge, rise);
      const pitch = Math.atan2(rise, edge);
      const faceZ = new Mesh(new BoxGeometry(edge * 2, 0.04, slant), tarpMaterial);
      faceZ.position.set(0, RIDGE_Y + rise / 2, edge / 2);
      faceZ.rotation.x = pitch;
      addMesh(group, faceZ);
      if (!torn) {
        const faceZBack = new Mesh(new BoxGeometry(edge * 2, 0.04, slant), tarpMaterial);
        faceZBack.position.set(0, RIDGE_Y + rise / 2, -edge / 2);
        faceZBack.rotation.x = -pitch;
        addMesh(group, faceZBack);
      }
      for (const side of [-1, 1]) {
        const faceX = new Mesh(new BoxGeometry(slant, 0.04, edge * 2), tarpMaterial);
        faceX.position.set((side * edge) / 2, RIDGE_Y + rise / 2, 0);
        faceX.rotation.z = -side * pitch;
        addMesh(group, faceX);
      }
      if (torn) {
        const flap = new Mesh(new BoxGeometry(0.66, 0.04, 0.5), tarpMaterial);
        flap.position.set(0.34, RIDGE_Y - 0.06, edge * 0.66);
        flap.rotation.set(0.5, 0.3, 0.2);
        addMesh(group, flap);
      }
      addBox(group, { x: 0.36, y: 0.1, z: 0.36 }, { x: 0, y: RIDGE_Y + rise - 0.02, z: 0 }, tarpMaterial);
    }

    const spoutY = RIDGE_Y + 0.38;
    addBox(group, { x: 0.26, y: 0.22, z: 0.26 }, { x: 0, y: spoutY, z: 0 }, rustMaterial);
    spanTo(group, new Vector3(0, spoutY - 0.1, 0), new Vector3(0, spoutY - 0.52, 0.14), 0.065, pipeMaterial, 6);
    spanTo(group, new Vector3(0, spoutY - 0.52, 0.14), new Vector3(0, spoutY - 0.54, 0.58), 0.065, pipeMaterial, 6);
    spanTo(group, new Vector3(0, spoutY - 0.54, 0.58), new Vector3(0, 1.04, 0.84), 0.065, pipeMaterial, 6);

    const drumY = 0.46;
    if (torn) {
      const drum = new Mesh(new CylinderGeometry(0.3, 0.3, 0.88, 12), drumMaterial);
      drum.position.set(0.86, 0.3, 1.5);
      drum.rotation.set(0, 0.3, Math.PI / 2);
      addMesh(group, drum);
    } else {
      addCylinder(group, 0.3, 0.88, { x: 0, y: drumY, z: 0.9 }, drumMaterial, 12);
      for (const y of [drumY - 0.24, drumY + 0.24]) {
        addCylinder(group, 0.32, 0.07, { x: 0, y, z: 0.9 }, rustMaterial, 12);
      }
      addCylinder(group, 0.31, 0.06, { x: 0, y: drumY + 0.47, z: 0.9 }, rustMaterial, 12);
      addCylinder(
        group,
        0.04,
        0.26,
        { x: 0, y: 0.34, z: 1.24 },
        signalMaterial,
        6,
        { x: Math.PI / 2 },
      );
      addBox(group, { x: 0.16, y: 0.1, z: 0.04 }, { x: 0, y: 0.6, z: 1.19 }, signalMaterial);
    }

    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const s = 0.13 + (i % 3) * 0.03;
      const stone = new Mesh(STONE, stoneMaterial);
      stone.scale.set(s, s * 0.7, s * 0.9);
      stone.rotation.y = a;
      stone.position.set(Math.cos(a) * 0.72, -STONE_MIN_Y * s * 0.7, 1.5 + Math.sin(a) * 0.72);
      addMesh(group, stone);
    }
    const ash = new Mesh(new CylinderGeometry(0.62, 0.66, 0.06, 12), ashMaterial);
    ash.position.set(0, 0.03, 1.5);
    addMesh(group, ash);
    spanTo(group, new Vector3(-0.3, 0.09, 1.35), new Vector3(0.28, 0.11, 1.62), 0.07, charMaterial, 5);
    spanTo(group, new Vector3(-0.22, 0.11, 1.64), new Vector3(0.34, 0.09, 1.38), 0.06, charMaterial, 5);

    if (variant === 0) {
      addBox(group, { x: 0.5, y: 0.04, z: 0.36 }, { x: -1.5, y: 0.03, z: -0.9 }, tarpMaterial, 0.5);
    }

    group.userData.assetId = 'candidate-rain-catchment';
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
  rot: { x?: number; z?: number } = {},
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(at.x, at.y, at.z);
  if (rot.x) mesh.rotation.x = rot.x;
  if (rot.z) mesh.rotation.z = rot.z;
  return addMesh(group, mesh);
}
