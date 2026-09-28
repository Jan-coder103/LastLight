import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Raised hunting blind. The "narrow viewing slits" from the idea are REAL gaps: each wall is
// built as two boxes with a 0.13 m slot between them, so you can see through the blind.
const timberMaterials = [
  new MeshStandardMaterial({ color: '#4b4035', roughness: 1 }),
  new MeshStandardMaterial({ color: '#514437', roughness: 1 }),
  new MeshStandardMaterial({ color: '#594332', roughness: 1 }),
];
timberMaterials[0]!.name = 'blind-timber';
timberMaterials[1]!.name = 'blind-timber-dark';
timberMaterials[2]!.name = 'blind-timber-worn';

const deckMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 1 });
deckMaterial.name = 'platform-deck';

const roofMaterial = new MeshStandardMaterial({
  color: '#626753',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-sheet';

const interiorMaterial = new MeshStandardMaterial({ color: '#2a251f', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const PLATFORM_Y = 1.7;
const HUT_HALF = 1.1;
const WALL_TOP = 3.6;
const SLIT_Y = 3.15;
const SLIT_H = 0.13;
const WALL_T = 0.12;

export const candidateHuntingBlind: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-hunting-blind',
  name: 'Hunting Blind',
  category: 'prop',
  dimensions: { x: 2.9, y: 4.1, z: 3.3 },
  // Base and deck only. The hut interior is deliberately not solid, so if the game ever gains a
  // climb or ladder interaction the player can stand in the blind. The posts are covered, so the
  // player cannot walk under it.
  collider: { center: { x: 0, y: 0.85, z: 0 }, size: { x: 2.5, y: 1.7, z: 2.5 } },
  interactionPoints: [
    { id: 'hide-ladder', label: 'Blind Ladder', position: { x: 0, y: 0, z: 1.85 } },
  ],
  createVisual(variant = 0) {
    const blind = new Group();
    const timberMaterial = timberMaterials[variant % timberMaterials.length]!;
    const roofMissing = variant === 2;

    // Support posts and braces under the platform.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = new Mesh(new BoxGeometry(0.16, PLATFORM_Y - 0.07, 0.16), timberMaterial);
        post.position.set(sx * 1.2, (PLATFORM_Y - 0.07) / 2, sz * 1.2);
        post.castShadow = true;
        blind.add(post);
      }
    }
    for (const sx of [-1, 1]) {
      const brace = new Mesh(new BoxGeometry(0.12, 1.1, 0.12), timberMaterial);
      brace.position.set(sx * 0.85, 0.62, 1.2);
      brace.rotation.x = sx * 0.75;
      brace.castShadow = true;
      blind.add(brace);
    }

    const deck = new Mesh(new BoxGeometry(2.7, 0.14, 2.7), deckMaterial);
    deck.position.y = PLATFORM_Y - 0.07;
    deck.castShadow = true;
    deck.receiveShadow = true;
    blind.add(deck);

    // Walls in two pieces each, leaving the viewing slit as a genuine gap. Height below the slit
    // and above it are computed from the slit rather than hard-coded, so moving SLIT_Y cannot
    // desynchronise the panels.
    const belowH = SLIT_Y - SLIT_H / 2 - PLATFORM_Y;
    const aboveH = WALL_TOP - (SLIT_Y + SLIT_H / 2);
    for (const sz of [-1, 1]) {
      for (const [h, y] of [
        [belowH, PLATFORM_Y + belowH / 2],
        [aboveH, SLIT_Y + SLIT_H / 2 + aboveH / 2],
      ] as const) {
        const panel = new Mesh(new BoxGeometry(HUT_HALF * 2 + WALL_T, h, WALL_T), timberMaterial);
        panel.position.set(0, y, sz * HUT_HALF);
        panel.castShadow = true;
        panel.receiveShadow = true;
        blind.add(panel);
      }
    }
    for (const sx of [-1, 1]) {
      for (const [h, y] of [
        [belowH, PLATFORM_Y + belowH / 2],
        [aboveH, SLIT_Y + SLIT_H / 2 + aboveH / 2],
      ] as const) {
        const panel = new Mesh(new BoxGeometry(WALL_T, h, HUT_HALF * 2 - WALL_T), timberMaterial);
        panel.position.set(sx * HUT_HALF, y, 0);
        panel.castShadow = true;
        panel.receiveShadow = true;
        blind.add(panel);
      }
    }

    // Dark floor inside, so looking through a slit shows a shadowed interior rather than daylight
    // straight through the platform.
    const floor = new Mesh(
      new BoxGeometry(HUT_HALF * 2 - 0.1, 0.08, HUT_HALF * 2 - 0.1),
      interiorMaterial,
    );
    floor.position.y = PLATFORM_Y + 0.04;
    blind.add(floor);

    // Corrugated sheet roof, nearly flat with a slight fall to +Z. A shed roof avoids needing a
    // gable, and a crude scrap roof suits a hide better than a pitched one.
    const roof = new Mesh(new BoxGeometry(2.7, 0.14, 2.7), roofMaterial);
    roof.position.y = WALL_TOP + 0.09;
    roof.rotation.x = 0.05;
    roof.castShadow = true;
    roof.receiveShadow = true;
    blind.add(roof);
    if (!roofMissing) {
      const lip = new Mesh(new BoxGeometry(2.8, 0.16, 0.12), roofMaterial);
      lip.position.set(0, WALL_TOP + 0.02, 1.38);
      blind.add(lip);
    } else {
      // Variant 2: the front roof board is gone, leaving the interior open to the sky.
      const brokenBoard = new Mesh(new BoxGeometry(1.1, 0.12, 0.5), roofMaterial);
      brokenBoard.position.set(-0.5, WALL_TOP + 0.16, 1.5);
      brokenBoard.rotation.set(0.4, 0.2, 0.1);
      brokenBoard.castShadow = true;
      blind.add(brokenBoard);
    }

    // Ladder to the platform: two rails and five rungs. The idea names ladder rungs explicitly,
    // so the thin geometry is justified here.
    for (const sx of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(0.07, 1.75, 0.07), timberMaterial);
      rail.position.set(sx * 0.35, 0.9, 1.5);
      rail.castShadow = true;
      blind.add(rail);
    }
    for (let i = 0; i < 5; i++) {
      const rung = new Mesh(new BoxGeometry(0.7, 0.06, 0.06), timberMaterial);
      rung.position.set(0, 0.32 + i * 0.34, 1.5);
      blind.add(rung);
    }

    blind.userData.assetId = 'candidate-hunting-blind';
    return blind;
  },
};
