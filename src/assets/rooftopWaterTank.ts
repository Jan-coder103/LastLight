import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Rooftop water tank. Deliberate pivot exception: y = 0 is the ROOF DECK the tank stands on, not
// street level, so the asset can be dropped straight onto a city shell roof without a Y offset.
const frameMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.82,
  metalness: 0.25,
  flatShading: true,
});
frameMaterial.name = 'frame-steel';

const tankMaterials = [
  new MeshStandardMaterial({ color: '#8e5142', roughness: 0.9, flatShading: true }),
  new MeshStandardMaterial({ color: '#58624d', roughness: 0.9, flatShading: true }),
  new MeshStandardMaterial({ color: '#64675d', roughness: 0.9, flatShading: true }),
];
tankMaterials[0]!.name = 'tank-rusted';
tankMaterials[1]!.name = 'tank-olive';
tankMaterials[2]!.name = 'tank-weathered';

const darkMaterial = new MeshStandardMaterial({ color: '#444943', roughness: 0.9 });
darkMaterial.name = 'trim-dark';

const DECK_Y = 2.67;
const TANK_Y = 3.79;

export const rooftopWaterTank: AuthoredAsset = {
  schemaVersion: 1,
  id: 'rooftop-water-tank',
  name: 'Rooftop Water Tank',
  category: 'prop',
  dimensions: { x: 2.7, y: 5.6, z: 3.3 },
  // Tank only. The frame below is open and the player can walk under it, so filling the whole
  // footprint would be wrong. This diverges from the existing waterTower, whose collider spans
  // its full frame height; flagging that for the owner.
  collider: { center: { x: 0, y: TANK_Y, z: 0 }, size: { x: 2.6, y: 2.2, z: 2.6 } },
  interactionPoints: [
    { id: 'tank-outlet', label: 'Tank Outlet', position: { x: 0, y: 0, z: 1.7 } },
  ],
  createVisual(variant = 0) {
    const tank = new Group();
    const tankMaterial = tankMaterials[variant % tankMaterials.length]!;

    // Splayed legs. The small outward lean is what stops the frame reading as four loose posts.
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        const leg = new Mesh(new CylinderGeometry(0.09, 0.14, 2.6, 6), frameMaterial);
        leg.position.set(x, 1.31, z);
        leg.rotation.z = -x * 0.05;
        leg.rotation.x = z * 0.05;
        leg.castShadow = true;
        tank.add(leg);
      }
    }

    // Two braced levels, each a full ring, so the frame reads from any angle.
    for (const y of [0.9, 1.9]) {
      for (const z of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(2.14, 0.1, 0.09), frameMaterial);
        bar.position.set(0, y, z);
        tank.add(bar);
      }
      for (const x of [-1, 1]) {
        const bar = new Mesh(new BoxGeometry(0.09, 0.1, 2.14), frameMaterial);
        bar.position.set(x, y, 0);
        tank.add(bar);
      }
    }

    const deck = new Mesh(new BoxGeometry(2.6, 0.14, 2.6), frameMaterial);
    deck.position.y = DECK_Y;
    deck.castShadow = true;
    deck.receiveShadow = true;
    tank.add(deck);

    // Nine-sided tank, so it keeps visible facets from the angled top-down camera.
    const drum = new Mesh(new CylinderGeometry(1.25, 1.25, 2.1, 9), tankMaterial);
    drum.position.y = TANK_Y;
    drum.castShadow = true;
    drum.receiveShadow = true;
    tank.add(drum);

    for (const y of [3.1, 4.5]) {
      const hoop = new Mesh(new CylinderGeometry(1.29, 1.29, 0.08, 9), frameMaterial);
      hoop.position.y = y;
      tank.add(hoop);
    }

    const cone = new Mesh(new CylinderGeometry(0.2, 1.3, 0.6, 9), tankMaterial);
    cone.position.y = 5.14;
    cone.castShadow = true;
    tank.add(cone);

    const hatch = new Mesh(new BoxGeometry(0.5, 0.18, 0.5), darkMaterial);
    hatch.position.y = 5.45;
    hatch.castShadow = true;
    tank.add(hatch);

    // Outlet: a drop pipe down the +Z face and a short horizontal spout over the roof edge.
    // No ladder. Rungs are thin enough to disappear at play distance, and idea 18 (grain silo)
    // is the candidate that should carry one.
    const dropPipe = new Mesh(new CylinderGeometry(0.1, 0.1, 1.4, 6), frameMaterial);
    dropPipe.position.set(0, 1.9, 1.3);
    dropPipe.castShadow = true;
    tank.add(dropPipe);
    const spout = new Mesh(new CylinderGeometry(0.09, 0.09, 0.7, 6), frameMaterial);
    spout.position.set(0, 1.25, 1.62);
    spout.rotation.x = Math.PI / 2;
    spout.castShadow = true;
    tank.add(spout);
    const valve = new Mesh(new BoxGeometry(0.22, 0.18, 0.22), darkMaterial);
    valve.position.set(0, 1.25, 1.3);
    tank.add(valve);

    tank.userData.assetId = 'candidate-rooftop-water-tank';
    return tank;
  },
};
