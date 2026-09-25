import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

const wallMaterials = [
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#aaa18f', roughness: 1 }),
];
const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 1,
  flatShading: true,
});
const windowMaterial = new MeshStandardMaterial({
  color: '#65766d',
  roughness: 0.8,
  metalness: 0.05,
});
const doorMaterial = new MeshStandardMaterial({ color: '#4b4035', roughness: 1 });

export const buildingShell: AuthoredAsset = {
  schemaVersion: 1,
  id: 'building-shell',
  name: 'City Building Shell',
  category: 'building',
  dimensions: { x: 21, y: 9, z: 18 },
  collider: { center: { x: 0, y: 4.5, z: 0 }, size: { x: 20, y: 9, z: 17 } },
  interactionPoints: [{ id: 'front-door', label: 'Front Door', position: { x: 0, y: 0, z: 9.1 } }],
  createVisual(variant = 0) {
    const shell = new Group();
    const body = new Mesh(
      new BoxGeometry(20, 8, 17),
      wallMaterials[variant % wallMaterials.length],
    );
    body.position.y = 4;
    body.castShadow = true;
    body.receiveShadow = true;
    shell.add(body);
    const roof = new Mesh(new BoxGeometry(21.5, 1, 18.5), roofMaterial);
    roof.position.y = 8.5;
    roof.castShadow = true;
    shell.add(roof);
    const door = new Mesh(new BoxGeometry(1.7, 3.2, 0.18), doorMaterial);
    door.position.set(0, 1.6, 8.57);
    shell.add(door);
    for (const side of [-1, 1]) {
      for (const floor of [0, 1]) {
        const windowMesh = new Mesh(new BoxGeometry(2.4, 1.8, 0.2), windowMaterial);
        windowMesh.position.set(side * 5.5, 2.2 + floor * 3.5, 8.55);
        shell.add(windowMesh);
      }
    }
    shell.userData.assetId = 'building-shell';
    return shell;
  },
};
