import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

const stoneMaterial = new MeshStandardMaterial({
  color: '#a29b88',
  roughness: 1,
  flatShading: true,
});
stoneMaterial.name = 'lighthouse-stone';
const bandMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 1,
  flatShading: true,
});
bandMaterial.name = 'lighthouse-band';
const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
roofMaterial.name = 'lighthouse-roof';
const metalMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.8,
  metalness: 0.3,
});
metalMaterial.name = 'lighthouse-metal';
const glassMaterial = new MeshStandardMaterial({
  color: '#78908b',
  roughness: 0.3,
  metalness: 0.1,
});
glassMaterial.name = 'lighthouse-glass';
const doorMaterial = new MeshStandardMaterial({ color: '#4b4035', roughness: 1 });
doorMaterial.name = 'lighthouse-door';
const rustMaterial = new MeshStandardMaterial({ color: '#9b624d', roughness: 1, metalness: 0.1 });
rustMaterial.name = 'lighthouse-rust';
const lightMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.5,
  emissive: '#d9b56e',
  emissiveIntensity: 0.9,
});
lightMaterial.name = 'lighthouse-light';

const TOWER_TOP = 11;
const BASE_R = 2.15;
const TOP_R = 1.3;
const SIDES = 12;
/** Flat face of an N-gon sits at radius * cos(pi/N) from the axis. */
const COS_FACET = Math.cos(Math.PI / SIDES);

function addMesh(group: Group, mesh: Mesh): Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function radiusAt(y: number): number {
  const t = Math.min(Math.max(y / TOWER_TOP, 0), 1);
  return BASE_R + (TOP_R - BASE_R) * t;
}

