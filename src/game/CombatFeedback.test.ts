import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  bloodTrailLifetime,
  BloodTrailGate,
  BloodTrailPool,
  impactShakeStrength,
} from './CombatFeedback';

describe('combat feedback limits', () => {
  it('uses strict 500/100 living-enemy hysteresis for trail creation', () => {
    const gate = new BloodTrailGate();
    expect(gate.update(500)).toBe(true);
    expect(gate.update(501)).toBe(false);
    expect(gate.update(100)).toBe(false);
    expect(gate.update(99)).toBe(true);
  });

  it('bounds pooled marks and expires each mark at ten seconds', () => {
    const pool = new BloodTrailPool(2);
    pool.add(new Vector3(1, 0, 1));
    pool.add(new Vector3(2, 0, 2));
    pool.add(new Vector3(3, 0, 3));
    expect(pool.marks).toHaveLength(2);
    expect(pool.marks[0]!.position.x).toBe(2);
    pool.update(bloodTrailLifetime - 0.01);
    expect(pool.marks).toHaveLength(2);
    pool.update(0.02);
    expect(pool.marks).toHaveLength(0);
  });

  it('keeps artillery impact shake slight and follows accessibility settings', () => {
    expect(impactShakeStrength(false, 0.55)).toBeCloseTo(0.077);
    expect(impactShakeStrength(false, 0)).toBe(0);
    expect(impactShakeStrength(true, 1)).toBe(0);
    expect(impactShakeStrength(false, 10)).toBe(0.16);
  });
});
