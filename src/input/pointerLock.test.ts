import { describe, expect, it } from 'vitest';
import { canRequestPointerLock } from './pointerLock';

describe('pointer-lock eligibility', () => {
  it('requests capture from the perspective scenes only', () => {
    expect(canRequestPointerLock('third-person', true, false)).toBe(true);
    expect(canRequestPointerLock('first-person', true, false)).toBe(true);
    expect(canRequestPointerLock('first-person', true, true)).toBe(false);
    expect(canRequestPointerLock('first-person', false, false)).toBe(false);
    expect(canRequestPointerLock('top-down', true, false)).toBe(false);
  });

  it('excludes HUD targets even when they overlay the scene', () => {
    expect(canRequestPointerLock('third-person', true, true)).toBe(false);
    expect(canRequestPointerLock('third-person', false, false)).toBe(false);
  });
});
