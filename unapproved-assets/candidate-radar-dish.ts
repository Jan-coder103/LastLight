import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Radar dish landmark. The bowl is a faceted spherical cap whose OPENING faces local +Z before the
// head tilt, with the feed horn on the concave side. Dish surfaces are DoubleSide because a player
// looking into the bowl sees the back of the single-surface shell. The tilt is a variant axis
// because that is what a radar is for.
const dishMaterials = [
  new MeshStandardMaterial({
    color: '#8b887d',
    roughness: 0.85,
    metalness: 0.15,
    flatShading: true,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: '#9b624d',
    roughness: 0.9,
    metalness: 0.15,
    flatShading: true,
    side: DoubleSide,
  }),
  new MeshStandardMaterial({
    color: '#65766d',
    roughness: 0.8,
    metalness: 0.15,
    flatShading: true,
    side: DoubleSide,
  }),
];
dishMaterials[0]!.name = 'dish-panel-grey';
dishMaterials[1]!.name = 'dish-panel-rust';
dishMaterials[2]!.name = 'dish-panel-green';

const frameMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.82,
  metalness: 0.25,
  flatShading: true,
});
frameMaterial.name = 'frame-steel';

const concreteMaterial = new MeshStandardMaterial({ color: '#797762', roughness: 1 });
concreteMaterial.name = 'concrete-base';

const feedMaterial = new MeshStandardMaterial({
  color: '#444943',
  roughness: 0.7,
  metalness: 0.2,
});
feedMaterial.name = 'feed-dark';

const PEDESTAL_H = 5.2;
const HUB_Y = 0.36 + PEDESTAL_H + 0.39;
const DISH_R = 3.4;
const DISH_THETA = 0.95;
const RIM_R = DISH_R * Math.sin(DISH_THETA);
const RIM_Y = DISH_R * Math.cos(DISH_THETA);
// Feed sits just outside the rim plane on the bowl axis, near the cap's focal distance.
const FEED_Y = 1.72;

// A thin straight member between two points, for ribs and feed struts.
function strutBetween(from: Vector3, to: Vector3, thickness: number, depth: number): Mesh {
  const direction = to.clone().sub(from);
  const member = new Mesh(new BoxGeometry(thickness, direction.length(), depth), frameMaterial);
  member.position.copy(from).add(to).multiplyScalar(0.5);
  member.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return member;
}

