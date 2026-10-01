export interface PickupFeedEntry {
  id: number;
  text: string;
  age: number;
  opacity: number;
}

const visibleDuration = 3;
const fadeDuration = 0.42;
const entryLifetime = visibleDuration + fadeDuration;

/** FIFO presentation model; entries are ordered oldest at the top, newest at the bottom. */
export class PickupFeed {
  private nextId = 1;
  private entries: Omit<PickupFeedEntry, 'opacity'>[] = [];

  add(text: string): void {
    this.entries.push({ id: this.nextId++, text, age: 0 });
  }

  update(deltaSeconds: number): void {
    const delta = Math.max(0, deltaSeconds);
    this.entries = this.entries
      .map((entry) => ({ ...entry, age: entry.age + delta }))
      .filter((entry) => entry.age < entryLifetime);
  }

  get visibleEntries(): PickupFeedEntry[] {
    return this.entries.map((entry) => ({
      ...entry,
      opacity: Math.min(1, Math.max(0, (entryLifetime - entry.age) / fadeDuration)),
    }));
  }
}

export class PickupPressState {
  private pressedId: string | undefined;
  private remaining = 0;

  press(id: string): void {
    this.pressedId = id;
    this.remaining = 0.18;
  }

  update(deltaSeconds: number): void {
    this.remaining = Math.max(0, this.remaining - Math.max(0, deltaSeconds));
    if (this.remaining === 0) this.pressedId = undefined;
  }

  isPressed(id: string): boolean {
    return this.pressedId === id && this.remaining > 0;
  }
}

export function isPickupInRange(
  playerX: number,
  playerZ: number,
  pickupX: number,
  pickupZ: number,
  range = 3.6,
): boolean {
  return Math.hypot(pickupX - playerX, pickupZ - playerZ) <= range;
}
