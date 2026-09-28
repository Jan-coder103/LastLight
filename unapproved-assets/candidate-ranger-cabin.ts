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
// Forest ranger cabin. Local +Z is the porch side, y = 0 is ground. The idea asks for "one usable
// entrance", so the doorway is a REAL opening you can see into, not a door drawn on a wall.
const wallMaterials = [
  new MeshStandardMaterial({ color: '#655744', roughness: 1 }),
  new MeshStandardMaterial({ color: '#594332', roughness: 1 }),
  new MeshStandardMaterial({ color: '#514437', roughness: 1 }),
];
wallMaterials[0]!.name = 'log-pine';
wallMaterials[1]!.name = 'log-brown';
wallMaterials[2]!.name = 'log-dark';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-slate';

const interiorMaterial = new MeshStandardMaterial({ color: '#2a251f', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const boardMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1 });
boardMaterial.name = 'timber-board';

const stoneMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
stoneMaterial.name = 'stone-base';

const glassMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.35,
  metalness: 0.05,
});
glassMaterial.name = 'window-glass';

const WIDTH = 5.5;
const DEPTH = 3.4;
const WALL_H = 3.4;
const EAVES = 3.5;
const RIDGE = 4.4;
const ROOF_RUN = 3.0;
const ROOF_RISE = RIDGE - EAVES;
const SLOPE = Math.atan2(ROOF_RISE, ROOF_RUN);
const SLOPE_LENGTH = Math.sqrt(ROOF_RUN * ROOF_RUN + ROOF_RISE * ROOF_RISE);
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const DOOR_W = 1.1;
const DOOR_H = 2.1;

// Triangular prism for the gable ends. This is a copy of the helper in
// candidate-row-house.ts; if a third candidate needs it, lift it into a shared module.
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

