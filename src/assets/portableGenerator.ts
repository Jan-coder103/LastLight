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

// Owner-approved authored asset, registered in the live catalog.
// Portable generator. Local +Z is the front of the machine, i.e. the panel end a player faces. A
// skid-frame set with an engine block, a cylindrical alternator, a tubular exhaust with a
// rain cap, a control panel with a lever and two dials, and a folded carry handle. The frame is
// open tube, so the player can see and reach the engine — that is what makes it a portable set
// rather than a painted box.
const frameMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
frameMaterial.name = 'gen-frame';

const engineMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.8,
  metalness: 0.25,
  flatShading: true,
});
engineMaterial.name = 'gen-engine';

const panelMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
panelMaterial.name = 'gen-panel';

const darkMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.9,
  metalness: 0.2,
  flatShading: true,
});
darkMaterial.name = 'gen-dark';

const rustMaterial = new MeshStandardMaterial({
  color: '#8e5142',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'gen-rust';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'gen-signal';

const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.25,
  metalness: 0.1,
});
glassMaterial.name = 'gen-glass';

const cableMaterial = new MeshStandardMaterial({
  color: '#292f2b',
  roughness: 0.95,
  metalness: 0,
  flatShading: true,
});
cableMaterial.name = 'gen-cable';

const L = 1.45;
const W = 0.92;
const SKID = 0.12;
const DECK = SKID + 0.1;

