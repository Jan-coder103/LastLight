import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Reusable shipping container stack. A 6.06 x 2.59 x 2.44 m container is the real 20 ft unit, so
// the module builds one container as a function of a hue and a state, then stacks a small
// deterministic arrangement. Local +Z is the long-axis "door" end for the ground container.
// Corrugation is suggested by a few proud ribs rather than modelled, which keeps a stack cheap
// enough to repeat across a yard.

interface ContainerSkin {
  material: MeshStandardMaterial;
  ribCount: number;
  doorEnd: boolean;
}

const frameMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
frameMaterial.name = 'container-frame';

const doorMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.3,
  flatShading: true,
});
doorMaterial.name = 'container-door';

const rustMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.95,
  metalness: 0.1,
  flatShading: true,
});
rustMaterial.name = 'container-rust';

const padMaterial = new MeshStandardMaterial({
  color: '#4b4035',
  roughness: 1,
  flatShading: true,
});
padMaterial.name = 'container-pad';

function paint(name: string, color: string): MeshStandardMaterial {
  const m = new MeshStandardMaterial({
    color,
    roughness: 0.9,
    metalness: 0.15,
    flatShading: true,
  });
  m.name = name;
  return m;
}

// Four restrained skins in the project range: faded green, faded blue-grey, oxide red, dust.
const SKINS: ContainerSkin[] = [
  { material: paint('container-green', '#3f5b48'), ribCount: 7, doorEnd: true },
  { material: paint('container-blue', '#4d5c63'), ribCount: 7, doorEnd: true },
  { material: paint('container-red', '#7c5347'), ribCount: 5, doorEnd: false },
  { material: paint('container-dust', '#7d7358'), ribCount: 6, doorEnd: true },
];

const L = 6.06;
const W = 2.44;
const H = 2.59;

interface Slot {
  x: number;
  z: number;
  y: number;
  yaw: number;
  skin: number;
  crushed: boolean;
}

// Deterministic yard arrangement: a two-high block, a single offset unit, and one rotated unit
// parked clear of the stack. Variant 1 drops the second tier, variant 2 replaces the rotated unit
// with the crushed one on the ground. The rotated unit sits behind-left at a -0.5 yaw, the
// opposite skew from the blue unit; the first draft yawed it +0.42 at (-3.6, 0.2), which buried
// its nose inside the green unit, and nudging that arrangement outward still grazed the stack.
const STACKS: Slot[][] = [
  [
    { x: 0, z: 0, y: 0, yaw: 0, skin: 0, crushed: false },
    { x: 0, z: 0, y: H, yaw: 0, skin: 2, crushed: false },
    { x: 0.1, z: 3.4, y: 0, yaw: 0.04, skin: 1, crushed: false },
    { x: -4.6, z: -2.6, y: 0, yaw: -0.5, skin: 3, crushed: false },
  ],
  [
    { x: 0, z: 0, y: 0, yaw: 0, skin: 0, crushed: false },
    { x: 0.1, z: 3.4, y: 0, yaw: 0.04, skin: 1, crushed: false },
    { x: -4.6, z: -2.6, y: 0, yaw: -0.5, skin: 3, crushed: false },
  ],
  [
    { x: 0, z: 0, y: 0, yaw: 0, skin: 0, crushed: false },
    { x: 0, z: 0, y: H, yaw: 0, skin: 2, crushed: false },
    { x: 0.1, z: 3.4, y: 0, yaw: 0.04, skin: 1, crushed: false },
    { x: -4.6, z: -2.6, y: 0, yaw: -0.5, skin: 3, crushed: true },
  ],
];

