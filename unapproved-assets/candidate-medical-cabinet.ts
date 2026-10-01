import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Wall-mounted medical cabinet. Local +Z is the room side, i.e. the direction the cabinet door
// swings out into; the wall the cabinet is fixed to is at −Z. A small steel cupboard on two
// brackets with a hinged door, a faded cross, a shelf of bottles, a dented lower panel, and a
// short return of wall it is mounted on. Small by design: a player has to get close to notice it.
const cabinetMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.75,
  metalness: 0.2,
  flatShading: true,
});
cabinetMaterial.name = 'medical-cabinet';

const frameMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
frameMaterial.name = 'medical-frame';

const interiorMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.95,
  flatShading: true,
});
interiorMaterial.name = 'medical-interior';

const crossMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.9,
  metalness: 0.05,
  flatShading: true,
});
crossMaterial.name = 'medical-cross';

const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.25,
  metalness: 0.1,
});
glassMaterial.name = 'medical-glass';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.95,
  metalness: 0.1,
  flatShading: true,
});
rustMaterial.name = 'medical-rust';

const wallMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.95,
  flatShading: true,
});
wallMaterial.name = 'medical-wall';

const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'medical-timber';

const W = 0.68;
const H = 0.86;
const D = 0.3;
const FLOOR = 1.05;
const WALL_Z = -0.28;

