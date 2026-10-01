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
// Handmade supply cache. A scavenger's crate: a timber box with corner irons, a rope lashing, a
// patch panel that does not match, and a lid held down by a length of strapping. Local +Z is the
// front of the crate, i.e. the side a player will face it from. The silhouette has to carry at
// distance, so the distinguishing elements — the raised ridge lid and the rope crown — are the
// biggest shapes on the prop, not the details.
const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'cache-timber';

const paleTimberMaterial = new MeshStandardMaterial({
  color: '#655744',
  roughness: 1,
  flatShading: true,
});
paleTimberMaterial.name = 'cache-pale-timber';

const strapMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
strapMaterial.name = 'cache-strap';

const ropeMaterial = new MeshStandardMaterial({
  color: '#7d7358',
  roughness: 1,
  flatShading: true,
});
ropeMaterial.name = 'cache-rope';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'cache-rust';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'cache-signal';

const CANVAS = 1.05;
const BODY_H = 0.62;
const LID_H = 0.26;

export const candidateSupplyCache: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-supply-cache',
  name: 'Handmade Supply Cache',
  category: 'prop',
  dimensions: { x: 2.1, y: 1.2, z: 1.4 },
  collider: { center: { x: 0, y: 0.45, z: 0 }, size: { x: 1.12, y: 0.9, z: 1.12 } },
  interactionPoints: [
    { id: 'cache-lid', label: 'Supply Cache', position: { x: 0, y: 0, z: 0.85 } },
  ],
  createVisual(variant = 0) {
    const cache = new Group();
    const lashed = variant !== 0;
    const lidOpen = variant === 2;

    // Base pallet: four short feet under a skid, so the crate is off the ground and does not read
    // as a solid block sitting on the terrain.
    for (const sz of [-1, 1]) {
      const skid = new Mesh(new BoxGeometry(CANVAS + 0.14, 0.08, 0.14), paleTimberMaterial);
      skid.position.set(0, 0.04, sz * 0.38);
      skid.castShadow = true;
      skid.receiveShadow = true;
      cache.add(skid);
    }
    for (const sx of [-1, 1]) {
      const foot = new Mesh(new BoxGeometry(0.16, 0.1, 0.9), paleTimberMaterial);
      foot.position.set(sx * 0.44, 0.05, 0);
      foot.castShadow = true;
      cache.add(foot);
    }

    // Crate body: four slatted sides rather than one box, so the timber courses read and the prop
    // is not a cube. Three courses per side, with the gaps doing the work.
    for (let course = 0; course < 3; course++) {
      const y = 0.1 + BODY_H / 3 * (course + 0.5);
      for (const sz of [-1, 1]) {
        const slat = new Mesh(new BoxGeometry(CANVAS, BODY_H / 3 - 0.02, 0.06), timberMaterial);
        slat.position.set(0, y, (sz * CANVAS) / 2);
        slat.castShadow = true;
        slat.receiveShadow = true;
        cache.add(slat);
      }
      for (const sx of [-1, 1]) {
        const slat = new Mesh(new BoxGeometry(0.06, BODY_H / 3 - 0.02, CANVAS - 0.1), timberMaterial);
        slat.position.set((sx * CANVAS) / 2, y, 0);
        slat.castShadow = true;
        slat.receiveShadow = true;
        cache.add(slat);
      }
    }
    // Corner stiles: the reinforcement the idea asks for, and the part that gives the crate its
    // vertical edges at distance.
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const stile = new Mesh(new BoxGeometry(0.1, BODY_H + 0.06, 0.1), paleTimberMaterial);
        stile.position.set(sx * (CANVAS / 2 - 0.02), 0.1 + BODY_H / 2, sz * (CANVAS / 2 - 0.02));
        stile.castShadow = true;
        cache.add(stile);
        // Corner irons: a wrapped angle at the top and bottom of each stile.
        for (const sy of [0, 1]) {
          const iron = new Mesh(new BoxGeometry(0.13, 0.07, 0.13), strapMaterial);
          iron.position.set(
            sx * (CANVAS / 2 - 0.02),
            0.12 + BODY_H * sy,
            sz * (CANVAS / 2 - 0.02),
          );
          iron.castShadow = true;
          cache.add(iron);
        }
      }
    }

    // Lid: a flat deck plus a raised ridge, which is the one element that has to read at 40 m.
    // Variant 2 lifts the deck off one edge and leans it on the rim.
    const lidPivot = new Group();
    lidPivot.position.set(0, 0.1 + BODY_H, -CANVAS / 2 + 0.03);
    cache.add(lidPivot);
    const lidTilt = lidOpen ? -0.55 : 0;
    const lidDeck = new Mesh(new BoxGeometry(CANVAS + 0.06, 0.07, CANVAS + 0.06), paleTimberMaterial);
    lidDeck.position.set(0, 0.1, CANVAS / 2);
    lidDeck.rotation.x = lidTilt;
    lidDeck.castShadow = true;
    lidDeck.receiveShadow = true;
    lidPivot.add(lidDeck);
    for (let ridge = 0; ridge < 2; ridge++) {
      const cap = new Mesh(
        new BoxGeometry(CANVAS + 0.1, LID_H - 0.09, 0.22),
        timberMaterial,
      );
      cap.position.set(0, 0.12 + LID_H / 2 - 0.05 + ridge * 0.12, CANVAS / 2 + lidTilt * ridge * 0.9);
      cap.rotation.x = lidTilt;
      cap.castShadow = true;
      lidPivot.add(cap);
    }
    // Two battens across the lid, in a different timber, so the deck is not one flat plate.
    for (const sz of [-0.28, 0.28]) {
      const batten = new Mesh(new BoxGeometry(CANVAS + 0.12, 0.06, 0.1), timberMaterial);
      batten.position.set(0, 0.18, CANVAS / 2 + sz);
      batten.rotation.x = lidTilt;
      batten.castShadow = true;
      lidPivot.add(batten);
    }

    // Lashing strap over the lid and down both sides, with a buckle. This is the detail that says
    // "somebody packed this deliberately" rather than "somebody found a box".
    if (lashed) {
      const strapY = 0.1 + BODY_H + LID_H + 0.04;
      for (const sx of [-1, 1]) {
        const overLid = new Mesh(new BoxGeometry(0.09, 0.06, CANVAS + 0.2), strapMaterial);
        overLid.position.set(sx * 0.26, strapY, 0);
        overLid.castShadow = true;
        cache.add(overLid);
        // Each strap drops down the front and back faces of the crate.
        for (const sz of [-1, 1]) {
          const down = new Mesh(
            new BoxGeometry(0.07, BODY_H + LID_H + 0.1, 0.05),
            strapMaterial,
          );
          down.position.set(sx * 0.26, 0.1 + (BODY_H + LID_H) / 2, sz * (CANVAS + 0.06) / 2);
          down.castShadow = true;
          cache.add(down);
        }
      }
      const buckle = new Mesh(new BoxGeometry(0.2, 0.12, 0.1), rustMaterial);
      buckle.position.set(0.26, strapY + 0.06, 0.3);
      buckle.castShadow = true;
      cache.add(buckle);
    }

    // Rope coiled beside the crate and a second coil hooked over the corner: rope is named in the
    // idea, and a coil is the cheapest way to make it read.
    const coil = new Mesh(new TorusGeometry(0.19, 0.05, 5, 10), ropeMaterial);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0.72, 0.05, 0.34);
    coil.castShadow = true;
    cache.add(coil);
    const coil2 = new Mesh(new TorusGeometry(0.15, 0.045, 5, 10), ropeMaterial);
    coil2.rotation.set(Math.PI / 2, 0, 0.4);
    coil2.position.set(0.78, 0.16, 0.16);
    coil2.castShadow = true;
    cache.add(coil2);
    // Rope tail running from the coil up onto the lid.
    const tail = new Mesh(new CylinderGeometry(0.035, 0.035, 0.55, 5), ropeMaterial);
    tail.position.set(0.62, 0.32, 0.24);
    tail.rotation.set(0.5, 0, 0.45);
    cache.add(tail);

    // Patch panel: a mismatched board nailed over a split on the front, plus two strap staples.
    const patch = new Mesh(new BoxGeometry(0.42, 0.3, 0.04), paleTimberMaterial);
    patch.position.set(-0.26, 0.34, CANVAS / 2 + 0.04);
    patch.rotation.z = 0.04;
    patch.castShadow = true;
    cache.add(patch);
    for (const sy of [-1, 1]) {
      const staple = new Mesh(new BoxGeometry(0.06, 0.05, 0.07), strapMaterial);
      staple.position.set(-0.26 + sy * 0.16, 0.34, CANVAS / 2 + 0.06);
      cache.add(staple);
    }
    // A stencilled mark on the front: three short bars in the signal colour. It is the small warm
    // accent and the only thing that says the crate is a supply crate rather than a box.
    for (let i = 0; i < 3; i++) {
      const bar = new Mesh(new BoxGeometry(0.2, 0.035, 0.03), signalMaterial);
      bar.position.set(0.26, 0.44 - i * 0.075, CANVAS / 2 + 0.04);
      cache.add(bar);
    }

    // Ground detail: a folded tarp and a small marker cairn, two props' worth of context in four
    // meshes. Removed in variant 1 so the crate can be seen alone.
    if (variant !== 1) {
      const tarp = new Mesh(new BoxGeometry(0.5, 0.1, 0.4), ropeMaterial);
      tarp.position.set(-0.78, 0.075, -0.3);
      tarp.rotation.set(0, 0.4, 0.05);
      tarp.castShadow = true;
      cache.add(tarp);
      for (let i = 0; i < 3; i++) {
        const stone = new Mesh(
          new ConeGeometry(0.09 - i * 0.015, 0.1 - i * 0.02, 5),
          paleTimberMaterial,
        );
        stone.position.set(-0.42, 0.05 + i * 0.06, -0.62);
        stone.rotation.set(0.05 * i, i * 1.2, 0.04 * i);
        stone.castShadow = true;
        cache.add(stone);
      }
    }

    cache.userData.assetId = 'candidate-supply-cache';
    return cache;
  },
};
