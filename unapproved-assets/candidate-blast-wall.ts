import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Modular blast-wall segment, designed to be TILED along X at 3.0 m centres to form a perimeter.
// The chamfered cap is a real feature of blast walls and is modelled as such.
const SEGMENT_L = 3.0;
const SEGMENT_H = 2.8;
const THICK = 0.45;

const concreteMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1 }),
];
concreteMaterials[0]!.name = 'blast-concrete';
concreteMaterials[1]!.name = 'blast-concrete-worn';
concreteMaterials[2]!.name = 'blast-concrete-pale';

const capMaterial = new MeshStandardMaterial({ color: '#a29b88', roughness: 1 });
capMaterial.name = 'blast-cap';

const rebarMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.85,
  metalness: 0.2,
});
rebarMaterial.name = 'rebar-rust';

const markingMaterial = new MeshStandardMaterial({ color: '#58624d', roughness: 0.95 });
markingMaterial.name = 'marking-olive';

export const candidateBlastWall: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-blast-wall',
  name: 'Blast Wall Segment',
  category: 'prop',
  dimensions: { x: 3.3, y: 3.0, z: 0.9 },
  // The panel. This is one of the few assets in the batch where a single box is exactly right: a
  // blast wall is a flat solid slab, so the collider and the visual agree without compromise.
  collider: { center: { x: 0, y: 1.48, z: 0 }, size: { x: 3.0, y: 2.96, z: 0.6 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    const wall = new Group();
    const concreteMaterial = concreteMaterials[variant % concreteMaterials.length]!;
    const spalled = variant === 2;

    // Plinth, panel, and the chamfered cap. The cap is what makes a wall read as a blast wall
    // rather than a garden wall: it deflects blast upward instead of catching it square.
    const plinth = new Mesh(new BoxGeometry(SEGMENT_L + 0.16, 0.3, THICK + 0.14), concreteMaterial);
    plinth.position.y = 0.15;
    plinth.receiveShadow = true;
    wall.add(plinth);

    const panel = new Mesh(new BoxGeometry(SEGMENT_L, SEGMENT_H - 0.3, THICK), concreteMaterial);
    panel.position.y = 0.3 + (SEGMENT_H - 0.3) / 2;
    panel.castShadow = true;
    panel.receiveShadow = true;
    wall.add(panel);

    const cap = new Mesh(new BoxGeometry(SEGMENT_L, 0.34, THICK + 0.2), capMaterial);
    cap.position.set(0, SEGMENT_H - 0.1, 0.03);
    cap.rotation.x = 0.3;
    cap.castShadow = true;
    cap.receiveShadow = true;
    wall.add(cap);

    // Buttress rib on the back face, so the wall is not a bare slab from behind. This is the side
    // a base perimeter presents to its own interior, so it is the side that gets seen from inside.
    for (const x of [-0.75, 0.75]) {
      const rib = new Mesh(new BoxGeometry(0.34, SEGMENT_H - 0.5, 0.26), concreteMaterial);
      rib.position.set(x, 0.3 + (SEGMENT_H - 0.5) / 2, -THICK / 2 - 0.13);
      rib.castShadow = true;
      wall.add(rib);
    }

    // Faded stencil band across the face. Olive, low contrast, and small: a marking rather than a
    // graphic.
    const stencil = new Mesh(new BoxGeometry(2.0, 0.26, 0.04), markingMaterial);
    stencil.position.set(0, 1.85, THICK / 2 + 0.02);
    wall.add(stencil);

    if (spalled) {
      // Variant 2 has lost a chunk off the top corner, with reinforcement showing.
      const spall = new Mesh(new BoxGeometry(0.7, 0.5, THICK + 0.06), concreteMaterial);
      spall.position.set(1.15, SEGMENT_H - 0.34, 0.02);
      spall.rotation.set(0.12, 0, 0.18);
      spall.castShadow = true;
      wall.add(spall);
      for (let i = 0; i < 3; i++) {
        const bar = new Mesh(new BoxGeometry(0.05, 0.42, 0.05), rebarMaterial);
        bar.position.set(0.95 + i * 0.22, SEGMENT_H - 0.1, 0.12);
        bar.rotation.z = 0.2 + i * 0.1;
        wall.add(bar);
      }
    }

    wall.userData.assetId = 'candidate-blast-wall';
    return wall;
  },
};
