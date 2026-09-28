import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Fire lookout tower. Local +Z is the side the cabin door and the deck are on. Deliberately taller
// than the existing 16 m water tower, because a lookout has to see over things.
const legMaterials = [
  new MeshStandardMaterial({ color: '#594332', roughness: 1 }),
  new MeshStandardMaterial({ color: '#514437', roughness: 1 }),
  new MeshStandardMaterial({ color: '#4b4035', roughness: 1 }),
];
legMaterials[0]!.name = 'tower-timber';
legMaterials[1]!.name = 'tower-timber-dark';
legMaterials[2]!.name = 'tower-timber-worn';

const cabinMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
  new MeshStandardMaterial({ color: '#9b624d', roughness: 1 }),
];
cabinMaterials[0]!.name = 'cabin-grey';
cabinMaterials[1]!.name = 'cabin-dark';
cabinMaterials[2]!.name = 'cabin-faded-red';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-dark';

const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.25,
  metalness: 0.05,
});
glassMaterial.name = 'window-glass';

const railMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.82,
  metalness: 0.25,
});
railMaterial.name = 'rail-metal';

const BASE_HALF = 1.9;
const TOP_HALF = 1.35;
const TOWER_H = 14.0;
const BRACE_Y = [3.2, 7.0, 10.8];
const DECK_Y = 14.6;
const CABIN_HALF = 1.6;

function halfAt(y: number): number {
  return BASE_HALF + ((TOP_HALF - BASE_HALF) * y) / TOWER_H;
}

