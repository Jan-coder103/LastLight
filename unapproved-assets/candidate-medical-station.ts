import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Field medical station: a shipping-container body with a canvas awning over the entrance. Local
// +Z is the container's door end, which carries the clear entrance the idea asks for.
const shellMaterials = [
  new MeshStandardMaterial({ color: '#65766d', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#78908b', roughness: 0.9 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 0.9 }),
];
shellMaterials[0]!.name = 'container-shell-green';
shellMaterials[1]!.name = 'container-shell-pale';
shellMaterials[2]!.name = 'container-shell-grey';

const frameMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.2,
});
frameMaterial.name = 'container-frame';

const canvasMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 1,
  flatShading: true,
});
canvasMaterial.name = 'awning-canvas';

const markingMaterial = new MeshStandardMaterial({ color: '#8e5142', roughness: 0.95 });
markingMaterial.name = 'medical-marking';

const interiorMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const halfW = 1.22;
const H = 2.9;
const halfD = 3.03;
const DOOR_X = 0.5;
const DOOR_W = 1.0;
const DOOR_H = 2.05;

export const candidateMedicalStation: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-medical-station',
  name: 'Field Medical Station',
  category: 'building',
  dimensions: { x: 3.4, y: 3.4, z: 7.8 },
  // The container. This box also covers the clear entrance, so the station is not enterable. That
  // is the most pointed instance of the batch's standing collider problem, because the idea asks
  // for a CLEAR ENTRANCE by name. See the review sheet.
  collider: { center: { x: 0, y: 1.45, z: 0 }, size: { x: 2.6, y: 2.9, z: 6.2 } },
  interactionPoints: [
    { id: 'station-entrance', label: 'Medical Station', position: { x: DOOR_X, y: 0, z: 4.1 } },
  ],
  createVisual(variant = 0) {
    const station = new Group();
    const shellMaterial = shellMaterials[variant % shellMaterials.length]!;
    const awningTorn = variant === 2;
    const marksFaded = variant === 1;

    const base = new Mesh(new BoxGeometry(halfW * 2 + 0.3, 0.24, halfD * 2 + 0.3), frameMaterial);
    base.position.y = 0.12;
    base.receiveShadow = true;
    station.add(base);

    // Floor and back wall, then the two side walls, then the front wall around the doorway.
    const floor = new Mesh(
      new BoxGeometry(halfW * 2 - 0.1, 0.1, halfD * 2 - 0.1),
      interiorMaterial,
    );
    floor.position.y = 0.3;
    station.add(floor);
    const back = new Mesh(new BoxGeometry(halfW * 2, H, 0.12), shellMaterial);
    back.position.set(0, 0.24 + H / 2, -halfD + 0.06);
    back.castShadow = true;
    back.receiveShadow = true;
    station.add(back);
    for (const side of [-1, 1]) {
      const wall = new Mesh(new BoxGeometry(0.12, H, halfD * 2 - 0.12), shellMaterial);
      wall.position.set(side * (halfW - 0.06), 0.24 + H / 2, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      station.add(wall);
      // Three vertical corrugation ribs per side. Six meshes for the whole ribbed read, which is
      // far cheaper than modelling real trapezoidal corrugation and reads the same at any distance
      // this asset will be seen from.
      for (const z of [-2.0, 0, 2.0]) {
        const rib = new Mesh(new BoxGeometry(0.08, H - 0.3, 0.22), shellMaterial);
        rib.position.set(side * (halfW + 0.02), 0.24 + H / 2, z);
        rib.castShadow = true;
        station.add(rib);
      }
    }

    // Front wall built around the doorway, so the entrance is a real void.
    for (const [w, h, x, y] of [
      [DOOR_X - DOOR_W / 2 - -halfW, H, (-halfW + DOOR_X - DOOR_W / 2) / 2, 0.24 + H / 2],
      [halfW - (DOOR_X + DOOR_W / 2), H, (DOOR_X + DOOR_W / 2 + halfW) / 2, 0.24 + H / 2],
      [DOOR_W, H - DOOR_H, DOOR_X, DOOR_H + 0.24 + (H - DOOR_H) / 2],
    ] as const) {
      const seg = new Mesh(new BoxGeometry(w, h, 0.12), shellMaterial);
      seg.position.set(x, y, halfD - 0.06);
      seg.castShadow = true;
      station.add(seg);
    }
    const doorInterior = new Mesh(
      new BoxGeometry(halfW * 2 - 0.3, H - 0.3, 0.06),
      interiorMaterial,
    );
    doorInterior.position.set(0, 0.24 + H / 2, -halfD + 0.15);
    station.add(doorInterior);

    // Corner castings and a roof: the details that make a box read as a shipping container.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const casting = new Mesh(new BoxGeometry(0.3, 0.3, 0.3), frameMaterial);
        casting.position.set(sx * (halfW - 0.1), 0.24 + 0.15, sz * (halfD - 0.1));
        casting.castShadow = true;
        station.add(casting);
      }
    }
    const roof = new Mesh(new BoxGeometry(halfW * 2 + 0.1, 0.12, halfD * 2 + 0.1), shellMaterial);
    roof.position.y = 0.24 + H + 0.06;
    roof.castShadow = true;
    roof.receiveShadow = true;
    station.add(roof);

    // Door swung open against the front face, on a real hinge.
    const doorHinge = new Group();
    doorHinge.position.set(DOOR_X - DOOR_W / 2, 0.24, halfD + 0.04);
    doorHinge.rotation.y = -1.75;
    station.add(doorHinge);
    const door = new Mesh(new BoxGeometry(DOOR_W, DOOR_H, 0.07), frameMaterial);
    door.position.set(DOOR_W / 2, DOOR_H / 2, 0);
    door.castShadow = true;
    doorHinge.add(door);

    // Canvas awning over the entrance, on two poles. "Canvas shelter or container" is satisfied by
    // both, which is why the awning is here rather than the body being canvas.
    const awning = new Mesh(new BoxGeometry(2.4, 0.08, 1.5), canvasMaterial);
    awning.position.set(DOOR_X - 0.1, 2.6, halfD + 0.7);
    awning.rotation.x = 0.22;
    awning.castShadow = true;
    station.add(awning);
    for (const dx of [-1.0, 1.0]) {
      const pole = new Mesh(new BoxGeometry(0.1, 2.3, 0.1), frameMaterial);
      pole.position.set(DOOR_X - 0.1 + dx, 1.15, halfD + 1.35);
      pole.castShadow = true;
      station.add(pole);
    }
    if (awningTorn) {
      // Variant 2: the awning's outer edge has come down and is propped on one pole.
      const flap = new Mesh(new BoxGeometry(1.1, 0.06, 0.9), canvasMaterial);
      flap.position.set(DOOR_X + 0.6, 1.9, halfD + 1.1);
      flap.rotation.set(0.9, 0.2, 0.3);
      flap.castShadow = true;
      station.add(flap);
    }

    // Restrained medical markings: a cross on the front face beside the door, and a small plate
    // over it. The idea says RESTRAINED, so it is the muted rust and two thin bars rather than a
    // bright red cross.
    if (!marksFaded) {
      const crossV = new Mesh(new BoxGeometry(0.16, 0.62, 0.04), markingMaterial);
      crossV.position.set(-0.55, 1.7, halfD + 0.02);
      station.add(crossV);
      const crossH = new Mesh(new BoxGeometry(0.62, 0.16, 0.04), markingMaterial);
      crossH.position.set(-0.55, 1.7, halfD + 0.02);
      station.add(crossH);
    }
    const plate = new Mesh(new BoxGeometry(0.5, 0.3, 0.04), canvasMaterial);
    plate.position.set(DOOR_X, 2.25, halfD + 0.02);
    station.add(plate);

    // Two gas cylinders strapped to the flank, which is the detail that names the object as
    // medical rather than just marked.
    for (let i = 0; i < 2; i++) {
      const bottle = new Mesh(new BoxGeometry(0.28, 1.2, 0.28), frameMaterial);
      bottle.position.set(-halfW - 0.2, 0.24 + 0.6, -1.4 + i * 0.4);
      bottle.castShadow = true;
      station.add(bottle);
    }

    station.userData.assetId = 'candidate-medical-station';
    return station;
  },
};
