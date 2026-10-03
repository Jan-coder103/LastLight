import { LOD, Mesh, Object3D, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { buildWorld, updateWorldLods, worldLodDistances } from './buildWorld';
import { generateWorld } from './generateWorld';

function triangleCount(root: Object3D): number {
  let count = 0;
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const vertices = object.geometry.index?.count ?? object.geometry.getAttribute('position').count;
    count += Math.floor(vertices / 3);
  });
  return count;
}

describe('world asset LOD', () => {
  it('switches representative assets across near, far, and ultra-far models', () => {
    const world = generateWorld('LOD-PILOT');
    const placementTemplate = world.placements[0]!;
    world.placements.push(
      { ...placementTemplate, assetId: 'pine-tree', variant: 0 },
      { ...placementTemplate, assetId: 'burned-tree-cluster', variant: 0 },
      { ...placementTemplate, assetId: 'street-light', variant: 0 },
    );

    const root = buildWorld(world);
    const lods = root.userData.lodObjects as LOD[];
    const viewerPosition = new Vector3();
    root.updateMatrixWorld(true);

    const testAssets = [
      { assetId: 'pine-tree', visualAssetId: 'pine-tree' },
      { assetId: 'burned-tree-cluster', visualAssetId: 'burned-tree-cluster' },
      { assetId: 'explosive-barrel', visualAssetId: 'explosive-barrel' },
      // This approved catalog asset retains its original candidate-* visual metadata.
      { assetId: 'street-light', visualAssetId: 'candidate-street-light' },
    ];
    for (const { assetId, visualAssetId } of testAssets) {
      const lod = lods.find(
        (candidate) =>
          candidate.userData.assetId === visualAssetId ||
          candidate.levels[0]?.object.userData.assetId === visualAssetId,
      );
      expect(lod, assetId).toBeDefined();
      expect(lod!.levels.map((level) => level.distance)).toEqual([
        0,
        worldLodDistances.near,
        worldLodDistances.veryFar,
      ]);
      expect(lod!.levels[1]!.hysteresis).toBe(0.12);
      expect(lod!.levels[2]!.hysteresis).toBe(0.12);
      const nearModel = lod!.levels[0]!.object;
      const farModel = lod!.levels[1]!.object;
      const veryFarModel = lod!.levels[2]!.object;
      if (assetId === 'street-light') {
        expect(triangleCount(veryFarModel)).toBeLessThan(triangleCount(farModel));
      }
      const position = lod!.getWorldPosition(new Vector3());

      viewerPosition.copy(position).add(new Vector3(0, 0, 2));
      updateWorldLods(root, viewerPosition);
      expect(nearModel.visible).toBe(true);
      expect(farModel.visible).toBe(false);
      expect(veryFarModel.visible).toBe(false);

      viewerPosition.copy(position).add(new Vector3(0, 0, 100));
      updateWorldLods(root, viewerPosition);
      expect(nearModel.visible).toBe(false);
      expect(farModel.visible).toBe(true);
      expect(veryFarModel.visible).toBe(false);

      viewerPosition.copy(position).add(new Vector3(0, 0, 400));
      updateWorldLods(root, viewerPosition);
      expect(nearModel.visible).toBe(false);
      expect(farModel.visible).toBe(false);
      expect(veryFarModel.visible).toBe(true);

      viewerPosition.copy(position).add(new Vector3(0, 0, 110));
      updateWorldLods(root, viewerPosition);
      expect(veryFarModel.visible).toBe(true);
      viewerPosition.copy(position).add(new Vector3(0, 0, 105));
      updateWorldLods(root, viewerPosition);
      expect(farModel.visible).toBe(true);
      expect(veryFarModel.visible).toBe(false);
    }
  });

  it('clones barrel blink materials per world placement', () => {
    const world = generateWorld('BARREL-LODS');
    const root = buildWorld(world);
    const barrels: LOD[] = [];
    root.traverse((object) => {
      if (object instanceof LOD && object.userData.explosiveBarrelId) barrels.push(object);
    });
    expect(barrels.length).toBeGreaterThan(0);
    const indicators: Mesh[] = [];
    barrels[0]!.traverse((object) => {
      if (object instanceof Mesh && object.userData.explosiveBarrelBlink) indicators.push(object);
    });
    expect(indicators.length).toBe(6);
    expect(new Set(indicators.map((object) => object.material)).size).toBe(6);
  });
});