function addContainer(group: Group, slot: Slot): void {
  const skin = SKINS[slot.skin];
  const unit = new Group();
  unit.position.set(slot.x, slot.y, slot.z);
  unit.rotation.y = slot.yaw;

  const height = slot.crushed ? H * 0.78 : H;
  const body = new Mesh(new BoxGeometry(L, height, W), skin.material);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  unit.add(body);

  // Corrugation: proud vertical ribs on both long sides. Count varies per skin so the stack does
  // not look stamped from one mesh.
  const ribStep = L / (skin.ribCount + 1);
  for (let i = 1; i <= skin.ribCount; i++) {
    for (const sz of [-1, 1]) {
      const rib = new Mesh(new BoxGeometry(0.12, height - 0.3, 0.06), skin.material);
      rib.position.set(-L / 2 + i * ribStep, height / 2, (sz * W) / 2);
      unit.add(rib);
    }
  }

  // Corner castings and top/bottom rails: four short blocks and two rails, which is what gives a
  // container its hard box-with-a-frame read at distance.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      for (const sy of [0, 1]) {
        const casting = new Mesh(new BoxGeometry(0.34, 0.28, 0.3), frameMaterial);
        casting.position.set((sx * L) / 2, sy ? height - 0.14 : 0.14, (sz * W) / 2);
        casting.castShadow = true;
        unit.add(casting);
      }
    }
  }
  for (const sy of [0, 1]) {
    for (const sz of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(L - 0.4, 0.16, 0.12), frameMaterial);
      rail.position.set(0, sy ? height - 0.08 : 0.08, (sz * W) / 2);
      unit.add(rail);
    }
  }

  // Door end: two leaves, four locking bars, and a hinge stack. Skins without a door end (the
  // stacked red unit) get a plain blank end instead, which is what a used container's far end is.
  const endX = L / 2;
  if (skin.doorEnd) {
    for (const sz of [-1, 1]) {
      const leaf = new Mesh(new BoxGeometry(0.08, height - 0.24, W / 2 - 0.08), doorMaterial);
      leaf.position.set(endX + 0.04, height / 2, (sz * W) / 4);
      leaf.castShadow = true;
      unit.add(leaf);
      for (const o of [-0.22, 0.22]) {
        const bar = new Mesh(new CylinderGeometry(0.05, 0.05, height - 0.5, 5), frameMaterial);
        bar.position.set(endX + 0.1, height / 2, (sz * W) / 4 + o);
        unit.add(bar);
      }
    }
    const hinge = new Mesh(new BoxGeometry(0.1, 0.5, 0.12), frameMaterial);
    hinge.position.set(endX + 0.08, height - 0.45, -W / 2 + 0.1);
    unit.add(hinge);
  } else {
    const blank = new Mesh(new BoxGeometry(0.08, height - 0.24, W - 0.2), frameMaterial);
    blank.position.set(endX + 0.04, height / 2, 0);
    unit.add(blank);
  }

  if (slot.crushed) {
    // A crushed unit: the top end is pushed in, a torn panel leans against the side, and a dark
    // water stain runs down the near face. Damage is a read, not a simulation.
    const dent = new Mesh(new BoxGeometry(1.6, 0.3, W - 0.3), frameMaterial);
    dent.position.set(1.2, height - 0.1, 0);
    dent.rotation.z = -0.14;
    unit.add(dent);
    const panel = new Mesh(new BoxGeometry(1.9, 1.5, 0.07), skin.material);
    panel.position.set(0.6, height * 0.5, W / 2 + 0.28);
    panel.rotation.set(0.0, 0.1, 0.24);
    panel.castShadow = true;
    unit.add(panel);
    const stain = new Mesh(new BoxGeometry(1.2, height * 0.7, 0.05), rustMaterial);
    stain.position.set(-1.6, height * 0.42, W / 2 + 0.04);
    unit.add(stain);
  }

  group.add(unit);
}

export const candidateCargoContainers: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-cargo-containers',
  name: 'Cargo Container Stack',
  category: 'prop',
  dimensions: { x: 11.5, y: 5.2, z: 10.3 },
  collider: { center: { x: -2.4, y: 2.6, z: -0.2 }, size: { x: 11.5, y: 5.2, z: 10.3 } },
  interactionPoints: [
    { id: 'containers-door', label: 'Container Doors', position: { x: 3.6, y: 0, z: 0.6 } },
  ],
  createVisual(variant = 0) {
    const yard = new Group();
    const stack = STACKS[variant] ?? STACKS[0];

    for (const slot of stack) {
      addContainer(yard, slot);
    }

    // Corner pads under the standing units, so a container is not floating a few centimetres over
    // the ground plane. They read as yard blocks and are worth four meshes.
    for (const slot of stack) {
      if (slot.y > 0.01) continue;
      const cos = Math.cos(slot.yaw);
      const sin = Math.sin(slot.yaw);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const lx = (sx * (L / 2 - 0.2));
          const lz = sz * (W / 2 - 0.2);
          const pad = new Mesh(new BoxGeometry(0.5, 0.14, 0.44), padMaterial);
          pad.position.set(slot.x + lx * cos - lz * sin, 0.07, slot.z + lx * sin + lz * cos);
          pad.rotation.y = slot.yaw;
          pad.receiveShadow = true;
          yard.add(pad);
        }
      }
    }

    yard.userData.assetId = 'candidate-cargo-containers';
    return yard;
  },
};
