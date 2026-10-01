import {
  CircleGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
  Vector3,
} from 'three';

export const bloodTrailLifetime = 10;
export const bloodTrailCapacity = 500;
export const bloodTrailDisableAbove = 500;
export const bloodTrailReenableBelow = 100;

export function impactShakeStrength(reduceMotion: boolean, intensity: number): number {
  if (reduceMotion || !Number.isFinite(intensity) || intensity <= 0) return 0;
  return Math.min(0.16, intensity * 0.14);
}

export class BloodTrailGate {
  enabled = true;

  update(livingEnemies: number): boolean {
    if (this.enabled && livingEnemies > bloodTrailDisableAbove) this.enabled = false;
    else if (!this.enabled && livingEnemies < bloodTrailReenableBelow) this.enabled = true;
    return this.enabled;
  }
}

export interface BloodTrailMark {
  position: Vector3;
  facing: number;
  remaining: number;
}

/** A bounded, pooled set of ground marks. */
export class BloodTrailPool {
  readonly marks: BloodTrailMark[] = [];

  constructor(readonly capacity = bloodTrailCapacity) {}

  add(position: Vector3, facing = 0): void {
    if (this.capacity <= 0) return;
    if (this.marks.length >= this.capacity) this.marks.shift();
    this.marks.push({ position: position.clone(), facing, remaining: bloodTrailLifetime });
  }

  update(deltaSeconds: number): void {
    const delta = Math.max(0, deltaSeconds);
    for (const mark of this.marks) mark.remaining -= delta;
    for (let index = this.marks.length - 1; index >= 0; index -= 1) {
      if (this.marks[index]!.remaining <= 0) this.marks.splice(index, 1);
    }
  }
}

/** One instanced mesh renders all ground marks, keeping the trail draw-call cost constant. */
export class BloodTrailVisual {
  readonly pool = new BloodTrailPool();
  readonly mesh: InstancedMesh;
  private readonly helper = new Object3D();
  private readonly color = new Color('#8d332c');

  constructor(scene: Scene) {
    this.mesh = new InstancedMesh(
      new CircleGeometry(0.2, 5),
      new MeshBasicMaterial({
        color: '#ffffff',
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        toneMapped: false,
      }),
      bloodTrailCapacity,
    );
    this.mesh.name = 'Pooled low-poly blood trails';
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  add(position: Vector3, facing = 0): void {
    this.pool.add(position, facing);
    this.sync();
  }

  update(deltaSeconds: number): void {
    this.pool.update(deltaSeconds);
    this.sync();
  }

  private sync(): void {
    const marks = this.pool.marks;
    this.mesh.count = marks.length;
    this.mesh.visible = marks.length > 0;
    for (let index = 0; index < marks.length; index += 1) {
      const mark = marks[index]!;
      const fade = Math.min(1, mark.remaining / 1.6);
      this.helper.position.copy(mark.position);
      this.helper.rotation.set(-Math.PI / 2, 0, mark.facing);
      this.helper.scale.set(0.55 + fade * 0.45, 0.55 + fade * 0.45, 1);
      this.helper.updateMatrix();
      this.mesh.setMatrixAt(index, this.helper.matrix);
      this.color.set('#8d332c').multiplyScalar(0.35 + fade * 0.65);
      this.mesh.setColorAt(index, this.color);
    }
    if (marks.length > 0) {
      this.mesh.instanceMatrix.needsUpdate = true;
      if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    }
  }
}
