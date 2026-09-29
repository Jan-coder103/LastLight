import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

const trunkMaterial = new MeshStandardMaterial({ color: '#594332', roughness: 1 });
trunkMaterial.name = 'bark';
const pineMaterials = [
  new MeshStandardMaterial({ color: '#355842', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#42684d', roughness: 1, flatShading: true }),
  new MeshStandardMaterial({ color: '#2d4b3c', roughness: 1, flatShading: true }),
];
pineMaterials[0]!.name = 'foliage-light';
pineMaterials[1]!.name = 'foliage-middle';
pineMaterials[2]!.name = 'foliage-dark';

const lowDetailTrunkGeometry = new CylinderGeometry(0.34, 0.48, 2.5, 4);
const lowDetailCanopyGeometry = new ConeGeometry(2.05, 6.3, 5);

export const pineTree: AuthoredAsset = {
  schemaVersion: 1,
  id: 'pine-tree',
  name: 'Pine Tree',
  category: 'prop',
  dimensions: { x: 4, y: 8.5, z: 4 },
  collider: { center: { x: 0, y: 0.8, z: 0 }, size: { x: 1.05, y: 1.6, z: 1.05 } },
  interactionPoints: [],
  createVisual() {
    const tree = new Group();
    const trunk = new Mesh(new CylinderGeometry(0.34, 0.48, 2.5, 6), trunkMaterial);
    trunk.position.y = 1.25;
    tree.add(trunk);
    [
      { radius: 2.2, height: 3.4, y: 3.2, material: 0 },
      { radius: 1.75, height: 3.1, y: 5, material: 1 },
      { radius: 1.2, height: 2.7, y: 6.7, material: 2 },
    ].forEach(({ radius, height, y, material }) => {
      const foliage = new Mesh(new ConeGeometry(radius, height, 7), pineMaterials[material]);
      foliage.position.y = y;
      foliage.castShadow = true;
      tree.add(foliage);
    });
    trunk.castShadow = true;
    tree.userData.assetId = 'pine-tree';
    return tree;
  },
  createLowDetailVisual() {
    const tree = new Group();
    const trunk = new Mesh(lowDetailTrunkGeometry, trunkMaterial);
    trunk.position.y = 1.25;
    trunk.castShadow = false;
    tree.add(trunk);

    const canopy = new Mesh(lowDetailCanopyGeometry, pineMaterials[1]!);
    canopy.position.y = 4.8;
    canopy.castShadow = false;
    tree.add(canopy);
    tree.userData.assetId = 'pine-tree';
    tree.userData.lod = 'low';
    return tree;
  },
};
