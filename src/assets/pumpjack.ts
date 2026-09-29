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

// Owner-approved authored asset, registered in the live catalog.
// Oil pumpjack. Local +Z is the wellhead side, local -Z carries the cranks and counterweights.
// Revision adds the working detail the first draft lacked: an electric motor with belt drive and
// guard on the gearbox cheek, an access ladder to an operator platform with a guardrail, proper
// round crank counterweights with pitman rods anchored at the crank pins, and a wellhead with a
// gated outlet under the stuffing box.
const beamMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 1,
  flatShading: true,
});
beamMaterial.name = 'pumpjack-beam';
const frameMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.9,
  metalness: 0.25,
  flatShading: true,
});
frameMaterial.name = 'pumpjack-frame';
const steelMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.85,
  metalness: 0.3,
});
steelMaterial.name = 'pumpjack-steel';
const rodMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 0.7, metalness: 0.35 });
rodMaterial.name = 'pumpjack-rod';
const concreteMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1 });
concreteMaterial.name = 'pumpjack-concrete';
const rustMaterial = new MeshStandardMaterial({ color: '#8e5142', roughness: 1, metalness: 0.1 });
rustMaterial.name = 'pumpjack-rust';
const signalMaterial = new MeshStandardMaterial({ color: '#d9b56e', roughness: 0.8 });
signalMaterial.name = 'pumpjack-signal';

const Y_AXIS = new Vector3(0, 1, 0);
const PIVOT_Y = 3.0;
const PIVOT_Z = -0.9;

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
  segments: number,
  rot: { x?: number; z?: number } = {},
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  mesh.position.set(at.x, at.y, at.z);
  if (rot.x) mesh.rotation.x = rot.x;
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

