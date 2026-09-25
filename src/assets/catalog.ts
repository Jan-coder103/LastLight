import type { AuthoredAsset } from './assetTypes';
import { boulder } from './boulder';
import { buildingShell } from './buildingShell';
import { pineTree } from './pineTree';
import { waterTower } from './waterTower';

export const assetCatalog: ReadonlyMap<string, AuthoredAsset> = new Map(
  [pineTree, boulder, buildingShell, waterTower].map((asset) => [asset.id, asset]),
);

export function getAsset(assetId: string): AuthoredAsset {
  const asset = assetCatalog.get(assetId);
  if (!asset) throw new Error(`Unknown authored asset: ${assetId}`);
  return asset;
}
