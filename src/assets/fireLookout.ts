import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
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
// The legs continue through the deck slab and 0.11 m into the cabin base, so the cabin is
// carried by the frame instead of hovering over it.
const LEG_EXTEND = 0.75;
const LEG_TOP_Y = TOWER_H + LEG_EXTEND;

function halfAt(y: number): number {
  return BASE_HALF + ((TOP_HALF - BASE_HALF) * y) / TOWER_H;
}

export const fireLookout: AuthoredAsset = {
  schemaVersion: 1,
  id: 'fire-lookout',
  name: 'Fire Lookout Tower',
  category: 'landmark',
  // Measured (vertex-accurate) 4.4 x 19.3 x 4.4 across all three variants; declared with a small
  // margin over the deck rails (4.4) and the finial (19.25).
  dimensions: { x: 4.5, y: 19.4, z: 4.5 },
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

    // Four converging legs. The tower narrows from BASE_HALF at grade to TOP_HALF at the head, and
    // halfAt() is that leg line, so the lean must bring the leg top INBOARD: a Y-axis point
    // rotated about Z by a positive angle moves its top to -x (hence +sx), and about X it moves
    // the top to +z (hence -sz). The earlier negative signs splayed the tops outward, which left
    // every brace ring floating past or short of the legs and the deck standing on nothing.
    const legLean = Math.atan((BASE_HALF - halfAt(LEG_TOP_Y)) / LEG_TOP_Y);
    const legCenter = (BASE_HALF + halfAt(LEG_TOP_Y)) / 2;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new Mesh(new CylinderGeometry(0.17, 0.24, LEG_TOP_Y - 0.05, 6), legMaterial);
        leg.position.set(sx * legCenter, 0.05 + (LEG_TOP_Y - 0.05) / 2, sz * legCenter);
        leg.rotation.z = sx * legLean;
        leg.rotation.x = -sz * legLean;
        leg.castShadow = true;
        tower.add(leg);
        // Knee brace from the leg up to the deck's underside corner, carrying the catwalk
        // overhang the way a real lookout does.
        const kneeFrom = new Vector3(sx * halfAt(12.9), 12.9, sz * halfAt(12.9));
        const kneeTo = new Vector3(sx * 2.0, DECK_Y - 0.12, sz * 2.0);
        const knee = new Mesh(
          new BoxGeometry(0.12, kneeFrom.distanceTo(kneeTo) + 0.12, 0.12),
          legMaterial,
        );
        knee.position.copy(kneeFrom).add(kneeTo).multiplyScalar(0.5);
        knee.quaternion.setFromUnitVectors(
          new Vector3(0, 1, 0),
          kneeTo.clone().sub(kneeFrom).normalize(),
        );
        knee.castShadow = true;
        tower.add(knee);
      }
    }

    // Horizontal brace rings on the leg line, one per level, plus a true panel diagonal on the
    // +X face: a rod from the lower level's corner to this level's far corner, so both ends land
    // on the frame instead of ending in mid air.
    for (let level = 0; level < BRACE_Y.length; level++) {
      const y = BRACE_Y[level]!;
      const h = halfAt(y);
      // The lowest diagonal starts 5 cm up the leg: centred exactly on grade, its own 0.12 m
      // section tips below the ground plane.
      const yPrev = level === 0 ? 0.05 : BRACE_Y[level - 1]!;
      const hPrev = level === 0 ? halfAt(0.05) : halfAt(yPrev);
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
        const from = new Vector3(hPrev, yPrev, hPrev);
        const to = new Vector3(h, y, -h);
        const diag = new Mesh(new BoxGeometry(0.12, from.distanceTo(to), 0.12), legMaterial);
        diag.position.copy(from).add(to).multiplyScalar(0.5);
        diag.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), to.clone().sub(from).normalize());
        diag.castShadow = true;
        tower.add(diag);
      }
    }

    // Switchback stair: three flights inside the leg footprint, so the asset does not sprawl. A
    // single straight flight was measured at 14.3 m of Z extent, which is not a landmark footprint.
    // The top flight runs 4.85 m so its last tread lands inside the deck slab instead of 0.2 m
    // short of it.
    const FLIGHTS = [
      { z: 0.6, dir: 1, y0: 0.3, rise: 4.7 },
      { z: -0.6, dir: -1, y0: 5.0, rise: 4.7 },
      { z: 0.6, dir: 1, y0: 9.7, rise: 4.85 },
    ];
    const FLIGHT_RUN = 2.2;
    for (const flight of FLIGHTS) {
      const stringer = new Mesh(
        new BoxGeometry(0.14, Math.hypot(FLIGHT_RUN, flight.rise), 0.14),
        legMaterial,
      );
      stringer.position.set(0, flight.y0 + flight.rise / 2, flight.z);
      // dir = 1 climbs toward +X, which needs a negative rotation about Z.
      stringer.rotation.z = -flight.dir * Math.atan2(FLIGHT_RUN, flight.rise);
      stringer.castShadow = true;
      tower.add(stringer);
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const tread = new Mesh(new BoxGeometry(0.7, 0.1, 0.34), legMaterial);
        tread.position.set(
          flight.dir * (-FLIGHT_RUN / 2 + FLIGHT_RUN * t),
          flight.y0 + flight.rise * t,
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
