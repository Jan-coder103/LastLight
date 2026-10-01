import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Coastal ferry terminal facade. Local +Z is the front: the quay side the player approaches from.
// A concrete base building carries a shallow canopy over a covered queue, a ticket window on the
// front wall, and a small signage gantry. Everything is indicative rather than detailed so the
// silhouette reads as a harbour building at distance.
const concreteMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'terminal-concrete';

const deckMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.95,
  flatShading: true,
});
deckMaterial.name = 'terminal-deck';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.85,
  metalness: 0.15,
  flatShading: true,
});
roofMaterial.name = 'terminal-roof';

const postMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.85,
  metalness: 0.25,
  flatShading: true,
});
postMaterial.name = 'terminal-post';

const glassMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.25,
  metalness: 0.1,
});
glassMaterial.name = 'terminal-glass';

const trimMaterial = new MeshStandardMaterial({
  color: '#89604c',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
trimMaterial.name = 'terminal-trim';

const signMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.7,
  metalness: 0,
  flatShading: true,
});
signMaterial.name = 'terminal-sign';

const BODY_W = 9.0;
const BODY_D = 5.0;
const BODY_H = 4.2;
const CANOPY_Y = 3.4;
const CANOPY_D = 4.6;
const QUEUE_X = 1.1;

function addPost(
  group: Group,
  x: number,
  z: number,
  top: number,
  radius: number,
): void {
  const h = top - 0.12;
  const post = new Mesh(new CylinderGeometry(radius, radius * 1.12, h, 6), postMaterial);
  post.position.set(x, 0.12 + h / 2, z);
  post.castShadow = true;
  group.add(post);
  const pad = new Mesh(new BoxGeometry(radius * 3.2, 0.12, radius * 3.2), postMaterial);
  pad.position.set(x, 0.06, z);
  group.add(pad);
}

