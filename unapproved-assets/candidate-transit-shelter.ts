import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Bus-stop shelter. Local +Z is the open front, facing the road. The player stands INSIDE it, so
// the collider is the back panel only.
const frameMaterials = [
  new MeshStandardMaterial({ color: '#59635b', roughness: 0.8, metalness: 0.25 }),
  new MeshStandardMaterial({ color: '#54594d', roughness: 0.8, metalness: 0.25 }),
  new MeshStandardMaterial({ color: '#64675d', roughness: 0.8, metalness: 0.25 }),
];
frameMaterials[0]!.name = 'frame-green';
frameMaterials[1]!.name = 'frame-olive';
frameMaterials[2]!.name = 'frame-grey';

const panelMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
panelMaterial.name = 'panel-solid';

const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.28,
  metalness: 0.05,
});
glassMaterial.name = 'panel-glass';

const benchMaterial = new MeshStandardMaterial({ color: '#514437', roughness: 1 });
benchMaterial.name = 'bench-timber';

const signMaterial = new MeshStandardMaterial({ color: '#aaa18f', roughness: 0.9 });
signMaterial.name = 'sign-board';

const trimMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 0.9 });
trimMaterial.name = 'trim-dark';

export const candidateTransitShelter: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-transit-shelter',
  name: 'Transit Shelter',
  category: 'prop',
  dimensions: { x: 3.9, y: 2.7, z: 2.0 },
  // Back panel only. A single box covering the whole footprint would make the shelter unusable,
  // which defeats the point of the asset, so the player is allowed to stand inside it. The cost
  // of that decision is that the side glazing is not solid and can be walked through.
  collider: { center: { x: 0, y: 1.05, z: -0.6 }, size: { x: 3.5, y: 2.1, z: 0.3 } },
  interactionPoints: [
    { id: 'shelter-bench', label: 'Shelter Bench', position: { x: 0, y: 0, z: -0.1 } },
  ],
  createVisual(variant = 0) {
    const shelter = new Group();
    const frameMaterial = frameMaterials[variant % frameMaterials.length]!;
    const hasSign = variant !== 1;
    const loosePanel = variant === 2;

    // Four corner posts.
    for (const x of [-1.7, 1.7]) {
      for (const z of [-0.7, 0.7]) {
        const post = new Mesh(new BoxGeometry(0.12, 2.45, 0.12), frameMaterial);
        post.position.set(x, 1.225, z);
        post.castShadow = true;
        shelter.add(post);
      }
    }

    // Flat roof with a front fascia. A shallow 0.05 rad tilt drops the front edge, which keeps a
    // large flat slab from reading as a lid.
    const roof = new Mesh(new BoxGeometry(3.8, 0.12, 1.9), frameMaterial);
    roof.position.set(0, 2.5, 0.02);
    roof.rotation.x = 0.05;
    roof.castShadow = true;
    roof.receiveShadow = true;
    shelter.add(roof);
    const fascia = new Mesh(new BoxGeometry(3.8, 0.2, 0.06), frameMaterial);
    fascia.position.set(0, 2.36, 0.93);
    fascia.castShadow = true;
    shelter.add(fascia);

    // Solid kick panels below the glazing, so the shelter has a base and does not read as a
    // floating glass box.
    const backKick = new Mesh(new BoxGeometry(3.3, 0.5, 0.05), panelMaterial);
    backKick.position.set(0, 0.3, -0.68);
    backKick.receiveShadow = true;
    shelter.add(backKick);
    for (const side of [-1, 1]) {
      const kick = new Mesh(new BoxGeometry(0.05, 0.5, 1.3), panelMaterial);
      kick.position.set(side * 1.64, 0.3, 0);
      shelter.add(kick);
    }

    // Back glazing, in one piece.
    const backGlass = new Mesh(new BoxGeometry(3.3, 1.35, 0.05), glassMaterial);
    backGlass.position.set(0, 1.28, -0.68);
    shelter.add(backGlass);

    // Side glazing. The +X panel is the cracked one, and it is modelled as two segments with a
    // real gap plus a shard, rather than as a dark decal pretending to be broken glass.
    const leftGlass = new Mesh(new BoxGeometry(0.05, 1.35, 1.3), glassMaterial);
    leftGlass.position.set(-1.64, 1.28, 0);
    shelter.add(leftGlass);
    const rightLower = new Mesh(new BoxGeometry(0.05, 1.35, 0.5), glassMaterial);
    rightLower.position.set(1.64, 1.28, -0.4);
    shelter.add(rightLower);
    const rightUpper = new Mesh(new BoxGeometry(0.05, 1.35, 0.42), glassMaterial);
    rightUpper.position.set(1.64, 1.28, 0.44);
    shelter.add(rightUpper);
    const shard = new Mesh(new BoxGeometry(0.04, 0.5, 0.3), glassMaterial);
    shard.position.set(1.63, 1.05, 0.02);
    shard.rotation.set(0, 0, 0.18);
    shelter.add(shard);

    // Bench: seat, backrest, two legs. Faces the open front.
    const seat = new Mesh(new BoxGeometry(2.6, 0.1, 0.45), benchMaterial);
    seat.position.set(0, 0.48, -0.42);
    seat.castShadow = true;
    shelter.add(seat);
    const backrest = new Mesh(new BoxGeometry(2.6, 0.4, 0.08), benchMaterial);
    backrest.position.set(0, 0.75, -0.6);
    shelter.add(backrest);
    for (const x of [-1.0, 1.0]) {
      const leg = new Mesh(new BoxGeometry(0.1, 0.45, 0.4), frameMaterial);
      leg.position.set(x, 0.225, -0.42);
      shelter.add(leg);
    }

    // Weathered route sign on the roof edge. Absent in variant 1.
    if (hasSign) {
      const sign = new Mesh(new BoxGeometry(1.2, 0.36, 0.05), signMaterial);
      sign.position.set(0, 2.1, 0.72);
      sign.castShadow = true;
      shelter.add(sign);
      const signTrim = new Mesh(new BoxGeometry(1.3, 0.08, 0.07), trimMaterial);
      signTrim.position.set(0, 2.3, 0.72);
      shelter.add(signTrim);
      for (const x of [-0.5, 0.5]) {
        const bracket = new Mesh(new BoxGeometry(0.05, 0.3, 0.05), frameMaterial);
        bracket.position.set(x, 2.2, 0.72);
        shelter.add(bracket);
      }
    }

    // Variant 2: a panel torn off and leaning against the shelter, the kind of litter that
    // collects at a bus stop.
    if (loosePanel) {
      const panel = new Mesh(new BoxGeometry(0.06, 1.35, 0.9), glassMaterial);
      panel.position.set(-1.85, 0.68, 0.1);
      panel.rotation.set(0, 0, 0.12);
      panel.castShadow = true;
      shelter.add(panel);
    }

    shelter.userData.assetId = 'candidate-transit-shelter';
    return shelter;
  },
};
