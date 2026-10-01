import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

const shells = [
  new MeshStandardMaterial({ color: '#914c38', roughness: 0.92, flatShading: true }),
  new MeshStandardMaterial({ color: '#66734b', roughness: 0.94, flatShading: true }),
  new MeshStandardMaterial({ color: '#777667', roughness: 0.95, flatShading: true }),
];
const hoops = new MeshStandardMaterial({ color: '#343a36', roughness: 0.72, metalness: 0.26 });
const cap = new MeshStandardMaterial({
  color: '#541e1a',
  emissive: '#260806',
  emissiveIntensity: 0,
  roughness: 0.62,
  flatShading: true,
});
shells.forEach((material, index) => (material.name = `barrel-shell-${index + 1}`));
hoops.name = 'barrel-hoops';
cap.name = 'barrel-fuse-indicator';

function createBarrel(
  variant = 0,
  radialSegments = 9,
  details: 'high' | 'low' | 'very-low' = 'high',
) {
  const group = new Group();
  group.name = `Explosive Barrel (${details})`;
  const shell = new Mesh(
    new CylinderGeometry(0.34, 0.36, 0.94, radialSegments, 1),
    shells[variant % shells.length],
  );
  shell.position.y = 0.48;
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  if (details !== 'very-low') {
    for (const y of [0.22, 0.72]) {
      const hoop = new Mesh(
        new CylinderGeometry(
          0.365,
          0.365,
          details === 'high' ? 0.075 : 0.055,
          radialSegments,
          1,
          true,
        ),
        hoops,
      );
      hoop.position.y = y;
      group.add(hoop);
    }
    const top = new Mesh(new CylinderGeometry(0.33, 0.33, 0.035, radialSegments), hoops);
    top.position.y = 0.955;
    group.add(top);
  } else {
    const band = new Mesh(new BoxGeometry(0.54, 0.08, 0.54), hoops);
    band.position.y = 0.22;
    group.add(band);
  }

  const indicator = new Mesh(new CylinderGeometry(0.075, 0.075, 0.07, 5), cap);
  indicator.position.set(0, 0.995, -0.13);
  indicator.userData.explosiveBarrelBlink = true;
  group.add(indicator);
  group.userData.explosiveBarrel = true;
  return group;
}

export const explosiveBarrel: AuthoredAsset = {
  schemaVersion: 1,
  id: 'explosive-barrel',
  name: 'Explosive Barrel',
  category: 'prop',
  dimensions: { x: 0.76, y: 1.08, z: 0.76 },
  collider: { center: { x: 0, y: 0.49, z: 0 }, size: { x: 0.7, y: 0.98, z: 0.7 } },
  interactionPoints: [],
  createVisual(variant = 0) {
    return createBarrel(variant, 12, 'high');
  },
  createLowDetailVisual(variant = 0) {
    return createBarrel(variant, 7, 'low');
  },
  createVeryLowDetailVisual(variant = 0) {
    return createBarrel(variant, 5, 'very-low');
  },
};
