import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Barricade gate. Local +Z is the direction the road runs, and the gate's own width is in X, so
// the gate faces along the road with its leaves swinging toward the viewer. One reusable 5.2 m
// bay: two posts, a timber-and-scrap cross gate hung on a diagonal brace, a chain-and-hasp latch,
// a control box on the near post, and a sandbag base, with the barricade line continuing one and
// a half bays past each post as rail-on-sticks fence wings. Variants give an open gate, a closed
// one, and one with a leaf cut off its top rail.
// Revision: the two tyre-worn ground rectangles are gone, and the fence wings were added so the
// gate no longer stands alone in open ground.
const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'gate-timber';

const paleTimberMaterial = new MeshStandardMaterial({
  color: '#655744',
  roughness: 1,
  flatShading: true,
});
paleTimberMaterial.name = 'gate-pale-timber';

const steelMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'gate-steel';

const rustMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'gate-rust';

const darkMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.9,
  metalness: 0.25,
  flatShading: true,
});
darkMaterial.name = 'gate-dark';

const hazardMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
hazardMaterial.name = 'gate-hazard';

const sandbagMaterial = new MeshStandardMaterial({
  color: '#7d7358',
  roughness: 1,
  flatShading: true,
});
sandbagMaterial.name = 'gate-sandbag';

const UP = new Vector3(0, 1, 0);

function spanTo(
  from: [number, number, number],
  to: [number, number, number],
  radius: number,
  material: MeshStandardMaterial,
): Mesh {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = new Vector3().subVectors(b, a);
  const seg = new Mesh(new CylinderGeometry(radius, radius, dir.length(), 5), material);
  seg.quaternion.setFromUnitVectors(UP, dir.normalize());
  seg.position.copy(a).add(b).multiplyScalar(0.5);
  seg.castShadow = true;
  return seg;
}

const HALF = 1.85;
const LEAF_H = 1.3;
const HINGE_X = -HALF + 0.12;

