import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Fenced utility yard. Local +Z is the front gate, i.e. the side a player arrives on. The read is a
// central transformer inside a post-and-rail perimeter with busbar gantries, a lattice take-off
// tower, and a small control kiosk. The fence is a visual boundary only; the collider is the
// transformer, so the yard stays walkable ground rather than a sealed box.
// The heavy plant is authored at its natural yard scale and the whole industrial group is scaled
// 1.5x: owner review found the original yard about 50% too small against the 2.1 m scout, so the
// fence now tops 2.4 m and the transformer tank stands 3.6 m. The control kiosk is deliberately
// NOT scaled — a real control building is human-scale next to plant this size, and its door stays
// a 2.0 m door.
const gravelMaterial = new MeshStandardMaterial({
  color: '#797762',
  roughness: 1,
  flatShading: true,
});
gravelMaterial.name = 'yard-gravel';

const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'yard-steel';

const tankMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.75,
  metalness: 0.35,
  flatShading: true,
});
tankMaterial.name = 'yard-tank';

const insulatorMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.35,
  metalness: 0.05,
  flatShading: true,
});
insulatorMaterial.name = 'yard-insulator';

const fenceMaterial = new MeshStandardMaterial({
  color: '#5a5f52',
  roughness: 0.95,
  metalness: 0.1,
  flatShading: true,
});
fenceMaterial.name = 'yard-fence';

const busMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.8,
  metalness: 0.4,
});
busMaterial.name = 'yard-busbar';

const kioskMaterial = new MeshStandardMaterial({
  color: '#aaa18f',
  roughness: 0.95,
  flatShading: true,
});
kioskMaterial.name = 'yard-kiosk';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.85,
  metalness: 0.15,
  flatShading: true,
});
roofMaterial.name = 'yard-roof';

const hazardMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
hazardMaterial.name = 'yard-hazard';

const YARD_W = 15.0;
const YARD_D = 13.0;

function addFenceRun(
  group: Group,
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  broken: boolean,
): void {
  // Post-and-rail perimeter: a rail pair, a mesh-guard strip, and posts at 2 m spacing. The
  // broken run drops its top rail so the fence reads as breached.
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const midX = (x0 + x1) / 2;
  const midZ = (z0 + z1) / 2;

  // 2.5 m post spacing: at play distance the fence reads as a rail line either way, and halving
  // the post count keeps the yard's mesh count in budget.
  const postCount = Math.max(2, Math.round(len / 2.5));
  for (let i = 0; i <= postCount; i++) {
    const t = i / postCount;
    const post = new Mesh(new BoxGeometry(0.12, 1.6, 0.12), steelMaterial);
    post.position.set(x0 + dx * t, 0.8, z0 + dz * t);
    post.rotation.y = -angle;
    post.castShadow = true;
    group.add(post);
  }
  for (const y of [0.5, 1.35]) {
    if (broken && y > 1.0) continue;
    const rail = new Mesh(new BoxGeometry(len, 0.08, 0.06), steelMaterial);
    rail.position.set(midX, y, midZ);
    rail.rotation.y = -angle;
    rail.castShadow = true;
    group.add(rail);
  }
  const guard = new Mesh(new BoxGeometry(len, 0.9, 0.03), fenceMaterial);
  guard.position.set(midX, broken ? 0.72 : 0.92, midZ);
  guard.rotation.y = -angle;
  guard.rotation.z = broken ? 0.035 : 0.0;
  group.add(guard);
  if (broken) {
    // A cut length of guard leaning against the post, which is why the run reads as breached.
    const loose = new Mesh(new BoxGeometry(4.0, 0.9, 0.03), fenceMaterial);
    loose.position.set(x0 + dx * 0.3, 0.66, z0 + dz * 0.3 + 0.3);
    loose.rotation.set(0.2, -angle, 0.08);
    loose.castShadow = true;
    group.add(loose);
  }
}

const UP = new Vector3(0, 1, 0);

