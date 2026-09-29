import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  DoubleSide,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset.
const drumMaterials = [
  new MeshStandardMaterial({ color: '#8e5142', roughness: 0.95, flatShading: true }),
  new MeshStandardMaterial({ color: '#687454', roughness: 0.95, flatShading: true }),
  new MeshStandardMaterial({ color: '#5c6a66', roughness: 0.95, flatShading: true }),
];
drumMaterials[0]!.name = 'drum-rust-red';
drumMaterials[1]!.name = 'drum-olive';
drumMaterials[2]!.name = 'drum-dusty-teal';

const sootMaterial = new MeshStandardMaterial({
  color: '#2b2b28',
  roughness: 1,
  side: DoubleSide,
});
sootMaterial.name = 'soot';

// Sooted inner wall. The shell is an open cylinder, so without this the player sees
// straight through the drum to the far side from certain angles.
const drumLinerMaterial = new MeshStandardMaterial({
  color: '#37332e',
  roughness: 1,
  side: DoubleSide,
  flatShading: true,
});
drumLinerMaterial.name = 'drum-liner';

const charMaterial = new MeshStandardMaterial({
  color: '#514437',
  roughness: 1,
  flatShading: true,
});
charMaterial.name = 'charred-timber';

const emberMaterial = new MeshStandardMaterial({
  color: '#c25a24',
  roughness: 0.85,
  emissive: '#6b2a0e',
  emissiveIntensity: 0.75,
  flatShading: true,
});
emberMaterial.name = 'ember';

// Static flame stand-in. The authored-asset contract returns a plain Group and the world
// builder clones it without a per-frame update, so flame and smoke motion has to be driven
// by the runtime. See fire-bin.md.
const flameMaterial = new MeshStandardMaterial({
  color: '#d9a24e',
  roughness: 0.7,
  emissive: '#8a4a14',
  emissiveIntensity: 0.85,
  flatShading: true,
});
flameMaterial.name = 'flame';

const metalMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.86,
  metalness: 0.22,
});
metalMaterial.name = 'metal';

