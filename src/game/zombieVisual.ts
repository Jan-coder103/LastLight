import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Matrix4,
  Object3D,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { ZombieState } from './CombatSimulation';

export interface ZombiePart {
  name: string;
  geometry: SphereGeometry | CapsuleGeometry;
  material: MeshStandardMaterial;
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
}

const skin = new MeshStandardMaterial({ color: '#71806a', roughness: 1, flatShading: true });
const clothes = new MeshStandardMaterial({ color: '#514e3c', roughness: 1, flatShading: true });
const eyesMaterial = new MeshStandardMaterial({
  color: '#d0b35f',
  emissive: '#38280b',
  roughness: 0.5,
});
const shadowMaterial = new MeshStandardMaterial({
  color: '#20251e',
  transparent: true,
  opacity: 0.23,
  roughness: 1,
});

const headGeometry = new SphereGeometry(0.31, 8, 6);
const torsoGeometry = new CapsuleGeometry(0.4, 0.72, 3, 7);
const armGeometry = new CapsuleGeometry(0.12, 0.72, 2, 5);
const legGeometry = new CapsuleGeometry(0.14, 0.58, 2, 5);
const eyeGeometry = new SphereGeometry(0.075, 6, 4);
const shadowGeometry = new SphereGeometry(0.54, 10, 6);

for (const geometry of [
  headGeometry,
  torsoGeometry,
  armGeometry,
  legGeometry,
  eyeGeometry,
  shadowGeometry,
])
  geometry.userData.sharedZombieGeometry = true;
for (const material of [skin, clothes, eyesMaterial, shadowMaterial])
  material.userData.sharedZombieMaterial = true;

export const zombieModelParts: readonly ZombiePart[] = [
  {
    name: 'head',
    geometry: headGeometry,
    material: skin,
    position: [0, 1.72, -0.04],
    rotation: [0, 0, 0],
  },
  {
    name: 'torso',
    geometry: torsoGeometry,
    material: clothes,
    position: [0, 1.02, 0],
    rotation: [-0.08, 0, 0],
  },
  {
    name: 'left-arm',
    geometry: armGeometry,
    material: skin,
    position: [-0.44, 1.08, -0.12],
    rotation: [0, 0, -0.34],
  },
  {
    name: 'right-arm',
    geometry: armGeometry,
    material: skin,
    position: [0.44, 1.08, -0.12],
    rotation: [0, 0, 0.34],
  },
  {
    name: 'left-leg',
    geometry: legGeometry,
    material: clothes,
    position: [-0.19, 0.35, 0.03],
    rotation: [0, 0, 0],
  },
  {
    name: 'right-leg',
    geometry: legGeometry,
    material: clothes,
    position: [0.19, 0.35, 0.03],
    rotation: [0, 0, 0],
  },
  {
    name: 'eyes',
    geometry: eyeGeometry,
    material: eyesMaterial,
    position: [0, 1.76, -0.32],
    rotation: [0, 0, 0],
  },
];

const upAxis = new Vector3(0, 1, 0);
const zombieCrowdMaterials = [...new Set(zombieModelParts.map((part) => part.material))];

function createCrowdGeometry(): BufferGeometry {
  const byMaterial = new Map<MeshStandardMaterial, BufferGeometry[]>();
  for (const part of zombieModelParts) {
    const geometry = part.geometry.clone();
    const matrix = new Matrix4().compose(
      new Vector3(...part.position),
      new Quaternion().setFromEuler(new Euler(...part.rotation)),
      new Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(matrix);
    const parts = byMaterial.get(part.material) ?? [];
    parts.push(geometry);
    byMaterial.set(part.material, parts);
  }

  const materialGeometries: BufferGeometry[] = [];
  for (const geometries of byMaterial.values()) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) throw new Error('Could not combine the shared zombie model geometry.');
    materialGeometries.push(merged);
  }
  const crowdGeometry = mergeGeometries(materialGeometries, true);
  materialGeometries.forEach((geometry) => geometry.dispose());
  if (!crowdGeometry) throw new Error('Could not build the shared zombie crowd geometry.');
  crowdGeometry.computeBoundingSphere();
  crowdGeometry.userData.sharedZombieGeometry = true;
  return crowdGeometry;
}

