import { Mesh, MeshStandardMaterial, type Group } from 'three';
import type { AssetDocument, AssetMaterialSetting } from './assetDocument';
import type { AuthoredAsset } from './assetTypes';
import { boulder } from './boulder';
import { buildingShell } from './buildingShell';
import { pineTree } from './pineTree';
import { radioMast } from './radioMast';
import { waterTower } from './waterTower';

export const assetCatalog: ReadonlyMap<string, AuthoredAsset> = new Map(
  [pineTree, boulder, buildingShell, waterTower, radioMast].map((asset) => [asset.id, asset]),
);

const overrides = new Map<string, AssetDocument>();
const resolvedAssetCache = new Map<string, AuthoredAsset>();

export function installAssetDocumentOverride(document: AssetDocument): void {
  overrides.set(document.asset.assetId, document);
  resolvedAssetCache.delete(document.asset.assetId);
}

export function clearAssetDocumentOverrides(): void {
  overrides.clear();
  resolvedAssetCache.clear();
}

export function applyAssetMaterialSettings(
  root: Group,
  settings: readonly AssetMaterialSetting[],
): void {
  const byName = new Map(settings.map((setting) => [setting.name, setting]));
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const apply = (material: MeshStandardMaterial): MeshStandardMaterial => {
      const copy = material.clone();
      const setting = byName.get(copy.name);
      if (setting)
        copy.setValues({
          color: setting.color,
          roughness: setting.roughness,
          metalness: setting.metalness,
        });
      return copy;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map((material) =>
          material instanceof MeshStandardMaterial ? apply(material) : material,
        )
      : object.material instanceof MeshStandardMaterial
        ? apply(object.material)
        : object.material;
  });
}

export function getAsset(assetId: string): AuthoredAsset {
  const asset = assetCatalog.get(assetId);
  if (!asset) throw new Error(`Unknown authored asset: ${assetId}`);
  const override = overrides.get(assetId);
  if (!override) return asset;
  const cached = resolvedAssetCache.get(assetId);
  if (cached) return cached;
  const values = override.asset;
  const resolved: AuthoredAsset = {
    ...asset,
    dimensions: { ...values.dimensions },
    collider: values.collider
      ? { center: { ...values.collider.center }, size: { ...values.collider.size } }
      : undefined,
    interactionPoints: values.interactionPoints.map((point) => ({
      ...point,
      position: { ...point.position },
    })),
    createVisual(variant = 0) {
      const visual = asset.createVisual(variant);
      applyAssetMaterialSettings(visual, values.materials);
      return visual;
    },
  };
  resolvedAssetCache.set(assetId, resolved);
  return resolved;
}
