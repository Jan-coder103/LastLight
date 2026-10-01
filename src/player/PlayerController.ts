import { Vector3 } from 'three';
import { abilityFromKey, isDashKey, isMovementKey, type AbilitySlot } from '../input/controlMap';
import type { NavPoint } from '../navigation/GridNavigator';
import { terrainHeightAt, type WorldCollider, type WorldData } from '../world/generateWorld';
import { createPlayerVisual } from './playerVisual';

export type CameraMode = 'third-person' | 'top-down';

const walkSpeed = 7.4;
const bodyRadius = 0.58;
const dashDuration = 0.22;
const dashSpeed = 20;
export const sprintSpeedMultiplier = 1.45;
export const adrenalineSpeedMultiplier = 2.5;

export function playerSpeedMultiplier(adrenalineActive: boolean, sprintHeld: boolean): number {
  return (
    (adrenalineActive ? adrenalineSpeedMultiplier : 1) * (sprintHeld ? sprintSpeedMultiplier : 1)
  );
}

function angleTowards(current: number, target: number, blend: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * blend;
}

export class PlayerController {
  readonly visual = createPlayerVisual();
  readonly position = new Vector3();
  readonly velocity = new Vector3();
  private readonly keys = new Set<string>();
  private readonly heldAbilityKeys = new Set<string>();
  private readonly path: NavPoint[] = [];
  private readonly cursorWorldPoint = new Vector3();
  private world: WorldData;
  private surfaceHeight: (x: number, z: number) => number;
  private facing = 0;
  private currentMode: CameraMode = 'third-person';
  private currentCameraYaw = 0;
  private dashRemaining = 0;
  private readonly dashDirection = new Vector3();
  private hasCursorWorldPoint = false;
  private readonly lastMoveDirection = new Vector3();
  private aimFacingRemaining = 0;
  private hasMoved = false;
  private enabled = true;
  private blockedRouteTime = 0;
  private navigationStuck = false;
  private onViewToggle: () => void;
  private onAbility: (slot: AbilitySlot) => void;
  private onAbilityHoldStart: () => void;
  private onAbilityHoldEnd: () => void;
  private onAbilityHoldCancel: () => void;
  private onDashRequest: () => boolean;
  private onGrenadeRequest: () => void;

  constructor(
    world: WorldData,
    onViewToggle: () => void,
    onAbility: (slot: AbilitySlot) => void,
    onAbilityHoldStart: () => void,
    onAbilityHoldEnd: () => void,
    onAbilityHoldCancel: () => void,
    onDashRequest: () => boolean,
    onGrenadeRequest: () => void,
  ) {
    this.world = world;
    this.surfaceHeight = (x, z) => terrainHeightAt(world.seed, x, z);
    this.onViewToggle = onViewToggle;
    this.onAbility = onAbility;
    this.onAbilityHoldStart = onAbilityHoldStart;
    this.onAbilityHoldEnd = onAbilityHoldEnd;
    this.onAbilityHoldCancel = onAbilityHoldCancel;
    this.onDashRequest = onDashRequest;
    this.onGrenadeRequest = onGrenadeRequest;
    this.setPosition(world.spawn.x, world.spawn.z);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setWorld(world: WorldData, surfaceHeight?: (x: number, z: number) => number): void {
    this.world = world;
    this.surfaceHeight = surfaceHeight ?? ((x, z) => terrainHeightAt(world.seed, x, z));
    this.clearInput();
    this.path.length = 0;
    this.blockedRouteTime = 0;
    this.navigationStuck = false;
    this.dashRemaining = 0;
    this.lastMoveDirection.set(0, 0, 0);
    this.aimFacingRemaining = 0;
    this.hasMoved = false;
    this.hasCursorWorldPoint = false;
    this.setPosition(world.spawn.x, world.spawn.z);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearInput();
      this.cancelNavigation();
    }
  }

  setNavigationPath(path: readonly NavPoint[]): void {
    this.path.splice(0, this.path.length, ...path);
    this.blockedRouteTime = 0;
    this.navigationStuck = false;
  }

