import { Mesh, MeshStandardMaterial, type Group } from 'three';
import { assetCatalog } from './catalog';
import type { AssetCollider, AssetInteractionPoint, AuthoredAsset, Vec3Data } from './assetTypes';

export const ASSET_DOCUMENT_FORMAT = 'last-light-authored-asset';
export const ASSET_DOCUMENT_VERSION = 1;
export const ACTIVE_ASSET_DOCUMENT_KEY = 'last-light:asset-document:v1';

export interface AssetMaterialSetting {
  name: string;
  color: string;
  roughness: number;
  metalness: number;
}

export interface EditableAssetData {
  assetId: string;
  dimensions: Vec3Data;
  collider: AssetCollider | null;
  interactionPoints: AssetInteractionPoint[];
  materials: AssetMaterialSetting[];
}

export interface AssetDocument {
  format: typeof ASSET_DOCUMENT_FORMAT;
  version: typeof ASSET_DOCUMENT_VERSION;
  asset: EditableAssetData;
}

function cloneVec3(value: Vec3Data): Vec3Data {
  return { x: value.x, y: value.y, z: value.z };
}

function disposePreviewGeometry(root: Group): void {
  root.traverse((object) => {
    if (object instanceof Mesh) object.geometry.dispose();
  });
}

function sourceMaterials(asset: AuthoredAsset): AssetMaterialSetting[] {
  const materials = new Map<string, AssetMaterialSetting>();
  for (const variant of [0, 1, 2]) {
    const preview = asset.createVisual(variant);
    preview.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of meshMaterials) {
        if (!(material instanceof MeshStandardMaterial) || !material.name) continue;
        materials.set(material.name, {
          name: material.name,
          color: `#${material.color.getHexString()}`,
          roughness: material.roughness,
          metalness: material.metalness,
        });
      }
    });
    disposePreviewGeometry(preview);
  }
  return [...materials.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function defaultAssetDocument(assetId: string): AssetDocument {
  const asset = assetCatalog.get(assetId);
  if (!asset) throw new Error(`Unknown authored asset: ${assetId}`);
  return {
    format: ASSET_DOCUMENT_FORMAT,
    version: ASSET_DOCUMENT_VERSION,
    asset: {
      assetId: asset.id,
      dimensions: cloneVec3(asset.dimensions),
      collider: asset.collider
        ? { center: cloneVec3(asset.collider.center), size: cloneVec3(asset.collider.size) }
        : null,
      interactionPoints: asset.interactionPoints.map((point) => ({
        id: point.id,
        label: point.label,
        position: cloneVec3(point.position),
      })),
      materials: sourceMaterials(asset),
    },
  };
}

export function listDefaultAssetDocuments(): AssetDocument[] {
  return [...assetCatalog.keys()].map(defaultAssetDocument);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readText(value: unknown, path: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength)
    throw new Error(`${path} must be text with 1–${maxLength} characters.`);
  return value.trim();
}

function readNumber(value: unknown, path: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum)
    throw new Error(`${path} must be a number between ${minimum} and ${maximum}.`);
  return value;
}

function readVec3(value: unknown, path: string, minimum: number, maximum: number): Vec3Data {
  if (!isRecord(value)) throw new Error(`${path} must include x, y, and z values.`);
  return {
    x: readNumber(value.x, `${path}.x`, minimum, maximum),
    y: readNumber(value.y, `${path}.y`, minimum, maximum),
    z: readNumber(value.z, `${path}.z`, minimum, maximum),
  };
}

function readCollider(value: unknown, path: string): AssetCollider | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error(`${path} must be null or contain center and size.`);
  const size = readVec3(value.size, `${path}.size`, 0.05, 500);
  return {
    center: readVec3(value.center, `${path}.center`, -500, 500),
    size,
  };
}