export const candidateFerryTerminal: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-ferry-terminal',
  name: 'Ferry Terminal Shell',
  category: 'building',
  dimensions: { x: 10.2, y: 6.2, z: 8.3 },
  collider: {
    center: { x: 0, y: 2.1, z: -1.1 },
    size: { x: BODY_W + 0.2, y: 4.2, z: BODY_D + 0.2 },
  },
  interactionPoints: [
    { id: 'terminal-door', label: 'Ferry Terminal Door', position: { x: -1.4, y: 0, z: 1.9 } },
    { id: 'terminal-ticket', label: 'Ticket Window', position: { x: 2.6, y: 0, z: 2.0 } },
  ],
  createVisual(variant = 0) {
    const terminal = new Group();
    const brokenSign = variant === 2;
    const missingGlass = variant === 1;

    // Main base building: three coarse blocks so the wall breaks read as build-up rather than one
    // slab, plus a slightly proud plinth at the waterline.
    const plinth = new Mesh(new BoxGeometry(BODY_W + 0.5, 0.9, BODY_D + 0.5), deckMaterial);
    plinth.position.set(0, 0.45, -1.6);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    terminal.add(plinth);

    const body = new Mesh(new BoxGeometry(BODY_W, BODY_H - 0.9, BODY_D), concreteMaterial);
    body.position.set(0, 0.9 + (BODY_H - 0.9) / 2, -1.6);
    body.castShadow = true;
    body.receiveShadow = true;
    terminal.add(body);

    // Flat roof: one deck slab, a low parapet of four thin upstands around it, and a single plant
    // box. An earlier draft stacked a clerestory block plus two caps here and the whole building
    // read as a layer cake; one deck plus a parapet is what a quayside shed actually looks like.
    const roof = new Mesh(new BoxGeometry(BODY_W + 0.5, 0.3, BODY_D + 0.5), roofMaterial);
    roof.position.set(0, BODY_H + 0.15, -1.6);
    roof.castShadow = true;
    roof.receiveShadow = true;
    terminal.add(roof);
    for (const sz of [-1, 1]) {
      const upstand = new Mesh(new BoxGeometry(BODY_W + 0.5, 0.42, 0.18), deckMaterial);
      upstand.position.set(0, BODY_H + 0.5, -1.6 + (sz * (BODY_D + 0.5)) / 2);
      upstand.castShadow = true;
      terminal.add(upstand);
    }
    for (const sx of [-1, 1]) {
      const upstand = new Mesh(new BoxGeometry(0.18, 0.42, BODY_D + 0.5), deckMaterial);
      upstand.position.set((sx * (BODY_W + 0.5)) / 2, BODY_H + 0.5, -1.6);
      upstand.castShadow = true;
      terminal.add(upstand);
    }
    const plant = new Mesh(new BoxGeometry(1.8, 0.8, 1.4), roofMaterial);
    plant.position.set(-2.0, BODY_H + 0.7, -1.9);
    plant.castShadow = true;
    terminal.add(plant);
    const plantLid = new Mesh(new BoxGeometry(1.95, 0.12, 1.55), deckMaterial);
    plantLid.position.set(-2.0, BODY_H + 1.16, -1.9);
    plantLid.castShadow = true;
    terminal.add(plantLid);

    // Front face: recessed doorway, a ticket window with a small awning, and two high windows.
    const doorReveal = new Mesh(new BoxGeometry(2.0, 2.7, 0.3), deckMaterial);
    doorReveal.position.set(-1.4, 1.35 + 1.35, -1.6 + BODY_D / 2 - 0.1);
    terminal.add(doorReveal);
    const door = new Mesh(new BoxGeometry(1.5, 2.5, 0.14), trimMaterial);
    door.position.set(-1.4, 0.9 + 1.25, -1.6 + BODY_D / 2 - 0.02);
    door.castShadow = true;
    terminal.add(door);
    const doorBar = new Mesh(new BoxGeometry(1.6, 0.12, 0.1), postMaterial);
    doorBar.position.set(-1.4, 1.0, -1.6 + BODY_D / 2 + 0.06);
    terminal.add(doorBar);

    const ticketSurround = new Mesh(new BoxGeometry(2.3, 1.6, 0.24), deckMaterial);
    ticketSurround.position.set(2.6, 0.9 + 1.35, -1.6 + BODY_D / 2 - 0.06);
    terminal.add(ticketSurround);
    if (!missingGlass) {
      const ticketGlass = new Mesh(new BoxGeometry(1.9, 1.15, 0.1), glassMaterial);
      ticketGlass.position.set(2.6, 0.9 + 1.35, -1.6 + BODY_D / 2 + 0.02);
      terminal.add(ticketGlass);
    } else {
      // Broken out: a dark recessed panel and one shard left in the frame.
      const ticketVoid = new Mesh(new BoxGeometry(1.9, 1.15, 0.08), roofMaterial);
      ticketVoid.position.set(2.6, 0.9 + 1.35, -1.6 + BODY_D / 2 - 0.02);
      terminal.add(ticketVoid);
      const shard = new Mesh(new BoxGeometry(0.5, 0.8, 0.06), glassMaterial);
      shard.position.set(2.1, 0.9 + 1.15, -1.6 + BODY_D / 2 + 0.04);
      shard.rotation.z = 0.12;
      terminal.add(shard);
    }
    const ticketAwning = new Mesh(new BoxGeometry(2.6, 0.14, 0.7), roofMaterial);
    ticketAwning.position.set(2.6, 0.9 + 2.3, -1.6 + BODY_D / 2 + 0.3);
    ticketAwning.rotation.x = -0.16;
    ticketAwning.castShadow = true;
    terminal.add(ticketAwning);

    for (const x of [-3.1, 0, 3.1]) {
      const win = new Mesh(new BoxGeometry(1.5, 1.0, 0.12), glassMaterial);
      win.position.set(x, 0.9 + 2.55, -1.6 + BODY_D / 2 - 0.02);
      terminal.add(win);
      const lintel = new Mesh(new BoxGeometry(1.8, 0.16, 0.3), deckMaterial);
      lintel.position.set(x, 0.9 + 3.1, -1.6 + BODY_D / 2 - 0.1);
      terminal.add(lintel);
    }

    // Canopy over the covered queue: a single shallow monopitch slab on four posts, with a fascia
    // board along its low front edge. One pitched slab plus a fascia reads as a canopy; the earlier
    // flat slab plus a separate pitch board read as two roofs.
    const canopyPitch = 0.13;
    const canopy = new Mesh(new BoxGeometry(8.8, 0.22, CANOPY_D + 0.6), roofMaterial);
    canopy.position.set(0, CANOPY_Y + 0.55, 1.1);
    canopy.rotation.x = canopyPitch;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    terminal.add(canopy);
    const fascia = new Mesh(new BoxGeometry(8.8, 0.3, 0.14), deckMaterial);
    fascia.position.set(0, CANOPY_Y + 0.14, 1.1 + (CANOPY_D + 0.6) / 2);
    fascia.castShadow = true;
    terminal.add(fascia);
    for (const sx of [-1, 1]) {
      const rafter = new Mesh(new BoxGeometry(0.14, 0.2, CANOPY_D + 0.6), postMaterial);
      rafter.position.set(sx * 3.9, CANOPY_Y + 0.5, 1.1);
      rafter.rotation.x = canopyPitch;
      terminal.add(rafter);
    }
    const canopyBeam = new Mesh(new BoxGeometry(8.8, 0.24, 0.24), postMaterial);
    canopyBeam.position.set(0, CANOPY_Y - 0.1, -0.15);
    canopyBeam.castShadow = true;
    terminal.add(canopyBeam);
    for (const x of [-3.9, -1.3, 1.3, 3.9]) {
      addPost(terminal, x, -0.1, CANOPY_Y - 0.22, 0.14);
    }

    // Covered queue rails under the canopy: two runs of horizontal bars on short uprights.
    for (const z of [1.3, 2.3]) {
      for (const y of [0.55, 1.0]) {
        const rail = new Mesh(new BoxGeometry(5.0, 0.07, 0.07), postMaterial);
        rail.position.set(QUEUE_X, y, z);
        rail.castShadow = true;
        terminal.add(rail);
      }
      for (const x of [QUEUE_X - 2.4, QUEUE_X, QUEUE_X + 2.4]) {
        const stanchion = new Mesh(new BoxGeometry(0.08, 1.05, 0.08), postMaterial);
        stanchion.position.set(x, 0.53, z);
        terminal.add(stanchion);
      }
    }

    // Signage gantry over the queue: a post pair carrying a flat board, hung by two straps. The
    // board is the amber exception in the palette and is the small signal the front needs.
    if (!brokenSign) {
      for (const x of [3.2, 5.0]) {
        addPost(terminal, x, 2.3, 2.9, 0.1);
      }
      const gantry = new Mesh(new BoxGeometry(2.4, 0.1, 0.1), postMaterial);
      gantry.position.set(4.1, 2.86, 2.3);
      terminal.add(gantry);
      for (const x of [3.4, 4.8]) {
        const strap = new Mesh(new BoxGeometry(0.06, 0.3, 0.06), postMaterial);
        strap.position.set(x, 2.66, 2.3);
        terminal.add(strap);
      }
      const board = new Mesh(new BoxGeometry(2.1, 0.7, 0.08), signMaterial);
      board.position.set(4.1, 2.3, 2.3);
      board.castShadow = true;
      terminal.add(board);
      const boardFrame = new Mesh(new BoxGeometry(2.24, 0.84, 0.05), postMaterial);
      boardFrame.position.set(4.1, 2.3, 2.26);
      terminal.add(boardFrame);
    }

    // Mooring furniture on the quay side: two bollards and a coil-suggestion of deck rail. Kept to
    // four meshes so the prop does not out-detail the building.
    for (const x of [-4.4, 4.4]) {
      const bollard = new Mesh(new CylinderGeometry(0.2, 0.26, 0.7, 8), postMaterial);
      bollard.position.set(x, 0.35, 3.6);
      bollard.castShadow = true;
      terminal.add(bollard);
      const cap = new Mesh(new CylinderGeometry(0.24, 0.2, 0.14, 8), postMaterial);
      cap.position.set(x, 0.75, 3.6);
      cap.castShadow = true;
      terminal.add(cap);
    }
    for (const x of [-4.4, 4.4]) {
      const rail = new Mesh(new BoxGeometry(0.08, 0.9, 2.2), postMaterial);
      rail.position.set(x, 0.55, 2.6);
      rail.castShadow = true;
      terminal.add(rail);
    }

    // Weather vane on the clerestory: a small salt-worn finial, the only vertical accent above the
    // roof.
    const mast = new Mesh(new CylinderGeometry(0.05, 0.06, 1.2, 5), postMaterial);
    mast.position.set(2.6, BODY_H + 0.85, -1.9);
    mast.castShadow = true;
    terminal.add(mast);
    const vane = new Mesh(new ConeGeometry(0.2, 0.7, 4), trimMaterial);
    vane.position.set(2.6, BODY_H + 1.65, -1.9);
    vane.castShadow = true;
    terminal.add(vane);

    // Salt staining: two thin dark panels down the plinth so the base does not read as a clean box.
    for (const x of [-2.6, 1.9]) {
      const stain = new Mesh(new PlaneGeometry(1.4, 0.8), roofMaterial);
      stain.position.set(x, 0.5, -1.6 + BODY_D / 2 + 0.26);
      terminal.add(stain);
    }

    terminal.userData.assetId = 'candidate-ferry-terminal';
    return terminal;
  },
};
