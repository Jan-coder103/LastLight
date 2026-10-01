import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Hand-crank water pump. Local +Z is the front of the pump, i.e. the side the crank handle swings
// out over; the spout points +X. A cast-iron village pump on a stone pad: a fluted column, a
// domed head, a long bent crank with a wooden grip, a brass-capped spout with a leather strap, and
// a bucket hooked on the spout. Small and tall — the crank is the silhouette.
const ironMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.3,
  flatShading: true,
});
ironMaterial.name = 'pump-iron';

const darkIronMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.85,
  metalness: 0.35,
  flatShading: true,
});
darkIronMaterial.name = 'pump-dark-iron';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'pump-rust';

const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'pump-timber';

const stoneMaterial = new MeshStandardMaterial({
  color: '#797762',
  roughness: 1,
  flatShading: true,
});
stoneMaterial.name = 'pump-stone';

const paleMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
paleMaterial.name = 'pump-pale';

const waterMaterial = new MeshStandardMaterial({
  color: '#4a5850',
  roughness: 0.35,
  metalness: 0.05,
});
waterMaterial.name = 'pump-water';

const UP = new Vector3(0, 1, 0);

function spanTo(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  material: MeshStandardMaterial,
): Mesh {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  const seg = new Mesh(new CylinderGeometry(radius, radius, dir.length(), 6), material);
  seg.quaternion.setFromUnitVectors(UP, dir.normalize());
  seg.position.copy(a).add(b).multiplyScalar(0.5);
  seg.castShadow = true;
  return seg;
}

const COLUMN_H = 1.06;
const HEAD_Y = COLUMN_H + 0.18;

