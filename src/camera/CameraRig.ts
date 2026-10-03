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
  pitch = 0.2;
  zoomScale = 1;
  aiming = false;
  private priorAimFov = 53;
  currentTarget = new Vector3();
  private world: WorldData;
  private readonly canvas: HTMLCanvasElement;
  private transition: Transition | undefined;
  private readonly idealPosition = new Vector3();
  private readonly idealTarget = new Vector3();
  private readonly shakeTarget = new Vector3();
  private shakeElapsed = 0;
  private shakeRemaining = 0;
  private shakeDuration = 0;
  private shakeStrength = 0;

  constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement, world: WorldData) {
    this.camera = camera;
    this.canvas = canvas;
    this.world = world;
    this.camera.position.set(0, 5.5, 7.4);
    this.currentTarget.set(0, 1.35, -5);
    this.camera.lookAt(this.currentTarget);
  }

  setAiming(held: boolean): void {
    const next = held && this.mode !== 'top-down';
    if (next === this.aiming) return;
    if (next) {
      this.priorAimFov = this.camera.fov;
      this.camera.fov = Math.max(30, this.camera.fov * 0.72);
    } else this.camera.fov = this.priorAimFov;
    this.aiming = next;
    this.camera.updateProjectionMatrix();
  }

  get isTransitioning(): boolean {
    return this.transition !== undefined;
  }

  kickShake(strength: number, duration = 0.2): void {
    if (!Number.isFinite(strength) || strength <= 0 || duration <= 0) return;
    this.shakeStrength = Math.max(this.shakeStrength, Math.min(strength, 0.16));
    this.shakeDuration = Math.max(this.shakeDuration, Math.min(duration, 0.5));
    this.shakeRemaining = this.shakeDuration;
    this.shakeElapsed = 0;
  }

  setWorld(world: WorldData): void {
    this.world = world;
    this.transition = undefined;
  }

  switchMode(playerPosition: Vector3): CameraMode {
    this.setAiming(false);
    const modes: CameraMode[] = ['third-person', 'top-down', 'first-person'];
    this.mode = modes[(modes.indexOf(this.mode) + 1) % modes.length]!;
    if (this.mode !== 'first-person' && this.camera.fov !== 53) {
      this.camera.fov = 53;
      this.camera.updateProjectionMatrix();
    }
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
    if (this.mode === 'top-down') return;
    this.yaw += deltaX * 0.0028;
    this.pitch = Math.max(-0.62, Math.min(0.95, this.pitch + deltaY * 0.0022));
  }

  zoomBy(deltaY: number): void {
    if (this.aiming) return;
    if (!Number.isFinite(deltaY) || deltaY === 0) return;
    if (this.mode === 'first-person') {
      this.camera.fov = Math.max(42, Math.min(68, this.camera.fov * Math.exp(deltaY * 0.001)));
      this.camera.updateProjectionMatrix();
      return;
    }
    this.zoomScale = Math.max(0.62, Math.min(1.8, this.zoomScale * Math.exp(deltaY * 0.001)));
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
    } else if (this.mode !== 'top-down') {
      this.camera.position.copy(this.idealPosition);
      this.currentTarget.copy(this.idealTarget);
    } else {
      const blend = 1 - Math.exp(-11 * delta);
      this.camera.position.lerp(this.idealPosition, blend);
      this.currentTarget.lerp(this.idealTarget, blend);
    }
    const deltaX = this.shakeOffsetX(delta);
    const deltaY = this.shakeOffsetY();
    this.camera.position.x += deltaX;
    this.camera.position.y += deltaY;
    this.shakeTarget.set(
      this.currentTarget.x + deltaX,
      this.currentTarget.y + deltaY,
      this.currentTarget.z,
    );
    this.camera.lookAt(this.shakeTarget);
  }

  reset(playerPosition: Vector3): void {
    this.setAiming(false);
    this.transition = undefined;
    this.shakeRemaining = 0;
    this.shakeStrength = 0;
    this.mode = 'third-person';
    this.camera.fov = 53;
    this.camera.updateProjectionMatrix();
    this.yaw = 0;
    this.pitch = 0.2;
    this.zoomScale = 1;
    this.setDestination(playerPosition);
    this.camera.position.copy(this.idealPosition);
    this.currentTarget.copy(this.idealTarget);
    this.camera.lookAt(this.currentTarget);
  }

  snapTo(playerPosition: Vector3): void {
    this.transition = undefined;
    this.setDestination(playerPosition);
    this.camera.position.copy(this.idealPosition);
    this.currentTarget.copy(this.idealTarget);
    this.camera.lookAt(this.currentTarget);
  }

  transitionFocus(playerPosition: Vector3): void {
    this.transition = {
      elapsed: 0,
      startPosition: this.camera.position.clone(),
      startTarget: this.currentTarget.clone(),
    };
    this.setDestination(playerPosition);
  }

  private setDestination(playerPosition: Vector3): void {
    const terrainY = playerPosition.y;
    if (this.mode === 'first-person') {
      const eyeY = terrainY + 1.64;
      const forwardX = Math.sin(this.yaw) * Math.cos(this.pitch);
      const forwardY = -Math.sin(this.pitch);
      const forwardZ = -Math.cos(this.yaw) * Math.cos(this.pitch);
      this.idealPosition.set(playerPosition.x, eyeY, playerPosition.z);
      this.idealTarget.set(
        playerPosition.x + forwardX * 12,
        eyeY + forwardY * 12,
        playerPosition.z + forwardZ * 12,
      );
      return;
    }
    if (this.mode === 'top-down') {
      this.idealTarget.set(playerPosition.x, terrainY + 1.35, playerPosition.z);
      this.idealPosition.set(
        playerPosition.x,
        terrainY + 48 * this.zoomScale,
        playerPosition.z + 28 * this.zoomScale,
      );
      return;
    }
    const distance = (this.aiming ? 4.3 : 9.3) * this.zoomScale;
    const pivotHeight = 2.65;
    const minimumCameraHeight = 0.65;
    const shoulderAngle = Math.atan2(0.95, distance);
    const sine = Math.sin(this.yaw);
    const cosine = Math.cos(this.yaw);
    const pivotY = terrainY + pivotHeight;
    const verticalOffset = Math.max(
      distance * Math.sin(this.pitch),
      minimumCameraHeight - pivotHeight,
    );
    const horizontalRadius = Math.sqrt(distance * distance - verticalOffset * verticalOffset);
    const backOffset = horizontalRadius * Math.cos(shoulderAngle);
    const rightOffset = horizontalRadius * Math.sin(shoulderAngle);
    this.idealPosition.set(
      playerPosition.x - sine * backOffset + cosine * rightOffset,
      pivotY + verticalOffset,
      playerPosition.z + cosine * backOffset + sine * rightOffset,
    );
    const focusDistance = distance + 1.6;
    this.idealTarget.set(
      this.idealPosition.x + sine * Math.cos(this.pitch) * focusDistance,
      this.idealPosition.y - Math.sin(this.pitch) * focusDistance,
      this.idealPosition.z - cosine * Math.cos(this.pitch) * focusDistance,
    );
    this.constrainToWorld(this.idealTarget, this.idealPosition);
  }

  private shakeOffsetX(delta: number): number {
    if (this.shakeRemaining <= 0) {
      this.shakeStrength = 0;
      return 0;
    }
    this.shakeElapsed += delta;
    this.shakeRemaining = Math.max(0, this.shakeRemaining - delta);
    const envelope = this.shakeRemaining / this.shakeDuration;
    return Math.sin(this.shakeElapsed * 61) * this.shakeStrength * envelope;
  }

  private shakeOffsetY(): number {
    if (this.shakeRemaining <= 0) return 0;
    const envelope = this.shakeRemaining / this.shakeDuration;
    return Math.sin(this.shakeElapsed * 83) * this.shakeStrength * 0.55 * envelope;
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
