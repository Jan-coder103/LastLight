import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Vehicle maintenance bay. Open at the DRIVE-IN end (+Z) and along BOTH SIDES, closed at the back
// (-Z) where the tool cabinet and tyre stack stand. Local +Z is the drive-in end.
const steelMaterials = [
  new MeshStandardMaterial({ color: '#59635b', roughness: 0.85, metalness: 0.25 }),
  new MeshStandardMaterial({ color: '#54594d', roughness: 0.85, metalness: 0.25 }),
  new MeshStandardMaterial({ color: '#64675d', roughness: 0.85, metalness: 0.25 }),
];
steelMaterials[0]!.name = 'bay-steel-green';
steelMaterials[1]!.name = 'bay-steel-olive';
steelMaterials[2]!.name = 'bay-steel-grey';

const roofMaterial = new MeshStandardMaterial({
  color: '#626753',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'roof-sheet';

const floorMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
floorMaterial.name = 'floor-concrete';

const cabinetMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.2,
});
cabinetMaterial.name = 'tool-cabinet';

const tyreMaterial = new MeshStandardMaterial({ color: '#2b2724', roughness: 1 });
tyreMaterial.name = 'spare-tyre';

const rustMaterial = new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9 });
rustMaterial.name = 'rust-metal';

const BAY_H = 4.3;
const HALF_W = 3.0;
const HALF_D = 4.0;

