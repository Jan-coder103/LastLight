import { expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { hasClearTargetLine } from './targetVisibility';
import { chooseAssistedTarget } from './targeting';

it('keeps assist selection and repeated visibility checks working as a target moves beyond its last rendered pose', () => {
  const scenery = new Group();
  const origin = new Vector3(0, 12, 0);
  const target = { position: new Vector3(0, 1.05, -20) };
  const visible = (enemy: typeof target) => hasClearTargetLine(origin, enemy.position, [scenery]);
  // The render pose remains at spawn while simulation advances several fixed steps.
  const renderedPose = target.position.clone();
  const renderedZombie = new Mesh(new BoxGeometry(0.8, 2, 0.8), new MeshBasicMaterial());
  renderedZombie.position.copy(renderedPose);
  renderedZombie.updateMatrixWorld(true);
  const oldVisibilityRay = () =>
    new Raycaster(
      origin,
      target.position.clone().sub(origin).normalize(),
      0,
      origin.distanceTo(target.position) + 0.05,
    );
  expect(oldVisibilityRay().intersectObject(renderedZombie).length).toBeGreaterThan(0);
  for (let step = 0; step < 90; step++) {
    target.position.x += 0.04;
    target.position.z += 0.05;
    expect(
      chooseAssistedTarget(undefined, [{ target, distanceSquared: 40 ** 2 }], 68, visible),
    ).toBe(target);
    expect(visible(target)).toBe(true);
  }
  expect(target.position.distanceTo(renderedPose)).toBeGreaterThan(5);
  expect(oldVisibilityRay().intersectObject(renderedZombie)).toHaveLength(0);
});

it('rejects scenery between the camera and live target but accepts scenery behind it', () => {
  const wall = new Mesh(new BoxGeometry(8, 8, 1), new MeshBasicMaterial());
  wall.position.set(0, 4, -5);
  wall.updateMatrixWorld(true);
  const origin = new Vector3(0, 6, 0);
  const target = new Vector3(0, 1, -10);
  expect(hasClearTargetLine(origin, target, [wall])).toBe(false);
  wall.position.z = -15;
  wall.updateMatrixWorld(true);
  expect(hasClearTargetLine(origin, target, [wall])).toBe(true);
});
