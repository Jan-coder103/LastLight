import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const paintMaterial = new MeshStandardMaterial({ color: '#58624d', roughness: 0.92, flatShading: true });
paintMaterial.name = 'tractor-paint';
const paintWornMaterial = new MeshStandardMaterial({ color: '#74765c', roughness: 1, flatShading: true });
paintWornMaterial.name = 'tractor-paint-worn';
const steelMaterial = new MeshStandardMaterial({ color: '#292f2b', roughness: 0.88, metalness: 0.25 });
steelMaterial.name = 'tractor-steel';
const rimMaterial = new MeshStandardMaterial({ color: '#a29b88', roughness: 0.95 });
rimMaterial.name = 'tractor-rim';
const rubberMaterial = new MeshStandardMaterial({ color: '#303832', roughness: 1, flatShading: true });
rubberMaterial.name = 'tractor-rubber';
const rustMaterial = new MeshStandardMaterial({ color: '#9b624d', roughness: 1, metalness: 0.1 });
rustMaterial.name = 'tractor-rust';
const timberMaterial = new MeshStandardMaterial({ color: '#594332', roughness: 1 });
timberMaterial.name = 'tractor-timber';
const signalMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.8 });
signalMaterial.name = 'tractor-signal';
const glassMaterial = new MeshStandardMaterial({ color: '#65766d', roughness: 0.4, metalness: 0.05 });
glassMaterial.name = 'tractor-glass';

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
): Mesh {
  const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(at.x, at.y, at.z);
  return addMesh(group, mesh);
}

function addCylinder(
  group: Group,
  radius: number,
  length: number,
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
  segments = 10,
  axis: 'x' | 'y' | 'z' = 'y',
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  mesh.position.set(at.x, at.y, at.z);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  return addMesh(group, mesh);
}

function spanTo(
  group: Group,
  from: Vector3,
  to: Vector3,
  radius: number,
  material: MeshStandardMaterial,
  segments = 8,
): Mesh {
  const dir = to.clone().sub(from);
  const length = dir.length();
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize());
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  return addMesh(group, mesh);
}

/** Centre height that puts the lowest point of a cylinder of radius r, half-length h on the ground. */
function groundCentre(radius: number, halfLength: number, tilt: number): number {
  return radius * Math.cos(tilt) + halfLength * Math.sin(tilt);
}

interface WheelSpec {
  at: { x: number; z: number };
  radius: number;
  width: number;
  tilt: number;
  /** Override the resting centre height, for wheels pre-positioned inside a pitched hull. */
  centreY?: number;
}

function addWheel(group: Group, spec: WheelSpec): void {
  const { at, radius, width, tilt } = spec;
  const centreY = spec.centreY ?? groundCentre(radius, width / 2, tilt);
  const place = (mesh: Mesh, x: number): void => {
    mesh.rotation.set(tilt, 0, Math.PI / 2);
    mesh.position.set(x, centreY, at.z);
  };
  const tyre = new Mesh(new CylinderGeometry(radius, radius, width, 12), rubberMaterial);
  place(tyre, at.x);
  addMesh(group, tyre);
  const rim = new Mesh(new CylinderGeometry(radius * 0.42, radius * 0.42, width * 1.04, 8), rimMaterial);
  place(rim, at.x);
  addMesh(group, rim);
  for (const side of [-1, 1]) {
    const hub = new Mesh(new CylinderGeometry(radius * 0.5, radius * 0.5, width * 0.2, 8), steelMaterial);
    place(hub, at.x + side * width * 0.42);
    addMesh(group, hub);
  }
}

