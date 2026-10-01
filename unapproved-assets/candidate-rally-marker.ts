import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Evacuation rally marker. Local +Z is the front of the sign, i.e. the side a player approaches.
// A failed extraction point: a leaning route sign on a rusted pole, a spent flare stand with one
// unburnt flare, a ring of six concrete set-markers painted in a fading band, and a scatter of
// abandoned kit bags. The painted ring is the read — a circle on the ground says "assemble here"
// at any distance, and it is the only ground-painted element in the candidate set.
const concreteMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'rally-concrete';

const paintMaterial = new MeshStandardMaterial({
  color: '#b09a66',
  roughness: 0.9,
  metalness: 0,
  flatShading: true,
});
paintMaterial.name = 'rally-paint';

const wornPaintMaterial = new MeshStandardMaterial({
  color: '#7d7358',
  roughness: 1,
  flatShading: true,
});
wornPaintMaterial.name = 'rally-worn-paint';

const steelMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'rally-steel';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'rally-rust';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'rally-signal';

const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'rally-timber';

const canvasMaterial = new MeshStandardMaterial({
  color: '#42684d',
  roughness: 1,
  flatShading: true,
});
canvasMaterial.name = 'rally-canvas';

const socketMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.9,
  metalness: 0.25,
  flatShading: true,
});
socketMaterial.name = 'rally-socket';

const RING_R = 2.1;
const POOL_H = 2.5;