const zombieCrowdGeometry = createCrowdGeometry();
const farZombieGeometry = new CylinderGeometry(0.34, 0.4, 1.55, 6, 1);
farZombieGeometry.translate(0, 0.78, 0);
farZombieGeometry.computeBoundingSphere();
farZombieGeometry.userData.sharedZombieGeometry = true;
const farZombieMaterial = new MeshStandardMaterial({
  color: '#ffffff',
  roughness: 1,
  flatShading: true,
});
farZombieMaterial.userData.sharedZombieMaterial = true;

interface DirtyInstanceUpdates {
  mesh: InstancedMesh;
  matrixIndices: number[];
  colorIndices: number[];
}

export class ZombieCrowdVisual {
  readonly group: Group;
  readonly parts: readonly InstancedMesh[];
  private readonly instance = new Object3D();
  private readonly tierColor = new Color();
  private readonly facingRotation = new Quaternion();
  private readonly detailedSlotByAgent: Int32Array;
  private readonly farSlotByAgent: Int32Array;
  private readonly detailedAgentAtSlot: Uint32Array;
  private readonly farAgentAtSlot: Uint32Array;
  private readonly detailedUpdates: DirtyInstanceUpdates;
  private readonly farUpdates: DirtyInstanceUpdates;
  private detailedCount = 0;
  private farCount = 0;

  constructor(capacity: number, name: string) {
    this.group = new Group();
    this.group.name = name;
    const detailedMesh = this.createMesh(
      zombieCrowdGeometry,
      zombieCrowdMaterials,
      capacity,
      `${name} · near/mid zombie models`,
    );
    const farMesh = this.createMesh(
      farZombieGeometry,
      farZombieMaterial,
      capacity,
      `${name} · far zombie cylinders`,
    );
    this.detailedSlotByAgent = new Int32Array(capacity).fill(-1);
    this.farSlotByAgent = new Int32Array(capacity).fill(-1);
    this.detailedAgentAtSlot = new Uint32Array(capacity);
    this.farAgentAtSlot = new Uint32Array(capacity);
    this.detailedUpdates = { mesh: detailedMesh, matrixIndices: [], colorIndices: [] };
    this.farUpdates = { mesh: farMesh, matrixIndices: [], colorIndices: [] };
    this.parts = [detailedMesh, farMesh];
    this.group.add(detailedMesh, farMesh);
  }

  setAgent(
    index: number,
    x: number,
    y: number,
    z: number,
    facing: number,
    scale: number,
    tier: number,
  ): void {
    if (tier === 2) {
      this.removeFromDetailed(index);
      this.addToFar(index);
    } else {
      this.removeFromFar(index);
      this.addToDetailed(index);
    }
    const tint = tier === 0 ? 0xffffff : tier === 1 ? 0xd6d8d0 : 0x969d91;
    this.tierColor.setHex(tint);
    this.facingRotation.setFromAxisAngle(upAxis, facing);
    this.instance.position.set(x, y, z);
    this.instance.quaternion.copy(this.facingRotation);
    this.instance.scale.setScalar(scale);
    this.instance.updateMatrix();
    const updates = tier === 2 ? this.farUpdates : this.detailedUpdates;
    const slot = tier === 2 ? this.farSlotByAgent[index]! : this.detailedSlotByAgent[index]!;
    updates.mesh.setMatrixAt(slot, this.instance.matrix);
    updates.mesh.setColorAt(slot, this.tierColor);
    updates.matrixIndices.push(slot);
    updates.colorIndices.push(slot);
  }

  hideAgent(index: number): void {
    this.removeFromDetailed(index);
    this.removeFromFar(index);
  }

  agentIndexForInstance(mesh: Object3D, instanceId: number): number | undefined {
    if (mesh === this.detailedUpdates.mesh) {
      return instanceId >= 0 && instanceId < this.detailedCount
        ? this.detailedAgentAtSlot[instanceId]
        : undefined;
    }
    if (mesh === this.farUpdates.mesh) {
      return instanceId >= 0 && instanceId < this.farCount
        ? this.farAgentAtSlot[instanceId]
        : undefined;
    }
    return undefined;
  }

  consumeDirtyUpdates(visit: (updates: DirtyInstanceUpdates) => void): void {
    for (const updates of [this.detailedUpdates, this.farUpdates]) {
      if (updates.matrixIndices.length > 0 || updates.colorIndices.length > 0)
        visit(updates);
      updates.matrixIndices.length = 0;
      updates.colorIndices.length = 0;
    }
  }

