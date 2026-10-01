import {
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Mountain road tunnel mouth. Local +Z is the direction the road runs through the portal, so a
// placement points +Z down the bore. The asset is the outside: a rough concrete headwall with a
// bore, wing walls splaying back, a blocked lane of fallen slab and scree, and a hazard band over
// the crown. The bore is left open and dark so it reads as a passage rather than a solid lump.
const concreteMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'tunnel-concrete';

const darkConcreteMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
darkConcreteMaterial.name = 'tunnel-soot';

const rockMaterial = new MeshStandardMaterial({
  color: '#6f6e60',
  roughness: 1,
  flatShading: true,
});
rockMaterial.name = 'tunnel-rock';

const screeMaterial = new MeshStandardMaterial({
  color: '#797762',
  roughness: 1,
  flatShading: true,
});
screeMaterial.name = 'tunnel-scree';

const boreMaterial = new MeshStandardMaterial({
  color: '#22261f',
  roughness: 1,
  metalness: 0,
});
boreMaterial.name = 'tunnel-bore';

const hazardMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
hazardMaterial.name = 'tunnel-hazard';

const railMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.25,
  flatShading: true,
});
railMaterial.name = 'tunnel-rail';

const BORE_R = 2.95;
const BORE_Y = 3.15;
const HEAD_W = 15.0;
const HEAD_D = 1.8;

function settle(mesh: Mesh, lift: number): void {
  // Debris is placed at a nominal height then dropped onto the ground: the mesh is measured with
  // its own rotation applied and its Y set so the lowest corner sits at `lift`. Deterministic, and
  // it means a rotated slab can never sink through the terrain.
  mesh.updateMatrix();
  const box = new Box3().setFromObject(mesh, true);
  mesh.position.y += lift - box.min.y;
}

function addCrackFissures(group: Group): void {
  // Retaining-wall cracks: two dark recessed slots on the headwall face, angled so they read as
  // splitting rather than as panel joints.
  for (const [x, y, rot, len] of [
    [-5.4, 4.6, 0.22, 2.4],
    [4.8, 3.6, -0.3, 3.0],
    [1.4, 7.4, 0.5, 1.6],
  ] as const) {
    const crack = new Mesh(new BoxGeometry(0.14, len, 0.1), darkConcreteMaterial);
    crack.position.set(x, y, HEAD_D / 2 + 0.02);
    crack.rotation.z = rot;
    group.add(crack);
  }
}

