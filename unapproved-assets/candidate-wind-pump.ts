import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Old farm wind pump. Local +Z is the direction the rotor faces, i.e. into the wind. The wheel is
// carried on a bearing above the lattice frame and the tail vane steers it; the water tank stands
// beside the frame and a pipe run feeds it, so the tank is part of the pump rather than ballast.
// The frame is open, so the collider covers only the water tank.
const frameMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.85,
  metalness: 0.25,
  flatShading: true,
});
frameMaterial.name = 'pump-frame';

const bladeMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.2,
  flatShading: true,
});
bladeMaterial.name = 'blade-metal';

const rustMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.9,
  metalness: 0.15,
});
rustMaterial.name = 'rust-metal';

const tankMaterial = new MeshStandardMaterial({ color: '#655744', roughness: 1 });
tankMaterial.name = 'tank-timber';

const hubMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
hubMaterial.name = 'hub-metal';

const waterMaterial = new MeshStandardMaterial({ color: '#3d4a44', roughness: 0.4 });
waterMaterial.name = 'tank-water';

const BASE_HALF = 1.05;
const TOP_HALF = 0.42;
const TOWER_H = 5.0;
const WHEEL_Y = 5.42;
const WHEEL_Z = 0.45;
const WHEEL_R = 1.3;
const BLADES = 12;
const BLADE_PITCH = 0.38;
const TANK_Z = 1.55;

function halfAt(y: number): number {
  return BASE_HALF + ((TOP_HALF - BASE_HALF) * y) / TOWER_H;
}

