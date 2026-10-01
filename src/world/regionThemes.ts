export type WorldTheme = 'urban' | 'forest' | 'farm' | 'military' | 'coastal' | 'camp';

export interface RegionThemeDefinition {
  name: string;
  terrainColor: string;
  roadKind: 'road' | 'trail';
  /** Region-local density multiplier used by the procedural dressing pass. */
  density: number;
  /** Minimum edge-to-edge gap used for authored dressing in this region. */
  minSpacing: number;
  buildingWeights: Readonly<Record<string, number>>;
  landmarkWeights: Readonly<Record<string, number>>;
  propWeights: Readonly<Record<string, number>>;
  variantCounts: Readonly<Record<string, number>>;
  /** Assets that must be represented in every generated map of this theme. */
  requiredAssetIds: readonly string[];
}

/**
 * The world-placement contract for each region. Asset definitions stay in src/assets; this table
 * only describes which assets may be placed, how often local dressing is sampled, and the region's
 * broad ground/route character.
 */
export const WORLD_THEME_DEFINITIONS: Readonly<Record<WorldTheme, RegionThemeDefinition>> = {
  urban: {
    name: 'Urban',
    terrainColor: '#888675',
    roadKind: 'road',
    density: 0.72,
    minSpacing: 2.5,
    buildingWeights: { 'building-shell': 1, 'burned-corner-store': 0.35, 'row-house': 0.55 },
    landmarkWeights: {
      'water-tower': 0.25,
      'electrical-substation': 0.22,
      'water-treatment-tanks': 0.2,
    },
    propWeights: {
      'ambulance-wreck': 0.8,
      'city-bus-wreck': 0.65,
      'totaled-car': 1,
      'transit-shelter': 0.55,
      'rooftop-water-tank': 0.42,
      'scrap-station': 0.32,
      'street-light': 0.85,
      'barricade-gate': 0.22,
      'explosive-barrel': 0.24,
    },
    variantCounts: {
      'building-shell': 3,
      'burned-corner-store': 3,
      'row-house': 3,
      'water-tower': 1,
      'electrical-substation': 3,
      'water-treatment-tanks': 3,
      'ambulance-wreck': 3,
      'city-bus-wreck': 3,
      'totaled-car': 3,
      'transit-shelter': 1,
      'rooftop-water-tank': 3,
      'scrap-station': 3,
      'street-light': 3,
      'barricade-gate': 3,
      'explosive-barrel': 3,
    },
    requiredAssetIds: [
      'burned-corner-store',
      'ambulance-wreck',
      'city-bus-wreck',
      'totaled-car',
      'transit-shelter',
      'row-house',
      'electrical-substation',
      'water-treatment-tanks',
      'rooftop-water-tank',
      'scrap-station',
      'street-light',
      'explosive-barrel',
    ],
  },
  forest: {
    name: 'Forest',
    terrainColor: '#667852',
    roadKind: 'trail',
    density: 0.78,
    minSpacing: 3.5,
    buildingWeights: { 'ranger-cabin': 0.28 },
    landmarkWeights: { 'fire-lookout': 0.4 },
    propWeights: {
      'burned-tree-cluster': 0.28,
      'pine-tree': 0.68,
      boulder: 0.24,
      'rock-outcrop': 0.22,
      'timber-stacks': 0.18,
      'lookout-platform': 0.14,
      'weather-station': 0.12,
      'portable-generator': 0.1,
      'power-pylon': 0.14,
    },
    variantCounts: {
      'ranger-cabin': 3,
      'fire-lookout': 3,
      'burned-tree-cluster': 3,
      'pine-tree': 3,
      boulder: 3,
      'rock-outcrop': 3,
      'timber-stacks': 3,
      'lookout-platform': 3,
      'weather-station': 3,
      'portable-generator': 3,
      'power-pylon': 3,
    },
    requiredAssetIds: [
      'burned-tree-cluster',
      'fire-lookout',
      'ranger-cabin',
      'rock-outcrop',
      'timber-stacks',
      'lookout-platform',
      'weather-station',
      'power-pylon',
    ],
  },
  farm: {
    name: 'Farm',
    terrainColor: '#827951',
    roadKind: 'trail',
    density: 0.66,
    minSpacing: 4,
    buildingWeights: { 'barn-shell': 0.7 },
    landmarkWeights: { 'farm-grain-silo': 0.8, 'water-tower': 0.25, pumpjack: 0.26 },
    propWeights: {
      'wind-pump': 0.75,
      boulder: 0.16,
      'farm-tractor': 0.46,
      'timber-stacks': 0.16,
      'portable-generator': 0.12,
    },
    variantCounts: {
      'barn-shell': 3,
      'farm-grain-silo': 1,
      'water-tower': 1,
      pumpjack: 3,
      'wind-pump': 3,
      boulder: 3,
      'farm-tractor': 3,
      'timber-stacks': 3,
      'portable-generator': 3,
    },
    requiredAssetIds: ['barn-shell', 'farm-grain-silo', 'wind-pump', 'farm-tractor', 'pumpjack'],
  },
  military: {
    name: 'Military',
    terrainColor: '#626b5a',
    roadKind: 'road',
    density: 0.58,
    minSpacing: 4.5,
    buildingWeights: { 'aircraft-hangar': 0.5 },
    landmarkWeights: { 'radio-mast': 0.45, 'radar-dish': 0.38 },
    propWeights: {
      helipad: 0.65,
      'communication-truck': 0.55,
      'portable-floodlight-tower': 0.35,
      'vehicle-checkpoint': 0.3,
      'barricade-gate': 0.3,
      'cargo-containers': 0.2,
    },
    variantCounts: {
      'aircraft-hangar': 1,
      'radio-mast': 1,
      'radar-dish': 3,
      helipad: 1,
      'communication-truck': 3,
      'portable-floodlight-tower': 1,
      'vehicle-checkpoint': 3,
      'barricade-gate': 3,
      'cargo-containers': 3,
    },
    requiredAssetIds: [
      'aircraft-hangar',
      'helipad',
      'communication-truck',
      'portable-floodlight-tower',
      'radar-dish',
      'vehicle-checkpoint',
      'barricade-gate',
    ],
  },
  coastal: {
    name: 'Coastal',
    terrainColor: '#a69a78',
    roadKind: 'trail',
    density: 0.48,
    minSpacing: 4,
    buildingWeights: {},
    landmarkWeights: { 'coastal-lighthouse': 1, 'dry-dock-crane': 0.5 },
    propWeights: { 'cargo-containers': 0.32, 'water-treatment-tanks': 0.16 },
    variantCounts: {
      'coastal-lighthouse': 1,
      'dry-dock-crane': 3,
      'cargo-containers': 3,
      'water-treatment-tanks': 3,
    },
    requiredAssetIds: ['coastal-lighthouse', 'dry-dock-crane', 'cargo-containers'],
  },
  camp: {
    name: 'Survival Camp',
    terrainColor: '#74785d',
    roadKind: 'trail',
    density: 0.58,
    minSpacing: 3,
    buildingWeights: {},
    landmarkWeights: {},
    propWeights: {
      'basic-camping-tent': 0.65,
      'fire-bin': 0.5,
      boulder: 0.12,
      'portable-generator': 0.32,
      'abandoned-substation': 0.1,
      'scrap-station': 0.16,
      'lookout-platform': 0.12,
      'rock-outcrop': 0.1,
      'timber-stacks': 0.1,
    },
    variantCounts: {
      'basic-camping-tent': 3,
      'fire-bin': 3,
      boulder: 3,
      'portable-generator': 3,
      'abandoned-substation': 1,
      'scrap-station': 3,
      'lookout-platform': 3,
      'rock-outcrop': 3,
      'timber-stacks': 3,
    },
    requiredAssetIds: [
      'basic-camping-tent',
      'fire-bin',
      'portable-generator',
      'abandoned-substation',
    ],
  },
};

export function eligibleAssetIds(theme: WorldTheme): ReadonlySet<string> {
  const definition = WORLD_THEME_DEFINITIONS[theme];
  return new Set([
    ...Object.keys(definition.buildingWeights),
    ...Object.keys(definition.landmarkWeights),
    ...Object.keys(definition.propWeights),
  ]);
}
