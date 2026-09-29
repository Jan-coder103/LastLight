import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Makeshift lookout platform. Local +Z is the front edge, i.e. the open side a player looks over;
// the brace legs are on two opposite corners and the ladder climbs the +Z front, in line with the
// guardrail gap. A deck built from scavenged boards of mixed lengths, a partial railing that
// stops halfway along the front, diagonal braces, and a ladder. Every board is a different length
// and a different timber, which is what makes it scavenged rather than built.
// Revision: the ladder moved from the +X side to the +Z front so it arrives at the railing
// opening instead of at a rail.
const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'platform-timber';

const paleTimberMaterial = new MeshStandardMaterial({
  color: '#655744',
  roughness: 1,
  flatShading: true,
});
paleTimberMaterial.name = 'platform-pale-timber';

const darkTimberMaterial = new MeshStandardMaterial({
  color: '#4b4035',
  roughness: 1,
  flatShading: true,
});
darkTimberMaterial.name = 'platform-dark-timber';

const steelMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'platform-steel';

const nailMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.35,
  flatShading: true,
});
nailMaterial.name = 'platform-nail';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'platform-signal';

const footMaterial = new MeshStandardMaterial({
  color: '#797762',
  roughness: 1,
  flatShading: true,
});
footMaterial.name = 'platform-foot';

const UP = new Vector3(0, 1, 0);

function spanTo(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  material: MeshStandardMaterial,
): Mesh {
  // Diagonal bracing and the ladder stiles are cylinders, whose axis is +Y. Aiming that axis with
  // a quaternion is the only way to place them along an arbitrary line; two Euler angles with the
  // default XYZ order lay them nearly flat.
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  const seg = new Mesh(new CylinderGeometry(radius, radius, dir.length(), 5), material);
  seg.quaternion.setFromUnitVectors(UP, dir.normalize());
  seg.position.copy(a).add(b).multiplyScalar(0.5);
  seg.castShadow = true;
  return seg;
}

const DECK_Y = 2.15;
const DECK_W = 2.6;
const DECK_D = 2.2;
const X = DECK_W / 2;
const Z = DECK_D / 2;

