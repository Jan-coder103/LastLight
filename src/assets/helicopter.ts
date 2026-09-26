import {
  BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

export interface HelicopterModel {
  group: Group;
  mainRotor: Group;
  tailRotor: Group;
}

function addMesh(
  parent: Group,
  geometry: BoxGeometry | CylinderGeometry | SphereGeometry,
  material: MeshStandardMaterial,
  x: number,
  y: number,
  z: number,
): Mesh {
  const part = new Mesh(geometry, material);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

function addBox(
  parent: Group,
  material: MeshStandardMaterial,
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
): Mesh {
  return addMesh(parent, new BoxGeometry(width, height, depth), material, x, y, z);
}

function addRod(
  parent: Group,
  material: MeshStandardMaterial,
  start: Vector3,
  end: Vector3,
  radius: number,
): Mesh {
  const direction = end.clone().sub(start);
  const rod = addMesh(
    parent,
    new CylinderGeometry(radius, radius, direction.length(), 7),
    material,
    (start.x + end.x) / 2,
    (start.y + end.y) / 2,
    (start.z + end.z) / 2,
  );
  rod.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize());
  return rod;
}

function addCurvedPatch(
  parent: Group,
  material: MeshStandardMaterial,
  uMin: number,
  uMax: number,
  vMin: number,
  vMax: number,
  uSegments: number,
  vSegments: number,
  pointAt: (u: number, v: number) => Vector3,
  reverseWinding = false,
): Mesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= vSegments; row += 1) {
    const v = vMin + ((vMax - vMin) * row) / vSegments;
    for (let column = 0; column <= uSegments; column += 1) {
      const u = uMin + ((uMax - uMin) * column) / uSegments;
      const point = pointAt(u, v);
      positions.push(point.x, point.y, point.z);
    }
  }
  for (let row = 0; row < vSegments; row += 1) {
    for (let column = 0; column < uSegments; column += 1) {
      const a = row * (uSegments + 1) + column;
      const b = a + 1;
      const c = a + uSegments + 1;
      const d = c + 1;
      if (reverseWinding) indices.push(a, b, c, b, d, c);
      else indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const patch = new Mesh(geometry, material);
  patch.castShadow = false;
  parent.add(patch);
  return patch;
}

function addTroopCabinShell(
  parent: Group,
  material: MeshStandardMaterial,
  interactiveId?: string,
): Mesh {
  const zSegments = 48;
  const radialSegments = 64;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= zSegments; row += 1) {
    const z = -1.42 + (3 * row) / zSegments;
    const normalizedZ = (z - 0.08) / 1.5;
    const ringRadius = Math.sqrt(Math.max(0, 1 - normalizedZ ** 2));
    for (let column = 0; column <= radialSegments; column += 1) {
      const angle = (column * Math.PI * 2) / radialSegments;
      positions.push(
        1.03 * ringRadius * Math.cos(angle),
        0.08 + 0.68 * ringRadius * Math.sin(angle),
        z,
      );
    }
  }
  for (let row = 0; row < zSegments; row += 1) {
    const zCenter = -1.42 + (3 * (row + 0.5)) / zSegments;
    for (let column = 0; column < radialSegments; column += 1) {
      const angle = ((column + 0.5) * Math.PI * 2) / radialSegments;
      const distanceToSide = Math.min(angle, Math.abs(Math.PI - angle), Math.PI * 2 - angle);
      const openDoorway = zCenter > -0.38 && zCenter < 0.88 && distanceToSide < 1.05;
      if (openDoorway) continue;

      const a = row * (radialSegments + 1) + column;
      const b = a + 1;
      const c = a + radialSegments + 1;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const shell = new Mesh(geometry, material);
  if (interactiveId) shell.userData.interactiveId = interactiveId;
  parent.add(shell);
  return shell;
}

/** Shared low-poly camp and field model, with independently animated rotor assemblies. */
export function createHelicopter(interactiveId?: string, castShadows = false): HelicopterModel {
  const materials = {
    body: new MeshStandardMaterial({ color: '#58624d', roughness: 0.9, flatShading: true }),
    bodyLight: new MeshStandardMaterial({ color: '#74765c', roughness: 0.94, flatShading: true }),
    underside: new MeshStandardMaterial({ color: '#303832', roughness: 0.84, flatShading: true }),
    seat: new MeshStandardMaterial({ color: '#6b624d', roughness: 0.98, flatShading: true }),
    rotor: new MeshStandardMaterial({ color: '#292f2b', roughness: 0.82, metalness: 0.12 }),
    glass: new MeshStandardMaterial({
      color: '#526e70',
      roughness: 0.3,
      metalness: 0.16,
      emissive: '#132326',
      flatShading: true,
      side: DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
    trim: new MeshStandardMaterial({ color: '#b39a62', roughness: 0.72, metalness: 0.12 }),
    light: new MeshStandardMaterial({
      color: '#e8d8a1',
      emissive: '#b49a51',
      emissiveIntensity: 0.7,
      roughness: 0.35,
    }),
    beacon: new MeshStandardMaterial({
      color: '#ad5140',
      emissive: '#5b1f18',
      emissiveIntensity: 0.4,
      roughness: 0.4,
    }),
  };

  const group = new Group();
  group.name = 'Wayfarer utility helicopter';
  if (interactiveId) group.userData.interactiveId = interactiveId;

  const belly = addMesh(group, new SphereGeometry(1, 12, 8), materials.underside, 0, -0.48, 0.12);
  belly.scale.set(0.72, 0.17, 1.25);

  const fuselage = addTroopCabinShell(group, materials.body, interactiveId);
  const cabinFloor = addBox(group, materials.underside, 1.42, 0.1, 2.0, 0, -0.28, 0.2);
  cabinFloor.receiveShadow = true;
  for (const side of [-1, 1]) {
    addBox(group, materials.seat, 0.56, 0.12, 1.2, side * 0.43, -0.13, 0.24);
    addBox(group, materials.seat, 0.11, 0.38, 1.2, side * 0.72, 0.1, 0.24);
    for (const z of [-0.18, 0.62]) {
      addRod(
        group,
        materials.rotor,
        new Vector3(side * 0.43, -0.23, z),
        new Vector3(side * 0.43, -0.05, z),
        0.035,
      );
    }
    addBox(group, materials.bodyLight, 0.1, 0.08, 1.28, side * 0.78, -0.22, 0.24);
  }

  const nose = addMesh(group, new SphereGeometry(1, 10, 7), materials.bodyLight, 0, 0.05, -1.02);
  nose.scale.set(0.72, 0.43, 0.82);
  if (interactiveId) nose.userData.interactiveId = interactiveId;

  // These panes follow the nose shell so their perimeter sits flush instead of floating off it.
  for (const side of [-1, 1]) {
    addCurvedPatch(
      group,
      materials.glass,
      side < 0 ? -0.42 : 0.025,
      side < 0 ? -0.025 : 0.42,
      0.07,
      0.3,
      8,
      6,
      (x, y) => {
        const normalizedX = x / 0.72;
        const normalizedY = y / 0.43;
        const front =
          -1.02 - 0.82 * Math.sqrt(Math.max(0, 1 - normalizedX ** 2 - normalizedY ** 2));
        return new Vector3(x, y + 0.05, front - 0.016);
      },
    );
  }
  addCurvedPatch(group, materials.underside, -0.02, 0.02, 0.07, 0.3, 1, 6, (x, y) => {
    const normalizedX = x / 0.72;
    const normalizedY = y / 0.43;
    const front = -1.02 - 0.82 * Math.sqrt(Math.max(0, 1 - normalizedX ** 2 - normalizedY ** 2));
    return new Vector3(x, y + 0.05, front - 0.024);
  });

  const lowerNose = addBox(group, materials.underside, 0.7, 0.16, 0.43, 0, -0.25, -1.48);
  lowerNose.rotation.x = -0.08;
  addMesh(group, new SphereGeometry(0.12, 8, 6), materials.light, 0, -0.02, -1.77);

  // Keep both troop doors open; only the engine exhausts sit on the side shell.
  for (const side of [-1, 1]) {
    const exhaust = addMesh(
      group,
      new CylinderGeometry(0.08, 0.11, 0.42, 7),
      materials.underside,
      side * 0.35,
      0.58,
      0.66,
    );
    exhaust.rotation.x = Math.PI / 2;
  }

  const tailBoom = addMesh(
    group,
    new CylinderGeometry(0.12, 0.29, 3.35, 9),
    materials.body,
    0,
    0.18,
    2.02,
  );
  tailBoom.rotation.x = Math.PI / 2;

  const tailFin = addBox(group, materials.body, 0.16, 0.92, 0.72, 0, 0.54, 3.38);
  tailFin.rotation.x = -0.08;
  const stabilizer = addBox(group, materials.bodyLight, 1.58, 0.12, 0.46, 0, 0.24, 3.05);
  stabilizer.rotation.x = -0.06;
  addMesh(group, new SphereGeometry(0.12, 8, 6), materials.beacon, 0, 1.05, 0.72);

  const tailRotorMount = new Group();
  tailRotorMount.position.set(0.23, 0.3, 3.7);
  tailRotorMount.rotation.y = Math.PI / 2;
  const tailRotor = new Group();
  tailRotor.name = 'Helicopter tail rotor';
  tailRotorMount.add(tailRotor);
  for (let bladeIndex = 0; bladeIndex < 3; bladeIndex += 1) {
    const blade = new Group();
    blade.rotation.z = (bladeIndex * Math.PI * 2) / 3;
    tailRotor.add(blade);
    addBox(blade, materials.rotor, 0.095, 0.78, 0.09, 0, 0.39, 0);
  }
  addMesh(tailRotor, new SphereGeometry(0.16, 8, 6), materials.trim, 0, 0, 0);
  group.add(tailRotorMount);

  addMesh(group, new CylinderGeometry(0.09, 0.12, 0.62, 8), materials.rotor, 0, 0.84, 0);
  addMesh(group, new CylinderGeometry(0.34, 0.4, 0.18, 10), materials.bodyLight, 0, 0.58, 0);
  const mainRotor = new Group();
  mainRotor.name = 'Helicopter main rotor';
  mainRotor.position.y = 1.18;
  for (let bladeIndex = 0; bladeIndex < 4; bladeIndex += 1) {
    const blade = new Group();
    blade.rotation.y = (bladeIndex * Math.PI) / 2 + Math.PI / 8;
    mainRotor.add(blade);
    addBox(blade, materials.rotor, 3.55, 0.065, 0.2, 1.82, 0, 0);
    addBox(blade, materials.trim, 0.34, 0.07, 0.21, 3.42, 0, 0);
  }
  addMesh(mainRotor, new CylinderGeometry(0.16, 0.18, 0.16, 8), materials.trim, 0, 0.02, 0);
  group.add(mainRotor);

  // Tubular skids and angled supports replace the original squared-off landing gear.
  for (const side of [-1, 1]) {
    const skid = addMesh(
      group,
      new CylinderGeometry(0.065, 0.08, 3.35, 8),
      materials.rotor,
      side * 0.94,
      -0.68,
      0.12,
    );
    skid.rotation.x = Math.PI / 2;
    for (const z of [-0.8, 0.85]) {
      addRod(
        group,
        materials.rotor,
        new Vector3(side * 0.48, -0.28, z),
        new Vector3(side * 0.91, -0.66, z + 0.12),
        0.055,
      );
    }
  }

  if (castShadows) {
    group.traverse((part) => {
      if (part instanceof Mesh) part.castShadow = true;
    });
    fuselage.receiveShadow = true;
  }

  group.scale.setScalar(1.35);
  return { group, mainRotor, tailRotor };
}
