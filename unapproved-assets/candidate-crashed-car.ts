import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.

// A real sedan is about 4.70 x 1.87 x 1.51 m. That is correct in absolute terms but reads
// small next to the 2.1 m gameplay scout, which is a stylised 2.1 m human rather than a real
// 1.8 m one. Deriving the fix from the scout instead of guessing a percentage: a sedan roof
// is 1.51/1.8 = 0.84 of human height, so against a 2.1 m scout the roof should be 1.76 m and
// the length 5.48 m. That is CAR_SCALE = 1.17, which lands the model on the same proportions
// it would have at real-world scale rather than simply inflating it.
// One constant fixes the whole model, and every declared number below is derived from it, so
// the geometry and the metadata cannot drift apart.
const CAR_SCALE = 1.17;

const scaled = (value: number): number => Math.round(value * CAR_SCALE * 100) / 100;
const scaledVec = (value: { x: number; y: number; z: number }) => ({
  x: scaled(value.x),
  y: scaled(value.y),
  z: scaled(value.z),
});

const paintMaterials = [
  new MeshStandardMaterial({ color: '#8e5142', roughness: 0.93, flatShading: true }),
  new MeshStandardMaterial({ color: '#5c6a66', roughness: 0.93, flatShading: true }),
  new MeshStandardMaterial({ color: '#7a7458', roughness: 0.93, flatShading: true }),
];
paintMaterials[0]!.name = 'paint-faded-red';
paintMaterials[1]!.name = 'paint-dusty-teal';
paintMaterials[2]!.name = 'paint-khaki';

const trimMaterial = new MeshStandardMaterial({ color: '#3a3a35', roughness: 0.92 });
trimMaterial.name = 'trim-dark';

const metalMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.25,
});
metalMaterial.name = 'metal';

const rustMaterial = new MeshStandardMaterial({ color: '#6b3f30', roughness: 1 });
rustMaterial.name = 'rust';

const housingMaterial = new MeshStandardMaterial({ color: '#33332e', roughness: 0.97 });
housingMaterial.name = 'lamp-housing';

// Broken safety glass keeps the pale green cast of the project's glass swatches.
// Opaque rather than transparent so the shards do not need depth sorting in a busy scene.
const glassMaterial = new MeshStandardMaterial({
  color: '#8a9c95',
  roughness: 0.32,
  metalness: 0.06,
  side: DoubleSide,
  flatShading: true,
});
glassMaterial.name = 'glass-broken';

const interiorMaterial = new MeshStandardMaterial({ color: '#4a4a42', roughness: 1 });
interiorMaterial.name = 'interior';

const tyreMaterial = new MeshStandardMaterial({
  color: '#2a2a28',
  roughness: 1,
  flatShading: true,
});
tyreMaterial.name = 'tyre';

// A dead lens, so no emissive: the car has not been running for a long time.
const tailLightMaterial = new MeshStandardMaterial({ color: '#8a4438', roughness: 0.55 });
tailLightMaterial.name = 'tail-light';

