import type { Firearm } from '../game/progression';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, SphereGeometry } from 'three';

export interface PlayerVisualRig {
  leftLeg: Group;
  rightLeg: Group;
  leftArm: Group;
  rightArm: Group;
  rifle: Group;
}

const jacket = new MeshStandardMaterial({ color: '#a96f45', roughness: 0.94, flatShading: true });
const jacketDark = new MeshStandardMaterial({
  color: '#775640',
  roughness: 0.96,
  flatShading: true,
});
const trousers = new MeshStandardMaterial({ color: '#303b36', roughness: 0.98, flatShading: true });
const gear = new MeshStandardMaterial({ color: '#3d4940', roughness: 1, flatShading: true });
const skin = new MeshStandardMaterial({ color: '#c59b76', roughness: 1, flatShading: true });
const metal = new MeshStandardMaterial({ color: '#292d2a', roughness: 0.68, metalness: 0.28 });
const mutedMetal = new MeshStandardMaterial({ color: '#555c54', roughness: 0.78, metalness: 0.2 });
const lens = new MeshStandardMaterial({
  color: '#667d7b',
  roughness: 0.35,
  metalness: 0.2,
  emissive: '#192322',
});

function addBox(
  parent: Group,
  width: number,
  height: number,
  depth: number,
  material: MeshStandardMaterial,
  x: number,
  y: number,
  z: number,
  castShadow = true,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = castShadow;
  parent.add(mesh);
  return mesh;
}

function buildRifle(): Group {
  const rifle = new Group();
  addBox(rifle, 0.15, 0.17, 0.43, gear, 0, 0, 0.01);
  addBox(rifle, 0.12, 0.12, 0.29, jacketDark, 0, -0.005, 0.34);
  addBox(rifle, 0.075, 0.075, 0.58, metal, 0, 0.035, -0.48);
  addBox(rifle, 0.17, 0.14, 0.39, mutedMetal, 0, 0.008, -0.24);
  addBox(rifle, 0.16, 0.28, 0.17, gear, 0, -0.205, -0.045);
  addBox(rifle, 0.11, 0.2, 0.14, metal, 0, -0.18, 0.14);
  addBox(rifle, 0.08, 0.16, 0.1, gear, 0, -0.18, 0.21);
  addBox(rifle, 0.15, 0.035, 0.27, metal, 0, 0.105, -0.16);
  addBox(rifle, 0.12, 0.12, 0.14, metal, 0, 0.19, -0.08);
  addBox(rifle, 0.105, 0.075, 0.11, lens, 0, 0.22, -0.08);
  addBox(rifle, 0.055, 0.06, 0.065, metal, 0, 0.015, -0.77);
  rifle.traverse((object) => {
    if (object instanceof Mesh) object.castShadow = false;
  });
  return rifle;
}

