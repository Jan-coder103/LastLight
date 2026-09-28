import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.

// A-frame cross-section. Authored in metres at a full-size ridge tent and then reduced by
// a single constant, so the triangle geometry and the declared bounds stay in agreement.
const TENT_SCALE = 0.72;

const scaled = (value: number): number => Math.round(value * TENT_SCALE * 100) / 100;
const scaledVec = (value: { x: number; y: number; z: number }) => ({
  x: scaled(value.x),
  y: scaled(value.y),
  z: scaled(value.z),
});

const flyMaterials = [
  new MeshStandardMaterial({
    color: '#58624d',
    roughness: 0.95,
    flatShading: true,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: '#8e5142',
    roughness: 0.95,
    flatShading: true,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: '#65766d',
    roughness: 0.95,
    flatShading: true,
    side: DoubleSide,
  }),
];
flyMaterials[0]!.name = 'fly-olive';
flyMaterials[1]!.name = 'fly-rust';
flyMaterials[2]!.name = 'fly-slate';

const floorMaterial = new MeshStandardMaterial({ color: '#3f443c', roughness: 1 });
floorMaterial.name = 'groundsheet';

const trimMaterial = new MeshStandardMaterial({ color: '#2f332d', roughness: 0.95 });
trimMaterial.name = 'zip-trim';

const metalMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.86,
  metalness: 0.24,
});
metalMaterial.name = 'metal';

const pegMaterial = new MeshStandardMaterial({ color: '#64675d', roughness: 0.9 });
pegMaterial.name = 'peg';

// A flat triangle mesh in the XY plane at z = 0, from three [x, y] corners.
function triangleMesh(corners: [number, number][], material: MeshStandardMaterial): Mesh {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  for (const [x, y] of corners) positions.push(x, y, 0);
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return new Mesh(geometry, material);
}

// A flat quad mesh in the XY plane at z = 0, from four [x, y] corners in order.
function quadMesh(corners: [number, number][], material: MeshStandardMaterial): Mesh {
  return triangleMesh(
    [corners[0]!, corners[1]!, corners[2]!, corners[0]!, corners[2]!, corners[3]!],
    material,
  );
}