export const portableGenerator: AuthoredAsset = {
  schemaVersion: 1,
  id: 'portable-generator',
  name: 'Portable Generator',
  category: 'prop',
  dimensions: { x: 2.4, y: 1.2, z: 1.5 },
  collider: { center: { x: 0, y: 0.42, z: 0 }, size: { x: 1.45, y: 0.84, z: 0.92 } },
  interactionPoints: [
    { id: 'gen-panel', label: 'Generator Control Panel', position: { x: 0, y: 0, z: 0.78 } },
  ],
  createVisual(variant = 0) {
    const gen = new Group();
    const run = variant !== 0;
    const noPanel = variant === 2;

    // Skid frame: two runners, three cross members, and four short legs. The frame is what says
    // "this can be carried", and it is the only part that touches the ground.
    for (const sx of [-1, 1]) {
      const runner = new Mesh(new BoxGeometry(0.11, SKID, L), frameMaterial);
      runner.position.set(sx * (W / 2 - 0.06), SKID / 2, 0);
      runner.castShadow = true;
      runner.receiveShadow = true;
      gen.add(runner);
      for (const sz of [-1, 1]) {
        const foot = new Mesh(new BoxGeometry(0.2, 0.05, 0.2), frameMaterial);
        foot.position.set(sx * (W / 2 - 0.06), 0.025, sz * (L / 2 - 0.18));
        foot.receiveShadow = true;
        gen.add(foot);
      }
    }
    for (const sz of [-1, 0.3, 1]) {
      const cross = new Mesh(new BoxGeometry(W - 0.1, 0.09, 0.09), frameMaterial);
      cross.position.set(0, DECK - 0.045, sz * (L / 2 - 0.1));
      cross.castShadow = true;
      gen.add(cross);
    }
    const deck = new Mesh(new BoxGeometry(W - 0.08, 0.05, L - 0.14), frameMaterial);
    deck.position.set(0, DECK, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    gen.add(deck);

    // Engine block: a stepped casting with a valve cover, an air filter can and a recoil
    // housing on the flywheel end. All of it is on the −X side, the control panel on +X.
    const block = new Mesh(new BoxGeometry(0.5, 0.34, 0.62), engineMaterial);
    block.position.set(-0.16, DECK + 0.25, -0.06);
    block.castShadow = true;
    block.receiveShadow = true;
    gen.add(block);
    const sump = new Mesh(new BoxGeometry(0.42, 0.14, 0.5), darkMaterial);
    sump.position.set(-0.16, DECK + 0.1, -0.06);
    sump.castShadow = true;
    gen.add(sump);
    const cover = new Mesh(new BoxGeometry(0.44, 0.12, 0.5), engineMaterial);
    cover.position.set(-0.16, DECK + 0.46, -0.06);
    cover.castShadow = true;
    gen.add(cover);
    for (let i = 0; i < 3; i++) {
      const stud = new Mesh(new BoxGeometry(0.38, 0.03, 0.04), darkMaterial);
      stud.position.set(-0.16, DECK + 0.53, -0.22 + i * 0.16);
      gen.add(stud);
    }
    const recoil = new Mesh(new CylinderGeometry(0.2, 0.2, 0.1, 10), darkMaterial);
    recoil.rotation.z = Math.PI / 2;
    recoil.position.set(-0.42, DECK + 0.25, -0.06);
    recoil.castShadow = true;
    gen.add(recoil);
    const airFilter = new Mesh(new CylinderGeometry(0.12, 0.12, 0.18, 8), darkMaterial);
    airFilter.position.set(-0.16, DECK + 0.62, -0.36);
    airFilter.castShadow = true;
    gen.add(airFilter);
    const intake = new Mesh(new CylinderGeometry(0.05, 0.05, 0.16, 6), engineMaterial);
    intake.position.set(-0.16, DECK + 0.55, -0.24);
    intake.rotation.x = 0.6;
    gen.add(intake);

    // Alternator: a cylinder on the +X end with cooling fins and a terminal box on top.
    const alternator = new Mesh(new CylinderGeometry(0.22, 0.22, 0.42, 10), engineMaterial);
    alternator.rotation.z = Math.PI / 2;
    alternator.position.set(0.28, DECK + 0.26, -0.06);
    alternator.castShadow = true;
    alternator.receiveShadow = true;
    gen.add(alternator);
    for (let i = 0; i < 5; i++) {
      const fin = new Mesh(new BoxGeometry(0.4, 0.05, 0.05), darkMaterial);
      fin.position.set(0.28, DECK + 0.1 + i * 0.08, -0.06 + (i % 2 === 0 ? 0.19 : -0.19));
      fin.castShadow = true;
      gen.add(fin);
    }
    const terminalBox = new Mesh(new BoxGeometry(0.24, 0.16, 0.2), engineMaterial);
    terminalBox.position.set(0.28, DECK + 0.52, -0.06);
    terminalBox.castShadow = true;
    gen.add(terminalBox);
    const outputCable = new Mesh(new CylinderGeometry(0.04, 0.04, 0.5, 6), cableMaterial);
    outputCable.position.set(0.34, DECK + 0.3, 0.36);
    outputCable.rotation.set(0.9, 0, 0.3);
    outputCable.castShadow = true;
    gen.add(outputCable);
    const plug = new Mesh(new BoxGeometry(0.12, 0.12, 0.1), darkMaterial);
    plug.position.set(0.42, DECK + 0.08, 0.58);
    plug.rotation.set(0.4, 0.5, 0);
    plug.castShadow = true;
    gen.add(plug);

    // Exhaust: a manifold off the block, a pipe up and back, a muffler can, and a rain cap on a
    // short stalk. The cap is what says "outdoors".
    const manifold = new Mesh(new CylinderGeometry(0.05, 0.05, 0.22, 6), darkMaterial);
    manifold.position.set(-0.16, DECK + 0.5, 0.22);
    manifold.rotation.x = Math.PI / 2;
    gen.add(manifold);
    const riser = new Mesh(new CylinderGeometry(0.05, 0.05, 0.42, 6), darkMaterial);
    riser.position.set(-0.16, DECK + 0.7, 0.3);
    riser.rotation.x = -0.2;
    riser.castShadow = true;
    gen.add(riser);
    const muffler = new Mesh(new CylinderGeometry(0.1, 0.1, 0.3, 8), rustMaterial);
    muffler.rotation.x = Math.PI / 2;
    muffler.position.set(-0.16, DECK + 0.88, 0.36);
    muffler.castShadow = true;
    gen.add(muffler);
    const tailpipe = new Mesh(new CylinderGeometry(0.04, 0.045, 0.2, 6), darkMaterial);
    tailpipe.position.set(-0.16, DECK + 0.86, 0.58);
    tailpipe.rotation.x = 1.2;
    tailpipe.castShadow = true;
    gen.add(tailpipe);
    const rainCap = new Mesh(new ConeGeometry(0.07, 0.06, 6), darkMaterial);
    rainCap.position.set(-0.16, DECK + 0.8, 0.68);
    rainCap.castShadow = true;
    gen.add(rainCap);
    const capStalk = new Mesh(new CylinderGeometry(0.02, 0.02, 0.08, 5), darkMaterial);
    capStalk.position.set(-0.16, DECK + 0.84, 0.68);
    gen.add(capStalk);
    // Exhaust clamp and a hanging rubber grommet, two meshes that sell the plumbing.
    const clamp = new Mesh(new TorusGeometry(0.055, 0.014, 4, 8), frameMaterial);
    clamp.rotation.x = Math.PI / 2;
    clamp.position.set(-0.16, DECK + 0.6, 0.26);
    gen.add(clamp);

    // Control panel on the +X face, canted toward the operator. Two dials, a lever, a rocker and
    // a fuel tap. Variant 2 has the whole panel torn off, leaving the mounting face and the
    // harness, which is the clearest stripped-state read on the prop.
    if (!noPanel) {
      const panelBox = new Mesh(new BoxGeometry(0.1, 0.44, 0.5), panelMaterial);
      panelBox.position.set(W / 2 - 0.06, DECK + 0.32, 0.3);
      panelBox.rotation.z = -0.12;
      panelBox.castShadow = true;
      panelBox.receiveShadow = true;
      gen.add(panelBox);
      for (let i = 0; i < 2; i++) {
        const dial = new Mesh(new CylinderGeometry(0.07, 0.07, 0.03, 10), glassMaterial);
        dial.rotation.z = Math.PI / 2 - 0.12;
        dial.position.set(W / 2 + 0.01, DECK + 0.44 - i * 0.16, 0.18);
        dial.castShadow = true;
        gen.add(dial);
        const bezel = new Mesh(new TorusGeometry(0.075, 0.014, 4, 10), frameMaterial);
        bezel.rotation.y = Math.PI / 2 - 0.12;
        bezel.position.set(W / 2 + 0.01, DECK + 0.44 - i * 0.16, 0.18);
        gen.add(bezel);
        const needle = new Mesh(new BoxGeometry(0.015, 0.06, 0.015), signalMaterial);
        needle.position.set(W / 2 + 0.03, DECK + 0.46 - i * 0.16, 0.18);
        needle.rotation.z = -0.4 + i * 0.6;
        gen.add(needle);
      }
      const leverSlot = new Mesh(new BoxGeometry(0.03, 0.2, 0.05), darkMaterial);
      leverSlot.position.set(W / 2 + 0.01, DECK + 0.2, 0.44);
      leverSlot.rotation.z = -0.12;
      gen.add(leverSlot);
      const lever = new Mesh(new CylinderGeometry(0.02, 0.02, 0.18, 5), frameMaterial);
      lever.position.set(W / 2 + 0.03, DECK + (run ? 0.3 : 0.16), 0.44);
      lever.rotation.z = -0.12;
      lever.castShadow = true;
      gen.add(lever);
      const leverKnob = new Mesh(new BoxGeometry(0.06, 0.05, 0.06), rustMaterial);
      leverKnob.position.set(W / 2 + 0.04, DECK + (run ? 0.38 : 0.24), 0.44);
      leverKnob.castShadow = true;
      gen.add(leverKnob);
      const rocker = new Mesh(new BoxGeometry(0.03, 0.06, 0.09), darkMaterial);
      rocker.position.set(W / 2 + 0.01, DECK + 0.34, 0.44);
      rocker.rotation.z = -0.12;
      gen.add(rocker);
      const tap = new Mesh(new CylinderGeometry(0.04, 0.04, 0.06, 6), frameMaterial);
      tap.rotation.x = Math.PI / 2;
      tap.position.set(W / 2 + 0.01, DECK + 0.12, 0.5);
      gen.add(tap);
      const tapHandle = new Mesh(new BoxGeometry(0.09, 0.03, 0.03), signalMaterial);
      tapHandle.position.set(W / 2 + 0.03, DECK + 0.12, 0.54);
      tapHandle.rotation.y = 0.5;
      gen.add(tapHandle);
    } else {
      const mountFace = new Mesh(new BoxGeometry(0.06, 0.5, 0.56), engineMaterial);
      mountFace.position.set(W / 2 - 0.09, DECK + 0.32, 0.3);
      mountFace.castShadow = true;
      gen.add(mountFace);
      for (let i = 0; i < 3; i++) {
        const wire = new Mesh(new CylinderGeometry(0.02, 0.02, 0.22, 5), cableMaterial);
        wire.position.set(W / 2 - 0.14, DECK + 0.2 + i * 0.1, 0.3 + (i % 2) * 0.1);
        wire.rotation.set(0.2, 0, 0.5);
        gen.add(wire);
      }
      const hangingLever = new Mesh(new CylinderGeometry(0.02, 0.02, 0.16, 5), frameMaterial);
      hangingLever.position.set(W / 2 - 0.1, DECK + 0.12, 0.46);
      hangingLever.rotation.set(0.4, 0, 0.9);
      gen.add(hangingLever);
    }

    // Fuel tank: a saddle tank slung under the deck on the +Z half, with a filler cap and a sight
    // glass. It is what gives the machine its mass from the side.
    const tank = new Mesh(new BoxGeometry(0.6, 0.24, 0.5), panelMaterial);
    tank.position.set(0, DECK + 0.1, 0.42);
    tank.castShadow = true;
    tank.receiveShadow = true;
    gen.add(tank);
    const filler = new Mesh(new CylinderGeometry(0.07, 0.07, 0.05, 8), frameMaterial);
    filler.position.set(0, DECK + 0.24, 0.5);
    filler.castShadow = true;
    gen.add(filler);
    const sightGlass = new Mesh(new BoxGeometry(0.03, 0.14, 0.03), glassMaterial);
    sightGlass.position.set(0.31, DECK + 0.12, 0.5);
    gen.add(sightGlass);
    for (let i = 0; i < 2; i++) {
      const strapBand = new Mesh(new BoxGeometry(0.64, 0.05, 0.06), frameMaterial);
      strapBand.position.set(0, DECK + 0.1, 0.26 + i * 0.32);
      strapBand.castShadow = true;
      gen.add(strapBand);
    }

    // Carry handle: a tube loop folded down along the −Z end. The posts run from the deck up to
    // the bar; an earlier draft used short posts floating at bar height, which left the handle
    // hovering clear of the machine.
    for (const sx of [-1, 1]) {
      const post = new Mesh(new CylinderGeometry(0.03, 0.03, 0.7, 6), frameMaterial);
      post.position.set(sx * 0.28, DECK + 0.37, -L / 2 + 0.12);
      post.castShadow = true;
      gen.add(post);
    }
    const handleBar = new Mesh(new CylinderGeometry(0.03, 0.03, 0.62, 6), frameMaterial);
    handleBar.rotation.z = Math.PI / 2;
    handleBar.position.set(0, DECK + 0.72, -L / 2 + 0.12);
    handleBar.castShadow = true;
    gen.add(handleBar);
    const grip = new Mesh(new CylinderGeometry(0.04, 0.04, 0.24, 6), darkMaterial);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0, DECK + 0.72, -L / 2 + 0.12);
    grip.castShadow = true;
    gen.add(grip);

    // Ground clutter: a folded jerry can and a coil of lead, four meshes, dropped in variant 1 so
    // the machine can be read alone.
    if (variant !== 1) {
      const jerry = new Mesh(new BoxGeometry(0.3, 0.4, 0.16), panelMaterial);
      jerry.position.set(-1.0, 0.2, 0.2);
      jerry.rotation.set(0, 0.3, 0);
      jerry.castShadow = true;
      gen.add(jerry);
      const jerryCap = new Mesh(new CylinderGeometry(0.04, 0.04, 0.04, 6), frameMaterial);
      jerryCap.position.set(-0.9, 0.42, 0.14);
      gen.add(jerryCap);
      const lead = new Mesh(new TorusGeometry(0.14, 0.035, 5, 10), cableMaterial);
      lead.rotation.x = Math.PI / 2;
      lead.position.set(0.9, 0.04, 0.4);
      lead.castShadow = true;
      gen.add(lead);
      const rag = new Mesh(new BoxGeometry(0.22, 0.05, 0.18), darkMaterial);
      rag.position.set(0.95, 0.03, -0.2);
      rag.rotation.y = 0.6;
      rag.castShadow = true;
      gen.add(rag);
    }

    gen.userData.assetId = 'candidate-portable-generator';
    return gen;
  },
};