  cancelNavigation(): void {
    this.path.length = 0;
    this.blockedRouteTime = 0;
    this.navigationStuck = false;
  }

  consumeNavigationStuck(): boolean {
    const stuck = this.navigationStuck;
    this.navigationStuck = false;
    return stuck;
  }

  clearKeyboardMovement(): void {
    this.keys.clear();
  }

  get navigationPath(): readonly NavPoint[] {
    return this.path;
  }

  get isDashing(): boolean {
    return this.dashRemaining > 0;
  }

  get sprintHeld(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  get dashDirectionVector(): Vector3 {
    return this.dashDirection.clone();
  }

  setCursorWorldPoint(x: number, z: number): void {
    this.cursorWorldPoint.set(x, 0, z);
    this.hasCursorWorldPoint = true;
  }

  faceToward(x: number, z: number): void {
    const directionX = x - this.position.x;
    const directionZ = z - this.position.z;
    if (directionX * directionX + directionZ * directionZ < 0.001) return;
    this.setFacingDirection(directionX, directionZ);
    this.aimFacingRemaining = 0.45;
  }

  setFacingDirection(directionX: number, directionZ: number): void {
    if (directionX * directionX + directionZ * directionZ < 0.001) return;
    this.facing = Math.atan2(-directionX, -directionZ);
    this.visual.rotation.y = this.facing;
  }

  update(deltaSeconds: number, mode: CameraMode, cameraYaw: number, speedMultiplier = 1): void {
    const delta = Math.min(deltaSeconds, 0.05);
    this.currentMode = mode;
    this.currentCameraYaw = cameraYaw;
    const keepAimFacing = mode === 'top-down' && this.aimFacingRemaining > 0;
    this.aimFacingRemaining = Math.max(0, this.aimFacingRemaining - delta);
    this.velocity.set(0, 0, 0);
    let routeWaypoint: NavPoint | undefined;
    let routeDistanceBefore = 0;

    if (this.enabled && this.dashRemaining > 0) {
      this.dashRemaining = Math.max(0, this.dashRemaining - delta);
      this.velocity.copy(this.dashDirection).multiplyScalar(dashSpeed);
      this.moveBy(this.velocity.x * delta, this.velocity.z * delta);
    } else if (this.enabled) {
      const direction =
        mode === 'third-person' ? this.keyboardDirection(cameraYaw) : this.pathDirection();
      if (direction.lengthSq() > 0) {
        if (mode === 'top-down' && this.path.length > 0) {
          routeWaypoint = this.path[0];
          routeDistanceBefore = Math.hypot(
            routeWaypoint.x - this.position.x,
            routeWaypoint.z - this.position.z,
          );
        }
        direction.normalize();
        this.velocity.copy(direction).multiplyScalar(walkSpeed * speedMultiplier);
        this.moveBy(this.velocity.x * delta, this.velocity.z * delta);
        this.lastMoveDirection.copy(direction);
        this.hasMoved = true;
        if (mode === 'top-down' && !keepAimFacing) {
          const facing = Math.atan2(-direction.x, -direction.z);
          this.facing = angleTowards(this.facing, facing, 1 - Math.exp(-12 * delta));
        }
      }
    }

    if (routeWaypoint && mode === 'top-down' && this.enabled && this.dashRemaining <= 0) {
      const routeDistanceAfter = Math.hypot(
        routeWaypoint.x - this.position.x,
        routeWaypoint.z - this.position.z,
      );
      if (routeDistanceBefore - routeDistanceAfter < 0.012) {
        this.blockedRouteTime += delta;
        if (this.blockedRouteTime >= 0.55) {
          this.navigationStuck = true;
          this.path.length = 0;
          this.blockedRouteTime = 0;
        }
      } else {
        this.blockedRouteTime = 0;
      }
    } else if (this.dashRemaining <= 0) {
      this.blockedRouteTime = 0;
    }

    this.visual.position.set(this.position.x, this.position.y, this.position.z);
    this.visual.rotation.y = this.facing;
    this.visual.scale.y =
      this.velocity.lengthSq() > 0 ? 1 + Math.sin(performance.now() * 0.012) * 0.012 : 1;
  }

  startDash(): void {
    this.dashDirection.set(0, 0, 0);
    if (this.currentMode === 'top-down' && this.hasCursorWorldPoint) {
      this.dashDirection.set(
        this.cursorWorldPoint.x - this.position.x,
        0,
        this.cursorWorldPoint.z - this.position.z,
      );
    } else if (this.hasMoved) {
      this.dashDirection.copy(this.lastMoveDirection);
    }
    if (this.dashDirection.lengthSq() < 0.01) {
      if (this.currentMode === 'third-person') {
        this.dashDirection.set(
          -Math.sin(this.currentCameraYaw),
          0,
          -Math.cos(this.currentCameraYaw),
        );
      } else {
        this.dashDirection.set(-Math.sin(this.facing), 0, -Math.cos(this.facing));
      }
    }
    this.dashDirection.normalize();
    if (this.currentMode === 'top-down') {
      this.facing = Math.atan2(-this.dashDirection.x, -this.dashDirection.z);
      this.visual.rotation.y = this.facing;
    }
    this.dashRemaining = dashDuration;
  }

  muzzlePosition(): Vector3 {
    this.visual.updateMatrixWorld(true);
    return this.visual.localToWorld(new Vector3(0.43, 1.23, -0.77));
  }

  setPosition(x: number, z: number): void {
    this.position.set(x, this.surfaceHeight(x, z), z);
    this.visual.position.copy(this.position);
  }

  terrainHeight = (x: number, z: number): number => {
    return this.surfaceHeight(x, z);
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

  private keyboardDirection(cameraYaw: number): Vector3 {
    const forward =
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')) -
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const strafe =
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) -
      Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft'));
    const length = Math.hypot(forward, strafe);
    if (length === 0) return new Vector3();
    const normalizedForward = forward / length;
    const normalizedStrafe = strafe / length;
    const sine = Math.sin(cameraYaw);
    const cosine = Math.cos(cameraYaw);
    return new Vector3(
      normalizedStrafe * cosine + normalizedForward * sine,
      0,
      normalizedStrafe * sine - normalizedForward * cosine,
    );
  }

  private pathDirection(): Vector3 {
    while (this.path.length > 0) {
      const waypoint = this.path[0];
      const distance = Math.hypot(waypoint.x - this.position.x, waypoint.z - this.position.z);
      if (distance > 0.56)
        return new Vector3(waypoint.x - this.position.x, 0, waypoint.z - this.position.z);
      this.path.shift();
    }
    return new Vector3();
  }

  private moveBy(deltaX: number, deltaZ: number): void {
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
    this.position.y = this.terrainHeight(this.position.x, this.position.z);
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
    if (!this.enabled) return;
    const ability = abilityFromKey(event.code, this.currentMode);
    if (ability !== undefined) {
      event.preventDefault();
      if (!event.repeat) {
        if (ability === 1) {
          this.heldAbilityKeys.add(event.code);
          this.onAbilityHoldStart();
        } else {
          this.onAbility(ability);
        }
      }
      return;
    }
    if (event.code === 'KeyG') {
      event.preventDefault();
      if (!event.repeat) this.onGrenadeRequest();
      return;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.keys.add(event.code);
      return;
    }
    if (isDashKey(event.code)) {
      event.preventDefault();
      if (!event.repeat && this.onDashRequest()) this.startDash();
      return;
    }
    if (isMovementKey(event.code, this.currentMode)) {
      event.preventDefault();
      this.keys.add(event.code);
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
    if (this.heldAbilityKeys.delete(event.code)) this.onAbilityHoldEnd();
  };

  private clearInput = (): void => {
    this.keys.clear();
    if (this.heldAbilityKeys.size > 0) this.onAbilityHoldCancel();
    this.heldAbilityKeys.clear();
  };

  private handleVisibility = (): void => {
    if (document.visibilityState !== 'visible') this.clearInput();
  };
}
