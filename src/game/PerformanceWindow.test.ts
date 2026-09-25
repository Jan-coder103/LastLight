import { describe, expect, it } from 'vitest';
import { PerformanceWindow } from './PerformanceWindow';

describe('PerformanceWindow', () => {
  it('reports a rolling mean and nearest-rank p95', () => {
    const samples = new PerformanceWindow(4);
    [1, 2, 3, 4].forEach((sample) => samples.add(sample));
    expect(samples.count).toBe(4);
    expect(samples.average()).toBe(2.5);
    expect(samples.percentile95()).toBe(4);
  });

  it('drops the oldest samples and ignores invalid measurements', () => {
    const samples = new PerformanceWindow(3);
    [1, 2, 3, 4, Number.NaN, -5].forEach((sample) => samples.add(sample));
    expect(samples.count).toBe(3);
    expect(samples.average()).toBe(3);
    expect(samples.percentile95()).toBe(4);
  });

  it('starts empty and requires a positive integer capacity', () => {
    expect(new PerformanceWindow().percentile95()).toBe(0);
    expect(() => new PerformanceWindow(0)).toThrow(RangeError);
    expect(() => new PerformanceWindow(1.5)).toThrow(RangeError);
  });
});