  private createMesh(
    geometry: BufferGeometry,
    material: MeshStandardMaterial | MeshStandardMaterial[],
    capacity: number,
    name: string,
  ): InstancedMesh {
    const mesh = new InstancedMesh(geometry, material, capacity);
    mesh.name = name;
    mesh.userData.hordePart = true;
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.count = 0;
    return mesh;
  }

  private addToDetailed(index: number): void {
    if (this.detailedSlotByAgent[index] !== -1) return;
    const slot = this.detailedCount++;
    this.detailedSlotByAgent[index] = slot;
    this.detailedAgentAtSlot[slot] = index;
    this.detailedUpdates.mesh.count = this.detailedCount;
  }

  private addToFar(index: number): void {
    if (this.farSlotByAgent[index] !== -1) return;
    const slot = this.farCount++;
    this.farSlotByAgent[index] = slot;
    this.farAgentAtSlot[slot] = index;
    this.farUpdates.mesh.count = this.farCount;
  }

  private removeFromDetailed(index: number): void {
    const slot = this.detailedSlotByAgent[index]!;
    if (slot < 0) return;
    const lastSlot = --this.detailedCount;
    if (slot !== lastSlot) {
      const movedAgent = this.detailedAgentAtSlot[lastSlot]!;
      this.detailedUpdates.mesh.getMatrixAt(lastSlot, this.instance.matrix);
      this.detailedUpdates.mesh.setMatrixAt(slot, this.instance.matrix);
      if (this.detailedUpdates.mesh.instanceColor) {
        this.detailedUpdates.mesh.getColorAt(lastSlot, this.tierColor);
        this.detailedUpdates.mesh.setColorAt(slot, this.tierColor);
      }
      this.detailedAgentAtSlot[slot] = movedAgent;
      this.detailedSlotByAgent[movedAgent] = slot;
      this.detailedUpdates.matrixIndices.push(slot);
      this.detailedUpdates.colorIndices.push(slot);
    }
    this.detailedSlotByAgent[index] = -1;
    this.detailedUpdates.mesh.count = this.detailedCount;
  }

  private removeFromFar(index: number): void {
    const slot = this.farSlotByAgent[index]!;
    if (slot < 0) return;
    const lastSlot = --this.farCount;
    if (slot !== lastSlot) {
      const movedAgent = this.farAgentAtSlot[lastSlot]!;
      this.farUpdates.mesh.getMatrixAt(lastSlot, this.instance.matrix);
      this.farUpdates.mesh.setMatrixAt(slot, this.instance.matrix);
      if (this.farUpdates.mesh.instanceColor) {
        this.farUpdates.mesh.getColorAt(lastSlot, this.tierColor);
        this.farUpdates.mesh.setColorAt(slot, this.tierColor);
      }
      this.farAgentAtSlot[slot] = movedAgent;
      this.farSlotByAgent[movedAgent] = slot;
      this.farUpdates.matrixIndices.push(slot);
      this.farUpdates.colorIndices.push(slot);
    }
    this.farSlotByAgent[index] = -1;
    this.farUpdates.mesh.count = this.farCount;
  }
}

export function createZombieVisual(zombie: ZombieState): Group {
  const root = new Group();
  root.name = zombie.id;
  root.userData.zombieId = zombie.id;
  for (const part of zombieModelParts) {
    const mesh = new Mesh(part.geometry, part.material);
    mesh.name = part.name;
    mesh.position.set(...part.position);
    mesh.rotation.set(...part.rotation);
    mesh.castShadow = true;
    root.add(mesh);
  }
  const shadow = new Mesh(shadowGeometry, shadowMaterial);
  shadow.scale.set(1, 0.035, 0.82);
  shadow.position.y = 0.04;
  shadow.userData.sharedZombieGeometry = true;
  shadow.castShadow = false;
  root.add(shadow);
  syncZombieVisual(root, zombie);
  return root;
}

export function syncZombieVisual(root: Group, zombie: ZombieState): void {
  root.position.copy(zombie.position);
  root.rotation.y = zombie.facing;
  root.visible = zombie.alive;
  const healthRatio = Math.max(0, Math.min(1, zombie.health / zombie.maxHealth));
  root.scale.setScalar(0.86 + healthRatio * 0.14);
}