export const pumpjack: AuthoredAsset = {
  schemaVersion: 1,
  id: 'pumpjack',
  name: 'Oil Pumpjack',
  category: 'prop',
  dimensions: { x: 3.2, y: 4.4, z: 5.6 },
  collider: { center: { x: 0, y: 0.5, z: -0.2 }, size: { x: 1.5, y: 1.0, z: 2.2 } },
  interactionPoints: [
    { id: 'pumpjack-gearbox', label: 'Pumpjack Gearbox', position: { x: 0.8, y: 0, z: -1.4 } },
  ],
  createVisual(variant = 0) {
    const group = new Group();

    addBox(group, { x: 2.9, y: 0.24, z: 4.6 }, { x: 0, y: 0.12, z: 0.1 }, concreteMaterial);
    addBox(group, { x: 1.5, y: 0.9, z: 1.0 }, { x: 0, y: 0.66, z: PIVOT_Z }, frameMaterial);
    addBox(group, { x: 1.2, y: 0.42, z: 0.8 }, { x: 0, y: 1.3, z: PIVOT_Z }, steelMaterial);
    addBox(
      group,
      { x: 0.3, y: 0.26, z: 0.04 },
      { x: 0.56, y: 0.9, z: PIVOT_Z + 0.52 },
      signalMaterial,
    );

    // Electric motor and belt drive on the +X cheek of the gearbox: a motor cylinder with an end
    // bell, standing on two footed pads, its small sheave, the big gearbox sheave, and a leaning
    // guard board covering the belt run between the two.
    addCylinder(group, 0.17, 0.46, { x: 1.05, y: 0.42, z: PIVOT_Z + 0.44 }, frameMaterial, 10, {
      z: Math.PI / 2,
    });
    addCylinder(group, 0.19, 0.1, { x: 0.85, y: 0.42, z: PIVOT_Z + 0.44 }, frameMaterial, 10, {
      z: Math.PI / 2,
    });
    addBox(
      group,
      { x: 0.24, y: 0.26, z: 0.3 },
      { x: 1.05, y: 0.13, z: PIVOT_Z + 0.3 },
      steelMaterial,
    );
    addBox(
      group,
      { x: 0.24, y: 0.26, z: 0.3 },
      { x: 1.05, y: 0.13, z: PIVOT_Z + 0.58 },
      steelMaterial,
    );
    addCylinder(group, 0.1, 0.08, { x: 0.78, y: 0.42, z: PIVOT_Z + 0.44 }, steelMaterial, 8, {
      z: Math.PI / 2,
    });
    addCylinder(group, 0.27, 0.09, { x: 0.82, y: 0.85, z: PIVOT_Z }, steelMaterial, 10, {
      z: Math.PI / 2,
    });
    const beltGuard = addBox(
      group,
      { x: 0.05, y: 0.72, z: 0.38 },
      { x: 0.83, y: 0.77, z: PIVOT_Z + 0.22 },
      rustMaterial,
    );
    beltGuard.rotation.x = 0.8;

    for (const side of [-1, 1]) {
      spanTo(
        group,
        new Vector3(side * 0.78, 1.5, PIVOT_Z),
        new Vector3(side * 0.36, PIVOT_Y, PIVOT_Z),
        0.13,
        frameMaterial,
        6,
      );
    }
    spanTo(
      group,
      new Vector3(-0.72, 1.9, PIVOT_Z),
      new Vector3(0.72, 2.75, PIVOT_Z),
      0.08,
      frameMaterial,
      5,
    );
    spanTo(
      group,
      new Vector3(0.72, 1.9, PIVOT_Z),
      new Vector3(-0.72, 2.75, PIVOT_Z),
      0.08,
      frameMaterial,
      5,
    );

    // Access ladder up the +Z face to the operator platform, and the platform itself: a grating
    // over the gearbox top with a three-rail guard left open on the ladder side. The stiles rise
    // just clear of the gearbox cheek and land on the grating's forward edge.
    for (const sx of [-1, 1]) {
      spanTo(
        group,
        new Vector3(sx * 0.18, 0.03, 0.1),
        new Vector3(sx * 0.18, 1.62, -0.5),
        0.035,
        steelMaterial,
        5,
      );
    }
    for (let i = 0; i < 6; i++) {
      const t = (i + 0.5) / 6;
      const rung = new Mesh(new BoxGeometry(0.42, 0.05, 0.05), steelMaterial);
      rung.position.set(0, 0.03 + t * 1.59, 0.1 - t * 0.6);
      rung.castShadow = true;
      rung.receiveShadow = true;
      group.add(rung);
    }
    addBox(group, { x: 1.5, y: 0.06, z: 1.3 }, { x: 0, y: 1.56, z: PIVOT_Z + 0.25 }, frameMaterial);
    for (const [px, pz] of [
      [-0.68, PIVOT_Z - 0.34],
      [0.68, PIVOT_Z - 0.34],
      [-0.68, PIVOT_Z + 0.84],
      [0.68, PIVOT_Z + 0.84],
    ] as const) {
      addBox(group, { x: 0.07, y: 0.42, z: 0.07 }, { x: px, y: 1.8, z: pz }, steelMaterial);
    }
    addBox(
      group,
      { x: 1.36, y: 0.06, z: 0.06 },
      { x: 0, y: 1.98, z: PIVOT_Z - 0.34 },
      steelMaterial,
    );
    for (const sx of [-1, 1]) {
      addBox(
        group,
        { x: 0.06, y: 0.06, z: 1.18 },
        { x: sx * 0.68, y: 1.98, z: PIVOT_Z + 0.25 },
        steelMaterial,
      );
    }

    const beamTilt = variant === 1 ? 0.13 : variant === 2 ? -0.09 : 0.04;
    const beam = new Group();
    addBox(beam, { x: 0.42, y: 0.34, z: 3.6 }, { x: 0, y: 0, z: 0.1 }, beamMaterial);
    addBox(beam, { x: 0.7, y: 0.52, z: 0.6 }, { x: 0, y: 0, z: 0 }, frameMaterial);
    addBox(beam, { x: 0.5, y: 0.3, z: 0.7 }, { x: 0, y: 0, z: 1.55 }, frameMaterial);

    // Horsehead: four faceted plates stepped along a quarter arc, so the head reads as a
    // curved counterweight face rather than as a stack of blocks.
    const headCentre = new Vector3(0, 0.45, 1.72);
    const headRadius = 0.86;
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 3) * (Math.PI * 0.52) - 0.1;
      const plate = new Mesh(new BoxGeometry(0.13, 0.47, 0.54), beamMaterial);
      plate.position.set(
        headCentre.x,
        headCentre.y - Math.sin(a) * headRadius,
        headCentre.z + Math.cos(a) * headRadius,
      );
      plate.rotation.x = a;
      addMesh(beam, plate);
    }

    beam.position.set(0, PIVOT_Y, PIVOT_Z);
    beam.rotation.x = -beamTilt;
    group.add(beam);

    const bridleAnchor = new Vector3(
      headCentre.x,
      PIVOT_Y + headCentre.y - Math.sin(Math.PI * 0.42) * headRadius,
      PIVOT_Z + headCentre.z + Math.cos(Math.PI * 0.42) * headRadius,
    ).applyAxisAngle(new Vector3(1, 0, 0), -beamTilt);
    const wellZ = bridleAnchor.z + 0.12;
    spanTo(group, bridleAnchor, new Vector3(0, 2.42, wellZ), 0.035, rodMaterial, 5);
    spanTo(group, new Vector3(0, 2.42, wellZ), new Vector3(0, 0.58, wellZ), 0.045, rodMaterial, 5);
    addCylinder(group, 0.22, 0.22, { x: 0, y: 0.46, z: wellZ }, rustMaterial, 10);
    addBox(group, { x: 0.34, y: 0.3, z: 0.34 }, { x: 0, y: 0.32, z: wellZ }, steelMaterial);
    // Wellhead under the stuffing box: casing flange, the flow tee, and a gated outlet with a
    // handwheel, so the rod enters a completed completion rather than a stub in the dirt.
    addBox(group, { x: 0.44, y: 0.14, z: 0.44 }, { x: 0, y: 0.07, z: wellZ }, steelMaterial);
    addCylinder(group, 0.07, 0.24, { x: 0, y: 0.2, z: wellZ }, steelMaterial, 8);
    addCylinder(group, 0.05, 0.42, { x: 0.26, y: 0.24, z: wellZ }, steelMaterial, 8, {
      z: Math.PI / 2,
    });
    addCylinder(group, 0.02, 0.08, { x: 0.47, y: 0.24, z: wellZ }, steelMaterial, 6, {
      z: Math.PI / 2,
    });
    const handwheel = new Mesh(new TorusGeometry(0.09, 0.018, 5, 10), rustMaterial);
    handwheel.position.set(0.52, 0.24, wellZ);
    handwheel.rotation.y = Math.PI / 2;
    addMesh(group, handwheel);

    const tailPoint = new Vector3(0, PIVOT_Y, PIVOT_Z - 1.7).applyAxisAngle(
      new Vector3(1, 0, 0),
      -beamTilt,
    );
    // Cranks, pitman rods, and counterweights. Each crank arm swings a round counterweight disc
    // out behind the gearbox, and the pitman rod runs from the crank PIN up to the beam tail —
    // the first draft anchored the rods at the crankshaft centre, so the drive read as two rods
    // to nowhere.
    const crankCentre = new Vector3(0, 1.3, PIVOT_Z);
    const crankPin = new Vector3(0, 0.9, PIVOT_Z - 0.78);
    for (const side of [-1, 1]) {
      if (variant !== 2) {
        spanTo(
          group,
          crankPin.clone().add(new Vector3(side * 0.24, 0, 0)),
          tailPoint.clone().add(new Vector3(side * 0.24, 0, 0)),
          0.055,
          steelMaterial,
          6,
        );
        spanTo(
          group,
          crankCentre.clone().add(new Vector3(side * 0.24, 0, 0)),
          crankPin.clone().add(new Vector3(side * 0.24, 0, 0)),
          0.07,
          steelMaterial,
          6,
        );
        addCylinder(
          group,
          0.34,
          0.16,
          { x: side * 0.34, y: 0.84, z: PIVOT_Z - 0.82 },
          rustMaterial,
          10,
          { z: Math.PI / 2 },
        );
      }
    }
    if (variant === 2) {
      // The stripped unit: one counterweight lies in the dirt, the other went with the cranks.
      addCylinder(group, 0.34, 0.16, { x: 1.2, y: 0.34, z: 0.4 }, rustMaterial, 10, {
        z: Math.PI / 2,
      });
    }
    addCylinder(group, 0.16, 0.9, { x: 0, y: 1.3, z: PIVOT_Z }, steelMaterial, 10, {
      x: Math.PI / 2,
    });
    addBox(group, { x: 1.1, y: 0.1, z: 0.6 }, { x: 0, y: 0.28, z: PIVOT_Z }, steelMaterial);

    if (variant === 1) {
      addBox(group, { x: 0.5, y: 0.16, z: 0.4 }, { x: -1.15, y: 0.32, z: 1.1 }, rustMaterial);
    }

    group.userData.assetId = 'candidate-pumpjack';
    return group;
  },
};
