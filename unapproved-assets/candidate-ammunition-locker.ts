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
// Locked ammunition locker. Local +Z is the front of the locker, i.e. the door face, and the +X
// side is the end a player will approach from. A squat steel box: a two-leaf door with a centre
// latch and a hasp, a ventilation louvre on the lid, and a stencilled cartridge round on each
// end face so the contents read before the player is next to it. Deliberately military-green and
// deliberately small — it should be found, not advertised.
// Revision: the concrete plinth slab is gone (the box now sits directly on the ground), the
// front-face stencil text, corner gussets, rail bands, leaf ribs and handle standoffs are gone,
// and both end faces carry the amber cartridge mark.
const lockerMaterial = new MeshStandardMaterial({
  color: '#42684d',
  roughness: 0.85,
  metalness: 0.2,
  flatShading: true,
});
lockerMaterial.name = 'locker-body';

const doorMaterial = new MeshStandardMaterial({
  color: '#355842',
  roughness: 0.85,
  metalness: 0.2,
  flatShading: true,
});
doorMaterial.name = 'locker-door';

const frameMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
frameMaterial.name = 'locker-frame';

const rustMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.95,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'locker-rust';

const signalMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
signalMaterial.name = 'locker-signal';

const stoneMaterial = new MeshStandardMaterial({
  color: '#797762',
  roughness: 1,
  flatShading: true,
});
stoneMaterial.name = 'locker-stone';

const W = 1.32;
const D = 0.78;
const H = 0.9;

