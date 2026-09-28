import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Abandoned sawmill. Local +Z is the loading side. The loading bay is a real opening built into
// the front wall, and the logs sit inside it so the shed's single collider also covers them.
const shedMaterials = [
  new MeshStandardMaterial({ color: '#514437', roughness: 1 }),
  new MeshStandardMaterial({ color: '#4b4035', roughness: 1 }),
  new MeshStandardMaterial({ color: '#594332', roughness: 1 }),
];
shedMaterials[0]!.name = 'shed-timber';
shedMaterials[1]!.name = 'shed-timber-dark';
shedMaterials[2]!.name = 'shed-timber-worn';

const roofMaterial = new MeshStandardMaterial({
  color: '#626753',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-sheet';

const interiorMaterial = new MeshStandardMaterial({ color: '#2a251f', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const machineMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.2,
});
machineMaterial.name = 'machine-frame';

const bladeMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.55,
  metalness: 0.35,
});
bladeMaterial.name = 'saw-blade';

const stoneMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
stoneMaterial.name = 'stone-base';

const WIDTH = 14;
const DEPTH = 10;
const WALL_H = 5.0;
const HALF_W = WIDTH / 2;
const HALF_D = DEPTH / 2;
const BAY_X = -1.5;
const BAY_W = 5.0;
const BAY_H = 4.2;
const BAY_LEFT = BAY_X - BAY_W / 2;
const BAY_RIGHT = BAY_X + BAY_W / 2;

