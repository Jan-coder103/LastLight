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
// Blocky aggregate crusher for a quarry or works yard. Local +Z is the front: the conveyor discharges
// toward the player over a low stockpile. The machine is a stepped hopper over a jaw body, a side
// hopper, an inclined conveyor frame on a lattice tower, and a discharge chute. The conveyor is
// raised, so the collider is the crusher body and the tower base and the player can walk under the
// boom.
const frameMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
frameMaterial.name = 'crusher-frame';

const paintMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
paintMaterial.name = 'crusher-paint';

const plateMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.35,
  flatShading: true,
});
plateMaterial.name = 'crusher-plate';

const darkMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.9,
  metalness: 0.25,
  flatShading: true,
});
darkMaterial.name = 'crusher-dark';

const rubbleMaterial = new MeshStandardMaterial({
  color: '#797762',
  roughness: 1,
  flatShading: true,
});
rubbleMaterial.name = 'crusher-rubble';

const beltMaterial = new MeshStandardMaterial({
  color: '#3a3a34',
  roughness: 0.95,
  metalness: 0.05,
  flatShading: true,
});
beltMaterial.name = 'crusher-belt';

const hazardMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
hazardMaterial.name = 'crusher-hazard';

const HOPPER_TOP_Y = 5.4;
const TOWER_TOP_Y = 7.6;
const BOOM_TIP = 5.2;
const BOOM_TIP_Y = 6.0;

function addLegPair(group: Group, x: number, z: number, h: number): void {
  // A machine leg is a stubby tapered column with a foot pad and a knee brace, not a stick.
  const leg = new Mesh(new CylinderGeometry(0.18, 0.26, h, 6), frameMaterial);
  leg.position.set(x, h / 2, z);
  leg.castShadow = true;
  group.add(leg);
  const pad = new Mesh(new BoxGeometry(0.6, 0.16, 0.6), frameMaterial);
  pad.position.set(x, 0.08, z);
  pad.receiveShadow = true;
  group.add(pad);
  const knee = new Mesh(new BoxGeometry(0.1, 0.7, 0.1), frameMaterial);
  knee.position.set(x, h * 0.72, z + (z > 0 ? -0.3 : 0.3));
  knee.rotation.x = z > 0 ? 0.7 : -0.7;
  group.add(knee);
}

function addRubble(group: Group, x: number, y: number, z: number, count: number, spread: number): void {
  // Chunks are boxes with fixed sizes in a fixed arrangement, so a crusher always looks loaded the
  // same way. Three shapes per stone would be wasteful at this scale.
  for (let i = 0; i < count; i++) {
    const s = 0.22 + ((i * 7) % 3) * 0.1;
    const chunk = new Mesh(new BoxGeometry(s, s * 0.8, s * 1.1), rubbleMaterial);
    chunk.position.set(
      x + Math.cos(i * 1.7) * spread,
      y + ((i * 3) % 2) * 0.12,
      z + Math.sin(i * 2.1) * spread * 0.8,
    );
    chunk.rotation.set(0.2 * (i % 3), i * 0.9, 0.15 * (i % 2));
    chunk.castShadow = true;
    group.add(chunk);
  }
}

