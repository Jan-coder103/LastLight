import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Wrecked ambulance on a van chassis. Local +Z is the front. Sized and banded to read as a
// smaller, boxier sibling of the city bus rather than as another car.
//
// Revision: the whole wreck now builds at WRECK_SCALE = 1.1 (owner request: 10% bigger), with the
// declared bounds derived from the same constant, and it carries more wreck detail: roof vent,
// side glass (one boarded), grille and headlights, rear bumper and drop step, a tipped stretcher
// visible through the open rear door, and rust streaks.
const WRECK_SCALE = 1.1;

const scaled = (value: number): number => Math.round(value * WRECK_SCALE * 100) / 100;
const scaledVec = (value: { x: number; y: number; z: number }) => ({
  x: scaled(value.x),
  y: scaled(value.y),
  z: scaled(value.z),
});

const bodyMaterials = [
  new MeshStandardMaterial({ color: '#a29b88', roughness: 0.95 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 0.95 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 0.95 }),
];
bodyMaterials[0]!.name = 'ambulance-body-faded-white';
bodyMaterials[1]!.name = 'ambulance-body-grey';
bodyMaterials[2]!.name = 'ambulance-body-dirty';

// The idea asks for "subdued red markings", so the red is a muted rust rather than a saturated
// emergency red, and it is the only chromatic accent on the model.
const markingMaterial = new MeshStandardMaterial({ color: '#8e5142', roughness: 0.95 });
markingMaterial.name = 'marking-red';

const trimMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 0.9 });
trimMaterial.name = 'trim-dark';

const glassMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.3,
  metalness: 0.05,
});
glassMaterial.name = 'window-glass';

const tyreMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
tyreMaterial.name = 'wheel-tyre';

const hubMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.2,
});
hubMaterial.name = 'wheel-hub';

const metalMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
metalMaterial.name = 'body-metal';

const rustMaterial = new MeshStandardMaterial({ color: '#6b3f30', roughness: 1 });
rustMaterial.name = 'rust-streak';

const lampMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.3,
  metalness: 0.05,
  emissive: '#243632',
  emissiveIntensity: 0.2,
});
lampMaterial.name = 'beacon-lens';

const brokenLampMaterial = new MeshStandardMaterial({ color: '#3a3630', roughness: 0.9 });
brokenLampMaterial.name = 'beacon-broken';

