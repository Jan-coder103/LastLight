import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Roadside picnic shelter. Local +Z is the open front, facing the road. Open on all sides, so the
// player stands inside it and the collider covers only the table.
const timberMaterials = [
  new MeshStandardMaterial({ color: '#655744', roughness: 1 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#514437', roughness: 1 }),
];
timberMaterials[0]!.name = 'shelter-timber';
timberMaterials[1]!.name = 'shelter-timber-worn';
timberMaterials[2]!.name = 'shelter-timber-dark';

const roofMaterial = new MeshStandardMaterial({
  color: '#626753',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-sheet';

const debrisMaterial = new MeshStandardMaterial({ color: '#4b4035', roughness: 1 });
debrisMaterial.name = 'debris-timber';

const POST_Y = 2.45;
const HALF_W = 1.9;
const HALF_D = 1.5;

export const candidatePicnicShelter: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-picnic-shelter',
  name: 'Roadside Picnic Shelter',
  category: 'prop',
  dimensions: { x: 4.6, y: 3.3, z: 5.1 },
  // The table only. This shelter is open on all four sides and exists to be stood in, so a box
  // covering its footprint would defeat it. The posts are therefore not solid and a player can
  // clip one; a player walking through a 0.16 m post is a much smaller lie than a shelter the
  // player cannot use. Same reasoning as the transit shelter (#09).
  collider: { center: { x: 0, y: 0.45, z: 0 }, size: { x: 2.9, y: 0.9, z: 1.2 } },
  interactionPoints: [
    { id: 'picnic-table', label: 'Picnic Table', position: { x: 0, y: 0, z: 0.5 } },
  ],
  createVisual(variant = 0) {
    const shelter = new Group();
    const timberMaterial = timberMaterials[variant % timberMaterials.length]!;
    const benchMissing = variant === 2;

    // Six posts: four corners plus two mid-span, which is what a 3.8 m span needs structurally.
    for (const x of [-HALF_W, 0, HALF_W]) {
      for (const z of [-HALF_D, HALF_D]) {
        const post = new Mesh(new BoxGeometry(0.16, POST_Y, 0.16), timberMaterial);
        post.position.set(x, POST_Y / 2, z);
        post.castShadow = true;
        shelter.add(post);
      }
    }

    // Two beams along the length, and three cross purlins on top of them.
    for (const z of [-HALF_D, HALF_D]) {
      const beam = new Mesh(new BoxGeometry(HALF_W * 2 + 0.4, 0.18, 0.14), timberMaterial);
      beam.position.set(0, POST_Y + 0.09, z);
      beam.castShadow = true;
      shelter.add(beam);
    }
    for (const z of [-HALF_D, 0, HALF_D]) {
      const purlin = new Mesh(new BoxGeometry(HALF_W * 2 + 0.5, 0.12, 0.12), timberMaterial);
      purlin.position.set(0, POST_Y + 0.24, z);
      purlin.castShadow = true;
      shelter.add(purlin);
    }

    // Mono-pitch roof, higher at the back so rain runs off the front. A shed roof avoids needing a
    // gable triangle, which is the third copy the row house review sheet warns about.
    const roof = new Mesh(new BoxGeometry(HALF_W * 2 + 0.7, 0.14, HALF_D * 2 + 0.9), roofMaterial);
    roof.position.set(0, POST_Y + 0.42, 0.1);
    roof.rotation.x = 0.12;
    roof.castShadow = true;
    roof.receiveShadow = true;
    shelter.add(roof);

    // Picnic table: two plank benches either side of a plank top, on two plank legs.
    const top = new Mesh(new BoxGeometry(2.6, 0.12, 0.85), timberMaterial);
    top.position.set(0, 0.76, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    shelter.add(top);
    for (const z of [-0.66, 0.66]) {
      const bench = new Mesh(new BoxGeometry(2.6, 0.1, 0.32), timberMaterial);
      bench.position.set(0, 0.46, z);
      bench.castShadow = true;
      shelter.add(bench);
    }
    // Variant 2 has lost one bench, which is the only structural damage in the set.
    if (!benchMissing) {
      for (const z of [-0.66, 0.66]) {
        const brace = new Mesh(new BoxGeometry(2.4, 0.1, 0.1), timberMaterial);
        brace.position.set(0, 0.32, z);
        shelter.add(brace);
      }
    }
    for (const x of [-0.9, 0.9]) {
      // A-frame legs, two splayed boards each.
      for (const z of [-0.36, 0.36]) {
        // Height is the gap under the table top (0.76 - 0.06), not 0.9: a 0.9 m leg centred on
        // 0.4 hung 5 cm below grade.
        const leg = new Mesh(new BoxGeometry(0.1, 0.7, 0.1), timberMaterial);
        leg.position.set(x, 0.35, z);
        leg.castShadow = true;
        shelter.add(leg);
      }
      const cross = new Mesh(new BoxGeometry(0.1, 0.1, 0.85), timberMaterial);
      cross.position.set(x, 0.3, 0);
      shelter.add(cross);
    }

    // Scattered debris, which the idea asks for by name: fallen roof slats and a broken board.
    for (const [x, z, w, d, ry, tilt] of [
      [1.2, 1.9, 1.4, 0.3, 0.5, 0],
      [-1.5, 2.0, 0.9, 0.28, -0.3, 0.06],
      [0.3, -2.1, 1.1, 0.26, 1.1, 0],
      [-1.9, -1.4, 0.5, 0.24, 0.2, 0],
    ] as const) {
      const plank = new Mesh(new BoxGeometry(w, 0.09, d), debrisMaterial);
      plank.position.set(x, 0.05 + tilt, z);
      plank.rotation.set(0, ry, tilt);
      plank.castShadow = true;
      plank.receiveShadow = true;
      shelter.add(plank);
    }

    shelter.userData.assetId = 'candidate-picnic-shelter';
    return shelter;
  },
};
