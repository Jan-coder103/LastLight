import { Vector3 } from 'three';
import { GridNavigator, type NavPoint } from '../navigation/GridNavigator';

/** Followers do not register as obstacles; at most one bounded path request per second. */
export class Follower {
  readonly position = new Vector3();
  health: number;
  cooldown = 0;
  private route: NavPoint[] = [];
  private repath = 0;
  constructor(
    readonly id: string,
    readonly armed: boolean,
    health = 80,
  ) {
    this.health = health;
  }
  get alive(): boolean {
    return this.health > 0;
  }
  regroup(position: Vector3): void {
    this.position.copy(position);
    this.route = [];
    this.repath = 0;
  }
  tick(
    delta: number,
    scout: Vector3,
    navigator: GridNavigator,
    height: (x: number, z: number) => number,
    tight = false,
  ): void {
    if (!this.alive) return;
    this.cooldown = Math.max(0, this.cooldown - delta);
    const distance = Math.hypot(scout.x - this.position.x, scout.z - this.position.z);
    if (distance < (tight ? 1.7 : 2.6)) {
      this.route = [];
      return;
    }
    this.repath -= delta;
    if (this.repath <= 0) {
      this.repath = 1;
      this.route = navigator.findPath(this.position.x, this.position.z, scout.x, scout.z);
    }
    const next = this.route[0];
    if (!next) return;
    const dx = next.x - this.position.x,
      dz = next.z - this.position.z,
      length = Math.hypot(dx, dz);
    if (length < 0.35) {
      this.route.shift();
      return;
    }
    const speed = this.armed ? (distance > 12 ? 14 : tight ? 11 : 9) : 8;
    const step = Math.min(length, speed * delta);
    if (
      !navigator.isWalkable(
        this.position.x + (dx / length) * step,
        this.position.z + (dz / length) * step,
      )
    ) {
      this.route = [];
      this.repath = 0;
      return;
    }
    this.position.x += (dx / length) * step;
    this.position.z += (dz / length) * step;
    this.position.y = height(this.position.x, this.position.z);
  }
  defensiveTarget<T extends { position: Vector3 }>(
    scoutTarget: T | undefined,
    closeTarget: T | undefined,
    range: number,
  ): T | undefined {
    return scoutTarget && scoutTarget.position.distanceTo(this.position) <= 35
      ? scoutTarget
      : closeTarget && closeTarget.position.distanceTo(this.position) <= range
        ? closeTarget
        : undefined;
  }
}
