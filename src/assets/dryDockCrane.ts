import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Shipyard gantry crane silhouette. Local +Z is the direction the trolley and hook travel out over
// the dock. A harbour gantry carries its boom above the rail deck, so the landmark read is a tall
// portal with a cantilevered arm, a cab, and a hanging hook block. The legs are open lattice and
// the portal is wide, so the collider is two thin piers plus a low kerb rather than one slab.
const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.25,
  flatShading: true,
});
steelMaterial.name = 'crane-steel';

const paintMaterial = new MeshStandardMaterial({
  color: '#8a5645',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
paintMaterial.name = 'crane-paint';

const deckMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.95,
  flatShading: true,
});
deckMaterial.name = 'crane-deck';

const cableMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.8,
  metalness: 0.4,
});
cableMaterial.name = 'crane-cable';

const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.25,
  metalness: 0.1,
});
glassMaterial.name = 'crane-glass';

const counterMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  metalness: 0.1,
  flatShading: true,
});
counterMaterial.name = 'crane-counterweight';

const GIRDER_Y = 17.2;
const GIRDER_Z = 3.0;
const APEX_RISE = 6.0;
const SPAN = 15.0;
const BOOM_OUT = 12.0;
const BOOM_BACK = 5.0;
const LEG_INSET = 1.4;
const RAIL_X = 6.2;

const LATTICE_HALF = 0.55;

function addLattice(group: Group, length: number, y: number, z: number, count: number): void {
  // Lattice run along Z: four chords (two above, two below, offset either side in X) and a
  // zig-zag web of diagonals between them. At crane scale that reads as open truss work.
  for (const sy of [-1, 1]) {
    for (const sx of [-1, 1]) {
      const chord = new Mesh(new BoxGeometry(0.16, 0.16, length), steelMaterial);
      chord.position.set(sx * LATTICE_HALF, y + sy * LATTICE_HALF, z);
      chord.castShadow = true;
      group.add(chord);
    }
  }
  const bay = length / count;
  const webLen = Math.hypot(bay, LATTICE_HALF * 2);
  for (let i = 0; i < count; i++) {
    const t = z - length / 2 + (i + 0.5) * bay;
    for (const sx of [-1, 1]) {
      const diag = new Mesh(new BoxGeometry(0.1, webLen, 0.1), steelMaterial);
      diag.position.set(sx * LATTICE_HALF, y, t);
      diag.rotation.x = Math.atan2(LATTICE_HALF * 2 * (i % 2 === 0 ? 1 : -1), bay);
      group.add(diag);
    }
  }
}

function addLeg(group: Group, x: number, z: number): void {
  // Four-corner tapered leg with a cross brace at two levels: a chunky A-frame rather than a
  // single stick, so the piers read as built structure.
  const leg = new Mesh(new CylinderGeometry(0.34, 0.5, GIRDER_Y - 0.6, 6), steelMaterial);
  leg.position.set(x, (GIRDER_Y - 0.6) / 2, z);
  leg.castShadow = true;
  group.add(leg);
  for (const y of [4.6, 9.4]) {
    const brace = new Mesh(new BoxGeometry(1.3, 0.2, 0.2), steelMaterial);
    brace.position.set(x, y, z);
    brace.castShadow = true;
    group.add(brace);
  }
  const foot = new Mesh(new BoxGeometry(1.5, 0.5, 1.5), deckMaterial);
  foot.position.set(x, 0.25, z);
  foot.castShadow = true;
  foot.receiveShadow = true;
  group.add(foot);
  // Bogie: two wheels under the foot, which is what makes the pier read as running on rails.
  for (const sx of [-1, 1]) {
    const wheel = new Mesh(new CylinderGeometry(0.34, 0.34, 0.22, 8), steelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x + sx * 0.5, 0.34, z);
    wheel.castShadow = true;
    group.add(wheel);
  }
  const sill = new Mesh(new BoxGeometry(1.7, 0.18, 0.5), steelMaterial);
  sill.position.set(x, 0.55, z);
  group.add(sill);
}

