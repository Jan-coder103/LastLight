import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Collapsed pedestrian overpass, three spans on two intermediate piers. Ground at y = 0; the deck
// crosses in Z, so +Z is the direction of travel across it. One span has come down and lies on the
// ground in two broken chunks; the others still stand, one of them torn at its free end.
const deckMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1 }),
];
deckMaterials[0]!.name = 'concrete-deck';
deckMaterials[1]!.name = 'concrete-deck-dark';
deckMaterials[2]!.name = 'concrete-deck-worn';

const surfaceMaterial = new MeshStandardMaterial({ color: '#514f49', roughness: 1 });
surfaceMaterial.name = 'deck-surface';

const railMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.2,
});
railMaterial.name = 'rail-metal';

const rebarMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.85,
  metalness: 0.2,
});
rebarMaterial.name = 'rebar-rust';

const rubbleMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1 });
rubbleMaterial.name = 'rubble-concrete';

const DECK_Y = 4.8;
const DECK_W = 4.0;
const DECK_T = 0.45;
const PIER_Z = 4.4;
const ABUTMENT_Z = 12.3;

// One section of deck with its solid parapets, grouped so it can be tilted as a unit.
function deckSection(
  length: number,
  deckMaterial: MeshStandardMaterial,
  withSurface: boolean,
): Group {
  const section = new Group();
  const slab = new Mesh(new BoxGeometry(DECK_W, DECK_T, length), deckMaterial);
  slab.castShadow = true;
  slab.receiveShadow = true;
  section.add(slab);
  if (withSurface) {
    const surface = new Mesh(new BoxGeometry(DECK_W - 0.3, 0.08, length - 0.2), surfaceMaterial);
    surface.position.y = DECK_T / 2 + 0.04;
    section.add(surface);
  }
  for (const side of [-1, 1]) {
    const parapet = new Mesh(new BoxGeometry(0.26, 0.95, length), deckMaterial);
    parapet.position.set(side * (DECK_W / 2 - 0.13), DECK_T / 2 + 0.475, 0);
    parapet.castShadow = true;
    section.add(parapet);
  }
  return section;
}

// Torn reinforcement bars hanging from a broken deck end at (x=0, y, z), drooping toward +dirZ.
function tornRebar(y: number, z: number, dirZ: number): Group {
  const rebar = new Group();
  for (let i = 0; i < 4; i++) {
    const bar = new Mesh(new BoxGeometry(0.05, 0.55, 0.05), rebarMaterial);
    bar.position.set(-1.35 + i * 0.9, y - 0.28, z + dirZ * 0.12);
    bar.rotation.set(dirZ * (0.3 + i * 0.08), 0, 0.15);
    rebar.add(bar);
  }
  return rebar;
}