function spanTo(from: Vector3, to: Vector3, radius: number): Mesh {
  // A cylinder's axis is +Y, so any member that has to reach an arbitrary point is placed by
  // aiming that axis with a quaternion. Setting rotation.x and rotation.z together with the
  // default XYZ Euler order does not do this: it tips the member close to horizontal, which is
  // what turned the tower legs and the busbar drops into stray bars.
  const dir = new Vector3().subVectors(to, from);
  const len = dir.length();
  const body = new Mesh(new CylinderGeometry(radius, radius, len, 5), steelMaterial);
  body.quaternion.setFromUnitVectors(UP, dir.normalize());
  body.position.copy(from).add(to).multiplyScalar(0.5);
  body.castShadow = true;
  return body;
}

function addInsulatorString(group: Group, x: number, y: number, z: number, drop: number): void {
  // A hanging insulator string: a cap, a stack of four discs, and a bottom shoe. Four discs is
  // enough to read as porcelain at play distance.
  const cap = new Mesh(new CylinderGeometry(0.1, 0.1, 0.08, 6), steelMaterial);
  cap.position.set(x, y, z);
  group.add(cap);
  for (let i = 0; i < 3; i++) {
    const disc = new Mesh(new CylinderGeometry(0.13, 0.11, 0.05, 6), insulatorMaterial);
    disc.position.set(x, y - 0.12 - i * 0.11, z);
    group.add(disc);
  }
  const shoe = new Mesh(new CylinderGeometry(0.07, 0.07, 0.12, 6), steelMaterial);
  shoe.position.set(x, y - drop, z);
  shoe.castShadow = true;
  group.add(shoe);
}

