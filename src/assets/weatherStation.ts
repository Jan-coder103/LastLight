import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Isolated ridge weather station. Local +Z is the front of the hut, i.e. the side a player arrives
// on, and the instrument mast rises behind it so the hut does not hide the sensors. A small
// concrete hut with a pitched roof, a guyed sensor mast with a wind vane and anemometer cups, a
// Stevenson screen on a leg, and a snow bank around the base. Intended as a lone silhouette on a
// pass or a fire lookout clearing.
// Revision: the roof slabs now bed onto the wall tops instead of hovering clear of them, and the
// mast-head cross arm and wind vane are joined to the mast by real posts instead of floating.
const concreteMaterial = new MeshStandardMaterial({
  color: '#aaa18f',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'station-concrete';

const panelMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.7,
  metalness: 0.15,
  flatShading: true,
});
panelMaterial.name = 'station-panel';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.85,
  metalness: 0.2,
  flatShading: true,
});
roofMaterial.name = 'station-roof';

const mastMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.3,
  flatShading: true,
});
mastMaterial.name = 'station-mast';

const snowMaterial = new MeshStandardMaterial({
  color: '#b6b3a6',
  roughness: 1,
  flatShading: true,
});
snowMaterial.name = 'station-snow';

const screenMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.85,
  flatShading: true,
});
screenMaterial.name = 'station-screen';

const hazardMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.1,
  flatShading: true,
});
hazardMaterial.name = 'station-hazard';

const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.25,
  metalness: 0.1,
});
glassMaterial.name = 'station-glass';

const HUT_W = 3.2;
const HUT_D = 2.6;
const WALL_H = 2.5;
const MAST_H = 7.4;
const MAST_X = -3.0;
const MAST_Z = -2.4;