export const candidateWindPump: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-wind-pump',
  name: 'Wind Pump',
  category: 'prop',
  // Measured (vertex-accurate): 2.81 x 6.74 x 3.77. The z bounds are asymmetric about the pivot
  // (the frame stands at z = 0 and the tank is behind it, out to z = 2.33), so the declared z
  // covers twice the largest offset. The earlier 3.9 cut the tank off.
  dimensions: { x: 3.0, y: 6.9, z: 4.7 },
  // The water tank only. The frame is open lattice and the wheel is overhead, so the player can
  // walk under the pump, which is what makes it a pleasant roadside object rather than a wall.
  collider: { center: { x: 0, y: 0.75, z: TANK_Z }, size: { x: 1.6, y: 1.5, z: 1.6 } },
  interactionPoints: [
    { id: 'windpump-base', label: 'Wind Pump', position: { x: 0, y: 0, z: 2.5 } },
  ],
  createVisual(variant = 0) {
    const pump = new Group();
    const bladeCount = variant === 1 ? 8 : BLADES;
    const missingVane = variant === 2;

    // Splayed lattice frame: four tapered legs with three brace levels, closing to a head plate
    // that carries the wheel bearing. The legs NARROW going up, from BASE_HALF at grade to
    // TOP_HALF at the head: a Y-axis point rotated about Z by +lean moves its top to -x, so the
    // sign must be +sx (negating it splays the tops outward, off the head plate). Rotation about
    // X moves the top to +z for a positive angle, hence -sz.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const lean = Math.atan((BASE_HALF - TOP_HALF) / TOWER_H);
        const leg = new Mesh(new CylinderGeometry(0.06, 0.09, TOWER_H, 6), frameMaterial);
        leg.position.set(
          (sx * (BASE_HALF + TOP_HALF)) / 2,
          TOWER_H / 2,
          (sz * (BASE_HALF + TOP_HALF)) / 2,
        );
        leg.rotation.z = sx * lean;
        leg.rotation.x = -sz * lean;
        leg.castShadow = true;
        pump.add(leg);
        // Foot pad, so the leg meets the ground on something rather than a point.
        const pad = new Mesh(new BoxGeometry(0.26, 0.08, 0.26), frameMaterial);
        pad.position.set(sx * BASE_HALF, 0.04, sz * BASE_HALF);
        pad.receiveShadow = true;
        pump.add(pad);
      }
    }
    for (const y of [1.5, 3.2, 4.75]) {
      const h = halfAt(y);
      for (const sz of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(h * 2, 0.08, 0.08), frameMaterial);
        bar.position.set(0, y, sz * h);
        pump.add(bar);
      }
      for (const sx of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(0.08, 0.08, h * 2), frameMaterial);
        bar.position.set(sx * h, y, 0);
        pump.add(bar);
      }
    }
    // Head plate and bearing: what actually holds the wheel, so nothing floats.
    const headPlate = new Mesh(
      new BoxGeometry(TOP_HALF * 2.3, 0.09, TOP_HALF * 2.3),
      frameMaterial,
    );
    headPlate.position.y = TOWER_H;
    headPlate.castShadow = true;
    pump.add(headPlate);
    const bearing = new Mesh(new BoxGeometry(0.26, 0.34, 0.6), frameMaterial);
    bearing.position.set(0, TOWER_H + 0.2, WHEEL_Z - 0.25);
    bearing.castShadow = true;
    pump.add(bearing);

    // Rotor: hub disc on a short axle held in the bearing block, a rim band, and a ring of
    // pitched flat slats. Twelve blades is the most that still reads as a wheel at play
    // distance; variant 1 is down to eight, which reads as a stripped unit.
    const axle = new Mesh(new CylinderGeometry(0.07, 0.07, 0.55, 6), hubMaterial);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(0, WHEEL_Y, 0.18);
    pump.add(axle);
    const hub = new Mesh(new CylinderGeometry(0.22, 0.22, 0.16, 10), hubMaterial);
    hub.position.set(0, WHEEL_Y, WHEEL_Z);
    hub.rotation.x = Math.PI / 2;
    hub.castShadow = true;
    pump.add(hub);
    const rimBand = new Mesh(new TorusGeometry(WHEEL_R, 0.045, 6, 14), bladeMaterial);
    rimBand.position.set(0, WHEEL_Y, WHEEL_Z);
    rimBand.castShadow = true;
    pump.add(rimBand);
    for (let i = 0; i < bladeCount; i++) {
      // Each slat sits in a pivot group at the hub so the pitch rotation stays about the blade's
      // own radial axis.
      const pivot = new Group();
      pivot.position.set(0, WHEEL_Y, WHEEL_Z);
      pivot.rotation.z = (i / bladeCount) * Math.PI * 2;
      const blade = new Mesh(new BoxGeometry(1.06, 0.16, 0.04), bladeMaterial);
      blade.position.set(WHEEL_R - 0.51, 0, 0.02);
      blade.rotation.x = BLADE_PITCH;
      blade.castShadow = true;
      pivot.add(blade);
      pump.add(pivot);
    }

    // Tail frame behind the rotor: two angle rods bolted INTO the hub disc and running back to a
    // vane with cross bars. Its absence in variant 2 is what says the pump has been stripped for
    // parts.
    if (!missingVane) {
      const vaneZ = -1.35;
      for (const sx of [-1, 1]) {
        const rod = new Mesh(new BoxGeometry(0.05, 0.05, 1.8), frameMaterial);
        rod.position.set(sx * 0.2, WHEEL_Y, -0.45);
        rod.rotation.x = sx * 0.04;
        pump.add(rod);
      }
      const vane = new Mesh(new BoxGeometry(1.05, 0.7, 0.05), rustMaterial);
      vane.position.set(0, WHEEL_Y + 0.12, vaneZ - 0.03);
      vane.rotation.x = 0.1;
      vane.castShadow = true;
      pump.add(vane);
      for (const sy of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(0.95, 0.05, 0.03), frameMaterial);
        bar.position.set(0, WHEEL_Y + 0.12 + sy * 0.2, vaneZ + 0.01);
        bar.rotation.x = 0.1;
        pump.add(bar);
      }
    }

    // Water tank beside the frame: staved timber body, two hoops, open top with dark water, and a
    // timber lid leaning against it. This is the tank the collider covers.
    const tank = new Mesh(new CylinderGeometry(0.72, 0.78, 1.4, 10), tankMaterial);
    tank.position.set(0, 0.7, TANK_Z);
    tank.castShadow = true;
    tank.receiveShadow = true;
    pump.add(tank);
    // Hoops follow the staves' taper: the body narrows from 0.78 at the base to 0.72 at the rim,
    // so each hoop's radius is set just proud of the wall radius at its own height. A single
    // radius left the lower hoop buried inside the staves.
    for (const [y, r] of [
      [0.45, 0.775],
      [1.0, 0.752],
    ] as const) {
      const hoop = new Mesh(new CylinderGeometry(r, r, 0.06, 10), hubMaterial);
      hoop.position.set(0, y, TANK_Z);
      pump.add(hoop);
    }
    const rimTop = new Mesh(new CylinderGeometry(0.75, 0.75, 0.07, 10), tankMaterial);
    rimTop.position.set(0, 1.43, TANK_Z);
    pump.add(rimTop);
    const water = new Mesh(new CylinderGeometry(0.68, 0.68, 0.05, 10), waterMaterial);
    water.position.set(0, 1.32, TANK_Z);
    pump.add(water);
    const lid = new Mesh(new CylinderGeometry(0.34, 0.4, 0.08, 8), tankMaterial);
    lid.position.set(0.94, 0.12, 0.62);
    lid.rotation.set(0.1, 0.4, 0.06);
    lid.castShadow = true;
    pump.add(lid);

    // Pump head under the wheel and the pipe run down the frame. The horizontal run crosses the
    // tank's near wall ABOVE the rim (1.62 vs rim top 1.465), then a short spout angles down
    // inside the rim and discharges over the water — the pipe clears the timber instead of
    // clipping through it.
    const pumpHead = new Mesh(new BoxGeometry(0.36, 0.5, 0.5), rustMaterial);
    pumpHead.position.set(0, TOWER_H - 0.25, 0.1);
    pumpHead.castShadow = true;
    pump.add(pumpHead);
    const downPipe = new Mesh(new CylinderGeometry(0.05, 0.05, 2.95, 6), frameMaterial);
    downPipe.position.set(0, 3.08, 0.1);
    downPipe.castShadow = true;
    pump.add(downPipe);
    const elbow = new Mesh(new CylinderGeometry(0.05, 0.05, 1.16, 6), frameMaterial);
    elbow.rotation.x = Math.PI / 2;
    elbow.position.set(0, 1.62, 0.7);
    elbow.castShadow = true;
    pump.add(elbow);
    const spout = new Mesh(new CylinderGeometry(0.05, 0.07, 0.42, 6), frameMaterial);
    spout.rotation.x = -0.62;
    spout.position.set(0, 1.51, 1.365);
    pump.add(spout);

    pump.userData.assetId = 'candidate-wind-pump';
    return pump;
  },
};
