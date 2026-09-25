import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

const steelMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.82,
  metalness: 0.22,
});
const fadedRedMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  flatShading: true,
});
const beaconMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  emissive: '#392a12',
});

export const radioMast: AuthoredAsset = {
  schemaVersion: 1,
  id: 'radio-mast',
  name: 'Rural Radio Mast',
  category: 'landmark',
  dimensions: { x: 7, y: 18, z: 7 },
  collider: { center: { x: 0, y: 5.2, z: 0 }, size: { x: 1.3, y: 10.4, z: 1.3 } },
  interactionPoints: [{ id: 'mast-base', label: 'Relay base', position: { x: 2.5, y: 0, z: 2.5 } }],
  createVisual() {
    const group = new Group();
    const foot = new Mesh(new BoxGeometry(4.2, 0.45, 4.2), fadedRedMaterial);
    foot.position.y = 0.23;
    group.add(foot);

    const mast = new Mesh(new CylinderGeometry(0.16, 0.42, 11, 5), steelMaterial);
    mast.position.y = 5.5;
    group.add(mast);

    for (const y of [2.2, 5.4, 8.6]) {
      const brace = new Mesh(
        new BoxGeometry(3.6 - y * 0.16, 0.12, 3.6 - y * 0.16),
        fadedRedMaterial,
      );
      brace.position.y = y;
      group.add(brace);
    }

    const antenna = new Mesh(new CylinderGeometry(0.055, 0.08, 5.6, 5), steelMaterial);
    antenna.position.y = 13.2;
    group.add(antenna);

    const beacon = new Mesh(new CylinderGeometry(0.13, 0.13, 0.24, 6), beaconMaterial);
    beacon.position.y = 16.05;
    group.add(beacon);
    group.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true;
    });
    group.userData.assetId = 'radio-mast';
    return group;
  },
};
