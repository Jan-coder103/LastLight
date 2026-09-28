import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Wrecked ambulance on a van chassis. Local +Z is the front. Sized and banded to read as a
// smaller, boxier sibling of the city bus rather than as another car.
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
  dimensions: { x: 2.7, y: 2.9, z: 5.8 },
  collider: { center: { x: 0, y: 1.45, z: 0 }, size: { x: 2.2, y: 2.9, z: 5.7 } },
  interactionPoints: [{ id: 'rear-door', label: 'Rear Door', position: { x: 0, y: 0, z: -3.25 } }],
  createVisual(variant = 0) {
    const ambulance = new Group();
    const bodyMaterial = bodyMaterials[variant % bodyMaterials.length]!;

    const chassis = new Mesh(new BoxGeometry(1.9, 0.4, 5.2), trimMaterial);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    ambulance.add(chassis);

    // Box body behind the cab. The step from cab to box is what makes it read as a van-based
    // ambulance rather than a saloon with a roof box.
    const boxBody = new Mesh(new BoxGeometry(2.1, 1.7, 4.0), bodyMaterial);
    boxBody.position.set(0, 1.72, -0.8);
    boxBody.castShadow = true;
    boxBody.receiveShadow = true;
    ambulance.add(boxBody);

    const cab = new Mesh(new BoxGeometry(2.05, 1.45, 1.5), bodyMaterial);
    cab.position.set(0, 1.6, 1.95);
    cab.castShadow = true;
    ambulance.add(cab);

    const nose = new Mesh(new BoxGeometry(2.0, 0.5, 0.4), bodyMaterial);
    nose.position.set(0, 1.05, 2.65);
    nose.castShadow = true;
    ambulance.add(nose);

    const bumper = new Mesh(new BoxGeometry(2.05, 0.28, 0.2), metalMaterial);
    bumper.position.set(0, 0.6, 2.78);
    ambulance.add(bumper);

    // Windscreen leans back, so it is rotated negative: a positive rotation about X tips the top
    // toward +Z, which would rake it forward.
    const windscreen = new Mesh(new BoxGeometry(1.9, 0.95, 0.08), glassMaterial);
    windscreen.position.set(0, 1.95, 2.62);
    windscreen.rotation.x = -0.25;
    ambulance.add(windscreen);
    const shard = new Mesh(new BoxGeometry(0.45, 0.5, 0.05), glassMaterial);
    shard.position.set(0.55, 1.85, 2.68);
    shard.rotation.set(-0.25, 0, 0.2);
    ambulance.add(shard);

    // Subdued red band down both flanks, and a faded cross on the rear doors.
    for (const side of [-1, 1]) {
      const stripe = new Mesh(new BoxGeometry(0.06, 0.26, 3.6), markingMaterial);
      stripe.position.set(side * 1.06, 1.35, -0.8);
      ambulance.add(stripe);
    }
    // On the shut right-hand rear door, within the body's x range. An earlier draft put this at
    // x = -1.35, which left the cross floating 0.3 m off the back of the vehicle.
    const crossVertical = new Mesh(new BoxGeometry(0.22, 0.7, 0.05), markingMaterial);
    crossVertical.position.set(0.52, 1.7, -2.83);
    ambulance.add(crossVertical);
    const crossHorizontal = new Mesh(new BoxGeometry(0.7, 0.22, 0.05), markingMaterial);
    crossHorizontal.position.set(0.52, 1.7, -2.83);
    ambulance.add(crossHorizontal);

    // Roof beacon bar with one intact lens and one dark, broken one.
    const beaconBar = new Mesh(new BoxGeometry(1.3, 0.22, 0.3), trimMaterial);
    beaconBar.position.set(0, 2.66, 1.9);
    beaconBar.castShadow = true;
    ambulance.add(beaconBar);
    for (const [x, mat] of [
      [-0.4, lampMaterial],
      [0.4, brokenLampMaterial],
    ] as const) {
      const lens = new Mesh(new BoxGeometry(0.46, 0.2, 0.28), mat);
      lens.position.set(x, 2.66, 1.9);
      ambulance.add(lens);
    }

    // Rear doors. The left one hangs open on a hinge, so the opening is real.
    const doorHinge = new Group();
    doorHinge.position.set(-1.06, 1.7, -2.78);
    doorHinge.rotation.y = -0.4;
    ambulance.add(doorHinge);
    const openDoor = new Mesh(new BoxGeometry(0.08, 1.5, 0.95), bodyMaterial);
    openDoor.position.set(0, 0, 0.48);
    openDoor.castShadow = true;
    doorHinge.add(openDoor);
    const shutDoor = new Mesh(new BoxGeometry(0.95, 1.5, 0.08), bodyMaterial);
    shutDoor.position.set(0.52, 1.7, -2.78);
    ambulance.add(shutDoor);
    const doorRecess = new Mesh(new BoxGeometry(0.95, 1.5, 0.06), trimMaterial);
    doorRecess.position.set(-0.52, 1.7, -2.78);
    ambulance.add(doorRecess);

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
      ambulance.add(wheel);
    }
    const bareHub = new Mesh(new CylinderGeometry(0.22, 0.22, 0.18, 10), hubMaterial);
    bareHub.position.set(-0.95, 0.4, 1.9);
    bareHub.rotation.z = Math.PI / 2;
    ambulance.add(bareHub);

    for (const side of [-1, 1]) {
      const mirror = new Mesh(new BoxGeometry(0.1, 0.3, 0.16), metalMaterial);
      mirror.position.set(side * 1.16, 1.85, 2.35);
      ambulance.add(mirror);
    }

    ambulance.userData.assetId = 'candidate-ambulance-wreck';
    return ambulance;
  },
};
