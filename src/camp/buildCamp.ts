import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace,
  SphereGeometry,
  type BufferGeometry,
} from 'three';
import { createHelicopter } from '../assets/helicopter';
import { campEntrances, campServices, type CampService } from './campWorld';

const materials = {
  ground: new MeshStandardMaterial({ color: '#687454', roughness: 1, flatShading: true }),
  path: new MeshStandardMaterial({ color: '#81795f', roughness: 1, flatShading: true }),
  fence: new MeshStandardMaterial({ color: '#54594d', roughness: 0.92, flatShading: true }),
  darkMetal: new MeshStandardMaterial({ color: '#303833', roughness: 0.75, metalness: 0.2 }),
  timber: new MeshStandardMaterial({ color: '#655744', roughness: 0.98, flatShading: true }),
  wall: new MeshStandardMaterial({ color: '#797762', roughness: 1, flatShading: true }),
  roof: new MeshStandardMaterial({ color: '#626753', roughness: 0.94, flatShading: true }),
  canvas: new MeshStandardMaterial({ color: '#777960', roughness: 1, flatShading: true }),
  trim: new MeshStandardMaterial({ color: '#c5ad70', roughness: 0.72, metalness: 0.18 }),
  glass: new MeshStandardMaterial({ color: '#78908b', roughness: 0.36, metalness: 0.14 }),
  jacket: new MeshStandardMaterial({ color: '#526047', roughness: 0.95, flatShading: true }),
  jacketAlt: new MeshStandardMaterial({ color: '#7a664e', roughness: 0.96, flatShading: true }),
  jacketBlue: new MeshStandardMaterial({ color: '#566a70', roughness: 0.96, flatShading: true }),
  jacketRust: new MeshStandardMaterial({ color: '#89604c', roughness: 0.96, flatShading: true }),
  pants: new MeshStandardMaterial({ color: '#383f37', roughness: 0.98, flatShading: true }),
  boots: new MeshStandardMaterial({ color: '#382f26', roughness: 0.96, flatShading: true }),
  pack: new MeshStandardMaterial({ color: '#394238', roughness: 0.97, flatShading: true }),
  uniformMark: new MeshStandardMaterial({ color: '#d5b970', roughness: 0.8, flatShading: true }),
  skin: new MeshStandardMaterial({ color: '#c49b76', roughness: 1 }),
  marker: new MeshStandardMaterial({ color: '#d9bc73', roughness: 0.5, emissive: '#463813' }),
  red: new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9, flatShading: true }),
  boardFrame: new MeshStandardMaterial({ color: '#554837', roughness: 0.95, flatShading: true }),
  boardInk: new MeshStandardMaterial({ color: '#303832', roughness: 0.95, flatShading: true }),
  pinBlue: new MeshStandardMaterial({ color: '#607f91', roughness: 0.55, metalness: 0.12 }),
};

function mesh(
  geometry: BufferGeometry,
  material: MeshStandardMaterial,
  x: number,
  y: number,
  z: number,
  parent: Group,
): Mesh {
  const object = new Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = false;
  object.receiveShadow = false;
  parent.add(object);
  return object;
}

function box(
  parent: Group,
  width: number,
  height: number,
  depth: number,
  material: MeshStandardMaterial,
  x: number,
  y: number,
  z: number,
): Mesh {
  return mesh(new BoxGeometry(width, height, depth), material, x, y, z, parent);
}

function addGround(parent: Group): void {
  const ground = mesh(new PlaneGeometry(64, 64), materials.ground, 0, -0.035, 0, parent);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'Seeded terrain';
  ground.userData.walkableFloor = true;

  const mainWalk = mesh(new PlaneGeometry(7, 55), materials.path, 0, 0.005, 0.5, parent);
  mainWalk.rotation.x = -Math.PI / 2;
  const northWalk = mesh(new PlaneGeometry(45, 4.8), materials.path, 0, 0.01, -22.5, parent);
  northWalk.rotation.x = -Math.PI / 2;
  const vendorWalk = mesh(new PlaneGeometry(25, 4), materials.path, -8, 0.012, 4, parent);
  vendorWalk.rotation.x = -Math.PI / 2;
  const storageWalk = mesh(new PlaneGeometry(14, 3.6), materials.path, -17, 0.013, 7, parent);
  storageWalk.rotation.x = -Math.PI / 2;

  for (const [x, z] of [
    [-25, -24],
    [25, -24],
    [-25, 24],
    [25, 24],
    [-25, 0],
    [25, 0],
    [-16, 23],
    [16, 23],
  ]) {
    const planter = new Group();
    planter.position.set(x!, 0, z!);
    box(planter, 2.2, 0.42, 2.2, materials.timber, 0, 0.2, 0);
    for (const offset of [-0.55, 0.45]) {
      const shrub = mesh(
        new SphereGeometry(0.55, 7, 5),
        materials.jacket,
        offset,
        0.78,
        0,
        planter,
      );
      shrub.scale.set(1.15, 0.8, 1);
    }
    parent.add(planter);
  }
}

