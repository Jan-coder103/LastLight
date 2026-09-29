import {
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset.
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
// Wall top (footing 0.4 + wall height), where the roof planes spring from.
const WALL_TOP = EAVES + 0.4;
const RIDGE = 7.2;
// The ridge runs along Z (the gable ends stand at z = +/- HALF_D), so each roof plane runs from
// the ridge at x = 0 down to the eaves at x = +/- HALF_W.
const ROOF_RUN = HALF_W;
const ROOF_RISE = RIDGE - WALL_TOP;
const SLOPE = Math.atan2(ROOF_RISE, ROOF_RUN);
const SLOPE_LENGTH = Math.sqrt(ROOF_RUN * ROOF_RUN + ROOF_RISE * ROOF_RISE);
const EAVE_DROP = 0.15;
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

export const barnShell: AuthoredAsset = {
  schemaVersion: 1,
  id: 'barn-shell',
  name: 'Barn Shell',
  category: 'building',
  // Measured (vertex-accurate): 12.64 x 7.45 x 12.3. The z bounds are asymmetric about the pivot:
  // the fallen roof section lies out to z = 7.45 in front, so the declared z covers twice that
  // offset; the earlier 12.3 clipped the debris.
  dimensions: { x: 12.8, y: 7.5, z: 15.0 },
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
      gable.position.set(0, WALL_TOP, end * (HALF_D - 0.13));
      barn.add(gable);
    }

    // Faded siding: three plank bands a side, and one across the lintel above the door. Seven
    // shallow boxes standing proud is the whole "board-and-batten" read.
    for (const sx of [-1, 1]) {
      for (const y of [1.3, 2.7, 4.1]) {
        const band = new Mesh(new BoxGeometry(0.1, 0.22, DEPTH - 0.1), sidingMaterial);
        band.position.set(sx * (HALF_W + 0.04), y, 0);
        barn.add(band);
      }
    }
    const gableBand = new Mesh(new BoxGeometry(WIDTH - 0.4, 0.22, 0.1), sidingMaterial);
    gableBand.position.set(0, 4.65, HALF_D + 0.04);
    barn.add(gableBand);

    // Roof: two gable planes whose ridge runs along Z. Each plane is one slab rotated about Z by
    // the slope angle, centred on the slope line from the ridge (x = 0, RIDGE) to just past the
    // eaves at x = +/- HALF_W. The earlier draft built full-width slabs rotated about X, which is
    // this roof turned 90 degrees: it shed toward the gable ends instead of toward the side walls.
    const slabLengthZ = DEPTH + 0.6;
    const slabCenterX = ROOF_RUN / 2 + EAVE_DROP * Math.cos(SLOPE);
    const slabCenterY = WALL_TOP + ROOF_RISE / 2 - EAVE_DROP * Math.sin(SLOPE);
    // The left plane (x < 0) is intact. The right plane has lost its middle 3.4 m along the ridge
    // direction (z), leaving two slabs, exposed rafters, and a dark under-panel through the hole.
    const backSlab = new Mesh(new BoxGeometry(SLOPE_LENGTH + 0.3, 0.22, slabLengthZ), roofMaterial);
    backSlab.position.set(-slabCenterX, slabCenterY, 0);
    backSlab.rotation.z = SLOPE;
    backSlab.castShadow = true;
    backSlab.receiveShadow = true;
    barn.add(backSlab);

    for (const z of [3.25, -3.25]) {
      const slab = new Mesh(new BoxGeometry(SLOPE_LENGTH + 0.3, 0.22, 3.1), roofMaterial);
      slab.position.set(slabCenterX, slabCenterY, z);
      slab.rotation.z = -SLOPE;
      slab.castShadow = true;
      slab.receiveShadow = true;
      barn.add(slab);
    }
    for (const z of [-1.0, 0.1, 1.2]) {
      const rafter = new Mesh(new BoxGeometry(SLOPE_LENGTH - 0.1, 0.14, 0.16), boardMaterial);
      rafter.position.set(slabCenterX, slabCenterY - 0.22, z);
      rafter.rotation.z = -SLOPE;
      rafter.castShadow = true;
      barn.add(rafter);
    }
    // Dark under-panel set below the missing section, so the hole shows a shadowed roof space
    // rather than the sky through the barn.
    const underPanel = new Mesh(new BoxGeometry(SLOPE_LENGTH - 0.5, 0.1, 3.4), interiorMaterial);
    underPanel.position.set(
      slabCenterX + Math.sin(SLOPE) * 0.35,
      slabCenterY - Math.cos(SLOPE) * 0.35,
      0.1,
    );
    underPanel.rotation.z = -SLOPE;
    barn.add(underPanel);

    const ridgeCap = new Mesh(new BoxGeometry(0.6, 0.18, DEPTH + 0.7), roofMaterial);
    ridgeCap.position.y = RIDGE + 0.16;
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

    barn.userData.assetId = 'barn-shell';
    return barn;
  },
};