export const lookoutPlatform: AuthoredAsset = {
  schemaVersion: 1,
  id: 'lookout-platform',
  name: 'Makeshift Lookout Platform',
  category: 'prop',
  dimensions: { x: 4.0, y: 3.1, z: 3.7 },
  collider: {
    center: { x: 0, y: 1.1, z: 0 },
    size: { x: DECK_W, y: 2.2, z: DECK_D },
  },
  interactionPoints: [
    { id: 'lookout-deck', label: 'Lookout Deck', position: { x: 0, y: 0, z: Z + 0.5 } },
  ],
  createVisual(variant = 0) {
    const platform = new Group();
    const boardsMissing = variant !== 0;
    const railBroken = variant === 2;

    // Four posts, each a pair of boards bolted either side of a bearer. The post is the only part
    // of this prop that reaches the ground, and it is deliberately not a single stick.
    const postX = [-X + 0.16, X - 0.16];
    const postZ = [-Z + 0.16, Z - 0.16];
    for (const px of postX) {
      for (const pz of postZ) {
        for (const sx of [-1, 1]) {
          const post = new Mesh(new BoxGeometry(0.09, DECK_Y, 0.12), timberMaterial);
          post.position.set(px + sx * 0.07, DECK_Y / 2, pz);
          post.castShadow = true;
          post.receiveShadow = true;
          platform.add(post);
        }
        // A diagonal brace from each post down and out, on two of the four corners only: four
        // braces would be a structure, two is a platform somebody built in a hurry.
        if (px < 0 === pz > 0) {
          platform.add(
            spanTo(
              [px, DECK_Y - 0.75, pz],
              [px + (px < 0 ? -0.75 : 0.75), 0.06, pz + (pz > 0 ? 0.6 : -0.6)],
              0.055,
              darkTimberMaterial,
            ),
          );
          const foot = new Mesh(new BoxGeometry(0.22, 0.1, 0.22), footMaterial);
          foot.position.set(px + (px < 0 ? -0.75 : 0.75), 0.05, pz + (pz > 0 ? 0.6 : -0.6));
          foot.castShadow = true;
          foot.receiveShadow = true;
          platform.add(foot);
        }
      }
    }

    // Bearers and joists under the deck. Seen from below when a player stands under the platform,
    // and they are what stop the deck reading as a floating slab.
    for (const pz of postZ) {
      const bearer = new Mesh(new BoxGeometry(DECK_W, 0.12, 0.12), darkTimberMaterial);
      bearer.position.set(0, DECK_Y - 0.09, pz);
      bearer.castShadow = true;
      platform.add(bearer);
    }
    for (let i = 0; i < 3; i++) {
      const joist = new Mesh(new BoxGeometry(0.1, 0.1, DECK_D - 0.2), darkTimberMaterial);
      joist.position.set(-X + 0.5 + i * ((DECK_W - 1.0) / 2), DECK_Y - 0.2, 0);
      joist.castShadow = true;
      platform.add(joist);
    }

    // Deck boards, seven across, each a different timber and a different length. Board 4 is
    // missing in variants 1 and 2, which is the hole a player sees when they climb up.
    const boardMats = [
      timberMaterial,
      paleTimberMaterial,
      darkTimberMaterial,
      timberMaterial,
      paleTimberMaterial,
      timberMaterial,
      darkTimberMaterial,
    ];
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7;
      if (boardsMissing && i === 4) continue;
      const w = DECK_D / 7 - 0.03;
      const shrink = i % 3 === 0 ? 0.16 : i % 3 === 1 ? 0.0 : 0.08;
      const board = new Mesh(new BoxGeometry(DECK_W - shrink, 0.05, w), boardMats[i]!);
      board.position.set(shrink / 2, DECK_Y + 0.025, -Z + t * DECK_D);
      board.castShadow = true;
      board.receiveShadow = true;
      platform.add(board);
      // Two nail heads per board, on a fixed stagger.
      for (const nx of [-1, 1]) {
        const nail = new Mesh(new BoxGeometry(0.05, 0.02, 0.05), nailMaterial);
        nail.position.set((nx * (DECK_W - 0.3)) / 2, DECK_Y + 0.055, -Z + t * DECK_D);
        platform.add(nail);
      }
    }
    // A loose board laid across the gap in variants 1 and 2, not nailed down.
    if (boardsMissing) {
      const loose = new Mesh(new BoxGeometry(DECK_W - 0.3, 0.05, 0.22), paleTimberMaterial);
      loose.position.set(0.05, DECK_Y + 0.07, -Z + (4.5 / 7) * DECK_D);
      loose.rotation.set(0, 0.12, 0.02);
      loose.castShadow = true;
      platform.add(loose);
    }

    // Railing: posts at the corners and mid-span with two rails, along the +X and −X sides and
    // the −Z back. The +Z front is deliberately open — that is the view side, and it is what
    // makes the platform read as a lookout rather than as a fenced box.
    const railPostY = [DECK_Y + 0.5, DECK_Y + 0.86];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 0, 1]) {
        if (sz === 1) continue;
        const post = new Mesh(new BoxGeometry(0.08, 0.9, 0.08), timberMaterial);
        post.position.set(sx * (X - 0.08), DECK_Y + 0.45, sz * (Z - 0.1));
        post.castShadow = true;
        platform.add(post);
      }
    }
    // Back and side rails. Variant 2 has the +X side rail torn off, leaving one rail on its stubs.
    const railRuns: { from: [number, number, number]; to: [number, number, number] }[] = [
      { from: [-X + 0.08, 0, -Z + 0.1], to: [X - 0.08, 0, -Z + 0.1] },
      { from: [-X + 0.08, 0, -Z + 0.1], to: [-X + 0.08, 0, Z - 0.1] },
    ];
    if (!railBroken) {
      railRuns.push({ from: [X - 0.08, 0, -Z + 0.1], to: [X - 0.08, 0, Z - 0.1] });
    }
    for (const run of railRuns) {
      for (const y of railPostY) {
        platform.add(
          spanTo(
            [run.from[0], y, run.from[2]],
            [run.to[0], y, run.to[2]],
            0.05,
            paleTimberMaterial,
          ),
        );
      }
    }
    if (railBroken) {
      // A single rail stub still bolted to the +X back post, and the offcut on the deck below.
      platform.add(
        spanTo(
          [X - 0.08, DECK_Y + 0.5, -Z + 0.1],
          [X - 0.08, DECK_Y + 0.5, -Z + 0.7],
          0.05,
          paleTimberMaterial,
        ),
      );
      const offcut = new Mesh(new BoxGeometry(1.2, 0.05, 0.16), darkTimberMaterial);
      offcut.position.set(X - 0.5, DECK_Y + 0.1, -Z + 1.0);
      offcut.rotation.set(0, 0.2, 0.04);
      offcut.castShadow = true;
      platform.add(offcut);
      // A single painted marker on the remaining back rail: the small warm signal.
      const marker = new Mesh(new BoxGeometry(0.24, 0.12, 0.04), signalMaterial);
      marker.position.set(-0.4, DECK_Y + 0.86, -Z + 0.07);
      platform.add(marker);
    }

    // Ladder on the +Z front, centred on the guardrail gap, so a climber comes up straight into
    // the open edge instead of climbing into a rail. The stiles land just over the deck edge,
    // which is what they lean on. Rungs are individual boxes on a fixed pitch, which is what
    // makes it read as a ladder and not as a striped plank.
    const ladderZ = Z + 0.68;
    for (const sx of [-1, 1]) {
      platform.add(
        spanTo(
          [sx * 0.18, 0.04, ladderZ],
          [sx * 0.16, DECK_Y + 0.05, Z - 0.04],
          0.045,
          timberMaterial,
        ),
      );
    }
    const rungCount = 6;
    for (let i = 0; i < rungCount; i++) {
      const t = (i + 0.5) / rungCount;
      const y = 0.14 + t * (DECK_Y - 0.06);
      const z = ladderZ + (Z - 0.04 - ladderZ) * t;
      const rung = new Mesh(new BoxGeometry(0.44, 0.05, 0.05), paleTimberMaterial);
      rung.position.set(0.02, y, z);
      rung.rotation.y = 0.14;
      rung.castShadow = true;
      platform.add(rung);
    }
    // A tin and a coil of wire left on the deck, four meshes of lived-in scale cue.
    const tin = new Mesh(new CylinderGeometry(0.07, 0.07, 0.12, 8), steelMaterial);
    tin.position.set(-0.6, DECK_Y + 0.11, -0.7);
    tin.castShadow = true;
    platform.add(tin);
    const tinLid = new Mesh(new CylinderGeometry(0.075, 0.075, 0.02, 8), steelMaterial);
    tinLid.position.set(-0.4, DECK_Y + 0.06, -0.9);
    tinLid.rotation.z = 0.2;
    tinLid.castShadow = true;
    platform.add(tinLid);
    const wire = new Mesh(new CylinderGeometry(0.12, 0.12, 0.05, 8), steelMaterial);
    wire.position.set(0.7, DECK_Y + 0.08, 0.6);
    wire.castShadow = true;
    platform.add(wire);

    platform.userData.assetId = 'candidate-lookout-platform';
    return platform;
  },
};
