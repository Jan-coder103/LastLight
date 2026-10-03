import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
  SphereGeometry,
  Vector3,
} from 'three';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  life: number;
  duration: number;
  color: Color;
  blood: boolean;
}

const capacity = 36;

/** Reuses one unlit instanced batch for brief hit and ability particles. */
export class ParticleBursts {
  private readonly mesh: InstancedMesh;
  private readonly helper = new Object3D();
  private readonly particles: Particle[] = [];
  private readonly color = new Color();
  private randomState = 0x719bf3;

  constructor(scene: Scene) {
    this.mesh = new InstancedMesh(
      new SphereGeometry(0.085, 5, 4),
      new MeshBasicMaterial({
        color: '#ffffff',
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
      capacity,
    );
    this.mesh.name = 'Short combat and ability particle bursts';
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  get activeCount(): number {
    return this.particles.length;
  }

  burst(
    position: Vector3,
    color: string,
    count = 6,
    speed = 1.5,
    duration = 0.28,
    blood = false,
  ): void {
    const origin = position.clone();
    const tint = new Color(color);
    for (let index = 0; index < count; index += 1) {
      const angle = this.nextRandom() * Math.PI * 2;
      const horizontalSpeed = speed * (0.35 + this.nextRandom() * 0.65);
      const verticalSpeed = speed * (0.3 + this.nextRandom() * 0.85);
      if (this.particles.length >= capacity) this.particles.shift();
      this.particles.push({
        position: origin.clone(),
        velocity: new Vector3(
          Math.cos(angle) * horizontalSpeed,
          verticalSpeed,
          Math.sin(angle) * horizontalSpeed,
        ),
        life: duration,
        duration,
        color: tint.clone(),
        blood,
      });
    }
    this.syncInstances();
  }

  clearBlood(): void {
    for (let i = this.particles.length - 1; i >= 0; i--)
      if (this.particles[i]!.blood) this.particles.splice(i, 1);
    this.syncInstances();
  }

  update(deltaSeconds: number): void {
    const delta = Math.min(Math.max(deltaSeconds, 0), 0.05);
    for (const particle of this.particles) {
      particle.life -= delta;
      particle.velocity.y -= delta * 4.8;
      particle.position.addScaledVector(particle.velocity, delta);
    }
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      if (this.particles[index]!.life <= 0) this.particles.splice(index, 1);
    }
    this.syncInstances();
  }

  private syncInstances(): void {
    this.mesh.count = this.particles.length;
    this.mesh.visible = this.particles.length > 0;
    if (!this.mesh.visible) return;
    this.particles.forEach((particle, index) => {
      const fade = Math.max(0.02, particle.life / particle.duration);
      const scale = fade * 0.9;
      this.helper.position.copy(particle.position);
      this.helper.scale.setScalar(scale);
      this.helper.updateMatrix();
      this.mesh.setMatrixAt(index, this.helper.matrix);
      this.color.copy(particle.color).multiplyScalar(0.5 + fade * 0.5);
      this.mesh.setColorAt(index, this.color);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private nextRandom(): number {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 0x100000000;
  }
}