export const candidatePedestrianBridge: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-pedestrian-bridge',
  name: 'Collapsed Pedestrian Bridge',
  category: 'landmark',
  dimensions: { x: 5.8, y: 6.3, z: 27.0 },
  // Tall enough to cover the abutments and piers (4.8 m), which are unmistakably solid. The cost
  // is that the single box also fills the space beneath the standing spans, so the player walks
  // BESIDE the bridge rather than under it. See the review sheet for the multi-box alternative.
  collider: { center: { x: 0, y: 2.45, z: 0 }, size: { x: 3.9, y: 4.9, z: 26.4 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    const bridge = new Group();
    const deckMaterial = deckMaterials[variant % deckMaterials.length]!;
    // Which end came down. 0 and 2 drop the middle span; 1 drops the near one, so the silhouette
    // changes rather than just the debris.
    const nearDown = variant === 1;

    // Abutments at each end, carrying the end spans.
    for (const z of [-ABUTMENT_Z, ABUTMENT_Z]) {
      const abutment = new Mesh(new BoxGeometry(1.7, 4.6, 2.3), deckMaterial);
      abutment.position.set(0, 2.3, z);
      abutment.castShadow = true;
      abutment.receiveShadow = true;
      bridge.add(abutment);
    }

    // Two intermediate piers with caps. Piers survive a span failure, so both stay standing in
    // every variant; they are what make the crossing read as a real road bridge.
    for (const z of [-PIER_Z, PIER_Z]) {
      const column = new Mesh(new BoxGeometry(0.8, 4.35, 0.8), deckMaterial);
      column.position.set(0, 2.175, z);
      column.castShadow = true;
      bridge.add(column);
      const cap = new Mesh(new BoxGeometry(1.3, 0.35, 1.3), deckMaterial);
      cap.position.set(0, 4.52, z);
      cap.castShadow = true;
      bridge.add(cap);
    }

    // Far end span: intact in every variant, deck surface and parapets complete.
    const farSpanZ = -7.98;
    bridge.add(deckSection(6.35, deckMaterial, true).translateY(DECK_Y).translateZ(farSpanZ));

    if (!nearDown) {
      // Near end span still stands, torn where it tore away from the middle span: tilted down
      // slightly toward the gap, with rebar at the break. Rotation x is negative so the torn
      // (-Z) end droops while the seated end stays on the abutment.
      const nearSpan = deckSection(6.1, deckMaterial, true);
      nearSpan.position.set(0, DECK_Y - 0.26, 7.95);
      nearSpan.rotation.x = -0.08;
      bridge.add(nearSpan);
      bridge.add(tornRebar(DECK_Y - 0.85, 4.95, 1));

      // Middle span stubs still seated on each pier cap.
      for (const z of [-PIER_Z, PIER_Z]) {
        const stub = new Mesh(new BoxGeometry(DECK_W, DECK_T, 1.0), deckMaterial);
        stub.position.set(0, DECK_Y, z - Math.sign(z) * 0.1);
        stub.castShadow = true;
        bridge.add(stub);
      }
      bridge.add(tornRebar(DECK_Y - 0.7, -4.95, -1));

      // The fallen middle span lies below in two broken chunks, rotated apart.
      const chunkA = deckSection(4.4, deckMaterial, false);
      chunkA.position.set(0.3, 0.74, 1.3);
      chunkA.rotation.set(0.05, 0.22, 0.1);
      bridge.add(chunkA);
      const chunkB = deckSection(3.4, deckMaterial, false);
      chunkB.position.set(-0.35, 0.68, -2.7);
      chunkB.rotation.set(-0.06, -0.3, 0.13);
      bridge.add(chunkB);
    } else {
      // Variant 1: the near span came down instead. The middle span still crosses between the
      // piers but hinges down toward the missing end, torn at its free end. Rotation x is
      // positive so the free (+Z) end droops while the far end stays on its pier.
      const midSpan = deckSection(7.6, deckMaterial, true);
      midSpan.position.set(0, DECK_Y - 0.55, -0.45);
      midSpan.rotation.x = 0.14;
      bridge.add(midSpan);
      bridge.add(tornRebar(DECK_Y - 1.55, 3.2, 1));

      const chunkA = deckSection(3.6, deckMaterial, false);
      chunkA.position.set(0.3, 0.74, 6.2);
      chunkA.rotation.set(0.04, 0.26, 0.11);
      bridge.add(chunkA);
      const chunkB = deckSection(2.8, deckMaterial, false);
      chunkB.position.set(-0.4, 0.66, 9.1);
      chunkB.rotation.set(-0.07, -0.34, 0.15);
      bridge.add(chunkB);
    }

    // Spalled chunks around the impact zone, deterministic offsets only.
    for (const [x, z, w, h, d] of [
      [1.9, 2.6, 0.7, 0.5, 0.6],
      [-2.1, 0.2, 0.6, 0.4, 0.7],
      [2.3, -1.8, 0.55, 0.45, 0.55],
      [-1.7, -3.4, 0.5, 0.35, 0.5],
      [2.0, 4.4, 0.6, 0.4, 0.55],
      [-2.2, 5.4, 0.5, 0.35, 0.6],
    ] as const) {
      const chunk = new Mesh(new BoxGeometry(w, h, d), rubbleMaterial);
      chunk.position.set(x, h / 2 + 0.05, z);
      chunk.rotation.y = x * 2.1;
      chunk.castShadow = true;
      bridge.add(chunk);
    }

    // A bent guard rail on the road below, dropped and twisted.
    const bentRail = new Mesh(new BoxGeometry(0.1, 0.1, 2.2), railMaterial);
    bentRail.position.set(-2.45, 0.44, 1.6);
    bentRail.rotation.set(0.2, 0.4, 1.2);
    bentRail.castShadow = true;
    bridge.add(bentRail);

    bridge.userData.assetId = 'candidate-pedestrian-bridge';
    return bridge;
  },
};
