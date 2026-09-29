import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset.
// Burned corner store. Local +Z is the shopfront, the boarded side entrance is on +X, and the
// bounding box is centred on the origin, so the L reads as off-centre by design.
const wallMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1 });
wallMaterial.name = 'wall-render';

const fasciaMaterials = [
  new MeshStandardMaterial({ color: '#9b624d', roughness: 0.95 }),
  new MeshStandardMaterial({ color: '#58624d', roughness: 0.95 }),
  new MeshStandardMaterial({ color: '#526e70', roughness: 0.95 }),
];
fasciaMaterials[0]!.name = 'fascia-faded-red';
fasciaMaterials[1]!.name = 'fascia-faded-olive';
fasciaMaterials[2]!.name = 'fascia-faded-teal';

const awningMaterials = [
  new MeshStandardMaterial({ color: '#77796a', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#74765c', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#7b7566', roughness: 1, flatShading: true }),
];
awningMaterials[0]!.name = 'awning-canvas';
awningMaterials[1]!.name = 'awning-canvas-olive';
awningMaterials[2]!.name = 'awning-canvas-faded';

const interiorMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
interiorMaterial.name = 'shop-interior';

const sootMaterial = new MeshStandardMaterial({ color: '#3a3630', roughness: 1 });
sootMaterial.name = 'soot';

const glassMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.3,
  metalness: 0.06,
});
glassMaterial.name = 'window-glass';

const timberMaterial = new MeshStandardMaterial({ color: '#655744', roughness: 1 });
timberMaterial.name = 'timber-board';

const trimMaterial = new MeshStandardMaterial({ color: '#aaa18f', roughness: 1 });
trimMaterial.name = 'trim-stone';

const rubbleMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
rubbleMaterial.name = 'rubble-concrete';

const metalMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
metalMaterial.name = 'metal-frame';

const MAIN_W = 7.8;
const MAIN_H = 4.8;
const MAIN_D = 6.8;
const WING_W = 2.2;
const WING_H = 4.4;
const WING_D = 4.0;
const MAIN_X = -1.1;

