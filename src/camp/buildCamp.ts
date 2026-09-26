import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
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
  skin: new MeshStandardMaterial({ color: '#c49b76', roughness: 1 }),
  marker: new MeshStandardMaterial({ color: '#d9bc73', roughness: 0.5, emissive: '#463813' }),
  red: new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9, flatShading: true }),
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
      const post = box(tower, 0.24, 5.2, 0.24, materials.timber, dx, 2.5, dz);
      post.rotation.x = dz * 0.035;
    }
  }
  box(tower, 3.1, 0.28, 3.1, materials.darkMetal, 0, 4.1, 0);
  box(tower, 3.45, 0.16, 3.45, materials.timber, 0, 5.35, 0);
  const towerRoof = box(tower, 3.65, 0.22, 3.65, materials.roof, 0, 6.1, 0);
  towerRoof.castShadow = true;
  const ladder = new Group();
  ladder.position.set(-1.55, 2, 0.2);
  ladder.rotation.z = -0.12;
  box(ladder, 0.12, 3.7, 0.9, materials.darkMetal, 0, 0, 0);
  for (let rung = 0; rung < 6; rung += 1) {
    const rungBar = box(ladder, 0.15, 0.09, 1.0, materials.trim, 0, -1.45 + rung * 0.58, 0);
    rungBar.castShadow = true;
  }
  tower.add(ladder);
  if (guard) addPerson(tower, 0.15, 5.5, -0.2, true);
  parent.add(tower);
}

function addPerson(parent: Group, x: number, y: number, z: number, guard = false): Group {
  const person = new Group();
  person.position.set(x, y, z);
  const jacket = guard ? materials.jacket : materials.jacketAlt;
  box(person, 0.62, 0.9, 0.37, jacket, 0, 0.83, 0);
  const head = mesh(new SphereGeometry(0.25, 8, 6), materials.skin, 0, 1.47, -0.02, person);
  head.scale.set(0.92, 1.08, 0.9);
  box(person, 0.55, 0.16, 0.52, guard ? materials.darkMetal : materials.timber, 0, 1.69, 0);
  for (const side of [-1, 1]) {
    box(person, 0.2, 0.65, 0.22, materials.darkMetal, side * 0.2, 0.32, 0.02);
    box(person, 0.2, 0.48, 0.22, jacket, side * 0.38, 0.95, -0.02);
  }
  if (guard) {
    const rifle = box(person, 0.12, 0.13, 1.15, materials.darkMetal, 0.33, 1.03, -0.24);
    rifle.rotation.x = -0.14;
  }
  parent.add(person);
  return person;
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
  addPerson(stall, -7, 0, -1.55);
  parent.add(stall);
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

function addOperationsBoard(parent: Group): void {
  const board = new Group();
  const service = campServices.find(({ id }) => id === 'camp-operations');
  if (service) board.position.set(service.x, 0, service.z);
  board.userData.interactiveId = 'camp-operations';
  box(board, 3.1, 2.45, 0.18, materials.timber, 0, 1.32, 0);
  box(board, 2.7, 1.7, 0.12, materials.darkMetal, 0, 1.55, -0.11);
  const pins: Array<[number, number, MeshStandardMaterial]> = [
    [-0.72, 1.82, materials.marker],
    [0, 1.42, materials.red],
    [0.72, 1.84, materials.jacket],
  ];
  for (const [x, y, color] of pins) {
    const pin = mesh(new CircleGeometry(0.18, 8), color!, x!, y!, -0.04, board);
    pin.userData.interactiveId = 'camp-operations';
  }
  box(board, 3.45, 0.18, 0.22, materials.trim, 0, 2.7, 0);
  for (const x of [-1.25, 1.25]) box(board, 0.18, 0.85, 0.18, materials.timber, x, 0.42, 0);
  parent.add(board);
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
  addOperationsBoard(camp);
  addDeparturePad(camp);
  addGuard(camp, -5, 24.5, 0);
  addGuard(camp, 5, 24.5, Math.PI);
  addPerson(camp, 4, 0, -9.3);
  addPerson(camp, 12, 0, 4.5, true);
  addPerson(camp, -8, 0, 12);
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