export const candidateAmmunitionLocker: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-ammunition-locker',
  name: 'Locked Ammunition Locker',
  category: 'prop',
  dimensions: { x: 2.2, y: 1.0, z: 1.0 },
  collider: { center: { x: 0, y: 0.45, z: 0 }, size: { x: 1.32, y: 0.9, z: 0.78 } },
  interactionPoints: [
    { id: 'locker-latch', label: 'Locked Ammunition Locker', position: { x: 0, y: 0, z: 0.6 } },
  ],
  createVisual(variant = 0) {
    const locker = new Group();
    const doorsOpen = variant !== 0;
    const forced = variant === 2;

    // Carcass: body, lid with a drip edge, and a base skirt. The box sits straight on the ground.
    const body = new Mesh(new BoxGeometry(W, H - 0.1, D), lockerMaterial);
    body.position.set(0, (H - 0.1) / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    locker.add(body);
    const lid = new Mesh(new BoxGeometry(W + 0.08, 0.1, D + 0.08), frameMaterial);
    lid.position.set(0, H - 0.05, 0);
    lid.castShadow = true;
    locker.add(lid);
    const skirt = new Mesh(new BoxGeometry(W + 0.04, 0.07, D + 0.04), frameMaterial);
    skirt.position.set(0, 0.035, 0);
    skirt.castShadow = true;
    locker.add(skirt);

    // Ventilation louvre on the lid: four angled slats, and the only shape on the top face.
    for (let i = 0; i < 4; i++) {
      const slat = new Mesh(new BoxGeometry(0.44, 0.03, 0.07), frameMaterial);
      slat.position.set(0, H + 0.02, -0.2 + i * 0.12);
      slat.rotation.x = 0.45;
      locker.add(slat);
    }
    const rainLip = new Mesh(new BoxGeometry(W + 0.12, 0.04, 0.06), frameMaterial);
    rainLip.position.set(0, H + 0.05, D / 2 + 0.02);
    rainLip.castShadow = true;
    locker.add(rainLip);

    // Two door leaves on vertical hinge posts. Variant 0 keeps them shut; 1 and 2 swing them out so
    // the interior and the two ammunition cases inside are visible.
    for (const sx of [-1, 1]) {
      const hinge = new Mesh(new CylinderGeometry(0.03, 0.03, H - 0.22, 6), frameMaterial);
      hinge.position.set(sx * (W / 2 - 0.05), H / 2 - 0.03, D / 2 + 0.04);
      locker.add(hinge);
    }
    for (const sx of [-1, 1]) {
      const leafPivot = new Group();
      leafPivot.position.set(sx * (W / 2 - 0.05), 0, D / 2 + 0.04);
      leafPivot.rotation.y = doorsOpen ? sx * 1.25 : 0;
      locker.add(leafPivot);
      const leaf = new Mesh(new BoxGeometry(W / 2 - 0.07, H - 0.16, 0.04), doorMaterial);
      leaf.position.set(-sx * (W / 4 - 0.02), (H - 0.16) / 2, 0);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      leafPivot.add(leaf);
    }

    // Centre latch: a barrel bolt across the join, a hasp and staple for a padlock, and the handle
    // the player would actually grab.
    const latchBar = new Mesh(new CylinderGeometry(0.022, 0.022, 0.3, 6), frameMaterial);
    latchBar.rotation.z = Math.PI / 2;
    latchBar.position.set(0, H * 0.52, D / 2 + 0.08);
    if (forced) {
      latchBar.rotation.y = 0.5;
      latchBar.position.set(0.1, H * 0.52, D / 2 + 0.14);
    }
    latchBar.castShadow = true;
    locker.add(latchBar);
    const latchKeep = new Mesh(new BoxGeometry(0.09, 0.12, 0.06), frameMaterial);
    latchKeep.position.set(-0.14, H * 0.52, D / 2 + 0.06);
    locker.add(latchKeep);
    const hasp = new Mesh(new BoxGeometry(0.14, 0.16, 0.03), frameMaterial);
    hasp.position.set(0, H * 0.52 + 0.18, D / 2 + 0.04);
    locker.add(hasp);
    const handle = new Mesh(new BoxGeometry(0.3, 0.05, 0.05), frameMaterial);
    handle.position.set(0, H * 0.4, D / 2 + 0.07);
    handle.castShadow = true;
    locker.add(handle);
    // Padlock. Present but closed in variant 0, swung open on the staple in variants 1 and 2.
    const padlockPivot = new Group();
    padlockPivot.position.set(0, H * 0.52 + 0.14, D / 2 + 0.06);
    padlockPivot.rotation.z = doorsOpen ? 0.9 : 0;
    locker.add(padlockPivot);
    const shackle = new Mesh(new TorusGeometry(0.045, 0.012, 4, 8, Math.PI), frameMaterial);
    shackle.position.set(0, 0.07, 0);
    padlockPivot.add(shackle);
    const padBody = new Mesh(new BoxGeometry(0.09, 0.1, 0.05), rustMaterial);
    padBody.position.set(0, 0.0, 0);
    padBody.castShadow = true;
    padlockPivot.add(padBody);

    // Cartridge round stencilled on each end face inside a thin painted border: rim, case, and
    // tip, flattened against the steel. The amber is the functional "this is ordnance" marker, so
    // it is the sanctioned warm colour, and it is the only marking the box carries.
    for (const sx of [-1, 1]) {
      const markX = sx * (W / 2 + 0.015);
      for (const by of [-0.17, 0.17]) {
        const borderBar = new Mesh(new BoxGeometry(0.03, 0.02, 0.66), signalMaterial);
        borderBar.position.set(markX, 0.5 + by, 0);
        locker.add(borderBar);
      }
      for (const bz of [-0.325, 0.325]) {
        const borderEnd = new Mesh(new BoxGeometry(0.03, 0.34, 0.02), signalMaterial);
        borderEnd.position.set(markX, 0.5, bz);
        locker.add(borderEnd);
      }
      const rim = new Mesh(new CylinderGeometry(0.08, 0.08, 0.03, 8), signalMaterial);
      rim.rotation.x = Math.PI / 2;
      rim.scale.x = 0.3;
      rim.position.set(markX, 0.5, -0.2);
      locker.add(rim);
      const caseBody = new Mesh(new CylinderGeometry(0.07, 0.07, 0.24, 8), signalMaterial);
      caseBody.rotation.x = Math.PI / 2;
      caseBody.scale.x = 0.3;
      caseBody.position.set(markX, 0.5, -0.08);
      locker.add(caseBody);
      const tip = new Mesh(new ConeGeometry(0.07, 0.18, 8), signalMaterial);
      tip.rotation.x = Math.PI / 2;
      tip.scale.x = 0.3;
      tip.position.set(markX, 0.5, 0.13);
      locker.add(tip);
    }

    // Contents, visible only when the doors are open: two ammunition cases and a divider.
    if (doorsOpen) {
      const floorPlate = new Mesh(new BoxGeometry(W - 0.12, 0.03, D - 0.12), frameMaterial);
      floorPlate.position.set(0, 0.06, -0.02);
      locker.add(floorPlate);
      for (const sx of [-1, 1]) {
        const divider = new Mesh(new BoxGeometry(0.04, H - 0.3, D - 0.14), frameMaterial);
        divider.position.set(sx * (W / 6), H / 2 - 0.1, -0.02);
        locker.add(divider);
      }
      for (const [x, z, ry] of [
        [-0.36, -0.06, 0.06],
        [0.34, 0.04, -0.12],
        [0.3, -0.16, 0.3],
      ] as const) {
        const ammoCase = new Mesh(new BoxGeometry(0.34, 0.16, 0.22), rustMaterial);
        ammoCase.position.set(x, 0.15, z);
        ammoCase.rotation.y = ry;
        ammoCase.castShadow = true;
        locker.add(ammoCase);
        const caseLid = new Mesh(new BoxGeometry(0.35, 0.03, 0.23), frameMaterial);
        caseLid.position.set(x, 0.24, z);
        caseLid.rotation.y = ry;
        caseLid.castShadow = true;
        locker.add(caseLid);
      }
    }

    // Foreground detail: a coil of rope and a stone holding it down, so the locker is not the only
    // thing in the frame. Dropped in variant 1.
    if (variant !== 1) {
      const coil = new Mesh(new TorusGeometry(0.16, 0.045, 5, 10), frameMaterial);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(-0.86, 0.05, 0.3);
      coil.castShadow = true;
      locker.add(coil);
      const stone = new Mesh(new BoxGeometry(0.18, 0.1, 0.16), stoneMaterial);
      stone.position.set(-0.86, 0.09, 0.3);
      stone.rotation.y = 0.4;
      stone.castShadow = true;
      locker.add(stone);
    }

    locker.userData.assetId = 'candidate-ammunition-locker';
    return locker;
  },
};