export const candidateAmbulanceWreck: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-ambulance-wreck',
  name: 'Ambulance Wreck',
  category: 'prop',
  // Bounds are authored pre-scale; see WRECK_SCALE above. Measured (vertex-accurate):
  // 2.95 x 3.05 x 6.72 — the swung-open rear door reaches x = -1.62 and the drop step z = -3.53,
  // so the declared x/z cover twice those offsets (the earlier z of 6.38 clipped the step).
  dimensions: scaledVec({ x: 3.0, y: 2.9, z: 6.45 }),
  collider: { center: scaledVec({ x: 0, y: 1.45, z: 0 }), size: scaledVec({ x: 2.2, y: 2.9, z: 5.7 }) },
  interactionPoints: [
    { id: 'rear-door', label: 'Rear Door', position: scaledVec({ x: 0, y: 0, z: -3.25 }) },
  ],
  createVisual(variant = 0) {
    const ambulance = new Group();
    const bodyMaterial = bodyMaterials[variant % bodyMaterials.length]!;

    // All geometry is authored at the original size and lifted by a single group scale, so the
    // size correction lives in exactly one place and cannot drift from the declared bounds.
    const body = new Group();
    body.scale.setScalar(WRECK_SCALE);
    ambulance.add(body);

    const chassis = new Mesh(new BoxGeometry(1.9, 0.4, 5.2), trimMaterial);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    body.add(chassis);

    // Box body behind the cab. The step from cab to box is what makes it read as a van-based
    // ambulance rather than a saloon with a roof box.
    const boxBody = new Mesh(new BoxGeometry(2.1, 1.7, 4.0), bodyMaterial);
    boxBody.position.set(0, 1.72, -0.8);
    boxBody.castShadow = true;
    boxBody.receiveShadow = true;
    body.add(boxBody);

    const cab = new Mesh(new BoxGeometry(2.05, 1.45, 1.5), bodyMaterial);
    cab.position.set(0, 1.6, 1.95);
    cab.castShadow = true;
    body.add(cab);

    const nose = new Mesh(new BoxGeometry(2.0, 0.5, 0.4), bodyMaterial);
    nose.position.set(0, 1.05, 2.65);
    nose.castShadow = true;
    body.add(nose);

    const bumper = new Mesh(new BoxGeometry(2.05, 0.28, 0.2), metalMaterial);
    bumper.position.set(0, 0.6, 2.78);
    body.add(bumper);

    // Windscreen leans back, so it is rotated negative: a positive rotation about X tips the top
    // toward +Z, which would rake it forward.
    const windscreen = new Mesh(new BoxGeometry(1.9, 0.95, 0.08), glassMaterial);
    windscreen.position.set(0, 1.95, 2.62);
    windscreen.rotation.x = -0.25;
    body.add(windscreen);
    const shard = new Mesh(new BoxGeometry(0.45, 0.5, 0.05), glassMaterial);
    shard.position.set(0.55, 1.85, 2.68);
    shard.rotation.set(-0.25, 0, 0.2);
    body.add(shard);

    // Subdued red band down both flanks, and a faded cross on the rear doors.
    for (const side of [-1, 1]) {
      const stripe = new Mesh(new BoxGeometry(0.06, 0.26, 3.6), markingMaterial);
      stripe.position.set(side * 1.06, 1.35, -0.8);
      body.add(stripe);
    }
    // On the shut right-hand rear door, within the body's x range.
    const crossVertical = new Mesh(new BoxGeometry(0.22, 0.7, 0.05), markingMaterial);
    crossVertical.position.set(0.52, 1.7, -2.83);
    body.add(crossVertical);
    const crossHorizontal = new Mesh(new BoxGeometry(0.7, 0.22, 0.05), markingMaterial);
    crossHorizontal.position.set(0.52, 1.7, -2.83);
    body.add(crossHorizontal);

    // Roof beacon bar with one intact lens and one dark, broken one.
    const beaconBar = new Mesh(new BoxGeometry(1.3, 0.22, 0.3), trimMaterial);
    beaconBar.position.set(0, 2.66, 1.9);
    beaconBar.castShadow = true;
    body.add(beaconBar);
    for (const [x, mat] of [
      [-0.4, lampMaterial],
      [0.4, brokenLampMaterial],
    ] as const) {
      const lens = new Mesh(new BoxGeometry(0.46, 0.2, 0.28), mat);
      lens.position.set(x, 2.66, 1.9);
      body.add(lens);
    }

    // Roof vent behind the beacon, the way box ambulances carry one.
    const roofVent = new Mesh(new BoxGeometry(0.52, 0.14, 0.52), trimMaterial);
    roofVent.position.set(0, 2.64, -1.2);
    roofVent.castShadow = true;
    body.add(roofVent);

    // Side windows in the box body: the left one still has glass, the right one is boarded over
    // with a dark panel.
    const sideWindow = new Mesh(new BoxGeometry(0.05, 0.4, 0.8), glassMaterial);
    sideWindow.position.set(-1.06, 2.1, 0.3);
    body.add(sideWindow);
    const boardedWindow = new Mesh(new BoxGeometry(0.05, 0.4, 0.8), trimMaterial);
    boardedWindow.position.set(1.06, 2.1, 0.3);
    body.add(boardedWindow);

    // Rear doors. The left one hangs open on a hinge, so the opening is real.
    const doorHinge = new Group();
    doorHinge.position.set(-1.06, 1.7, -2.78);
    doorHinge.rotation.y = -0.4;
    body.add(doorHinge);
    const openDoor = new Mesh(new BoxGeometry(0.08, 1.5, 0.95), bodyMaterial);
    openDoor.position.set(0, 0, 0.48);
    openDoor.castShadow = true;
    doorHinge.add(openDoor);
    const shutDoor = new Mesh(new BoxGeometry(0.95, 1.5, 0.08), bodyMaterial);
    shutDoor.position.set(0.52, 1.7, -2.78);
    body.add(shutDoor);
    const doorRecess = new Mesh(new BoxGeometry(0.95, 1.5, 0.06), trimMaterial);
    doorRecess.position.set(-0.52, 1.7, -2.78);
    body.add(doorRecess);

    // Tipped stretcher frame just inside the open doorway, so the opening shows a load rather
    // than a dark box: two side rails, three cross slats, a head panel.
    for (const x of [-0.72, -0.38]) {
      const rail = new Mesh(new BoxGeometry(0.05, 0.05, 1.5), metalMaterial);
      rail.position.set(x, 1.32, -2.1);
      rail.rotation.x = 0.22;
      rail.castShadow = true;
      body.add(rail);
    }
    for (const z of [-1.5, -2.1, -2.7]) {
      const slat = new Mesh(new BoxGeometry(0.36, 0.03, 0.09), trimMaterial);
      slat.position.set(-0.55, 1.32 - (z + 2.1) * 0.22, z);
      body.add(slat);
    }

    // Rear bumper with a drop step under the open door.
    const rearBumper = new Mesh(new BoxGeometry(2.05, 0.25, 0.18), metalMaterial);
    rearBumper.position.set(0, 0.62, -2.92);
    body.add(rearBumper);
    const dropStep = new Mesh(new BoxGeometry(0.7, 0.07, 0.32), trimMaterial);
    dropStep.position.set(-0.6, 0.44, -3.05);
    dropStep.rotation.z = 0.06;
    body.add(dropStep);

    // Three wheels and one exposed hub: the front right corner has collapsed.
    for (const [x, z] of [
      [0.95, 1.9],
      [-0.95, -1.8],
      [0.95, -1.8],
    ] as const) {
      const wheel = new Mesh(new CylinderGeometry(0.42, 0.42, 0.3, 10), tyreMaterial);
      wheel.position.set(x, 0.4, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      body.add(wheel);
    }
    const bareHub = new Mesh(new CylinderGeometry(0.22, 0.22, 0.18, 10), hubMaterial);
    bareHub.position.set(-0.95, 0.4, 1.9);
    bareHub.rotation.z = Math.PI / 2;
    body.add(bareHub);

    // Grille slats and lights on the nose: one glass headlight left, one dark empty socket
    // right.
    for (const y of [0.68, 0.8, 0.92]) {
      const slat = new Mesh(new BoxGeometry(1.3, 0.06, 0.06), trimMaterial);
      slat.position.set(0, y, 2.85);
      body.add(slat);
    }
    const headlight = new Mesh(new BoxGeometry(0.28, 0.18, 0.06), glassMaterial);
    headlight.position.set(-0.62, 0.78, 2.87);
    body.add(headlight);
    const brokenSocket = new Mesh(new BoxGeometry(0.28, 0.18, 0.06), brokenLampMaterial);
    brokenSocket.position.set(0.62, 0.78, 2.87);
    body.add(brokenSocket);

    // Rust streaks over panel seams, standing in for weathering without a texture.
    for (const [x, y, z, h, d] of [
      [-1.075, 1.0, -2.2, 0.55, 0.1],
      [1.075, 2.2, -1.9, 0.45, 0.14],
      [0.5, 2.45, 0.85, 0.1, 0.5],
    ] as const) {
      const streak = new Mesh(new BoxGeometry(0.03, h, d), rustMaterial);
      streak.position.set(x, y, z);
      body.add(streak);
    }

    for (const side of [-1, 1]) {
      const mirror = new Mesh(new BoxGeometry(0.1, 0.3, 0.16), metalMaterial);
      mirror.position.set(side * 1.16, 1.85, 2.35);
      body.add(mirror);
    }

    ambulance.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true;
    });
    ambulance.userData.assetId = 'candidate-ambulance-wreck';
    return ambulance;
  },
};