function addPerimeter(parent: Group): void {
  const z = 29;
  const x = 29;
  const beamY = [0.74, 1.72];
  for (const [start, end] of [
    [-28.5, -5.5],
    [5.5, 28.5],
  ]) {
    const length = end! - start!;
    const center = (start! + end!) / 2;
    for (const height of beamY) {
      box(parent, length, 0.18, 0.2, materials.fence, center, height, z);
    }
  }
  box(parent, 0.2, 1.95, 0.2, materials.trim, -5.5, 0.98, z);
  box(parent, 0.2, 1.95, 0.2, materials.trim, 5.5, 0.98, z);

  for (const sideX of [-x, x]) {
    for (const height of beamY) box(parent, 0.2, 0.18, 58, materials.fence, sideX, height, 0);
  }
  for (const height of beamY) box(parent, 58, 0.18, 0.2, materials.fence, 0, height, -z);
  for (const side of ['west', 'east'] as const) {
    const sideX = side === 'west' ? -28.5 : 28.5;
    for (const sideZ of [-28.5, -14, 0, 14, 28.5]) {
      box(parent, 0.36, 2.05, 0.36, materials.timber, sideX, 1, sideZ);
    }
  }
  for (const sideZ of [-28.5, 28.5]) {
    const postXs = sideZ === 28.5 ? [-28.5, -14, -5.5, 5.5, 14, 28.5] : [-28.5, -14, 0, 14, 28.5];
    for (const postX of postXs) box(parent, 0.36, 2.05, 0.36, materials.timber, postX!, 1, sideZ);
  }

  // Gate arch and closed, waist-high swing barriers keep the only road entrance readable.
  box(parent, 0.38, 3.6, 0.38, materials.darkMetal, -5.8, 1.8, 28.1);
  box(parent, 0.38, 3.6, 0.38, materials.darkMetal, 5.8, 1.8, 28.1);
  box(parent, 12, 0.28, 0.38, materials.darkMetal, 0, 3.45, 28.1);
  for (const sign of [-1, 1]) {
    const barrier = box(parent, 4.4, 0.22, 0.22, materials.red, sign * 3.45, 0.78, 27.8);
    barrier.rotation.y = sign * -0.15;
    for (let index = 0; index < 4; index += 1) {
      box(parent, 0.16, 0.27, 0.25, materials.trim, sign * (1.8 + index * 0.9), 0.78, 27.8);
    }
  }
}

function addTower(parent: Group, x: number, z: number, guard = true): void {
  const tower = new Group();
  tower.position.set(x, 0, z);
  for (const dx of [-1.2, 1.2]) {
    for (const dz of [-1.2, 1.2]) {
      const post = box(tower, 0.28, 5.35, 0.28, materials.timber, dx, 2.62, dz);
      post.rotation.x = dz * 0.035;
      box(tower, 0.34, 0.16, 0.34, materials.darkMetal, dx, 0.22, dz);
    }
  }
  for (const faceZ of [-1.2, 1.2]) {
    const braceA = box(tower, 2.78, 0.2, 0.22, materials.boardFrame, 0, 2.72, faceZ);
    const braceB = box(tower, 2.78, 0.2, 0.22, materials.boardFrame, 0, 2.72, faceZ);
    braceA.rotation.z = 0.46;
    braceB.rotation.z = -0.46;
  }
  box(tower, 3.1, 0.28, 3.1, materials.darkMetal, 0, 4.1, 0);
  box(tower, 3.55, 0.2, 3.55, materials.timber, 0, 5.35, 0);
  box(tower, 3.25, 0.14, 3.25, materials.darkMetal, 0, 5.18, 0);
  for (const dx of [-1.2, 1.2]) {
    for (const dz of [-1.2, 1.2]) {
      box(tower, 0.18, 2.6, 0.18, materials.timber, dx, 6.72, dz);
    }
  }
  for (const railY of [5.92, 6.3]) {
    box(tower, 0.13, 0.12, 2.48, materials.fence, -1.24, railY, 0);
    box(tower, 0.13, 0.12, 2.48, materials.fence, 1.24, railY, 0);
    box(tower, 2.48, 0.12, 0.13, materials.fence, 0, railY, -1.24);
    box(tower, 2.48, 0.12, 0.13, materials.fence, 0, railY, 1.24);
  }
  const leftRoof = box(tower, 2.3, 0.2, 4.05, materials.roof, -0.57, 8.28, 0);
  leftRoof.rotation.z = 0.36;
  leftRoof.castShadow = true;
  const rightRoof = box(tower, 2.3, 0.2, 4.05, materials.roof, 0.57, 8.28, 0);
  rightRoof.rotation.z = -0.36;
  rightRoof.castShadow = true;
  box(tower, 0.18, 0.2, 4.15, materials.trim, 0, 8.69, 0);
  for (const sideX of [-1.68, 1.68]) {
    box(tower, 0.14, 0.2, 4.12, materials.boardFrame, sideX, 7.9, 0);
  }
  const ladder = new Group();
  ladder.position.set(-1.55, 2, 0.2);
  ladder.rotation.z = -0.12;
  box(ladder, 0.12, 3.7, 0.9, materials.darkMetal, 0, 0, 0);
  for (let rung = 0; rung < 6; rung += 1) {
    const rungBar = box(ladder, 0.15, 0.09, 1.0, materials.trim, 0, -1.45 + rung * 0.58, 0);
    rungBar.castShadow = true;
  }
  tower.add(ladder);
  if (guard) addPerson(tower, 0, 5.42, -0.2, true, 0);
  parent.add(tower);
}

