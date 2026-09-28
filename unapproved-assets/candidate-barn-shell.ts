import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Barn shell. Local +Z is the gable end with the sliding door. Broad, low, and rural.
const sidingMaterials = [
  new MeshStandardMaterial({ color: '#9b624d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#8e5142', roughness: 1 }),
];
sidingMaterials[0]!.name = 'barn-siding-red';
sidingMaterials[1]!.name = 'barn-siding-grey';
sidingMaterials[2]!.name = 'barn-siding-brown';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'barn-roof';

const boardMaterial = new MeshStandardMaterial({ color: '#655744', roughness: 1 });
boardMaterial.name = 'timber-board';

const doorMaterial = new MeshStandardMaterial({ color: '#4b4035', roughness: 1 });
doorMaterial.name = 'door-timber';

const interiorMaterial = new MeshStandardMaterial({ color: '#2a251f', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const stoneMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
stoneMaterial.name = 'stone-base';

const WIDTH = 12;
const DEPTH = 9;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const EAVES = 4.7;
const RIDGE = 6.4;
const ROOF_RUN = 4.7;
const ROOF_RISE = RIDGE - EAVES;
const SLOPE = Math.atan2(ROOF_RISE, ROOF_RUN);
const SLOPE_LENGTH = Math.sqrt(ROOF_RUN * ROOF_RUN + ROOF_RISE * ROOF_RISE);
const DOOR_W = 3.6;
const DOOR_H = 3.8;

// Triangular prism for the gable ends. THIRD copy of this helper (row house, ranger cabin). Three
// copies is past the point where copying was defensible; this should become a shared module.
function makeGable(
  halfWidth: number,
  rise: number,
  depth: number,
  material: MeshStandardMaterial,
): Mesh {
  const hz = depth / 2;
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        -halfWidth,
        0,
        -hz,
        halfWidth,
        0,
        -hz,
        0,
        rise,
        -hz,
        -halfWidth,
        0,
        hz,
        halfWidth,
        0,
        hz,
        0,
        rise,
        hz,
      ],
      3,
    ),
  );
  geometry.setIndex([3, 4, 5, 0, 2, 1, 0, 4, 3, 0, 1, 4, 0, 5, 2, 0, 3, 5, 1, 5, 4, 1, 2, 5]);
  geometry.computeVertexNormals();
  const gable = new Mesh(geometry, material);
  gable.castShadow = true;
  gable.receiveShadow = true;
  return gable;
}

