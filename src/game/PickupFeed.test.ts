import { describe, expect, it } from 'vitest';
import { isPickupInRange, PickupFeed, PickupPressState } from './PickupFeed';

describe('pickup presentation', () => {
  it('keeps the oldest pickup first and appends the newest at the bottom', () => {
    const feed = new PickupFeed();
    feed.add('Rifle');
    feed.add('Medical supply');
    expect(feed.visibleEntries.map((entry) => entry.text)).toEqual(['Rifle', 'Medical supply']);
  });

  it('keeps entries visible for three seconds, then fades and removes them', () => {
    const feed = new PickupFeed();
    feed.add('Fuel');
    feed.update(3);
    expect(feed.visibleEntries[0]!.opacity).toBeCloseTo(1);
    feed.update(0.2);
    expect(feed.visibleEntries[0]!.opacity).toBeGreaterThan(0);
    expect(feed.visibleEntries[0]!.opacity).toBeLessThan(1);
    feed.update(0.22);
    expect(feed.visibleEntries).toHaveLength(0);
  });

  it('limits an F press animation to the collected item', () => {
    const press = new PickupPressState();
    press.press('drop-1');
    expect(press.isPressed('drop-1')).toBe(true);
    expect(press.isPressed('drop-2')).toBe(false);
    press.update(0.19);
    expect(press.isPressed('drop-1')).toBe(false);
  });

  it('shows the world prompt only at the 3.6 metre pickup range', () => {
    expect(isPickupInRange(0, 0, 3.6, 0)).toBe(true);
    expect(isPickupInRange(0, 0, 3.61, 0)).toBe(false);
  });
});
