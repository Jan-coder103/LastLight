import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Farm grain silo. The idea names three features explicitly — cone roof, ladder, attached utility
// shed — and all three are modelled, including the ladder.
const siloMaterials = [
  new MeshStandardMaterial({ color: '#8b887d', roughness: 0.85, metalness: 0.15 }),
  new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9, metalness: 0.15 }),
  new MeshStandardMaterial({ color: '#58624d', roughness: 0.9, metalness: 0.15 }),
];
siloMaterials[0]!.name = 'silo-galvanised';
siloMaterials[1]!.name = 'silo-rusted';
siloMaterials[2]!.name = 'silo-olive';

const bandMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.82,
  metalness: 0.25,
});
bandMaterial.name = 'silo-band';

const ladderMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.2,
});
ladderMaterial.name = 'ladder-steel';

const shedMaterial = new MeshStandardMaterial({ color: '#514437', roughness: 1 });
shedMaterial.name = 'shed-timber';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-dark';

const concreteMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
concreteMaterial.name = 'concrete-base';

const interiorMaterial = new MeshStandardMaterial({ color: '#2a251f', roughness: 1 });
interiorMaterial.name = 'interior-dark';

const SILO_R = 2.25;
const SILO_H = 11;
const CONE_H = 2.2;
// Silo axis is 1.6 m left of the origin so the combined silhouette (silo plus attached shed) is
// centred on x = 0. Documented in the review sheet.
const SILO_X = -1.6;
const SHED_X = 2.25;
const SHED_W = 3.2;
const SHED_D = 2.6;
const SHED_H = 2.6;
const LADDER_X = SILO_X - SILO_R - 0.28;

