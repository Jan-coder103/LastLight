import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset.
// Wrecked city bus, 12 m long. Local +Z is the front. Reads as a bus from the three-band
// silhouette: painted lower body, dark window band, painted roof.
const paintMaterials = [
  new MeshStandardMaterial({ color: '#9b624d', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#526e70', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#77796a', roughness: 0.9 }),
];
paintMaterials[0]!.name = 'bus-paint-faded-red';
paintMaterials[1]!.name = 'bus-paint-faded-teal';
paintMaterials[2]!.name = 'bus-paint-faded-olive';

const bandMaterial = new MeshStandardMaterial({
  color: '#444943',
  roughness: 0.4,
  metalness: 0.1,
});
bandMaterial.name = 'window-band';

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

const signMaterial = new MeshStandardMaterial({
  color: '#c5ad70',
  roughness: 0.7,
  emissive: '#4a3c1c',
  emissiveIntensity: 0.3,
});
signMaterial.name = 'sign-dim';

const tailMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.5,
  emissive: '#3a1f18',
  emissiveIntensity: 0.25,
});
tailMaterial.name = 'tail-lens';

const BAND_Y = 2.68;
const BAND_H = 0.62;

export const cityBusWreck: AuthoredAsset = {
  schemaVersion: 1,
  id: 'city-bus-wreck',
  name: 'City Bus Wreck',
  category: 'prop',
  dimensions: { x: 3.3, y: 3.9, z: 12.2 },
  // A solid vehicle, so a box is the right shape here. This is the one candidate in the batch
  // where a bounding box is genuinely an accurate collision volume.
  // The body only, so the open door does not inflate the collision volume.
  collider: { center: { x: 0, y: 1.6, z: 0 }, size: { x: 2.6, y: 3.2, z: 12.0 } },
  interactionPoints: [{ id: 'front-door', label: 'Bus Door', position: { x: 1.85, y: 0, z: 2.6 } }],
  createVisual(variant = 0) {
    const bus = new Group();
    const paintMaterial = paintMaterials[variant % paintMaterials.length]!;

    const underbody = new Mesh(new BoxGeometry(2.3, 0.5, 11.4), trimMaterial);
    underbody.position.y = 0.62;
    underbody.castShadow = true;
    bus.add(underbody);

    const lowerBody = new Mesh(new BoxGeometry(2.55, 1.5, 11.8), paintMaterial);
    lowerBody.position.y = 1.62;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    bus.add(lowerBody);

    // The window band is inset 0.05 each side, so it reads as a recess at the shoulder line
    // rather than as a painted stripe. That inset is the whole bus silhouette in one number.
    const band = new Mesh(new BoxGeometry(2.45, BAND_H, 11.5), bandMaterial);
    band.position.y = BAND_Y;
    band.castShadow = true;
    bus.add(band);

    const roof = new Mesh(new BoxGeometry(2.55, 0.16, 11.8), paintMaterial);
    roof.position.y = 3.07;
    roof.castShadow = true;
    bus.add(roof);

    // Window pillars. Four per side divides the band into five bays, which is enough to read as
    // glazing from a distance without paying for ten.
    for (const side of [-1, 1]) {
      for (const z of [-4.2, -1.4, 1.4, 4.2]) {
        const pillar = new Mesh(new BoxGeometry(0.08, BAND_H, 0.16), paintMaterial);
        pillar.position.set(side * 1.23, BAND_Y, z);
        bus.add(pillar);
      }
    }

    // Front: windscreen bridging the stepped front face, a dim destination panel, a bumper and
    // two headlamps.
    const windscreen = new Mesh(new BoxGeometry(2.3, 0.9, 0.1), glassMaterial);
    windscreen.position.set(0, 2.6, 5.78);
    bus.add(windscreen);
    const destination = new Mesh(new BoxGeometry(1.6, 0.26, 0.06), signMaterial);
    destination.position.set(0, 3.04, 5.93);
    bus.add(destination);
    const bumper = new Mesh(new BoxGeometry(2.5, 0.3, 0.3), metalMaterial);
    bumper.position.set(0, 0.62, 5.95);
    bumper.castShadow = true;
    bus.add(bumper);
    for (const side of [-1, 1]) {
      const lamp = new Mesh(new BoxGeometry(0.34, 0.22, 0.1), glassMaterial);
      lamp.position.set(side * 0.85, 1.18, 5.94);
      bus.add(lamp);
    }

    // One wheel off the front left hub, so the bus sits lopsided and the hub is exposed.
    const wheels: [number, number][] = [
      [1.15, -3.9],
      [-1.15, -3.9],
      [1.15, 3.9],
    ];
    for (const [x, z] of wheels) {
      const wheel = new Mesh(new CylinderGeometry(0.52, 0.52, 0.34, 12), tyreMaterial);
      wheel.position.set(x, 0.52, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      bus.add(wheel);
    }
    const bareHub = new Mesh(new CylinderGeometry(0.26, 0.26, 0.2, 10), hubMaterial);
    bareHub.position.set(-1.15, 0.52, 3.9);
    bareHub.rotation.z = Math.PI / 2;
    bus.add(bareHub);

    // Kerb-side door, swung open on a hinge so it is genuinely ajar rather than a panel drawn on
    // the bodywork.
    const doorRecess = new Mesh(new BoxGeometry(0.06, 1.9, 1.05), bandMaterial);
    doorRecess.position.set(1.3, 1.62, 2.6);
    bus.add(doorRecess);
    const doorHinge = new Group();
    doorHinge.position.set(1.32, 1.62, 2.05);
    doorHinge.rotation.y = 0.6;
    bus.add(doorHinge);
    const doorPanel = new Mesh(new BoxGeometry(0.08, 1.9, 1.0), paintMaterial);
    doorPanel.position.set(0, 0, 0.5);
    doorPanel.castShadow = true;
    doorHinge.add(doorPanel);
    const doorGlass = new Mesh(new BoxGeometry(0.05, 0.8, 0.7), glassMaterial);
    doorGlass.position.set(0, 0.42, 0.5);
    doorHinge.add(doorGlass);

    // Rear: window and two tail lenses, both dim rather than lit.
    const rearWindow = new Mesh(new BoxGeometry(1.9, 0.5, 0.06), glassMaterial);
    rearWindow.position.set(0, 2.7, -5.9);
    bus.add(rearWindow);
    for (const side of [-1, 1]) {
      const lens = new Mesh(new BoxGeometry(0.26, 0.4, 0.08), tailMaterial);
      lens.position.set(side * 0.9, 1.1, -5.92);
      bus.add(lens);
    }

    // Damage. A panel peeled up off the front of the roof and a torn section hanging off the
    // front edge: the two cheapest reads that say "this has been here a while".
    const peeledPanel = new Mesh(new BoxGeometry(2.2, 0.1, 2.4), paintMaterial);
    peeledPanel.position.set(0.1, 3.35, 2.6);
    peeledPanel.rotation.set(0.22, 0, 0.14);
    peeledPanel.castShadow = true;
    bus.add(peeledPanel);
    const tornFront = new Mesh(new BoxGeometry(2.3, 0.5, 0.1), metalMaterial);
    tornFront.position.set(0, 3.0, 6.05);
    tornFront.rotation.x = -0.3;
    tornFront.castShadow = true;
    bus.add(tornFront);

    bus.userData.assetId = 'city-bus-wreck';
    return bus;
  },
};
