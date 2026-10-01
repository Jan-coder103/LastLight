export const explosiveBarrelFuseDuration = 2;
export const explosiveBarrelBlinkWindows: readonly (readonly [number, number])[] = [
  [0.22, 0.46],
  [1.18, 1.42],
];

interface FuseState {
  elapsed: number;
}

/** Deterministic two-blink fuse state shared by every explosive barrel instance. */
export class ExplosiveBarrelFuses {
  private readonly fuses = new Map<string, FuseState>();
  private readonly completed = new Set<string>();

  trigger(id: string): boolean {
    if (this.fuses.has(id) || this.completed.has(id)) return false;
    this.fuses.set(id, { elapsed: 0 });
    return true;
  }

  update(deltaSeconds: number): string[] {
    const delta = Math.max(0, deltaSeconds);
    const detonated: string[] = [];
    for (const [id, fuse] of this.fuses) {
      fuse.elapsed += delta;
      if (fuse.elapsed < explosiveBarrelFuseDuration) continue;
      this.fuses.delete(id);
      this.completed.add(id);
      detonated.push(id);
    }
    return detonated;
  }

  isBlinking(id: string): boolean {
    const elapsed = this.fuses.get(id)?.elapsed;
    return (
      elapsed !== undefined &&
      explosiveBarrelBlinkWindows.some(([start, end]) => elapsed >= start && elapsed < end)
    );
  }

  isActive(id: string): boolean {
    return this.fuses.has(id);
  }

  isComplete(id: string): boolean {
    return this.completed.has(id);
  }
}
