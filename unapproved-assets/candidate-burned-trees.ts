import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Burned tree cluster for fire-damaged forest patches. No foliage: the whole read is bare
// blackened trunks and stubs against the sky.
const charMaterials = [
  new MeshStandardMaterial({ color: '#2b2724', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#3a3630', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#262320', roughness: 1, flatShading: true }),
];
charMaterials[0]!.name = 'char-black';
charMaterials[1]!.name = 'char-grey';
charMaterials[2]!.name = 'char-deep';

const ashMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 1 });
ashMaterial.name = 'ash-ground';

const UP = new Vector3(0, 1, 0);

// A branch or trunk segment placed between two points. Branches are open-ended, which halves their
// triangle count; at 0.1 m thick the ends are sub-pixel at play distance and a visible hole in the
// end of a twig is not a defect anyone will ever see.
function addLimb(
  parent: Group,
  from: Vector3,
  to: Vector3,
  rFrom: number,
  rTo: number,
  segments: number,
  open: boolean,
  material: MeshStandardMaterial,
): Mesh {
  const dir = to.clone().sub(from);
  const mesh = new Mesh(
    new CylinderGeometry(rTo, rFrom, dir.length(), segments, 1, open),
    material,
  );
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, dir.clone().normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// Explicit trunk definitions per variant: base position, lean, height, and top radius. No
// unseeded randomness, and readable enough to reason about a cluster's footprint on paper.
type Trunk = { x: number; z: number; h: number; lean: number; dir: number; top: number };
const CLUSTERS: Trunk[][] = [
  // Full cluster: five standing trunks of mixed height.
  [
    { x: 0, z: 0, h: 7.4, lean: 0.05, dir: 0.3, top: 0.16 },
    { x: 1.5, z: -1.1, h: 9.1, lean: 0.09, dir: 2.1, top: 0.14 },
    { x: -1.3, z: -1.6, h: 6.2, lean: 0.04, dir: 4.0, top: 0.19 },
    { x: 1.9, z: 1.4, h: 8.2, lean: 0.07, dir: 1.2, top: 0.15 },
    { x: -1.9, z: 1.2, h: 5.4, lean: 0.12, dir: 5.2, top: 0.21 },
  ],
  // Sparse: two tall survivors and a lot of stumps, the read of a patch that mostly burned down.
  [
    { x: -0.6, z: 0.4, h: 9.6, lean: 0.06, dir: 3.4, top: 0.14 },
    { x: 1.7, z: -0.9, h: 7.8, lean: 0.11, dir: 0.7, top: 0.17 },
  ],
  // Snapped: three trunks, two of them broken off high with jagged tops.
  [
    { x: 0.4, z: -0.3, h: 8.6, lean: 0.08, dir: 2.6, top: 0.15 },
    { x: -1.6, z: 0.9, h: 4.6, lean: 0.14, dir: 5.6, top: 0.24 },
    { x: 1.6, z: 1.5, h: 3.4, lean: 0.18, dir: 0.9, top: 0.26 },
  ],
];

// Branches per trunk, as fractions of trunk height with an azimuth offset. Stubs, mostly: a
// burned tree keeps short broken limbs far more often than long ones.
const BRANCHES: { at: number; len: number; up: number; az: number }[] = [
  { at: 0.52, len: 1.5, up: 0.5, az: 0.0 },
  { at: 0.68, len: 1.1, up: 0.75, az: 2.1 },
  { at: 0.81, len: 0.8, up: 0.9, az: 4.2 },
  { at: 0.93, len: 0.55, up: 1.0, az: 1.1 },
];

export const candidateBurnedTrees: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-burned-trees',
  name: 'Burned Tree Cluster',
  category: 'prop',
  dimensions: { x: 6.3, y: 9.9, z: 6.3 },
  // Covers the trunk footprint. The branches overhead are deliberately not solid, and a single box
  // cannot describe five separate thin trunks anyway.
  collider: { center: { x: 0, y: 2, z: 0 }, size: { x: 4.6, y: 4, z: 4.6 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    const trees = new Group();
    const charMaterial = charMaterials[variant % charMaterials.length]!;
    const trunks = CLUSTERS[variant % 3]!;
    const sparse = variant === 1;

    for (const trunk of trunks) {
      // Trunk axis leans by `lean` toward `dir`. The top point is what the branches hang off, so
      // the lean is applied once and reused rather than recomputed per branch.
      // A leaning trunk's flat end cap is perpendicular to its axis, so its vertices hang below
      // the nominal base point by rFrom * sin(tilt). Lifting the base by exactly that amount keeps
      // the cluster on the ground without any of it floating.
      const base = new Vector3(trunk.x, 0.3 * Math.sin(Math.atan(trunk.lean)), trunk.z);
      const top = new Vector3(
        trunk.x + Math.cos(trunk.dir) * trunk.h * trunk.lean,
        trunk.h,
        trunk.z + Math.sin(trunk.dir) * trunk.h * trunk.lean,
      );
      addLimb(trees, base, top, 0.3, trunk.top, 7, false, charMaterial);

      // Point along the trunk at a given height fraction.
      const at = (f: number) => base.clone().lerp(top, f);
      for (const b of BRANCHES) {
        const from = at(b.at);
        // A branch grows outward and upward, so its far end is further out AND higher.
        const to = from
          .clone()
          .add(
            new Vector3(
              Math.cos(b.az + trunk.dir) * b.len,
              b.len * b.up,
              Math.sin(b.az + trunk.dir) * b.len,
            ),
          );
        addLimb(trees, from, to, 0.1, 0.045, 5, true, charMaterial);
      }
    }

    // Burned-off stumps. These carry most of the "this place burned" read at close range, and they
    // are what gives the sparse variant its character.
    const stumps = sparse
      ? [
          [2.4, 0.6, 0.7],
          [-2.2, 1.5, 0.9],
          [0.4, -2.3, 0.5],
          [-1.1, -2.0, 0.35],
        ]
      : [
          [2.5, 0.7, 0.6],
          [-2.3, 1.6, 0.8],
        ];
    for (const [x, z, h] of stumps) {
      addLimb(
        trees,
        new Vector3(x, 0, z),
        new Vector3(x, h, z),
        0.28,
        0.24,
        6,
        false,
        charMaterial,
      );
    }

    // Scorched ground: a flat disc under the cluster. One mesh, and it stops the trunks reading as
    // objects placed on ordinary dirt.
    const scorch = new Mesh(new CylinderGeometry(2.6, 2.9, 0.08, 12), ashMaterial);
    scorch.position.y = 0.04;
    scorch.receiveShadow = true;
    trees.add(scorch);

    trees.userData.assetId = 'candidate-burned-trees';
    return trees;
  },
};
