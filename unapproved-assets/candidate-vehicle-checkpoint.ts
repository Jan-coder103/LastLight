import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Vehicle checkpoint. The road runs along X; +Z is the shoulder the booth stands on, so -Z faces
// oncoming traffic. Staggered barriers form a chicane down the lane.
const barrierMaterials = [
  new MeshStandardMaterial({ color: '#aaa18f', roughness: 1 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
];
barrierMaterials[0]!.name = 'barrier-concrete-light';
barrierMaterials[1]!.name = 'barrier-concrete';
barrierMaterials[2]!.name = 'barrier-concrete-worn';

const boothMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#77796a', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
];
boothMaterials[0]!.name = 'booth-panel-grey';
boothMaterials[1]!.name = 'booth-panel-olive';
boothMaterials[2]!.name = 'booth-panel-worn';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-dark';

const interiorMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const signMaterial = new MeshStandardMaterial({ color: '#c5ad70', roughness: 0.9 });
signMaterial.name = 'sign-amber';

const postMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.25,
});
postMaterial.name = 'post-metal';

const BARRIER_L = 3.0;
// The Jersey profile, approximated by three stacked boxes of decreasing width: the stepped
// silhouette reads as the trapezoid from any distance and costs 3 meshes instead of a custom
// extrusion.
const PROFILE: [number, number][] = [
  [0.26, 0.6],
  [0.44, 0.44],
  [0.3, 0.26],
];

export const candidateVehicleCheckpoint: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-vehicle-checkpoint',
  name: 'Vehicle Checkpoint',
  category: 'prop',
  dimensions: { x: 6.4, y: 2.9, z: 6.7 },
  // The booth only. A single box cannot cover both the booth and a staggered barrier line without
  // sealing the whole carriageway, which would defeat the asset's purpose. The barriers are
  // therefore not solid. See the review sheet.
  collider: { center: { x: 0, y: 1.2, z: 2.2 }, size: { x: 2.4, y: 2.4, z: 2.2 } },
  interactionPoints: [
    { id: 'checkpoint-booth', label: 'Checkpoint Booth', position: { x: 0, y: 0, z: 0.7 } },
  ],
  createVisual(variant = 0) {
    const checkpoint = new Group();
    const barrierMaterial = barrierMaterials[variant % barrierMaterials.length]!;
    const boothMaterial = boothMaterials[variant % boothMaterials.length]!;
    // Variants change the lane layout, which is the useful axis for a checkpoint.
    const lanes: [number, number][][] = [
      [
        [-0.8, -2.8],
        [0.8, -1.2],
        [-0.8, 0.4],
      ],
      [
        [-0.9, -2.4],
        [0.9, -0.8],
      ],
      [
        [-0.8, -2.8],
        [0.8, -1.2],
        [-0.8, 0.4],
        [0.8, 2.0],
      ],
    ];
    const layout = lanes[variant % lanes.length]!;

    for (const [x, z] of layout) {
      let y = 0;
      for (const [h, w] of PROFILE) {
        const course = new Mesh(new BoxGeometry(BARRIER_L, h, w), barrierMaterial);
        course.position.set(x, y + h / 2, z);
        course.castShadow = true;
        course.receiveShadow = true;
        checkpoint.add(course);
        y += h;
      }
    }

    // Guard booth on the +Z shoulder. The road-facing wall is built AROUND a window, so the booth
    // reads as a place someone sits and looks out of.
    const BX = 0;
    const BZ = 2.2;
    const BW = 2.2;
    const BH = 2.4;
    const BD = 2.0;
    const frontZ = BZ - BD / 2;
    const WT = 0.15;

    const plinth = new Mesh(new BoxGeometry(BW + 0.2, 0.24, BD + 0.2), barrierMaterial);
    plinth.position.set(BX, 0.12, BZ);
    plinth.receiveShadow = true;
    checkpoint.add(plinth);

    for (const [w, h, d, x, y, z] of [
      [BW, BH, WT, BX, BH / 2 + 0.24, BZ + BD / 2 - WT / 2],
      [WT, BH, BD, BX - BW / 2 + WT / 2, BH / 2 + 0.24, BZ],
      [WT, BH, BD, BX + BW / 2 - WT / 2, BH / 2 + 0.24, BZ],
    ] as const) {
      const wall = new Mesh(new BoxGeometry(w, h, d), boothMaterial);
      wall.position.set(x, y, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      checkpoint.add(wall);
    }

    // Front wall around the window: sill, head, and two jambs.
    const WIN_W = 1.6;
    const WIN_B = 1.0;
    const WIN_T = 2.0;
    for (const [w, h, x, y] of [
      [BW, WIN_B, BX, 0.24 + WIN_B / 2],
      [BW, BH + 0.24 - WIN_T, BX, WIN_T + (BH + 0.24 - WIN_T) / 2],
      [(BW - WIN_W) / 2, WIN_T - WIN_B, BX - (WIN_W + (BW - WIN_W) / 2) / 2, (WIN_B + WIN_T) / 2],
      [(BW - WIN_W) / 2, WIN_T - WIN_B, BX + (WIN_W + (BW - WIN_W) / 2) / 2, (WIN_B + WIN_T) / 2],
    ] as const) {
      const wall = new Mesh(new BoxGeometry(w, h, WT), boothMaterial);
      wall.position.set(x, y, frontZ + WT / 2);
      wall.castShadow = true;
      checkpoint.add(wall);
    }
    // Dark interior panel behind the window, plus a ledge on the outside.
    const boothInterior = new Mesh(new BoxGeometry(BW - 0.3, BH - 0.3, 0.06), interiorMaterial);
    boothInterior.position.set(BX, 0.24 + BH / 2, BZ + BD / 2 - WT - 0.03);
    checkpoint.add(boothInterior);
    const ledge = new Mesh(new BoxGeometry(WIN_W + 0.2, 0.08, 0.22), boothMaterial);
    ledge.position.set(BX, WIN_B + 0.24, frontZ - 0.08);
    ledge.castShadow = true;
    checkpoint.add(ledge);

    const boothRoof = new Mesh(new BoxGeometry(BW + 0.5, 0.14, BD + 0.5), roofMaterial);
    boothRoof.position.set(BX, BH + 0.31, BZ);
    boothRoof.castShadow = true;
    boothRoof.receiveShadow = true;
    checkpoint.add(boothRoof);

    // Door on the outboard +X side: a closed panel, because the idea names no opening here and
    // there is nothing to gain from a second real void in a 6-mesh booth.
    const door = new Mesh(new BoxGeometry(0.06, 1.9, 0.85), interiorMaterial);
    door.position.set(BX + BW / 2 + 0.02, 1.19, BZ + 0.2);
    checkpoint.add(door);

    // Two faded warning signs on posts, at the shoulder edge. The amber is the only warm colour
    // and it is a functional marker, which is the sanctioned use.
    for (const [x, z, ry] of [
      [-3.0, 1.2, 0.25],
      [3.0, -1.4, -0.2],
    ] as const) {
      const post = new Mesh(new BoxGeometry(0.1, 2.3, 0.1), postMaterial);
      post.position.set(x, 1.15, z);
      post.castShadow = true;
      checkpoint.add(post);
      const panel = new Mesh(new BoxGeometry(0.06, 0.6, 0.85), signMaterial);
      panel.position.set(x, 2.0, z);
      panel.rotation.y = ry;
      panel.castShadow = true;
      checkpoint.add(panel);
    }

    checkpoint.userData.assetId = 'candidate-vehicle-checkpoint';
    return checkpoint;
  },
};
