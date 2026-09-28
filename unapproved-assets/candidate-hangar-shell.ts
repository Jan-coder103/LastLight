import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Aircraft hangar shell. Local +Z is the door end. The roof is a FACETED ARCH built from seven
// straight segments, which is both cheaper than a real curve and more in keeping with the batch's
// low-poly language. The arch is why this needs no gable helper.
const panelMaterials = [
  new MeshStandardMaterial({ color: '#58624d', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#626753', roughness: 0.9 }),
];
panelMaterials[0]!.name = 'hangar-panel-olive';
panelMaterials[1]!.name = 'hangar-panel-grey';
panelMaterials[2]!.name = 'hangar-panel-faded';

const doorMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.2,
});
doorMaterial.name = 'hangar-door';

const interiorMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const baseMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
baseMaterial.name = 'concrete-base';

const rustMaterial = new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9 });
rustMaterial.name = 'rust-streak';

const SPAN = 24;
const DEPTH = 18;
const SPRING = 5.5;
const RISE = 4.0;
const DOOR_W = 14;
const DOOR_H = 7;
const ARCH_SEGMENTS = 7;

export const candidateHangarShell: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-hangar-shell',
  name: 'Aircraft Hangar Shell',
  category: 'building',
  dimensions: { x: 28.0, y: 11.5, z: 18.8 },
  // The hangar body. As with the barn shell, this box also covers the 14 m door opening, so the
  // hangar is not enterable. That is the largest instance of this issue in the batch.
  collider: { center: { x: 0, y: 5.0, z: 0 }, size: { x: 24, y: 10, z: 18 } },
  // Note: the open door leaves overhang the piers out to x = 13.95, so the visual is 27.9 m wide
  // against a 24 m collider. The leaves are track-mounted and overhead of the pier line, so that
  // overhang is not something the player stands in.
  interactionPoints: [
    { id: 'hangar-door', label: 'Hangar Door', position: { x: 0, y: 0, z: 10.2 } },
  ],
  createVisual(variant = 0) {
    const hangar = new Group();
    const panelMaterial = panelMaterials[variant % panelMaterials.length]!;
    const doorOpen = variant !== 1;
    const halfSpan = SPAN / 2;
    const halfDepth = DEPTH / 2;
    const WALL = 0.5;

    const apron = new Mesh(new BoxGeometry(SPAN + 0.6, 0.4, DEPTH + 0.6), baseMaterial);
    apron.position.y = 0.2;
    apron.receiveShadow = true;
    hangar.add(apron);

    // Side and back walls, stopping at the springing line where the arch begins.
    for (const side of [-1, 1]) {
      const wall = new Mesh(new BoxGeometry(WALL, SPRING, DEPTH), panelMaterial);
      wall.position.set(side * (halfSpan - WALL / 2), 0.4 + SPRING / 2, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      hangar.add(wall);
    }
    const back = new Mesh(new BoxGeometry(SPAN, SPRING, WALL), panelMaterial);
    back.position.set(0, 0.4 + SPRING / 2, -halfDepth + WALL / 2);
    back.castShadow = true;
    back.receiveShadow = true;
    hangar.add(back);

    // Faceted arch: seven straight segments following a parabola. Height at each node is derived
    // from the arch equation rather than listed, so changing RISE or the span cannot leave the
    // segments disconnected.
    const nodeY = (x: number) => 0.4 + SPRING + RISE * (1 - (x / halfSpan) ** 2);
    for (let i = 0; i < ARCH_SEGMENTS; i++) {
      const x0 = -halfSpan + (SPAN * i) / ARCH_SEGMENTS;
      const x1 = -halfSpan + (SPAN * (i + 1)) / ARCH_SEGMENTS;
      const y0 = nodeY(x0);
      const y1 = nodeY(x1);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const seg = new Mesh(new BoxGeometry(Math.hypot(dx, dy), 0.4, DEPTH + 0.3), panelMaterial);
      seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0);
      seg.rotation.z = Math.atan2(dy, dx);
      seg.castShadow = true;
      seg.receiveShadow = true;
      hangar.add(seg);
    }

    // Front wall around the 14 m opening: two piers and a lintel.
    for (const side of [-1, 1]) {
      const pierW = (SPAN - DOOR_W) / 2;
      const pier = new Mesh(new BoxGeometry(pierW, SPRING + 0.4, WALL), panelMaterial);
      pier.position.set(
        side * (DOOR_W / 2 + pierW / 2),
        0.4 + (SPRING + 0.4) / 2,
        halfDepth - WALL / 2,
      );
      pier.castShadow = true;
      hangar.add(pier);
    }
    const lintel = new Mesh(new BoxGeometry(DOOR_W, RISE, WALL), panelMaterial);
    lintel.position.set(0, 0.4 + DOOR_H + RISE / 2, halfDepth - WALL / 2);
    lintel.castShadow = true;
    hangar.add(lintel);

    // Dark interior: a back panel and a floor, so the 14 m opening shows real depth.
    const innerBack = new Mesh(new BoxGeometry(SPAN - 1, SPRING - 0.2, 0.08), interiorMaterial);
    innerBack.position.set(0, 0.4 + SPRING / 2, -halfDepth + WALL + 0.04);
    hangar.add(innerBack);
    const floor = new Mesh(new BoxGeometry(SPAN - 1, 0.16, DEPTH - 1), interiorMaterial);
    floor.position.y = 0.48;
    hangar.add(floor);

    // Two sliding leaves, each half the opening. Open: parked over the piers at +/-10.5. Shut:
    // each leaf meets the other at the centre, so the closed x is DOOR_W/4, NOT 0. Centring both
    // leaves on the origin stacked them in the middle and left 3.5 m open at each shoulder.
    for (const side of [-1, 1]) {
      const x = doorOpen ? side * (DOOR_W / 2 + DOOR_W / 4) : side * (DOOR_W / 4);
      const leaf = new Mesh(new BoxGeometry(DOOR_W / 2 - 0.1, DOOR_H - 0.1, 0.22), doorMaterial);
      leaf.position.set(x, 0.4 + (DOOR_H - 0.1) / 2, halfDepth + 0.16);
      leaf.castShadow = true;
      hangar.add(leaf);
      // Ribs on each leaf: without them a 7 x 7 m slab has nothing to read as.
      for (let i = 1; i < 4; i++) {
        const rib = new Mesh(new BoxGeometry(0.16, DOOR_H - 0.3, 0.1), doorMaterial);
        rib.position.set(
          x + side * (DOOR_W / 4) * (i / 4 - 0.5) * 1.6,
          0.4 + (DOOR_H - 0.1) / 2,
          halfDepth + 0.3,
        );
        hangar.add(rib);
      }
    }
    const track = new Mesh(new BoxGeometry(SPAN - 0.6, 0.16, 0.16), doorMaterial);
    track.position.set(0, 0.4 + DOOR_H + 0.1, halfDepth + 0.2);
    track.castShadow = true;
    hangar.add(track);

    // Weathered metal: horizontal panel bands up the side walls, and two rust streaks running
    // down from the arch springing.
    for (const side of [-1, 1]) {
      for (const y of [1.4, 3.0, 4.6]) {
        const band = new Mesh(new BoxGeometry(0.1, 0.18, DEPTH - 0.6), panelMaterial);
        band.position.set(side * (halfSpan + 0.04), y, 0);
        hangar.add(band);
      }
    }
    for (const x of [-7.5, 6.0]) {
      const streak = new Mesh(new BoxGeometry(0.7, SPRING - 0.6, 0.05), rustMaterial);
      streak.position.set(x, 0.4 + (SPRING - 0.6) / 2, -halfDepth - 0.03);
      hangar.add(streak);
    }

    hangar.userData.assetId = 'candidate-hangar-shell';
    return hangar;
  },
};