interface PersonRig {
  leftLeg: Group;
  rightLeg: Group;
  leftArm: Group;
  rightArm: Group;
}

interface CampWalker {
  person: Group;
  route: Array<{ x: number; z: number }>;
  waypointIndex: number;
  speed: number;
  phase: number;
  rig: PersonRig;
}

function addPerson(
  parent: Group,
  x: number,
  y: number,
  z: number,
  guard = false,
  variant = 0,
): Group {
  const person = new Group();
  person.position.set(x, y, z);
  const civilianJackets = [materials.jacketAlt, materials.jacketBlue, materials.jacketRust];
  const jacket = guard
    ? materials.jacket
    : civilianJackets[Math.abs(variant) % civilianJackets.length]!;
  box(person, 0.68, 0.82, 0.4, jacket, 0, 1.08, 0);
  box(person, 0.32, 0.12, 0.43, guard ? materials.uniformMark : materials.timber, 0, 1.48, 0.015);
  box(person, 0.7, 0.13, 0.43, materials.darkMetal, 0, 0.76, 0);
  box(person, 0.18, 0.19, 0.05, guard ? materials.uniformMark : materials.trim, -0.2, 1.22, 0.225);
  box(person, 0.18, 0.19, 0.05, materials.pack, 0.2, 1.22, 0.225);
  const leftLeg = new Group();
  leftLeg.position.set(-0.18, 0.66, 0);
  box(leftLeg, 0.24, 0.61, 0.27, materials.pants, 0, -0.29, 0);
  box(leftLeg, 0.28, 0.16, 0.38, materials.boots, 0, -0.57, 0.05);
  const rightLeg = new Group();
  rightLeg.position.set(0.18, 0.66, 0);
  box(rightLeg, 0.24, 0.61, 0.27, materials.pants, 0, -0.29, 0);
  box(rightLeg, 0.28, 0.16, 0.38, materials.boots, 0, -0.57, 0.05);
  person.add(leftLeg, rightLeg);

  const leftArm = new Group();
  leftArm.position.set(-0.4, 1.4, 0);
  box(leftArm, 0.25, 0.48, 0.29, jacket, 0, -0.24, 0);
  box(leftArm, 0.2, 0.34, 0.23, materials.pants, 0, -0.64, 0.015);
  box(leftArm, 0.17, 0.16, 0.19, materials.skin, 0, -0.88, 0.02);
  const rightArm = new Group();
  rightArm.position.set(0.4, 1.4, 0);
  box(rightArm, 0.25, 0.48, 0.29, jacket, 0, -0.24, 0);
  box(rightArm, 0.2, 0.34, 0.23, materials.pants, 0, -0.64, 0.015);
  box(rightArm, 0.17, 0.16, 0.19, materials.skin, 0, -0.88, 0.02);
  person.add(leftArm, rightArm);

  box(person, 0.28, 0.3, 0.22, materials.skin, 0, 1.56, 0.005);
  const head = mesh(new SphereGeometry(0.245, 9, 7), materials.skin, 0, 1.78, 0, person);
  head.scale.set(0.92, 1.05, 0.94);
  box(person, 0.055, 0.055, 0.025, materials.boardInk, -0.085, 1.81, 0.222);
  box(person, 0.055, 0.055, 0.025, materials.boardInk, 0.085, 1.81, 0.222);
  box(person, 0.56, 0.12, 0.56, guard ? materials.darkMetal : materials.timber, 0, 1.98, 0);
  const cap = mesh(
    new SphereGeometry(0.245, 8, 5),
    guard ? materials.jacket : materials.boardFrame,
    0,
    2.03,
    0,
    person,
  );
  cap.scale.set(1.02, 0.48, 1.02);
  if (guard) {
    box(person, 0.43, 0.08, 0.06, materials.uniformMark, 0, 1.99, 0.25);
    box(person, 0.45, 0.62, 0.29, materials.pack, 0, 1.0, -0.29);
    box(person, 0.07, 0.48, 0.035, materials.uniformMark, -0.13, 1.1, 0.218);
  } else {
    box(person, 0.09, 0.42, 0.035, materials.trim, 0.1, 1.1, 0.218);
  }
  if (guard) {
    const rifle = box(person, 0.1, 0.12, 0.92, materials.darkMetal, 0.42, 1.12, 0.16);
    rifle.rotation.x = -0.2;
    rifle.rotation.z = -0.12;
  }
  person.userData.rig = { leftLeg, rightLeg, leftArm, rightArm } satisfies PersonRig;
  parent.add(person);
  return person;
}

