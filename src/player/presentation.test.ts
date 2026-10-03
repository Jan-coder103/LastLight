import { describe, expect, it } from 'vitest';
import { playerPresentation } from './presentation';
import { createFirstPersonWeapon, createPlayerVisual } from './playerVisual';
import { Mesh, PerspectiveCamera, Scene } from 'three';

describe('scout presentation', () => {
  it('shows the body during camera travel and swaps to the gun after arrival', () => {
    expect(playerPresentation('first-person', true, 'active')).toEqual({
      body: true,
      weapon: false,
    });
    expect(playerPresentation('first-person', false, 'active')).toEqual({
      body: false,
      weapon: true,
    });
    expect(playerPresentation('third-person', true, 'active')).toEqual({
      body: true,
      weapon: false,
    });
    for (const phase of ['arrival', 'result']) {
      expect(playerPresentation('first-person', false, phase)).toEqual({
        body: false,
        weapon: false,
      });
    }
    expect(playerPresentation('first-person', false, 'takeoff').weapon).toBe(false);
  });

  it('includes the rifle on the scout and keeps the first-person muzzle in front of the camera', () => {
    const scout = createPlayerVisual();
    expect(scout.userData.rig.rifle.parent).toBe(scout);
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    scene.add(camera);
    const weapon = createFirstPersonWeapon();
    camera.add(weapon.visual);
    scene.updateMatrixWorld(true);
    expect(weapon.muzzle.getWorldPosition(camera.position.clone()).z).toBeLessThan(-1);
    weapon.visual.traverse((object) => {
      if (object instanceof Mesh) expect(object.castShadow).toBe(false);
    });
  });
});
