import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
const poleMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.82,
  metalness: 0.25,
  flatShading: true,
});
poleMaterial.name = 'pole-steel';

const baseMaterial = new MeshStandardMaterial({ color: '#8b887d', roughness: 1 });
baseMaterial.name = 'base-concrete';

const trimMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 0.9 });
trimMaterial.name = 'trim-dark';

const lensMaterial = new MeshStandardMaterial({
  color: '#e0c48a',
  roughness: 0.34,
  emissive: '#8a6c2e',
  emissiveIntensity: 0.7,
});
lensMaterial.name = 'lamp-lens';

const brokenMaterial = new MeshStandardMaterial({
  color: '#8a9c95',
  roughness: 0.34,
  metalness: 0.06,
});
brokenMaterial.name = 'lamp-glass-broken';

function addRod(parent: Group, from: Vector3, to: Vector3, radius: number, segments = 7): Mesh {
  const direction = to.clone().sub(from);
  const rod = new Mesh(
    new CylinderGeometry(radius, radius, direction.length(), segments),
    poleMaterial,
  );
  rod.position.copy(from).add(to).multiplyScalar(0.5);
  rod.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  rod.castShadow = true;
  parent.add(rod);
  return rod;
}

export const streetLight: AuthoredAsset = {
  schemaVersion: 1,
  id: 'street-light',
  name: 'Street Light',
  category: 'prop',
  dimensions: { x: 0.5, y: 6.6, z: 2.15 },
  collider: { center: { x: 0, y: 3.2, z: 0 }, size: { x: 0.34, y: 6.4, z: 0.34 } },
  interactionPoints: [
    { id: 'lamp-base', label: 'Street light', position: { x: 0.55, y: 0, z: 0.2 } },
  ],
  createVisual(variant = 0) {
    const light = new Group();
    const broken = variant === 1;
    const fallen = variant === 2;

    const plinth = new Mesh(new BoxGeometry(0.46, 0.16, 0.46), baseMaterial);
    plinth.position.y = 0.08;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    light.add(plinth);

    const collar = new Mesh(new CylinderGeometry(0.09, 0.16, 0.5, 8), poleMaterial);
    collar.position.y = 0.4;
    collar.castShadow = true;
    light.add(collar);

    const shaft = new Mesh(new CylinderGeometry(0.085, 0.12, 5.4, 8), poleMaterial);
    shaft.position.y = 3.35;
    shaft.castShadow = true;
    light.add(shaft);

    // Access hatch, the one piece of trim that reads as street furniture rather than pipe.
    const hatch = new Mesh(new BoxGeometry(0.16, 0.5, 0.06), trimMaterial);
    hatch.position.set(0, 1.1, 0.11);
    light.add(hatch);

    // Gooseneck arm reaching toward local +Z, so the light pools ahead of the pole.
    const armRoot = new Group();
    armRoot.position.y = 5.95;
    light.add(armRoot);
    addRod(armRoot, new Vector3(0, 0, 0), new Vector3(0, 0.5, 0.35), 0.07);
    addRod(armRoot, new Vector3(0, 0.5, 0.35), new Vector3(0, 0.35, 1.3), 0.06);

    const head = new Group();
    head.position.set(0, 6.24, 1.55);
    head.rotation.x = fallen ? 1.15 : 0.12;
    light.add(head);
    const housing = new Mesh(new BoxGeometry(0.34, 0.16, 0.66), poleMaterial);
    housing.castShadow = true;
    head.add(housing);
    const cap = new Mesh(new BoxGeometry(0.3, 0.05, 0.6), trimMaterial);
    cap.position.y = 0.1;
    head.add(cap);
    const lens = new Mesh(
      new BoxGeometry(0.28, 0.05, 0.56),
      broken ? brokenMaterial : lensMaterial,
    );
    lens.position.y = -0.09;
    head.add(lens);

    if (fallen) {
      // Variant 2: the head has come down and hangs off the end of the arm.
      housing.rotation.z = 0.5;
      lens.rotation.z = 0.5;
    }

    // Real light. PointLight is deliberate: SpotLight.copy() does not carry its target, so a
    // cloned SpotLight would end up aiming at the world origin instead of the ground.
    if (!broken && !fallen) {
      const bulb = new PointLight('#ffd7a0', 9, 18, 2);
      bulb.position.set(0, 5.98, 1.55);
      bulb.castShadow = false;
      bulb.name = 'street-light-bulb';
      light.add(bulb);
    }

    light.userData.assetId = 'candidate-street-light';
    return light;
  },
};