export const candidateHandCrankPump: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-hand-crank-pump',
  name: 'Hand-Crank Water Pump',
  category: 'prop',
  dimensions: { x: 1.2, y: 1.7, z: 1.3 },
  collider: { center: { x: 0, y: 0.5, z: 0 }, size: { x: 0.5, y: 1.0, z: 0.5 } },
  interactionPoints: [
    { id: 'pump-crank', label: 'Hand-Crank Water Pump', position: { x: 0, y: 0, z: 0.62 } },
  ],
  createVisual(variant = 0) {
    const pump = new Group();
    const noBucket = variant === 1;
    const primed = variant === 2;

    // Stone pad and kerb: the pump stands on something, and the pad is what stops the column
    // reading as a pole pushed into the ground.
    const pad = new Mesh(new BoxGeometry(0.86, 0.12, 0.86), stoneMaterial);
    pad.position.set(0, 0.18, 0);
    pad.castShadow = true;
    pad.receiveShadow = true;
    pump.add(pad);
    const kerb = new Mesh(new BoxGeometry(0.98, 0.16, 0.98), paleMaterial);
    kerb.position.set(0, 0.08, 0);
    kerb.receiveShadow = true;
    pump.add(kerb);
    // A shallow wet patch on the pad, which is what says the pump has been worked recently.
    const wet = new Mesh(new BoxGeometry(0.5, 0.02, 0.44), waterMaterial);
    wet.position.set(0.1, 0.24, 0.05);
    pump.add(wet);

    // Column: a base flange, a fluted shaft, and a mid collar. The flutes are eight thin bars,
    // which is the cheapest way to make a cast column read as cast.
    const base = new Mesh(new BoxGeometry(0.38, 0.1, 0.38), darkIronMaterial);
    base.position.set(0, 0.29, 0);
    base.castShadow = true;
    pump.add(base);
    const column = new Mesh(new CylinderGeometry(0.14, 0.17, COLUMN_H, 10), ironMaterial);
    column.position.set(0, 0.34 + COLUMN_H / 2, 0);
    column.castShadow = true;
    column.receiveShadow = true;
    pump.add(column);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const flute = new Mesh(new BoxGeometry(0.045, COLUMN_H - 0.14, 0.045), ironMaterial);
      flute.position.set(Math.cos(a) * 0.155, 0.38 + COLUMN_H / 2, Math.sin(a) * 0.155);
      flute.rotation.y = -a;
      flute.castShadow = true;
      pump.add(flute);
    }
    const collar = new Mesh(new CylinderGeometry(0.19, 0.19, 0.07, 10), darkIronMaterial);
    collar.position.set(0, 0.84, 0);
    collar.castShadow = true;
    pump.add(collar);
    // Bolt heads around the collar, four meshes for the detail that says "engineered".
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const bolt = new Mesh(new CylinderGeometry(0.022, 0.022, 0.03, 5), darkIronMaterial);
      bolt.position.set(Math.cos(a) * 0.19, 0.84, Math.sin(a) * 0.19);
      bolt.rotation.x = Math.PI / 2;
      bolt.rotation.z = -a;
      pump.add(bolt);
    }

    // Domed head with a finial, then the crank bearing housing.
    const dome = new Mesh(new ConeGeometry(0.21, 0.26, 10), ironMaterial);
    dome.position.set(0, HEAD_Y, 0);
    dome.castShadow = true;
    pump.add(dome);
    const domeBand = new Mesh(new CylinderGeometry(0.22, 0.22, 0.05, 10), darkIronMaterial);
    domeBand.position.set(0, HEAD_Y - 0.12, 0);
    pump.add(domeBand);
    const finial = new Mesh(new ConeGeometry(0.05, 0.14, 6), darkIronMaterial);
    finial.position.set(0, HEAD_Y + 0.19, 0);
    finial.castShadow = true;
    pump.add(finial);
    const bearing = new Mesh(new BoxGeometry(0.2, 0.2, 0.24), darkIronMaterial);
    bearing.position.set(0, HEAD_Y - 0.02, 0.2);
    bearing.castShadow = true;
    pump.add(bearing);

    // Crank: an elbow arm out to +Z, a return bend, and a wooden grip on the free end. The arm is
    // three spans so it can droop in variant 2, where the crank has been bent.
    const droop = variant === 2 ? -0.22 : 0;
    const armPts: [number, number, number][] = [
      [0, HEAD_Y, 0.3],
      [0, HEAD_Y - 0.12, 0.46],
      [0, HEAD_Y - 0.16 + droop, 0.56],
    ];
    for (let i = 0; i < armPts.length - 1; i++) {
      pump.add(spanTo(armPts[i]!, armPts[i + 1]!, 0.028, darkIronMaterial));
    }
    const elbow = new Mesh(new CylinderGeometry(0.05, 0.05, 0.1, 6), darkIronMaterial);
    elbow.rotation.x = Math.PI / 2;
    elbow.position.set(0, HEAD_Y, 0.29);
    pump.add(elbow);
    const grip = new Mesh(new CylinderGeometry(0.032, 0.036, 0.16, 6), timberMaterial);
    grip.position.set(0, HEAD_Y - 0.14 + droop, 0.62);
    grip.rotation.x = Math.PI / 2;
    grip.castShadow = true;
    pump.add(grip);
    const gripCap = new Mesh(new CylinderGeometry(0.04, 0.04, 0.02, 6), darkIronMaterial);
    gripCap.rotation.x = Math.PI / 2;
    gripCap.position.set(0, HEAD_Y - 0.14 + droop, 0.7);
    pump.add(gripCap);

    // Spout out to +X: a short elbow, a flared lip, and a leather strap hanging from it.
    pump.add(spanTo([0.14, 0.34, 0], [0.3, 0.34, 0], 0.05, ironMaterial));
    pump.add(spanTo([0.3, 0.34, 0], [0.38, 0.3, 0], 0.045, ironMaterial));
    const spoutLip = new Mesh(new CylinderGeometry(0.055, 0.045, 0.09, 8), darkIronMaterial);
    spoutLip.position.set(0.4, 0.28, 0);
    spoutLip.rotation.z = 0.6;
    spoutLip.castShadow = true;
    pump.add(spoutLip);
    const spoutStrap = new Mesh(new BoxGeometry(0.05, 0.2, 0.04), timberMaterial);
    spoutStrap.position.set(0.4, 0.16, 0);
    spoutStrap.rotation.z = -0.2;
    spoutStrap.castShadow = true;
    pump.add(spoutStrap);
    // Variant 2: a stream of water from the spout into the wet patch, which is the only way to
    // show the pump is working.
    if (primed) {
      const stream = new Mesh(new CylinderGeometry(0.018, 0.03, 0.24, 6), waterMaterial);
      stream.position.set(0.44, 0.15, 0);
      stream.rotation.z = -0.2;
      pump.add(stream);
      const splash = new Mesh(new BoxGeometry(0.24, 0.02, 0.24), waterMaterial);
      splash.position.set(0.5, 0.25, 0);
      pump.add(splash);
    }
    // Rust weeps under the spout, two flat panels on the pad.
    const weep = new Mesh(new BoxGeometry(0.16, 0.02, 0.1), rustMaterial);
    weep.position.set(0.42, 0.25, 0);
    pump.add(weep);

    // Bucket. Variant 1 has it removed; variant 2 has it hung on the spout with water in it.
    if (!noBucket) {
      const bucketZ = primed ? 0.02 : 0.34;
      const bucket = new Mesh(new CylinderGeometry(0.15, 0.12, 0.26, 10, 1, true), rustMaterial);
      bucket.position.set(0.46, 0.25, bucketZ);
      bucket.castShadow = true;
      bucket.receiveShadow = true;
      pump.add(bucket);
      const bucketBase = new Mesh(new CylinderGeometry(0.12, 0.12, 0.02, 10), rustMaterial);
      bucketBase.position.set(0.46, 0.25, bucketZ);
      pump.add(bucketBase);
      const band = new Mesh(new TorusGeometry(0.15, 0.015, 4, 10), darkIronMaterial);
      band.rotation.x = Math.PI / 2;
      band.position.set(0.46, 0.37, bucketZ);
      pump.add(band);
      const handle = new Mesh(new TorusGeometry(0.14, 0.014, 4, 8, Math.PI), darkIronMaterial);
      handle.rotation.y = Math.PI / 2;
      handle.position.set(0.46, 0.38, bucketZ);
      pump.add(handle);
      if (primed) {
        const bucketWater = new Mesh(new CylinderGeometry(0.13, 0.13, 0.02, 10), waterMaterial);
        bucketWater.position.set(0.46, 0.32, bucketZ);
        pump.add(bucketWater);
      }
    }

    // Offcut pipe and a coil of wire on the pad: four meshes of "somebody left tools here".
    const offcut = new Mesh(new CylinderGeometry(0.07, 0.07, 0.4, 8), ironMaterial);
    offcut.rotation.set(0, 0.5, Math.PI / 2);
    offcut.position.set(-0.34, 0.28, 0.3);
    offcut.castShadow = true;
    pump.add(offcut);
    const offcutRim = new Mesh(new TorusGeometry(0.07, 0.012, 4, 8), darkIronMaterial);
    offcutRim.rotation.set(0, 0.5, Math.PI / 2);
    offcutRim.position.set(-0.14, 0.28, 0.2);
    pump.add(offcutRim);
    const wire = new Mesh(new TorusGeometry(0.1, 0.022, 4, 10), darkIronMaterial);
    wire.rotation.x = Math.PI / 2;
    wire.position.set(-0.3, 0.26, -0.3);
    wire.castShadow = true;
    pump.add(wire);

    pump.userData.assetId = 'candidate-hand-crank-pump';
    return pump;
  },
};