export const candidateSawmill: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-sawmill',
  name: 'Abandoned Sawmill',
  category: 'building',
  dimensions: { x: 15.4, y: 8.2, z: 11.8 },
  // The shed body only. The log pile sits inside the bay so it is covered by this, but the saw
  // blade, conveyor, and exhaust stack outside are not solid. Documented in the review sheet.
  collider: { center: { x: 0, y: 2.7, z: 0 }, size: { x: 14, y: 5.4, z: 10 } },
  interactionPoints: [
    { id: 'loading-bay', label: 'Loading Bay', position: { x: BAY_X, y: 0, z: 6.2 } },
  ],
  createVisual(variant = 0) {
    const mill = new Group();
    const shedMaterial = shedMaterials[variant % shedMaterials.length]!;
    const bladeMissing = variant === 2;

    const footing = new Mesh(new BoxGeometry(WIDTH + 0.4, 0.5, DEPTH + 0.4), stoneMaterial);
    footing.position.y = 0.25;
    footing.receiveShadow = true;
    mill.add(footing);

    const floor = new Mesh(new BoxGeometry(WIDTH - 0.6, 0.2, DEPTH - 0.6), interiorMaterial);
    floor.position.y = 0.6;
    mill.add(floor);

    // Back and side walls.
    const backWall = new Mesh(new BoxGeometry(WIDTH, WALL_H, 0.3), shedMaterial);
    backWall.position.set(0, 0.5 + WALL_H / 2, -HALF_D);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    mill.add(backWall);
    for (const sx of [-1, 1]) {
      const sideWall = new Mesh(new BoxGeometry(0.3, WALL_H, DEPTH - 0.3), shedMaterial);
      sideWall.position.set(sx * (HALF_W - 0.15), 0.5 + WALL_H / 2, 0);
      sideWall.castShadow = true;
      sideWall.receiveShadow = true;
      mill.add(sideWall);
    }

    // Front wall built around the loading bay: two piers and a lintel, so the bay is a real hole.
    for (const [x, w] of [
      [(-HALF_W + BAY_LEFT) / 2, BAY_LEFT + HALF_W],
      [(BAY_RIGHT + HALF_W) / 2, HALF_W - BAY_RIGHT],
    ] as const) {
      const pier = new Mesh(new BoxGeometry(w, WALL_H, 0.3), shedMaterial);
      pier.position.set(x, 0.5 + WALL_H / 2, HALF_D);
      pier.castShadow = true;
      pier.receiveShadow = true;
      mill.add(pier);
    }
    const bayLintel = new Mesh(new BoxGeometry(BAY_W, WALL_H - BAY_H, 0.3), shedMaterial);
    bayLintel.position.set(BAY_X, 0.5 + BAY_H + (WALL_H - BAY_H) / 2, HALF_D);
    bayLintel.castShadow = true;
    mill.add(bayLintel);

    // Dark inner faces, so the bay reads as a deep unlit shed rather than a lit tunnel. Looking in
    // from the front you see these roughly 9 m back.
    const innerBack = new Mesh(new BoxGeometry(WIDTH - 0.6, WALL_H - 0.4, 0.06), interiorMaterial);
    innerBack.position.set(0, 0.5 + WALL_H / 2, -HALF_D + 0.18);
    mill.add(innerBack);
    for (const sx of [-1, 1]) {
      const innerSide = new Mesh(
        new BoxGeometry(0.06, WALL_H - 0.4, DEPTH - 0.6),
        interiorMaterial,
      );
      innerSide.position.set(sx * (HALF_W - 0.33), 0.5 + WALL_H / 2, 0);
      mill.add(innerSide);
    }

    // Broad flat roof with a deep overhang. A flat industrial roof is the right read for a
    // sawmill and avoids a gable, which would need a triangular mesh like the row house.
    const roof = new Mesh(new BoxGeometry(WIDTH + 1.2, 0.36, DEPTH + 1.6), roofMaterial);
    roof.position.set(0, 0.5 + WALL_H + 0.18, 0.3);
    roof.castShadow = true;
    roof.receiveShadow = true;
    mill.add(roof);
    const fascia = new Mesh(new BoxGeometry(WIDTH + 1.2, 0.42, 0.16), roofMaterial);
    fascia.position.set(0, 0.5 + WALL_H + 0.02, HALF_D + 0.72);
    fascia.castShadow = true;
    mill.add(fascia);

    // Log pile inside the bay, visible through the opening and covered by the shed collider.
    // This pairs with candidate-timber-stacks, which is the same idea as a placeable prop.
    for (let i = 0; i < 4; i++) {
      const log = new Mesh(new CylinderGeometry(0.24, 0.24, 4.0, 6), shedMaterial);
      log.position.set(BAY_X, 0.9 + i * 0.44, 2.6);
      log.rotation.x = Math.PI / 2;
      log.castShadow = true;
      mill.add(log);
    }
    for (let i = 0; i < 3; i++) {
      const log = new Mesh(new CylinderGeometry(0.24, 0.24, 3.2, 6), shedMaterial);
      log.position.set(BAY_X, 2.7, 1.4 + i * 0.46);
      log.rotation.x = Math.PI / 2;
      log.castShadow = true;
      mill.add(log);
    }

    // Exterior machinery. A band saw on a frame beside the bay, a conveyor stub feeding the bay,
    // and an exhaust stack through the roof.
    if (!bladeMissing) {
      const blade = new Mesh(new CylinderGeometry(0.62, 0.62, 0.06, 10), bladeMaterial);
      blade.position.set(3.4, 1.5, HALF_D + 0.55);
      blade.rotation.y = Math.PI / 2;
      blade.castShadow = true;
      mill.add(blade);
    }
    const sawFrame = new Mesh(new BoxGeometry(0.18, 1.6, 0.9), machineMaterial);
    sawFrame.position.set(3.4, 0.8, HALF_D + 0.55);
    sawFrame.castShadow = true;
    mill.add(sawFrame);

    const conveyor = new Mesh(new BoxGeometry(1.5, 0.16, 5.2), machineMaterial);
    conveyor.position.set(5.6, 1.6, HALF_D - 1.4);
    conveyor.rotation.x = -0.3;
    conveyor.castShadow = true;
    mill.add(conveyor);
    for (const z of [HALF_D - 3.4, HALF_D + 0.6]) {
      const leg = new Mesh(new BoxGeometry(0.16, 2.6, 0.16), machineMaterial);
      leg.position.set(5.6, 1.3, z);
      leg.castShadow = true;
      mill.add(leg);
    }

    const stack = new Mesh(new CylinderGeometry(0.3, 0.34, 2.6, 8), machineMaterial);
    stack.position.set(-5.2, 0.5 + WALL_H + 1.1, -2.2);
    stack.castShadow = true;
    mill.add(stack);
    const stackCap = new Mesh(new CylinderGeometry(0.42, 0.42, 0.16, 8), machineMaterial);
    stackCap.position.set(-5.2, 0.5 + WALL_H + 2.45, -2.2);
    mill.add(stackCap);

    mill.userData.assetId = 'candidate-sawmill';
    return mill;
  },
};