export const candidateMedicalCabinet: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-medical-cabinet',
  name: 'Wall-Mounted Medical Cabinet',
  category: 'prop',
  dimensions: { x: 1.9, y: 2.0, z: 1.4 },
  collider: { center: { x: 0, y: 1.38, z: 0.02 }, size: { x: 0.72, y: 0.9, z: 0.62 } },
  interactionPoints: [
    { id: 'medical-cabinet', label: 'Medical Cabinet', position: { x: 0, y: 0, z: 0.75 } },
  ],
  createVisual(variant = 0) {
    const station = new Group();
    const doorOpen = variant !== 1;
    const broken = variant === 2;

    // Wall the cabinet is fixed to, plus a floor. The asset carries the short wall return it needs
    // so it never floats on a building face and never requires a building to be modelled for it.
    const wall = new Mesh(new BoxGeometry(1.9, 2.0, 0.14), wallMaterial);
    wall.position.set(0, 1.0, WALL_Z - 0.07);
    wall.castShadow = true;
    wall.receiveShadow = true;
    station.add(wall);
    // Skirting and a picture rail give the wall two horizontal lines, so it reads as a room rather
    // than as a floating panel.
    const skirting = new Mesh(new BoxGeometry(1.9, 0.16, 0.06), interiorMaterial);
    skirting.position.set(0, 0.08, WALL_Z + 0.03);
    station.add(skirting);
    const rail = new Mesh(new BoxGeometry(1.9, 0.07, 0.05), interiorMaterial);
    rail.position.set(0, 1.86, WALL_Z + 0.025);
    station.add(rail);
    const floor = new Mesh(new BoxGeometry(1.9, 0.06, 1.0), interiorMaterial);
    floor.position.set(0, 0.03, WALL_Z + 0.5);
    floor.receiveShadow = true;
    station.add(floor);

    // Two wall brackets under the carcass, then the carcass. The brackets are what say "mounted"
    // rather than "standing".
    for (const sx of [-1, 1]) {
      const bracket = new Mesh(new BoxGeometry(0.1, 0.22, D + 0.08), frameMaterial);
      bracket.position.set(sx * 0.24, FLOOR - 0.1, WALL_Z + 0.14);
      bracket.castShadow = true;
      station.add(bracket);
      const stay = new Mesh(new BoxGeometry(0.07, 0.07, 0.26), frameMaterial);
      stay.position.set(sx * 0.24, FLOOR - 0.02, WALL_Z + 0.26);
      stay.rotation.x = -0.7;
      station.add(stay);
    }

    // Carcass: back, two sides, top and bottom. Open at the front so the interior is visible when
    // the door is off its hinge.
    const back = new Mesh(new BoxGeometry(W, H, 0.05), cabinetMaterial);
    back.position.set(0, FLOOR + H / 2, WALL_Z + 0.025);
    back.castShadow = true;
    back.receiveShadow = true;
    station.add(back);
    for (const sx of [-1, 1]) {
      const side = new Mesh(new BoxGeometry(0.05, H, D), cabinetMaterial);
      side.position.set(sx * (W / 2 - 0.025), FLOOR + H / 2, WALL_Z + D / 2);
      side.castShadow = true;
      side.receiveShadow = true;
      station.add(side);
    }
    for (const sy of [0, 1]) {
      const cap = new Mesh(new BoxGeometry(W, 0.05, D), cabinetMaterial);
      cap.position.set(0, FLOOR + H / 2 + (sy ? H / 2 - 0.025 : -H / 2 + 0.025), WALL_Z + D / 2);
      cap.castShadow = true;
      cap.receiveShadow = true;
      station.add(cap);
    }

    // One shelf with three bottles: the reason to open the door.
    const shelf = new Mesh(new BoxGeometry(W - 0.1, 0.03, D - 0.08), interiorMaterial);
    shelf.position.set(0, FLOOR + H * 0.52, WALL_Z + D / 2);
    station.add(shelf);
    const bottleColors = [crossMaterial, glassMaterial, rustMaterial];
    for (let i = 0; i < 3; i++) {
      const bottle = new Mesh(new CylinderGeometry(0.035, 0.04, 0.14, 6), bottleColors[i]!);
      bottle.position.set(-0.18 + i * 0.18, FLOOR + H * 0.52 + 0.085, WALL_Z + 0.06);
      bottle.castShadow = true;
      station.add(bottle);
      const cap = new Mesh(new CylinderGeometry(0.026, 0.03, 0.03, 6), frameMaterial);
      cap.position.set(-0.18 + i * 0.18, FLOOR + H * 0.52 + 0.17, WALL_Z + 0.06);
      station.add(cap);
    }
    // A tin on the lower deck, so the shelf is not the only contents.
    const tin = new Mesh(new BoxGeometry(0.13, 0.1, 0.09), rustMaterial);
    tin.position.set(0.16, FLOOR + 0.1, WALL_Z + 0.06);
    tin.castShadow = true;
    station.add(tin);

    // Door on a hinge post at −X, hinged so it swings out into the room on +Z. The hinge is a real
    // post with two knuckles and a pin, so the door reads as hinged rather than as a panel
    // floating beside the box.
    const hingeX = -W / 2 - 0.02;
    const hingeZ = WALL_Z + D - 0.06;
    for (const sy of [0.28, 0.78]) {
      const knuckle = new Mesh(new CylinderGeometry(0.035, 0.035, 0.08, 6), frameMaterial);
      knuckle.position.set(hingeX, FLOOR + H * sy, hingeZ);
      station.add(knuckle);
    }
    const pin = new Mesh(new CylinderGeometry(0.015, 0.015, H - 0.1, 5), frameMaterial);
    pin.position.set(hingeX, FLOOR + H / 2, hingeZ);
    station.add(pin);
    const doorPivot = new Group();
    doorPivot.position.set(hingeX, FLOOR, hingeZ);
    doorPivot.rotation.y = doorOpen ? 1.15 : 0;
    station.add(doorPivot);
    const door = new Mesh(new BoxGeometry(W - 0.04, H - 0.04, 0.04), cabinetMaterial);
    door.position.set((W - 0.04) / 2, H / 2, 0.02);
    door.castShadow = true;
    door.receiveShadow = true;
    doorPivot.add(door);
    // Faded cross, painted proud of the door so it survives a low-poly silhouette.
    const crossV = new Mesh(new BoxGeometry(0.075, 0.3, 0.02), crossMaterial);
    crossV.position.set((W - 0.04) / 2, H / 2 + 0.04, 0.045);
    doorPivot.add(crossV);
    const crossH = new Mesh(new BoxGeometry(0.3, 0.075, 0.02), crossMaterial);
    crossH.position.set((W - 0.04) / 2, H / 2 + 0.04, 0.045);
    doorPivot.add(crossH);
    // Handle and a small hasp on the free edge.
    const handle = new Mesh(new BoxGeometry(0.05, 0.16, 0.05), frameMaterial);
    handle.position.set(W - 0.1, H / 2, 0.06);
    handle.castShadow = true;
    doorPivot.add(handle);
    const hasp = new Mesh(new BoxGeometry(0.09, 0.11, 0.03), frameMaterial);
    hasp.position.set(W - 0.1, H / 2 + 0.22, 0.05);
    doorPivot.add(hasp);

    // Variant 2: a dented panel on the door, a torn corner and a door hanging at a broken angle.
    if (broken) {
      doorPivot.rotation.y = 1.55;
      const dent = new Mesh(new BoxGeometry(0.3, 0.22, 0.03), rustMaterial);
      dent.position.set(0.18, 0.16, 0.05);
      dent.rotation.set(0, 0, 0.12);
      doorPivot.add(dent);
      const lowerPanel = new Mesh(new BoxGeometry(W * 0.5, 0.18, 0.03), interiorMaterial);
      lowerPanel.position.set(W * 0.3, FLOOR + 0.1, WALL_Z + 0.02);
      station.add(lowerPanel);
      // A loose screw where the hasp was.
      const screw = new Mesh(new CylinderGeometry(0.015, 0.015, 0.05, 5), frameMaterial);
      screw.position.set(W * 0.75, FLOOR + 0.5, hingeZ);
      screw.rotation.z = Math.PI / 2;
      station.add(screw);
    }

    // Room context: a stool and a jar, so the cabinet has something to be mounted on and the
    // player has a reason to be at that height. Dropped in variant 1.
    if (variant !== 1) {
      for (const sx of [-1, 1]) {
        const leg = new Mesh(new BoxGeometry(0.06, 0.44, 0.06), timberMaterial);
        leg.position.set(0.6 + sx * 0.1, 0.28, WALL_Z + 0.42);
        leg.castShadow = true;
        station.add(leg);
      }
      const seat = new Mesh(new BoxGeometry(0.34, 0.05, 0.3), timberMaterial);
      seat.position.set(0.6, 0.52, WALL_Z + 0.42);
      seat.castShadow = true;
      station.add(seat);
      const jar = new Mesh(new ConeGeometry(0.06, 0.12, 6), glassMaterial);
      jar.position.set(0.58, 0.61, WALL_Z + 0.4);
      jar.castShadow = true;
      station.add(jar);
    }

    station.userData.assetId = 'candidate-medical-cabinet';
    return station;
  },
};
