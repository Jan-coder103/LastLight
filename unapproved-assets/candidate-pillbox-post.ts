import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Pillbox guard post. Local +Z is the front, with the door on the left and the firing slit on the
// right. Both are REAL openings built as gaps between wall segments.
const concreteMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1 });
concreteMaterial.name = 'pillbox-concrete';

const capMaterial = new MeshStandardMaterial({ color: '#a29b88', roughness: 1 });
capMaterial.name = 'pillbox-cap';

const doorMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.2,
});
doorMaterial.name = 'guard-door';

const interiorMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const markingMaterial = new MeshStandardMaterial({ color: '#58624d', roughness: 0.95 });
markingMaterial.name = 'marking-olive';

const W = 3.5;
const D = 3.0;
const H = 2.2;
const WALL = 0.4;
const DOOR_X0 = -1.5;
const DOOR_X1 = -0.3;
const DOOR_H = 1.9;
const SLIT_X0 = 0.1;
const SLIT_X1 = 1.3;
const SLIT_Y0 = 1.35;
const SLIT_Y1 = 1.47;

export const candidatePillboxPost: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-pillbox-post',
  name: 'Pillbox Guard Post',
  category: 'prop',
  dimensions: { x: 4.0, y: 2.9, z: 3.8 },
  // The post body. Note the consequence: this box also covers the doorway and the firing slit, so
  // the player cannot use the "approachable door". That is the fourth candidate in the batch with a
  // real opening sealed by a single collider box. See the review sheet.
  collider: { center: { x: 0, y: 1.1, z: 0 }, size: { x: 3.5, y: 2.2, z: 3.0 } },
  interactionPoints: [
    { id: 'guard-post-door', label: 'Guard Post Door', position: { x: -0.9, y: 0, z: 2.1 } },
  ],
  createVisual(variant = 0) {
    const post = new Group();
    const halfW = W / 2;
    const halfD = D / 2;
    const frontZ = halfD - WALL / 2;

    const footing = new Mesh(new BoxGeometry(W + 0.3, 0.3, D + 0.3), capMaterial);
    footing.position.y = 0.15;
    footing.receiveShadow = true;
    post.add(footing);

    // Back and side walls are solid; the front wall is assembled around the door and the slit.
    const back = new Mesh(new BoxGeometry(W, H, WALL), concreteMaterial);
    back.position.set(0, 0.3 + H / 2, -halfD + WALL / 2);
    back.castShadow = true;
    back.receiveShadow = true;
    post.add(back);
    for (const side of [-1, 1]) {
      const wall = new Mesh(new BoxGeometry(WALL, H, D - WALL * 2), concreteMaterial);
      wall.position.set(side * (halfW - WALL / 2), 0.3 + H / 2, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      post.add(wall);
    }

    // Front wall segments. The slit is only 0.12 m tall, so it is defined as a named pair of
    // constants and every segment around it is derived from those, which is what stops a move of
    // SLIT_Y from leaving a gap or an overlap.
    for (const [w, h, x, y] of [
      [DOOR_X0 + halfW, H, -halfW + (DOOR_X0 + halfW) / 2, 0.3 + H / 2],
      [SLIT_X0 - DOOR_X1, H, (SLIT_X0 + DOOR_X1) / 2, 0.3 + H / 2],
      [halfW - SLIT_X1, H, SLIT_X1 + (halfW - SLIT_X1) / 2, 0.3 + H / 2],
      [DOOR_X1 - DOOR_X0, H - DOOR_H, (DOOR_X0 + DOOR_X1) / 2, DOOR_H + 0.3 + (H - DOOR_H) / 2],
      [SLIT_X1 - SLIT_X0, SLIT_Y0 - 0.3, (SLIT_X0 + SLIT_X1) / 2, 0.3 + (SLIT_Y0 - 0.3) / 2],
      [
        SLIT_X1 - SLIT_X0,
        H + 0.3 - SLIT_Y1,
        (SLIT_X0 + SLIT_X1) / 2,
        SLIT_Y1 + (H + 0.3 - SLIT_Y1) / 2,
      ],
    ] as const) {
      const seg = new Mesh(new BoxGeometry(w, h, WALL), concreteMaterial);
      seg.position.set(x, y, frontZ);
      seg.castShadow = true;
      seg.receiveShadow = true;
      post.add(seg);
    }

    // Dark interior on the inside of the back wall, so both openings show depth rather than a face.
    const interior = new Mesh(new BoxGeometry(W - WALL * 2, H - 0.2, 0.06), interiorMaterial);
    interior.position.set(0, 0.3 + H / 2, -halfD + WALL + 0.03);
    post.add(interior);

    // Steel door, hinged open against the front face. An "approachable door" needs to look like it
    // opens, so it is a real hinge group rather than a panel on the wall.
    const doorHinge = new Group();
    doorHinge.position.set(DOOR_X1, 0.3, frontZ + 0.24);
    doorHinge.rotation.y = -1.9;
    post.add(doorHinge);
    const doorPanel = new Mesh(
      new BoxGeometry(DOOR_X1 - DOOR_X0 - 0.06, DOOR_H - 0.06, 0.08),
      doorMaterial,
    );
    doorPanel.position.set(-(DOOR_X1 - DOOR_X0) / 2, (DOOR_H - 0.06) / 2, 0);
    doorPanel.castShadow = true;
    doorHinge.add(doorPanel);
    const doorHandle = new Mesh(new BoxGeometry(0.08, 0.3, 0.08), doorMaterial);
    doorHandle.position.set(-(DOOR_X1 - DOOR_X0) + 0.14, 0.95, 0.07);
    doorHinge.add(doorHandle);

    // Sloped front apron and a flat cap: the bevel is what gives a pillbox its armoured read, and
    // it is 1 mesh.
    const apron = new Mesh(new BoxGeometry(W + 0.2, 0.36, 0.7), capMaterial);
    apron.position.set(0, H + 0.22, halfD - 0.15);
    apron.rotation.x = -0.55;
    apron.castShadow = true;
    post.add(apron);
    const roof = new Mesh(new BoxGeometry(W + 0.2, 0.26, D + 0.2), capMaterial);
    roof.position.y = 0.3 + H + 0.13;
    roof.castShadow = true;
    roof.receiveShadow = true;
    post.add(roof);

    // Faded stencil beside the door.
    const stencil = new Mesh(new BoxGeometry(0.5, 0.2, 0.04), markingMaterial);
    stencil.position.set(-1.72, 1.6, frontZ + WALL / 2 + 0.02);
    post.add(stencil);

    // A single sandbag row at the base, the cheapest way to say "occupied position" and to stop
    // the post reading as a plain concrete box.
    if (variant !== 1) {
      for (let i = 0; i < 3; i++) {
        const bag = new Mesh(new BoxGeometry(0.62, 0.26, 0.42), markingMaterial);
        bag.position.set(-1.3 + i * 0.66, 0.13, halfD + 0.32);
        bag.rotation.y = 0.12 * (i - 1);
        bag.castShadow = true;
        bag.receiveShadow = true;
        post.add(bag);
      }
    }

    post.userData.assetId = 'candidate-pillbox-post';
    return post;
  },
};