export const candidateRangerCabin: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-ranger-cabin',
  name: 'Forest Ranger Cabin',
  category: 'building',
  dimensions: { x: 6.2, y: 5.0, z: 5.5 },
  // The cabin body only. The porch deck and its roof are left non-solid so the player can step
  // up onto the porch and stand under the porch roof, which is the point of a porch.
  collider: { center: { x: 0, y: 1.9, z: 0 }, size: { x: 5.5, y: 3.8, z: 3.4 } },
  interactionPoints: [{ id: 'front-door', label: 'Cabin Door', position: { x: 0, y: 0, z: 3.4 } }],
  createVisual(variant = 0) {
    const cabin = new Group();
    const wallMaterial = wallMaterials[variant % wallMaterials.length]!;

    // Stone footing course under the walls.
    const footing = new Mesh(new BoxGeometry(WIDTH + 0.3, 0.44, DEPTH + 0.3), stoneMaterial);
    footing.position.y = 0.22;
    footing.receiveShadow = true;
    cabin.add(footing);

    // Walls built as a shell: floor, back, and two sides, with the FRONT wall assembled around a
    // real doorway. That is what makes the entrance usable rather than painted on.
    const floor = new Mesh(new BoxGeometry(WIDTH - 0.4, 0.2, DEPTH - 0.4), interiorMaterial);
    floor.position.y = 0.62;
    cabin.add(floor);

    const backWall = new Mesh(new BoxGeometry(WIDTH, WALL_H, 0.2), wallMaterial);
    backWall.position.set(0, 0.55 + WALL_H / 2, -HALF_D);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    cabin.add(backWall);

    for (const side of [-1, 1]) {
      const sideWall = new Mesh(new BoxGeometry(0.2, WALL_H, DEPTH - 0.2), wallMaterial);
      sideWall.position.set(side * (HALF_W - 0.1), 0.55 + WALL_H / 2, 0);
      sideWall.castShadow = true;
      sideWall.receiveShadow = true;
      cabin.add(sideWall);
    }

    // The dark panel on the inside of the back wall. Looking through the open door you see this
    // 3.1 m away, which gives the interior real depth for the cost of one box.
    const interiorBack = new Mesh(
      new BoxGeometry(WIDTH - 0.4, WALL_H - 0.3, 0.06),
      interiorMaterial,
    );
    interiorBack.position.set(0, 0.55 + WALL_H / 2, -HALF_D + 0.13);
    cabin.add(interiorBack);

    // Front wall: two piers and a lintel around the opening.
    const pierW = (WIDTH - DOOR_W) / 2;
    for (const side of [-1, 1]) {
      const pier = new Mesh(new BoxGeometry(pierW, WALL_H, 0.2), wallMaterial);
      pier.position.set(side * (DOOR_W / 2 + pierW / 2), 0.55 + WALL_H / 2, HALF_D);
      pier.castShadow = true;
      pier.receiveShadow = true;
      cabin.add(pier);
    }
    const lintel = new Mesh(new BoxGeometry(DOOR_W, WALL_H - DOOR_H, 0.2), wallMaterial);
    lintel.position.set(0, 0.55 + DOOR_H + (WALL_H - DOOR_H) / 2, HALF_D);
    lintel.castShadow = true;
    cabin.add(lintel);

    // Log courses: thin bands standing slightly proud of the side walls. Four bands give the
    // log-cabin read for the price of four boxes, much cheaper than modelling round logs.
    for (const y of [1.1, 1.95, 2.8]) {
      for (const side of [-1, 1]) {
        const course = new Mesh(new BoxGeometry(0.16, 0.18, DEPTH - 0.3), wallMaterial);
        course.position.set(side * (HALF_W + 0.03), y, 0);
        course.castShadow = true;
        cabin.add(course);
      }
    }

    // Gable roof, ridge running front-to-back so the front gable faces the porch.
    for (const end of [1, -1]) {
      const gable = makeGable(HALF_W - 0.2, ROOF_RISE, 0.22, wallMaterial);
      gable.position.set(0, EAVES, end * (HALF_D + 0.1));
      cabin.add(gable);
    }
    for (const side of [-1, 1]) {
      // Rotation about Z by a negative angle drops the +X end, so the +X slope uses the negative
      // value. Getting this sign wrong produces a valley, exactly as it did on the tent.
      const slab = new Mesh(new BoxGeometry(SLOPE_LENGTH, 0.2, DEPTH + 0.5), roofMaterial);
      slab.position.set((side * ROOF_RUN) / 2, EAVES + ROOF_RISE / 2, 0);
      slab.rotation.z = -side * SLOPE;
      slab.castShadow = true;
      cabin.add(slab);
    }
    const ridgeCap = new Mesh(new BoxGeometry(0.22, 0.14, DEPTH + 0.55), roofMaterial);
    ridgeCap.position.y = RIDGE + 0.03;
    ridgeCap.castShadow = true;
    cabin.add(ridgeCap);

    const chimney = new Mesh(new BoxGeometry(0.6, 1.5, 0.6), stoneMaterial);
    chimney.position.set(1.7, 4.1, -0.9);
    chimney.castShadow = true;
    cabin.add(chimney);

    // Covered porch across the front: deck, roof, two posts, and a rail.
    const deck = new Mesh(new BoxGeometry(5.9, 0.34, 1.5), roofMaterial);
    deck.position.set(0, 0.17, HALF_D + 0.75);
    deck.receiveShadow = true;
    deck.castShadow = true;
    cabin.add(deck);
    const porchRoof = new Mesh(new BoxGeometry(6.0, 0.16, 1.7), roofMaterial);
    porchRoof.position.set(0, 2.55, HALF_D + 0.85);
    porchRoof.rotation.x = 0.3;
    porchRoof.castShadow = true;
    cabin.add(porchRoof);
    for (const side of [-1, 1]) {
      const post = new Mesh(new BoxGeometry(0.16, 2.2, 0.16), wallMaterial);
      post.position.set(side * 2.6, 1.44, HALF_D + 1.5);
      post.castShadow = true;
      cabin.add(post);
    }
    const rail = new Mesh(new BoxGeometry(5.36, 0.1, 0.1), wallMaterial);
    rail.position.set(0, 0.95, HALF_D + 1.5);
    rail.castShadow = true;
    cabin.add(rail);

    // The door itself, hinged open and standing out onto the porch. Measured by raycast: the
    // opening shows the dark interior panel, not a wall.
    const doorHinge = new Group();
    doorHinge.position.set(DOOR_W / 2, 0.55, HALF_D + 0.1);
    doorHinge.rotation.y = 2.0;
    cabin.add(doorHinge);
    const doorPanel = new Mesh(new BoxGeometry(DOOR_W, DOOR_H - 0.06, 0.07), boardMaterial);
    doorPanel.position.set(-DOOR_W / 2, (DOOR_H - 0.06) / 2, 0);
    doorPanel.castShadow = true;
    doorHinge.add(doorPanel);
    const doorHandle = new Mesh(new BoxGeometry(0.08, 0.08, 0.12), roofMaterial);
    doorHandle.position.set(-DOOR_W + 0.12, 1.0, 0.06);
    doorHinge.add(doorHandle);

    // Windows: two boarded on the front piers, one on the left wall, one glazed on the right.
    function addBoardedWindow(x: number, y: number, z: number, ry: number) {
      const backing = new Mesh(new BoxGeometry(0.9, 0.8, 0.06), interiorMaterial);
      backing.position.set(x, y, z);
      backing.rotation.y = ry;
      cabin.add(backing);
      for (const sign of [-1, 1]) {
        const board = new Mesh(new BoxGeometry(1.05, 0.17, 0.05), boardMaterial);
        board.position.set(x, y + sign * 0.13, z);
        board.rotation.set(0, ry, sign * 0.5);
        board.castShadow = true;
        cabin.add(board);
      }
    }
    addBoardedWindow(-1.65, 2.1, HALF_D + 0.11, 0);
    addBoardedWindow(1.65, 2.1, HALF_D + 0.11, 0);
    addBoardedWindow(-HALF_W - 0.01, 2.1, 0, Math.PI / 2);

    const sideWindow = new Mesh(new BoxGeometry(0.05, 0.8, 0.9), glassMaterial);
    sideWindow.position.set(HALF_W + 0.01, 2.1, 0);
    cabin.add(sideWindow);

    cabin.userData.assetId = 'candidate-ranger-cabin';
    return cabin;
  },
};
