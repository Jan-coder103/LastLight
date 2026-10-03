import { createCampWorld } from '../camp/campWorld';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PlayerController,
  adrenalineSpeedMultiplier,
  playerSpeedMultiplier,
  sprintSpeedMultiplier,
} from './PlayerController';

describe('sprint and adrenaline speed tuning', () => {
  it('keeps adrenaline at 2.5x base and multiplies sprint predictably', () => {
    expect(playerSpeedMultiplier(false, false)).toBe(1);
    expect(playerSpeedMultiplier(false, true)).toBe(sprintSpeedMultiplier);
    expect(playerSpeedMultiplier(true, false)).toBe(adrenalineSpeedMultiplier);
    expect(playerSpeedMultiplier(true, true)).toBeCloseTo(2.5 * sprintSpeedMultiplier);
  });
});

describe('perspective dash direction', () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each(['third-person', 'first-person'] as const)(
    'dashes forward from rest in %s at nonzero yaw',
    (mode) => {
      vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
      vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
      const player = new PlayerController(
        createCampWorld(),
        () => {},
        () => {},
        () => {},
        () => {},
        () => {},
        () => true,
        () => {},
      );
      player.update(0, mode, Math.PI / 2);
      player.startDash();
      expect(player.dashDirectionVector.x).toBeCloseTo(1);
      expect(player.dashDirectionVector.z).toBeCloseTo(0);
      player.dispose();
    },
  );
});
