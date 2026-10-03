import {
  CircleGeometry,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  Vector3,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCamp, updateCampDecorations } from './buildCamp';
import { packedDirtTexture } from '../world/groundTexture';

describe('camp ground dressing', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('batches deterministic spots, swaps distance tiers, and culls distant details', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    const camp = buildCamp();
    const lods = camp.userData.decorationLods;
    const batches = [
      lods.nearGrass,
      lods.farGrass,
      lods.nearStones,
      lods.farStones,
    ] as InstancedMesh[];
    expect(batches).toHaveLength(4);
    expect(lods.grass).toEqual(buildCamp().userData.decorationLods.grass);
    const viewer = new Vector3(0, 0, 21);
    updateCampDecorations(camp, 0, viewer);
    const distance = (spot: { x: number; z: number }) =>
      (viewer.x - spot.x) ** 2 + (viewer.z - spot.z) ** 2;
    expect(lods.nearGrass.count).toBe(
      lods.grass.filter((spot: { x: number; z: number }) => distance(spot) < 400).length * 3,
    );
    expect(lods.farGrass.count).toBe(
      lods.grass.filter(
        (spot: { x: number; z: number }) => distance(spot) >= 400 && distance(spot) < 3600,
      ).length,
    );
    expect(lods.nearStones.count).toBe(
      lods.stones.filter((spot: { x: number; z: number }) => distance(spot) < 400).length,
    );
    updateCampDecorations(camp, 0.25, new Vector3(200, 0, 200));
    for (const batch of batches) {
      expect(batch.count).toBe(0);
      expect(batch.castShadow).toBe(false);
    }
    const maps: unknown[] = [];
    camp.traverse((object) => {
      if (
        object instanceof Mesh &&
        object.material instanceof MeshStandardMaterial &&
        object.material.map === packedDirtTexture
      )
        maps.push(object.material.map);
    });
    expect(maps.length).toBeGreaterThan(1);
  });
});

describe('camp shadows', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('casts shadows from solid camp structures and the parked helicopter onto ground overlays', () => {
    vi.stubGlobal('document', { createElement: () => ({ getContext: () => null }) });
    const camp = buildCamp();
    const solids: Mesh[] = [];
    const groundOverlays: Mesh[] = [];
    camp.traverse((object) => {
      if (!(object instanceof Mesh) || object instanceof InstancedMesh) return;
      if (
        object.geometry instanceof PlaneGeometry ||
        object.geometry instanceof CircleGeometry ||
        object.geometry instanceof RingGeometry
      ) {
        groundOverlays.push(object);
      } else {
        solids.push(object);
      }
    });
    expect(solids.length).toBeGreaterThan(100);
    expect(solids.every((part) => part.castShadow)).toBe(true);
    expect(groundOverlays.length).toBeGreaterThan(5);
    expect(groundOverlays.every((part) => part.receiveShadow)).toBe(true);
    const helicopter = camp.getObjectByName('Camp departure helicopter')!;
    expect(helicopter).toBeDefined();
    helicopter.traverse((part) => {
      if (part instanceof Mesh) expect(part.castShadow).toBe(true);
    });
  });
});