export const fireBin: AuthoredAsset = {
  schemaVersion: 1,
  id: 'fire-bin',
  name: 'Fire Bin',
  category: 'prop',
  dimensions: { x: 0.82, y: 1.18, z: 0.64 },
  collider: { center: { x: 0, y: 0.47, z: 0 }, size: { x: 0.62, y: 0.94, z: 0.62 } },
  interactionPoints: [{ id: 'fire-pit', label: 'Fire', position: { x: 0, y: 0, z: 0.78 } }],
  createVisual(variant = 0) {
    const bin = new Group();
    const drum = drumMaterials[variant % drumMaterials.length]!;
    const bigFire = variant === 2;

    // Cut-top oil drum: open cylinder, so the char bed and flame stay visible from above.
    const shell = new Mesh(new CylinderGeometry(0.3, 0.29, 0.86, 12, 1, true), drum);
    shell.position.y = 0.45;
    shell.castShadow = true;
    bin.add(shell);
    const base = new Mesh(new CylinderGeometry(0.29, 0.29, 0.05, 12), drum);
    base.position.y = 0.04;
    base.castShadow = true;
    bin.add(base);
    for (const y of [0.28, 0.66]) {
      const rib = new Mesh(new CylinderGeometry(0.315, 0.315, 0.06, 12, 1, true), drum);
      rib.position.y = y;
      bin.add(rib);
    }
    const rim = new Mesh(new CylinderGeometry(0.305, 0.305, 0.06, 12, 1, true), metalMaterial);
    rim.position.y = 0.87;
    bin.add(rim);

    // Inner wall, so the drum is closed from every angle and reads as a fire-blackened
    // vessel rather than a paper shell. Slightly inset so the outer paint stays visible.
    const liner = new Mesh(
      new CylinderGeometry(0.275, 0.268, 0.84, 12, 1, true),
      drumLinerMaterial,
    );
    liner.position.y = 0.45;
    bin.add(liner);
    const linerFloor = new Mesh(new CylinderGeometry(0.27, 0.27, 0.05, 12), drumLinerMaterial);
    linerFloor.position.y = 0.08;
    bin.add(linerFloor);

    const ashBed = new Mesh(new CylinderGeometry(0.27, 0.26, 0.06, 12), sootMaterial);
    ashBed.position.y = 0.58;
    bin.add(ashBed);

    // Crossed fuel: two charred timbers with a lighter stick leaning on the rim.
    const logA = new Mesh(new CylinderGeometry(0.06, 0.07, 0.52, 6), charMaterial);
    logA.position.set(0.02, 0.66, -0.03);
    logA.rotation.set(0.1, 0.5, Math.PI / 2);
    logA.castShadow = true;
    bin.add(logA);
    const logB = new Mesh(new CylinderGeometry(0.055, 0.065, 0.48, 6), charMaterial);
    logB.position.set(-0.03, 0.71, 0.04);
    logB.rotation.set(-0.14, 1.1, Math.PI / 2);
    logB.castShadow = true;
    bin.add(logB);
    const stick = new Mesh(new CylinderGeometry(0.035, 0.045, 0.86, 5), charMaterial);
    stick.position.set(0.16, 0.7, -0.12);
    stick.rotation.set(0.34, 0.2, 0.26);
    stick.castShadow = true;
    bin.add(stick);

    if (bigFire) {
      // Variant 2 has no grate, so the flame reads taller and the rim is charred instead.
      for (const [x, y, z, radius, height] of [
        [0.0, 0.78, 0.0, 0.16, 0.36],
        [0.07, 0.95, -0.04, 0.11, 0.26],
        [-0.06, 0.9, 0.06, 0.09, 0.2],
      ] as const) {
        const flame = new Mesh(new ConeGeometry(radius, height, 6), flameMaterial);
        flame.position.set(x, y, z);
        bin.add(flame);
      }
    } else {
      // Wire grate resting on the rim, with a smaller flame poking through it.
      const grateRing = new Mesh(new CylinderGeometry(0.3, 0.3, 0.04, 12, 1, true), metalMaterial);
      grateRing.position.y = 0.86;
      grateRing.rotation.z = variant === 1 ? 0.05 : 0;
      bin.add(grateRing);
      for (let index = 0; index < 3; index += 1) {
        const angle = (index / 3) * Math.PI;
        const bar = new Mesh(new BoxGeometry(0.58, 0.025, 0.03), metalMaterial);
        bar.position.y = 0.86;
        bar.rotation.y = angle + (variant === 1 ? 0.07 : 0);
        bin.add(bar);
      }
      const flame = new Mesh(new ConeGeometry(0.13, 0.28, 6), flameMaterial);
      flame.position.set(0.02, 0.82, -0.02);
      bin.add(flame);
      const emberTip = new Mesh(new ConeGeometry(0.07, 0.16, 5), flameMaterial);
      emberTip.position.set(-0.05, 0.88, 0.05);
      bin.add(emberTip);
    }

    // Exposed coals on the ash bed.
    for (const [x, y, z] of [
      [0.12, 0.63, 0.08],
      [-0.14, 0.62, -0.06],
      [0.04, 0.64, -0.15],
    ] as const) {
      const ember = new Mesh(new CylinderGeometry(0.05, 0.045, 0.04, 5), emberMaterial);
      ember.position.set(x, y, z);
      ember.rotation.y = (x + z) * 6;
      bin.add(ember);
    }

    // Two ash-scuffed stones leaning on the drum, breaking the perfect cylinder. They sit
    // at y just above 0 so their tilted cones do not dip through the ground plane.
    for (const [x, z, rotation] of [
      [0.28, 0.12, 0.4],
      [-0.26, -0.16, 1.9],
    ] as const) {
      const stone = new Mesh(new ConeGeometry(0.11, 0.22, 5), sootMaterial);
      stone.position.set(x, 0.15, z);
      stone.rotation.set(0.18, rotation, 0.2);
      stone.castShadow = true;
      bin.add(stone);
    }

    bin.traverse((object) => {
      if (object instanceof Mesh && object !== shell) object.castShadow = true;
    });
    bin.userData.assetId = 'fire-bin';
    return bin;
  },
};