export const burnedCornerStore: AuthoredAsset = {
  schemaVersion: 1,
  id: 'burned-corner-store',
  name: 'Burned Corner Store',
  category: 'building',
  dimensions: { x: 10.8, y: 6.1, z: 8.4 },
  // One box cannot describe an L, so the inner corner behind the shopfront is blocked solid even
  // though it is open ground. If the runtime ever takes multiple boxes, split this into the main
  // mass and the return wing.
  collider: { center: { x: 0, y: 2.85, z: 0 }, size: { x: 10, y: 5.7, z: 6.8 } },
  interactionPoints: [{ id: 'shop-door', label: 'Shop Door', position: { x: 0.4, y: 0, z: 3.85 } }],
  createVisual(variant = 0) {
    const store = new Group();
    const fasciaMaterial = fasciaMaterials[variant % fasciaMaterials.length]!;
    const awningMaterial = awningMaterials[variant % awningMaterials.length]!;
    const awningBroken = variant === 2;
    const front = MAIN_D / 2;

    const main = new Mesh(new BoxGeometry(MAIN_W, MAIN_H, MAIN_D), wallMaterial);
    main.position.set(MAIN_X, MAIN_H / 2, 0);
    main.castShadow = true;
    main.receiveShadow = true;
    store.add(main);

    const wing = new Mesh(new BoxGeometry(WING_W, WING_H, WING_D), wallMaterial);
    wing.position.set(3.9, WING_H / 2, 0);
    wing.castShadow = true;
    wing.receiveShadow = true;
    store.add(wing);

    // Shopfront fascia band, standing proud of the wall.
    const fascia = new Mesh(new BoxGeometry(7.0, 0.55, 0.2), fasciaMaterial);
    fascia.position.set(MAIN_X, 3.85, front + 0.08);
    fascia.castShadow = true;
    store.add(fascia);

    // Display window. The reveal is real: sill, head and jambs stand proud of the wall and the
    // glass sits behind them. One pane is missing, so the dark interior shows through the gap.
    const winX = -2.5;
    const winY = 1.85;
    const winW = 3.26;
    const winH = 2.1;
    const glazingBacking = new Mesh(new BoxGeometry(winW, winH, 0.06), interiorMaterial);
    glazingBacking.position.set(winX, winY, front + 0.02);
    store.add(glazingBacking);
    for (const [w, h, d, x, y, z] of [
      [3.7, 0.22, 0.3, winX, winY - winH / 2 - 0.11, front + 0.12],
      [3.7, 0.22, 0.3, winX, winY + winH / 2 + 0.11, front + 0.12],
      [0.22, winH, 0.3, winX - winW / 2 - 0.11, winY, front + 0.12],
      [0.22, winH, 0.3, winX + winW / 2 + 0.11, winY, front + 0.12],
    ] as const) {
      const frame = new Mesh(new BoxGeometry(w, h, d), trimMaterial);
      frame.position.set(x, y, z);
      frame.castShadow = true;
      store.add(frame);
    }
    for (const x of [winX - 0.88, winX + 0.62]) {
      const pane = new Mesh(new BoxGeometry(1.5, winH, 0.05), glassMaterial);
      pane.position.set(x, winY, front + 0.08);
      store.add(pane);
    }
    // The surviving shard in the broken pane, catching what light there is.
    const shard = new Mesh(new BoxGeometry(0.34, 0.8, 0.04), glassMaterial);
    shard.position.set(winX + 1.5, winY - 0.5, front + 0.1);
    shard.rotation.z = 0.18;
    store.add(shard);

    // Shop door with a proud frame, matching the row house detail.
    const doorX = 0.4;
    const doorW = 1.0;
    const doorH = 2.15;
    const doorPanel = new Mesh(new BoxGeometry(doorW - 0.06, doorH - 0.08, 0.08), timberMaterial);
    doorPanel.position.set(doorX, doorH / 2 - 0.02, front + 0.02);
    store.add(doorPanel);
    // Frame 0.3 deep and 0.25 proud of the wall, so the door is genuinely recessed inside it.
    for (const side of [-1, 1]) {
      const jamb = new Mesh(new BoxGeometry(0.15, doorH + 0.15, 0.3), trimMaterial);
      jamb.position.set(doorX + side * (doorW / 2 + 0.075), (doorH + 0.15) / 2, front + 0.1);
      store.add(jamb);
    }
    const doorHead = new Mesh(new BoxGeometry(doorW + 0.3, 0.15, 0.3), trimMaterial);
    doorHead.position.set(doorX, doorH + 0.075, front + 0.1);
    store.add(doorHead);
    const step = new Mesh(new BoxGeometry(1.4, 0.14, 0.5), trimMaterial);
    step.position.set(doorX, 0.07, front + 0.22);
    step.receiveShadow = true;
    store.add(step);

    // Faded canvas awning over the whole shopfront, sloping down and away from the wall.
    const awning = new Mesh(new BoxGeometry(6.4, 0.1, 1.42), awningMaterial);
    awning.position.set(MAIN_X, 3.5, front + 0.65);
    awning.rotation.x = 0.3;
    awning.rotation.z = awningBroken ? 0.1 : 0;
    awning.castShadow = true;
    store.add(awning);
    const valance = new Mesh(new BoxGeometry(awningBroken ? 3.4 : 6.4, 0.3, 0.06), awningMaterial);
    valance.position.set(awningBroken ? MAIN_X + 1.5 : MAIN_X, 3.16, front + 1.32);
    store.add(valance);
    for (const x of [MAIN_X - 2.6, MAIN_X + 2.6]) {
      if (awningBroken && x < MAIN_X) continue;
      const strut = new Mesh(new BoxGeometry(0.07, 0.07, 1.5), metalMaterial);
      strut.position.set(x, 3.42, front + 0.65);
      strut.rotation.x = 0.3;
      store.add(strut);
    }

    // Flat roof, parapet, and the collapsed front-left corner where the fire came through.
    const roof = new Mesh(new BoxGeometry(8.0, 0.3, 7.0), wallMaterial);
    roof.position.set(MAIN_X, 4.95, 0);
    roof.castShadow = true;
    roof.receiveShadow = true;
    store.add(roof);

    const parapetFront = new Mesh(new BoxGeometry(7.8, 0.6, 0.22), wallMaterial);
    parapetFront.position.set(MAIN_X, 5.4, front - 0.11);
    parapetFront.castShadow = true;
    store.add(parapetFront);
    const parapetBack = new Mesh(new BoxGeometry(7.8, 0.6, 0.22), wallMaterial);
    parapetBack.position.set(MAIN_X, 5.4, -front + 0.11);
    store.add(parapetBack);
    const parapetRight = new Mesh(new BoxGeometry(0.22, 0.6, 6.8), wallMaterial);
    parapetRight.position.set(MAIN_X + 3.79, 5.4, 0);
    store.add(parapetRight);
    // Left parapet survives only at the rear; the front half has fallen in.
    const parapetLeft = new Mesh(new BoxGeometry(0.22, 0.6, 3.4), wallMaterial);
    parapetLeft.position.set(MAIN_X - 3.79, 5.4, -1.7);
    store.add(parapetLeft);

    for (const z of [0.5, 1.4, 2.3]) {
      const joist = new Mesh(new BoxGeometry(0.6, 0.1, 0.12), timberMaterial);
      joist.position.set(MAIN_X - 3.5, 5.0, z);
      store.add(joist);
    }
    const ceilingHole = new Mesh(new BoxGeometry(2.4, 0.12, 3.4), sootMaterial);
    ceilingHole.position.set(MAIN_X - 2.6, 4.82, 1.7);
    store.add(ceilingHole);
    const fallenChunk = new Mesh(new BoxGeometry(1.3, 0.6, 0.22), rubbleMaterial);
    fallenChunk.position.set(MAIN_X - 2.3, 5.28, 2.4);
    fallenChunk.rotation.set(0.18, 0.4, 1.15);
    fallenChunk.castShadow = true;
    store.add(fallenChunk);

    // Soot streak climbing the collapsed corner, the clearest read that this place burned.
    const sootStreak = new Mesh(new BoxGeometry(0.06, 2.8, 3.4), sootMaterial);
    sootStreak.position.set(MAIN_X - 3.92, 3.3, 1.7);
    store.add(sootStreak);

    // Lower roof over the return wing.
    const wingRoof = new Mesh(new BoxGeometry(2.2, 0.25, 4.0), wallMaterial);
    wingRoof.position.set(3.9, 4.52, 0);
    wingRoof.castShadow = true;
    store.add(wingRoof);
    const wingLip = new Mesh(new BoxGeometry(0.2, 0.35, 4.0), wallMaterial);
    wingLip.position.set(4.9, 4.82, 0);
    store.add(wingLip);

    // Blocked side entrance on the wing's outer face: a door panel nailed shut and piled with
    // rubble, so it reads as blocked without needing a real opening through the wall.
    const sideDoor = new Mesh(new BoxGeometry(0.1, 2.05, 0.95), timberMaterial);
    sideDoor.position.set(5.02, 1.025, 0.6);
    store.add(sideDoor);
    for (const sign of [-1, 1]) {
      const board = new Mesh(new BoxGeometry(0.05, 0.18, 1.2), timberMaterial);
      board.position.set(5.09, 1.0 + sign * 0.42, 0.6);
      board.rotation.x = sign * 0.62;
      board.castShadow = true;
      store.add(board);
    }
    for (const [w, h, d, x, y, z] of [
      [0.5, 0.42, 0.5, 5.32, 0.21, 0.32],
      [0.36, 0.3, 0.42, 5.26, 0.57, 0.86],
      [0.44, 0.26, 0.38, 5.3, 0.75, 0.5],
    ] as const) {
      const chunk = new Mesh(new BoxGeometry(w, h, d), rubbleMaterial);
      chunk.position.set(x, y, z);
      chunk.rotation.y = x * 3;
      chunk.castShadow = true;
      store.add(chunk);
    }

    store.userData.assetId = 'burned-corner-store';
    return store;
  },
};
