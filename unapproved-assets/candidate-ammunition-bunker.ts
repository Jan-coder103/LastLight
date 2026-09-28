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
// Ammunition bunker: an earth-covered magazine. A concrete chamber sits at the core with its door
// face flush at +Z; earth wedges berm against the sides and rear, and a turf-capped earth ridge
// covers the roof, so the face reads as a portal cut into a hillside rather than a wall with a
// mound behind it. The door is CLOSED, which is correct for the object and means this candidate
// has no collider-versus-opening problem.
const concreteMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#797762', roughness: 1 }),
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1 }),
];
concreteMaterials[0]!.name = 'bunker-concrete';
concreteMaterials[1]!.name = 'bunker-concrete-dark';
concreteMaterials[2]!.name = 'bunker-concrete-pale';

const earthMaterial = new MeshStandardMaterial({ color: '#514437', roughness: 1 });
earthMaterial.name = 'berm-earth';

const turfMaterial = new MeshStandardMaterial({
  color: '#58624d',
  roughness: 1,
  flatShading: true,
});
turfMaterial.name = 'berm-turf';

const doorMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.25,
});
doorMaterial.name = 'blast-door';

const placardMaterial = new MeshStandardMaterial({ color: '#c5ad70', roughness: 0.9 });
placardMaterial.name = 'placard-warning';

const textMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 0.95 });
textMaterial.name = 'door-shadow';

const DOOR_W = 1.5;
const DOOR_H = 2.2;
const FACE_Z = 2.5;
const BACK_Z = -3.5;