export const candidateMountainTunnel: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-mountain-tunnel',
  name: 'Mountain Road Tunnel',
  category: 'landmark',
  dimensions: { x: 19.8, y: 12.1, z: 11.1 },
  collider: {
    center: { x: 0, y: 3.6, z: -1.6 },
    size: { x: 15.0, y: 7.2, z: 3.2 },
  },
  interactionPoints: [
    { id: 'tunnel-mouth', label: 'Tunnel Mouth', position: { x: 0, y: 0, z: 2.2 } },
  ],
  createVisual(variant = 0) {
    const tunnel = new Group();
    const breach = variant !== 0;
    const buried = variant === 2;

    // Headwall. The bore is a full-height arch, so the headwall is built as a row of five flat
    // blocks either side of the opening plus an arch band over it, rather than one slab with a
    // hole implied. Two piers, two haunch blocks, one crown block: the stepped top is what gives
    // the portal its profile.
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        const seg = new Mesh(
          new BoxGeometry((HEAD_W - BORE_R) / 2 - 0.05, 3.4, HEAD_D),
          i === 0 ? concreteMaterial : darkConcreteMaterial,
        );
        seg.position.set(sx * (BORE_R + (HEAD_W - BORE_R) / 4 + 0.03), 1.7 + i * 3.4, 0);
        seg.castShadow = true;
        seg.receiveShadow = true;
        tunnel.add(seg);
      }
    }
    // Crown block spans the full headwall width and sits on the piers, closing the top of the
    // opening; the cap slab then lands on that.
    const crown = new Mesh(new BoxGeometry(HEAD_W - 0.2, 1.6, HEAD_D - 0.3), darkConcreteMaterial);
    crown.position.set(0, 7.6, 0);
    crown.castShadow = true;
    crown.receiveShadow = true;
    tunnel.add(crown);
    const capSlab = new Mesh(new BoxGeometry(HEAD_W + 0.3, 0.4, HEAD_D + 0.25), concreteMaterial);
    capSlab.position.set(0, 8.6, 0);
    capSlab.castShadow = true;
    tunnel.add(capSlab);

    // Arch ring: seven voussoir blocks stepped around the bore mouth, each rotated to the local
    // tangent. This is the piece that makes the opening read as a tunnel and not a punched hole.
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.07 + (i / 6) * 0.86);
      const seg = new Mesh(new BoxGeometry(1.45, 0.75, HEAD_D + 0.2), concreteMaterial);
      seg.position.set(Math.cos(a) * (BORE_R + 0.5), BORE_Y + Math.sin(a) * (BORE_R + 0.5), 0.05);
      seg.rotation.z = a - Math.PI / 2;
      seg.castShadow = true;
      seg.receiveShadow = true;
      tunnel.add(seg);
    }

    // Bore: a dark faceted tube set back into the headwall, plus a short liner ring at the mouth
    // so the hole has thickness.
    const bore = new Mesh(
      new CylinderGeometry(BORE_R, BORE_R, 7.0, 8, 1, true),
      boreMaterial,
    );
    bore.rotation.x = Math.PI / 2;
    bore.rotation.z = Math.PI / 8;
    bore.position.set(0, BORE_Y, -2.6);
    tunnel.add(bore);
    const boreFloor = new Mesh(new BoxGeometry(BORE_R * 1.85, 0.3, 7.0), darkConcreteMaterial);
    boreFloor.position.set(0, 0.15, -2.6);
    boreFloor.receiveShadow = true;
    tunnel.add(boreFloor);
    // Springing line: a shallow arch band set just inside the arch ring, so the opening has depth
    // rather than reading as a flat cut.
    const liner = new Mesh(
      new CylinderGeometry(BORE_R + 0.18, BORE_R + 0.18, 0.5, 8, 1, true, Math.PI * 0.02, Math.PI * 0.96),
      darkConcreteMaterial,
    );
    liner.rotation.x = Math.PI / 2;
    liner.rotation.z = Math.PI / 8;
    liner.position.set(0, BORE_Y, -0.5);
    tunnel.add(liner);

    // Wing walls splaying back from the headwall: two tapered slabs, which is what makes a tunnel
    // face read as retaining structure rather than a wall in a field.
    for (const sx of [-1, 1]) {
      const wing = new Mesh(new BoxGeometry(0.8, 5.0, 6.4), concreteMaterial);
      wing.position.set(sx * (HEAD_W / 2 + 0.4), 2.5, -2.6);
      wing.rotation.y = sx * 0.26;
      wing.castShadow = true;
      wing.receiveShadow = true;
      tunnel.add(wing);
      const wingCap = new Mesh(new BoxGeometry(1.0, 0.3, 6.4), darkConcreteMaterial);
      wingCap.position.set(sx * (HEAD_W / 2 + 0.8), 5.1, -2.6);
      wingCap.rotation.y = sx * 0.26;
      wingCap.castShadow = true;
      tunnel.add(wingCap);
      // Parapet stubs stepping back along the wing wall.
      for (let i = 0; i < 3; i++) {
        const t = (i + 0.5) / 3;
        const stub = new Mesh(new BoxGeometry(0.7, 0.5, 1.3), concreteMaterial);
        stub.position.set(
          sx * (HEAD_W / 2 + 0.55 + t * 1.6),
          5.4,
          0.2 - t * 5.6,
        );
        stub.rotation.y = sx * 0.26;
        stub.castShadow = true;
        tunnel.add(stub);
      }
    }

    addCrackFissures(tunnel);

    // Hazard band over the crown: a single muted warm stripe, the small functional signal the
    // palette allows.
    const band = new Mesh(new BoxGeometry(HEAD_W - 1.2, 0.4, 0.12), hazardMaterial);
    band.position.set(0, 8.6, HEAD_D / 2 + 0.12);
    tunnel.add(band);
    for (const sx of [-1, 1]) {
      const lamp = new Mesh(new BoxGeometry(0.5, 0.34, 0.24), hazardMaterial);
      lamp.position.set(sx * 5.4, 7.0, HEAD_D / 2 + 0.02);
      lamp.castShadow = true;
      tunnel.add(lamp);
    }

    // Blocked lane: three fallen slab chunks, a scree wedge, and a toppled delineator post. The
    // blockage is asymmetric so the bore is only partly closed.
    const slabA = new Mesh(new BoxGeometry(2.6, 1.3, 1.9), concreteMaterial);
    slabA.position.set(-1.9, 1.30, 1.5);
    slabA.rotation.set(0.12, 0.3, 0.22);
    settle(slabA, 0.02);
    slabA.castShadow = true;
    slabA.receiveShadow = true;
    tunnel.add(slabA);
    const slabB = new Mesh(new BoxGeometry(2.0, 0.9, 2.3), darkConcreteMaterial);
    slabB.position.set(1.6, 0.45, 2.1);
    slabB.rotation.set(-0.1, -0.22, -0.14);
    settle(slabB, 0.02);
    slabB.castShadow = true;
    slabB.receiveShadow = true;
    tunnel.add(slabB);
    const scree = new Mesh(new BoxGeometry(5.2, 0.5, 2.4), screeMaterial);
    scree.position.set(0.4, 0.2, 1.4);
    scree.rotation.y = 0.1;
    settle(scree, 0.0);
    scree.receiveShadow = true;
    tunnel.add(scree);
    for (let i = 0; i < 5; i++) {
      const chunk = new Mesh(
        new BoxGeometry(0.5 + (i % 3) * 0.2, 0.3 + (i % 2) * 0.15, 0.45),
        screeMaterial,
      );
      chunk.position.set(-2.6 + i * 1.3, 0.45, 2.2 + (i % 2) * 0.4);
      chunk.rotation.set(0.2 * i, i * 0.7, 0.1 * (i % 3));
      settle(chunk, 0.02);
      chunk.castShadow = true;
      tunnel.add(chunk);
    }
    const delineator = new Mesh(new CylinderGeometry(0.09, 0.11, 1.5, 6), railMaterial);
    delineator.position.set(2.8, 0.32, 2.6);
    delineator.rotation.set(Math.PI / 2 - 0.2, 0, 0.5);
    delineator.castShadow = true;
    tunnel.add(delineator);

    // Rock ridge the portal is cut into. Two overlapping masses that share a face at x = 0, so the
    // headwall meets one continuous hillside instead of two floating boxes. The rock is what tells
    // the player the tunnel goes into a mountain.
    const RIDGE_Z = -2.1;
    const RIDGE_D = 6.0;
    const ridgeL = new Mesh(new BoxGeometry(9.6, 2.4, RIDGE_D), rockMaterial);
    ridgeL.position.set(-4.7, 9.9, RIDGE_Z);
    ridgeL.rotation.set(0.03, 0.06, 0.05);
    ridgeL.castShadow = true;
    ridgeL.receiveShadow = true;
    tunnel.add(ridgeL);
    const ridgeR = new Mesh(new BoxGeometry(9.6, 1.8, RIDGE_D), rockMaterial);
    ridgeR.position.set(4.7, 9.7, RIDGE_Z - 0.2);
    ridgeR.rotation.set(-0.02, -0.05, -0.04);
    ridgeR.castShadow = true;
    ridgeR.receiveShadow = true;
    tunnel.add(ridgeR);
    // A low apron in front of the ridge so the hillside does not stop at a hard vertical face.
    const apron = new Mesh(new BoxGeometry(19.0, 1.6, 2.2), rockMaterial);
    apron.position.set(0, 9.2, -1.1);
    apron.rotation.set(0.16, 0.0, 0.0);
    apron.castShadow = true;
    apron.receiveShadow = true;
    tunnel.add(apron);

    if (breach) {
      // Spalled shoulder: a block of rock comes down, leaving a fresh lighter scar and a debris
      // fan on the deck. Variant 2 also buries the crown with a scree cap.
      const scar = new Mesh(new BoxGeometry(2.6, 2.0, 0.5), screeMaterial);
      scar.position.set(-5.8, 9.6, -0.4);
      scar.rotation.set(0.1, 0.24, 0.3);
      scar.castShadow = true;
      tunnel.add(scar);
      const talus = new Mesh(new BoxGeometry(4.2, 1.1, 2.6), screeMaterial);
      talus.position.set(-4.6, 0.5, 2.4);
      talus.rotation.set(0.06, -0.18, 0.08);
      settle(talus, 0.02);
      talus.castShadow = true;
      talus.receiveShadow = true;
      tunnel.add(talus);
      const slabC = new Mesh(new BoxGeometry(1.6, 0.7, 1.4), rockMaterial);
      slabC.position.set(-3.2, 1.0, 2.8);
      slabC.rotation.set(0.3, 0.5, 0.4);
      settle(slabC, 0.02);
      slabC.castShadow = true;
      tunnel.add(slabC);
    }
    if (buried) {
      const cap = new Mesh(new BoxGeometry(9.0, 1.4, 5.6), rockMaterial);
      cap.position.set(-1.0, 11.1, -2.2);
      cap.rotation.set(0.02, 0.1, 0.04);
      cap.castShadow = true;
      cap.receiveShadow = true;
      tunnel.add(cap);
      const drift = new Mesh(new BoxGeometry(6.0, 0.7, 3.4), screeMaterial);
      drift.position.set(-0.6, 10.3, 0.6);
      drift.rotation.set(-0.08, 0.05, 0.03);
      drift.castShadow = true;
      tunnel.add(drift);
    }

    // Kerbs flanking the blocked lane, tying the road surface to the headwall.
    for (const sx of [-1, 1]) {
      const kerb = new Mesh(new BoxGeometry(0.6, 0.42, 5.0), darkConcreteMaterial);
      kerb.position.set(sx * 4.6, 0.21, 1.4);
      kerb.castShadow = true;
      kerb.receiveShadow = true;
      tunnel.add(kerb);
    }

    tunnel.userData.assetId = 'candidate-mountain-tunnel';
    return tunnel;
  },
};
