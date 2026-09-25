import { DodecahedronGeometry, Mesh, MeshStandardMaterial, Group } from 'three';
import type { AuthoredAsset } from './assetTypes';

const stoneMaterial = new MeshStandardMaterial({
  color: '#77796a',
  roughness: 1,
  flatShading: true,
});

export const boulder: AuthoredAsset = {
  schemaVersion: 1,
  id: 'boulder',
  name: 'Field Boulder',
  category: 'prop',
  dimensions: { x: 3.4, y: 2.3, z: 2.8 },
  collider: { center: { x: 0, y: 0.72, z: 0 }, size: { x: 2.6, y: 1.55, z: 2.25 } },
  interactionPoints: [],
  createVisual() {
    const group = new Group();
    const stone = new Mesh(new DodecahedronGeometry(1.22, 0), stoneMaterial);
    stone.scale.set(1.35, 0.86, 1.12);
    stone.position.y = 0.78;
    stone.rotation.set(0.12, 0.37, -0.08);
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
    group.userData.assetId = 'boulder';
    return group;
  },
};