export const candidateFireLookout: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-fire-lookout',
  name: 'Fire Lookout Tower',
  category: 'landmark',
  dimensions: { x: 4.7, y: 19.4, z: 4.7 },
  // Solid from the ground to the cabin, covering the leg volume. This is the same judgement as the
  // collapsed bridge: a 3.8 m square of four legs cannot be half-solid with one box, and walking
  // through a visible leg is a worse lie than not being able to walk under the tower.
  collider: { center: { x: 0, y: 7.4, z: 0 }, size: { x: 3.8, y: 14.8, z: 3.8 } },
  interactionPoints: [
    { id: 'tower-stair', label: 'Lookout Stair', position: { x: 0, y: 0, z: 2.2 } },
  ],
  createVisual(variant = 0) {
    const tower = new Group();
    const legMaterial = legMaterials[variant % legMaterials.length]!;
    const cabinMaterial = cabinMaterials[variant % cabinMaterials.length]!;
    const missingBrace = variant === 2;

    // Four splayed legs. Each is one tapered 6-sided cylinder, so the taper lives in the geometry
    // instead of in eight separate posts.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new Mesh(new CylinderGeometry(0.17, 0.24, TOWER_H, 6), legMaterial);
        leg.position.set(
          (sx * (BASE_HALF + TOP_HALF)) / 2,
          TOWER_H / 2 + 0.05,
          (sz * (BASE_HALF + TOP_HALF)) / 2,
        );
        leg.rotation.z = -sx * 0.08;
        leg.rotation.x = sz * 0.08;
        leg.castShadow = true;
        tower.add(leg);
      }
    }

    // Horizontal brace rings, one diagonal per level on the +X face. The diagonal spans from the
    // level below to this level, so its angle and length are derived from the actual rise and the
    // face width at that height rather than hard-coded as a 45 degree bar.
    for (const y of BRACE_Y) {
      const h = halfAt(y);
      for (const sz of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(h * 2, 0.16, 0.14), legMaterial);
        bar.position.set(0, y, sz * h);
        bar.castShadow = true;
        tower.add(bar);
      }
      for (const sx of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(0.14, 0.16, h * 2), legMaterial);
        bar.position.set(sx * h, y, 0);
        bar.castShadow = true;
        tower.add(bar);
      }
      if (!missingBrace || y !== BRACE_Y[1]) {
        const rise = y - (y === BRACE_Y[0] ? 0 : BRACE_Y[BRACE_Y.indexOf(y) - 1]!);
        const run = h * 2;
        const diag = new Mesh(new BoxGeometry(0.11, Math.hypot(rise, run), 0.11), legMaterial);
        // A brace lying ON the +X face must tilt WITHIN that face, i.e. in the ZY plane, so it is
        // rotated about X. Rotating it about Z instead tilts it across the face and throws the
        // ends out to x = 3.6, well past the 2.2 m deck.
        // Lifted 6 cm: the lowest diagonal reaches grade, and its own 0.11 m section tips 4 cm
        // through the ground if it is centred exactly on the rise.
        diag.position.set(h, y - rise / 2 + 0.06, 0);
        diag.rotation.x = Math.atan2(run, rise);
        diag.castShadow = true;
        tower.add(diag);
      }
    }

    // Switchback stair: three flights inside the leg footprint, so the asset does not sprawl. A
    // single straight flight was measured at 14.3 m of Z extent, which is not a landmark footprint.
    const FLIGHTS = [
      { z: 0.6, dir: 1, y0: 0.3 },
      { z: -0.6, dir: -1, y0: 5.0 },
      { z: 0.6, dir: 1, y0: 9.7 },
    ];
    const FLIGHT_RUN = 2.2;
    const FLIGHT_RISE = 4.7;
    for (const flight of FLIGHTS) {
      const stringer = new Mesh(
        new BoxGeometry(0.14, Math.hypot(FLIGHT_RUN, FLIGHT_RISE), 0.14),
        legMaterial,
      );
      stringer.position.set(0, flight.y0 + FLIGHT_RISE / 2, flight.z);
      // dir = 1 climbs toward +X, which needs a negative rotation about Z.
      stringer.rotation.z = -flight.dir * Math.atan2(FLIGHT_RUN, FLIGHT_RISE);
      stringer.castShadow = true;
      tower.add(stringer);
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const tread = new Mesh(new BoxGeometry(0.7, 0.1, 0.34), legMaterial);
        tread.position.set(
          flight.dir * (-FLIGHT_RUN / 2 + FLIGHT_RUN * t),
          flight.y0 + FLIGHT_RISE * t,
          flight.z,
        );
        tread.castShadow = true;
        tower.add(tread);
      }
    }
    for (const y of [5.0, 9.7]) {
      const landing = new Mesh(new BoxGeometry(2.4, 0.12, 1.5), legMaterial);
      landing.position.set(0, y, 0);
      landing.castShadow = true;
      tower.add(landing);
    }

    // Catwalk deck around the cabin, with a railing. The deck overhang is a large part of the
    // lookout's silhouette, so it earns its box.
    const deck = new Mesh(new BoxGeometry(4.4, 0.18, 4.4), legMaterial);
    deck.position.y = DECK_Y;
    deck.castShadow = true;
    deck.receiveShadow = true;
    tower.add(deck);
    for (const [sx, sz, w, d] of [
      [0, 1, 4.4, 0.12],
      [0, -1, 4.4, 0.12],
      [1, 0, 0.12, 4.4],
      [-1, 0, 0.12, 4.4],
    ] as const) {
      const rail = new Mesh(new BoxGeometry(w, 0.1, d), railMaterial);
      rail.position.set(sx * 2.14, DECK_Y + 1.0, sz * 2.14);
      rail.castShadow = true;
      tower.add(rail);
      for (const along of [-1.4, 1.4]) {
        const post = new Mesh(new BoxGeometry(0.1, 1.0, 0.1), railMaterial);
        post.position.set(
          sx * 2.14 + (sx === 0 ? along : 0),
          DECK_Y + 0.5,
          sz * 2.14 + (sz === 0 ? along : 0),
        );
        tower.add(post);
      }
    }

    // Enclosed cabin: solid lower wall, continuous glazing band, solid top. The band wraps all four
    // sides, which is the defining feature of a lookout and why it reads from a long way off.
    const cabinBase = new Mesh(new BoxGeometry(CABIN_HALF * 2, 0.9, CABIN_HALF * 2), cabinMaterial);
    cabinBase.position.y = DECK_Y + 0.55;
    cabinBase.castShadow = true;
    cabinBase.receiveShadow = true;
    tower.add(cabinBase);

    const glazing = new Mesh(
      new BoxGeometry(CABIN_HALF * 2 - 0.08, 1.2, CABIN_HALF * 2 - 0.08),
      glassMaterial,
    );
    glazing.position.y = DECK_Y + 1.6;
    tower.add(glazing);
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      const post = new Mesh(new BoxGeometry(0.16, 1.2, 0.16), cabinMaterial);
      post.position.set(sx * (CABIN_HALF - 0.08), DECK_Y + 1.6, sz * (CABIN_HALF - 0.08));
      tower.add(post);
    }

    const cabinTop = new Mesh(new BoxGeometry(CABIN_HALF * 2, 0.35, CABIN_HALF * 2), cabinMaterial);
    cabinTop.position.y = DECK_Y + 2.2;
    cabinTop.castShadow = true;
    tower.add(cabinTop);

    // Four-sided pyramid roof, overhanging the cabin and the catwalk.
    const roof = new Mesh(new CylinderGeometry(0.35, 3.1, 1.5, 4), roofMaterial);
    roof.position.y = DECK_Y + 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    tower.add(roof);
    const finial = new Mesh(new CylinderGeometry(0.07, 0.07, 0.9, 5), railMaterial);
    finial.position.y = DECK_Y + 4.2;
    tower.add(finial);

    tower.userData.assetId = 'candidate-fire-lookout';
    return tower;
  },
};
