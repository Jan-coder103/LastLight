import type { CameraMode } from './PlayerController';

/** Keep the scout visible during camera travel, and the viewmodel confined to on-foot play. */
export function playerPresentation(mode: CameraMode, transitioning: boolean, phase: string) {
  const firstPerson = mode === 'first-person';
  return {
    body:
      ['base', 'active', 'extracting', 'disembarking', 'takeoff'].includes(phase) &&
      (!firstPerson || transitioning),
    weapon: firstPerson && !transitioning && ['base', 'active', 'extracting'].includes(phase),
  };
}
