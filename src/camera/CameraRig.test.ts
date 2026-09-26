import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { CameraRig } from './CameraRig';
import type { WorldData } from '../world/generateWorld';

describe('CameraRig impact shake', () => {
  it('returns to the camera track without accumulating position drift', () => {
    const camera = new PerspectiveCamera(53, 1, 0.1, 500);
    const world = { colliders: [] } as unknown as WorldData;
    const rig = new CameraRig(camera, {} as HTMLCanvasElement, world);
    const player = new Vector3(0, 0, 0);
    rig.reset(player);
    const restingPosition = camera.position.clone();

    rig.kickShake(0.08, 0.2);
    rig.update(1 / 60, player);
    expect(camera.position.distanceTo(restingPosition)).toBeGreaterThan(0.001);

    for (let index = 0; index < 20; index += 1) rig.update(1 / 60, player);
    expect(camera.position.distanceTo(restingPosition)).toBeLessThan(0.00001);
  });

  it('ignores disabled shake', () => {
    const camera = new PerspectiveCamera(53, 1, 0.1, 500);
    const world = { colliders: [] } as unknown as WorldData;
    const rig = new CameraRig(camera, {} as HTMLCanvasElement, world);
    const player = new Vector3(0, 0, 0);
    rig.reset(player);
    const restingPosition = camera.position.clone();

    rig.kickShake(0, 0.2);
    rig.update(1 / 60, player);
    expect(camera.position.distanceTo(restingPosition)).toBeLessThan(0.00001);
  });
});
