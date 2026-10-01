import {
  Box3,
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Material,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

type GeometryParameters = Record<string, number | boolean | undefined>;

interface DetailProfile {
  cylinderSegments: number;
  coneSegments: number;
  sphereWidthSegments: number;
  sphereHeightSegments: number;
  torusRadialSegments: number;
  torusTubularSegments: number;
  minimumFeatureSize: number;
  minimumThickness?: number;
  preserveThinFeatureSpanRatio?: number;
  label: 'low' | 'very-low';
}

type VeryLowDetailTuning = Partial<Omit<DetailProfile, 'label'>>;

const LOW_DETAIL_PROFILE: DetailProfile = {
  cylinderSegments: 5,
  coneSegments: 5,
  sphereWidthSegments: 6,
  sphereHeightSegments: 4,
  torusRadialSegments: 4,
  torusTubularSegments: 6,
  minimumFeatureSize: 0.08,
  label: 'low',
};

const VERY_LOW_DETAIL_PROFILE: DetailProfile = {
  cylinderSegments: 3,
  coneSegments: 3,
  sphereWidthSegments: 3,
  sphereHeightSegments: 2,
  torusRadialSegments: 3,
  torusTubularSegments: 3,
  minimumFeatureSize: 0.45,
  label: 'very-low',
};

const VERY_LOW_DETAIL_TUNING: Record<string, VeryLowDetailTuning> = {
  'dry-dock-crane': {
    minimumFeatureSize: 1.8,
    minimumThickness: 0.14,
    preserveThinFeatureSpanRatio: 0.4,
  },
  'electrical-substation': {
    minimumFeatureSize: 1.2,
    minimumThickness: 0.1,
    preserveThinFeatureSpanRatio: 0.35,
  },
  'abandoned-substation': {
    minimumFeatureSize: 1.2,
    minimumThickness: 0.1,
    preserveThinFeatureSpanRatio: 0.35,
  },
  'fire-lookout': {
    minimumFeatureSize: 0.8,
    minimumThickness: 0.11,
    preserveThinFeatureSpanRatio: 0.4,
  },
  'radar-dish': {
    minimumFeatureSize: 0.9,
    minimumThickness: 0.12,
    preserveThinFeatureSpanRatio: 0.35,
  },
  'water-treatment-tanks': {
    minimumFeatureSize: 1.1,
    minimumThickness: 0.13,
    preserveThinFeatureSpanRatio: 0.35,
  },
  'cargo-containers': {
    minimumFeatureSize: 1.25,
    minimumThickness: 0.18,
    preserveThinFeatureSpanRatio: 0.3,
  },
  'aircraft-hangar': {
    minimumFeatureSize: 1.3,
    minimumThickness: 0.2,
    preserveThinFeatureSpanRatio: 0.3,
  },
  'wind-pump': {
    minimumFeatureSize: 0.75,
  },
};

function simplifyPrimitive(geometry: BufferGeometry, profile: DetailProfile): BufferGeometry {
  const parameters = (geometry as BufferGeometry & { parameters?: GeometryParameters }).parameters;
  if (!parameters) return geometry.clone();

  if (geometry.type === 'CylinderGeometry') {
    return new CylinderGeometry(
      parameters.radiusTop as number,
      parameters.radiusBottom as number,
      parameters.height as number,
      Math.min((parameters.radialSegments as number | undefined) ?? 8, profile.cylinderSegments),
      1,
      Boolean(parameters.openEnded),
      parameters.thetaStart as number | undefined,
      parameters.thetaLength as number | undefined,
    );
  }

  if (geometry.type === 'ConeGeometry') {
    return new ConeGeometry(
      parameters.radius as number,
      parameters.height as number,
      Math.min((parameters.radialSegments as number | undefined) ?? 8, profile.coneSegments),
      1,
      Boolean(parameters.openEnded),
      parameters.thetaStart as number | undefined,
      parameters.thetaLength as number | undefined,
    );
  }

  if (geometry.type === 'SphereGeometry') {
    return new SphereGeometry(
      parameters.radius as number,
      Math.min((parameters.widthSegments as number | undefined) ?? 16, profile.sphereWidthSegments),
      Math.min(
        (parameters.heightSegments as number | undefined) ?? 12,
        profile.sphereHeightSegments,
      ),
      parameters.phiStart as number | undefined,
      parameters.phiLength as number | undefined,
      parameters.thetaStart as number | undefined,
      parameters.thetaLength as number | undefined,
    );
  }

  if (geometry.type === 'TorusGeometry') {
    return new TorusGeometry(
      parameters.radius as number,
      parameters.tube as number,
      Math.min((parameters.radialSegments as number | undefined) ?? 8, profile.torusRadialSegments),
      Math.min(
        (parameters.tubularSegments as number | undefined) ?? 12,
        profile.torusTubularSegments,
      ),
      parameters.arc as number | undefined,
    );
  }

  return geometry.clone();
}

function flattenGeometry(
  geometry: BufferGeometry,
  transform: Matrix4,
  preserveIndex = false,
): BufferGeometry {
  const flattened = geometry.clone();
  flattened.applyMatrix4(transform);
  if (flattened.index && !preserveIndex) {
    const nonIndexed = flattened.toNonIndexed();
    flattened.dispose();
    return nonIndexed;
  }
  return flattened;
}

function isBelowFeatureSize(geometry: BufferGeometry, minimumFeatureSize: number): boolean {
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return false;
  const size = bounds.getSize(new Vector3());
  return Math.max(size.x, size.y, size.z) < minimumFeatureSize;
}

function isBelowThinFeatureCutoff(
  geometry: BufferGeometry,
  transform: Matrix4,
  profile: DetailProfile,
  preserveSpan: number,
): boolean {
  if (profile.minimumThickness === undefined || preserveSpan <= 0) return false;
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return false;

  const size = bounds.getSize(new Vector3());
  const elements = transform.elements;
  const dimensions = [
    size.x * Math.hypot(elements[0]!, elements[1]!, elements[2]!),
    size.y * Math.hypot(elements[4]!, elements[5]!, elements[6]!),
    size.z * Math.hypot(elements[8]!, elements[9]!, elements[10]!),
  ].sort((a, b) => a - b);
  return dimensions[0]! < profile.minimumThickness && dimensions[2]! < preserveSpan;
}

function materialBatchKey(material: Material): string {
  if (!(material instanceof MeshStandardMaterial)) return material.uuid;
  return JSON.stringify({
    color: material.color.getHex(),
    roughness: material.roughness,
    metalness: material.metalness,
    emissive: material.emissive.getHex(),
    emissiveIntensity: material.emissiveIntensity,
    side: material.side,
    transparent: material.transparent,
    opacity: material.opacity,
    depthWrite: material.depthWrite,
    depthTest: material.depthTest,
    flatShading: material.flatShading,
    vertexColors: material.vertexColors,
    alphaTest: material.alphaTest,
  });
}

function createDetailVisual(source: Group, assetId: string, profile: DetailProfile): Group {
  source.updateMatrixWorld(true);
  const inverseRoot = new Matrix4().copy(source.matrixWorld).invert();
  const sourceBounds = new Box3().setFromObject(source);
  const sourceSize = sourceBounds.getSize(new Vector3());
  const sourceSpan = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);
  const preserveThinFeatureSpan =
    sourceSpan * (profile.preserveThinFeatureSpanRatio ?? 0);
  const buckets = new Map<string, { material: Material; geometries: BufferGeometry[] }>();
  const unmerged: Mesh[] = [];

  source.traverse((object) => {
    if (!(object instanceof Mesh) || !object.visible) return;
    const material = object.material;
    const transform = inverseRoot.clone().multiply(object.matrixWorld);

    // Multi-material meshes can have material-indexed geometry groups. Keep their geometry and
    // groups intact, while still applying their complete source transform.
    if (Array.isArray(material)) {
      const geometry = object.geometry.clone();
      if (isBelowThinFeatureCutoff(geometry, transform, profile, preserveThinFeatureSpan)) {
        geometry.dispose();
        return;
      }
      geometry.applyMatrix4(transform);
      if (isBelowFeatureSize(geometry, profile.minimumFeatureSize)) {
        geometry.dispose();
        return;
      }
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      unmerged.push(mesh);
      return;
    }

    const geometry = simplifyPrimitive(object.geometry, profile);
    if (isBelowThinFeatureCutoff(geometry, transform, profile, preserveThinFeatureSpan)) {
      geometry.dispose();
      return;
    }
    geometry.applyMatrix4(transform);
    if (isBelowFeatureSize(geometry, profile.minimumFeatureSize)) {
      geometry.dispose();
      return;
    }
    const indexedOutput = profile.label === 'very-low';
    const flattened = flattenGeometry(geometry, new Matrix4(), indexedOutput);
    geometry.dispose();
    flattened.clearGroups();
    for (const attribute of Object.keys(flattened.attributes)) {
      if (attribute !== 'position' && attribute !== 'normal') flattened.deleteAttribute(attribute);
    }
    if (!flattened.getAttribute('normal')) flattened.computeVertexNormals();
    const optimized = indexedOutput && !flattened.index ? mergeVertices(flattened) : flattened;
    if (optimized !== flattened) flattened.dispose();
    const key = materialBatchKey(material);
    const bucket = buckets.get(key) ?? { material, geometries: [] as BufferGeometry[] };
    bucket.geometries.push(optimized);
    buckets.set(key, bucket);
  });

  const detail = new Group();
  detail.name = `${source.name || assetId} ${profile.label} detail`;
  detail.userData = { ...source.userData, assetId, lod: profile.label };
  for (const { material, geometries } of buckets.values()) {
    const merged = mergeGeometries(geometries, profile.label === 'very-low');
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;
    const mesh = new Mesh(merged, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    detail.add(mesh);
  }
  detail.add(...unmerged);
  return detail;
}

/** Builds a far-field version from the approved visual while retaining its main shapes and materials. */
export function createLowDetailVisual(source: Group, assetId: string): Group {
  return createDetailVisual(source, assetId, LOW_DETAIL_PROFILE);
}

/** Builds an ultra-far version with triangular round primitives and only larger silhouette parts. */
export function createVeryLowDetailVisual(source: Group, assetId: string): Group {
  const tuning = VERY_LOW_DETAIL_TUNING[assetId];
  return createDetailVisual(
    source,
    assetId,
    tuning ? { ...VERY_LOW_DETAIL_PROFILE, ...tuning } : VERY_LOW_DETAIL_PROFILE,
  );
}
