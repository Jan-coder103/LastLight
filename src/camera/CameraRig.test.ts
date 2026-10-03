import { PerspectiveCamera, Vector3 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

describe('first-person camera', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('cycles all views, follows at eye height, preserves yaw, and resets zoom when leaving', () => {
    const camera = new PerspectiveCamera(53, 1, 0.1, 500);
    const rig = new CameraRig(
      camera,
      {} as HTMLCanvasElement,
      { colliders: [] } as unknown as WorldData,
    );
    vi.stubGlobal('document', { pointerLockElement: null });
    const player = new Vector3(7, 3, -8);
    rig.reset(player);
    rig.yaw = Math.PI / 2;
    rig.pitch = 0;
    expect(rig.switchMode(player)).toBe('top-down');
    expect(rig.switchMode(player)).toBe('first-person');
    expect(rig.isTransitioning).toBe(true);
    for (let index = 0; index < 14; index++) rig.update(0.05, player);
    expect(rig.isTransitioning).toBe(false);
    expect(camera.position.toArray()).toEqual([7, 4.64, -8]);
    expect(rig.currentTarget.x).toBeCloseTo(19);
    expect(rig.currentTarget.z).toBeCloseTo(-8);
    rig.zoomBy(-200);
    expect(camera.fov).toBeLessThan(53);
    expect(rig.switchMode(player)).toBe('third-person');
    expect(camera.fov).toBe(53);
    expect(rig.yaw).toBe(Math.PI / 2);
  });
});
