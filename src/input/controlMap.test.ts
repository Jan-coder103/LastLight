import { describe, expect, it } from 'vitest';
import { abilityFromKey, isDashKey, isMovementKey } from './controlMap';

describe('view-specific input map', () => {
  it('reserves W/E/R for abilities in top-down and uses 1/2/3 in third person', () => {
    expect(abilityFromKey('KeyW', 'top-down')).toBe(1);
    expect(abilityFromKey('KeyE', 'top-down')).toBe(2);
    expect(abilityFromKey('KeyR', 'top-down')).toBe(3);
    expect(abilityFromKey('KeyW', 'third-person')).toBeUndefined();
    expect(abilityFromKey('Digit1', 'third-person')).toBe(1);
    expect(abilityFromKey('Digit2', 'third-person')).toBe(2);
    expect(abilityFromKey('Digit3', 'third-person')).toBe(3);
  });

  it('keeps movement in third person and makes Q a view-independent dash key', () => {
    expect(isMovementKey('KeyW', 'third-person')).toBe(true);
    expect(isMovementKey('KeyW', 'top-down')).toBe(false);
    expect(isMovementKey('ArrowLeft', 'third-person')).toBe(true);
    expect(isDashKey('KeyQ')).toBe(true);
    expect(isDashKey('KeyW')).toBe(false);
  });
});