function addBox(
  parent: Group,
  material: MeshStandardMaterial,
  sizeX: number,
  sizeY: number,
  sizeZ: number,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = new Mesh(new BoxGeometry(sizeX, sizeY, sizeZ), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function addRod(
  parent: Group,
  material: MeshStandardMaterial,
  from: Vector3,
  to: Vector3,
  radius: number,
  segments = 6,
): Mesh {
  const direction = to.clone().sub(from);
  const length = direction.length();
  const rod = new Mesh(new CylinderGeometry(radius, radius, length, segments), material);
  rod.position.copy(from).add(to).multiplyScalar(0.5);
  rod.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  parent.add(rod);
  return rod;
}

/**
 * Windshield remnant: a quad strip spanning the full width whose upper edge is a fixed
 * zigzag, so the pane reads as punched-out safety glass clinging to the frame.
 */
function addShardPane(
  parent: Group,
  material: MeshStandardMaterial,
  halfWidth: number,
  baseY: number,
  baseZ: number,
  topY: number,
  topZ: number,
  topDrops: number[],
): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [column, drop] of topDrops.entries()) {
    const x = -halfWidth + (2 * halfWidth * column) / (topDrops.length - 1);
    positions.push(x, baseY, baseZ);
    positions.push(x, baseY + (topY - baseY) * drop, baseZ + (topZ - baseZ) * drop);
  }
  for (let column = 0; column < topDrops.length - 1; column += 1) {
    const a = column * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const pane = new Mesh(geometry, material);
  parent.add(pane);
  return pane;
}

export const candidateCrashedCar: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-crashed-car',
  name: 'Totaled Crashed Car',
  category: 'prop',
  // Bounds are authored pre-scale and cover the swung-open driver door and the raised
  // bonnet, both of which stand proud of the body shell.
  dimensions: scaledVec({ x: 2.99, y: 1.96, z: 4.7 }),
  collider: {
    center: scaledVec({ x: 0, y: 0.98, z: 0 }),
    size: scaledVec({ x: 2.95, y: 1.96, z: 4.62 }),
  },
  interactionPoints: [
    { id: 'boot', label: 'Boot', position: scaledVec({ x: 0, y: 0, z: -2.45 }) },
    { id: 'driver-door', label: 'Driver door', position: scaledVec({ x: 1.5, y: 0, z: -0.1 }) },
  ],
  createVisual(variant = 0) {
    const car = new Group();
    const paint = paintMaterials[variant % paintMaterials.length]!;

    // All geometry is authored in real-world car metres and lifted by a single group
    // scale, so the correction lives in exactly one place.
    const body = new Group();
    body.scale.setScalar(CAR_SCALE);
    car.add(body);

    // Main tub, dark rocker panel, and the beltline lip that the greenhouse sits on.
    // The tub is a single closed box, so the engine bay and door aperture are cut into it by
    // leaving gaps between sections. Section 1 is the nose, 2 the engine bay, 3 the cabin
    // floor under the aperture, 4 the boot. Without these gaps the raised bonnet and the open
    // door would both be looking at solid painted bodywork.
    addBox(body, trimMaterial, 1.72, 0.16, 4.1, 0, 0.24, 0);
    // Nose section, z 1.95..2.18.
    addBox(body, paint, 1.8, 0.62, 0.23, 0, 0.58, 2.065);
    // Front fender flanks either side of the engine bay, z 0.86..1.95.
    for (const side of [-1, 1]) {
      addBox(body, paint, 0.3, 0.62, 1.09, side * 0.75, 0.58, 1.405);
    }
    // Cabin section either side of the door aperture, z -1.5..0.86. The +x side is cut back to
    // a narrow pillar beside the doorway; only the -x side is a full flank, so the driver's
    // aperture is a real opening through the body rather than a recess in a solid wall.
    addBox(body, paint, 0.34, 0.62, 2.36, -0.73, 0.58, -0.32);
    addBox(body, paint, 0.34, 0.62, 0.5, 0.73, 0.58, -1.1);
    addBox(body, paint, 0.34, 0.62, 0.44, 0.73, 0.58, 0.64);
    // Boot section, z -2.18..-1.5.
    addBox(body, paint, 1.8, 0.62, 0.68, 0, 0.58, -1.84);
    // Floor spanning the engine bay and doorway, so the car is not see-through underneath.
    addBox(body, trimMaterial, 1.46, 0.1, 3.45, 0, 0.3, -0.02);

    // Beltline lip. Deliberately NOT a single long box: it is broken over the engine bay
    // (z 0.86..1.95) and over the door aperture (x > 0, z -0.75..0.45), because a continuous
    // lip would roof over the open bonnet and close the doorway at window height.
    addBox(body, paint, 1.76, 0.09, 0.68, 0, 0.9, -1.84);
    addBox(body, paint, 1.76, 0.09, 1.32, 0, 0.9, 0.5);
    addBox(body, paint, 1.76, 0.09, 0.23, 0, 0.9, 2.065);
    // -x flank lip runs the cabin's full length; +x is two short stubs around the doorway.
    addBox(body, paint, 0.34, 0.09, 2.36, -0.71, 0.9, -0.32);
    addBox(body, paint, 0.34, 0.09, 0.5, 0.71, 0.9, -1.1);
    addBox(body, paint, 0.34, 0.09, 0.44, 0.71, 0.9, 0.64);

    // Engine bay. The closed hood panels that used to sit here have been REMOVED, because the
    // bonnet is modelled raised on its hinge: leaving them in place put a painted, closed hood
    // directly under the open bonnet, which is exactly "opened but still closed underneath".
    // What remains is a dark recessed bay with an engine block, so looking down past the
    // raised bonnet shows machinery rather than bodywork.
    const engineBay = new Mesh(new BoxGeometry(1.5, 0.36, 1.24), interiorMaterial);
    engineBay.position.set(0, 0.68, 1.5);
    body.add(engineBay);
    const engineBlock = new Mesh(new BoxGeometry(0.86, 0.3, 0.72), metalMaterial);
    engineBlock.position.set(-0.1, 0.82, 1.52);
    engineBlock.castShadow = true;
    body.add(engineBlock);
    const airBox = new Mesh(new BoxGeometry(0.44, 0.24, 0.5), trimMaterial);
    airBox.position.set(0.44, 0.8, 1.46);
    body.add(airBox);
    // Radiator at the front of the bay, closing it off under the crumpled nose.
    const radiator = new Mesh(new BoxGeometry(1.24, 0.3, 0.1), metalMaterial);
    radiator.position.set(0, 0.78, 2.06);
    body.add(radiator);
    // Bay walls, so the opening has a visible lip rather than a floating dark box.
    for (const side of [-1, 1]) {
      addBox(body, paint, 0.16, 0.26, 1.3, side * 0.83, 0.79, 1.5);
    }
    addBox(body, paint, 1.68, 0.26, 0.14, 0, 0.79, 0.86);

    // Door aperture dressing. The dark panel is set INSIDE the cabin, well inboard of the
    // flank, so it reads as the shadowed interior seen through the opening rather than
    // plugging the doorway it is meant to reveal.
    const cabinShadow = new Mesh(new BoxGeometry(0.1, 0.5, 0.98), interiorMaterial);
    cabinShadow.position.set(0.42, 0.63, 0.2);
    body.add(cabinShadow);
    const doorSill = new Mesh(new BoxGeometry(0.2, 0.09, 1.02), trimMaterial);
    doorSill.position.set(0.8, 0.35, 0.2);
    body.add(doorSill);

    // Crushed nose ahead of the engine bay. The bonnet itself is modelled further down, raised
    // on its hinge, so nothing here closes the bay.
    const noseCrumple = addBox(body, paint, 0.86, 0.12, 0.26, -0.18, 1.0, 2.04);
    noseCrumple.rotation.set(-0.6, 0.12, 0.1);

    // Front end: one surviving headlight lens, one empty socket, grille and a hanging bumper.
    const grille = addBox(body, trimMaterial, 1.36, 0.3, 0.1, 0, 0.7, 2.17);
    grille.rotation.x = 0.06;
    addBox(body, glassMaterial, 0.32, 0.15, 0.08, -0.62, 0.76, 2.17);
    addBox(body, housingMaterial, 0.32, 0.15, 0.06, 0.62, 0.76, 2.16);
    const frontBumper = addBox(body, trimMaterial, 1.72, 0.17, 0.16, 0, 0.38, 2.24);
    frontBumper.rotation.x = 0.18;
    addBox(body, trimMaterial, 1.6, 0.14, 0.12, 0, 0.22, 2.1);

    // Rear end: left tail light present, right tail light missing and open to its housing.
    addBox(body, paint, 1.72, 0.32, 0.1, 0, 0.74, -2.2);
    addBox(body, tailLightMaterial, 0.46, 0.17, 0.08, -0.6, 0.78, -2.25);
    addBox(body, housingMaterial, 0.46, 0.17, 0.05, 0.6, 0.78, -2.235);
    addBox(body, trimMaterial, 1.7, 0.16, 0.16, 0, 0.38, -2.26);

    // Greenhouse frame. Every side and rear window is empty, so the interior stays readable.
    for (const side of [-1, 1]) {
      addRod(
        body,
        paint,
        new Vector3(side * 0.79, 0.92, 0.78),
        new Vector3(side * 0.74, 1.38, 0.4),
        0.045,
      );
      addRod(
        body,
        paint,
        new Vector3(side * 0.82, 0.9, -0.34),
        new Vector3(side * 0.77, 1.4, -0.34),
        0.05,
      );
      addRod(
        body,
        paint,
        new Vector3(side * 0.79, 0.9, -1.5),
        new Vector3(side * 0.72, 1.4, -1.2),
        0.06,
      );
      // Sill rail, broken on the +x side over the doorway so the aperture stays open.
      if (side < 0) addBox(body, paint, 0.08, 0.11, 2.34, side * 0.86, 0.94, -0.36);
      else {
        addBox(body, paint, 0.08, 0.11, 0.5, side * 0.86, 0.94, -1.1);
        addBox(body, paint, 0.08, 0.11, 0.44, side * 0.86, 0.94, 0.64);
      }
    }
    addBox(body, paint, 1.72, 0.1, 0.74, 0, 0.92, -1.88);
    // Two-piece roof with the front panel caved DOWNWARD by the impact. The rotation is
    // positive so the leading edge drops below the trailing edge; a negative value lifts the
    // nose and reads as a pop-up sunroof instead. Height and centre are set so the caved
    // front edge lands on the A-pillar top (1.380) and the high rear edge meets the roof
    // panel behind it (1.495) without a step.
    const roofFront = addBox(body, paint, 1.5, 0.09, 0.72, 0, 1.4, 0.06);
    roofFront.rotation.x = 0.14;
    const roofRear = addBox(body, paint, 1.5, 0.09, 0.92, 0, 1.45, -0.72);
    roofRear.rotation.x = 0.03;

    addShardPane(
      body,
      glassMaterial,
      0.76,
      0.92,
      0.78,
      1.38,
      0.4,
      [0, 0.18, 0.02, 0.34, 0.0, 0.4, 0.05, 0.3, 0.04],
    );

    // Interior seen through the empty side windows.
    addBox(body, interiorMaterial, 1.58, 0.06, 1.86, 0, 0.9, -0.35);
    addBox(body, interiorMaterial, 1.54, 0.22, 0.26, 0, 1.01, 0.56);
    for (const side of [-1, 1]) {
      addBox(body, interiorMaterial, 0.5, 0.12, 0.48, side * 0.38, 0.98, -0.06);
      addBox(body, interiorMaterial, 0.5, 0.54, 0.12, side * 0.38, 1.25, -0.3);
    }
    addBox(body, interiorMaterial, 1.3, 0.44, 0.12, 0, 1.2, -1.24);
    const steeringWheel = new Mesh(new CylinderGeometry(0.17, 0.17, 0.03, 10), trimMaterial);
    steeringWheel.position.set(0.38, 1.06, 0.42);
    steeringWheel.rotation.x = -0.45;
    body.add(steeringWheel);

    // Three surviving wheels. Front right is a bare hub and brake disc; rear left is a flat.
    const wheel = (x: number, y: number, z: number, scaleX: number, scaleZ: number): Mesh => {
      const tyre = new Mesh(new CylinderGeometry(0.33, 0.33, 0.23, 10), tyreMaterial);
      tyre.position.set(x, y, z);
      tyre.rotation.z = Math.PI / 2;
      tyre.scale.set(scaleX, 1, scaleZ);
      body.add(tyre);
      return tyre;
    };
    wheel(-0.8, 0.33, 1.44, 1, 1);
    // The flat is squashed along the wheel's radial axis and bulged along its axle, so it
    // reads as a collapsed tyre rather than a small wheel. Scale is local, so radial is x
    // and axial is y once the mesh is rotated onto the X axis.
    wheel(-0.8, 0.25, -1.46, 0.74, 1.15);
    wheel(0.8, 0.33, -1.46, 1, 1);
    for (const [x, y, z, radius, width] of [
      [-0.8, 0.33, 1.44, 0.19, 0.24],
      [-0.8, 0.25, -1.46, 0.14, 0.28],
      [0.8, 0.33, -1.46, 0.19, 0.24],
    ] as const) {
      const cap = new Mesh(new CylinderGeometry(radius, radius, width, 8), metalMaterial);
      cap.position.set(x, y, z);
      cap.rotation.z = Math.PI / 2;
      body.add(cap);
    }
    const bareHub = new Mesh(new CylinderGeometry(0.15, 0.15, 0.16, 8), metalMaterial);
    bareHub.position.set(0.78, 0.33, 1.44);
    bareHub.rotation.z = Math.PI / 2;
    body.add(bareHub);
    const brakeDisc = new Mesh(new CylinderGeometry(0.23, 0.23, 0.05, 10), trimMaterial);
    brakeDisc.position.set(0.76, 0.33, 1.44);
    brakeDisc.rotation.z = Math.PI / 2;
    body.add(brakeDisc);

    // Weathering panels rather than a texture.
    addBox(body, rustMaterial, 0.03, 0.44, 1.15, -0.912, 0.56, 0.6);
    addBox(body, rustMaterial, 0.03, 0.4, 0.95, 0.912, 0.58, -1.15);
    addBox(body, rustMaterial, 0.44, 0.1, 0.03, 0.35, 0.4, -2.35);

    // Driver door, swung wide open on its front hinge. This is the single strongest "totaled"
    // cue available: it breaks the body's clean flank, it reads as abandonment, and it lets a
    // player see straight into the gutted cabin. The hinge is a parent group at the A-pillar
    // base so the door rotates from the correct edge rather than pivoting about its centre.
    const doorHinge = new Group();
    doorHinge.position.set(0.88, 0, 0.74);
    body.add(doorHinge);
    const door = new Mesh(new BoxGeometry(0.08, 0.62, 1.12), paint);
    door.position.set(0, 0.62, -0.56);
    door.castShadow = true;
    doorHinge.add(door);
    // Inner door card, visible now that the door is open and standing off the body.
    const doorCard = new Mesh(new BoxGeometry(0.04, 0.5, 0.98), interiorMaterial);
    doorCard.position.set(-0.05, 0.62, -0.56);
    doorHinge.add(doorCard);
    // Window frame rail along the top of the door, the only glazing left anywhere on the car.
    const doorRail = new Mesh(new BoxGeometry(0.06, 0.07, 1.0), paint);
    doorRail.position.set(0, 0.95, -0.56);
    doorHinge.add(doorRail);
    doorHinge.rotation.y = -0.95;

    // A second, smaller cue on the far side: the rear-left door is ajar by a few degrees,
    // which stops the car reading as "one door open" rather than "left in a hurry".
    const rearDoorHinge = new Group();
    rearDoorHinge.position.set(-0.88, 0, -0.42);
    body.add(rearDoorHinge);
    const rearDoor = new Mesh(new BoxGeometry(0.08, 0.6, 1.06), paint);
    rearDoor.position.set(0, 0.61, -0.53);
    rearDoor.castShadow = true;
    rearDoorHinge.add(rearDoor);
    rearDoorHinge.rotation.y = 0.22;

    // Bonnet unlatched and popped at the rear, hinged at the cowl. A flat bent panel reads as
    // merely dented; a raised one reads as a car somebody crawled out of. The angle is chosen
    // so the far tip lands near y = 1.72, keeping the wreck under about 1.8x the roof height;
    // a fully vertical bonnet would stand 2.5 m tall and dominate both the silhouette and the
    // placement footprint.
    const bonnetHinge = new Group();
    bonnetHinge.position.set(0, 1.02, 0.78);
    body.add(bonnetHinge);
    const bonnetAngle = -0.52;
    const bonnet = new Mesh(new BoxGeometry(1.6, 0.09, 1.16), paint);
    bonnet.position.set(0, 0.3, 0.5);
    bonnet.castShadow = true;
    bonnetHinge.add(bonnet);
    const bonnetCrumple = new Mesh(new BoxGeometry(1.5, 0.1, 0.3), paint);
    bonnetCrumple.position.set(0, 0.33, 0.96);
    bonnetCrumple.rotation.x = -0.5;
    bonnetHinge.add(bonnetCrumple);
    bonnetHinge.rotation.x = bonnetAngle;

    // Bent B-pillar, the consequence of a side impact: it leans inboard, so the cabin has
    // lost its upright rectangle and the roofline above it is no longer square.
    const bentPillar = new Mesh(new CylinderGeometry(0.05, 0.055, 0.54, 6), paint);
    bentPillar.position.set(-0.74, 1.14, -0.34);
    bentPillar.rotation.z = 0.3;
    bentPillar.castShadow = true;
    body.add(bentPillar);

    // Crushed roof edge above the B-pillar, where the impact folded the skin inward.
    const roofDent = new Mesh(new BoxGeometry(0.5, 0.07, 0.46), paint);
    roofDent.position.set(-0.55, 1.45, -0.4);
    roofDent.rotation.set(0.1, 0.22, -0.34);
    roofDent.castShadow = true;
    body.add(roofDent);

    car.traverse((object) => {
      if (object instanceof Mesh) object.castShadow = true;
    });
    car.userData.assetId = 'candidate-crashed-car';
    return car;
  },
};
