import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Supersedes candidate-fuel-pump: owner review asked for the lone pump to become a whole
// abandoned roadside station, Route 66 style — a small flat-roofed store at the back, a canopy
// over a two-dispenser island in front of it, and a tall price sign at the edge of the forecourt.
// Local +Z is the forecourt/road side. The forecourt is a thin diegetic concrete apron, not a
// plinth: the store is the only solid collider, and the player can walk under the canopy and
// between the pumps.
const concreteMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'station-concrete';

const wallMaterial = new MeshStandardMaterial({
  color: '#aaa18f',
  roughness: 1,
  flatShading: true,
});
wallMaterial.name = 'station-wall';

const trimMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
trimMaterial.name = 'station-trim';

const bandMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
bandMaterial.name = 'station-band';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'station-roof';

const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'station-steel';

const pumpBodyMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
pumpBodyMaterial.name = 'station-pump-body';

const pumpTrimMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
pumpTrimMaterial.name = 'station-pump-trim';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'station-rust';

const glassMaterial = new MeshStandardMaterial({
  color: '#526e70',
  roughness: 0.3,
  metalness: 0.1,
});
glassMaterial.name = 'station-glass';

const rubberMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.95,
  flatShading: true,
});
rubberMaterial.name = 'station-rubber';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'station-signal';

const boardMaterial = new MeshStandardMaterial({ color: '#655744', roughness: 1 });
boardMaterial.name = 'station-board';

const UP = new Vector3(0, 1, 0);

function spanTo(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
): Mesh {
  // A cylinder's axis is +Y, so a hose run between two points is placed by aiming that axis with
  // a quaternion, the same pattern the substation and the fuel pump use.
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  const seg = new Mesh(new CylinderGeometry(radius, radius, dir.length(), 6), rubberMaterial);
  seg.quaternion.setFromUnitVectors(UP, dir.normalize());
  seg.position.copy(a).add(b).multiplyScalar(0.5);
  seg.castShadow = true;
  return seg;
}

