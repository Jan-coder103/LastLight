import {
  Group,
  LOD,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Vector3,
} from 'three';
import { expect, it } from 'vitest';
import { explosiveBarrel } from '../assets/explosiveBarrel';
import { ExplosiveBarrelVisual } from './ExplosiveBarrelVisual';

it('blinks every LOD dark red, restores its color, and removes the exploded placement', () => {
  const scene = new Group();
  const barrel = new LOD();
  barrel.addLevel(explosiveBarrel.createVisual(), 0);
  barrel.addLevel(explosiveBarrel.createLowDetailVisual!(), 58);
  barrel.addLevel(explosiveBarrel.createVeryLowDetailVisual!(), 120);
  scene.add(barrel);
  const shells: MeshStandardMaterial[] = [];
  barrel.traverse((part) => {
    if (
      part instanceof Mesh &&
      (part.material as MeshStandardMaterial).name.startsWith('barrel-shell')
    ) {
      // World placements clone warning materials before constructing the controller.
      part.material = (part.material as MeshStandardMaterial).clone();
      shells.push(part.material as MeshStandardMaterial);
    }
  });
  const originals = shells.map((material) => material.color.clone());
  const visual = new ExplosiveBarrelVisual(barrel);
  visual.setBlinking(true);
  for (const material of shells) expect(material.color.getHexString()).toBe('390706');
  visual.setBlinking(false);
  shells.forEach((material, index) => expect(material.color.equals(originals[index]!)).toBe(true));
  visual.detonate();
  const camera = new PerspectiveCamera();
  camera.position.set(0, 0, 200);
  barrel.update(camera);
  expect(barrel.parent).toBeNull();
  expect(barrel.visible).toBe(false);
  expect(
    new Raycaster(new Vector3(0, 0.5, 4), new Vector3(0, 0, -1)).intersectObject(scene, true),
  ).toHaveLength(0);
});
