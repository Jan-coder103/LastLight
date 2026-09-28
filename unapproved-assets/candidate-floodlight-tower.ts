import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Portable floodlight tower, TRAILER variant (the idea allows a trailer or a tripod; a trailer was
// chosen so this does not read as a second wind pump, since both are masts on lattice frames).
// Local +Z is the tow direction, so -Z is where the mast and lamp head sit.
const frameMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.85,
  metalness: 0.25,
  flatShading: true,
});
frameMaterial.name = 'tower-frame';

const bodyMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 0.9 });
bodyMaterial.name = 'trailer-body';

const lampMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.34,
  emissive: '#7d6128',
  emissiveIntensity: 0.7,
});
lampMaterial.name = 'floodlight-lens';

const deadMaterial = new MeshStandardMaterial({ color: '#3a3630', roughness: 0.9 });
deadMaterial.name = 'floodlight-dead';

const tyreMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
tyreMaterial.name = 'wheel-tyre';

const MAST_TOP = 5.2;

export const candidateFloodlightTower: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-floodlight-tower',
  name: 'Portable Floodlight Tower',
  category: 'prop',
  dimensions: { x: 3.1, y: 5.7, z: 4.4 },
  // Chassis, outriggers, and the generator cabinet only. The mast and lamp head are overhead and
  // the player can walk under them, which is the point of a portable unit. Same judgement as the
  // wind pump and the radar dish.
  collider: { center: { x: 0, y: 0.7, z: -0.2 }, size: { x: 2.5, y: 1.4, z: 2.6 } },
  interactionPoints: [
    { id: 'floodlight-generator', label: 'Floodlight Unit', position: { x: 0, y: 0, z: 1.7 } },
  ],
  createVisual(variant = 0) {
    const tower = new Group();
    // Variant 0 works, 1 has the lamps out, 2 has the mast lowered. Only variant 0 emits light.
    const working = variant === 0;
    const mastDown = variant === 2;

    // Chassis and generator cabinet.
    const chassis = new Mesh(new BoxGeometry(1.9, 0.24, 2.4), frameMaterial);
    chassis.position.set(0, 0.62, 0);
    chassis.castShadow = true;
    tower.add(chassis);
    const cabinet = new Mesh(new BoxGeometry(1.5, 0.9, 1.5), bodyMaterial);
    cabinet.position.set(0, 1.2, 0.15);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    tower.add(cabinet);
    // Louvre slats, the detail that says "generator" rather than "box".
    for (let i = 0; i < 3; i++) {
      const louvre = new Mesh(new BoxGeometry(1.2, 0.07, 0.05), frameMaterial);
      louvre.position.set(0, 1.0 + i * 0.2, 0.92);
      tower.add(louvre);
    }

    // Two wheels and a tow hitch, which is what makes this a trailer rather than a mast on legs.
    for (const x of [-1.0, 1.0]) {
      const wheel = new Mesh(new CylinderGeometry(0.34, 0.34, 0.22, 10), tyreMaterial);
      wheel.position.set(x, 0.34, -0.5);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      tower.add(wheel);
    }
    const drawbar = new Mesh(new BoxGeometry(0.16, 0.14, 1.1), frameMaterial);
    drawbar.position.set(0, 0.55, 1.75);
    drawbar.castShadow = true;
    tower.add(drawbar);
    const hitch = new Mesh(new CylinderGeometry(0.11, 0.11, 0.16, 8), frameMaterial);
    hitch.position.set(0, 0.55, 2.3);
    tower.castShadow = true;
    tower.add(hitch);

    // Outriggers, splayed and dropped, which is what stops the trailer looking like it would tip.
    for (const [x, z] of [
      [-1.35, -0.9],
      [1.35, -0.9],
      [-1.35, 0.9],
      [1.35, 0.9],
    ] as const) {
      const leg = new Mesh(new BoxGeometry(0.12, 0.9, 0.12), frameMaterial);
      leg.position.set(x * 0.85, 0.45, z * 0.8);
      leg.rotation.z = -Math.sign(x) * 0.3;
      leg.castShadow = true;
      tower.add(leg);
      const foot = new Mesh(new BoxGeometry(0.3, 0.08, 0.3), frameMaterial);
      foot.position.set(x, 0.04, z);
      foot.receiveShadow = true;
      tower.add(foot);
    }

    // Mast: two uprights and three cross rungs, tilted back in variant 2 as if lowered for
    // transport. A single tilted group means nothing can drift out of alignment.
    const mast = new Group();
    mast.position.set(0, 1.6, -0.9);
    mast.rotation.x = mastDown ? 1.25 : 0.08;
    tower.add(mast);
    for (const x of [-0.28, 0.28]) {
      const upright = new Mesh(new BoxGeometry(0.12, MAST_TOP - 1.6, 0.12), frameMaterial);
      upright.position.set(x, (MAST_TOP - 1.6) / 2, 0);
      upright.castShadow = true;
      mast.add(upright);
    }
    for (let i = 1; i <= 3; i++) {
      const rung = new Mesh(new BoxGeometry(0.68, 0.09, 0.09), frameMaterial);
      rung.position.set(0, ((MAST_TOP - 1.6) * i) / 4, 0);
      mast.add(rung);
    }

    // Lamp head: a cross frame carrying four blocky lamps. "A few blocky lamps" is the idea's own
    // wording, so boxes are the correct form.
    const head = new Group();
    head.position.set(0, MAST_TOP - 1.6 + 0.1, 0.1);
    mast.add(head);
    for (const [w, d] of [
      [1.5, 0.1],
      [0.1, 0.7],
    ] as const) {
      const bar = new Mesh(new BoxGeometry(w, 0.1, d), frameMaterial);
      head.add(bar);
    }
    for (const [x, y] of [
      [-0.52, 0.16],
      [0.52, 0.16],
      [-0.52, -0.16],
      [0.52, -0.16],
    ] as const) {
      const housing = new Mesh(new BoxGeometry(0.44, 0.28, 0.3), bodyMaterial);
      housing.position.set(x, y, 0.16);
      housing.castShadow = true;
      head.add(housing);
      const lens = new Mesh(
        new BoxGeometry(0.36, 0.2, 0.05),
        working ? lampMaterial : deadMaterial,
      );
      lens.position.set(x, y, 0.33);
      head.add(lens);
    }

    // One real light, not four. buildWorld clones per placement, so four lights each would be the
    // heaviest per-instance cost in the batch. A single PointLight at the head carries the same
    // read at a quarter of the budget. The lenses stay emissive so the head still reads as lit in
    // daylight, which is the approach the street light established.
    if (working) {
      const bulb = new PointLight('#ffd7a0', 14, 22, 2);
      bulb.position.set(0, MAST_TOP - 1.5, 0.5);
      bulb.castShadow = false;
      bulb.name = 'floodlight-bulb';
      tower.add(bulb);
    }

    tower.userData.assetId = 'candidate-floodlight-tower';
    return tower;
  },
};
