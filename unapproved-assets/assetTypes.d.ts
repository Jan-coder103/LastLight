// Type declaration for the live AuthoredAsset contract, copied from
// ../src/assets/assetTypes.ts so the candidate modules in this folder can be type-checked
// standalone. Candidates import it as `import type { AuthoredAsset } from './assetTypes';`
// exactly as they will from the live source folder; the import is type-only and erased when
// the viewer bundles these modules, so nothing here is loaded at runtime.
export interface Vec3Data {
  x: number;
  y: number;
  z: number;
}

export interface AssetCollider {
  center: Vec3Data;
  size: Vec3Data;
}

export interface AssetInteractionPoint {
  id: string;
  label: string;
  position: Vec3Data;
}

export interface AuthoredAsset {
  schemaVersion: 1;
  id: string;
  name: string;
  category: 'prop' | 'building' | 'landmark';
  dimensions: Vec3Data;
  collider?: AssetCollider;
  interactionPoints: AssetInteractionPoint[];
  createVisual: (variant?: number) => import('three').Group;
}

export interface AssetPlacement {
  assetId: string;
  position: Vec3Data;
  rotationY: number;
  scale: number;
  variant: number;
}
