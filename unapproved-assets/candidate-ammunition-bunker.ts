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
  // Measured (vertex-accurate): 7.8 x 3.42 x 9.0. The z bounds are asymmetric about the pivot —
  // the rear wedge toe runs to z = -5.2 while the kerbs stop at z = 3.8 — so the declared z
  // covers twice the largest offset; the earlier 8.8 left the toe outside the placement bounds.
  dimensions: { x: 7.8, y: 3.5, z: 10.4 },
  collider: { center: { x: 0, y: 1.7, z: -0.5 }, size: { x: 7.4, y: 3.4, z: 8.0 } },
  interactionPoints: [
    { id: 'bunker-door', label: 'Bunker Door', position: { x: 0, y: 0, z: 3.7 } },
  ],
  createVisual(variant = 0) {
    const bunker = new Group();
    const concreteMaterial = concreteMaterials[variant % concreteMaterials.length]!;
    const placardsIntact = variant !== 1;

    // Concrete chamber: the whole structure. Its front wall at +Z is the door face, and its top
    // at y = 2.6 is the plane the roof mound and berm tops meet (CHAMBER_TOP below), so no earth
    // surface can cut through concrete or share its plane.
    const chamber = new Mesh(new BoxGeometry(4.4, 2.6, BACK_Z * -1 + FACE_Z), concreteMaterial);
    chamber.position.set(0, 1.3, (FACE_Z + BACK_Z) / 2);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    bunker.add(chamber);

    // Earth berms: two side wedges rising against the chamber walls, and a rear wedge across the
    // back. Toes at 3.9 m from the centre give the mound its footprint; the tops stop exactly at
    // the chamber top so they tuck under the roof ridge's base edge.
    for (const side of [-1, 1]) {
      const wedge = prism(
        [
          [side * 2.2, 0],
          [side * 3.9, 0],
          [side * 2.2, 2.6],
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
        [3.5, 2.6],
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

    // Roof mound: an earth ridge sitting exactly ON the chamber top with a steeper turf cap
    // above it, inset from the ridge's front and back edges and lifted 2 cm so the two prisms'
    // hidden bottom faces cannot share a plane. The earlier base of 2.55 cut 5 cm into the
    // chamber, which put coplanar earth/concrete bands across the top of both end faces.
    const roofEarth = prism(
      [
        [-2.2, 2.6],
        [2.2, 2.6],
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
        [-2.2, 2.62],
        [2.2, 2.62],
        [0, 3.42],
      ],
      BACK_Z + 0.1,
      FACE_Z - 0.1,
      turfMaterial,
    );
    roofTurf.castShadow = true;
    roofTurf.receiveShadow = true;
    bunker.add(roofTurf);

    // Grass tufts on the side berms, seated on the wedge slope (y = 2.6 * (3.9 - |x|) / 1.7),
    // deterministic placement only.
    for (const [x, z] of [
      [3.1, 0.9],
      [3.5, -1.5],
      [-2.9, 1.6],
      [-3.4, -2.0],
    ] as const) {
      const tuft = new Mesh(new CylinderGeometry(0.02, 0.11, 0.24, 5), turfMaterial);
      tuft.position.set(x, (2.6 * (3.9 - Math.abs(x))) / 1.7 + 0.04, z);
      bunker.add(tuft);
    }

    // Dark backing plate bedded INTO the face behind the door, so the leaf sits on shadow rather
    // than on painted concrete. Kept 2 cm above the ground so nothing shows below the slab edge.
    const backing = new Mesh(
      new BoxGeometry(DOOR_W + 0.04, DOOR_H - 0.04, 0.06),
      textMaterial,
    );
    backing.position.set(0, DOOR_H / 2, FACE_Z);
    bunker.add(backing);

    // Heavy blast door: leaf, hinges, and a wheel handle, all surface-mounted PROUD of the face.
    // The first draft placed every one of these parts in front of z = 2.5 minus an offset, which
    // buried the whole assembly inside the solid chamber where it could not be seen.
    const door = new Mesh(new BoxGeometry(DOOR_W - 0.1, DOOR_H - 0.08, 0.16), doorMaterial);
    door.position.set(0, DOOR_H / 2, FACE_Z + 0.08);
    door.castShadow = true;
    bunker.add(door);
    const wheel = new Mesh(new CylinderGeometry(0.28, 0.28, 0.08, 10), doorMaterial);
    wheel.position.set(0.42, DOOR_H / 2, FACE_Z + 0.22);
    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    bunker.add(wheel);
    for (let i = 0; i < 3; i++) {
      const spoke = new Mesh(new BoxGeometry(0.5, 0.06, 0.05), doorMaterial);
      spoke.position.set(0.42, DOOR_H / 2, FACE_Z + 0.22);
      spoke.rotation.z = (i / 3) * Math.PI;
      bunker.add(spoke);
    }
    for (const y of [0.5, 1.1, 1.7]) {
      const hinge = new Mesh(new BoxGeometry(0.12, 0.18, 0.2), doorMaterial);
      hinge.position.set(-(DOOR_W / 2) + 0.02, y, FACE_Z + 0.08);
      bunker.add(hinge);
    }
    // Door frame standing proud of the face, bedded against it.
    for (const [w, h, x, y] of [
      [0.18, DOOR_H + 0.3, -(DOOR_W / 2) - 0.09, (DOOR_H + 0.3) / 2],
      [0.18, DOOR_H + 0.3, DOOR_W / 2 + 0.09, (DOOR_H + 0.3) / 2],
      [DOOR_W + 0.36, 0.18, 0, DOOR_H + 0.15],
    ] as const) {
      const frame = new Mesh(new BoxGeometry(w, h, 0.26), concreteMaterial);
      frame.position.set(x, y, FACE_Z + 0.13);
      frame.castShadow = true;
      bunker.add(frame);
    }

    // Warning placards either side of the door, flat on the face and clear of the frame posts.
    // The amber is the only warm colour and it is a functional warning, which is the sanctioned
    // use.
    for (const side of [-1, 1]) {
      if (!placardsIntact && side < 0) continue;
      const placard = new Mesh(new BoxGeometry(0.5, 0.7, 0.05), placardMaterial);
      placard.position.set(side * 1.35, 1.5, FACE_Z + 0.065);
      placard.castShadow = true;
      bunker.add(placard);
      // Three bars standing in for stencilled text: this runtime builds geometry, not textures.
      for (let i = 0; i < 3; i++) {
        const bar = new Mesh(new BoxGeometry(0.34 - i * 0.06, 0.07, 0.03), textMaterial);
        bar.position.set(side * 1.35, 1.66 - i * 0.16, FACE_Z + 0.095);
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
    // Buttressed retaining kerbs flanking the approach, just clear of the berm toes (which end
    // at z = 2.5).
    for (const x of [-2.05, 2.05]) {
      const kerb = new Mesh(new BoxGeometry(0.5, 0.7, 1.3), concreteMaterial);
      kerb.position.set(x, 0.35, 3.15);
      kerb.castShadow = true;
      kerb.receiveShadow = true;
      bunker.add(kerb);
    }

    bunker.userData.assetId = 'candidate-ammunition-bunker';
    return bunker;
  },
};
