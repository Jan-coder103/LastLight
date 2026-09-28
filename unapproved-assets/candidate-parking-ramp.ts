import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Parking garage ramp section. Local +Z is the top of the ramp (the way out), y = 0 is the low
// end. The deck ascends toward +Z at about 13 degrees.
const deckMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1 }),
];
deckMaterials[0]!.name = 'concrete-ramp';
deckMaterials[1]!.name = 'concrete-ramp-dark';
deckMaterials[2]!.name = 'concrete-ramp-worn';

const kerbMaterial = new MeshStandardMaterial({ color: '#aaa18f', roughness: 1 });
kerbMaterial.name = 'kerb-concrete';

const wallMaterial = new MeshStandardMaterial({ color: '#77796a', roughness: 1 });
wallMaterial.name = 'retaining-wall';

const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
steelMaterial.name = 'barrier-steel';

const darkMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 0.9 });
darkMaterial.name = 'trim-dark';

const signalMaterial = new MeshStandardMaterial({ color: '#c5ad70', roughness: 0.9 });
signalMaterial.name = 'signal-amber';

const rebarMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.85,
  metalness: 0.2,
});
rebarMaterial.name = 'rebar-rust';

const WIDTH = 6.6;
const SLOPE = 0.232;
const DECK_THICK = 0.4;
const DECK_HALF_LEN = 5.515;
// Height that puts the low end of the deck just clear of the ground, leaving a small lip.
const SLOPE_GROUP_Y = 1.5;

export const candidateParkingRamp: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-parking-ramp',
  name: 'Parking Garage Ramp',
  category: 'prop',
  dimensions: { x: 7.7, y: 4.0, z: 11.0 },
  // A single box is a poor fit for a sloped deck: this covers the ramp's bounding volume, so the
  // player is blocked out of the whole wedge. Flagged in the review sheet as a known limitation
  // for the placement system, which may want a ramp or heightfield collider instead.
  collider: { center: { x: 0, y: 1.7, z: 0 }, size: { x: 6.9, y: 3.4, z: 11.0 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    const ramp = new Group();
    const deckMaterial = deckMaterials[variant % deckMaterials.length]!;
    const barrierOnRight = variant !== 1;
    const rampDown = variant === 2;

    // Everything that follows the slope lives in one tilted group, so kerbs, wall, barrier and
    // arrow are parallel to the deck by construction. Placing them in world space with tan()
    // offsets instead put the retaining wall 0.84 m underground.
    //
    // Rotation about +X by a positive angle drops the +Z end, so the group is rotated NEGATIVE to
    // climb toward +Z.
    const slope = new Group();
    slope.rotation.x = -SLOPE;
    slope.position.y = SLOPE_GROUP_Y;
    ramp.add(slope);

    const deck = new Mesh(new BoxGeometry(WIDTH, DECK_THICK, DECK_HALF_LEN * 2), deckMaterial);
    deck.castShadow = true;
    deck.receiveShadow = true;
    slope.add(deck);

    // Chipped kerbs: three short segments per side with gaps and uneven drops, which reads as
    // spalled concrete far better than a continuous rail would.
    for (const side of [-1, 1]) {
      for (const [z, len, drop] of [
        [-4.3, 2.2, 0],
        [-1.7, 1.9, -0.06],
        [1.4, 3.4, 0.05],
      ] as const) {
        const kerb = new Mesh(new BoxGeometry(0.36, 0.5, len), kerbMaterial);
        kerb.position.set(side * (WIDTH / 2 + 0.18), 0.2 + drop, z);
        kerb.rotation.z = side * (z === -1.7 ? 0.06 : 0);
        kerb.castShadow = true;
        slope.add(kerb);
      }
    }

    // Partial guard barrier: three posts and a rail covering only the LOWER half, so the top of
    // the ramp is deliberately unguarded. "Partial" is in the brief, so it is modelled, not faked.
    const barrierSide = barrierOnRight ? 1 : -1;
    for (const z of [-4.2, -1.9, 0.4]) {
      const post = new Mesh(new BoxGeometry(0.16, 1.05, 0.16), steelMaterial);
      post.position.set(barrierSide * (WIDTH / 2 + 0.18), 0.72, z);
      post.castShadow = true;
      slope.add(post);
    }
    const rail = new Mesh(new BoxGeometry(0.12, 0.24, 5.6), steelMaterial);
    rail.position.set(barrierSide * (WIDTH / 2 + 0.18), 1.18, -1.9);
    rail.castShadow = true;
    slope.add(rail);

    // Upstand wall along the opposite edge. It sits ON the deck rather than hanging below it, so
    // nothing disappears underground at the low end where there is no clearance.
    const wall = new Mesh(new BoxGeometry(0.34, 1.05, DECK_HALF_LEN * 2 - 0.2), wallMaterial);
    wall.position.set(-barrierSide * (WIDTH / 2 + 0.42), 0.72, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    slope.add(wall);

    // Dark underside trim, so the ramp does not read as a floating slab from a low camera.
    const soffit = new Mesh(
      new BoxGeometry(WIDTH - 0.5, 0.06, DECK_HALF_LEN * 2 - 0.4),
      darkMaterial,
    );
    soffit.position.y = -DECK_THICK / 2 - 0.02;
    slope.add(soffit);

    // Faded direction arrow painted on the deck. Small, warm and functional: exactly the
    // restricted use of a high-contrast colour the style guide allows. Variant 2 turns the whole
    // arrow round rather than mirroring the headpiece.
    const arrow = new Group();
    if (rampDown) arrow.rotation.y = Math.PI;
    slope.add(arrow);
    const arrowShaft = new Mesh(new BoxGeometry(0.42, 0.04, 2.1), signalMaterial);
    arrowShaft.position.set(0, 0.24, 2.2);
    arrow.add(arrowShaft);
    const arrowHead = new Mesh(new BoxGeometry(1.15, 0.04, 1.15), signalMaterial);
    arrowHead.position.set(0, 0.24, 3.5);
    arrowHead.rotation.y = Math.PI / 4;
    arrow.add(arrowHead);

    // Exposed rebar at the chipped kerb, the detail that sells the decay.
    for (const z of [-1.72, -1.55]) {
      const bar = new Mesh(new BoxGeometry(0.5, 0.05, 0.05), rebarMaterial);
      bar.position.set(WIDTH / 2 + 0.24, 0.46, z);
      bar.rotation.z = 0.35;
      slope.add(bar);
    }

    // Low ceiling and columns at the low end, so the ramp reads as the way OUT of a structure.
    // These stay in world space because they are upright, not sloped.
    const ceiling = new Mesh(new BoxGeometry(WIDTH + 0.9, 0.4, 3.2), wallMaterial);
    ceiling.position.set(0, 3.2, -3.9);
    ceiling.castShadow = true;
    ramp.add(ceiling);
    for (const side of [-1, 1]) {
      const column = new Mesh(new BoxGeometry(0.4, 3.2, 0.4), wallMaterial);
      column.position.set(side * (WIDTH / 2 - 0.1), 1.6, -5.3);
      column.castShadow = true;
      ramp.add(column);
    }

    ramp.userData.assetId = 'candidate-parking-ramp';
    return ramp;
  },
};
