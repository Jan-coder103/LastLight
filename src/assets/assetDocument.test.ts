import { afterEach, describe, expect, it } from 'vitest';
import { Mesh, MeshStandardMaterial } from 'three';
import { clearAssetDocumentOverrides, getAsset, installAssetDocumentOverride } from './catalog';
import {
  defaultAssetDocument,
  listDefaultAssetDocuments,
  parseAssetDocument,
  serializeAssetDocument,
} from './assetDocument';

afterEach(() => clearAssetDocumentOverrides());

describe('portable authored asset definitions', () => {
  it('round-trips every shared game asset through the versioned JSON format', () => {
    const documents = listDefaultAssetDocuments();
    expect(documents).toHaveLength(43);
    for (const document of documents) {
      const reopened = parseAssetDocument(JSON.parse(serializeAssetDocument(document)) as unknown);
      expect(reopened).toEqual(document);
    }
  });

  it('rejects unsupported versions and invalid dimensions, collision, interaction, and material data', () => {
    const source = defaultAssetDocument('radio-mast');
    expect(() => parseAssetDocument({ ...source, version: 2 })).toThrow(
      'Unsupported asset file version',
    );

    const badDimensions = structuredClone(source);
    badDimensions.asset.dimensions.y = 0;
    expect(() => parseAssetDocument(badDimensions)).toThrow('asset.dimensions.y');

    const badCollider = structuredClone(source);
    badCollider.asset.collider!.size.x = -1;
    expect(() => parseAssetDocument(badCollider)).toThrow('asset.collider.size.x');

    const repeatedPoint = structuredClone(source);
    repeatedPoint.asset.interactionPoints.push({
      ...repeatedPoint.asset.interactionPoints[0]!,
      label: 'Duplicate',
    });
    expect(() => parseAssetDocument(repeatedPoint)).toThrow('is repeated');

    const badMaterial = structuredClone(source);
    badMaterial.asset.materials[0]!.roughness = 1.4;
    expect(() => parseAssetDocument(badMaterial)).toThrow('roughness must be a number');
  });

  it('applies exported bounds, collision, interaction points, and material values to game assets', () => {
    const edited = defaultAssetDocument('boulder');
    edited.asset.dimensions = { x: 5, y: 3, z: 4 };
    edited.asset.collider!.size = { x: 4, y: 2, z: 3 };
    edited.asset.materials[0]!.color = '#a0b080';
    installAssetDocumentOverride(parseAssetDocument(edited));

    const resolved = getAsset('boulder');
    expect(resolved.dimensions).toEqual({ x: 5, y: 3, z: 4 });
    expect(resolved.collider?.size).toEqual({ x: 4, y: 2, z: 3 });
    const visual = resolved.createVisual();
    let stoneColor = '';
    visual.traverse((object) => {
      if (
        object instanceof Mesh &&
        object.material instanceof MeshStandardMaterial &&
        object.material.name === 'stone'
      )
        stoneColor = `#${object.material.color.getHexString()}`;
    });
    expect(stoneColor).toBe('#a0b080');
  });
});