export const candidateRadarDish: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-radar-dish',
  name: 'Radar Dish',
  category: 'landmark',
  dimensions: { x: 7.2, y: 9.5, z: 6.6 },
  // Pedestal and pad only. The dish is more than 5 m overhead and a player can walk underneath it,
  // which is the better read. Same judgement as the wind pump, for the same reason.
  collider: { center: { x: 0, y: 2.6, z: 0 }, size: { x: 2.3, y: 5.2, z: 2.3 } },
  interactionPoints: [
    { id: 'radar-pedestal', label: 'Radar Dish', position: { x: 0, y: 0, z: 2.2 } },
  ],
  createVisual(variant = 0) {
    const radar = new Group();
    const dishMaterial = dishMaterials[variant % dishMaterials.length]!;
    // Tilt about X, so the bowl opening points up and toward +Z. Variant 2 is the near-horizontal
    // "parked" attitude that a dish left behind would most likely be in.
    const tilt = [0.55, 0.9, 0.15][variant % 3]!;
    const roll = [0.0, 0.35, -0.2][variant % 3]!;

    const pad = new Mesh(new BoxGeometry(3.6, 0.36, 3.6), concreteMaterial);
    pad.position.y = 0.18;
    pad.receiveShadow = true;
    radar.add(pad);

    // Tapered pedestal with a bearing collar, so the dish reads as able to turn.
    const pedestal = new Mesh(new CylinderGeometry(0.55, 0.95, PEDESTAL_H, 8), concreteMaterial);
    pedestal.position.y = 0.36 + PEDESTAL_H / 2;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    radar.add(pedestal);
    const collar = new Mesh(new CylinderGeometry(0.72, 0.72, 0.4, 8), frameMaterial);
    collar.position.y = 0.36 + PEDESTAL_H;
    collar.castShadow = true;
    radar.add(collar);

    // Waveguide run: a thin conduit up the pedestal from the equipment cabinet to the head.
    const waveguide = new Mesh(new BoxGeometry(0.09, PEDESTAL_H - 0.6, 0.09), frameMaterial);
    waveguide.position.set(0.62, 0.36 + (PEDESTAL_H - 0.6) / 2, 0.58);
    radar.add(waveguide);
    const waveguideElbow = new Mesh(new BoxGeometry(0.09, 0.09, 0.7), frameMaterial);
    waveguideElbow.position.set(0.62, 0.36 + PEDESTAL_H - 0.6, 0.28);
    radar.add(waveguideElbow);

    const head = new Group();
    head.position.y = HUB_Y;
    // The head group holds the whole bowl assembly; tilt about X so the dish face points up and
    // toward +Z, then roll about Z for the off-axis attitudes.
    head.rotation.set(-tilt, 0, roll);
    radar.add(head);

    // The bowl group is authored in cap space: a spherical cap around +Y whose concave side faces
    // -Y. Rotating it -90 degrees about X turns the opening toward +Z. The bowl is then shifted
    // along +Z so its back hub lands exactly on the head origin — until this shift the whole cap
    // hovered 2-3.5 m BEHIND the pedestal with nothing connecting the two, which read as a dish
    // floating next to a tower. With the hub on the origin the dish also stays centred over the
    // pedestal for every tilt, because the head rotates about that same point.
    const bowl = new Group();
    bowl.rotation.x = -Math.PI / 2;
    bowl.position.z = DISH_R + 0.06;
    head.add(bowl);

    // Faceted spherical cap. 12 x 4 segments with flat shading: enough to read as a curved dish,
    // few enough that the facets are deliberate rather than accidental. DoubleSide so the concave
    // inner surface renders when looking into the bowl.
    const dish = new Mesh(
      new SphereGeometry(DISH_R, 12, 4, 0, Math.PI * 2, 0, DISH_THETA),
      dishMaterial,
    );
    dish.castShadow = true;
    dish.receiveShadow = true;
    bowl.add(dish);

    // Rim ring at the cap's edge, which is what stops the cap reading as a solid dome.
    const rim = new Mesh(new CylinderGeometry(RIM_R, RIM_R, 0.14, 12), frameMaterial);
    rim.position.y = RIM_Y;
    bowl.add(rim);

    // Back hub disc on the convex side, where the ribs converge.
    const backHub = new Mesh(new CylinderGeometry(0.42, 0.55, 0.22, 8), frameMaterial);
    backHub.position.y = DISH_R + 0.06;
    backHub.castShadow = true;
    bowl.add(backHub);

    // Five back ribs from the hub to the rim, offset just clear of the shell along the radius from
    // the cap's sphere centre, so they sit on the outside of the dish rather than inside it.
    const ribRadius = DISH_R + 0.16;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const pointAt = (t: number) =>
        new Vector3(
          ribRadius * Math.sin(t) * Math.cos(a),
          ribRadius * Math.cos(t),
          ribRadius * Math.sin(t) * Math.sin(a),
        );
      const rib = strutBetween(pointAt(0.1), pointAt(DISH_THETA), 0.09, 0.16);
      rib.castShadow = true;
      bowl.add(rib);
    }

    // Feed horn on the concave side, aimed back at the cap vertex, on a three-legged tripod
    // reaching back to the rim ring.
    const feedArm = new Mesh(new CylinderGeometry(0.13, 0.13, 0.55, 8), feedMaterial);
    feedArm.position.y = FEED_Y;
    feedArm.castShadow = true;
    bowl.add(feedArm);
    const horn = new Mesh(new CylinderGeometry(0.3, 0.1, 0.32, 8), feedMaterial);
    horn.position.y = FEED_Y + 0.42;
    horn.castShadow = true;
    bowl.add(horn);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const rimPoint = new Vector3(RIM_R * Math.cos(a), RIM_Y, RIM_R * Math.sin(a));
      const feedPoint = new Vector3(0, FEED_Y + 0.05, 0);
      const strut = strutBetween(rimPoint, feedPoint, 0.06, 0.06);
      strut.castShadow = true;
      bowl.add(strut);
    }

    // Mount, counterweight, equipment box, and access ladder, all on the -Z side of the
    // pedestal. The dish shell now sweeps the +Z side in every variant, so anything left in
    // front of the pedestal would be clipped by the tilted rim; the rear stays clear at all
    // attitudes and is where a real az-el mount hangs its balance weight anyway.
    const mountPost = new Mesh(new BoxGeometry(0.34, 0.8, 0.3), frameMaterial);
    mountPost.position.set(0, 6.0, -0.55);
    mountPost.castShadow = true;
    radar.add(mountPost);
    const mountArm = new Mesh(new BoxGeometry(0.3, 0.26, 0.6), frameMaterial);
    mountArm.position.set(0, 6.28, -0.32);
    mountArm.castShadow = true;
    radar.add(mountArm);
    const counterweight = new Mesh(new BoxGeometry(0.42, 0.5, 0.44), frameMaterial);
    counterweight.position.set(0, 5.95, -0.85);
    counterweight.castShadow = true;
    radar.add(counterweight);

    const cabinet = new Mesh(new BoxGeometry(1.1, 1.3, 0.7), frameMaterial);
    cabinet.position.set(1.3, 0.36 + 0.65, -0.9);
    cabinet.castShadow = true;
    radar.add(cabinet);
    for (const x of [0.42, 0.86]) {
      const rail = new Mesh(new BoxGeometry(0.06, 4.1, 0.06), frameMaterial);
      rail.position.set(x, 0.36 + 2.05, -1.15);
      rail.castShadow = true;
      radar.add(rail);
    }
    // Rung spacing 0.41 m: close enough to read as a real ladder.
    for (let i = 0; i < 9; i++) {
      const rung = new Mesh(new BoxGeometry(0.5, 0.05, 0.05), frameMaterial);
      rung.position.set(0.64, 0.72 + i * 0.41, -1.15);
      radar.add(rung);
    }

    radar.userData.assetId = 'candidate-radar-dish';
    return radar;
  },
};