export const coastalLighthouse: AuthoredAsset = {
  schemaVersion: 1,
  id: 'coastal-lighthouse',
  name: 'Coastal Lighthouse',
  category: 'landmark',
  dimensions: { x: 5.4, y: 14.8, z: 5.4 },
  collider: { center: { x: 0, y: 5.5, z: 0 }, size: { x: 3.9, y: 11, z: 3.9 } },
  interactionPoints: [
    { id: 'lighthouse-door', label: 'Lighthouse Door', position: { x: 0, y: 0, z: 2.3 } },
  ],
  createVisual(variant = 0) {
    const group = new Group();

    const base = addCylinder(group, BASE_R + 0.22, 0.5, 0, stoneMaterial, SIDES);
    base.position.y = 0.25;
    const tower = new Mesh(new CylinderGeometry(TOP_R, BASE_R, TOWER_TOP, SIDES, 1), stoneMaterial);
    tower.position.y = 0.5 + TOWER_TOP / 2;
    addMesh(group, tower);

    for (const y of [3.4, 6.8]) {
      const band = new Mesh(
        new CylinderGeometry(radiusAt(y) + 0.09, radiusAt(y) + 0.09, 0.55, SIDES, 1),
        bandMaterial,
      );
      band.position.y = y;
      addMesh(group, band);
    }
    const plinth = new Mesh(
      new CylinderGeometry(BASE_R + 0.4, BASE_R + 0.5, 0.42, SIDES, 1),
      bandMaterial,
    );
    plinth.position.y = 0.66;
    addMesh(group, plinth);

    const door = new Mesh(new BoxGeometry(1.0, 2.05, 0.22), doorMaterial);
    door.position.set(0, 1.52, BASE_R * COS_FACET - 0.04);
    addMesh(group, door);
    addBox(
      group,
      { x: 0.3, y: 0.14, z: 0.14 },
      { x: 0.3, y: 1.42, z: BASE_R * COS_FACET + 0.04 },
      rustMaterial,
    );
    for (const y of [3.9, 7.2]) {
      const slit = new Mesh(new BoxGeometry(0.34, 0.8, 0.24), doorMaterial);
      slit.position.set(0, y, radiusAt(y) * COS_FACET - 0.06);
      addMesh(group, slit);
    }

    const galleryY = 11.5;
    const deck = new Mesh(new CylinderGeometry(2.0, 2.0, 0.16, SIDES, 1), metalMaterial);
    deck.position.y = galleryY;
    addMesh(group, deck);
    const corbels = new Mesh(new CylinderGeometry(1.5, TOP_R, 0.7, SIDES, 1), bandMaterial);
    corbels.position.y = galleryY - 0.42;
    addMesh(group, corbels);

    const postCount = 12;
    for (let i = 0; i < postCount; i += 1) {
      const a = (i / postCount) * Math.PI * 2;
      const broken = variant === 2 && (i === 2 || i === 3);
      const h = broken ? 0.45 : 1.0;
      const post = new Mesh(new CylinderGeometry(0.05, 0.05, h, 5), metalMaterial);
      post.position.set(Math.cos(a) * 1.9, galleryY + h / 2 + 0.08, Math.sin(a) * 1.9);
      addMesh(group, post);
    }
    for (const y of [galleryY + 1.06, galleryY + 0.6]) {
      if (variant === 2 && y > galleryY + 0.9) continue;
      const rail = new Mesh(new TorusGeometry(1.9, 0.045, 4, SIDES * 2), metalMaterial);
      rail.rotation.x = Math.PI / 2;
      rail.position.y = y;
      addMesh(group, rail);
    }

    const lanternBase = galleryY + 0.1;
    const lanternH = 1.6;
    if (variant !== 1) {
      const glass = new Mesh(new CylinderGeometry(0.98, 0.98, lanternH, 8, 1, true), glassMaterial);
      glass.position.y = lanternBase + lanternH / 2;
      addMesh(group, glass);
    }
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const bar = new Mesh(new BoxGeometry(0.11, lanternH, 0.11), metalMaterial);
      bar.position.set(Math.cos(a) * 0.98, lanternBase + lanternH / 2, Math.sin(a) * 0.98);
      addMesh(group, bar);
    }
    const sill = new Mesh(new CylinderGeometry(1.08, 1.08, 0.16, 8, 1), metalMaterial);
    sill.position.y = lanternBase;
    addMesh(group, sill);
    const roof = new Mesh(new ConeGeometry(1.2, 0.9, 8), roofMaterial);
    roof.position.y = lanternBase + lanternH + 0.45;
    addMesh(group, roof);
    const finial = new Mesh(new CylinderGeometry(0.03, 0.07, 0.6, 6), metalMaterial);
    finial.position.y = lanternBase + lanternH + 1.18;
    addMesh(group, finial);

    if (variant === 0) {
      const lamp = new Mesh(new CylinderGeometry(0.42, 0.42, 0.7, 8), lightMaterial);
      lamp.position.y = lanternBase + lanternH / 2;
      addMesh(group, lamp);
    } else if (variant === 1) {
      const broken = new Mesh(new BoxGeometry(0.7, 0.9, 0.06), glassMaterial);
      broken.position.set(0.55, 0.52, 1.45);
      broken.rotation.set(-1.2, 0.5, 0.2);
      addMesh(group, broken);
    } else {
      const lamp = new Mesh(new CylinderGeometry(0.34, 0.34, 0.6, 8), metalMaterial);
      lamp.position.y = lanternBase + lanternH / 2;
      addMesh(group, lamp);
    }

    group.userData.assetId = 'coastal-lighthouse';
    return group;
  },
};

function addCylinder(
  group: Group,
  radius: number,
  height: number,
  y: number,
  material: MeshStandardMaterial,
  segments: number,
): Mesh {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.y = y;
  return addMesh(group, mesh);
}

function addBox(
  group: Group,
  size: { x: number; y: number; z: number },
  at: { x: number; y: number; z: number },
  material: MeshStandardMaterial,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(at.x, at.y, at.z);
  return addMesh(group, mesh);
}
