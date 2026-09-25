import { PerspectiveCamera, Vector3 } from 'three';
import type { CameraMode } from '../player/PlayerController';
import type { WorldCollider, WorldData } from '../world/generateWorld';

const transitionSeconds = 0.62;

interface Transition {
  elapsed: number;
  startPosition: Vector3;
  startTarget: Vector3;
}

function segmentBoxEntry(start: Vector3, end: Vector3, box: WorldCollider): number | undefined {
  const direction = end.clone().sub(start);
  let enter = 0;
  let exit = 1;
  const axes: Array<[number, number, number, number]> = [
    [start.x, direction.x, box.minX, box.maxX],
    [start.y, direction.y, box.minY, box.maxY],
    [start.z, direction.z, box.minZ, box.maxZ],
  ];
  for (const [origin, delta, min, max] of axes) {
    if (Math.abs(delta) < 0.00001) {
      if (origin < min || origin > max) return undefined;
      continue;
    }
    let first = (min - origin) / delta;
    let last = (max - origin) / delta;
    if (first > last) [first, last] = [last, first];
    enter = Math.max(enter, first);
    exit = Math.min(exit, last);
    if (enter > exit) return undefined;
  }
  if (exit < 0 || enter > 1) return undefined;
  return Math.max(0, enter);
}

export class CameraRig {
  readonly camera: PerspectiveCamera;
  mode: CameraMode = 'third-person';
  yaw = 0;
  pitch = 0.37;
  currentTarget = new Vector3();
  private world: WorldData;
  private readonly canvas: HTMLCanvasElement;
  private transition: Transition | undefined;
  private readonly idealPosition = new Vector3();
  private readonly idealTarget = new Vector3();

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement, world: WorldData) {
    this.camera = camera;
    this.canvas = canvas;
    this.world = world;
    this.camera.position.set(0, 5.5, 7.4);
    this.currentTarget.set(0, 1.35, -5);
    this.camera.lookAt(this.currentTarget);
  }

  setWorld(world: WorldData): void {
    this.world = world;
    this.transition = undefined;
  }

  switchMode(playerPosition: Vector3): CameraMode {
    this.mode = this.mode === 'third-person' ? 'top-down' : 'third-person';
    if (this.mode === 'top-down' && document.pointerLockElement === this.canvas)
      document.exitPointerLock();
    this.transition = {
      elapsed: 0,
      startPosition: this.camera.position.clone(),
      startTarget: this.currentTarget.clone(),
    };
    this.setDestination(playerPosition);
    return this.mode;
  }

  lookBy(deltaX: number, deltaY: number): void {
    if (this.mode !== 'third-person') return;
    this.yaw += deltaX * 0.0028;
    this.pitch = Math.max(0.1, Math.min(0.82, this.pitch + deltaY * 0.0022));
  }

  update(deltaSeconds: number, playerPosition: Vector3): void {
    const delta = Math.min(deltaSeconds, 0.05);
    this.setDestination(playerPosition);
    if (this.transition) {
      this.transition.elapsed += delta;
      const amount = Math.min(1, this.transition.elapsed / transitionSeconds);
      const eased = amount * amount * (3 - 2 * amount);
      this.camera.position.lerpVectors(this.transition.startPosition, this.idealPosition, eased);
      this.currentTarget.lerpVectors(this.transition.startTarget, this.idealTarget, eased);
      if (amount >= 1) this.transition = undefined;
    } else {
      const blend = 1 - Math.exp(-11 * delta);
      this.camera.position.lerp(this.idealPosition, blend);
      this.currentTarget.lerp(this.idealTarget, blend);
    }
    this.camera.lookAt(this.currentTarget);
  }

  reset(playerPosition: Vector3): void {
    this.transition = undefined;
    this.mode = 'third-person';
    this.yaw = 0;
    this.pitch = 0.37;
    this.setDestination(playerPosition);
    this.camera.position.copy(this.idealPosition);
    this.currentTarget.copy(this.idealTarget);
    this.camera.lookAt(this.currentTarget);
  }

  private setDestination(playerPosition: Vector3): void {
    const terrainY = playerPosition.y;
    this.idealTarget.set(playerPosition.x, terrainY + 1.35, playerPosition.z);
    if (this.mode === 'top-down') {
      this.idealPosition.set(playerPosition.x, terrainY + 48, playerPosition.z + 28);
      return;
    }
    const distance = 9.3;
    const horizontal = Math.cos(this.pitch) * distance;
    const vertical = Math.sin(this.pitch) * distance;
    this.idealPosition.set(
      playerPosition.x - Math.sin(this.yaw) * horizontal,
      terrainY + 1.35 + vertical,
      playerPosition.z + Math.cos(this.yaw) * horizontal,
    );
    this.constrainToWorld(this.idealTarget, this.idealPosition);
  }

  private constrainToWorld(target: Vector3, desired: Vector3): void {
    let nearest = 1;
    for (const collider of this.world.colliders) {
      const entry = segmentBoxEntry(target, desired, collider);
      if (entry !== undefined && entry > 0.025) nearest = Math.min(nearest, entry);
    }
    if (nearest < 1) {
      const safeDistance = Math.max(0.2, nearest - 0.055);
      const offset = desired.clone().sub(target);
      desired.copy(target).addScaledVector(offset, safeDistance);
    }
  }
}