export const farmTractor: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-farm-tractor',
  name: 'Abandoned Farm Tractor',
  category: 'prop',
  dimensions: { x: 3.2, y: 2.6, z: 4.2 },
  collider: { center: { x: 0, y: 0.9, z: 0 }, size: { x: 2.2, y: 1.8, z: 2.8 } },
  interactionPoints: [{ id: 'tractor-seat', label: 'Tractor Seat', position: { x: 0, y: 0, z: 0.5 } }],
  createVisual(variant = 0) {
    const group = new Group();
    // Variant 1 is the intact machine. Variants 0 and 2 are the failed front axle: the right
    // front wheel is gone, the detached wheel lies flat on the ground, and the whole machine
    // pitches nose-down around the rear axle until the broken axle end rests on the dirt.
    const wrecked = variant !== 1;

    // Rear wheels stay outside the hull so they keep their true planted stance.
    addWheel(group, { at: { x: -0.8, z: -0.9 }, radius: 0.72, width: 0.36, tilt: 0 });
    addWheel(group, { at: { x: 0.8, z: -0.9 }, radius: 0.72, width: 0.36, tilt: 0 });

    const hull = new Group();
    group.add(hull);
    if (wrecked) {
      hull.rotation.x = 0.1;
    }

    // The left front wheel rides in the hull; when pitched it is pre-lifted so it lands exactly
    // planted after the rotation. The missing right corner keeps only the broken axle stub,
    // which the pitch drops down onto the ground.
    addWheel(hull, {
      at: { x: -0.66, z: 1.12 },
      radius: 0.36,
      width: 0.24,
      tilt: 0,
      centreY: wrecked ? 0.47 : undefined,
    });
    if (wrecked) {
      // The broken front axle: a beam from the left hub sloping down to the right, so after the
      // pitch its snapped end rests on the ground where the wheel used to be.
      const axle = addBox(hull, { x: 1.34, y: 0.13, z: 0.13 }, { x: 0, y: 0.37, z: 1.12 }, steelMaterial);
      axle.rotation.z = 0.16;
    } else {
      addWheel(hull, { at: { x: 0.66, z: 1.12 }, radius: 0.36, width: 0.24, tilt: 0 });
    }

    addBox(hull, { x: 1.02, y: 0.62, z: 1.5 }, { x: 0, y: 0.92, z: -0.35 }, paintMaterial);
    addBox(hull, { x: 0.86, y: 0.44, z: 0.5 }, { x: 0, y: 1.4, z: 0.5 }, paintWornMaterial);
    // Grille, deep enough to reach back to the body face so the nose is one connected mass.
    addBox(hull, { x: 0.9, y: 0.5, z: 0.55 }, { x: 0, y: 1.06, z: 0.68 }, steelMaterial);
    addBox(hull, { x: 0.66, y: 0.34, z: 0.1 }, { x: 0, y: 1.06, z: 0.96 }, paintWornMaterial);
    addBox(hull, { x: 0.34, y: 0.12, z: 0.34 }, { x: 0, y: 0.98, z: 0.98 }, steelMaterial);

    // Hood with the exhaust stack and the air intake both rooted in its top surface.
    addBox(hull, { x: 0.5, y: 0.22, z: 0.5 }, { x: 0, y: 1.3, z: -0.6 }, rustMaterial);
    spanTo(hull, new Vector3(0.13, 1.38, -0.68), new Vector3(0.04, 2.3, -0.98), 0.07, rustMaterial);
    addCylinder(hull, 0.09, 0.09, { x: 0.04, y: 2.32, z: -0.98 }, steelMaterial, 8);
    addCylinder(hull, 0.075, 0.42, { x: -0.13, y: 1.6, z: -0.5 }, steelMaterial);
    addCylinder(hull, 0.095, 0.08, { x: -0.13, y: 1.84, z: -0.5 }, rustMaterial, 8);

    // Seat pan rests on the body top; the steering column rises from the body to the wheel.
    addBox(hull, { x: 0.44, y: 0.1, z: 0.44 }, { x: 0, y: 1.28, z: -0.28 }, timberMaterial);
    addBox(hull, { x: 0.44, y: 0.36, z: 0.1 }, { x: 0, y: 1.52, z: -0.5 }, timberMaterial);
    spanTo(hull, new Vector3(0, 1.24, 0.14), new Vector3(0, 1.66, -0.02), 0.035, steelMaterial);
    const steeringWheel = addCylinder(
      hull,
      0.17,
      0.04,
      { x: 0, y: 1.68, z: -0.03 },
      steelMaterial,
      12,
      'z',
    );
    steeringWheel.rotation.x = 1.25;

    // Fenders above the rear wheels, bracketed across to the body sides.
    for (const side of [-1, 1]) {
      addBox(hull, { x: 0.22, y: 0.08, z: 0.72 }, { x: side * 0.8, y: 1.52, z: -0.9 }, paintMaterial);
      addBox(hull, { x: 0.3, y: 0.06, z: 0.1 }, { x: side * 0.62, y: 1.44, z: -0.9 }, steelMaterial);
    }

    // Canopy on four posts that stand on the body top instead of in the air behind it.
    addBox(hull, { x: 1.5, y: 0.08, z: 1.5 }, { x: 0, y: 2.42, z: -0.4 }, paintWornMaterial);
    for (const [px, pz] of [
      [-0.44, -1.0],
      [0.44, -1.0],
      [-0.44, 0.2],
      [0.44, 0.2],
    ] as const) {
      addBox(hull, { x: 0.09, y: 1.26, z: 0.09 }, { x: px, y: 1.79, z: pz }, paintMaterial);
    }

    for (const side of [-1, 1]) {
      addCylinder(hull, 0.07, 0.12, { x: side * 0.4, y: 1.42, z: 0.8 }, signalMaterial, 8, 'x');
    }
    addBox(hull, { x: 0.3, y: 0.14, z: 0.3 }, { x: 0, y: 1.06, z: -1.06 }, steelMaterial);

    if (wrecked) {
      // The detached front wheel lying flat beside the machine, the visible reason for the list.
      const loose = new Group();
      loose.position.set(1.45, 0.19, 2.0);
      loose.rotation.set(0.1, 0.7, 0.03);
      group.add(loose);
      const looseTyre = new Mesh(new CylinderGeometry(0.36, 0.36, 0.24, 12), rubberMaterial);
      looseTyre.castShadow = true;
      loose.add(looseTyre);
      const looseRim = new Mesh(new CylinderGeometry(0.15, 0.15, 0.26, 8), rimMaterial);
      looseRim.castShadow = true;
      loose.add(looseRim);
      const looseHub = new Mesh(new CylinderGeometry(0.07, 0.07, 0.3, 8), steelMaterial);
      looseHub.castShadow = true;
      loose.add(looseHub);
    }

    if (variant === 2) {
      addBox(group, { x: 0.06, y: 0.3, z: 0.06 }, { x: 0.72, y: 0.15, z: 1.2 }, steelMaterial);
      addBox(group, { x: 0.34, y: 0.12, z: 0.2 }, { x: -1.06, y: 0.06, z: 0.2 }, glassMaterial);
    }
    if (variant === 1) {
      addBox(group, { x: 0.3, y: 0.12, z: 0.2 }, { x: -1.06, y: 0.06, z: 0.2 }, glassMaterial);
    }

    group.userData.assetId = 'candidate-farm-tractor';
    return group;
  },
};
