import { Vector3 } from 'three';
export interface FirePatch<T> {
  point: Vector3;
  context: string | undefined;
  remaining: number;
  tick: number;
  payload: T;
}
/** Bounded, non-stacking patches. Contexts follow the existing indoor/outdoor pause rules. */
export class FirePatchPool<T> {
  readonly patches: FirePatch<T>[] = [];
  add(point: Vector3, context: string | undefined, payload: T): boolean {
    if (
      this.patches.length >= 3 ||
      this.patches.some((p) => p.context === context && p.point.distanceTo(point) < 5)
    )
      return false;
    this.patches.push({ point: point.clone(), context, remaining: 30, tick: 0, payload });
    return true;
  }
  canAdd(point: Vector3, context: string | undefined): boolean {
    return (
      this.patches.length < 3 &&
      !this.patches.some((p) => p.context === context && p.point.distanceTo(point) < 5)
    );
  }
  tick(delta: number, context: string | undefined): { damage: Vector3[]; expired: T[] } {
    const damage: Vector3[] = [],
      expired: T[] = [];
    for (let i = this.patches.length - 1; i >= 0; i--) {
      const patch = this.patches[i]!;
      if (patch.context !== context) continue;
      patch.remaining -= delta;
      patch.tick -= delta;
      if (patch.remaining <= 0) {
        expired.push(patch.payload);
        this.patches.splice(i, 1);
        continue;
      }
      if (patch.tick <= 0) {
        patch.tick = 0.5;
        damage.push(patch.point);
      }
    }
    return { damage, expired };
  }
  clear(): T[] {
    const removed = this.patches.map((p) => p.payload);
    this.patches.length = 0;
    return removed;
  }
}
