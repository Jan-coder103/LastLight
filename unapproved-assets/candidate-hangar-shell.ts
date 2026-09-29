import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
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

const airframeMaterial = new MeshStandardMaterial({
  color: '#74765c',
  roughness: 0.95,
  flatShading: true,
});
airframeMaterial.name = 'airframe-fabric';

const airframeTrimMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.2,
});
airframeTrimMaterial.name = 'airframe-trim';

const propMaterial = new MeshStandardMaterial({ color: '#594332', roughness: 1 });
propMaterial.name = 'prop-timber';

const tyreMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
tyreMaterial.name = 'tyre-rubber';

const SPAN = 24;
const DEPTH = 18;
const SPRING = 5.5;
const RISE = 4.0;
const DOOR_W = 14;
// 5 m: tall enough for the display aircraft, and low enough that the leaves parked over the piers
// clear the arch edge (its underside dips to 5.7 m at the wall line, x = +/- 12).
const DOOR_H = 5.0;
const ARCH_SEGMENTS = 7;

// A convex polygon in the XY plane extruded from z0 to z1, fan-triangulated from the first
// corner; list the corners counter-clockwise for a +z outward face. Used to close the wall area
// under the faceted arch with one prism per region.
function prismFromPolygon(
  corners: [number, number][],
  z0: number,
  z1: number,
  material: MeshStandardMaterial,
): Mesh {
  const positions: number[] = [];
  const [first, ...rest] = corners;
  for (let i = 0; i < rest.length - 1; i++) {
    const p = rest[i]!;
    const q = rest[i + 1]!;
    positions.push(first[0], first[1], z1, p[0], p[1], z1, q[0], q[1], z1);
    positions.push(first[0], first[1], z0, q[0], q[1], z0, p[0], p[1], z0);
  }
  for (let i = 0; i < corners.length; i++) {
    const p = corners[i]!;
    const q = corners[(i + 1) % corners.length]!;
    positions.push(p[0], p[1], z0, q[0], q[1], z0, q[0], q[1], z1);
    positions.push(p[0], p[1], z0, q[0], q[1], z1, p[0], p[1], z1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return new Mesh(geometry, material);
}

export const candidateHangarShell: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-hangar-shell',
  name: 'Aircraft Hangar Shell',
  category: 'building',
  // Measured (vertex-accurate): 27.9 x 10.02 x 18.65. The x extent includes the open door leaves
  // parked out to x = +/- 13.95 on their external track, which overhang the piers; the leaves are
  // track-mounted and overhead of the pier line, so that overhang is not something the player
  // stands in.
  dimensions: { x: 28.0, y: 10.2, z: 18.8 },
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

    // Arch equation, shared by the segments and the gable closures below.
    const nodeY = (x: number) => 0.4 + SPRING + RISE * (1 - (x / halfSpan) ** 2);

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

    // Gable closures: the wall area between the wall tops and the arch underside, which the first
    // draft left open — that was the daylight hole across the top of the back wall. Each region
    // is one convex prism fan-triangulated under the arch curve; the underside is sampled every
    // metre and clamped to the base so the prism stays valid at the springing, and the base sits
    // 0.1 m inside the wall tops so no coplanar faces meet. The back closes solid; the front
    // closes around the door opening (two side strips and a header strip over the door).
    const undersideY = (x: number, base: number) => Math.max(nodeY(x) - 0.2, base);
    const arcPoints = (from: number, to: number, base: number): [number, number][] => {
      const step = from <= to ? 1 : -1;
      const points: [number, number][] = [];
      for (let x = from; step > 0 ? x <= to : x >= to; x += step) {
        points.push([x, undersideY(x, base)]);
      }
      return points;
    };
    const backBase = SPRING - 0.1;
    const backClosure = prismFromPolygon(
      [
        [-halfSpan, backBase],
        [halfSpan, backBase],
        [halfSpan, undersideY(halfSpan, backBase)],
        ...arcPoints(halfSpan - 1, -halfSpan + 1, backBase),
        [-halfSpan, undersideY(-halfSpan, backBase)],
      ],
      -halfDepth,
      -halfDepth + WALL,
      panelMaterial,
    );
    backClosure.castShadow = true;
    backClosure.receiveShadow = true;
    hangar.add(backClosure);

    const doorHalf = DOOR_W / 2;
    const frontBase = SPRING - 0.1;
    // The left strip runs wall-to-door counter-clockwise; the right strip is its mirror with the
    // corner list reversed, which restores counter-clockwise order.
    const leftCorners: [number, number][] = [
      [-halfSpan, frontBase],
      [-doorHalf, frontBase],
      [-doorHalf, undersideY(-doorHalf, frontBase)],
      ...arcPoints(-doorHalf - 1, -halfSpan, frontBase),
    ];
    for (const side of [-1, 1]) {
      const corners =
        side === -1
          ? leftCorners
          : leftCorners.map(([x, y]) => [-x, y] as [number, number]).reverse();
      const closure = prismFromPolygon(corners, halfDepth - WALL, halfDepth, panelMaterial);
      closure.castShadow = true;
      closure.receiveShadow = true;
      hangar.add(closure);
    }
    const headerBase = 0.4 + DOOR_H;
    const header = prismFromPolygon(
      [
        [-doorHalf, headerBase],
        [doorHalf, headerBase],
        [doorHalf, undersideY(doorHalf, headerBase)],
        ...arcPoints(doorHalf - 1, -doorHalf + 1, headerBase),
        [-doorHalf, undersideY(-doorHalf, headerBase)],
      ],
      halfDepth - WALL,
      halfDepth,
      panelMaterial,
    );
    header.castShadow = true;
    header.receiveShadow = true;
    hangar.add(header);

    // Front piers up to the door head, where the header strip takes over.
    for (const side of [-1, 1]) {
      const pierW = (SPAN - DOOR_W) / 2;
      const pier = new Mesh(new BoxGeometry(pierW, DOOR_H, WALL), panelMaterial);
      pier.position.set(side * (doorHalf + pierW / 2), 0.4 + DOOR_H / 2, halfDepth - WALL / 2);
      pier.castShadow = true;
      hangar.add(pier);
    }

    // Dark interior: a back panel and a floor, so the 14 m opening shows real depth. The panel
    // stands 0.1 m clear of the gable closure's inner face so the two never share a plane.
    const innerBack = new Mesh(new BoxGeometry(SPAN - 1, SPRING - 0.2, 0.08), interiorMaterial);
    innerBack.position.set(0, 0.4 + SPRING / 2, -halfDepth + WALL + 0.14);
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

    // A simple old monoplane parked left of centre, nose toward the door. Fabric-and-timber
    // shapes only: a slab fuselage with a tapered tail cone, a low wing, an open cockpit, fixed
    // gear with one flat tyre, and a two-blade prop. It sits on the interior floor slab (top at
    // 0.56), well inside the shell and under the door head.
    const plane = new Group();
    plane.position.set(-4, 0.56, -1.5);
    plane.rotation.y = 0.12;
    hangar.add(plane);
    const fuselage = new Mesh(new BoxGeometry(1.1, 1.15, 4.6), airframeMaterial);
    fuselage.position.set(0, 1.35, -1.2);
    plane.add(fuselage);
    const tailCone = new Mesh(new CylinderGeometry(0.2, 0.56, 2.4, 4), airframeMaterial);
    tailCone.rotation.x = -Math.PI / 2;
    tailCone.rotation.y = Math.PI / 4;
    tailCone.position.set(0, 1.35, -4.5);
    plane.add(tailCone);
    const cowl = new Mesh(new CylinderGeometry(0.58, 0.62, 0.5, 8), airframeTrimMaterial);
    cowl.rotation.x = Math.PI / 2;
    cowl.position.set(0, 1.35, 1.35);
    plane.add(cowl);
    const spinner = new Mesh(new CylinderGeometry(0.05, 0.18, 0.3, 6), airframeTrimMaterial);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.set(0, 1.35, 1.75);
    plane.add(spinner);
    const propBlade = new Mesh(new BoxGeometry(0.16, 2.6, 0.06), propMaterial);
    propBlade.position.set(0, 1.35, 1.68);
    plane.add(propBlade);
    const propBladeCross = propBlade.clone();
    propBladeCross.rotation.z = Math.PI / 2;
    plane.add(propBladeCross);
    const wing = new Mesh(new BoxGeometry(10.5, 0.14, 1.6), airframeMaterial);
    wing.position.set(0, 1.0, 0.3);
    plane.add(wing);
    const cockpit = new Mesh(new BoxGeometry(0.7, 0.28, 1.0), interiorMaterial);
    cockpit.position.set(0, 2.0, 0.5);
    plane.add(cockpit);
    const fin = new Mesh(new BoxGeometry(0.12, 1.35, 0.9), airframeMaterial);
    fin.position.set(0, 2.45, -5.0);
    plane.add(fin);
    const tailplane = new Mesh(new BoxGeometry(3.2, 0.1, 0.75), airframeMaterial);
    tailplane.position.set(0, 1.5, -5.0);
    plane.add(tailplane);
    for (const side of [-1, 1]) {
      const strut = new Mesh(new BoxGeometry(0.09, 0.75, 0.09), airframeTrimMaterial);
      strut.position.set(side * 1.3, 0.65, 0.55);
      plane.add(strut);
      const wheel = new Mesh(new CylinderGeometry(0.3, 0.3, 0.18, 8), tyreMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.3, 0.3, 0.55);
      // The left tyre has gone flat: squashed radially and settled on its rim.
      if (side < 0) {
        wheel.scale.set(0.72, 1, 1);
        wheel.position.y = 0.24;
      }
      plane.add(wheel);
    }
    const tailSkid = new Mesh(new BoxGeometry(0.07, 0.4, 0.07), propMaterial);
    tailSkid.position.set(0, 0.5, -5.4);
    tailSkid.rotation.x = 0.5;
    plane.add(tailSkid);

    hangar.userData.assetId = 'candidate-hangar-shell';
    return hangar;
  },
};