function readInteractionPoints(value: unknown): AssetInteractionPoint[] {
  if (!Array.isArray(value) || value.length > 16)
    throw new Error('asset.interactionPoints must be an array of up to 16 points.');
  const ids = new Set<string>();
  return value.map((item, index) => {
    const path = `asset.interactionPoints[${index}]`;
    if (!isRecord(item)) throw new Error(`${path} must be an object.`);
    const id = readText(item.id, `${path}.id`, 64);
    if (ids.has(id)) throw new Error(`Interaction point id “${id}” is repeated.`);
    ids.add(id);
    return {
      id,
      label: readText(item.label, `${path}.label`, 80),
      position: readVec3(item.position, `${path}.position`, -500, 500),
    };
  });
}

function readMaterials(value: unknown, assetId: string): AssetMaterialSetting[] {
  if (!Array.isArray(value)) throw new Error('asset.materials must be an array.');
  const defaults = sourceMaterials(assetCatalog.get(assetId)!);
  const allowed = new Set(defaults.map((material) => material.name));
  const seen = new Set<string>();
  const materials = value.map((item, index) => {
    const path = `asset.materials[${index}]`;
    if (!isRecord(item)) throw new Error(`${path} must be an object.`);
    const name = readText(item.name, `${path}.name`, 64);
    if (!allowed.has(name)) throw new Error(`${path}.name “${name}” is not used by ${assetId}.`);
    if (seen.has(name)) throw new Error(`Material “${name}” is repeated.`);
    seen.add(name);
    if (typeof item.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(item.color))
      throw new Error(`${path}.color must be a six-digit hex color such as #8a806c.`);
    return {
      name,
      color: item.color.toLowerCase(),
      roughness: readNumber(item.roughness, `${path}.roughness`, 0, 1),
      metalness: readNumber(item.metalness, `${path}.metalness`, 0, 1),
    };
  });
  if (materials.length !== allowed.size || [...allowed].some((name) => !seen.has(name)))
    throw new Error(
      `asset.materials must include each of the ${allowed.size} materials used by ${assetId}.`,
    );
  return materials.sort((left, right) => left.name.localeCompare(right.name));
}

export function parseAssetDocument(value: unknown): AssetDocument {
  if (!isRecord(value)) throw new Error('The asset file must contain a JSON object.');
  if (value.format !== ASSET_DOCUMENT_FORMAT)
    throw new Error(`This is not a ${ASSET_DOCUMENT_FORMAT} file.`);
  if (value.version !== ASSET_DOCUMENT_VERSION)
    throw new Error(`Unsupported asset file version: ${String(value.version)}.`);
  if (!isRecord(value.asset)) throw new Error('The asset file is missing its asset object.');
  const assetId = readText(value.asset.assetId, 'asset.assetId', 80);
  const base = assetCatalog.get(assetId);
  if (!base) throw new Error(`Unknown authored asset: ${assetId}`);
  const dimensions = readVec3(value.asset.dimensions, 'asset.dimensions', 0.1, 500);
  const collider = readCollider(value.asset.collider, 'asset.collider');
  const interactionPoints = readInteractionPoints(value.asset.interactionPoints);
  const materials = readMaterials(value.asset.materials, assetId);
  return {
    format: ASSET_DOCUMENT_FORMAT,
    version: ASSET_DOCUMENT_VERSION,
    asset: { assetId, dimensions, collider, interactionPoints, materials },
  };
}

export function serializeAssetDocument(value: unknown): string {
  return JSON.stringify(parseAssetDocument(value), null, 2);
}

export function readStoredAssetDocument(): AssetDocument | undefined {
  const serialized = window.localStorage.getItem(ACTIVE_ASSET_DOCUMENT_KEY);
  if (!serialized) return undefined;
  return parseAssetDocument(JSON.parse(serialized) as unknown);
}

export function storeAssetDocumentForGame(value: unknown): AssetDocument {
  const document = parseAssetDocument(value);
  window.localStorage.setItem(ACTIVE_ASSET_DOCUMENT_KEY, JSON.stringify(document));
  return document;
}

export function clearStoredAssetDocument(): void {
  window.localStorage.removeItem(ACTIVE_ASSET_DOCUMENT_KEY);
}
