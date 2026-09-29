import type { WorldTheme } from '../world/regionThemes';

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
  /** Optional far-distance representation used by the runtime renderer. */
  createLowDetailVisual?: (
    variant?: number,
    sourceVisual?: import('three').Group,
  ) => import('three').Group;
  /** Optional ultra-far representation used beyond the normal far-detail range. */
  createVeryLowDetailVisual?: (
    variant?: number,
    sourceVisual?: import('three').Group,
  ) => import('three').Group;
}

export interface AssetPlacement {
  assetId: string;
  theme: WorldTheme;
  regionId: string;
  position: Vec3Data;
  rotationY: number;
  scale: number;
  variant: number;
}