function addWalkingPerson(
  parent: Group,
  x: number,
  z: number,
  route: Array<{ x: number; z: number }>,
  variant: number,
): void {
  const person = addPerson(parent, x, 0, z, false, variant);
  const walkers = (parent.userData.walkers as CampWalker[] | undefined) ?? [];
  const rig = person.userData.rig as PersonRig;
  walkers.push({ person, route, waypointIndex: 0, speed: 1.05 + variant * 0.08, phase: 0, rig });
  parent.userData.walkers = walkers;
}

/** Advances the camp's patrol and civilian foot traffic while the player is at camp. */
export function updateCampWalkers(camp: Group, deltaSeconds: number): void {
  if (!camp.visible) return;
  const walkers = camp.userData.walkers as CampWalker[] | undefined;
  if (!walkers?.length) return;
  const delta = Math.min(deltaSeconds, 0.08);
  for (const walker of walkers) {
    let remaining = walker.speed * delta;
    let traveled = 0;
    let guard = 0;
    while (remaining > 0.001 && guard < walker.route.length + 2) {
      guard += 1;
      const target = walker.route[walker.waypointIndex]!;
      const dx = target.x - walker.person.position.x;
      const dz = target.z - walker.person.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.08) {
        walker.person.position.x = target.x;
        walker.person.position.z = target.z;
        walker.waypointIndex = (walker.waypointIndex + 1) % walker.route.length;
        continue;
      }
      const step = Math.min(distance, remaining);
      walker.person.position.x += (dx / distance) * step;
      walker.person.position.z += (dz / distance) * step;
      walker.person.rotation.y = Math.atan2(dx, dz);
      remaining -= step;
      traveled += step;
    }
    walker.phase += traveled * 3.6;
    const stride = Math.sin(walker.phase) * 0.42;
    walker.rig.leftLeg.rotation.x = stride;
    walker.rig.rightLeg.rotation.x = -stride;
    walker.rig.leftArm.rotation.x = -stride * 0.72;
    walker.rig.rightArm.rotation.x = stride * 0.72;
    walker.person.position.y = Math.abs(Math.sin(walker.phase * 2)) * 0.025;
  }
}

function addBarracks(parent: Group, id: string, x: number, z: number, clinic = false): void {
  const house = new Group();
  house.position.set(x, 0, z);
  house.userData.interactiveId = id;
  const body = box(house, 10, 3.4, 8, clinic ? materials.wall : materials.canvas, 0, 1.7, 0);
  body.userData.interactiveId = id;
  body.castShadow = true;
  const roof = box(house, 11.2, 1.1, 9.3, materials.roof, 0, 3.82, 0);
  roof.castShadow = true;
  roof.rotation.x = -0.12;
  const door = box(house, 1.6, 2.45, 0.24, materials.timber, 0, 1.22, 4.08);
  door.userData.interactiveId = id;
  box(house, 1.9, 0.15, 0.22, materials.trim, 0, 2.54, 4.08);
  for (const side of [-1, 1]) {
    box(house, 1.8, 1.1, 0.14, materials.glass, side * 3.25, 2.0, 4.1);
    box(house, 0.08, 1.3, 0.18, materials.darkMetal, side * 3.25, 2.0, 4.08);
  }
  if (clinic) {
    const cross = box(house, 1.55, 0.36, 0.08, materials.red, 0, 3.05, 4.13);
    cross.rotation.z = 0;
    box(house, 0.36, 1.55, 0.08, materials.red, 0, 3.05, 4.13);
  } else {
    box(house, 3, 0.72, 0.08, materials.timber, 0, 3.05, 4.12);
  }
  parent.add(house);
}

function addQuartermaster(parent: Group): void {
  const stall = new Group();
  stall.userData.interactiveId = 'camp-quartermaster';
  box(stall, 7.4, 0.25, 0.95, materials.timber, -7, 0.92, 0.2);
  for (const x of [-10.2, -3.8]) box(stall, 0.22, 2.55, 0.22, materials.timber, x, 1.23, -0.8);
  const canopy = box(stall, 7.7, 0.22, 2.25, materials.canvas, -7, 2.62, -0.6);
  canopy.rotation.z = -0.025;
  const counter = box(stall, 7.4, 0.72, 0.95, materials.darkMetal, -7, 0.38, 0.2);
  counter.userData.interactiveId = 'camp-quartermaster';
  for (const x of [-9.2, -7.2, -5.0]) {
    box(stall, 0.78, 0.66, 0.68, materials.timber, x, 1.4, 0.1);
    box(stall, 0.84, 0.08, 0.72, materials.trim, x, 1.76, 0.1);
  }
  addPerson(stall, -7, 0, -1.55, false, 2);
  parent.add(stall);
}

