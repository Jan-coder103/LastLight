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
// Narrow two-storey row house. Local +Z is the street front, y = 0 is pavement level.
const wallMaterials = [
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#aaa18f', roughness: 1, flatShading: true }),
];
wallMaterials[0]!.name = 'wall-render-buff';
wallMaterials[1]!.name = 'wall-render-grey';
wallMaterials[2]!.name = 'wall-render-pale';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-slate';

const timberMaterial = new MeshStandardMaterial({ color: '#655744', roughness: 1 });
timberMaterial.name = 'timber-board';

const doorMaterial = new MeshStandardMaterial({ color: '#4b4035', roughness: 1 });
doorMaterial.name = 'door-timber';

const revealMaterial = new MeshStandardMaterial({ color: '#2e2a25', roughness: 1 });
revealMaterial.name = 'reveal-dark';

const trimMaterial = new MeshStandardMaterial({ color: '#aaa18f', roughness: 1 });
trimMaterial.name = 'trim-stone';

const glassMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.35,
  metalness: 0.05,
});
glassMaterial.name = 'window-glass';

const pipeMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
pipeMaterial.name = 'pipe-metal';

const HALF_WIDTH = 2.9;
const DEPTH = 8.8;
const EAVES = 6.4;
const RIDGE = 7.5;
const ROOF_RUN = 3.3;
const ROOF_RISE = RIDGE - EAVES;
const SLOPE = Math.atan2(ROOF_RISE, ROOF_RUN);
const SLOPE_LENGTH = Math.sqrt(ROOF_RUN * ROOF_RUN + ROOF_RISE * ROOF_RISE);

// Triangular prism for the gable ends. Built as real geometry so the attic is not open to the
// sky at the ridge. Flat shading on the shared wall material keeps its facets crisp.
function makeGable(
  halfWidth: number,
  rise: number,
  depth: number,
  material: MeshStandardMaterial,
): Mesh {
  const hz = depth / 2;
  const positions = [
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
  ];
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex([3, 4, 5, 0, 2, 1, 0, 4, 3, 0, 1, 4, 0, 5, 2, 0, 3, 5, 1, 5, 4, 1, 2, 5]);
  geometry.computeVertexNormals();
  const gable = new Mesh(geometry, material);
  gable.castShadow = true;
  gable.receiveShadow = true;
  return gable;
}

