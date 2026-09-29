import { CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// A single pile of cut logs, designed to be PLACED SEVERAL TIMES to build a log yard. The idea
// says "several reusable piles", which is read here as: one reusable pile module, repeated by the
// world generator, rather than one model containing several piles. See the review sheet.
const logMaterials = [
  new MeshStandardMaterial({ color: '#514437', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#594332', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#4b4035', roughness: 1, flatShading: true }),
];
logMaterials[0]!.name = 'log-bark';
logMaterials[1]!.name = 'log-bark-worn';
logMaterials[2]!.name = 'log-bark-dark';

// Explicit per-log lengths and offsets. Deterministic by construction: no unseeded randomness, and
// the numbers are readable so a placement can be reasoned about. This is what produces the
// "irregular ends" the idea asks for.
const LAYOUTS: Record<number, { y: number; z: number; len: number }[]> = {
  // Neat tall stack: 4 + 3 + 2 logs, each course staggered by half a diameter.
  0: [
    { y: 0.23, z: -0.44, len: 3.7 },
    { y: 0.23, z: 0, len: 3.4 },
    { y: 0.23, z: 0.44, len: 3.8 },
    { y: 0.67, z: -0.22, len: 3.5 },
    { y: 0.67, z: 0.22, len: 3.7 },
    { y: 1.11, z: 0, len: 3.3 },
  ],
  // Wide low stack: 4 + 4, flatter and longer, with two logs off to one side.
  1: [
    { y: 0.23, z: -0.66, len: 3.9 },
    { y: 0.23, z: -0.22, len: 3.5 },
    { y: 0.23, z: 0.22, len: 3.8 },
    { y: 0.23, z: 0.66, len: 3.4 },
    { y: 0.67, z: -0.44, len: 3.6 },
    { y: 0.67, z: 0, len: 3.9 },
    { y: 0.67, z: 0.44, len: 3.5 },
  ],
  // Top course knocked off: 3 + 2, with the fallen log lying alongside on the ground.
  2: [
    { y: 0.23, z: -0.44, len: 3.8 },
    { y: 0.23, z: 0, len: 3.6 },
    { y: 0.23, z: 0.44, len: 3.3 },
    { y: 0.67, z: -0.22, len: 3.5 },
    { y: 0.67, z: 0.22, len: 3.7 },
  ],
};

const LOG_R = 0.23;

export const timberStacks: AuthoredAsset = {
  schemaVersion: 1,
  id: 'timber-stacks',
  name: 'Timber Stacks',
  category: 'prop',
  dimensions: { x: 4.0, y: 1.5, z: 2.4 },
  // The idea asks for a "practical collision footprint", and this is it: a tight box around the
  // pile, no dead space, no overhang allowance. A log pile is a solid obstacle, so unlike the
  // shelter or the rooftop tank this is a case where the box is simply correct.
  // The pile only. Variant 2's knocked-off log lies outside this box and is not solid.
  collider: { center: { x: 0, y: 0.7, z: 0 }, size: { x: 3.9, y: 1.4, z: 1.8 } },
  interactionPoints: [{ id: 'log-pile', label: 'Log Pile', position: { x: 0, y: 0, z: 1.4 } }],
  createVisual(variant = 0) {
    const pile = new Group();
    const logMaterial = logMaterials[variant % logMaterials.length]!;
    const layout = LAYOUTS[variant % 3]!;

    for (const log of layout) {
      // Six-sided and flat shaded: a log at play distance is a faceted cylinder, and this keeps a
      // 9-log pile affordable.
      const mesh = new Mesh(new CylinderGeometry(LOG_R, LOG_R, log.len, 6), logMaterial);
      // Log axis runs along X, so the cylinder's Y axis is rotated onto X.
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(0, log.y, log.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      pile.add(mesh);
    }

    // Two chocks under the bottom course, and a stray log on the ground in variant 2.
    for (const x of [-1.2, 1.2]) {
      const chock = new Mesh(new CylinderGeometry(LOG_R * 0.6, LOG_R * 0.6, 1.5, 4), logMaterial);
      chock.rotation.z = Math.PI / 2;
      chock.position.set(x, LOG_R * 0.6, -0.44);
      chock.castShadow = true;
      pile.add(chock);
    }
    if (variant === 2) {
      const fallen = new Mesh(new CylinderGeometry(LOG_R, LOG_R, 3.4, 6), logMaterial);
      fallen.rotation.set(0, 0.14, Math.PI / 2);
      fallen.position.set(0.2, LOG_R, 1.15);
      fallen.castShadow = true;
      pile.add(fallen);
    }

    pile.userData.assetId = 'candidate-timber-stacks';
    return pile;
  },
};