export const candidateBarnShell: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-barn-shell',
  name: 'Barn Shell',
  category: 'building',
  dimensions: { x: 12.8, y: 7.1, z: 12.3 },
  // The barn body. Note the consequence: the single box covers the sliding door opening too, so
  // the barn is not enterable. See the review sheet — the ranger cabin and sawmill have the same
  // issue, and it is the strongest argument in this batch for multiple-box colliders.
  collider: { center: { x: 0, y: 3.2, z: 0 }, size: { x: 12, y: 6.4, z: 9 } },
  interactionPoints: [{ id: 'barn-door', label: 'Barn Door', position: { x: -1.2, y: 0, z: 5.4 } }],
  createVisual(variant = 0) {
    const barn = new Group();
    const sidingMaterial = sidingMaterials[variant % sidingMaterials.length]!;

    const footing = new Mesh(new BoxGeometry(WIDTH + 0.3, 0.4, DEPTH + 0.3), stoneMaterial);
    footing.position.y = 0.2;
    footing.receiveShadow = true;
    barn.add(footing);

    // Side and back walls.
    for (const sx of [-1, 1]) {
      const side = new Mesh(new BoxGeometry(0.24, EAVES, DEPTH), sidingMaterial);
      side.position.set(sx * (HALF_W - 0.12), 0.4 + EAVES / 2, 0);
      side.castShadow = true;
      side.receiveShadow = true;
      barn.add(side);
    }
    const back = new Mesh(new BoxGeometry(WIDTH, EAVES, 0.24), sidingMaterial);
    back.position.set(0, 0.4 + EAVES / 2, -HALF_D + 0.12);
    back.castShadow = true;
    back.receiveShadow = true;
    barn.add(back);

    // Front gable wall built AROUND the sliding door opening, plus a lintel above it.
    for (const [x, w] of [
      [-(DOOR_W + (WIDTH - DOOR_W) / 2) / 2, (WIDTH - DOOR_W) / 2],
      [(DOOR_W + (WIDTH - DOOR_W) / 2) / 2, (WIDTH - DOOR_W) / 2],
    ] as const) {
      const pier = new Mesh(new BoxGeometry(w, EAVES, 0.24), sidingMaterial);
      pier.position.set(x, 0.4 + EAVES / 2, HALF_D - 0.12);
      pier.castShadow = true;
      barn.add(pier);
    }
    const lintel = new Mesh(new BoxGeometry(DOOR_W, EAVES - DOOR_H, 0.24), sidingMaterial);
    lintel.position.set(0, 0.4 + DOOR_H + (EAVES - DOOR_H) / 2, HALF_D - 0.12);
    lintel.castShadow = true;
    barn.add(lintel);

    for (const end of [1, -1]) {
      const gable = makeGable(HALF_W, ROOF_RISE, 0.26, sidingMaterial);
      gable.position.set(0, EAVES + 0.4, end * (HALF_D - 0.13));
      barn.add(gable);
    }

    // Faded siding: three plank bands a side, and one across the gable above the door. Seven
    // shallow boxes standing proud is the whole "board-and-batten" read.
    for (const sx of [-1, 1]) {
      for (const y of [1.3, 2.7, 4.1]) {
        const band = new Mesh(new BoxGeometry(0.1, 0.22, DEPTH - 0.1), sidingMaterial);
        band.position.set(sx * (HALF_W + 0.04), y, 0);
        barn.add(band);
      }
    }
    const gableBand = new Mesh(new BoxGeometry(WIDTH - 0.4, 0.22, 0.1), sidingMaterial);
    gableBand.position.set(0, 4.2, HALF_D + 0.04);
    barn.add(gableBand);

    // Roof. The back half is intact; the front half has lost a 3.4 m section, leaving rafters and
    // a dark loft visible through the hole.
    const backSlab = new Mesh(new BoxGeometry(WIDTH + 0.6, 0.22, SLOPE_LENGTH), roofMaterial);
    backSlab.position.set(0, EAVES + ROOF_RISE / 2, -ROOF_RUN / 2);
    backSlab.rotation.x = -SLOPE;
    backSlab.castShadow = true;
    backSlab.receiveShadow = true;
    barn.add(backSlab);

    for (const [x, w] of [
      [-3.95, 4.7],
      [4.05, 4.5],
    ] as const) {
      const frontSlab = new Mesh(new BoxGeometry(w, 0.22, SLOPE_LENGTH), roofMaterial);
      frontSlab.position.set(x, EAVES + ROOF_RISE / 2, ROOF_RUN / 2);
      frontSlab.rotation.x = SLOPE;
      frontSlab.castShadow = true;
      frontSlab.receiveShadow = true;
      barn.add(frontSlab);
    }
    for (const x of [-1.0, 0.1, 1.2]) {
      const rafter = new Mesh(new BoxGeometry(0.14, 0.16, SLOPE_LENGTH), boardMaterial);
      rafter.position.set(x, EAVES + ROOF_RISE / 2 - 0.2, ROOF_RUN / 2);
      rafter.rotation.x = SLOPE;
      barn.add(rafter);
    }
    // Dark loft ceiling behind the hole, so it shows a space rather than the inside of the far wall.
    const loft = new Mesh(new BoxGeometry(3.4, 0.12, 3.4), interiorMaterial);
    loft.position.set(0.1, 4.4, 2.3);
    barn.add(loft);

    const ridgeCap = new Mesh(new BoxGeometry(WIDTH + 0.7, 0.16, 0.3), roofMaterial);
    ridgeCap.position.y = RIDGE + 0.44;
    ridgeCap.castShadow = true;
    barn.add(ridgeCap);

    // The fallen roof section, on the ground in front of the barn.
    const fallen = new Mesh(new BoxGeometry(2.4, 0.2, 1.7), roofMaterial);
    fallen.position.set(0.4, 0.47, 6.3);
    fallen.rotation.set(0.1, 0.3, 0.2);
    fallen.castShadow = true;
    fallen.receiveShadow = true;
    barn.add(fallen);

    // Sliding door: slid to +X on a track, so the left 1.3 m of the opening is clear. The panel
    // stands proud of the wall on the track, which is what makes it read as sliding rather than
    // hinged.
    const door = new Mesh(new BoxGeometry(3.2, 3.7, 0.12), doorMaterial);
    door.position.set(1.1, 1.95, HALF_D + 0.1);
    door.castShadow = true;
    barn.add(door);
    const track = new Mesh(new BoxGeometry(6.2, 0.12, 0.14), boardMaterial);
    track.position.set(0.6, 3.85, HALF_D + 0.12);
    track.castShadow = true;
    barn.add(track);
    for (const x of [-0.3, 1.1, 2.5]) {
      const hanger = new Mesh(new BoxGeometry(0.1, 0.22, 0.1), boardMaterial);
      hanger.position.set(x, 3.72, HALF_D + 0.12);
      barn.add(hanger);
    }
    const handle = new Mesh(new BoxGeometry(0.1, 0.4, 0.1), boardMaterial);
    handle.position.set(-0.35, 1.9, HALF_D + 0.2);
    barn.add(handle);

    // Dark interior: floor and a back panel, so the 1.3 m gap in the doorway shows depth.
    const floor = new Mesh(new BoxGeometry(WIDTH - 0.5, 0.16, DEPTH - 0.5), interiorMaterial);
    floor.position.y = 0.5;
    barn.add(floor);
    const innerBack = new Mesh(new BoxGeometry(WIDTH - 0.5, EAVES - 0.4, 0.06), interiorMaterial);
    innerBack.position.set(0, 0.4 + EAVES / 2, -HALF_D + 0.27);
    barn.add(innerBack);

    barn.userData.assetId = 'candidate-barn-shell';
    return barn;
  },
};