export const candidateGrainSilo: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-grain-silo',
  name: 'Farm Grain Silo',
  category: 'landmark',
  dimensions: { x: 8.5, y: 14.0, z: 6.6 },
  // The silo body only. A single box cannot describe the silo AND the attached shed without
  // blocking a phantom 8 m wall beside it, so the shed is not solid. See the review sheet.
  collider: { center: { x: SILO_X, y: 5.5, z: 0 }, size: { x: 4.6, y: 11, z: 4.6 } },
  interactionPoints: [
    { id: 'silo-ladder', label: 'Silo Ladder', position: { x: LADDER_X, y: 0, z: 0.4 } },
  ],
  createVisual(variant = 0) {
    const silo = new Group();
    const siloMaterial = siloMaterials[variant % siloMaterials.length]!;
    const ladderMissing = variant === 2;

    // Concrete ring base, slightly wider than the body.
    const base = new Mesh(
      new CylinderGeometry(SILO_R + 0.2, SILO_R + 0.32, 0.4, 12),
      concreteMaterial,
    );
    base.position.set(SILO_X, 0.2, 0);
    base.receiveShadow = true;
    silo.add(base);

    const body = new Mesh(new CylinderGeometry(SILO_R, SILO_R, SILO_H, 12), siloMaterial);
    body.position.set(SILO_X, 0.4 + SILO_H / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    silo.add(body);

    // Hoop bands. Two of them, at the thirds, plus a wider one at the base.
    for (const y of [3.4, 7.2]) {
      const band = new Mesh(
        new CylinderGeometry(SILO_R + 0.06, SILO_R + 0.06, 0.16, 12),
        bandMaterial,
      );
      band.position.set(SILO_X, y, 0);
      silo.add(band);
    }

    // Cone roof, overhanging slightly, with a small vent cap.
    const cone = new Mesh(new CylinderGeometry(0.4, SILO_R + 0.22, CONE_H, 12), siloMaterial);
    cone.position.set(SILO_X, 0.4 + SILO_H + CONE_H / 2, 0);
    cone.castShadow = true;
    silo.add(cone);
    const vent = new Mesh(new CylinderGeometry(0.3, 0.3, 0.4, 8), bandMaterial);
    vent.position.set(SILO_X, 0.4 + SILO_H + CONE_H + 0.1, 0);
    vent.castShadow = true;
    silo.add(vent);

    // Access ladder on the -X face, from grade to the top of the body. Rung spacing is 0.85 m,
    // which is much wider than a real ladder's 0.3 m: 14 rungs at true spacing would be 40+ meshes
    // of thin geometry. Documented in the review sheet as indicative.
    if (!ladderMissing) {
      for (const z of [-0.28, 0.28]) {
        const rail = new Mesh(new BoxGeometry(0.07, SILO_H + 0.5, 0.07), ladderMaterial);
        rail.position.set(LADDER_X, (SILO_H + 0.5) / 2, z);
        rail.castShadow = true;
        silo.add(rail);
      }
      for (let i = 0; i < 14; i++) {
        const rung = new Mesh(new BoxGeometry(0.07, 0.06, 0.56), ladderMaterial);
        rung.position.set(LADDER_X, 0.7 + i * 0.85, 0);
        silo.add(rung);
      }
      // Three safety-cage hoops, the detail that makes a silo ladder read as a silo ladder.
      for (const y of [4.0, 7.4, 10.6]) {
        const hoop = new Mesh(new CylinderGeometry(0.42, 0.42, 0.07, 8, 1, true), ladderMaterial);
        hoop.position.set(LADDER_X - 0.18, y, 0);
        hoop.rotation.z = Math.PI / 2;
        silo.add(hoop);
      }
    }

    // Attached utility shed on the +X side, with a real doorway and a dark interior behind it.
    const shedFloor = new Mesh(new BoxGeometry(SHED_W, 0.2, SHED_D), interiorMaterial);
    shedFloor.position.set(SHED_X, 0.1, 0);
    silo.add(shedFloor);

    const DOOR_W = 1.0;
    const DOOR_H = 2.1;
    // Front wall of the shed built as two piers and a lintel around the doorway.
    for (const [x, w] of [
      [SHED_X - (SHED_W - DOOR_W) / 4 - DOOR_W / 4, (SHED_W - DOOR_W) / 2],
      [SHED_X + (SHED_W - DOOR_W) / 4 + DOOR_W / 4, (SHED_W - DOOR_W) / 2],
    ] as const) {
      const pier = new Mesh(new BoxGeometry(w, SHED_H, 0.18), shedMaterial);
      pier.position.set(x, SHED_H / 2, SHED_D / 2);
      pier.castShadow = true;
      silo.add(pier);
    }
    const shedLintel = new Mesh(new BoxGeometry(DOOR_W, SHED_H - DOOR_H, 0.18), shedMaterial);
    shedLintel.position.set(SHED_X, DOOR_H + (SHED_H - DOOR_H) / 2, SHED_D / 2);
    shedLintel.castShadow = true;
    silo.add(shedLintel);
    // Dark interior panel at the back of the shed, so the doorway shows depth rather than a face.
    const shedBack = new Mesh(new BoxGeometry(SHED_W - 0.3, SHED_H - 0.2, 0.06), interiorMaterial);
    shedBack.position.set(SHED_X, SHED_H / 2, -SHED_D / 2 + 0.12);
    silo.add(shedBack);
    for (const sx of [-1, 1]) {
      const side = new Mesh(new BoxGeometry(0.18, SHED_H, SHED_D), shedMaterial);
      side.position.set(SHED_X + (sx * (SHED_W - 0.18)) / 2, SHED_H / 2, 0);
      side.castShadow = true;
      silo.add(side);
    }
    const shedRoof = new Mesh(new BoxGeometry(SHED_W + 0.4, 0.16, SHED_D + 0.4), roofMaterial);
    shedRoof.position.set(SHED_X, SHED_H + 0.08, 0);
    shedRoof.castShadow = true;
    silo.add(shedRoof);

    // Discharge chute at the base of the silo, angled down toward +Z. A real silo has one and it
    // is what stops the cylinder reading as a plain tank.
    const chute = new Mesh(new BoxGeometry(0.9, 0.9, 2.2), bandMaterial);
    chute.position.set(SILO_X, 0.95, SILO_R + 0.5);
    chute.rotation.x = 0.45;
    chute.castShadow = true;
    silo.add(chute);

    silo.userData.assetId = 'candidate-grain-silo';
    return silo;
  },
};
