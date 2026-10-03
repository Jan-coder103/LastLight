import { expect, it } from 'vitest';
import { chooseAssistedTarget, extractionArrowVisible } from './targeting';
it('prefers the direct enemy, then the nearest visible valid enemy inside the enlarged assist area', () => {
  const visible = (id: string) => id !== 'occluded';
  const candidates = [
    { target: 'occluded', distanceSquared: 4 },
    { target: 'near', distanceSquared: 60 ** 2 },
    { target: 'far', distanceSquared: 72 ** 2 },
  ];
  expect(chooseAssistedTarget('direct', candidates, 68, visible)).toBe('direct');
  expect(chooseAssistedTarget(undefined, candidates, 68, visible)).toBe('near');
  expect(chooseAssistedTarget(undefined, candidates, 44, visible)).toBeUndefined();
  expect(chooseAssistedTarget('occluded', candidates, 68, visible)).toBe('near');
});
it('shows the extraction arrow at 60 seconds, only while active outdoors', () => {
  expect(extractionArrowVisible(59.99, true, true)).toBe(false);
  expect(extractionArrowVisible(60, true, true)).toBe(true);
  expect(extractionArrowVisible(90, true, false)).toBe(false);
  expect(extractionArrowVisible(90, false, true)).toBe(false);
});