function addScrapPile(
  parent: Group,
  x: number,
  z: number,
  width: number,
  depth: number,
  height: number,
  phase: number,
): void {
  const pile = new Group();
  pile.position.set(x, 0, z);
  // Low, overlapping layers make each mound irregular instead of a neat crate stack.
  box(
    pile,
    width * 0.82,
    height * 0.38,
    depth * 0.78,
    materials.darkMetal,
    -0.15,
    height * 0.19,
    0,
  );
  const upper = box(
    pile,
    width * 0.58,
    height * 0.42,
    depth * 0.6,
    materials.fence,
    0.24,
    height * 0.53,
    -0.1,
  );
  upper.rotation.y = 0.19;
  box(
    pile,
    width * 0.42,
    height * 0.28,
    depth * 0.38,
    materials.timber,
    -width * 0.13,
    height * 0.79,
    depth * 0.06,
  ).rotation.y = -0.32;
  const scrapMaterials = [
    materials.darkMetal,
    materials.fence,
    materials.trim,
    materials.timber,
    materials.red,
  ];
  for (let index = 0; index < 26; index += 1) {
    const angle = index * 2.39996 + phase;
    const radius = Math.sqrt((index + 0.6) / 27);
    const pieceWidth = 0.35 + ((index * 7) % 6) * 0.16;
    const pieceDepth = 0.32 + ((index * 5) % 7) * 0.14;
    const piece = box(
      pile,
      pieceWidth,
      0.18 + (index % 4) * 0.09,
      pieceDepth,
      scrapMaterials[index % scrapMaterials.length]!,
      Math.cos(angle) * radius * width * 0.39,
      0.4 + (1 - radius) * height * 0.8 + (index % 3) * 0.16,
      Math.sin(angle) * radius * depth * 0.39,
    );
    piece.rotation.set((index % 5) * 0.11, angle, ((index % 7) - 3) * 0.11);
  }
  for (const [wheelX, wheelZ, tilt] of [
    [-width * 0.27, depth * 0.18, 0.24],
    [width * 0.23, -depth * 0.22, -0.31],
  ]) {
    const wheel = mesh(
      new CylinderGeometry(0.65, 0.65, 0.28, 10),
      materials.darkMetal,
      wheelX,
      0.88,
      wheelZ,
      pile,
    );
    wheel.rotation.z = Math.PI / 2 + tilt;
    const hub = mesh(
      new CylinderGeometry(0.25, 0.25, 0.3, 8),
      materials.trim,
      wheelX,
      0.88,
      wheelZ,
      pile,
    );
    hub.rotation.z = wheel.rotation.z;
  }
  parent.add(pile);
}

function addScrapYard(parent: Group): void {
  const yard = new Group();
  yard.userData.interactiveId = 'camp-scrap';
  box(yard, 3.6, 2.45, 2.7, materials.timber, 23, 1.22, -5);
  const roof = box(yard, 4.4, 0.3, 3.35, materials.roof, 23, 2.6, -5);
  roof.rotation.z = 0.12;
  box(yard, 1.55, 1.35, 0.17, materials.darkMetal, 23, 0.68, -3.6);
  box(yard, 2.6, 0.28, 0.18, materials.trim, 23, 2.08, -3.49);
  addPerson(yard, 19.8, 0, -4.1, false, 1);
  // These piles overlap slightly and sit along the east wall, away from the landing pad.
  addScrapPile(yard, 21.2, 0, 6.3, 5.2, 2.65, 0.2);
  addScrapPile(yard, 25.2, 0.8, 4.7, 4.2, 2.05, 1.4);
  parent.add(yard);
}

function addFoodStand(parent: Group): void {
  const stand = new Group();
  stand.userData.interactiveId = 'camp-food';
  box(stand, 4.4, 0.72, 1.05, materials.timber, -8, 0.62, 10.3);
  for (const x of [-10, -6]) box(stand, 0.15, 2.4, 0.15, materials.timber, x, 1.3, 10.2);
  box(stand, 4.9, 0.2, 2.1, materials.canvas, -8, 2.52, 10.1);
  for (const x of [-9.3, -8, -6.7]) {
    box(stand, 0.8, 0.34, 0.65, materials.trim, x, 1.16, 10.28);
    mesh(new SphereGeometry(0.2, 7, 5), materials.red, x, 1.45, 10.2, stand);
  }
  addPerson(stand, -8, 0, 11.7, false, 2);
  parent.add(stand);
}

