import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Avalanche barrier frame for a cold mountain pass. Local +Z is the direction the road runs, so a
// placement sets the frame line across the carriageway; the frame's own depth is in X, which is
// the uphill direction. One module unit is a single 4 m bay of the repeated barrier; a placement
// can instance it along a road edge. The frame is open steel, so the collider covers the two legs
// of the bay and the player can stand under the bracing.
const steelMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'avalanche-steel';

const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'avalanche-timber';

const snowMaterial = new MeshStandardMaterial({
  color: '#c9c6b8',
  roughness: 1,
  flatShading: true,
});
snowMaterial.name = 'avalanche-snow';

const rockMaterial = new MeshStandardMaterial({
  color: '#77796a',
  roughness: 1,
  flatShading: true,
});
rockMaterial.name = 'avalanche-rock';

const hazardMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
hazardMaterial.name = 'avalanche-hazard';

const iceMaterial = new MeshStandardMaterial({
  color: '#8fa39a',
  roughness: 0.4,
  metalness: 0.05,
  flatShading: true,
});
iceMaterial.name = 'avalanche-ice';

const BAY = 4.0;
const LEG_H = 3.4;
const BAY_COUNT = 2;

export const candidateAvalancheBarrier: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-avalanche-barrier',
  name: 'Avalanche Barrier',
  category: 'prop',
  dimensions: { x: 9.6, y: 3.5, z: 3.0 },
  collider: { center: { x: 0, y: 0.9, z: 0 }, size: { x: 8.6, y: 1.8, z: 0.6 } },
  interactionPoints: [
    { id: 'avalanche-barrier', label: 'Avalanche Barrier', position: { x: 0, y: 0, z: 1.6 } },
  ],
  createVisual(variant = 0) {
    const barrier = new Group();
    const damaged = variant !== 0;
    const deepSnow = variant === 2;

    // Two bays of frame. Each bay is a pair of splayed legs, a top rail, and a W of diagonal
    // bracing; the bays share the middle leg, which is what makes it read as repeated roadside
    // structure rather than two separate gates.
    const legX = BAY * BAY_COUNT * 0.5;
    for (let i = 0; i <= BAY_COUNT; i++) {
      const x = -legX + i * BAY;
      const missing = damaged && i === 1;
      // The leg stands on its base plate, so it starts at the plate top (y = 0.1) rather than at
      // the ground; a leaning leg otherwise pushes its lower rim through the terrain.
      const leg = new Mesh(new CylinderGeometry(0.09, 0.12, LEG_H, 6), steelMaterial);
      leg.position.set(x, 0.1 + LEG_H / 2, 0);
      leg.rotation.z = i === 0 ? 0.09 : i === BAY_COUNT ? -0.09 : 0.0;
      if (missing) {
        // Broken leg: a snapped stub at the base and the upper section leaning off the frame.
        leg.scale.y = 0.42;
        const upper = new Mesh(new CylinderGeometry(0.09, 0.1, LEG_H * 0.6, 6), steelMaterial);
        upper.position.set(x + 0.75, 0.9, 0.5);
        upper.rotation.set(0.3, 0.2, 1.15);
        upper.castShadow = true;
        barrier.add(upper);
      }
      leg.castShadow = true;
      barrier.add(leg);
      // Base plate and a snow wedge behind the leg, which is the uphill build-up.
      const plate = new Mesh(new BoxGeometry(0.4, 0.1, 0.4), steelMaterial);
      plate.position.set(x, 0.05, 0);
      barrier.add(plate);
      const wedge = new Mesh(new BoxGeometry(0.7, 0.3, 0.6), snowMaterial);
      wedge.position.set(x, 0.16, -0.28);
      wedge.receiveShadow = true;
      barrier.add(wedge);
    }

    for (let bay = 0; bay < BAY_COUNT; bay++) {
      const midX = -legX + (bay + 0.5) * BAY;
      // Top rail runs the full bay width.
      const rail = new Mesh(new BoxGeometry(BAY + 0.1, 0.14, 0.14), steelMaterial);
      rail.position.set(midX, LEG_H - 0.1, 0);
      if (damaged && bay === 0) {
        rail.rotation.z = -0.16;
        rail.position.y = LEG_H - 0.45;
      }
      rail.castShadow = true;
      barrier.add(rail);
      // Lower rail: absent in the damaged bay, which is the clearest break signal.
      if (!(damaged && bay === 0)) {
        const lower = new Mesh(new BoxGeometry(BAY, 0.11, 0.11), steelMaterial);
        lower.position.set(midX, 1.35, 0);
        lower.castShadow = true;
        barrier.add(lower);
      }
      // Diagonal bracing: a W of three diagonals per bay.
      for (let d = 0; d < 3; d++) {
        const broken = damaged && bay === 0 && d === 1;
        const diagLen = Math.hypot(BAY / 3, LEG_H - 1.45);
        const diag = new Mesh(new BoxGeometry(0.08, diagLen, 0.08), steelMaterial);
        const t = (d + 0.5) / 3;
        diag.position.set(midX - BAY / 2 + t * BAY, 1.35 + (LEG_H - 1.45) / 2, 0);
        diag.rotation.z = (d % 2 === 0 ? 1 : -1) * Math.atan2(BAY / 3, LEG_H - 1.45);
        if (broken) {
          diag.scale.y = 0.5;
          diag.position.y -= 0.6;
          diag.rotation.z *= 0.5;
        }
        diag.castShadow = true;
        barrier.add(diag);
      }
      // Timber snow deflector board hung on the uphill face of each bay. It is the element that
      // makes the barrier a snow structure rather than a fence.
      for (let s = 0; s < 2; s++) {
        const board = new Mesh(new BoxGeometry(BAY / 2 - 0.15, 0.55, 0.07), timberMaterial);
        board.position.set(midX - BAY / 4 + s * (BAY / 2), 2.1, -0.2);
        board.rotation.x = 0.14;
        if (damaged && bay === 0 && s === 1) board.rotation.z = 0.4;
        board.castShadow = true;
        barrier.add(board);
        for (const sx of [-1, 1]) {
          const hanger = new Mesh(new BoxGeometry(0.06, 0.6, 0.06), steelMaterial);
          hanger.position.set(board.position.x + sx * (BAY / 4 - 0.25), 2.45, -0.2);
          barrier.add(hanger);
        }
      }
    }

    // Timber kick rail at the road side, catching drift.
    const kick = new Mesh(new BoxGeometry(legX * 2, 0.2, 0.09), timberMaterial);
    kick.position.set(0, 0.42, 0.22);
    kick.castShadow = true;
    kick.receiveShadow = true;
    barrier.add(kick);

    // Snow build on the uphill side: a stepped drift that gets taller away from the frame, so the
    // frame looks like it is holding something back rather than standing on a flat pad.
    const drift = new Mesh(new BoxGeometry(legX * 2 + 0.6, 0.6, 0.9), snowMaterial);
    drift.position.set(0, 0.41, -0.58);
    drift.rotation.x = -0.2;
    drift.castShadow = true;
    drift.receiveShadow = true;
    barrier.add(drift);
    const driftTop = new Mesh(new BoxGeometry(legX * 2 + 1.2, deepSnow ? 1.3 : 0.5, 1.2), snowMaterial);
    driftTop.position.set(0, deepSnow ? 1.25 : 0.9, -1.05);
    driftTop.rotation.x = -0.34;
    driftTop.castShadow = true;
    driftTop.receiveShadow = true;
    barrier.add(driftTop);

    // Roadside furniture: a depth marker post and a leaning delineator with a faded hazard cap.
    const marker = new Mesh(new CylinderGeometry(0.06, 0.07, 1.6, 6), timberMaterial);
    marker.position.set(legX + 0.55, 0.86, 0.7);
    marker.rotation.z = 0.12;
    marker.castShadow = true;
    barrier.add(marker);
    for (let i = 0; i < 3; i++) {
      const band = new Mesh(new BoxGeometry(0.13, 0.16, 0.13), hazardMaterial);
      band.position.set(legX + 0.5 - i * 0.02, 1.35 - i * 0.28, 0.7 + i * 0.01);
      band.rotation.z = 0.12;
      barrier.add(band);
    }
    const delineator = new Mesh(new BoxGeometry(0.12, 1.1, 0.12), steelMaterial);
    delineator.position.set(-legX - 0.6, 0.57, 0.75);
    delineator.rotation.z = -0.18;
    delineator.castShadow = true;
    barrier.add(delineator);
    const cap = new Mesh(new BoxGeometry(0.16, 0.24, 0.16), hazardMaterial);
    cap.position.set(-legX - 0.7, 1.15, 0.75);
    cap.rotation.z = -0.18;
    barrier.add(cap);

    // Ground detail: exposed rock at the uphill toe and an ice sheet where meltwater has run
    // under the drift.
    for (let i = 0; i < 4; i++) {
      const rock = new Mesh(new BoxGeometry(0.5, 0.3, 0.4), rockMaterial);
      rock.position.set(-legX + 0.9 + i * 2.4, 0.28, -1.7);
      rock.rotation.set(0.1 * i, 0.6 * i, 0.08);
      rock.castShadow = true;
      barrier.add(rock);
    }
    const ice = new Mesh(new BoxGeometry(3.4, 0.05, 0.9), iceMaterial);
    ice.position.set(0.4, 0.04, -1.35);
    barrier.add(ice);

    barrier.userData.assetId = 'candidate-avalanche-barrier';
    return barrier;
  },
};
