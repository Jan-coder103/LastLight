import { DataTexture, RGBAFormat, RepeatWrapping, SRGBColorSpace, UnsignedByteType } from 'three';

/** Tiny deterministic grit texture shared by dirt paths; adds one reusable sampler. */
export function createPackedDirtTexture(): DataTexture {
  const side = 64;
  const pixels = new Uint8Array(side * side * 4);
  let state = 0x5f3759df;
  for (let index = 0; index < side * side; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const grain = 166 + ((state >>> 24) % 67);
    const fleck = (state & 31) === 0 ? -34 : (state & 15) === 0 ? 22 : 0;
    const shade = Math.max(104, Math.min(244, grain + fleck));
    const offset = index * 4;
    pixels[offset] = shade;
    pixels[offset + 1] = shade;
    pixels[offset + 2] = shade;
    pixels[offset + 3] = 255;
  }
  const texture = new DataTexture(pixels, side, side, RGBAFormat, UnsignedByteType);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export const packedDirtTexture = createPackedDirtTexture();

/** Scale the unit plane UVs so each dirt tile covers roughly this many metres. */
export function tileGroundUv(
  geometry: import('three').BufferGeometry,
  width: number,
  depth: number,
): void {
  const uv = geometry.getAttribute('uv');
  if (!uv) return;
  const uScale = Math.max(1, width / 2.8);
  const vScale = Math.max(1, depth / 2.8);
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(index, uv.getX(index) * uScale, uv.getY(index) * vScale);
  }
  uv.needsUpdate = true;
}
