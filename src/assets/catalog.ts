import { Mesh, MeshStandardMaterial, type Group } from 'three';
import type { AssetDocument, AssetMaterialSetting } from './assetDocument';
import type { AuthoredAsset } from './assetTypes';
import { createLowDetailVisual, createVeryLowDetailVisual } from './lowDetailVisual';
import { abandonedSubstation } from './abandonedSubstation';
import { barricadeGate } from './barricadeGate';
import { basicCampingTent } from './basicCampingTent';
import { ambulanceWreck } from './ambulanceWreck';
import { aircraftHangar } from './aircraftHangar';
import { barnShell } from './barnShell';
import { burnedCornerStore } from './burnedCornerStore';
import { burnedTreeCluster } from './burnedTreeCluster';
import { boulder } from './boulder';
import { buildingShell } from './buildingShell';
import { cargoContainers } from './cargoContainers';
import { cityBusWreck } from './cityBusWreck';
import { coastalLighthouse } from './coastalLighthouse';
import { communicationTruck } from './communicationTruck';
import { dryDockCrane } from './dryDockCrane';
import { electricalSubstation } from './electricalSubstation';
import { explosiveBarrel } from './explosiveBarrel';
import { farmTractor } from './farmTractor';
import { fireLookout } from './fireLookout';
import { farmGrainSilo } from './farmGrainSilo';
import { fireBin } from './fireBin';
import { helipad } from './helipad';
import { lookoutPlatform } from './lookoutPlatform';
import { pineTree } from './pineTree';
import { portableGenerator } from './portableGenerator';
import { powerPylon } from './powerPylon';
import { pumpjack } from './pumpjack';
import { radarDish } from './radarDish';
import { rangerCabin } from './rangerCabin';
import { portableFloodlightTower } from './portableFloodlightTower';
import { radioMast } from './radioMast';
import { rockOutcrop } from './rockOutcrop';
import { rooftopWaterTank } from './rooftopWaterTank';
import { rowHouse } from './rowHouse';
import { scrapStation } from './scrapStation';
import { streetLight } from './streetLight';
import { timberStacks } from './timberStacks';
import { totaledCar } from './totaledCar';
import { transitShelter } from './transitShelter';
import { vehicleCheckpoint } from './vehicleCheckpoint';
import { waterTreatmentTanks } from './waterTreatmentTanks';
import { weatherStation } from './weatherStation';
import { waterTower } from './waterTower';
import { windPump } from './windPump';

const authoredAssets: AuthoredAsset[] = [
  pineTree,
  dryDockCrane,
  electricalSubstation,
  explosiveBarrel,
  abandonedSubstation,
  fireLookout,
  radarDish,
  rockOutcrop,
  rooftopWaterTank,
  rowHouse,
  scrapStation,
  streetLight,
  timberStacks,
  vehicleCheckpoint,
  waterTreatmentTanks,
  barricadeGate,
  farmTractor,
  lookoutPlatform,
  pumpjack,
  rangerCabin,
  powerPylon,
  weatherStation,
  portableGenerator,
  cargoContainers,
  boulder,
  buildingShell,
  waterTower,
  radioMast,
  ambulanceWreck,
  barnShell,
  burnedCornerStore,
  burnedTreeCluster,
  cityBusWreck,
  communicationTruck,
  totaledCar,
  fireBin,
  portableFloodlightTower,
  farmGrainSilo,
  aircraftHangar,
  helipad,
  coastalLighthouse,
  transitShelter,
  windPump,
  basicCampingTent,
];

function withDetailFallbacks(asset: AuthoredAsset): AuthoredAsset {
  return {
    ...asset,
    createLowDetailVisual: asset.createLowDetailVisual
      ? (variant = 0, sourceVisual) => asset.createLowDetailVisual!(variant, sourceVisual)
      : (variant = 0, sourceVisual) =>
          createLowDetailVisual(sourceVisual ?? asset.createVisual(variant), asset.id),
    createVeryLowDetailVisual: asset.createVeryLowDetailVisual
      ? (variant = 0, sourceVisual) => asset.createVeryLowDetailVisual!(variant, sourceVisual)
      : (variant = 0, sourceVisual) =>
          createVeryLowDetailVisual(sourceVisual ?? asset.createVisual(variant), asset.id),
  };
}

export const assetCatalog: ReadonlyMap<string, AuthoredAsset> = new Map(
  authoredAssets.map((asset): [string, AuthoredAsset] => {
    const withLods = withDetailFallbacks(asset);
    return [withLods.id, withLods];
  }),
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
    createLowDetailVisual: asset.createLowDetailVisual
      ? (variant = 0, sourceVisual) => {
          const visual = asset.createLowDetailVisual!(variant, sourceVisual);
          applyAssetMaterialSettings(visual, values.materials);
          return visual;
        }
      : undefined,
    createVeryLowDetailVisual: asset.createVeryLowDetailVisual
      ? (variant = 0, sourceVisual) => {
          const visual = asset.createVeryLowDetailVisual!(variant, sourceVisual);
          applyAssetMaterialSettings(visual, values.materials);
          return visual;
        }
      : undefined,
  };
  resolvedAssetCache.set(assetId, resolved);
  return resolved;
}
