import { Object3D, Raycaster, Vector3 } from 'three';

/** Test the live target point against scenery, independent of the actor's render pose/LOD. */
export function hasClearTargetLine(
  origin: Vector3,
  target: Vector3,
  obstacles: Object3D[],
): boolean {
  const direction = target.clone().sub(origin);
  const distance = direction.length();
  if (distance <= 0.05) return true;
  const ray = new Raycaster(origin, direction.normalize(), 0, distance - 0.05);
  return ray.intersectObjects(obstacles, true).length === 0;
}