export const electricalSubstation: AuthoredAsset = {
  schemaVersion: 1,
  id: 'electrical-substation',
  name: 'Electrical Substation',
  category: 'landmark',
  dimensions: { x: 22.8, y: 18.6, z: 20.3 },
  collider: {
    center: { x: -2.1, y: 2.48, z: -0.6 },
    size: { x: 9.3, y: 4.95, z: 6.6 },
  },
  interactionPoints: [
    { id: 'substation-kiosk', label: 'Control Kiosk', position: { x: 5.5, y: 0, z: 5.9 } },
  ],
  createVisual(variant = 0) {
    const yard = new Group();
    const breached = variant !== 0;
    const noTower = variant === 2;

    // The scaled plant group: everything industrial is authored in the original yard coordinates
    // and enlarged 1.5x as one unit, so gantries, fence, and transformer stay in registration.
    const plant = new Group();
    plant.scale.setScalar(1.5);
    yard.add(plant);

    // Gravel pad with a concrete plinth under the transformer. Two tones so the yard floor is
    // not one flat value.
    const pad = new Mesh(new BoxGeometry(YARD_W, 0.18, YARD_D), gravelMaterial);
    pad.position.set(0, 0.09, -0.5);
    pad.receiveShadow = true;
    plant.add(pad);
    const apron = new Mesh(new BoxGeometry(8.0, 0.24, 6.0), kioskMaterial);
    apron.position.set(-1.4, 0.12, -0.4);
    apron.receiveShadow = true;
    plant.add(apron);

    // Transformer: tank, ribbed radiator banks on both sides, a conservator drum across the top,
    // three HV bushings, and a bund kerb. This is the readable centre of the yard.
    const bund = new Mesh(new BoxGeometry(5.2, 0.5, 4.0), kioskMaterial);
    bund.position.set(-1.4, 0.35, -0.4);
    bund.castShadow = true;
    bund.receiveShadow = true;
    plant.add(bund);
    const tank = new Mesh(new BoxGeometry(3.2, 2.4, 2.4), tankMaterial);
    tank.position.set(-1.4, 1.8, -0.4);
    tank.castShadow = true;
    tank.receiveShadow = true;
    plant.add(tank);
    const tankTop = new Mesh(new BoxGeometry(3.4, 0.16, 2.6), steelMaterial);
    tankTop.position.set(-1.4, 3.08, -0.4);
    tankTop.castShadow = true;
    plant.add(tankTop);
    for (const sz of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const rib = new Mesh(new BoxGeometry(0.12, 1.7, 0.7), steelMaterial);
        rib.position.set(-2.9 + i * 0.5, 1.7, -0.4 + sz * 1.6);
        rib.castShadow = true;
        plant.add(rib);
      }
    }
    const conservator = new Mesh(new CylinderGeometry(0.4, 0.4, 2.2, 10), tankMaterial);
    conservator.rotation.z = Math.PI / 2;
    conservator.position.set(-1.4, 3.55, -1.1);
    conservator.castShadow = true;
    plant.add(conservator);
    for (const sx of [-1, 1]) {
      const bracket = new Mesh(new BoxGeometry(0.14, 0.5, 0.14), steelMaterial);
      bracket.position.set(-1.4 + sx * 0.9, 3.2, -1.1);
      plant.add(bracket);
    }
    for (let i = 0; i < 3; i++) {
      const bushing = new Mesh(new CylinderGeometry(0.14, 0.2, 1.0, 7), insulatorMaterial);
      bushing.position.set(-2.4 + i * 1.0, 3.66, -0.4 + 0.7);
      bushing.castShadow = true;
      plant.add(bushing);
      for (let d = 0; d < 3; d++) {
        const shed = new Mesh(new CylinderGeometry(0.2, 0.18, 0.06, 7), insulatorMaterial);
        shed.position.set(-2.4 + i * 1.0, 3.4 + d * 0.26, -0.4 + 0.7);
        plant.add(shed);
      }
      addInsulatorString(plant, -2.4 + i * 1.0, 4.16, 0.3, 1.4);
    }
    // Radiator fans and a small valve cabinet on the tank side.
    const valveBox = new Mesh(new BoxGeometry(0.7, 1.0, 0.3), kioskMaterial);
    valveBox.position.set(0.3, 1.6, -1.75);
    valveBox.castShadow = true;
    plant.add(valveBox);
    for (let i = 0; i < 3; i++) {
      const wheel = new Mesh(new TorusGeometry(0.16, 0.04, 5, 8), busMaterial);
      wheel.position.set(-0.0, 1.3 + i * 0.3, -1.92);
      wheel.rotation.x = Math.PI / 2;
      plant.add(wheel);
    }
    const hazardPlate = new Mesh(new BoxGeometry(0.7, 0.5, 0.04), hazardMaterial);
    hazardPlate.position.set(-1.4, 2.2, 0.82);
    plant.add(hazardPlate);

    // Busbar gantry: two lattice columns carrying a cross beam with three suspended conductors.
    for (const sx of [-1, 1]) {
      const colX = -1.4 + sx * 3.7;
      const col = new Mesh(new CylinderGeometry(0.14, 0.2, 7.0, 6), steelMaterial);
      col.position.set(colX, 3.5, 2.4);
      col.castShadow = true;
      plant.add(col);
      const colFoot = new Mesh(new BoxGeometry(0.7, 0.3, 0.7), kioskMaterial);
      colFoot.position.set(colX, 0.3, 2.4);
      colFoot.receiveShadow = true;
      plant.add(colFoot);
      for (let i = 0; i < 3; i++) {
        const brace = new Mesh(new BoxGeometry(0.09, 0.09, 2.2), steelMaterial);
        brace.position.set(colX, 1.2 + i * 2.0, 0.9);
        brace.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.5;
        plant.add(brace);
      }
    }
    const beam = new Mesh(new BoxGeometry(8.0, 0.24, 0.24), steelMaterial);
    beam.position.set(-1.4, 7.1, 2.4);
    beam.castShadow = true;
    plant.add(beam);
    for (let i = 0; i < 3; i++) {
      const x = -1.4 + (i - 1) * 2.3;
      addInsulatorString(plant, x, 6.98, 2.4, 0.7);
      const conductor = new Mesh(new CylinderGeometry(0.04, 0.04, 7.8, 4), busMaterial);
      conductor.rotation.z = Math.PI / 2;
      conductor.position.set(-1.4, 6.28, 2.4);
      conductor.castShadow = true;
      plant.add(conductor);
      // Drop from the gantry conductor down to the transformer bushing top, so the two actually
      // meet instead of hovering near each other.
      const drop = spanTo(new Vector3(x, 6.24, 2.4), new Vector3(x, 4.2, 0.3), 0.04);
      drop.material = busMaterial;
      plant.add(drop);
    }

    // Take-off lattice tower behind the gantry, with three cross-arms. Absent in variant 2.
    if (!noTower) {
      const towerZ = -4.2;
      const towerBase = 1.7;
      const towerTop = 0.5;
      const towerH = 11.0;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          plant.add(
            spanTo(
              new Vector3(sx * towerBase, 0.15, towerZ + sz * towerBase),
              new Vector3(sx * towerTop, towerH, towerZ + sz * towerTop),
              0.1,
            ),
          );
        }
      }
      const TOWER_LEVELS = 4;
      for (let level = 0; level < TOWER_LEVELS; level++) {
        const t = level / TOWER_LEVELS;
        const y = 0.6 + t * (towerH - 1.2);
        const half = towerBase + (towerTop - towerBase) * t;
        for (const sz of [-1, 1]) {
          const bar = new Mesh(new BoxGeometry(half * 2, 0.08, 0.08), steelMaterial);
          bar.position.set(0, y, towerZ + sz * half);
          plant.add(bar);
        }
        for (const sx of [-1, 1]) {
          const bar = new Mesh(new BoxGeometry(0.08, 0.08, half * 2), steelMaterial);
          bar.position.set(sx * half, y, towerZ);
          plant.add(bar);
        }
        if (level < TOWER_LEVELS - 1) {
          const rise = (towerH - 1.2) / TOWER_LEVELS;
          const diagLen = Math.hypot(half * 2, rise);
          for (const sz of [-1, 1]) {
            const diag = new Mesh(new BoxGeometry(0.07, diagLen, 0.07), steelMaterial);
            diag.position.set(0, y + rise / 2, towerZ + sz * (half + 0.18));
            diag.rotation.z = (level % 2 === 0 ? 1 : -1) * Math.atan2(half * 2, rise);
            plant.add(diag);
          }
        }
      }
      for (const [y, half] of [
        [8.2, 1.15],
        [9.4, 0.95],
        [10.4, 0.8],
      ] as const) {
        const arm = new Mesh(new BoxGeometry(half * 2, 0.12, 0.12), steelMaterial);
        arm.position.set(0, y, towerZ);
        arm.castShadow = true;
        plant.add(arm);
        addInsulatorString(plant, half, y - 0.06, towerZ, 0.45);
      }
      const peak = new Mesh(new CylinderGeometry(0.05, 0.07, 1.4, 5), steelMaterial);
      peak.position.set(0, towerH + 0.6, towerZ);
      peak.castShadow = true;
      plant.add(peak);
    }

    // Control kiosk by the gate: a small flat-roofed building with a door, a louvre, and a step.
    // This is the one unscaled part of the yard: at plant scale a control building is still a
    // human-scale box with a 2.0 m door, so it is placed straight into the yard at 1.0x, tucked
    // inside the front-right fence corner clear of the scaled gate swing and the transformer.
    const kiosk = new Mesh(new BoxGeometry(3.0, 2.6, 2.4), kioskMaterial);
    kiosk.position.set(5.5, 1.3, 7.6);
    kiosk.castShadow = true;
    kiosk.receiveShadow = true;
    yard.add(kiosk);
    const kioskRoof = new Mesh(new BoxGeometry(3.4, 0.2, 2.8), roofMaterial);
    kioskRoof.position.set(5.5, 2.7, 7.6);
    kioskRoof.castShadow = true;
    yard.add(kioskRoof);
    const kioskDoor = new Mesh(new BoxGeometry(0.9, 2.0, 0.1), roofMaterial);
    kioskDoor.position.set(5.5, 1.0, 6.44);
    kioskDoor.castShadow = true;
    yard.add(kioskDoor);
    const louvre = new Mesh(new BoxGeometry(1.0, 0.6, 0.08), steelMaterial);
    louvre.position.set(6.5, 1.8, 6.42);
    yard.add(louvre);
    for (let i = 0; i < 4; i++) {
      const blade = new Mesh(new BoxGeometry(1.0, 0.05, 0.12), steelMaterial);
      blade.position.set(6.5, 1.55 + i * 0.15, 6.4);
      blade.rotation.x = 0.35;
      yard.add(blade);
    }
    const step = new Mesh(new BoxGeometry(1.3, 0.18, 0.5), kioskMaterial);
    step.position.set(5.5, 0.09, 6.1);
    step.receiveShadow = true;
    yard.add(step);

    // Perimeter fence, with the front run breached in variants 1 and 2.
    const hw = YARD_W / 2;
    const hd = YARD_D / 2 - 0.5;
    addFenceRun(plant, -hw, -hd - 0.5, hw, -hd - 0.5, false);
    addFenceRun(plant, -hw, -hd - 0.5, -hw, hd, false);
    addFenceRun(plant, hw, -hd - 0.5, hw, hd, false);
    addFenceRun(plant, -hw, hd, hw, hd, breached);
    if (breached) {
      // Gate leaves swung inward off the hinge posts, which is what says the yard is enterable.
      for (const sx of [-1, 1]) {
        const leaf = new Mesh(new BoxGeometry(1.8, 1.7, 0.06), fenceMaterial);
        leaf.position.set(sx * 2.4, 0.9, hd - 0.9);
        leaf.rotation.y = sx * 0.7;
        leaf.castShadow = true;
        plant.add(leaf);
      }
    } else {
      for (const sx of [-1, 1]) {
        const leaf = new Mesh(new BoxGeometry(1.9, 1.7, 0.07), fenceMaterial);
        leaf.position.set(sx * 2.1, 0.9, hd);
        leaf.castShadow = true;
        plant.add(leaf);
        const hinge = new Mesh(new BoxGeometry(0.14, 2.0, 0.14), steelMaterial);
        hinge.position.set(sx * 3.2, 1.0, hd);
        plant.add(hinge);
      }
    }
    // Warning sign on the gate post: the small warm signal the palette allows.
    const sign = new Mesh(new BoxGeometry(0.7, 0.5, 0.04), hazardMaterial);
    sign.position.set(-3.5, 1.9, hd + 0.1);
    sign.rotation.y = 0.15;
    plant.add(sign);
    const signPost = new Mesh(new BoxGeometry(0.1, 2.2, 0.1), steelMaterial);
    signPost.position.set(-3.5, 1.1, hd + 0.1);
    signPost.castShadow = true;
    plant.add(signPost);

    // Ground clutter: a cable drum and two spare bushings, four meshes that stop the apron reading
    // as empty.
    const drum = new Mesh(new CylinderGeometry(0.7, 0.7, 0.9, 10), steelMaterial);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(5.6, 0.86, -2.2);
    drum.castShadow = true;
    plant.add(drum);
    const drumFlange = new Mesh(new CylinderGeometry(0.85, 0.85, 0.08, 10), steelMaterial);
    drumFlange.rotation.z = Math.PI / 2;
    drumFlange.position.set(5.6, 0.86, -2.62);
    plant.add(drumFlange);
    for (let i = 0; i < 2; i++) {
      const spare = new Mesh(new CylinderGeometry(0.2, 0.24, 0.9, 7), insulatorMaterial);
      spare.position.set(2.4 + i * 0.6, 0.52, -3.4);
      spare.rotation.z = 0.2 * (i + 1);
      spare.castShadow = true;
      plant.add(spare);
    }

    yard.userData.assetId = 'candidate-electrical-substation';
    return yard;
  },
};