export const candidateRallyMarker: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-rally-marker',
  name: 'Evacuation Rally Marker',
  category: 'prop',
  dimensions: { x: 5.4, y: 2.9, z: 5.4 },
  collider: {
    center: { x: -0.6, y: 1.0, z: -0.2 },
    size: { x: 0.9, y: 2.0, z: 0.7 },
  },
  interactionPoints: [
    { id: 'rally-sign', label: 'Rally Sign', position: { x: 0.6, y: 0, z: 1.1 } },
  ],
  createVisual(variant = 0) {
    const marker = new Group();
    const signGone = variant === 2;
    const flaresLeft = variant !== 1;

    // Ground pool: a worn disc of exposed hardstanding inside the painted ring, so the ring reads
    // as painted onto a prepared surface rather than floating on open ground.
    const pool = new Mesh(new CylinderGeometry(RING_R + 0.5, RING_R + 0.6, 0.06, 12), wornPaintMaterial);
    pool.position.set(0, 0.03, 0);
    pool.receiveShadow = true;
    marker.add(pool);

    // Painted ring: eight flat trapezoid blocks in the band colour, every third one worn through
    // to bare concrete. That irregularity is what stops it looking like a decal.
    const bandCount = 12;
    for (let i = 0; i < bandCount; i++) {
      const a = (i / bandCount) * Math.PI * 2;
      const worn = i % 4 === 1;
      const seg = new Mesh(
        new BoxGeometry(0.86, 0.02, 0.26),
        worn ? concreteMaterial : paintMaterial,
      );
      seg.position.set(Math.cos(a) * RING_R, 0.07, Math.sin(a) * RING_R);
      seg.rotation.y = -a - Math.PI / 2;
      seg.receiveShadow = true;
      marker.add(seg);
    }
    // A second, inner band, half worn. Two concentric bands is what says "marked area" rather
    // than "one circle".
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      const worn = i % 2 === 0;
      const seg = new Mesh(new BoxGeometry(0.6, 0.02, 0.17), worn ? wornPaintMaterial : paintMaterial);
      seg.position.set(Math.cos(a) * (RING_R - 0.7), 0.07, Math.sin(a) * (RING_R - 0.7));
      seg.rotation.y = -a - Math.PI / 2;
      marker.add(seg);
    }

    // Route sign on a leaning pole: a plate on two brackets, with three arrow bars and a faded
    // place name block. Variant 2 has the plate gone and only the brackets left.
    const signGroup = new Group();
    signGroup.position.set(-0.7, 0, -0.2);
    // −90° about Y so the plate face, which is built looking down its own +X, ends up looking +Z.
    signGroup.rotation.y = -Math.PI / 2;
    marker.add(signGroup);
    const poleBase = new Mesh(new BoxGeometry(0.5, 0.2, 0.5), concreteMaterial);
    poleBase.position.set(0, 0.1, 0);
    poleBase.castShadow = true;
    poleBase.receiveShadow = true;
    signGroup.add(poleBase);
    const pole = new Mesh(new CylinderGeometry(0.07, 0.08, POOL_H, 8), steelMaterial);
    pole.position.set(0.12, 0.2 + POOL_H / 2, -0.2);
    pole.rotation.z = -0.05;
    pole.castShadow = true;
    signGroup.add(pole);
    for (const y of [1.9, 2.3]) {
      const bracket = new Mesh(new BoxGeometry(0.3, 0.07, 0.07), steelMaterial);
      bracket.position.set(0.42, y, -0.2);
      bracket.rotation.z = -0.05;
      signGroup.add(bracket);
    }
    if (!signGone) {
      const plate = new Mesh(new BoxGeometry(0.06, 0.56, 1.4), steelMaterial);
      plate.position.set(0.3, 2.1, 0);
      plate.rotation.z = -0.05;
      plate.castShadow = true;
      plate.receiveShadow = true;
      signGroup.add(plate);
      // Face plate in the signal colour, with three arrow bars pointing the way out.
      const face = new Mesh(new BoxGeometry(0.03, 0.46, 1.26), signalMaterial);
      face.position.set(0.34, 2.1, 0);
      face.rotation.z = -0.05;
      signGroup.add(face);
      for (let i = 0; i < 3; i++) {
        const arrow = new Mesh(new ConeGeometry(0.11, 0.2, 3), steelMaterial);
        arrow.position.set(0.37, 2.26 - i * 0.16, -0.16);
        arrow.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
        signGroup.add(arrow);
      }
      // A stencilled name block, and the two bolts that hold the plate on.
      const nameBlock = new Mesh(new BoxGeometry(0.04, 0.14, 0.6), steelMaterial);
      nameBlock.position.set(0.37, 2.0, 0.36);
      signGroup.add(nameBlock);
      for (const sz of [-1, 1]) {
        const bolt = new Mesh(new CylinderGeometry(0.03, 0.03, 0.05, 6), rustMaterial);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(0.36, 2.1, sz * 0.5);
        signGroup.add(bolt);
      }
    } else {
      // Torn-off plate face, hanging by one bracket.
      const hanging = new Mesh(new BoxGeometry(0.05, 0.4, 1.1), rustMaterial);
      hanging.position.set(0.36, 1.82, 0.28);
      hanging.rotation.set(0, 0.2, 0.55);
      hanging.castShadow = true;
      signGroup.add(hanging);
    }

    // Flare stand: a short steel post with a cross head, a spent flare socket and — in variants 0
    // and 2 — one live flare standing in it. The live flare is the small warm point the palette
    // allows.
    const standPost = new Mesh(new CylinderGeometry(0.06, 0.08, 0.9, 6), steelMaterial);
    standPost.position.set(0.9, 0.45, 0.6);
    standPost.castShadow = true;
    marker.add(standPost);
    const standFoot = new Mesh(new BoxGeometry(0.36, 0.08, 0.36), rustMaterial);
    standFoot.position.set(0.9, 0.04, 0.6);
    standFoot.castShadow = true;
    marker.add(standFoot);
    const standHead = new Mesh(new BoxGeometry(0.5, 0.06, 0.06), steelMaterial);
    standHead.position.set(0.9, 0.9, 0.6);
    standHead.castShadow = true;
    marker.add(standHead);
    for (const sx of [-1, 1]) {
      const socket = new Mesh(new CylinderGeometry(0.045, 0.05, 0.12, 6), socketMaterial);
      socket.position.set(0.9 + sx * 0.22, 0.98, 0.6);
      socket.castShadow = true;
      marker.add(socket);
    }
    // The spent flare: a stub in the left socket, always present, dulled.
    const spent = new Mesh(new CylinderGeometry(0.04, 0.04, 0.08, 6), rustMaterial);
    spent.position.set(0.68, 1.03, 0.6);
    marker.add(spent);
    if (flaresLeft) {
      const live = new Mesh(new CylinderGeometry(0.04, 0.045, 0.3, 6), signalMaterial);
      live.position.set(1.12, 1.1, 0.6);
      live.castShadow = true;
      marker.add(live);
      const cap = new Mesh(new CylinderGeometry(0.025, 0.03, 0.05, 6), steelMaterial);
      cap.position.set(1.12, 1.27, 0.6);
      marker.add(cap);
    } else {
      // Variant 1: both sockets empty, and a spent flare dropped on the ground.
      const dropped = new Mesh(new CylinderGeometry(0.04, 0.04, 0.26, 6), rustMaterial);
      dropped.position.set(1.4, 0.04, 0.9);
      dropped.rotation.set(Math.PI / 2, 0, 0.6);
      dropped.castShadow = true;
      marker.add(dropped);
    }

    // Kit bags: three flattened boxes inside the ring, in a fading green, left where people set
    // them down. This is the "failed extraction" evidence.
    const bagColors = [canvasMaterial, canvasMaterial, timberMaterial];
    for (let i = 0; i < 3; i++) {
      const a = 1.1 + i * 0.9;
      const bag = new Mesh(new BoxGeometry(0.52, 0.24, 0.34), bagColors[i]!);
      bag.position.set(Math.cos(a) * 1.2, 0.14, Math.sin(a) * 1.2);
      bag.rotation.set(0, -a, 0.03 * (i % 2 === 0 ? 1 : -1));
      bag.castShadow = true;
      bag.receiveShadow = true;
      marker.add(bag);
      const strap = new Mesh(new BoxGeometry(0.08, 0.26, 0.36), timberMaterial);
      strap.position.copy(bag.position);
      strap.rotation.copy(bag.rotation);
      bag.add(strap);
    }

    // A coil of rope and a discarded helmet, four meshes of scale cue outside the ring.
    const coil = new Mesh(new TorusGeometry(0.2, 0.05, 5, 10), timberMaterial);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(-1.9, 0.06, 1.3);
    coil.castShadow = true;
    marker.add(coil);
    const helmet = new Mesh(new ConeGeometry(0.19, 0.16, 8), steelMaterial);
    helmet.position.set(1.9, 0.2, -1.3);
    helmet.rotation.set(1.5, 0.4, 0.2);
    helmet.castShadow = true;
    marker.add(helmet);
    const helmetBand = new Mesh(new TorusGeometry(0.19, 0.03, 4, 10), rustMaterial);
    helmetBand.position.set(1.9, 0.24, -1.3);
    helmetBand.rotation.set(0.2, 0, 0.3);
    marker.add(helmetBand);

    marker.userData.assetId = 'candidate-rally-marker';
    return marker;
  },
};