/** Shared scout model used by gameplay and the unapproved asset preview. */
export function createPlayerVisual(): Group {
  const player = new Group();

  const torso = addBox(player, 0.66, 0.78, 0.39, jacket, 0, 1.2, 0.01);
  torso.rotation.x = -0.035;
  addBox(player, 0.52, 0.36, 0.12, gear, 0, 1.16, -0.226);
  addBox(player, 0.58, 0.13, 0.43, jacketDark, 0, 0.78, 0.005);
  addBox(player, 0.2, 0.22, 0.12, mutedMetal, -0.2, 1.33, -0.3);
  addBox(player, 0.2, 0.22, 0.12, mutedMetal, 0.2, 1.33, -0.3);
  addBox(player, 0.25, 0.28, 0.18, gear, 0.22, 1.06, 0.25);
  addBox(player, 0.17, 0.24, 0.16, jacketDark, -0.22, 0.96, 0.24);

  const leftLeg = new Group();
  leftLeg.position.set(-0.19, 0.76, 0);
  addBox(leftLeg, 0.25, 0.5, 0.29, trousers, 0, -0.23, 0);
  const leftShin = new Group();
  leftShin.position.set(0, -0.46, -0.01);
  addBox(leftShin, 0.22, 0.43, 0.23, trousers, 0, -0.2, 0);
  addBox(leftShin, 0.27, 0.16, 0.38, jacketDark, 0, -0.46, -0.09);
  leftLeg.add(leftShin);

  const rightLeg = new Group();
  rightLeg.position.set(0.19, 0.76, 0);
  addBox(rightLeg, 0.25, 0.5, 0.29, trousers, 0, -0.23, 0);
  const rightShin = new Group();
  rightShin.position.set(0, -0.46, -0.01);
  addBox(rightShin, 0.22, 0.43, 0.23, trousers, 0, -0.2, 0);
  addBox(rightShin, 0.27, 0.16, 0.38, jacketDark, 0, -0.46, -0.09);
  rightLeg.add(rightShin);

  const leftArm = new Group();
  leftArm.position.set(-0.39, 1.48, -0.045);
  leftArm.rotation.x = -0.24;
  addBox(leftArm, 0.24, 0.42, 0.27, jacket, 0, -0.2, 0);
  addBox(leftArm, 0.21, 0.39, 0.24, jacketDark, 0, -0.57, -0.11);
  addBox(leftArm, 0.17, 0.15, 0.2, gear, 0, -0.83, -0.15);

  const rightArm = new Group();
  rightArm.position.set(0.39, 1.48, -0.045);
  rightArm.rotation.x = -0.43;
  addBox(rightArm, 0.24, 0.42, 0.27, jacket, 0, -0.2, 0);
  addBox(rightArm, 0.21, 0.39, 0.24, jacketDark, 0, -0.57, -0.11);
  addBox(rightArm, 0.17, 0.15, 0.2, gear, 0, -0.83, -0.15);

  player.add(leftLeg, rightLeg, leftArm, rightArm);
  const neck = new Mesh(new SphereGeometry(0.13, 7, 5), skin);
  neck.position.set(0, 1.61, -0.01);
  neck.castShadow = true;
  player.add(neck);
  const head = new Mesh(new SphereGeometry(0.27, 9, 7), skin);
  head.position.set(0, 1.84, -0.035);
  head.scale.set(0.9, 1.08, 0.92);
  head.castShadow = true;
  player.add(head);
  addBox(player, 0.53, 0.11, 0.56, gear, 0, 2.0, -0.02);
  const helmet = new Mesh(new SphereGeometry(0.295, 9, 5), gear);
  helmet.position.set(0, 2.035, -0.045);
  helmet.scale.set(1.04, 0.48, 0.99);
  helmet.castShadow = true;
  player.add(helmet);
  addBox(player, 0.48, 0.065, 0.05, mutedMetal, 0, 1.96, -0.285);
  addBox(player, 0.07, 0.06, 0.05, lens, -0.095, 1.86, -0.269);
  addBox(player, 0.07, 0.06, 0.05, lens, 0.095, 1.86, -0.269);

  const rifle = buildRifle();
  rifle.position.set(0.35, 1.31, -0.43);
  rifle.rotation.x = -0.08;
  player.add(rifle);

  const shadow = new Mesh(
    new SphereGeometry(0.66, 12, 6),
    new MeshStandardMaterial({ color: '#20251e', transparent: true, opacity: 0.23, roughness: 1 }),
  );
  shadow.scale.set(1, 0.035, 0.82);
  shadow.position.y = 0.045;
  shadow.receiveShadow = true;
  player.add(shadow);

  player.userData.rig = { leftLeg, rightLeg, leftArm, rightArm, rifle } satisfies PlayerVisualRig;
  player.name = 'Player scout';
  return player;
}

export interface FirstPersonWeapon {
  visual: Group;
  muzzle: Object3D;
}

/** Compact camera-mounted weapon viewmodel for the first-person camera. */
export function createFirstPersonWeapon(): FirstPersonWeapon {
  const visual = buildRifle();
  visual.position.set(0.34, -0.26, -0.68);
  visual.rotation.set(0.015, -0.035, -0.018);
  const muzzle = new Object3D();
  muzzle.position.set(0, 0.035, -0.82);
  visual.add(muzzle);
  visual.name = 'First-person rifle';
  return { visual, muzzle };
}

export function createFirearmVisual(weapon: Firearm): Group {
  if (weapon === 'rifle' || weapon === 'shotgun') return buildRifle();
  const gun = new Group();
  gun.name = weapon;
  if (weapon === 'handgun') {
    addBox(gun, 0.1, 0.12, 0.32, mutedMetal, 0, 0, -0.12, false);
    addBox(gun, 0.09, 0.22, 0.12, gear, 0, -0.13, 0.01, false);
    addBox(gun, 0.055, 0.055, 0.12, metal, 0, 0, -0.31, false);
  } else {
    addBox(gun, 0.13, 0.17, 0.42, mutedMetal, 0, 0, -0.1, false);
    addBox(gun, 0.08, 0.07, 0.23, metal, 0, 0, -0.43, false);
    addBox(gun, 0.11, 0.29, 0.12, gear, 0, -0.19, -0.02, false);
    addBox(gun, 0.12, 0.1, 0.2, gear, 0, 0, 0.21, false);
  }
  return gun;
}
function replaceGunGeometry(root: Group, weapon: Firearm): void {
  root.traverse((object) => {
    if (object instanceof Mesh) object.geometry.dispose();
  });
  root.clear();
  root.add(createFirearmVisual(weapon));
}
export function setScoutFirearm(visual: Group, weapon: Firearm): void {
  const rig = visual.userData.rig as PlayerVisualRig;
  if (rig) replaceGunGeometry(rig.rifle, weapon);
}
export function setFirstPersonFirearm(view: FirstPersonWeapon, weapon: Firearm): void {
  replaceGunGeometry(view.visual, weapon);
  view.visual.add(view.muzzle);
  view.muzzle.position.set(
    0,
    0.035,
    weapon === 'handgun' ? -0.38 : weapon === 'smg' ? -0.56 : -0.82,
  );
  view.visual.name = `First-person ${weapon}`;
}