export const candidateMaintenanceBay: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-maintenance-bay',
  name: 'Vehicle Maintenance Bay',
  category: 'prop',
  dimensions: { x: 6.8, y: 4.9, z: 8.8 },
  // The back third only, so the drive-through space stays open. The lift posts are inside that
  // footprint. See the review sheet.
  collider: { center: { x: 0, y: 1.4, z: -2.1 }, size: { x: 5.4, y: 2.8, z: 3.8 } },
  interactionPoints: [
    { id: 'tool-cabinet', label: 'Tool Cabinet', position: { x: -2.1, y: 0, z: -3.5 } },
  ],
  createVisual(variant = 0) {
    const bay = new Group();
    const steelMaterial = steelMaterials[variant % steelMaterials.length]!;
    // Lift arm height is the state axis: raised, lowered, and a collapsed frame.
    const armY = [0.95, 0.3, 0.15][variant % 3]!;
    const collapsed = variant === 2;

    const slab = new Mesh(new BoxGeometry(HALF_W * 2 + 0.5, 0.3, HALF_D * 2 + 0.5), floorMaterial);
    slab.position.y = 0.15;
    slab.receiveShadow = true;
    bay.add(slab);

    // Back wall and roof. No side walls and no front wall: the bay is open at both ends and both
    // sides, which is what makes it a service shelter rather than a shed.
    const back = new Mesh(new BoxGeometry(HALF_W * 2, BAY_H, 0.3), steelMaterial);
    back.position.set(0, 0.3 + BAY_H / 2, -HALF_D);
    back.castShadow = true;
    back.receiveShadow = true;
    bay.add(back);
    const roof = new Mesh(new BoxGeometry(HALF_W * 2 + 0.7, 0.18, HALF_D * 2 + 0.6), roofMaterial);
    roof.position.set(0, 0.3 + BAY_H + 0.09, 0.1);
    roof.castShadow = true;
    roof.receiveShadow = true;
    bay.add(roof);
    for (const x of [-HALF_W, HALF_W]) {
      for (const z of [-HALF_D, HALF_D - 0.3]) {
        const post = new Mesh(new BoxGeometry(0.22, BAY_H, 0.22), steelMaterial);
        post.position.set(x, 0.3 + BAY_H / 2, z);
        post.castShadow = true;
        bay.add(post);
      }
      const beam = new Mesh(new BoxGeometry(0.2, 0.26, HALF_D * 2), steelMaterial);
      beam.position.set(x, 0.3 + BAY_H - 0.2, 0);
      beam.castShadow = true;
      bay.add(beam);
    }

    // Two-post lift: columns, base plates, and two arms each. Arm height is the variant axis.
    for (const side of [-1, 1]) {
      const column = new Mesh(new BoxGeometry(0.4, 3.4, 0.4), steelMaterial);
      column.position.set(side * 1.9, 0.3 + 1.7, 0.4);
      column.castShadow = true;
      bay.add(column);
      const base = new Mesh(new BoxGeometry(0.8, 0.16, 0.8), steelMaterial);
      base.position.set(side * 1.9, 0.38, 0.4);
      base.receiveShadow = true;
      bay.add(base);
      for (const z of [-0.7, 1.5]) {
        const arm = new Mesh(new BoxGeometry(1.5, 0.16, 0.22), steelMaterial);
        arm.position.set(side * 1.2, 0.3 + armY, z);
        arm.rotation.z = collapsed ? side * 0.5 : 0;
        arm.castShadow = true;
        bay.add(arm);
      }
      if (collapsed) {
        const fallen = new Mesh(new BoxGeometry(0.9, 0.14, 0.2), rustMaterial);
        fallen.position.set(side * 0.9, 0.38, 2.4);
        fallen.rotation.y = side * 0.7;
        fallen.castShadow = true;
        bay.add(fallen);
      }
    }
    // Drive-on plates between the columns, so the lift reads as usable.
    for (const z of [-0.4, 1.2]) {
      const plate = new Mesh(new BoxGeometry(3.2, 0.06, 0.9), steelMaterial);
      plate.position.set(0, 0.33, z);
      plate.receiveShadow = true;
      bay.add(plate);
    }

    // Tool cabinet against the back wall: carcass, four drawer fronts, and a handle rail.
    const cabinet = new Mesh(new BoxGeometry(1.1, 2.0, 0.65), cabinetMaterial);
    cabinet.position.set(-2.1, 0.3 + 1.0, -3.4);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    bay.add(cabinet);
    for (let i = 0; i < 4; i++) {
      const drawer = new Mesh(new BoxGeometry(1.0, 0.4, 0.05), steelMaterial);
      drawer.position.set(-2.1, 0.55 + i * 0.47, -3.05);
      bay.add(drawer);
      const handle = new Mesh(new BoxGeometry(0.7, 0.05, 0.05), steelMaterial);
      handle.position.set(-2.1, 0.55 + i * 0.47, -3.0);
      bay.add(handle);
    }

    // Spare tyre stack: two columns of two, leaning against the back wall beside the cabinet.
    for (let i = 0; i < 4; i++) {
      const tyre = new Mesh(new CylinderGeometry(0.44, 0.44, 0.24, 12), tyreMaterial);
      const col = i % 2;
      const row = Math.floor(i / 2);
      tyre.position.set(1.6 + col * 0.5, 0.55 + row * 0.42, -3.5);
      tyre.rotation.x = Math.PI / 2;
      tyre.castShadow = true;
      bay.add(tyre);
    }
    // A fifth tyre on its face against the wall, which breaks the stack's regularity.
    const loose = new Mesh(new CylinderGeometry(0.44, 0.44, 0.24, 12), tyreMaterial);
    loose.position.set(2.7, 0.72, -3.6);
    loose.rotation.set(0.2, 0, 1.5);
    loose.castShadow = true;
    bay.add(loose);

    // A workbench and a coiled hose, the two things that make a bay look used.
    const bench = new Mesh(new BoxGeometry(1.6, 0.1, 0.7), steelMaterial);
    bench.position.set(2.2, 0.3 + 0.9, -1.4);
    bench.castShadow = true;
    bay.add(bench);
    for (const dx of [-0.65, 0.65]) {
      const leg = new Mesh(new BoxGeometry(0.1, 0.9, 0.6), steelMaterial);
      leg.position.set(2.2 + dx, 0.3 + 0.45, -1.4);
      bay.add(leg);
    }
    const hose = new Mesh(new CylinderGeometry(0.3, 0.3, 0.14, 12), tyreMaterial);
    hose.position.set(-2.6, 0.37, -1.0);
    hose.castShadow = true;
    bay.add(hose);

    bay.userData.assetId = 'candidate-maintenance-bay';
    return bay;
  },
};
