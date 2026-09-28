import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Wall-mounted alley fire escape. Second deliberate pivot exception after the rooftop tank:
// the WALL PLANE is z = 0 and everything projects toward +Z, so the asset can be placed flush
// against a building wall with no offset math. See the review sheet.
const frameMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.82,
  metalness: 0.25,
  flatShading: true,
});
frameMaterial.name = 'frame-steel';

const grateMaterial = new MeshStandardMaterial({ color: '#54594d', roughness: 0.9 });
grateMaterial.name = 'platform-grate';

const rustMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.85,
  metalness: 0.2,
});
rustMaterial.name = 'ladder-rust';

const PLATFORM_W = 2.4;
const PLATFORM_D = 1.5;
const PLATFORM_Y = [3.0, 6.0, 9.0];
const LADDER_X = 1.55;
const RAIL_H = 1.0;

export const candidateFireEscape: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-fire-escape',
  name: 'Alley Fire Escape',
  category: 'prop',
  dimensions: { x: 4.0, y: 10.4, z: 1.7 },
  // A thin slab at the wall plane, so the structure still blocks at the wall while the platform
  // volumes stay standable. The building's own wall is what really stops the player.
  collider: { center: { x: 0, y: 5.0, z: 0.1 }, size: { x: 2.6, y: 10.0, z: 0.3 } },
  interactionPoints: [
    { id: 'climb-ladder', label: 'Fire Escape Ladder', position: { x: LADDER_X, y: 0, z: 1.1 } },
  ],
  createVisual(variant = 0) {
    const escape = new Group();
    // Variant 1 has lost its top landing; variant 2 has lost the middle platform's front rail
    // and a section of ladder. Both change the silhouette rather than just the colour.
    const levels = variant === 1 ? PLATFORM_Y.slice(0, 2) : PLATFORM_Y;
    const topY = levels[levels.length - 1]!;

    for (const y of levels) {
      // Grating floor.
      const floor = new Mesh(new BoxGeometry(PLATFORM_W, 0.08, PLATFORM_D), grateMaterial);
      floor.position.set(0, y, PLATFORM_D / 2);
      floor.castShadow = true;
      floor.receiveShadow = true;
      escape.add(floor);

      // Front and side rails. The middle platform's front rail is missing in variant 2.
      const frontRailMissing = variant === 2 && y === PLATFORM_Y[1];
      if (!frontRailMissing) {
        const front = new Mesh(new BoxGeometry(PLATFORM_W, 0.06, 0.06), frameMaterial);
        front.position.set(0, y + RAIL_H, PLATFORM_D);
        front.castShadow = true;
        escape.add(front);
      }
      // No balusters. Uprights would be 12 extra meshes of 0.06 m square, which is exactly the
      // thin geometry that disappears at play distance. The rails sit on the platform edge
      // instead, which is how plenty of real fire escapes are built.
      for (const side of [-1, 1]) {
        const sideRail = new Mesh(new BoxGeometry(0.06, 0.06, PLATFORM_D), frameMaterial);
        sideRail.position.set((side * PLATFORM_W) / 2, y + RAIL_H, PLATFORM_D / 2);
        escape.add(sideRail);
      }

      // Two diagonal brackets back to the wall, plus the wall plate they land on.
      for (const side of [-1, 1]) {
        const bracket = new Mesh(new BoxGeometry(0.07, 1.7, 0.07), frameMaterial);
        bracket.position.set(side * 1.0, y - 0.58, 0.835);
        bracket.rotation.x = 0.9;
        bracket.castShadow = true;
        escape.add(bracket);
      }
      const plate = new Mesh(new BoxGeometry(2.2, 0.14, 0.06), frameMaterial);
      plate.position.set(0, y - 0.1, 0.03);
      escape.add(plate);
    }

    // Continuous ladder up the +X side, from just above the ground to above the top landing.
    const ladderTop = topY + 0.4;
    // The lowest mesh is the ladder foot at 0.1 m: a wall-mounted fire escape is bolted to the
    // wall above a drop ladder, so nothing here needs to touch the ground.
    for (const side of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(0.07, ladderTop - 0.1, 0.07), rustMaterial);
      rail.position.set(LADDER_X + side * 0.28, (ladderTop + 0.1) / 2, 0.4);
      rail.castShadow = true;
      escape.add(rail);
    }
    const rungCount = 6;
    for (let i = 0; i < rungCount; i++) {
      // Variant 2 has lost the rungs in the middle of the ladder, leaving a gap you can see
      // through from the side.
      if (variant === 2 && i >= 3 && i <= 4) continue;
      const rung = new Mesh(new BoxGeometry(0.56, 0.05, 0.05), rustMaterial);
      rung.position.set(LADDER_X, 0.5 + (i * (ladderTop - 0.6)) / (rungCount - 1), 0.4);
      escape.add(rung);
    }

    // Drop ladder hanging from the lowest platform. It is the detail that says "fire escape"
    // rather than "balcony", and it is 3 meshes.
    for (const side of [-1, 1]) {
      const drop = new Mesh(new BoxGeometry(0.06, 1.0, 0.06), rustMaterial);
      drop.position.set(-0.9 + side * 0.24, PLATFORM_Y[0]! - 0.55, PLATFORM_D - 0.1);
      escape.add(drop);
    }
    const dropRung = new Mesh(new BoxGeometry(0.48, 0.05, 0.05), rustMaterial);
    dropRung.position.set(-0.9, PLATFORM_Y[0]! - 0.9, PLATFORM_D - 0.1);
    escape.add(dropRung);

    escape.userData.assetId = 'candidate-fire-escape';
    return escape;
  },
};