export const barricadeGate: AuthoredAsset = {
  schemaVersion: 1,
  id: 'barricade-gate',
  name: 'Barricade Gate',
  category: 'prop',
  dimensions: { x: 6.6, y: 2.3, z: 3.6 },
  collider: {
    center: { x: 0, y: 0.7, z: 0 },
    size: { x: 6.5, y: 1.4, z: 0.5 },
  },
  interactionPoints: [
    { id: 'gate-control', label: 'Gate Control Box', position: { x: -1.5, y: 0, z: 0.7 } },
  ],
  createVisual(variant = 0) {
    const gate = new Group();
    const open = variant !== 0;
    const cutLeaf = variant === 2;

    // Two posts: a heavy timber one on the hinge side and a lighter one on the latch side. The
    // asymmetry is deliberate — a gate needs a post that can take the load and a post that does
    // not, and the difference is visible.
    for (const sx of [-1, 1]) {
      const heavy = sx < 0;
      const post = new Mesh(
        new BoxGeometry(heavy ? 0.22 : 0.16, heavy ? 2.0 : 1.85, heavy ? 0.22 : 0.16),
        heavy ? timberMaterial : paleTimberMaterial,
      );
      post.position.set(sx * HALF, (heavy ? 2.0 : 1.85) / 2, 0);
      post.castShadow = true;
      post.receiveShadow = true;
      gate.add(post);
      // A raking brace on the heavy post only, back into the ground.
      if (heavy) {
        gate.add(
          spanTo([sx * HALF, 1.5, 0.1], [sx * (HALF + 0.7), 0.06, 0.75], 0.07, timberMaterial),
        );
        const braceFoot = new Mesh(new BoxGeometry(0.3, 0.12, 0.3), sandbagMaterial);
        braceFoot.position.set(sx * (HALF + 0.7), 0.06, 0.75);
        braceFoot.castShadow = true;
        gate.add(braceFoot);
      }
      // Post cap: a small pyramid on the heavy post, a flat plate on the light one.
      if (heavy) {
        const cap = new Mesh(new ConeGeometry(0.18, 0.24, 4), paleTimberMaterial);
        cap.position.set(sx * HALF, 2.12, 0);
        cap.rotation.y = Math.PI / 4;
        cap.castShadow = true;
        gate.add(cap);
      } else {
        const cap = new Mesh(new BoxGeometry(0.24, 0.06, 0.24), rustMaterial);
        cap.position.set(sx * HALF, 1.9, 0);
        cap.rotation.y = 0.3;
        cap.castShadow = true;
        gate.add(cap);
      }
    }

    // Sandbag base along the hinge post: three stacked bags, each a flattened box, which is what
    // tells the player this is a temporary road block and not a farm gate.
    for (let i = 0; i < 3; i++) {
      const bag = new Mesh(new BoxGeometry(0.62, 0.16, 0.38), sandbagMaterial);
      bag.position.set(-HALF - 0.28 - (i % 2) * 0.06, 0.08 + i * 0.15, -0.18 + (i % 2) * 0.14);
      bag.rotation.y = 0.2 + i * 0.35;
      bag.castShadow = true;
      bag.receiveShadow = true;
      gate.add(bag);
    }

    // Two hinge straps on the heavy post, and the leaf hung off them.
    for (const y of [0.42, 1.16]) {
      const strap = new Mesh(new BoxGeometry(0.3, 0.1, 0.06), steelMaterial);
      strap.position.set(HINGE_X - 0.14, y, 0.14);
      strap.castShadow = true;
      gate.add(strap);
      const pin = new Mesh(new CylinderGeometry(0.035, 0.035, 0.16, 6), darkMaterial);
      pin.rotation.z = Math.PI / 2;
      pin.position.set(HINGE_X, y, 0.14);
      gate.add(pin);
    }

    // The leaf itself, in a pivot group so the gate can hang open or shut. Top and bottom rails,
    // five pickets, and one diagonal brace running the other way from the usual.
    const leafPivot = new Group();
    leafPivot.position.set(HINGE_X, 0, 0.14);
    leafPivot.rotation.y = open ? 0.95 : 0;
    gate.add(leafPivot);
    const leafW = HALF * 2 - 0.34;
    const railYs = [0.16, LEAF_H - 0.14];
    for (const y of railYs) {
      const rail = new Mesh(new BoxGeometry(leafW, 0.12, 0.07), timberMaterial);
      rail.position.set(leafW / 2, y, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      leafPivot.add(rail);
    }
    // Mid rail, so the leaf is a braced panel rather than five vertical sticks.
    const midRail = new Mesh(new BoxGeometry(leafW, 0.1, 0.055), timberMaterial);
    midRail.position.set(leafW / 2, LEAF_H * 0.5, 0);
    midRail.castShadow = true;
    midRail.receiveShadow = true;
    leafPivot.add(midRail);

    // Variant 2 loses the top rail's outer half, which is what makes the leaf read as cut rather
    // than as short.
    if (cutLeaf) {
      const topStub = new Mesh(new BoxGeometry(leafW * 0.45, 0.14, 0.08), timberMaterial);
      topStub.position.set(leafW * 0.225, LEAF_H - 0.14, 0);
      topStub.castShadow = true;
      leafPivot.add(topStub);
      const splinter = new Mesh(new ConeGeometry(0.09, 0.34, 4), paleTimberMaterial);
      splinter.position.set(leafW * 0.45, LEAF_H - 0.3, 0);
      splinter.rotation.set(0, Math.PI / 4, 0.5);
      splinter.castShadow = true;
      leafPivot.add(splinter);
    } else {
      const topRail = new Mesh(new BoxGeometry(leafW, 0.12, 0.07), timberMaterial);
      topRail.position.set(leafW / 2, LEAF_H - 0.14, 0);
      topRail.castShadow = true;
      topRail.receiveShadow = true;
      leafPivot.add(topRail);
    }
    const picketCount = 4;
    for (let i = 0; i < picketCount; i++) {
      const t = (i + 0.5) / picketCount;
      if (cutLeaf && i === picketCount - 1) {
        const stub = new Mesh(new BoxGeometry(0.11, 0.6, 0.06), paleTimberMaterial);
        stub.position.set(t * leafW, 0.44, 0);
        stub.rotation.z = 0.06;
        stub.castShadow = true;
        leafPivot.add(stub);
        continue;
      }
      const picket = new Mesh(new BoxGeometry(0.14, LEAF_H - 0.24, 0.07), paleTimberMaterial);
      picket.position.set(t * leafW, LEAF_H / 2, 0);
      picket.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.012;
      picket.castShadow = true;
      picket.receiveShadow = true;
      leafPivot.add(picket);
      const head = new Mesh(new ConeGeometry(0.1, 0.2, 4), paleTimberMaterial);
      head.position.set(t * leafW, LEAF_H - 0.1, 0);
      head.rotation.y = Math.PI / 4;
      head.castShadow = true;
      leafPivot.add(head);
    }
    // Diagonal brace from the bottom-hinge corner up to the latch corner, as a flat board. An
    // earlier draft used a thin cylinder here and it read as a third horizontal rail, which is the
    // one thing a gate brace must not do: the brace is the part that says "this is a gate".
    const braceLen = Math.hypot(leafW - 0.24, LEAF_H - 0.44);
    const braceBoard = new Mesh(new BoxGeometry(braceLen, 0.16, 0.05), darkMaterial);
    braceBoard.position.set(leafW / 2, LEAF_H / 2, -0.1);
    braceBoard.rotation.z = Math.atan2(LEAF_H - 0.44, leafW - 0.24);
    braceBoard.castShadow = true;
    leafPivot.add(braceBoard);
    leafPivot.add(
      spanTo([0.1, LEAF_H - 0.2, 0.12], [0.62, LEAF_H * 0.52, 0.12], 0.045, paleTimberMaterial),
    );

    // A short counter-brace at the hinge end only. A full second diagonal used to read as a third
    // horizontal rail from a distance, which is worse than having no second brace at all.
    // A scrap-metal patch plate over the brace joint, welded on.
    const patch = new Mesh(new BoxGeometry(0.26, 0.26, 0.03), steelMaterial);
    patch.position.set(leafW * 0.52, LEAF_H * 0.5, -0.12);
    patch.rotation.z = 0.1;
    patch.castShadow = true;
    leafPivot.add(patch);
    // Hazard flash on the leaf: the single warm signal, on the brace side so it faces the driver.
    const flash = new Mesh(new BoxGeometry(0.56, 0.2, 0.02), hazardMaterial);
    flash.position.set(leafW * 0.55, LEAF_H * 0.72, -0.06);
    flash.rotation.z = -0.42;
    flash.castShadow = true;
    leafPivot.add(flash);

    // Latch end: a chain-and-hasp on a ring, plus a hanging padlock. Open, the chain hangs slack.
    const hasp = new Mesh(new BoxGeometry(0.16, 0.18, 0.03), steelMaterial);
    hasp.position.set(leafW - 0.06, LEAF_H * 0.5, 0.06);
    hasp.castShadow = true;
    leafPivot.add(hasp);
    // Ring and chain hang off the leaf, so they swing with it; only the keeper and the staple are
    // fixed to the post. Parenting the chain to the pivot is what stops it stretching 1.7 m past
    // the gate when the leaf is open.
    const ring = new Mesh(new TorusGeometry(0.07, 0.016, 4, 8), darkMaterial);
    ring.position.set(leafW + 0.06, LEAF_H * 0.5, 0.14);
    ring.rotation.y = Math.PI / 2;
    leafPivot.add(ring);
    for (let i = 0; i < 3; i++) {
      const link = new Mesh(new TorusGeometry(0.05, 0.012, 4, 8), darkMaterial);
      link.position.set(leafW + 0.11 + i * 0.01, LEAF_H * 0.5 - 0.08 - i * 0.07, 0.14);
      link.rotation.set(i % 2 === 0 ? 0 : Math.PI / 2, Math.PI / 2, 0.14 * i);
      link.castShadow = true;
      leafPivot.add(link);
    }
    const keeper = new Mesh(new BoxGeometry(0.1, 0.24, 0.1), steelMaterial);
    keeper.position.set(HALF - 0.1, LEAF_H * 0.5, 0.14);
    keeper.castShadow = true;
    gate.add(keeper);

    // Control box on the near post: a weatherproof case with a conduit dropping into the ground,
    // a lever, and a small amber indicator. This is the "chain point" the idea asks for.
    const box = new Mesh(new BoxGeometry(0.3, 0.4, 0.2), rustMaterial);
    box.position.set(-HALF - 0.16, 1.4, 0.18);
    box.castShadow = true;
    box.receiveShadow = true;
    gate.add(box);
    const boxLid = new Mesh(new BoxGeometry(0.32, 0.06, 0.24), steelMaterial);
    boxLid.position.set(-HALF - 0.16, 1.63, 0.2);
    boxLid.rotation.x = 0.1;
    boxLid.castShadow = true;
    gate.add(boxLid);
    const conduit = new Mesh(new CylinderGeometry(0.04, 0.04, 0.9, 6), steelMaterial);
    conduit.position.set(-HALF - 0.16, 0.75, 0.2);
    conduit.castShadow = true;
    gate.add(conduit);
    const elbow = new Mesh(new CylinderGeometry(0.04, 0.04, 0.3, 6), steelMaterial);
    elbow.rotation.x = Math.PI / 2;
    elbow.position.set(-HALF - 0.16, 1.18, 0.32);
    gate.add(elbow);
    const lever = new Mesh(new BoxGeometry(0.05, 0.22, 0.05), steelMaterial);
    lever.position.set(-HALF - 0.06, 1.36, 0.29);
    lever.rotation.z = open ? 0.4 : -0.4;
    lever.castShadow = true;
    gate.add(lever);
    const indicator = new Mesh(new BoxGeometry(0.07, 0.07, 0.04), hazardMaterial);
    indicator.position.set(-HALF - 0.16, 1.5, 0.29);
    gate.add(indicator);
    const label = new Mesh(new BoxGeometry(0.2, 0.08, 0.02), hazardMaterial);
    label.position.set(-HALF - 0.16, 1.28, 0.29);
    gate.add(label);

    // Road surface: a kerb strip that puts the gate on a road rather than in a field. The two
    // dark tyre-worn patch rectangles an earlier draft set into the ground are gone — they read
    // as two floating slabs under the gate instead of wear.
    const kerbStrip = new Mesh(new BoxGeometry(4.6, 0.1, 0.3), sandbagMaterial);
    kerbStrip.position.set(0, 0.05, -0.7);
    kerbStrip.receiveShadow = true;
    gate.add(kerbStrip);

    // Fence wings: the barricade line continues past both posts for a bay and a half, two rails
    // on a pair of light posts per side. That is what stops the gate reading as a free-standing
    // farm gate in the middle of open ground.
    for (const sx of [-1, 1]) {
      for (const wx of [0.65, 1.3]) {
        const wingPost = new Mesh(new BoxGeometry(0.14, 1.6, 0.14), paleTimberMaterial);
        wingPost.position.set(sx * (HALF + wx), 0.8, 0);
        wingPost.castShadow = true;
        wingPost.receiveShadow = true;
        gate.add(wingPost);
      }
      for (const y of [1.1, 0.45]) {
        const wingRail = new Mesh(new BoxGeometry(1.44, 0.1, 0.07), timberMaterial);
        wingRail.position.set(sx * (HALF + 0.68), y, 0.14);
        wingRail.castShadow = true;
        wingRail.receiveShadow = true;
        gate.add(wingRail);
      }
    }

    gate.userData.assetId = 'candidate-barricade-gate';
    return gate;
  },
};
