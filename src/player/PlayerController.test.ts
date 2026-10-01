import { describe, expect, it } from 'vitest';
import {
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