function addStorehouse(parent: Group): void {
  const store = new Group();
  store.position.set(-18, 0, 15);
  store.userData.interactiveId = 'camp-storage';
  const body = box(store, 11.7, 3.3, 9.7, materials.wall, 0, 1.65, 0);
  body.userData.interactiveId = 'camp-storage';
  body.castShadow = true;
  const roof = box(store, 12.4, 0.55, 10.4, materials.roof, 0, 3.52, 0);
  roof.castShadow = true;
  roof.rotation.x = 0.08;
  const rollDoor = box(store, 3.5, 2.55, 0.2, materials.darkMetal, 0, 1.27, 4.93);
  rollDoor.userData.interactiveId = 'camp-storage';
  for (const x of [-4.2, 4.2]) {
    box(store, 1.2, 1.25, 1.1, materials.timber, x, 0.62, 4.15);
    box(store, 1.2, 1.25, 1.1, materials.darkMetal, x + 0.4, 0.62, 3.1);
  }
  parent.add(store);
}

function drawOperationsGraphic(kind: 'field-map' | 'briefing'): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 600;
  const context = canvas.getContext('2d');
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  if (!context) return texture;

  context.fillStyle = '#d6c59c';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#665941';
  context.lineWidth = 12;
  context.strokeRect(10, 10, 880, 580);
  context.fillStyle = '#344237';
  context.fillRect(20, 20, 860, 78);
  context.fillStyle = '#eee1bb';
  context.font = 'bold 34px Trebuchet MS, sans-serif';
  context.fillText(
    kind === 'field-map' ? 'WAYFARER // FIELD MAP' : 'OPERATIONS // LOOSE ENDS',
    42,
    70,
  );

  const pin = (x: number, y: number, color: string) => {
    context.fillStyle = '#f0e2bd';
    context.beginPath();
    context.arc(x + 3, y + 5, 16, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, 13, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#473b2a';
    context.lineWidth = 3;
    context.stroke();
  };
  const note = (
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number,
    color: string,
    heading: string,
    line1: string,
    line2: string,
  ) => {
    context.save();
    context.translate(x + width / 2, y + height / 2);
    context.rotate(angle);
    context.fillStyle = 'rgba(48, 43, 33, 0.24)';
    context.fillRect(-width / 2 + 7, -height / 2 + 8, width, height);
    context.fillStyle = color;
    context.fillRect(-width / 2, -height / 2, width, height);
    context.fillStyle = '#39372f';
    context.font = 'bold 23px Trebuchet MS, sans-serif';
    context.fillText(heading, -width / 2 + 16, -height / 2 + 38);
    context.font = 'italic 19px Trebuchet MS, sans-serif';
    context.fillText(line1, -width / 2 + 16, -height / 2 + 75);
    context.fillText(line2, -width / 2 + 16, -height / 2 + 108);
    context.restore();
    pin(x + width * 0.5, y + 3, '#a94739');
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number, color = '#a94739') => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    context.strokeStyle = color;
    context.lineWidth = 8;
    context.setLineDash([12, 9]);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(x2 - Math.cos(angle - 0.55) * 26, y2 - Math.sin(angle - 0.55) * 26);
    context.lineTo(x2 - Math.cos(angle + 0.55) * 26, y2 - Math.sin(angle + 0.55) * 26);
    context.closePath();
    context.fill();
  };

  if (kind === 'field-map') {
    context.fillStyle = '#c8bb91';
    context.fillRect(40, 122, 550, 438);
    context.strokeStyle = '#887a59';
    context.lineWidth = 3;
    for (let x = 70; x < 580; x += 42) {
      context.beginPath();
      context.moveTo(x, 132);
      context.lineTo(x, 550);
      context.stroke();
    }
    for (let y = 148; y < 550; y += 38) {
      context.beginPath();
      context.moveTo(48, y);
      context.lineTo(580, y);
      context.stroke();
    }
    context.fillStyle = '#74815e';
    context.beginPath();
    context.moveTo(70, 180);
    context.lineTo(205, 142);
    context.lineTo(264, 212);
    context.lineTo(224, 314);
    context.lineTo(113, 322);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(330, 380);
    context.lineTo(402, 336);
    context.lineTo(555, 366);
    context.lineTo(545, 510);
    context.lineTo(398, 532);
    context.closePath();
    context.fill();
    context.fillStyle = '#78949a';
    context.beginPath();
    context.moveTo(176, 548);
    context.bezierCurveTo(260, 470, 216, 412, 318, 354);
    context.bezierCurveTo(404, 302, 350, 226, 482, 133);
    context.lineTo(519, 133);
    context.bezierCurveTo(389, 252, 457, 306, 344, 379);
    context.bezierCurveTo(276, 424, 310, 487, 213, 550);
    context.closePath();
    context.fill();
    context.strokeStyle = '#e5d8b4';
    context.lineWidth = 18;
    context.beginPath();
    context.moveTo(72, 443);
    context.bezierCurveTo(181, 400, 256, 450, 345, 290);
    context.bezierCurveTo(415, 215, 463, 239, 558, 180);
    context.stroke();
    context.strokeStyle = '#a94739';
    context.lineWidth = 8;
    context.setLineDash([13, 11]);
    context.beginPath();
    context.moveTo(104, 490);
    context.lineTo(207, 425);
    context.lineTo(283, 361);
    context.lineTo(368, 266);
    context.lineTo(497, 205);
    context.stroke();
    context.setLineDash([]);
    arrow(368, 266, 497, 205);
    pin(104, 490, '#d9bc73');
    pin(283, 361, '#8e5142');
    pin(497, 205, '#607f91');
    context.fillStyle = '#39372f';
    context.font = 'bold 18px Trebuchet MS, sans-serif';
    context.fillText('CAMP', 69, 526);
    context.fillText('OLD ROAD', 394, 220);
    context.fillText('RIVER', 335, 450);
    note(
      620,
      138,
      235,
      150,
      -0.045,
      '#e8d78e',
      'SUPPLY RUN',
      'Take the old road',
      'unless it is cursed.',
    );
    note(625, 320, 225, 150, 0.055, '#d7dfc1', 'CHECK SIGNAL', 'Radio mast first.', 'No heroics.');
    context.fillStyle = '#40372e';
    context.font = 'italic 19px Trebuchet MS, sans-serif';
    context.fillText('north is the pointy end ↑', 610, 526);
  } else {
    context.fillStyle = '#c9bb91';
    context.fillRect(40, 122, 820, 438);
    note(65, 140, 300, 150, -0.055, '#e8d78e', 'PLAN A', 'Sneak past the gate.', 'Look confident.');
    note(
      518,
      143,
      300,
      150,
      0.045,
      '#d7dfc1',
      'PLAN B',
      'Use the noisy truck.',
      'We have no truck.',
    );
    note(
      94,
      361,
      300,
      145,
      0.04,
      '#e9c4a3',
      'IMPORTANT',
      'Do not lose the map.',
      'Map is on this board.',
    );
    note(520, 366, 290, 145, -0.05, '#ead8b9', 'MYSTERY DOT', 'Could be loot.', 'Could be a pond.');
    context.strokeStyle = '#a94739';
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(359, 232);
    context.bezierCurveTo(436, 216, 420, 324, 518, 219);
    context.moveTo(367, 427);
    context.bezierCurveTo(442, 456, 467, 389, 525, 436);
    context.stroke();
    context.fillStyle = '#a94739';
    context.beginPath();
    context.arc(445, 320, 50, 0, Math.PI * 2);
    context.strokeStyle = '#a94739';
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = '#a94739';
    context.font = 'bold 82px Trebuchet MS, sans-serif';
    context.fillText('?!', 407, 347);
    arrow(400, 292, 438, 271, '#637751');
    context.fillStyle = '#3d4639';
    context.font = 'bold 18px Trebuchet MS, sans-serif';
    context.fillText('THE THREADS ARE PROBABLY NOT TO SCALE', 265, 548);
  }
  texture.needsUpdate = true;
  return texture;
}