// A three-corner prism extruded along Z from z0 to z1, for the earth berms. Low-poly by
// construction; flat shading does the faceting.
function prism(
  profile: [number, number][],
  z0: number,
  z1: number,
  material: MeshStandardMaterial,
): Mesh {
  const [a, b, c] = profile;
  const front = [...a!, z1, ...b!, z1, ...c!, z1];
  const back = [...c!, z0, ...b!, z0, ...a!, z0];
  const sides: [number, number][][] = [
    [a!, b!],
    [b!, c!],
    [c!, a!],
  ];
  const positions: number[] = [...front, ...back];
  for (const [p, q] of sides) {
    positions.push(p[0], p[1], z0, q[0], q[1], z0, q[0], q[1], z1);
    positions.push(p[0], p[1], z0, q[0], q[1], z1, p[0], p[1], z1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return new Mesh(geometry, material);
}

export const candidateAmmunitionBunker: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-ammunition-bunker',
  name: 'Ammunition Bunker',
  category: 'building',
  dimensions: { x: 7.8, y: 3.5, z: 8.8 },
  collider: { center: { x: 0, y: 1.7, z: -0.5 }, size: { x: 7.4, y: 3.4, z: 8.0 } },
  interactionPoints: [
    { id: 'bunker-door', label: 'Bunker Door', position: { x: 0, y: 0, z: 3.7 } },
  ],
  createVisual(variant = 0) {
    const bunker = new Group();
    const concreteMaterial = concreteMaterials[variant % concreteMaterials.length]!;
    const placardsIntact = variant !== 1;

    // Concrete chamber: the whole structure. Its front wall at +Z is the door face.
    const chamber = new Mesh(new BoxGeometry(4.4, 2.6, BACK_Z * -1 + FACE_Z), concreteMaterial);
    chamber.position.set(0, 1.3, (FACE_Z + BACK_Z) / 2);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    bunker.add(chamber);

    // Earth berms: two side wedges rising against the chamber walls, and a rear wedge across the
    // back. Toes at 3.9 m from the centre give the mound its footprint.
    for (const side of [-1, 1]) {
      const wedge = prism(
        [
          [side * 2.2, 0],
          [side * 3.9, 0],
          [side * 2.2, 2.55],
        ],
        BACK_Z,
        FACE_Z,
        earthMaterial,
      );
      wedge.castShadow = true;
      wedge.receiveShadow = true;
      bunker.add(wedge);
    }
    const rear = prism(
      [
        [3.5, 0],
        [5.2, 0],
        [3.5, 2.55],
      ],
      -2.2,
      2.2,
      earthMaterial,
    );
    // Rotating +90 degrees about Y maps the profile's x (3.5..5.2) onto world -z, so the wedge
    // rises from the chamber's back wall (z = -3.5) down to its toe at z = -5.2, with the prism's
    // length axis becoming the bunker's x axis.
    rear.rotation.y = Math.PI / 2;
    rear.castShadow = true;
    rear.receiveShadow = true;
    bunker.add(rear);

    // Roof mound: an earth ridge over the chamber with a steeper turf layer on top, inset from
    // the ridge's front and back edges. The turf meets the earth exactly at the base corners, so
    // the green cap reads as grass over earth from above.
    const roofEarth = prism(
      [
        [-2.2, 2.55],
        [2.2, 2.55],
        [0, 3.05],
      ],
      BACK_Z,
      FACE_Z,
      earthMaterial,
    );
    roofEarth.castShadow = true;
    roofEarth.receiveShadow = true;
    bunker.add(roofEarth);
    const roofTurf = prism(
      [
        [-2.2, 2.55],
        [2.2, 2.55],
        [0, 3.42],
      ],
      BACK_Z + 0.1,
      FACE_Z - 0.1,
      turfMaterial,
    );
    roofTurf.castShadow = true;
    roofTurf.receiveShadow = true;
    bunker.add(roofTurf);

    // Grass tufts on the side berms, deterministic placement only.
    for (const [x, y, z] of [
      [2.95, 1.25, 0.9],
      [3.4, 0.5, -1.5],
      [-2.8, 1.6, 1.6],
      [-3.3, 0.65, -2.0],
    ] as const) {
      const tuft = new Mesh(new CylinderGeometry(0.02, 0.11, 0.24, 5), turfMaterial);
      tuft.position.set(x, y + 0.06, z);
      bunker.add(tuft);
    }

    // Door recess, so the heavy door sits inside a frame rather than on the face.
    const recess = new Mesh(new BoxGeometry(DOOR_W - 0.16, DOOR_H - 0.12, 0.1), textMaterial);
    recess.position.set(0, DOOR_H / 2, FACE_Z - 0.31);
    bunker.add(recess);

    // Heavy blast door: leaf, hinges, and a wheel handle. Closed, and that is the correct state
    // for an ammunition store.
    const door = new Mesh(new BoxGeometry(DOOR_W - 0.1, DOOR_H - 0.08, 0.16), doorMaterial);
    door.position.set(0, DOOR_H / 2, FACE_Z - 0.21);
    door.castShadow = true;
    bunker.add(door);
    const wheel = new Mesh(new CylinderGeometry(0.28, 0.28, 0.08, 10), doorMaterial);
    wheel.position.set(0.42, DOOR_H / 2, FACE_Z - 0.08);
    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    bunker.add(wheel);
    for (let i = 0; i < 3; i++) {
      const spoke = new Mesh(new BoxGeometry(0.5, 0.06, 0.05), doorMaterial);
      spoke.position.set(0.42, DOOR_H / 2, FACE_Z - 0.08);
      spoke.rotation.z = (i / 3) * Math.PI;
      bunker.add(spoke);
    }
    for (const y of [0.5, 1.1, 1.7]) {
      const hinge = new Mesh(new BoxGeometry(0.12, 0.18, 0.2), doorMaterial);
      hinge.position.set(-(DOOR_W / 2) + 0.02, y, FACE_Z - 0.21);
      bunker.add(hinge);
    }
    // Door frame standing proud of the face.
    for (const [w, h, x, y] of [
      [0.18, DOOR_H + 0.3, -(DOOR_W / 2) - 0.09, (DOOR_H + 0.3) / 2],
      [0.18, DOOR_H + 0.3, DOOR_W / 2 + 0.09, (DOOR_H + 0.3) / 2],
      [DOOR_W + 0.36, 0.18, 0, DOOR_H + 0.15],
    ] as const) {
      const frame = new Mesh(new BoxGeometry(w, h, 0.26), concreteMaterial);
      frame.position.set(x, y, FACE_Z + 0.19);
      frame.castShadow = true;
      bunker.add(frame);
    }

    // Warning placards either side of the door. The amber is the only warm colour and it is a
    // functional warning, which is the sanctioned use.
    for (const side of [-1, 1]) {
      if (!placardsIntact && side < 0) continue;
      const placard = new Mesh(new BoxGeometry(0.5, 0.7, 0.05), placardMaterial);
      placard.position.set(side * 1.1, 1.5, FACE_Z + 0.31);
      placard.castShadow = true;
      bunker.add(placard);
      // Three bars standing in for stencilled text: this runtime builds geometry, not textures.
      for (let i = 0; i < 3; i++) {
        const bar = new Mesh(new BoxGeometry(0.34 - i * 0.06, 0.07, 0.03), textMaterial);
        bar.position.set(side * 1.1, 1.66 - i * 0.16, FACE_Z + 0.34);
        bunker.add(bar);
      }
    }

    // Roof vent through the turf, and buttressed retaining kerbs flanking the approach.
    const vent = new Mesh(new CylinderGeometry(0.22, 0.26, 0.5, 8), doorMaterial);
    vent.position.set(1.0, 3.0, -1.2);
    vent.castShadow = true;
    bunker.add(vent);
    const ventCap = new Mesh(new CylinderGeometry(0.34, 0.28, 0.12, 8), doorMaterial);
    ventCap.position.set(1.0, 3.31, -1.2);
    bunker.add(ventCap);
    for (const x of [-2.05, 2.05]) {
      const kerb = new Mesh(new BoxGeometry(0.5, 0.7, 1.3), concreteMaterial);
      kerb.position.set(x, 0.35, 2.9);
      kerb.castShadow = true;
      kerb.receiveShadow = true;
      bunker.add(kerb);
    }

    bunker.userData.assetId = 'candidate-ammunition-bunker';
    return bunker;
  },
};
