import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset.
// Communications truck. Local +Z is the front. The idea names three things — box body, roof
// antenna, muted field paint — and all three are modelled.
const paintMaterials = [
  new MeshStandardMaterial({ color: '#58624d', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#626753', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#77796a', roughness: 0.9 }),
];
paintMaterials[0]!.name = 'truck-paint-field-green';
paintMaterials[1]!.name = 'truck-paint-faded-olive';
paintMaterials[2]!.name = 'truck-paint-grey-green';

const glassMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.3,
  metalness: 0.05,
});
glassMaterial.name = 'window-glass';

const trimMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 0.9 });
trimMaterial.name = 'trim-dark';

const metalMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
metalMaterial.name = 'body-metal';

const tyreMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
tyreMaterial.name = 'wheel-tyre';

const hubMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.2,
});
hubMaterial.name = 'wheel-hub';

const rustMaterial = new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9 });
rustMaterial.name = 'rust-metal';

const BODY_H = 2.15;
const CAB_H = 1.75;

export const communicationTruck: AuthoredAsset = {
  schemaVersion: 1,
  id: 'communication-truck',
  name: 'Communications Truck',
  category: 'prop',
  dimensions: { x: 2.9, y: 5.7, z: 8.6 },
  collider: { center: { x: 0, y: 1.5, z: -0.2 }, size: { x: 2.5, y: 3, z: 7.6 } },
  interactionPoints: [{ id: 'truck-rear', label: 'Truck Rear', position: { x: 0, y: 0, z: -4.2 } }],
  createVisual(variant = 0) {
    const truck = new Group();
    const paintMaterial = paintMaterials[variant % paintMaterials.length]!;
    const antennaDown = variant === 2;

    const chassis = new Mesh(new BoxGeometry(2.2, 0.42, 7.2), trimMaterial);
    chassis.position.set(0, 0.72, -0.2);
    chassis.castShadow = true;
    truck.add(chassis);

    // Box body behind the cab. The step up from the cab roof to the body roof is what makes it a
    // box-body truck rather than a van.
    const body = new Mesh(new BoxGeometry(2.5, BODY_H, 4.9), paintMaterial);
    body.position.set(0, 0.95 + BODY_H / 2, -1.35);
    body.castShadow = true;
    body.receiveShadow = true;
    truck.add(body);
    const bodyRoof = new Mesh(new BoxGeometry(2.54, 0.12, 4.94), paintMaterial);
    bodyRoof.position.set(0, 0.95 + BODY_H + 0.06, -1.35);
    bodyRoof.castShadow = true;
    truck.add(bodyRoof);

    // Two vertical ribs a side on the box, which is the corrugation that stops a 4.9 m panel
    // reading as a plain slab. Four meshes instead of twelve.
    for (const side of [-1, 1]) {
      for (const z of [-2.6, -0.2]) {
        const rib = new Mesh(new BoxGeometry(0.08, BODY_H - 0.3, 0.26), paintMaterial);
        rib.position.set(side * 1.27, 0.95 + BODY_H / 2, z);
        rib.castShadow = true;
        truck.add(rib);
      }
    }

    // Cab and bonnet.
    const cab = new Mesh(new BoxGeometry(2.4, CAB_H, 2.1), paintMaterial);
    cab.position.set(0, 0.95 + CAB_H / 2, 2.6);
    cab.castShadow = true;
    truck.add(cab);
    const bonnet = new Mesh(new BoxGeometry(2.2, 0.62, 1.2), paintMaterial);
    bonnet.position.set(0, 1.24, 3.85);
    bonnet.castShadow = true;
    truck.add(bonnet);
    const bumper = new Mesh(new BoxGeometry(2.3, 0.3, 0.24), metalMaterial);
    bumper.position.set(0, 0.86, 4.5);
    bumper.castShadow = true;
    truck.add(bumper);

    // Windscreen and side windows. Raked negative about X so the top leans back toward the cab.
    const windscreen = new Mesh(new BoxGeometry(2.1, 0.95, 0.08), glassMaterial);
    windscreen.position.set(0, 2.05, 3.62);
    windscreen.rotation.x = -0.22;
    truck.add(windscreen);
    for (const side of [-1, 1]) {
      const sideWindow = new Mesh(new BoxGeometry(0.06, 0.6, 0.9), glassMaterial);
      sideWindow.position.set(side * 1.22, 2.0, 2.7);
      truck.add(sideWindow);
      const mirror = new Mesh(new BoxGeometry(0.1, 0.28, 0.16), metalMaterial);
      mirror.position.set(side * 1.35, 2.1, 3.5);
      truck.add(mirror);
    }

    // Four wheels, all present: the damage on this truck is the antenna, not a missing corner.
    for (const [x, z] of [
      [1.12, 2.9],
      [-1.12, 2.9],
      [1.12, -1.9],
      [-1.12, -1.9],
    ] as const) {
      const wheel = new Mesh(new CylinderGeometry(0.55, 0.55, 0.36, 12), tyreMaterial);
      wheel.position.set(x, 0.55, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      truck.add(wheel);
      const hub = new Mesh(new CylinderGeometry(0.22, 0.22, 0.38, 8), hubMaterial);
      hub.position.set(x, 0.55, z);
      hub.rotation.z = Math.PI / 2;
      truck.add(hub);
    }

    // Rear doors: closed, because the idea names no opening on this vehicle and the comms box's
    // read is its sealed flank.
    for (const side of [-1, 1]) {
      const door = new Mesh(new BoxGeometry(1.1, BODY_H - 0.3, 0.08), trimMaterial);
      door.position.set(side * 0.58, 0.95 + BODY_H / 2, -3.82);
      door.castShadow = true;
      truck.add(door);
    }

    // Roof antenna. A named feature, so the thin geometry is justified: a main whip plus three
    // short whips on a base plate. Variant 2 has the main whip collapsed, which is this asset's
    // state variant.
    const basePlate = new Mesh(new BoxGeometry(0.5, 0.1, 0.5), metalMaterial);
    basePlate.position.set(-0.7, 0.95 + BODY_H + 0.17, -0.6);
    basePlate.castShadow = true;
    truck.add(basePlate);
    const whip = new Mesh(new CylinderGeometry(0.03, 0.045, 2.3, 5), metalMaterial);
    whip.position.set(-0.7, 0.95 + BODY_H + 0.22 + (antennaDown ? 0.5 : 1.15), -0.6);
    whip.rotation.x = antennaDown ? 1.15 : 0.06;
    whip.castShadow = true;
    truck.add(whip);
    for (let i = 0; i < 3; i++) {
      const short = new Mesh(new CylinderGeometry(0.025, 0.035, 0.8, 5), metalMaterial);
      short.position.set(-0.3 + i * 0.3, 0.95 + BODY_H + 0.52, -1.4);
      truck.add(short);
    }

    // Buckled side panel and a rusted patch, the two damage cues that do not cost a missing wheel.
    const buckle = new Mesh(new BoxGeometry(0.09, 0.8, 1.1), paintMaterial);
    buckle.position.set(-1.29, 1.5, -0.2);
    buckle.rotation.set(0.16, 0, -0.22);
    buckle.castShadow = true;
    truck.add(buckle);
    const rustPatch = new Mesh(new BoxGeometry(0.05, 0.5, 0.7), rustMaterial);
    rustPatch.position.set(1.28, 1.4, -3.0);
    truck.add(rustPatch);

    // A stowed equipment crate on the rear step, which gives the silhouette a second mass.
    const crate = new Mesh(new BoxGeometry(1.2, 0.5, 0.7), metalMaterial);
    crate.position.set(0, 0.72, -3.4);
    crate.castShadow = true;
    crate.receiveShadow = true;
    truck.add(crate);

    truck.userData.assetId = 'communication-truck';
    return truck;
  },
};
