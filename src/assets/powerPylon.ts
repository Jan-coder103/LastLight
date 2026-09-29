import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { AuthoredAsset } from './assetTypes';

const timberMaterial = new MeshStandardMaterial({
  color: '#514437',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'pylon-timber';
const timberPaleMaterial = new MeshStandardMaterial({
  color: '#655744',
  roughness: 1,
  flatShading: true,
});
timberPaleMaterial.name = 'pylon-timber-pale';
const steelMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
});
steelMaterial.name = 'pylon-steel';
const insulatorMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.45,
  metalness: 0.05,
});
insulatorMaterial.name = 'pylon-insulator';
const cableMaterial = new MeshStandardMaterial({ color: '#292f2b', roughness: 0.9 });
cableMaterial.name = 'pylon-cable';
const groundMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
groundMaterial.name = 'pylon-ground';

const Y_AXIS = new Vector3(0, 1, 0);

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

/** Half-width of the pylon legs at a given height: a straight taper from 1.55 m at the base to 0.42 m at the top. */
function legHalfWidth(y: number): number {
  const t = Math.min(Math.max(y / 8.6, 0), 1);
  return 1.55 + (0.42 - 1.55) * t;
}

const BASE_X = 1.55;
const TOP_Y = 8.6;
const LEG_Z = 0.42;

function addInsulator(group: Group, at: Vector3): void {
  const stack = new Mesh(new CylinderGeometry(0.07, 0.11, 0.22, 8), insulatorMaterial);
  stack.position.copy(at);
  addMesh(group, stack);
  const cap = new Mesh(new CylinderGeometry(0.05, 0.05, 0.07, 6), steelMaterial);
  cap.position.copy(at).add(new Vector3(0, 0.14, 0));
  addMesh(group, cap);
}

