import { PlaneGeometry, RepeatWrapping } from 'three';
import { describe, expect, it } from 'vitest';
import { createPackedDirtTexture, packedDirtTexture, tileGroundUv } from './groundTexture';

describe('packed earth texture', () => {
  it('uses deterministic small repeating pixels and tiles UVs by surface dimensions', () => {
    expect(packedDirtTexture.image.width).toBe(64);
    expect(packedDirtTexture.image.data).toEqual(createPackedDirtTexture().image.data);
    expect(packedDirtTexture.wrapS).toBe(RepeatWrapping);
    expect(packedDirtTexture.wrapT).toBe(RepeatWrapping);
    const geometry = new PlaneGeometry(28, 14);
    tileGroundUv(geometry, 28, 14);
    const uv = geometry.getAttribute('uv');
    expect(Math.max(...Array.from({ length: uv.count }, (_, i) => uv.getX(i)))).toBeCloseTo(10);
    expect(Math.max(...Array.from({ length: uv.count }, (_, i) => uv.getY(i)))).toBeCloseTo(5);
  });
});