export const candidateRowHouse: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-row-house',
  name: 'Damaged Row House',
  category: 'building',
  dimensions: { x: 6.8, y: 8.2, z: 9.7 },
  collider: { center: { x: 0, y: 4.06, z: 0 }, size: { x: 5.8, y: 8.12, z: 8.8 } },
  interactionPoints: [
    { id: 'front-door', label: 'Front Door', position: { x: -1.575, y: 0, z: 5.1 } },
  ],
  createVisual(variant = 0) {
    const house = new Group();
    const wallMaterial = wallMaterials[variant % wallMaterials.length]!;
    const front = DEPTH / 2;

    const mass = new Mesh(new BoxGeometry(HALF_WIDTH * 2, EAVES, DEPTH), wallMaterial);
    mass.position.y = EAVES / 2;
    mass.castShadow = true;
    mass.receiveShadow = true;
    house.add(mass);

    // Plinth course, a slightly wider band at the base that stops the wall reading as a slab.
    const plinth = new Mesh(
      new BoxGeometry(HALF_WIDTH * 2 + 0.16, 0.42, DEPTH + 0.16),
      trimMaterial,
    );
    plinth.position.y = 0.21;
    plinth.receiveShadow = true;
    house.add(plinth);

    // Gable ends. Ridge runs along Z, so both ends of the house are triangular.
    for (const end of [1, -1]) {
      const gable = makeGable(HALF_WIDTH, ROOF_RISE, 0.24, wallMaterial);
      gable.position.set(0, EAVES, end * (front - 0.12));
      house.add(gable);
    }

    // Pitched roof. The +X slope is intact; the -X slope is damaged: the front third has caved
    // in, and a real gap between the intact and collapsed sections exposes rafters.
    const roofDepth = 9.4;
    const roofThickness = 0.22;

    const slopeRight = new Mesh(
      new BoxGeometry(SLOPE_LENGTH, roofThickness, roofDepth),
      roofMaterial,
    );
    slopeRight.position.set(ROOF_RUN / 2, EAVES + ROOF_RISE / 2, 0);
    slopeRight.rotation.z = -SLOPE;
    slopeRight.castShadow = true;
    house.add(slopeRight);

    const slopeLeft = new Mesh(new BoxGeometry(SLOPE_LENGTH, roofThickness, 5.1), roofMaterial);
    slopeLeft.position.set(-ROOF_RUN / 2, EAVES + ROOF_RISE / 2, -2.15);
    slopeLeft.rotation.z = SLOPE;
    slopeLeft.castShadow = true;
    house.add(slopeLeft);

    // The fallen section of the -X slope lies INSIDE the attic: high end tucked just under the
    // intact slope's underside, low end broken through onto the loft floor. The first draft
    // tilted the full-width panel at 0.5 rad at z 3.0, which drove its outboard end through the
    // front wall and the front gable; this one is a shorter broken chunk that stays inside the
    // roof envelope and is only seen through the gap.
    const slopeCollapsed = new Mesh(new BoxGeometry(2.0, roofThickness, 2.6), roofMaterial);
    slopeCollapsed.position.set(-1.75, 6.66, 2.75);
    slopeCollapsed.rotation.z = 0.4;
    slopeCollapsed.castShadow = true;
    house.add(slopeCollapsed);

    // Rafters across the gap, plus a dark ceiling behind them so the hole shows a loft rather
    // than the inside of the far wall.
    for (const z of [0.55, 0.85, 1.15]) {
      const rafter = new Mesh(new BoxGeometry(3.4, 0.12, 0.14), timberMaterial);
      rafter.position.set(-1.6, 6.66, z);
      rafter.rotation.z = SLOPE;
      house.add(rafter);
    }
    const loftFloor = new Mesh(new BoxGeometry(HALF_WIDTH * 2, 0.12, 1.0), revealMaterial);
    loftFloor.position.set(0, 6.3, 0.85);
    house.add(loftFloor);

    // Ridge cap and eaves gutter give the roof a readable edge from the top-down camera.
    const ridgeCap = new Mesh(new BoxGeometry(0.26, 0.14, roofDepth), roofMaterial);
    ridgeCap.position.y = RIDGE + 0.02;
    ridgeCap.castShadow = true;
    house.add(ridgeCap);

    const gutter = new Mesh(new BoxGeometry(0.16, 0.18, roofDepth), pipeMaterial);
    gutter.position.set(ROOF_RUN + 0.04, EAVES - 0.04, 0);
    house.add(gutter);

    // Chimney at the rear, sharing the wall material so the palette stays small.
    const chimney = new Mesh(new BoxGeometry(0.72, 1.8, 0.72), wallMaterial);
    chimney.position.set(-1.9, 7.1, -3.4);
    chimney.castShadow = true;
    house.add(chimney);
    const chimneyCap = new Mesh(new BoxGeometry(0.9, 0.14, 0.9), trimMaterial);
    chimneyCap.position.set(-1.9, 8.05, -3.4);
    house.add(chimneyCap);

    // Front door. The reveal is real: the frame stands proud of the wall and the door panel sits
    // behind it, so the doorway is genuinely recessed rather than a dark rectangle painted on.
    const doorX = -1.575;
    const doorWidth = 1.05;
    const doorHeight = 2.2;
    const doorPanel = new Mesh(
      new BoxGeometry(doorWidth - 0.06, doorHeight - 0.08, 0.08),
      doorMaterial,
    );
    doorPanel.position.set(doorX, doorHeight / 2 - 0.02, front + 0.02);
    house.add(doorPanel);
    // The frame is 0.3 deep and stands 0.25 proud of the wall, leaving the door panel genuinely
    // recessed inside it rather than flush with the surrounding wall.
    for (const side of [-1, 1]) {
      const jamb = new Mesh(new BoxGeometry(0.16, doorHeight + 0.16, 0.3), trimMaterial);
      jamb.position.set(
        doorX + side * (doorWidth / 2 + 0.08),
        (doorHeight + 0.16) / 2,
        front + 0.1,
      );
      jamb.castShadow = true;
      house.add(jamb);
    }
    const doorHead = new Mesh(new BoxGeometry(doorWidth + 0.32, 0.16, 0.3), trimMaterial);
    doorHead.position.set(doorX, doorHeight + 0.08, front + 0.1);
    house.add(doorHead);
    const step = new Mesh(new BoxGeometry(1.5, 0.14, 0.56), trimMaterial);
    step.position.set(doorX, 0.07, front + 0.24);
    step.receiveShadow = true;
    house.add(step);
    const doorCanopy = new Mesh(new BoxGeometry(1.5, 0.1, 0.5), roofMaterial);
    doorCanopy.position.set(doorX, 2.5, front + 0.22);
    doorCanopy.rotation.x = -0.18;
    doorCanopy.castShadow = true;
    house.add(doorCanopy);

    // Windows are applied surface detail, not recessed openings: a boarded window is planks on
    // the outside anyway, and a perforated wall would cost far more geometry than it reads.
    function addBoardedWindow(x: number, y: number, width: number, height: number, lean: number) {
      const backing = new Mesh(new BoxGeometry(width, height, 0.06), revealMaterial);
      backing.position.set(x, y, front + 0.03);
      house.add(backing);
      for (const sign of [-1, 1]) {
        const board = new Mesh(new BoxGeometry(width + 0.18, 0.17, 0.05), timberMaterial);
        board.position.set(x, y + sign * height * 0.16, front + 0.1);
        board.rotation.z = lean * sign;
        board.castShadow = true;
        house.add(board);
      }
    }

    addBoardedWindow(1.2, 1.55, 1.3, 1.3, 0.5);
    addBoardedWindow(-1.45, 4.35, 1.2, 1.3, 0.62);

    // The remaining upper window is unboarded but broken: dark glass with one bright shard edge.
    const brokenPane = new Mesh(new BoxGeometry(1.2, 1.3, 0.05), glassMaterial);
    brokenPane.position.set(1.45, 4.35, front + 0.05);
    house.add(brokenPane);
    const shard = new Mesh(new BoxGeometry(0.5, 0.9, 0.04), glassMaterial);
    shard.position.set(1.62, 4.2, front + 0.09);
    shard.rotation.z = 0.22;
    house.add(shard);

    // Rainwater downpipe on the right-hand edge, the one piece of trim that reads as a house
    // rather than a block.
    const downpipe = new Mesh(new BoxGeometry(0.14, 5.9, 0.14), pipeMaterial);
    downpipe.position.set(2.68, 3.1, front + 0.08);
    downpipe.castShadow = true;
    house.add(downpipe);

    house.userData.assetId = 'candidate-row-house';
    return house;
  },
};