function addOperationsBoard(parent: Group): void {
  const service = campServices.find(({ id }) => id === 'camp-operations');
  const station = new Group();
  if (service) station.position.set(service.x, 0, service.z);
  station.userData.interactiveId = 'camp-operations';

  const addBoard = (x: number, kind: 'field-map' | 'briefing'): void => {
    const board = new Group();
    board.position.x = x;
    board.rotation.y = Math.PI;
    const width = 3.55;
    const height = 2.7;
    box(board, width, height, 0.2, materials.timber, 0, 1.82, 0);
    const graphic = drawOperationsGraphic(kind);
    const faceMaterial = new MeshStandardMaterial({
      map: graphic,
      roughness: 1,
      side: DoubleSide,
    });
    const face = mesh(new PlaneGeometry(3.25, 2.36), faceMaterial, 0, 1.82, -0.112, board);
    face.rotation.y = Math.PI;
    for (const side of [-1, 1]) {
      box(board, 0.18, height + 0.16, 0.24, materials.boardFrame, side * 1.75, 1.82, -0.14);
      box(board, 0.2, 0.92, 0.2, materials.timber, side * 1.3, 0.46, 0);
    }
    box(board, width + 0.12, 0.18, 0.24, materials.trim, 0, 3.17, -0.14);
    box(board, width + 0.12, 0.16, 0.26, materials.boardFrame, 0, 0.49, -0.14);
    box(board, width + 0.12, 0.16, 0.28, materials.timber, 0, 0.84, -0.25);
    const pinColors = [materials.red, materials.marker, materials.pinBlue];
    for (let index = 0; index < 3; index += 1) {
      const pin = mesh(
        new SphereGeometry(0.085, 8, 6),
        pinColors[index]!,
        -1.08 + index * 1.08,
        2.86 - (index % 2) * 0.05,
        -0.19,
        board,
      );
      pin.scale.set(1, 1, 0.7);
    }
    station.add(board);
  };

  addBoard(0, 'field-map');
  addBoard(3.95, 'briefing');
  parent.add(station);
}

