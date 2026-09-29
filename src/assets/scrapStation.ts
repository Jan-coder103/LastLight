import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Scrap sorting station. Local +Z is the front of the table, i.e. the side a player stands on. A
// waist-high trestle: a timber top, a hand-cranked platform scale at one end, four sorted bins
// under the other, and a rail of hanging hooks with three pieces of scrap on it. The bins are
// what make it read as sorting rather than as a market stall, and the four-way split is the
// silhouette at distance.
const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'scrap-timber';

const paleTimberMaterial = new MeshStandardMaterial({
  color: '#655744',
  roughness: 1,
  flatShading: true,
});
paleTimberMaterial.name = 'scrap-pale-timber';

const steelMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'scrap-steel';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'scrap-rust';

const darkMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.9,
  metalness: 0.25,
  flatShading: true,
});
darkMaterial.name = 'scrap-dark';

const concreteMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'scrap-concrete';

const greenMaterial = new MeshStandardMaterial({
  color: '#42684d',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
greenMaterial.name = 'scrap-bin-green';

const blueMaterial = new MeshStandardMaterial({
  color: '#526e70',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
blueMaterial.name = 'scrap-bin-blue';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'scrap-signal';

const UP = new Vector3(0, 1, 0);

function spanTo(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  material: MeshStandardMaterial,
): Mesh {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  const seg = new Mesh(new CylinderGeometry(radius, radius, dir.length(), 5), material);
  seg.quaternion.setFromUnitVectors(UP, dir.normalize());
  seg.position.copy(a).add(b).multiplyScalar(0.5);
  seg.castShadow = true;
  return seg;
}

const TOP_Y = 0.92;
const TOP_W = 2.8;
const TOP_D = 0.86;

export const scrapStation: AuthoredAsset = {
  schemaVersion: 1,
  id: 'scrap-station',
  name: 'Scrap Sorting Station',
  category: 'prop',
  dimensions: { x: 4.2, y: 1.9, z: 1.4 },
  collider: {
    center: { x: 0, y: 0.46, z: 0 },
    size: { x: TOP_W, y: 0.92, z: TOP_D },
  },
  interactionPoints: [
    { id: 'scrap-scale', label: 'Hand Scale', position: { x: -0.9, y: 0, z: 0.72 } },
  ],
  createVisual(variant = 0) {
    const station = new Group();
    const binEmpty = variant === 1;
    const tableCleared = variant === 2;

    // Concrete pad: the station is a built thing with legs, and a pad is what its feet stand on.
    const pad = new Mesh(new BoxGeometry(3.0, 0.08, 1.3), concreteMaterial);
    pad.position.set(0, 0.04, 0);
    pad.receiveShadow = true;
    station.add(pad);

    // Trestle legs: four pairs of splayed boards with a cross brace, not four posts. The splay is
    // what makes it a trestle and it is also what stops it looking like a table.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        for (const off of [-0.07, 0.07]) {
          // The leg is lifted 8 mm so its splayed lower corner clears the ground; at 0.09 rad of
          // splay that is exactly the amount the rotation costs.
          const leg = new Mesh(new BoxGeometry(0.07, TOP_Y, 0.09), timberMaterial);
          leg.position.set(
            sx * (TOP_W / 2 - 0.16) + off,
            TOP_Y / 2 + 0.008,
            sz * (TOP_D / 2 - 0.14),
          );
          leg.rotation.z = -sx * 0.09;
          leg.rotation.x = sz * 0.07;
          leg.castShadow = true;
          leg.receiveShadow = true;
          station.add(leg);
        }
      }
      // Cross brace between each pair of leg sets.
      station.add(
        spanTo(
          [sx * (TOP_W / 2 - 0.16), 0.34, -TOP_D / 2 + 0.14],
          [sx * (TOP_W / 2 - 0.16), 0.34, TOP_D / 2 - 0.14],
          0.05,
          paleTimberMaterial,
        ),
      );
      // A short cross stretcher from each trestle in toward the centre, at the same height as the
      // side braces. An earlier draft ran one long diagonal from trestle to trestle, which crossed
      // the bin bay and read as a broken leg.
      station.add(
        spanTo([sx * (TOP_W / 2 - 0.2), 0.38, 0], [sx * 0.55, 0.38, 0], 0.045, paleTimberMaterial),
      );
    }

    // Table top: five boards, each a different timber, running along X. Two of them are displaced
    // in variant 2 so the top reads as half cleared.
    const boardMats = [
      timberMaterial,
      paleTimberMaterial,
      timberMaterial,
      paleTimberMaterial,
      timberMaterial,
    ];
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5;
      const cleared = tableCleared && (i === 1 || i === 3);
      const board = new Mesh(
        new BoxGeometry(cleared ? TOP_W - 0.7 : TOP_W, 0.06, TOP_D / 5 - 0.02),
        boardMats[i]!,
      );
      board.position.set(cleared ? -0.34 : 0, TOP_Y + 0.03, -TOP_D / 2 + t * TOP_D);
      board.rotation.z = cleared ? 0.03 : 0;
      board.castShadow = true;
      board.receiveShadow = true;
      station.add(board);
    }
    // A front apron board, so the top has thickness from the front.
    const apron = new Mesh(new BoxGeometry(TOP_W, 0.14, 0.05), paleTimberMaterial);
    apron.position.set(0, TOP_Y - 0.05, TOP_D / 2);
    apron.castShadow = true;
    station.add(apron);

    // Hand platform scale at the −X end: a column, a cradle arm, a dial face, and a weighing pan
    // on a post. The pan is the part that says "scale" and it is deliberately canted.
    const scaleBase = new Mesh(new BoxGeometry(0.36, 0.1, 0.36), darkMaterial);
    scaleBase.position.set(-1.05, TOP_Y + 0.11, 0);
    scaleBase.castShadow = true;
    station.add(scaleBase);
    const scaleColumn = new Mesh(new CylinderGeometry(0.06, 0.08, 0.42, 6), steelMaterial);
    scaleColumn.position.set(-1.05, TOP_Y + 0.37, 0);
    scaleColumn.castShadow = true;
    station.add(scaleColumn);
    const scaleHead = new Mesh(new BoxGeometry(0.22, 0.24, 0.2), steelMaterial);
    scaleHead.position.set(-1.05, TOP_Y + 0.68, 0.02);
    scaleHead.castShadow = true;
    station.add(scaleHead);
    const dial = new Mesh(new CylinderGeometry(0.12, 0.12, 0.04, 12), concreteMaterial);
    dial.rotation.x = Math.PI / 2 - 0.25;
    dial.position.set(-1.05, TOP_Y + 0.72, 0.15);
    dial.castShadow = true;
    station.add(dial);
    const dialRim = new Mesh(new TorusGeometry(0.12, 0.02, 4, 12), steelMaterial);
    dialRim.rotation.x = Math.PI / 2 - 0.25;
    dialRim.position.set(-1.05, TOP_Y + 0.72, 0.15);
    station.add(dialRim);
    const needle = new Mesh(new BoxGeometry(0.015, 0.1, 0.015), rustMaterial);
    needle.position.set(-1.02, TOP_Y + 0.74, 0.17);
    needle.rotation.set(0.25, 0, 0.35);
    station.add(needle);
    // The pan, on a short post off the head, with two scrap pieces sitting in it.
    const panPost = new Mesh(new CylinderGeometry(0.03, 0.03, 0.3, 5), steelMaterial);
    panPost.position.set(-1.28, TOP_Y + 0.5, 0.1);
    panPost.rotation.z = 0.3;
    station.add(panPost);
    const pan = new Mesh(new CylinderGeometry(0.26, 0.2, 0.07, 10), steelMaterial);
    pan.position.set(-1.36, TOP_Y + 0.36, 0.12);
    pan.rotation.set(0.12, 0, 0.16);
    pan.castShadow = true;
    station.add(pan);
    const panRim = new Mesh(new TorusGeometry(0.26, 0.022, 4, 10), rustMaterial);
    panRim.position.set(-1.36, TOP_Y + 0.39, 0.12);
    panRim.rotation.set(1.45, 0, 0.16);
    panRim.castShadow = true;
    station.add(panRim);
    if (!tableCleared) {
      const weighed = new Mesh(new BoxGeometry(0.16, 0.1, 0.22), darkMaterial);
      weighed.position.set(-1.38, TOP_Y + 0.44, 0.11);
      weighed.rotation.set(0.1, 0.5, 0.14);
      weighed.castShadow = true;
      station.add(weighed);
      const weighedBent = new Mesh(new BoxGeometry(0.2, 0.05, 0.16), rustMaterial);
      weighedBent.position.set(-1.32, TOP_Y + 0.52, 0.16);
      weighedBent.rotation.set(0.1, -0.3, 0.5);
      weighedBent.castShadow = true;
      station.add(weighedBent);
    }

    // Four sorted bins under the +X half, in two different colours so the split reads as sorting
    // rather than as four identical crates. Each bin is an open box: four walls and a floor.
    const binMats = [greenMaterial, blueMaterial, greenMaterial, rustMaterial];
    for (let i = 0; i < 4; i++) {
      const bx = 0.15 + (i % 2) * 0.62;
      const bz = -0.3 + Math.floor(i / 2) * 0.58;
      const bin = new Group();
      bin.position.set(bx, 0, bz);
      station.add(bin);
      const mat = binMats[i]!;
      const floorPlate = new Mesh(new BoxGeometry(0.5, 0.04, 0.5), mat);
      floorPlate.position.y = 0.06;
      floorPlate.receiveShadow = true;
      bin.add(floorPlate);
      for (const sx of [-1, 1]) {
        const wall = new Mesh(new BoxGeometry(0.04, 0.34, 0.5), mat);
        wall.position.set(sx * 0.23, 0.23, 0);
        wall.castShadow = true;
        wall.receiveShadow = true;
        bin.add(wall);
      }
      for (const sz of [-1, 1]) {
        const wall = new Mesh(new BoxGeometry(0.46, 0.34, 0.04), mat);
        wall.position.set(0, 0.23, sz * 0.23);
        wall.castShadow = true;
        wall.receiveShadow = true;
        bin.add(wall);
      }
      // Contents: two or three sorted pieces per bin, on a fixed arrangement. Variant 1 empties
      // them all, which is the clearest "cleared out" state.
      if (!binEmpty) {
        const allPieces: [number, number, number, number][] = [
          [-0.1, 0.14, 0.0, 0.5],
          [0.08, 0.2, -0.06, 1.1],
          [0.02, 0.3, 0.1, 2.0],
        ];
        const pieces = allPieces.slice(0, (i % 2) + 2);
        for (const [px, py, pz, rot] of pieces) {
          const piece = new Mesh(
            new BoxGeometry(0.26, 0.09, 0.16),
            i % 2 === 0 ? rustMaterial : darkMaterial,
          );
          piece.position.set(px, py + 0.02, pz);
          piece.rotation.set(0.2 * (i % 3), rot, 0.14 * (i % 2));
          piece.castShadow = true;
          bin.add(piece);
        }
      }
      // A stencilled sort mark on the front of each bin, and a lip.
      const lip = new Mesh(new BoxGeometry(0.5, 0.04, 0.06), steelMaterial);
      lip.position.set(0, 0.4, -0.25);
      lip.castShadow = true;
      bin.add(lip);
      const mark = new Mesh(new BoxGeometry(0.16, 0.05, 0.02), signalMaterial);
      mark.position.set(0, 0.24, -0.26);
      bin.add(mark);
    }

    // Hanging rail across the back of the table with three hooks and three pieces of scrap on it.
    const railY = TOP_Y + 0.66;
    for (const sx of [-1, 1]) {
      const upright = new Mesh(new BoxGeometry(0.07, 0.7, 0.07), steelMaterial);
      upright.position.set(sx * (TOP_W / 2 - 0.2), TOP_Y + 0.35, -TOP_D / 2 + 0.08);
      upright.castShadow = true;
      station.add(upright);
    }
    const rail = new Mesh(new CylinderGeometry(0.025, 0.025, TOP_W - 0.4, 6), steelMaterial);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, railY, -TOP_D / 2 + 0.08);
    rail.castShadow = true;
    station.add(rail);
    const hookItems: [number, number][] = [
      [-0.55, 0.26],
      [0.1, 0.34],
      [0.7, 0.2],
    ];
    for (let i = 0; i < hookItems.length; i++) {
      const [hx, drop] = hookItems[i]!;
      const hook = new Mesh(new TorusGeometry(0.05, 0.012, 4, 8, Math.PI * 1.4), steelMaterial);
      hook.position.set(hx, railY - 0.05, -TOP_D / 2 + 0.08);
      hook.rotation.x = Math.PI;
      station.add(hook);
      if (tableCleared && i === 1) continue;
      const item = new Mesh(
        new BoxGeometry(0.1, drop, 0.06),
        i === 1 ? darkMaterial : rustMaterial,
      );
      item.position.set(hx, railY - 0.08 - drop / 2, -TOP_D / 2 + 0.08);
      item.rotation.z = 0.06 * (i - 1);
      item.castShadow = true;
      station.add(item);
      // A hook eye at the top of each piece, so the pieces are hung rather than floating.
      const eye = new Mesh(new TorusGeometry(0.03, 0.01, 4, 8), steelMaterial);
      eye.position.set(hx, railY - 0.06, -TOP_D / 2 + 0.08);
      eye.rotation.x = Math.PI / 2;
      station.add(eye);
    }

    // Ground: a spill of sorted-offcuts on the pad and a scrap heap behind. Five meshes, and the
    // heap is what stops the pad looking swept.
    const heapPieces: [number, number, number, number][] = [
      [1.85, 0.12, -0.2, 0.4],
      [2.0, 0.26, 0.0, 1.2],
      [1.7, 0.36, 0.1, 2.1],
      [2.1, 0.18, 0.24, 0.7],
    ];
    for (let i = 0; i < heapPieces.length; i++) {
      if (variant === 1 && i > 1) continue;
      const [hx, hy, hz, rot] = heapPieces[i]!;
      const piece = new Mesh(
        new BoxGeometry(0.5, 0.11, 0.3),
        i % 2 === 0 ? rustMaterial : darkMaterial,
      );
      piece.position.set(hx, hy, hz);
      piece.rotation.set(0.1 * i, rot, 0.12 * (i % 2));
      piece.castShadow = true;
      piece.receiveShadow = true;
      station.add(piece);
    }
    const offcut = new Mesh(new CylinderGeometry(0.16, 0.16, 0.5, 8), rustMaterial);
    offcut.rotation.set(0, 0.6, Math.PI / 2);
    offcut.position.set(-1.5, 0.16, 0.42);
    offcut.castShadow = true;
    station.add(offcut);

    station.userData.assetId = 'candidate-scrap-station';
    return station;
  },
};
