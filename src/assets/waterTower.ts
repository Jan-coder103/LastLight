import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.8,
  metalness: 0.25,
});
const tankMaterial = new MeshStandardMaterial({
  color: '#7b7059',
  roughness: 0.9,
  flatShading: true,
});

export const waterTower: AuthoredAsset = {
  schemaVersion: 1,
  id: 'water-tower',
  name: 'Water Tower Landmark',
  category: 'landmark',
  dimensions: { x: 11, y: 16, z: 11 },
  collider: { center: { x: 0, y: 6.7, z: 0 }, size: { x: 3.8, y: 13.4, z: 3.8 } },
  interactionPoints: [],
  createVisual() {
    const tower = new Group();
    for (const x of [-2.2, 2.2]) {
      for (const z of [-2.2, 2.2]) {
        const leg = new Mesh(new CylinderGeometry(0.13, 0.22, 12, 5), steelMaterial);
        leg.position.set(x, 6, z);
        leg.rotation.z = (x < 0 ? -1 : 1) * 0.08;
        leg.castShadow = true;
        tower.add(leg);
      }
    }
    for (const y of [2.2, 6.8, 11.2]) {
      const brace = new Mesh(new BoxGeometry(5.5, 0.18, 5.5), steelMaterial);
      brace.position.y = y;
      tower.add(brace);
    }
    const tank = new Mesh(new CylinderGeometry(4.3, 4.3, 4.1, 9), tankMaterial);
    tank.position.y = 13.1;
    tank.castShadow = true;
    tower.add(tank);
    const cap = new Mesh(new CylinderGeometry(0.25, 0.25, 2.4, 5), steelMaterial);
    cap.position.y = 16.3;
    tower.add(cap);
    tower.userData.assetId = 'water-tower';
    return tower;
  },
};
