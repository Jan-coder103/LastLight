import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { abilityFromKey, isDashKey, isMovementKey, type AbilitySlot } from '../input/controlMap';
import type { NavPoint } from '../navigation/GridNavigator';
import { terrainHeightAt, type WorldCollider, type WorldData } from '../world/generateWorld';

export type CameraMode = 'third-person' | 'top-down';

const walkSpeed = 7.4;
const bodyRadius = 0.58;
const dashDuration = 0.22;
const dashSpeed = 20;

function makePlayerVisual(): Group {
  const player = new Group();
  const jacket = new MeshStandardMaterial({ color: '#bd7946', roughness: 0.9, flatShading: true });
  const gear = new MeshStandardMaterial({ color: '#3d4940', roughness: 1, flatShading: true });
  const skin = new MeshStandardMaterial({ color: '#c59b76', roughness: 1 });
  const metal = new MeshStandardMaterial({ color: '#292d2a', roughness: 0.68, metalness: 0.28 });
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

  const rifle = new Group();
  const stock = new Mesh(new BoxGeometry(0.14, 0.16, 0.4), gear);
  stock.position.z = 0.08;
  const barrel = new Mesh(new BoxGeometry(0.1, 0.1, 0.72), metal);
  barrel.position.z = -0.38;
  const grip = new Mesh(new BoxGeometry(0.1, 0.2, 0.13), gear);
  grip.position.set(0, -0.14, -0.03);
  rifle.add(stock, barrel, grip);
  rifle.position.set(0.43, 1.23, -0.23);
  rifle.rotation.x = -0.08;
  rifle.traverse((object) => {
    if (object instanceof Mesh) object.castShadow = true;
  });
  player.add(rifle);

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
  private readonly path: NavPoint[] = [];
  private world: WorldData;
  private facing = 0;
  private currentMode: CameraMode = 'third-person';
  private currentCameraYaw = 0;
  private dashRemaining = 0;
  private readonly dashDirection = new Vector3();
  private readonly lastMoveDirection = new Vector3();
  private hasMoved = false;
  private enabled = true;
  private onViewToggle: () => void;
  private onAbility: (slot: AbilitySlot) => void;
  private onDashRequest: () => boolean;

  constructor(
    world: WorldData,
    onViewToggle: () => void,
    onAbility: (slot: AbilitySlot) => void,
    onDashRequest: () => boolean,
  ) {
    this.world = world;
    this.onViewToggle = onViewToggle;
    this.onAbility = onAbility;
    this.onDashRequest = onDashRequest;
    this.setPosition(world.spawn.x, world.spawn.z);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearInput);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  setWorld(world: WorldData): void {
    this.world = world;
    this.clearInput();
    this.path.length = 0;
    this.dashRemaining = 0;
    this.lastMoveDirection.set(0, 0, 0);
    this.hasMoved = false;
    this.setPosition(world.spawn.x, world.spawn.z);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clearInput();
      this.path.length = 0;
    }
  }

  setNavigationPath(path: readonly NavPoint[]): void {
    this.path.splice(0, this.path.length, ...path);
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

  update(deltaSeconds: number, mode: CameraMode, cameraYaw: number, speedMultiplier = 1): void {
    const delta = Math.min(deltaSeconds, 0.05);
    this.currentMode = mode;
    this.currentCameraYaw = cameraYaw;
    this.velocity.set(0, 0, 0);

    if (this.enabled && this.dashRemaining > 0) {
      this.dashRemaining = Math.max(0, this.dashRemaining - delta);
      this.velocity.copy(this.dashDirection).multiplyScalar(dashSpeed);
      this.moveBy(this.velocity.x * delta, this.velocity.z * delta);
    } else if (this.enabled) {
      const direction =
        mode === 'third-person' ? this.keyboardDirection(cameraYaw) : this.pathDirection();
      if (direction.lengthSq() > 0) {
        direction.normalize();
        this.velocity.copy(direction).multiplyScalar(walkSpeed * speedMultiplier);
        this.moveBy(this.velocity.x * delta, this.velocity.z * delta);
        this.lastMoveDirection.copy(direction);
        this.hasMoved = true;
        const facing = Math.atan2(-direction.x, -direction.z);
        this.facing = angleTowards(this.facing, facing, 1 - Math.exp(-12 * delta));
      }
    }

    this.visual.position.set(this.position.x, this.position.y, this.position.z);
    this.visual.rotation.y = this.facing;
    this.visual.scale.y =
      this.velocity.lengthSq() > 0 ? 1 + Math.sin(performance.now() * 0.012) * 0.012 : 1;
  }

  startDash(): void {
    if (this.hasMoved) {
      this.dashDirection.copy(this.lastMoveDirection);
    } else {
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
    this.dashRemaining = dashDuration;
  }

  muzzlePosition(): Vector3 {
    this.visual.updateMatrixWorld(true);
    return this.visual.localToWorld(new Vector3(0.43, 1.23, -0.77));
  }

  setPosition(x: number, z: number): void {
    this.position.set(x, terrainHeightAt(this.world.seed, x, z), z);
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
      if (!event.repeat) this.onAbility(ability);
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
  };

  private clearInput = (): void => {
    this.keys.clear();
  };

  private handleVisibility = (): void => {
    if (document.visibilityState !== 'visible') this.clearInput();
  };
}