export const powerPylon: AuthoredAsset = {
  schemaVersion: 1,
  id: 'power-pylon',
  name: 'Wooden Power Pylon',
  category: 'prop',
  dimensions: { x: 4.3, y: 9.6, z: 2.7 },
  collider: { center: { x: 0, y: 4.7, z: 0 }, size: { x: 1.1, y: 9.4, z: 1.1 } },
  interactionPoints: [
    { id: 'pylon-base', label: 'Pylon Junction Box', position: { x: 0.5, y: 0, z: 0.9 } },
  ],
  createVisual(variant = 0) {
    const group = new Group();

    for (const side of [-1, 1]) {
      spanTo(
        group,
        new Vector3(side * BASE_X, 0.02, LEG_Z),
        new Vector3(side * 0.42, TOP_Y, LEG_Z),
        0.16,
        timberMaterial,
        6,
      );
      spanTo(
        group,
        new Vector3(side * BASE_X, 0.02, -LEG_Z),
        new Vector3(side * 0.42, TOP_Y, -LEG_Z),
        0.16,
        timberMaterial,
        6,
      );
      addBox(
        group,
        { x: 0.62, y: 0.24, z: 1.5 },
        { x: side * BASE_X, y: 0.12, z: 0 },
        groundMaterial,
      );
    }

    const braceRows = [0.9, 2.3, 3.7, 5.1, 6.5];
    for (let i = 0; i < braceRows.length; i += 1) {
      const y = braceRows[i];
      const w = legHalfWidth(y);
      addBox(group, { x: w * 2, y: 0.12, z: 0.14 }, { x: 0, y, z: LEG_Z }, timberPaleMaterial);
      addBox(group, { x: w * 2, y: 0.12, z: 0.14 }, { x: 0, y, z: -LEG_Z }, timberPaleMaterial);
      const broken = variant === 2 && i === 2;
      if (broken) {
        spanTo(
          group,
          new Vector3(-w, y, LEG_Z),
          new Vector3(-w * 0.3, y + 0.1, -LEG_Z + 0.2),
          0.07,
          timberPaleMaterial,
          5,
        );
        continue;
      }
      const up = new Vector3(w * 0.92, y + 1.3, LEG_Z);
      const down = new Vector3(-w * 0.92, y + 1.3, LEG_Z);
      spanTo(group, new Vector3(-w, y, LEG_Z), up, 0.07, timberPaleMaterial, 5);
      spanTo(group, new Vector3(w, y, LEG_Z), down, 0.07, timberPaleMaterial, 5);
      spanTo(
        group,
        new Vector3(-w, y, -LEG_Z),
        new Vector3(w * 0.92, y + 1.3, -LEG_Z),
        0.07,
        timberPaleMaterial,
        5,
      );
      spanTo(
        group,
        new Vector3(w, y, -LEG_Z),
        new Vector3(-w * 0.92, y + 1.3, -LEG_Z),
        0.07,
        timberPaleMaterial,
        5,
      );
    }

    addBox(group, { x: 0.26, y: 0.5, z: 1.1 }, { x: 0, y: 7.0, z: 0 }, timberMaterial);
    const topArmY = 8.0;
    const topArmDrop = variant === 1 ? 0.55 : 0;
    spanTo(
      group,
      new Vector3(-1.75, topArmY - topArmDrop, 0),
      new Vector3(1.75, topArmY - topArmDrop * 0.6, 0),
      0.11,
      timberMaterial,
      6,
    );
    addBox(group, { x: 0.2, y: 0.62, z: 0.18 }, { x: 0, y: topArmY - 0.1, z: 0 }, timberMaterial);
    addBox(group, { x: 2.7, y: 0.14, z: 0.16 }, { x: 0, y: 6.15, z: 0 }, timberPaleMaterial);
    addBox(group, { x: 0.18, y: 0.5, z: 0.16 }, { x: 0, y: 6.35, z: 0 }, timberMaterial);

    for (const x of [-1.6, -0.85, 0.85, 1.6]) {
      const y = Math.abs(x) > 1.2 ? topArmY - topArmDrop * 0.9 : topArmY - topArmDrop * 0.2;
      addInsulator(group, new Vector3(x, y - 0.18, 0));
    }
    for (const x of [-1.1, 0, 1.1]) {
      addInsulator(group, new Vector3(x, 6.0, 0));
    }

    // Top mast: a stick standing on the high crossarm and rising between the leg tops to carry a
    // small work light or aerial. The old separate stick-and-spike above the legs read as a
    // floating arrow and is gone.
    addBox(group, { x: 0.12, y: 1.55, z: 0.12 }, { x: 0, y: 8.78, z: 0 }, steelMaterial);
    addBox(group, { x: 0.44, y: 0.6, z: 0.3 }, { x: 0.62, y: 0.6, z: 0.55 }, steelMaterial);
    addBox(group, { x: 0.3, y: 0.2, z: 0.04 }, { x: 0.62, y: 0.78, z: 0.71 }, insulatorMaterial);

    if (variant === 0) {
      addDanglingCable(group, new Vector3(1.6, topArmY - 0.3, 0), 4.1);
      addDanglingCable(group, new Vector3(-1.1, 5.82, 0), 2.4);
    } else if (variant === 1) {
      addDanglingCable(group, new Vector3(1.6, topArmY - topArmDrop - 0.3, 0), 5.2);
      addBox(
        group,
        { x: 0.9, y: 0.12, z: 0.14 },
        { x: -1.1, y: 7.4, z: 0 },
        timberPaleMaterial,
        0.2,
      );
    } else {
      addBox(group, { x: 0.16, y: 0.16, z: 1.8 }, { x: 1.05, y: 0.08, z: 0.95 }, cableMaterial);
      addBox(group, { x: 0.16, y: 0.16, z: 1.5 }, { x: 1.05, y: 0.08, z: 0.8 }, cableMaterial, 0.1);
    }

    group.userData.assetId = 'candidate-power-pylon';
    return group;
  },
};

function addDanglingCable(group: Group, anchor: Vector3, length: number): void {
  const points = [
    anchor,
    anchor.clone().add(new Vector3(0.18, -length * 0.3, 0.06)),
    anchor.clone().add(new Vector3(0.1, -length * 0.62, -0.04)),
    anchor.clone().add(new Vector3(0.26, -length * 0.86, 0.1)),
    anchor.clone().add(new Vector3(0.5, -length, 0.3)),
  ];
  for (let i = 0; i < points.length - 1; i += 1) {
    spanTo(group, points[i], points[i + 1], 0.045, cableMaterial, 5);
  }
}