function addDeparturePad(parent: Group): void {
  const pad = new Group();
  pad.position.set(17, 0, 17);
  pad.userData.interactiveId = 'camp-departure';
  const concrete = mesh(new CircleGeometry(6.7, 32), materials.darkMetal, 0, 0.04, 0, pad);
  concrete.rotation.x = -Math.PI / 2;
  const outer = mesh(new RingGeometry(6.9, 7.2, 36), materials.trim, 0, 0.08, 0, pad);
  outer.rotation.x = -Math.PI / 2;
  const landingH = box(pad, 3.3, 0.1, 0.46, materials.trim, 0, 0.12, 0);
  landingH.userData.interactiveId = 'camp-departure';
  box(pad, 0.46, 0.1, 2.3, materials.trim, 0, 0.12, -0.08);

  const helicopter = createHelicopter('camp-departure');
  helicopter.group.name = 'Camp departure helicopter';
  helicopter.group.position.set(0.8, 1.4, 0.2);
  helicopter.mainRotor.name = 'Camp helicopter main rotor';
  helicopter.tailRotor.name = 'Camp helicopter tail rotor';
  pad.add(helicopter.group);
  parent.add(pad);
}

function addServiceMarker(parent: Group, service: CampService): void {
  const marker = new Group();
  marker.position.set(service.x, 0.05, service.z);
  marker.userData.interactiveId = service.id;
  const ring = mesh(new RingGeometry(0.55, 0.72, 18), materials.marker, 0, 0, 0, marker);
  ring.rotation.x = -Math.PI / 2;
  mesh(new CylinderGeometry(0.055, 0.075, 0.75, 6), materials.trim, 0, 0.52, 0, marker);
  const beacon = mesh(new SphereGeometry(0.16, 7, 5), materials.marker, 0, 0.98, 0, marker);
  beacon.userData.interactiveId = service.id;
  parent.add(marker);
}

function addGuard(parent: Group, x: number, z: number, rotation = 0): void {
  const guard = new Group();
  guard.position.set(x, 0, z);
  guard.rotation.y = rotation;
  addPerson(guard, 0, 0, 0, true);
  parent.add(guard);
}

/** Builds Wayfarer Camp as a compact, walkable safe-zone scene. */
export function buildCamp(): Group {
  const camp = new Group();
  camp.name = 'Wayfarer Camp';
  addGround(camp);
  addPerimeter(camp);
  addTower(camp, -25.4, -25.4);
  addTower(camp, 25.4, -25.4);
  addTower(camp, -25.4, 25.4, false);
  addTower(camp, 25.4, 25.4, false);
  addBarracks(camp, 'camp-barracks', -15, -13, false);
  addBarracks(camp, 'camp-clinic', 15, -13, true);
  addStorehouse(camp);
  addQuartermaster(camp);
  addScrapYard(camp);
  addFoodStand(camp);
  addOperationsBoard(camp);
  addDeparturePad(camp);
  addGuard(camp, -5, 24.5, 0);
  addGuard(camp, 5, 24.5, Math.PI);
  addWalkingPerson(
    camp,
    4,
    -9.3,
    [
      { x: 4, z: -9.3 },
      { x: 6, z: -6 },
      { x: 7, z: -2 },
      { x: 4, z: 3 },
      { x: 0, z: 2 },
      { x: -2, z: -3 },
      { x: 1, z: -7 },
    ],
    1,
  );
  addPerson(camp, 12, 0, 4.5, true, 0);
  addWalkingPerson(
    camp,
    -8,
    12,
    [
      { x: -8, z: 12 },
      { x: -7, z: 17 },
      { x: -2, z: 20 },
      { x: 3, z: 18 },
      { x: 4, z: 13 },
      { x: 1, z: 9 },
      { x: -5, z: 9 },
    ],
    2,
  );
  for (const service of campServices) addServiceMarker(camp, service);
  for (const entrance of campEntrances) {
    const door = new Group();
    door.position.set(entrance.doorX, 0, entrance.doorZ);
    door.userData.interactiveId = entrance.id;
    const marker = mesh(new RingGeometry(0.55, 0.72, 18), materials.marker, 0, 0.07, 0, door);
    marker.rotation.x = -Math.PI / 2;
    const light = mesh(new SphereGeometry(0.13, 7, 5), materials.marker, 0, 2.15, 0, door);
    light.userData.interactiveId = entrance.id;
    camp.add(door);
  }
  camp.userData.staticColliderCount = 9;
  camp.userData.assetCount = 0;
  return camp;
}
