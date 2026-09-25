import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { terrainHeightAt, type WorldCollider, type WorldData } from '../world/generateWorld';

export type CameraMode = 'third-person' | 'top-down';

const walkSpeed = 7.4;
const bodyRadius = 0.58;

function makePlayerVisual(): Group {
  const player = new Group();
  const jacket = new MeshStandardMaterial({ color: '#bd7946', roughness: 0.9, flatShading: true });
  const gear = new MeshStandardMaterial({ color: '#3d4940', roughness: 1, flatShading: true });
  const skin = new MeshStandardMaterial({ color: '#c59b76', roughness: 1 });
  const capsule = new Mesh(new CapsuleGeometry(0.47, 0.9, 3, 7), jacket);
  capsule.position.y = 0.93;
  capsule.castShadow = true;
  capsule.receiveShadow = true;
  player.add(capsule);

  const head = new Mesh(new SphereGeometry(0.31, 8, 6), skin);
  head.position.set(0, 1.78, -0.04);
  head.castShadow = true;
  player.add(head);

  const backpack = new Mesh(new BoxGeometry(0.64, 0.73, 0.34), gear);
  backpack.position.set(0, 1.03, 0.48);
  backpack.castShadow = true;
  player.add(backpack);

  const nose = new Mesh(
    new SphereGeometry(0.12, 7, 5),
    new MeshStandardMaterial({ color: '#e5bd64', roughness: 0.7, emissive: '#4c3513' }),
  );
  nose.position.set(0, 1.7, -0.34);
  player.add(nose);

  const shadow = new Mesh(
    new SphereGeometry(0.66, 12, 6),
    new MeshStandardMaterial({ color: '#20251e', transparent: true, opacity: 0.23, roughness: 1 }),
  );
  shadow.scale.set(1, 0.035, 0.82);
  shadow.position.y = 0.045;
  shadow.receiveShadow = true;
  player.add(shadow);

  player.name = 'Player scout';
  return player;
}

function angleTowards(current: number, target: number, blend: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * blend;
}

export class PlayerController {
  readonly visual = makePlayerVisual();
  readonly position = new Vector3();
  readonly velocity = new Vector3();
  private readonly keys = new Set<string>();
  private world: WorldData;
  private facing = 0;
  private onViewToggle: () => void;

  constructor(world: WorldData, onViewToggle: () => void) {
    this.world = world;
    this.onViewToggle = onViewToggle;
    this.setPosition(world.spawn.x, world.spawn.z);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setWorld(world: WorldData): void {
    this.world = world;
    this.clearInput();
    this.setPosition(world.spawn.x, world.spawn.z);
  }

  update(deltaSeconds: number, mode: CameraMode, cameraYaw: number): void {
    const delta = Math.min(deltaSeconds, 0.05);
    const forward =
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) -
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const strafe =
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
      Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const inputLength = Math.hypot(forward, strafe);

    this.velocity.set(0, 0, 0);
    if (inputLength > 0) {
      const normalizedForward = forward / inputLength;
      const normalizedStrafe = strafe / inputLength;
      if (mode === 'top-down') {
        this.velocity.set(normalizedStrafe, 0, -normalizedForward);
      } else {
        const sine = Math.sin(cameraYaw);
        const cosine = Math.cos(cameraYaw);
        this.velocity.set(
          normalizedStrafe * cosine + normalizedForward * sine,
          0,
          normalizedStrafe * sine - normalizedForward * cosine,
        );
      }
      this.velocity.multiplyScalar(walkSpeed);
      const deltaX = this.velocity.x * delta;
      const deltaZ = this.velocity.z * delta;
      if (!this.collidesAt(this.position.x + deltaX, this.position.z)) this.position.x += deltaX;
      if (!this.collidesAt(this.position.x, this.position.z + deltaZ)) this.position.z += deltaZ;
      this.position.x = Math.max(
        -this.world.size / 2 + bodyRadius,
        Math.min(this.world.size / 2 - bodyRadius, this.position.x),
      );
      this.position.z = Math.max(
        -this.world.size / 2 + bodyRadius,
        Math.min(this.world.size / 2 - bodyRadius, this.position.z),
      );
      const direction = Math.atan2(-this.velocity.x, -this.velocity.z);
      this.facing = angleTowards(this.facing, direction, 1 - Math.exp(-12 * delta));
    }

    this.visual.position.set(this.position.x, this.position.y, this.position.z);
    this.visual.rotation.y = this.facing;
    this.visual.scale.y = inputLength > 0 ? 1 + Math.sin(performance.now() * 0.012) * 0.012 : 1;
  }

  setPosition(x: number, z: number): void {
    this.position.set(x, 0, z);
    this.position.y = this.terrainHeight(x, z);
    this.visual.position.copy(this.position);
  }

  terrainHeight = (x: number, z: number): number => {
    return terrainHeightAt(this.world.seed, x, z);
  };

  get cameraFocus(): Vector3 {
    return new Vector3(this.position.x, this.position.y + 1.35, this.position.z);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clearInput);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.clearInput();
  }

  private collidesAt(x: number, z: number): boolean {
    const collides = (obstacle: WorldCollider): boolean => {
      if (obstacle.maxY < this.position.y + 0.12) return false;
      const nearestX = Math.max(obstacle.minX, Math.min(x, obstacle.maxX));
      const nearestZ = Math.max(obstacle.minZ, Math.min(z, obstacle.maxZ));
      const dx = x - nearestX;
      const dz = z - nearestZ;
      return dx * dx + dz * dz < bodyRadius * bodyRadius;
    };
    return this.world.colliders.some(collides);
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)
    );
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isEditableTarget(event.target)) return;
    if (event.code === 'Tab') {
      event.preventDefault();
      if (!event.repeat) this.onViewToggle();
      return;
    }
    if (
      ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
        event.code,
      )
    ) {
      event.preventDefault();
      this.keys.add(event.code);
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private clearInput = (): void => {
    this.keys.clear();
  };

  private handleVisibility = (): void => {
    if (document.visibilityState !== 'visible') this.clearInput();
  };
}
