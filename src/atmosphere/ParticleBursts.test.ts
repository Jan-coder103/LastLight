import { expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { ParticleBursts } from './ParticleBursts';
it('removes existing blood particles without removing non-blood ability effects', () => {
  const bursts = new ParticleBursts(new Scene());
  bursts.burst(new Vector3(), '#b04c42', 4, 1.45, 0.22, true);
  bursts.burst(new Vector3(), '#dd8050', 3);
  expect(bursts.activeCount).toBe(7);
  bursts.clearBlood();
  expect(bursts.activeCount).toBe(3);
});