export const candidateTent: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-tent',
  name: 'Basic Camping Tent',
  category: 'prop',
  // 2.4 m ridge tent, the size of a real 2-3 person tent, before the reduction above. The depth
  // includes the door flap swung open on its hinge, which makes the footprint slightly asymmetric
  // toward +Z (about 0.15 m after scaling) while the pivot itself stays at the tent's centre.
  dimensions: scaledVec({ x: 3.34, y: 1.9, z: 3.75 }),
  collider: {
    center: scaledVec({ x: 0, y: 0.9, z: 0 }),
    size: scaledVec({ x: 2.9, y: 1.8, z: 3.2 }),
  },
  interactionPoints: [
    { id: 'tent-door', label: 'Tent', position: scaledVec({ x: 0, y: 0, z: 1.85 }) },
  ],
  createVisual(variant = 0) {
    const tent = new Group();
    const fly = flyMaterials[variant % flyMaterials.length]!;

    // Authored full-size, then reduced. Half-width, ridge height, and length.
    const halfWidth = 1.45;
    const ridge = 1.72;
    const length = 2.9;
    const halfLength = length / 2;
    // A-frame slope: the panel is as long as the hypotenuse of the triangle. It is shortened
    // very slightly and raised off the base line, because at the true slope angle the panel's
    // bottom corner would otherwise dip a couple of centimetres below the ground plane.
    const slope = Math.sqrt(halfWidth * halfWidth + ridge * ridge) * 0.99;
    const slopeAngle = Math.atan2(ridge, halfWidth);

    const structure = new Group();
    structure.scale.setScalar(TENT_SCALE);
    tent.add(structure);

    const groundsheet = new Mesh(new BoxGeometry(halfWidth * 2, 0.08, length), floorMaterial);
    groundsheet.position.y = 0.04;
    groundsheet.receiveShadow = true;
    structure.add(groundsheet);

    // Sloped panel rotation about Z. The panel's local +Y must run from the base corner UP to
    // the apex, which is a rotation of +panelAngle for the right-hand panel. Negating it sends
    // the panel the other way, so the two panels lean apart into a V and the tent inverts into
    // a valley. The angle magnitude is still PI/2 - alpha, because a rotation about Z is
    // measured from vertical while alpha is the slope from the horizontal.
    const panelAngle = Math.PI / 2 - slopeAngle;
    for (const side of [-1, 1]) {
      const panel = new Mesh(new BoxGeometry(0.07, slope, length), fly);
      panel.position.set((side * halfWidth) / 2, ridge / 2 + 0.02, 0);
      panel.rotation.z = side * panelAngle;
      panel.castShadow = true;
      structure.add(panel);
    }
    // Ridge cap closes the seam between the two panels.
    const ridgeCap = new Mesh(new BoxGeometry(0.16, 0.12, length + 0.06), fly);
    ridgeCap.position.y = ridge;
    ridgeCap.castShadow = true;
    structure.add(ridgeCap);

    // The fly's half-width at a given height on the A-frame slope.
    const widthAt = (y: number) => halfWidth * (1 - y / ridge);

    // Gable ends are real triangles cut from the A-frame profile. The front one carries a
    // rectangular door opening; the back one is solid with a small vent near the apex.
    const doorHalfWidth = 0.35;
    const doorTop = 1.05;
    const shoulder = widthAt(doorTop);

    const frontGable = new Group();
    frontGable.position.z = halfLength;
    // Two fabric panels either side of the opening, and the triangle above it.
    for (const side of [-1, 1]) {
      const panel = quadMesh(
        [
          [side * halfWidth, 0],
          [side * doorHalfWidth, 0],
          [side * doorHalfWidth, doorTop],
          [side * shoulder, doorTop],
        ],
        fly,
      );
      frontGable.add(panel);
    }
    frontGable.add(
      triangleMesh(
        [
          [-shoulder, doorTop],
          [shoulder, doorTop],
          [0, ridge],
        ],
        fly,
      ),
    );
    structure.add(frontGable);

    const backGable = triangleMesh(
      [
        [-halfWidth, 0],
        [halfWidth, 0],
        [0, ridge],
      ],
      fly,
    );
    backGable.position.z = -halfLength;
    structure.add(backGable);
    // Vent: a small dark triangle just proud of the back gable, under the apex.
    const vent = triangleMesh(
      [
        [-0.16, 1.26],
        [0.16, 1.26],
        [0, 1.5],
      ],
      trimMaterial,
    );
    vent.position.z = -halfLength - 0.012;
    vent.rotation.y = Math.PI;
    structure.add(vent);

    // Door opening depth cue: a dark panel recessed inside the tent, visible through the gap.
    const interior = new Mesh(new BoxGeometry(doorHalfWidth * 2, doorTop, 0.04), trimMaterial);
    interior.position.set(0, doorTop / 2, halfLength - 0.42);
    structure.add(interior);

    // Zip strips run flush up both sides of the opening.
    for (const side of [-1, 1]) {
      const zip = new Mesh(new BoxGeometry(0.035, doorTop, 0.02), trimMaterial);
      zip.position.set(side * doorHalfWidth, doorTop / 2, halfLength + 0.012);
      structure.add(zip);
    }

    // Door flap tied back on its hinge edge, which is what tells a player the tent is lived in.
    const flapPivot = new Group();
    flapPivot.position.set(-doorHalfWidth, 0, halfLength + 0.01);
    flapPivot.rotation.y = -1.05;
    const flap = new Mesh(new PlaneGeometry(doorHalfWidth * 2, doorTop), fly);
    flap.position.set(doorHalfWidth, doorTop / 2, 0);
    flap.rotation.y = Math.PI;
    flap.castShadow = true;
    flapPivot.add(flap);
    structure.add(flapPivot);

    // Four guy lines to pegs. The bounds in the asset contract include these pegs.
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) {
        const from = new Vector3(side * 1.0, 0.95, end * 1.2);
        const to = new Vector3(side * 1.45, 0.14, end * 1.5);
        const direction = to.clone().sub(from);
        const guy = new Mesh(new BoxGeometry(0.035, direction.length(), 0.035), metalMaterial);
        guy.position.copy(from).add(to).multiplyScalar(0.5);
        guy.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
        structure.add(guy);

        const peg = new Mesh(new BoxGeometry(0.06, 0.22, 0.06), pegMaterial);
        peg.position.set(to.x, 0.14, to.z);
        peg.rotation.set(0.2, 0, side * -0.22);
        peg.castShadow = true;
        structure.add(peg);
      }
    }

    tent.traverse((object) => {
      if (object instanceof Mesh) object.receiveShadow = true;
    });
    tent.userData.assetId = 'candidate-tent';
    return tent;
  },
};