export const dryDockCrane: AuthoredAsset = {
  schemaVersion: 1,
  id: 'dry-dock-crane',
  name: 'Dry Dock Crane',
  category: 'landmark',
  dimensions: { x: 15.0, y: 23.4, z: 25.1 },
  collider: { center: { x: 0, y: 8.6, z: -0.4 }, size: { x: 13.8, y: 17.2, z: 3.0 } },
  interactionPoints: [{ id: 'crane-pier', label: 'Crane Pier', position: { x: 0, y: 0, z: 2.4 } }],
  createVisual(variant = 0) {
    const crane = new Group();
    const brokenBoom = variant === 2;
    const cabTilt = variant === 1;
    const trolleyZ = variant === 1 ? 7.0 : 11.0;

    // Two rail-mounted piers.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addLeg(crane, sx * RAIL_X, sz * LEG_INSET);
      }
      // Sill beam and rail head run the length of each pier, in Z.
      const sill = new Mesh(new BoxGeometry(0.3, 0.3, LEG_INSET * 2 + 0.6), steelMaterial);
      sill.position.set(sx * RAIL_X, 1.0, 0);
      sill.castShadow = true;
      crane.add(sill);
      const rail = new Mesh(new BoxGeometry(0.24, 0.12, LEG_INSET * 2 + 1.2), steelMaterial);
      rail.position.set(sx * RAIL_X, 0.06, 0);
      rail.receiveShadow = true;
      crane.add(rail);
    }

    // Portal tie beams across the span at the leg tops.
    for (const sz of [-1, 1]) {
      const tie = new Mesh(new BoxGeometry(SPAN, 0.34, 0.34), steelMaterial);
      tie.position.set(0, GIRDER_Y - 0.9, sz * LEG_INSET);
      tie.castShadow = true;
      crane.add(tie);
    }

    // Main girder: a lattice run along Z, over the portal, with the boom cantilevering forward.
    addLattice(crane, 8.0, GIRDER_Y, GIRDER_Z, 6);
    if (!brokenBoom) {
      addLattice(crane, BOOM_OUT, GIRDER_Y, GIRDER_Z + 4.0 + BOOM_OUT / 2, 7);
      addLattice(crane, BOOM_BACK, GIRDER_Y, GIRDER_Z - 4.0 - BOOM_BACK / 2, 4);
    } else {
      // Variant 2: the boom sheared off short of the tip, and the torn stub left standing.
      addLattice(crane, 5.0, GIRDER_Y, GIRDER_Z + 4.0 + 2.5, 4);
      const stub = new Mesh(new BoxGeometry(0.4, 0.9, 0.5), paintMaterial);
      stub.position.set(0, GIRDER_Y + 0.3, GIRDER_Z + 6.5);
      stub.rotation.x = 0.2;
      stub.castShadow = true;
      crane.add(stub);
    }

    // Girder top chord cap and a walkway rail so the arm is not a bare line.
    const cap = new Mesh(new BoxGeometry(0.34, 0.16, 8.0), steelMaterial);
    cap.position.set(0, GIRDER_Y + 0.63, GIRDER_Z);
    cap.castShadow = true;
    crane.add(cap);
    const walk = new Mesh(new BoxGeometry(1.0, 0.08, 8.0), deckMaterial);
    walk.position.set(-0.9, GIRDER_Y - 0.55, GIRDER_Z);
    walk.receiveShadow = true;
    crane.add(walk);
    for (const sz of [-1, 0, 1]) {
      const stanchion = new Mesh(new BoxGeometry(0.07, 0.9, 0.07), steelMaterial);
      stanchion.position.set(-1.35, GIRDER_Y - 0.1, GIRDER_Z + sz * 3.4);
      crane.add(stanchion);
    }
    const handrail = new Mesh(new BoxGeometry(0.07, 0.07, 7.4), steelMaterial);
    handrail.position.set(-1.35, GIRDER_Y + 0.35, GIRDER_Z);
    crane.add(handrail);

    // A-frame king post above the girder, with tie stays running to the boom tip and the back
    // reach. This triangle is the whole reason the silhouette reads as a crane.
    const apexY = GIRDER_Y + APEX_RISE;
    for (const sx of [-1, 1]) {
      const post = new Mesh(new CylinderGeometry(0.12, 0.16, 6.2, 5), steelMaterial);
      post.position.set(sx * 0.9, GIRDER_Y + 3.1, GIRDER_Z);
      post.castShadow = true;
      crane.add(post);
    }
    const apexBar = new Mesh(new BoxGeometry(1.8, 0.18, 0.18), steelMaterial);
    apexBar.position.set(0, apexY - 0.1, GIRDER_Z);
    crane.add(apexBar);

    // Tie stays. A cylinder points along +Y, so a stay from the apex down to the boom tip is a
    // Y-axis cylinder rotated by atan2(runZ, runY) with a negative runY.
    const tipZ = brokenBoom ? GIRDER_Z + 7.0 : GIRDER_Z + 4.0 + BOOM_OUT;
    const backZ = GIRDER_Z - 4.0 - BOOM_BACK;
    for (const sx of [-1, 1]) {
      const fwdRun = tipZ - GIRDER_Z;
      const fwdLen = Math.hypot(fwdRun, APEX_RISE);
      const stay = new Mesh(new CylinderGeometry(0.05, 0.05, fwdLen, 4), cableMaterial);
      stay.position.set(sx * 0.8, (apexY + GIRDER_Y) / 2, (GIRDER_Z + tipZ) / 2);
      stay.rotation.x = Math.atan2(fwdRun, -APEX_RISE);
      crane.add(stay);
      const backRun = GIRDER_Z - backZ;
      const backLen = Math.hypot(backRun, APEX_RISE);
      const back = new Mesh(new CylinderGeometry(0.05, 0.05, backLen, 4), cableMaterial);
      back.position.set(sx * 0.8, (apexY + GIRDER_Y) / 2, (GIRDER_Z + backZ) / 2);
      back.rotation.x = Math.atan2(-backRun, -APEX_RISE);
      crane.add(back);
    }

    // Counterweight slung under the back reach: the mass that explains why the boom is short.
    if (!brokenBoom) {
      const cw = new Mesh(new BoxGeometry(2.4, 1.4, 2.6), counterMaterial);
      cw.position.set(0, GIRDER_Y - 1.3, backZ + 1.3);
      cw.castShadow = true;
      crane.add(cw);
      const cwBand = new Mesh(new BoxGeometry(2.5, 0.16, 0.2), paintMaterial);
      cwBand.position.set(0, GIRDER_Y - 1.3, cw.position.z);
      crane.add(cwBand);
      for (const sx of [-1, 1]) {
        const hanger = new Mesh(new BoxGeometry(0.14, 0.9, 0.14), steelMaterial);
        hanger.position.set(sx * 0.9, GIRDER_Y - 0.5, cw.position.z);
        crane.add(hanger);
      }
    }

    // Machinery house on the back reach, painted the faded crane colour.
    const house = new Mesh(new BoxGeometry(2.6, 1.9, 3.0), paintMaterial);
    house.position.set(0, GIRDER_Y + 1.1, GIRDER_Z - 4.0);
    house.castShadow = true;
    crane.add(house);
    const houseRoof = new Mesh(new BoxGeometry(2.9, 0.16, 3.3), steelMaterial);
    houseRoof.position.set(0, GIRDER_Y + 2.13, GIRDER_Z - 4.0);
    houseRoof.castShadow = true;
    crane.add(houseRoof);
    const vent = new Mesh(new CylinderGeometry(0.22, 0.26, 0.5, 6), steelMaterial);
    vent.position.set(0.7, GIRDER_Y + 2.4, GIRDER_Z - 5.2);
    vent.castShadow = true;
    crane.add(vent);

    // Trolley and operator cab slung under the boom, cab window forward.
    const trolley = new Mesh(new BoxGeometry(1.5, 0.6, 1.5), steelMaterial);
    trolley.position.set(0, GIRDER_Y - 0.9, trolleyZ);
    trolley.castShadow = true;
    crane.add(trolley);
    const cab = new Mesh(new BoxGeometry(1.4, 1.5, 1.6), paintMaterial);
    cab.position.set(0.95, GIRDER_Y - 2.0, trolleyZ);
    cab.rotation.z = cabTilt ? 0.12 : 0.0;
    cab.castShadow = true;
    crane.add(cab);
    const cabGlass = new Mesh(new BoxGeometry(1.2, 0.9, 0.08), glassMaterial);
    cabGlass.position.set(0.95, GIRDER_Y - 1.75, trolleyZ + 0.82);
    cabGlass.rotation.z = cabTilt ? 0.12 : 0.0;
    crane.add(cabGlass);
    const cabBracket = new Mesh(new BoxGeometry(0.5, 0.12, 0.12), steelMaterial);
    cabBracket.position.set(0.6, GIRDER_Y - 1.2, trolleyZ);
    crane.add(cabBracket);

    // Hook block on two falls of cable. Block length is variant-dependent so the hook hangs at a
    // different height in each build rather than always mid-air.
    const hookDrop = variant === 1 ? 7.5 : 5.2;
    for (const sx of [-1, 1]) {
      const fall = new Mesh(new CylinderGeometry(0.035, 0.035, hookDrop, 4), cableMaterial);
      fall.position.set(sx * 0.22, GIRDER_Y - 1.2 - hookDrop / 2, trolleyZ);
      crane.add(fall);
    }
    const block = new Mesh(new BoxGeometry(0.9, 0.6, 0.5), steelMaterial);
    block.position.set(0, GIRDER_Y - 1.2 - hookDrop - 0.3, trolleyZ);
    block.castShadow = true;
    crane.add(block);
    const sheave = new Mesh(new TorusGeometry(0.22, 0.06, 5, 10), steelMaterial);
    sheave.position.set(0, GIRDER_Y - 1.2 - hookDrop - 0.3, trolleyZ);
    sheave.rotation.y = Math.PI / 2;
    crane.add(sheave);
    const hook = new Mesh(new CylinderGeometry(0.07, 0.07, 0.5, 5), steelMaterial);
    hook.position.set(0, GIRDER_Y - 1.75 - hookDrop, trolleyZ);
    hook.castShadow = true;
    crane.add(hook);
    const hookTip = new Mesh(new BoxGeometry(0.12, 0.3, 0.12), steelMaterial);
    hookTip.position.set(0.12, GIRDER_Y - 1.95 - hookDrop, trolleyZ);
    hookTip.rotation.z = -0.7;
    crane.add(hookTip);

    // Hazard markers: two short warm patches on the front sill, one per pier. A single band the
    // full width of the portal read as a red stripe 14 m long; two 1.6 m markers are the small
    // functional signal the palette actually allows.
    for (const sx of [-1, 1]) {
      const band = new Mesh(new BoxGeometry(1.6, 0.2, 0.38), paintMaterial);
      band.position.set(sx * RAIL_X, 1.0, LEG_INSET);
      band.castShadow = true;
      crane.add(band);
    }

    crane.userData.assetId = 'candidate-dry-dock-crane';
    return crane;
  },
};