export const weatherStation: AuthoredAsset = {
  schemaVersion: 1,
  id: 'weather-station',
  name: 'Weather Station Hut',
  category: 'prop',
  dimensions: { x: 10.2, y: 8.4, z: 9.6 },
  collider: {
    center: { x: 0, y: 1.35, z: -0.4 },
    size: { x: HUT_W + 0.4, y: 2.7, z: HUT_D + 0.4 },
  },
  interactionPoints: [
    { id: 'station-door', label: 'Weather Station Door', position: { x: 0, y: 0, z: 1.4 } },
  ],
  createVisual(variant = 0) {
    const station = new Group();
    const vaneDown = variant === 2;
    const snowDeep = variant !== 0;

    // Hut: concrete plinth, a single wall block, and a pitched roof from two rotated slabs. The
    // roof overhang is generous because snow load is what the silhouette has to say.
    const plinth = new Mesh(new BoxGeometry(HUT_W + 0.5, 0.4, HUT_D + 0.5), concreteMaterial);
    plinth.position.set(0, 0.2, -0.4);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    station.add(plinth);
    const walls = new Mesh(new BoxGeometry(HUT_W, WALL_H, HUT_D), panelMaterial);
    walls.position.set(0, 0.4 + WALL_H / 2, -0.4);
    walls.castShadow = true;
    walls.receiveShadow = true;
    station.add(walls);
    const band = new Mesh(new BoxGeometry(HUT_W + 0.06, 0.24, HUT_D + 0.06), roofMaterial);
    band.position.set(0, 0.4 + WALL_H - 0.12, -0.4);
    band.castShadow = true;
    station.add(band);

    const roofPitch = 0.62;
    const roofRun = HUT_D / 2 + 0.55;
    const slopeAngle = Math.atan(roofPitch);
    const slopeLen = Math.hypot(roofRun, roofRun * roofPitch);
    // Centre height of each slab. The slab underside must pass through the wall top exactly at
    // the wall face; the first draft lifted the roof by a fixed 8 cm instead, which left the
    // whole roof hovering ~33 cm clear of the walls with an open gap under both gable ends.
    const wallTop = 0.4 + WALL_H;
    const slopeY = wallTop + (HUT_D / 2 - roofRun / 2) * roofPitch + 0.08 / Math.cos(slopeAngle);
    for (const sz of [-1, 1]) {
      const slope = new Mesh(new BoxGeometry(HUT_W + 0.7, 0.16, slopeLen), roofMaterial);
      slope.position.set(0, slopeY, -0.4 + (sz * roofRun) / 2);
      slope.rotation.x = sz * slopeAngle;
      slope.castShadow = true;
      slope.receiveShadow = true;
      station.add(slope);
    }
    const ridge = new Mesh(new BoxGeometry(HUT_W + 0.8, 0.18, 0.24), mastMaterial);
    ridge.position.set(0, slopeY + (roofRun * roofPitch) / 2 + 0.06, -0.4);
    ridge.castShadow = true;
    station.add(ridge);
    // Snow load on the roof: two flat slabs lying on the slopes, in variant 1 and 2 only.
    if (snowDeep) {
      for (const sz of [-1, 1]) {
        const cap = new Mesh(new BoxGeometry(HUT_W + 0.5, 0.12, slopeLen * 0.86), snowMaterial);
        cap.position.set(0, slopeY + 0.12, -0.4 + (sz * roofRun) / 2);
        cap.rotation.x = sz * slopeAngle;
        cap.castShadow = true;
        station.add(cap);
      }
    }

    // Door on +Z with a small hood, and one window on the -X side.
    const doorSurround = new Mesh(new BoxGeometry(1.0, 2.0, 0.12), concreteMaterial);
    doorSurround.position.set(0, 1.4, -0.4 + HUT_D / 2 - 0.02);
    station.add(doorSurround);
    const door = new Mesh(new BoxGeometry(0.82, 1.85, 0.1), roofMaterial);
    door.position.set(0, 1.35, -0.4 + HUT_D / 2 + 0.03);
    door.castShadow = true;
    station.add(door);
    const handle = new Mesh(new BoxGeometry(0.08, 0.16, 0.08), mastMaterial);
    handle.position.set(0.3, 1.3, -0.4 + HUT_D / 2 + 0.1);
    station.add(handle);
    const hood = new Mesh(new BoxGeometry(1.1, 0.1, 0.4), roofMaterial);
    hood.position.set(0, 2.5, -0.4 + HUT_D / 2 + 0.16);
    hood.rotation.x = -0.25;
    hood.castShadow = true;
    station.add(hood);
    const windowFrame = new Mesh(new BoxGeometry(0.14, 0.9, 1.1), concreteMaterial);
    windowFrame.position.set(-HUT_W / 2 - 0.01, 1.75, -0.4);
    station.add(windowFrame);
    const windowGlass = new Mesh(new BoxGeometry(0.08, 0.72, 0.92), glassMaterial);
    windowGlass.position.set(-HUT_W / 2 - 0.06, 1.75, -0.4);
    station.add(windowGlass);

    // Instrument mast behind the hut, stepped to the ground on a small pad and guyed out. Three
    // stepped sections so the taper is a read, not a taper.
    const mastPad = new Mesh(new BoxGeometry(0.7, 0.24, 0.7), concreteMaterial);
    mastPad.position.set(-3.0, 0.12, -2.4);
    mastPad.receiveShadow = true;
    station.add(mastPad);
    const mastSections: [number, number, number][] = [
      [0.075, 0, 2.5],
      [0.065, 2.5, 2.5],
      [0.055, 5.0, MAST_H - 5.0],
    ];
    for (const [radius, y0, h] of mastSections) {
      const section = new Mesh(new CylinderGeometry(radius, radius * 1.1, h, 6), mastMaterial);
      section.position.set(MAST_X, 0.24 + y0 + h / 2, MAST_Z);
      section.castShadow = true;
      station.add(section);
    }
    // Three guy stays. A cylinder's axis is +Y, and setting rotation.x and rotation.z together
    // with the default XYZ order does NOT aim it along an arbitrary direction — it tips the
    // cylinder close to horizontal. The stays are therefore aimed with a quaternion, which is
    // deterministic and gives a taut wire rather than a floating bar.
    const up = new Vector3(0, 1, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const anchorX = MAST_X + Math.cos(a) * 2.3;
      const anchorZ = MAST_Z + Math.sin(a) * 2.3;
      const rise = MAST_H - 0.35;
      const dir = new Vector3(MAST_X - anchorX, rise, MAST_Z - anchorZ);
      const len = dir.length();
      const guy = new Mesh(new CylinderGeometry(0.02, 0.02, len, 4), mastMaterial);
      guy.quaternion.setFromUnitVectors(up, dir.normalize());
      guy.position.set((MAST_X + anchorX) / 2, 0.3 + rise / 2, (MAST_Z + anchorZ) / 2);
      station.add(guy);
      const stake = new Mesh(new BoxGeometry(0.18, 0.5, 0.18), mastMaterial);
      stake.position.set(anchorX, 0.25, anchorZ);
      stake.castShadow = true;
      station.add(stake);
    }

    // Anemometer and wind vane at the mast head. A short cap post joins the mast head to the
    // cross arm — without it the arm and everything mounted on it floated clear of the mast —
    // and a second post carries the vane above the arm. The vane is missing its tail fin in
    // variant 2, which is the clearest "stripped" signal on the asset.
    const mastCap = new Mesh(new CylinderGeometry(0.03, 0.045, 0.34, 6), mastMaterial);
    mastCap.position.set(MAST_X, MAST_H + 0.28, MAST_Z);
    mastCap.castShadow = true;
    station.add(mastCap);
    const crossArm = new Mesh(new BoxGeometry(0.9, 0.05, 0.05), mastMaterial);
    crossArm.position.set(MAST_X, MAST_H + 0.45, MAST_Z);
    station.add(crossArm);
    for (const sx of [-1, 1]) {
      const cupArm = new Mesh(new BoxGeometry(0.05, 0.05, 0.34), mastMaterial);
      cupArm.position.set(MAST_X + sx * 0.4, MAST_H + 0.45, MAST_Z);
      station.add(cupArm);
      for (let c = 0; c < 3; c++) {
        const a = (c / 3) * Math.PI * 2;
        const cup = new Mesh(new ConeGeometry(0.07, 0.12, 5, 1, true), screenMaterial);
        cup.position.set(
          MAST_X + sx * 0.4 + Math.cos(a) * 0.14,
          MAST_H + 0.5,
          MAST_Z + Math.sin(a) * 0.14,
        );
        cup.rotation.set(Math.PI / 2, 0, -a);
        cup.castShadow = true;
        station.add(cup);
      }
    }
    if (!vaneDown) {
      const vanePost = new Mesh(new CylinderGeometry(0.025, 0.025, 0.45, 5), mastMaterial);
      vanePost.position.set(MAST_X, MAST_H + 0.675, MAST_Z);
      station.add(vanePost);
      const vaneStem = new Mesh(new CylinderGeometry(0.03, 0.03, 0.5, 5), mastMaterial);
      vaneStem.rotation.x = Math.PI / 2;
      vaneStem.position.set(MAST_X, MAST_H + 0.9, MAST_Z - 0.3);
      station.add(vaneStem);
      const vaneFin = new Mesh(new BoxGeometry(0.03, 0.2, 0.34), hazardMaterial);
      vaneFin.position.set(MAST_X, MAST_H + 0.9, MAST_Z - 0.5);
      vaneFin.castShadow = true;
      station.add(vaneFin);
      const vaneNose = new Mesh(new ConeGeometry(0.08, 0.32, 4), mastMaterial);
      vaneNose.rotation.x = Math.PI / 2;
      vaneNose.position.set(MAST_X, MAST_H + 0.9, MAST_Z - 0.02);
      station.add(vaneNose);
    } else {
      const brokenStem = new Mesh(new BoxGeometry(0.05, 0.05, 0.22), mastMaterial);
      brokenStem.position.set(MAST_X, MAST_H + 0.9, MAST_Z - 0.12);
      brokenStem.rotation.x = 0.5;
      station.add(brokenStem);
    }
    // Rain gauge and a small junction box on the mast, so the mast is not a bare stick.
    const gauge = new Mesh(new CylinderGeometry(0.11, 0.09, 0.22, 8), screenMaterial);
    gauge.position.set(MAST_X, MAST_H - 0.5, MAST_Z + 0.22);
    gauge.castShadow = true;
    station.add(gauge);
    const junction = new Mesh(new BoxGeometry(0.24, 0.3, 0.16), panelMaterial);
    junction.position.set(MAST_X, 1.7, MAST_Z + 0.18);
    station.add(junction);

    // Stevenson screen: a louvred white box on two legs beside the hut, angled to sit level.
    for (const sx of [-1, 1]) {
      const leg = new Mesh(new BoxGeometry(0.09, 1.0, 0.09), mastMaterial);
      leg.position.set(2.7 + sx * 0.28, 0.5, 1.1);
      leg.castShadow = true;
      station.add(leg);
    }
    const screenBody = new Mesh(new BoxGeometry(0.8, 0.6, 0.6), screenMaterial);
    screenBody.position.set(2.7, 1.3, 1.1);
    screenBody.castShadow = true;
    station.add(screenBody);
    for (let i = 0; i < 4; i++) {
      const louvre = new Mesh(new BoxGeometry(0.84, 0.05, 0.1), mastMaterial);
      louvre.position.set(2.7, 1.1 + i * 0.14, 1.1 + 0.31);
      louvre.rotation.x = 0.3;
      station.add(louvre);
    }
    const screenLid = new Mesh(new BoxGeometry(0.9, 0.08, 0.7), screenMaterial);
    screenLid.position.set(2.7, 1.63, 1.1);
    screenLid.rotation.x = -0.18;
    screenLid.castShadow = true;
    station.add(screenLid);

    // Snow bank around the base, deeper in variants 1 and 2, plus a shoveled path to the door.
    const bank = new Mesh(
      new BoxGeometry(HUT_W + 1.6, snowDeep ? 0.8 : 0.4, HUT_D + 1.2),
      snowMaterial,
    );
    bank.position.set(0, snowDeep ? 0.44 : 0.2, -0.4);
    bank.castShadow = true;
    bank.receiveShadow = true;
    station.add(bank);
    const path = new Mesh(new BoxGeometry(1.1, 0.16, 1.3), screenMaterial);
    path.position.set(0, 0.1, 1.1);
    path.receiveShadow = true;
    station.add(path);

    addPowerCable(station);

    station.userData.assetId = 'candidate-weather-station';
    return station;
  },
};

function addPowerCable(group: Group): void {
  // Power cable run from the hut to the mast: two sagging spans made from short rotated bars.
  for (let i = 0; i < 3; i++) {
    const t = (i + 0.5) / 3;
    const span = new Mesh(new BoxGeometry(0.035, 0.035, 0.5), mastMaterial);
    span.position.set(-1.0 - t * 1.9, 1.9 - Math.sin(t * Math.PI) * 0.18, -1.0 - t * 1.3);
    span.rotation.set(0.5, 0.3, 0.1);
    group.add(span);
  }
}