function addBox(
  group: Group,
  size: { x: number; y: number; z: number },
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(at.x, at.y, at.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

// Store front face. The forecourt side of the store carries the whole read: two boarded windows,
// one broken pane, and the service door with its step.
const STORE_FRONT = -2.3;

function addBoardedWindow(
  group: Group,
  x: number,
  y: number,
  width: number,
  height: number,
  lean: number,
): void {
  const backing = new Mesh(new BoxGeometry(width, height, 0.06), rustMaterial);
  backing.position.set(x, y, STORE_FRONT + 0.03);
  group.add(backing);
  for (const sign of [-1, 1]) {
    const board = new Mesh(new BoxGeometry(width + 0.18, 0.17, 0.05), boardMaterial);
    board.position.set(x, y + sign * height * 0.18, STORE_FRONT + 0.1);
    board.rotation.z = lean * sign;
    board.castShadow = true;
    group.add(board);
  }
}

// One two-hose dispenser on the island, adapted from the superseded fuel-pump candidate: boot,
// banded column, canted price head, dial glass, side nozzle boots, and a drooping hose.
function addDispenser(group: Group, x: number, hoses: boolean, stripped: boolean): void {
  const ISLAND_Z = 1.6;
  addBox(group, { x: 1.0, y: 0.3, z: 0.75 }, { x, y: 0.41, z: ISLAND_Z }, steelMaterial);
  addBox(group, { x: 0.85, y: 1.15, z: 0.62 }, { x, y: 1.13, z: ISLAND_Z }, pumpBodyMaterial);
  addBox(group, { x: 0.9, y: 0.1, z: 0.66 }, { x, y: 1.52, z: ISLAND_Z }, pumpTrimMaterial);
  const head = addBox(
    group,
    { x: 0.8, y: 0.42, z: 0.5 },
    { x, y: 1.95, z: ISLAND_Z + 0.06 },
    pumpBodyMaterial,
  );
  head.rotation.x = -0.2;
  const headCap = addBox(
    group,
    { x: 0.86, y: 0.08, z: 0.56 },
    { x, y: 2.18, z: ISLAND_Z + 0.07 },
    pumpTrimMaterial,
  );
  headCap.rotation.x = -0.2;

  // Canted price panel with its number strip — unless the head has been stripped for parts.
  if (!stripped) {
    const panel = addBox(
      group,
      { x: 0.42, y: 0.2, z: 0.03 },
      { x, y: 1.95, z: ISLAND_Z + 0.33 },
      signalMaterial,
    );
    panel.rotation.x = -0.2;
    const digits = addBox(
      group,
      { x: 0.32, y: 0.05, z: 0.02 },
      { x, y: 1.93, z: ISLAND_Z + 0.35 },
      pumpTrimMaterial,
    );
    digits.rotation.x = -0.2;
  }

  const dialRim = new Mesh(new TorusGeometry(0.17, 0.04, 6, 12), steelMaterial);
  dialRim.position.set(x, 1.28, ISLAND_Z + 0.32);
  group.add(dialRim);
  const dialGlass = new Mesh(new CylinderGeometry(0.16, 0.16, 0.03, 12), glassMaterial);
  dialGlass.rotation.x = Math.PI / 2;
  dialGlass.position.set(x, 1.28, ISLAND_Z + 0.31);
  group.add(dialGlass);

  for (const side of [-1, 1]) {
    addBox(
      group,
      { x: 0.14, y: 0.34, z: 0.16 },
      { x: x + side * 0.49, y: 1.1, z: ISLAND_Z },
      steelMaterial,
    );
  }

  if (!hoses) return;
  // Left dispenser keeps one hose on its hook; the right one's hose is down on the apron.
  if (x < 0) {
    group.add(spanTo([x - 0.49, 0.95, ISLAND_Z], [x - 0.56, 0.55, ISLAND_Z + 0.12], 0.038));
    group.add(spanTo([x - 0.56, 0.55, ISLAND_Z + 0.12], [x - 0.51, 0.2, ISLAND_Z + 0.06], 0.034));
    const nozzle = addBox(
      group,
      { x: 0.06, y: 0.2, z: 0.08 },
      { x: x - 0.51, y: 0.1, z: ISLAND_Z + 0.06 },
      steelMaterial,
    );
    nozzle.rotation.z = 0.3;
  } else {
    group.add(spanTo([x + 0.49, 0.95, ISLAND_Z], [x + 0.78, 0.4, ISLAND_Z + 0.7], 0.038));
    group.add(spanTo([x + 0.78, 0.4, ISLAND_Z + 0.7], [x + 0.5, 0.09, ISLAND_Z + 1.1], 0.035));
    group.add(spanTo([x + 0.5, 0.09, ISLAND_Z + 1.1], [x - 0.1, 0.09, ISLAND_Z + 0.9], 0.035));
    const dropped = addBox(
      group,
      { x: 0.06, y: 0.2, z: 0.08 },
      { x: x - 0.14, y: 0.12, z: ISLAND_Z + 0.88 },
      steelMaterial,
    );
    dropped.rotation.set(1.4, 0.3, 0.2);
  }
}

export const candidateGasStation: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-gas-station',
  name: 'Abandoned Gas Station',
  category: 'building',
  dimensions: { x: 15.8, y: 6.5, z: 15.0 },
  // The store mass only. The canopy columns, pumps, and sign are thin or open and stay non-solid,
  // so the forecourt keeps its gameplay value as walkable, searchable ground. One box cannot say
  // "solid store, open forecourt" any other way; see the review sheet.
  collider: { center: { x: 0, y: 1.8, z: -4.6 }, size: { x: 10.2, y: 3.6, z: 4.8 } },
  interactionPoints: [
    { id: 'store-door', label: 'Store Door', position: { x: 3.6, y: 0, z: -1.6 } },
    { id: 'fuel-nozzle', label: 'Fuel Nozzle', position: { x: 1.35, y: 0, z: 2.5 } },
  ],
  createVisual(variant = 0) {
    const station = new Group();
    const weathered = variant === 1;
    const stripped = variant === 2;

    // Forecourt apron: a thin diegetic slab flush with the ground, not a plinth.
    const apron = new Mesh(new BoxGeometry(14, 0.08, 12.5), concreteMaterial);
    apron.position.set(0, 0.04, 1.5);
    apron.receiveShadow = true;
    station.add(apron);

    // The store: a flat-roofed box with a roadward parapet, faded painted band, boarded shop
    // windows, one broken pane, and the service door. Ridge-less on purpose — the parapet line
    // against the sky is the Route 66 read.
    addBox(station, { x: 10, y: 3.6, z: 4.6 }, { x: 0, y: 1.8, z: -4.6 }, wallMaterial);
    addBox(station, { x: 10.4, y: 0.24, z: 4.9 }, { x: 0, y: 3.72, z: -4.6 }, roofMaterial);
    addBox(station, { x: 10.2, y: 0.9, z: 0.24 }, { x: 0, y: 4.0, z: -2.28 }, wallMaterial);
    addBox(station, { x: 6.0, y: 0.55, z: 0.06 }, { x: 0, y: 4.0, z: -2.12 }, bandMaterial);

    addBoardedWindow(station, -3.4, 1.9, 1.6, 1.5, 0.5);
    addBoardedWindow(station, -0.8, 1.9, 1.6, 1.5, 0.45);
    const pane = addBox(
      station,
      { x: 1.4, y: 1.5, z: 0.05 },
      { x: 1.8, y: 1.9, z: STORE_FRONT + 0.03 },
      glassMaterial,
    );
    pane.castShadow = false;
    const shard = addBox(
      station,
      { x: 0.5, y: 0.9, z: 0.04 },
      { x: 1.95, y: 1.75, z: STORE_FRONT + 0.08 },
      glassMaterial,
    );
    shard.rotation.z = 0.2;
    addBox(
      station,
      { x: 1.0, y: 2.1, z: 0.08 },
      { x: 3.6, y: 1.05, z: STORE_FRONT + 0.04 },
      steelMaterial,
    );
    for (const side of [-1, 1]) {
      addBox(
        station,
        { x: 0.14, y: 2.24, z: 0.24 },
        { x: 3.6 + side * 0.57, y: 1.12, z: STORE_FRONT + 0.08 },
        trimMaterial,
      );
    }
    addBox(
      station,
      { x: 1.28, y: 0.14, z: 0.24 },
      { x: 3.6, y: 2.24, z: STORE_FRONT + 0.08 },
      trimMaterial,
    );
    addBox(
      station,
      { x: 1.4, y: 0.14, z: 0.5 },
      { x: 3.6, y: 0.07, z: STORE_FRONT + 0.35 },
      concreteMaterial,
    );

    // Canopy over the island: four columns, a flat slab, and a faded fascia stripe. Variant 2
    // has lost it — stump columns and the slab chunk on the apron beside the forecourt.
    const canopyColumns: [number, number][] = [
      [-3.9, -0.3],
      [3.9, -0.3],
      [-3.9, 3.5],
      [3.9, 3.5],
    ];
    if (stripped) {
      for (const [cx, cz] of canopyColumns) {
        addBox(station, { x: 0.28, y: 0.7, z: 0.28 }, { x: cx, y: 0.35, z: cz }, steelMaterial);
      }
      const fallenSlab = addBox(
        station,
        { x: 4.6, y: 0.3, z: 2.4 },
        { x: 5.9, y: 0.44, z: 4.6 },
        roofMaterial,
      );
      fallenSlab.rotation.set(0.04, 0.5, 0.09);
      const fallenStripe = addBox(
        station,
        { x: 4.7, y: 0.16, z: 2.5 },
        { x: 6.02, y: 0.44, z: 4.72 },
        rustMaterial,
      );
      fallenStripe.rotation.set(0.04, 0.5, 0.09);
      // Rubble the slab came down on, so it visibly rests instead of hovering.
      const rubbleA = addBox(
        station,
        { x: 0.42, y: 0.26, z: 0.32 },
        { x: 4.15, y: 0.16, z: 3.1 },
        concreteMaterial,
      );
      rubbleA.rotation.set(0, 0.7, 0.1);
      const rubbleB = addBox(
        station,
        { x: 0.34, y: 0.2, z: 0.3 },
        { x: 5.1, y: 0.12, z: 3.6 },
        rustMaterial,
      );
      rubbleB.rotation.set(0, 0.2, 0.08);
    } else {
      for (const [cx, cz] of canopyColumns) {
        addBox(station, { x: 0.28, y: 3.9, z: 0.28 }, { x: cx, y: 1.95, z: cz }, steelMaterial);
      }
      const slab = addBox(
        station,
        { x: 9.8, y: 0.4, z: 5.8 },
        { x: 0, y: 4.0, z: 1.6 },
        roofMaterial,
      );
      addBox(station, { x: 9.9, y: 0.18, z: 5.9 }, { x: 0, y: 3.76, z: 1.6 }, rustMaterial);
      if (weathered) {
        slab.rotation.set(0.035, 0, 0.02);
        const flap = addBox(
          station,
          { x: 1.6, y: 0.06, z: 0.9 },
          { x: 3.4, y: 3.6, z: 4.15 },
          rustMaterial,
        );
        flap.rotation.set(0.5, 0, 0.1);
      }
    }

    // Pump island with two dispensers. Variant 2's islands keep their dispensers but the price
    // heads are stripped.
    addBox(station, { x: 5.6, y: 0.24, z: 1.9 }, { x: 0, y: 0.12, z: 1.6 }, concreteMaterial);
    addBox(station, { x: 5.4, y: 0.05, z: 1.7 }, { x: 0, y: 0.265, z: 1.6 }, concreteMaterial);
    addDispenser(station, -1.35, true, stripped);
    addDispenser(station, 1.35, true, stripped);

    // Four protective bollards at the island corners.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const bx = sx * 2.55;
        const bz = 1.6 + sz * 0.7;
        const bollard = new Mesh(new CylinderGeometry(0.13, 0.16, 0.8, 8), steelMaterial);
        bollard.position.set(bx, 0.64, bz);
        bollard.castShadow = true;
        station.add(bollard);
        const cap = new Mesh(new ConeGeometry(0.14, 0.16, 8), rustMaterial);
        cap.position.set(bx, 1.12, bz);
        cap.castShadow = true;
        station.add(cap);
        const band = new Mesh(new CylinderGeometry(0.14, 0.14, 0.09, 8), signalMaterial);
        band.position.set(bx, 0.88, bz);
        station.add(band);
      }
    }

    // Price sign on the forecourt edge: pole, rust board with two number panels, and a lamp head.
    const signX = 6.6;
    const signZ = 5.2;
    addBox(station, { x: 0.24, y: 6.2, z: 0.24 }, { x: signX, y: 3.1, z: signZ }, steelMaterial);
    if (stripped) {
      // The board is down, leaning against the pole base.
      const downBoard = addBox(
        station,
        { x: 2.2, y: 1.3, z: 0.16 },
        { x: signX - 1.4, y: 0.09, z: signZ + 0.4 },
        rustMaterial,
      );
      downBoard.rotation.set(-Math.PI / 2, 0, 0.35);
    } else {
      const board = addBox(
        station,
        { x: 2.2, y: 1.3, z: 0.16 },
        { x: signX, y: 5.5, z: signZ },
        rustMaterial,
      );
      if (weathered) board.rotation.z = 0.12;
      for (const px of [-0.38, 0.38]) {
        addBox(
          station,
          { x: 0.66, y: 0.5, z: 0.06 },
          { x: signX + px, y: 5.5, z: signZ + 0.11 },
          signalMaterial,
        );
      }
      addBox(station, { x: 0.5, y: 0.18, z: 0.3 }, { x: signX, y: 6.28, z: signZ }, steelMaterial);
      addBox(station, { x: 0.4, y: 0.08, z: 0.2 }, { x: signX, y: 6.22, z: signZ }, signalMaterial);
    }

    // Groundskeeping: two oil drums against the store wall and a crate by the door.
    const drumA = new Mesh(new CylinderGeometry(0.32, 0.32, 0.88, 10), rustMaterial);
    drumA.position.set(-5.7, 0.44, -3.2);
    drumA.castShadow = true;
    station.add(drumA);
    const drumB = new Mesh(new CylinderGeometry(0.32, 0.32, 0.88, 10), steelMaterial);
    drumB.position.set(-5.75, 0.44, -2.35);
    drumB.castShadow = true;
    station.add(drumB);
    const crate = addBox(
      station,
      { x: 0.6, y: 0.5, z: 0.6 },
      { x: 4.9, y: 0.25, z: -1.7 },
      boardMaterial,
    );
    crate.rotation.y = 0.3;

    station.userData.assetId = 'candidate-gas-station';
    return station;
  },
};