export const candidateQuarryCrusher: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-quarry-crusher',
  name: 'Quarry Crusher',
  category: 'landmark',
  dimensions: { x: 7.5, y: 8.2, z: 11.7 },
  collider: { center: { x: -0.7, y: 2.1, z: -0.4 }, size: { x: 6.0, y: 4.2, z: 4.0 } },
  interactionPoints: [
    { id: 'crusher-feed', label: 'Crusher Feed Hopper', position: { x: 0, y: 0, z: 2.2 } },
  ],
  createVisual(variant = 0) {
    const crusher = new Group();
    const noBoom = variant === 2;
    const shortBoom = variant === 1;
    const tipY = shortBoom ? 4.6 : BOOM_TIP_Y;
    const tipZ = shortBoom ? 2.6 : BOOM_TIP;

    // Feed hopper: an inverted frustum built as four trapezoid walls. Each wall is a rotated slab
    // so the funnel silhouette is real rather than a single cone.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const panel = new Mesh(new BoxGeometry(3.4, 2.4, 0.16), plateMaterial);
      panel.position.set(Math.cos(a) * 1.35, HOPPER_TOP_Y - 1.0, Math.sin(a) * 1.35);
      panel.rotation.y = -a + Math.PI / 2;
      panel.rotation.x = 0.42;
      panel.castShadow = true;
      panel.receiveShadow = true;
      crusher.add(panel);
    }
    const hopperRim = new Mesh(new BoxGeometry(4.4, 0.24, 4.4), frameMaterial);
    hopperRim.position.set(0, HOPPER_TOP_Y, 0);
    hopperRim.castShadow = true;
    crusher.add(hopperRim);
    const hopperLip = new Mesh(new BoxGeometry(4.9, 0.3, 4.9), frameMaterial);
    hopperLip.position.set(0, HOPPER_TOP_Y + 0.2, 0);
    hopperLip.castShadow = true;
    crusher.add(hopperLip);
    // Feed in the hopper, sitting below the rim.
    addRubble(crusher, 0, HOPPER_TOP_Y - 0.9, 0, 9, 1.5);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const post = new Mesh(new BoxGeometry(0.2, 1.0, 0.2), frameMaterial);
      post.position.set(Math.cos(a) * 2.15, HOPPER_TOP_Y + 0.7, Math.sin(a) * 2.15);
      post.castShadow = true;
      crusher.add(post);
    }
    const railTop = new Mesh(new BoxGeometry(4.7, 0.1, 0.1), frameMaterial);
    railTop.position.set(0, HOPPER_TOP_Y + 1.2, 2.15);
    crusher.add(railTop);
    for (const sz of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(4.7, 0.1, 0.1), frameMaterial);
      rail.position.set(0, HOPPER_TOP_Y + 1.2, sz * 2.15);
      crusher.add(rail);
    }

    // Jaw body below the hopper: a heavy box with a bolted front plate and a flywheel.
    const body = new Mesh(new BoxGeometry(3.0, 2.6, 2.8), paintMaterial);
    body.position.set(0, 2.0, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    crusher.add(body);
    const jawPlate = new Mesh(new BoxGeometry(3.2, 2.2, 0.2), plateMaterial);
    jawPlate.position.set(0, 2.0, 1.5);
    jawPlate.castShadow = true;
    crusher.add(jawPlate);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const bolt = new Mesh(new BoxGeometry(0.16, 0.16, 0.1), darkMaterial);
        bolt.position.set(-1.2 + i * 0.8, 1.2 + j * 0.8, 1.62);
        crusher.add(bolt);
      }
    }
    const flywheel = new Mesh(new CylinderGeometry(0.95, 0.95, 0.3, 12), darkMaterial);
    flywheel.rotation.x = Math.PI / 2;
    flywheel.position.set(1.85, 2.0, 0);
    flywheel.castShadow = true;
    crusher.add(flywheel);
    const flyHub = new Mesh(new CylinderGeometry(0.24, 0.24, 0.4, 8), frameMaterial);
    flyHub.rotation.x = Math.PI / 2;
    flyHub.position.set(1.9, 2.0, 0);
    crusher.add(flyHub);
    // Drive belt guard on the near side: a small rounded box, one of the few places a curve earns
    // its cost.
    const guard = new Mesh(new CylinderGeometry(0.55, 0.55, 0.5, 8), frameMaterial);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(0.0, 2.0, 1.85);
    guard.castShadow = true;
    crusher.add(guard);

    // Discharge chute under the jaw, angled forward, with a lip.
    const chute = new Mesh(new BoxGeometry(2.0, 1.2, 2.6), plateMaterial);
    chute.position.set(0, 1.1, 1.6);
    chute.rotation.x = 0.42;
    chute.castShadow = true;
    crusher.add(chute);
    const chuteLip = new Mesh(new BoxGeometry(2.2, 0.2, 0.3), frameMaterial);
    chuteLip.position.set(0, 0.36, 2.8);
    chuteLip.rotation.x = 0.42;
    chuteLip.castShadow = true;
    crusher.add(chuteLip);
    addRubble(crusher, 0, 0.3, 3.2, 7, 1.1);

    // Side hopper: a lower, wider funnel fed from the side, which is the bit that says "aggregate
    // screening" rather than "just a funnel".
    const sideTop = new Mesh(new BoxGeometry(2.6, 0.2, 2.6), frameMaterial);
    sideTop.position.set(-3.0, 3.4, -0.2);
    sideTop.castShadow = true;
    crusher.add(sideTop);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const panel = new Mesh(new BoxGeometry(2.0, 1.4, 0.12), plateMaterial);
      panel.position.set(-3.0 + Math.cos(a) * 0.95, 2.8, -0.2 + Math.sin(a) * 0.95);
      panel.rotation.y = -a + Math.PI / 2;
      panel.rotation.x = 0.44;
      panel.castShadow = true;
      crusher.add(panel);
    }
    // Feed chute from the side hopper into the main hopper.
    const sideChute = new Mesh(new BoxGeometry(2.4, 0.4, 1.4), plateMaterial);
    sideChute.position.set(-2.0, 4.4, -0.2);
    sideChute.rotation.set(0, 0, -0.28);
    sideChute.castShadow = true;
    crusher.add(sideChute);
    addRubble(crusher, -3.0, 3.7, -0.2, 5, 0.8);

    // Main legs and a base frame tying the machine to the ground.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        addLegPair(crusher, sx * 1.7, sz * 1.5, 0.9);
      }
    }
    const baseFrame = new Mesh(new BoxGeometry(4.2, 0.3, 3.4), frameMaterial);
    baseFrame.position.set(0, 0.9, 0);
    baseFrame.castShadow = true;
    baseFrame.receiveShadow = true;
    crusher.add(baseFrame);

    // Conveyor tower: a four-column lattice frame carrying the boom. The boom is a long box
    // truss; three segments is what keeps the mesh count down on the longest element.
    if (!noBoom) {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const col = new Mesh(new BoxGeometry(0.2, TOWER_TOP_Y - 0.9, 0.2), frameMaterial);
          col.position.set(sx * 1.3, 0.9 + (TOWER_TOP_Y - 0.9) / 2, -1.0 + sz * 0.9);
          col.castShadow = true;
          crusher.add(col);
        }
      }
      for (let level = 0; level < 3; level++) {
        const y = 1.8 + level * 2.1;
        for (const sz of [-1, 1]) {
          const bar = new Mesh(new BoxGeometry(2.6, 0.1, 0.1), frameMaterial);
          bar.position.set(0, y, -1.0 + sz * 0.9);
          crusher.add(bar);
        }
        for (const sx of [-1, 1]) {
          const bar = new Mesh(new BoxGeometry(0.1, 0.1, 1.8), frameMaterial);
          bar.position.set(sx * 1.3, y, -1.0);
          crusher.add(bar);
        }
        const diagLen = Math.hypot(2.6, 2.1);
        for (const sz of [-1, 1]) {
          const diag = new Mesh(new BoxGeometry(0.08, diagLen, 0.08), frameMaterial);
          diag.position.set(0, y + 1.05, -1.0 + sz * 0.9);
          diag.rotation.z = (level % 2 === 0 ? 1 : -1) * Math.atan2(2.6, 2.1);
          crusher.add(diag);
        }
      }
      const towerCap = new Mesh(new BoxGeometry(3.2, 0.24, 2.4), frameMaterial);
      towerCap.position.set(0, TOWER_TOP_Y - 0.1, -1.0);
      towerCap.castShadow = true;
      crusher.add(towerCap);

      // Boom: a head pulley at the discharge end, an inclined belt, side skirts, and lattice
      // under-truss. Inclined as one group so the whole boom reads as a single rigid assembly.
      const boomLen = Math.hypot(tipZ + 1.0, tipY - 0.9);
      const boomAngle = Math.atan2(tipY - 0.9, tipZ + 1.0);
      const boom = new Group();
      boom.position.set(0, 0.9, -1.0);
      boom.rotation.x = -boomAngle;
      crusher.add(boom);

      const belt = new Mesh(new BoxGeometry(1.3, 0.12, boomLen), beltMaterial);
      belt.position.set(0, 0.4, boomLen / 2);
      belt.receiveShadow = true;
      boom.add(belt);
      for (const sx of [-1, 1]) {
        const skirt = new Mesh(new BoxGeometry(0.09, 0.5, boomLen), frameMaterial);
        skirt.position.set(sx * 0.82, 0.5, boomLen / 2);
        skirt.castShadow = true;
        boom.add(skirt);
      }
      for (const sy of [0.16, 0.8]) {
        const chord = new Mesh(new BoxGeometry(1.9, 0.14, 0.14), frameMaterial);
        chord.position.set(0, sy, boomLen / 2);
        chord.castShadow = true;
        boom.add(chord);
      }
      const segments = 5;
      for (let i = 0; i < segments; i++) {
        const t = (i + 0.5) / segments;
        for (const sx of [-1, 1]) {
          const webLen = Math.hypot(boomLen / segments, 0.64);
          const web = new Mesh(new BoxGeometry(0.08, webLen, 0.08), frameMaterial);
          web.position.set(sx * 0.9, 0.48, t * boomLen);
          web.rotation.x = (i % 2 === 0 ? 1 : -1) * Math.atan2(boomLen / segments, 0.64);
          boom.add(web);
        }
      }
      // Head and tail pulleys at the boom ends.
      for (const [z, r] of [
        [0.1, 0.3],
        [boomLen - 0.1, 0.34],
      ] as const) {
        const pulley = new Mesh(new CylinderGeometry(r, r, 1.6, 10), darkMaterial);
        pulley.rotation.z = Math.PI / 2;
        pulley.position.set(0, 0.4, z);
        pulley.castShadow = true;
        boom.add(pulley);
      }
      // Head chute at the discharge end, hanging below the head pulley.
      const headChute = new Mesh(new BoxGeometry(1.5, 1.0, 1.3), paintMaterial);
      headChute.position.set(0, -0.2, boomLen - 0.4);
      headChute.rotation.x = 0.2;
      headChute.castShadow = true;
      boom.add(headChute);
      // Material on the belt, thinning toward the tip.
      for (let i = 0; i < 6; i++) {
        const t = i / 6;
        const lump = new Mesh(
          new BoxGeometry(1.2 - t * 0.5, 0.2, 0.5 + (i % 2) * 0.2),
          rubbleMaterial,
        );
        lump.position.set(0, 0.56, boomLen * (0.25 + t * 0.7));
        lump.rotation.y = i * 0.6;
        lump.castShadow = true;
        boom.add(lump);
      }
      // Belt drive motor hung off the tower side.
      const motor = new Mesh(new BoxGeometry(0.8, 0.7, 0.7), paintMaterial);
      motor.position.set(1.5, 1.4, -1.2);
      motor.castShadow = true;
      crusher.add(motor);
      const motorGuard = new Mesh(new CylinderGeometry(0.4, 0.4, 0.4, 8), frameMaterial);
      motorGuard.rotation.x = Math.PI / 2;
      motorGuard.position.set(1.5, 1.4, -0.85);
      crusher.add(motorGuard);
    } else {
      // Variant 2: the conveyor is gone, leaving a stub discharge and a bolted blanking plate on
      // the tower cap. The machine reads as stripped for parts.
      const blank = new Mesh(new BoxGeometry(3.0, 0.3, 2.2), plateMaterial);
      blank.position.set(0, TOWER_TOP_Y - 0.2, -1.0);
      blank.rotation.z = 0.06;
      blank.castShadow = true;
      crusher.add(blank);
      const stub = new Mesh(new BoxGeometry(1.6, 0.5, 1.2), frameMaterial);
      stub.position.set(0, 2.2, -1.0);
      stub.castShadow = true;
      crusher.add(stub);
      const pulley = new Mesh(new CylinderGeometry(0.34, 0.34, 1.6, 10), darkMaterial);
      pulley.rotation.z = Math.PI / 2;
      pulley.position.set(0.2, 2.2, -0.4);
      crusher.add(pulley);
    }

    // Discharge stockpile at the boom tip: a stepped rubble pile. Without the boom the pile moves
    // back to the chute, so the two variants read as different states of the same yard.
    const pileZ = noBoom ? 3.0 : tipZ + 1.4;
    const pileScale = noBoom ? 0.8 : 1.0;
    const pileBase = new Mesh(new CylinderGeometry(2.2 * pileScale, 2.6 * pileScale, 1.2, 7), rubbleMaterial);
    pileBase.position.set(0, 0.6, pileZ);
    pileBase.rotation.y = 0.3;
    pileBase.castShadow = true;
    pileBase.receiveShadow = true;
    crusher.add(pileBase);
    const pileTop = new Mesh(
      new CylinderGeometry(1.0 * pileScale, 1.8 * pileScale, 1.0, 7),
      rubbleMaterial,
    );
    pileTop.position.set(0, 1.7, pileZ);
    pileTop.rotation.y = -0.2;
    pileTop.castShadow = true;
    crusher.add(pileTop);
    addRubble(crusher, 0, 2.2, pileZ, 6, 0.9 * pileScale);

    // Control cabinet with a hazard plate, a ladder up the tower, and a dust shroud over the jaw.
    const cabinet = new Mesh(new BoxGeometry(0.7, 1.1, 0.5), paintMaterial);
    cabinet.position.set(-2.0, 1.0, 1.4);
    cabinet.castShadow = true;
    crusher.add(cabinet);
    const plate = new Mesh(new BoxGeometry(0.5, 0.35, 0.04), hazardMaterial);
    plate.position.set(-2.0, 1.3, 1.68);
    crusher.add(plate);
    for (let i = 0; i < 6; i++) {
      const rung = new Mesh(new BoxGeometry(0.5, 0.05, 0.05), frameMaterial);
      rung.position.set(1.7, 1.1 + i * 0.9, 0.4);
      crusher.add(rung);
    }
    for (const sx of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(0.05, 5.6, 0.05), frameMaterial);
      rail.position.set(1.7 + sx * 0.25, 3.7, 0.4);
      crusher.add(rail);
    }
    // Rear dust plate only. An earlier full-width shroud sat over the feed hopper and read as a
    // lid, hiding the funnel the whole machine is named for.
    const shroud = new Mesh(new BoxGeometry(3.4, 1.6, 0.14), darkMaterial);
    shroud.position.set(0, 3.9, -1.5);
    shroud.rotation.x = -0.2;
    shroud.castShadow = true;
    crusher.add(shroud);

    // Foreground: a marker cone and a spare tooth pick on the ground, four meshes of scale cue.
    const cone = new Mesh(new ConeGeometry(0.3, 0.8, 7), hazardMaterial);
    cone.position.set(2.6, 0.4, 2.6);
    cone.castShadow = true;
    crusher.add(cone);
    const coneBase = new Mesh(new BoxGeometry(0.6, 0.06, 0.6), hazardMaterial);
    coneBase.position.set(2.6, 0.03, 2.6);
    coneBase.rotation.y = 0.4;
    crusher.add(coneBase);
    const pick = new Mesh(new BoxGeometry(0.7, 0.12, 0.16), plateMaterial);
    pick.position.set(-2.8, 0.1, 2.4);
    pick.rotation.set(0, 0.6, 0.06);
    pick.castShadow = true;
    crusher.add(pick);

    crusher.userData.assetId = 'candidate-quarry-crusher';
    return crusher;
  },
};
