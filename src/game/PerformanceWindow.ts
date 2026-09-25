/** Small rolling sample window for low-overhead runtime performance diagnostics. */
export class PerformanceWindow {
  private readonly samples: Float32Array;
  private readonly orderedSamples: number[] = [];
  private size = 0;
  private cursor = 0;

  constructor(capacity = 120) {
    if (!Number.isInteger(capacity) || capacity < 1)
      throw new RangeError('Performance sample capacity must be a positive integer.');
    this.samples = new Float32Array(capacity);
  }

  get count(): number {
    return this.size;
  }

  add(sample: number): void {
    if (!Number.isFinite(sample) || sample < 0) return;
    this.samples[this.cursor] = sample;
    this.cursor = (this.cursor + 1) % this.samples.length;
    this.size = Math.min(this.size + 1, this.samples.length);
  }

  average(): number {
    if (this.size === 0) return 0;
    let total = 0;
    for (let offset = 0; offset < this.size; offset += 1) {
      const index = (this.cursor - this.size + offset + this.samples.length) % this.samples.length;
      total += this.samples[index]!;
    }
    return total / this.size;
  }

  percentile95(): number {
    if (this.size === 0) return 0;
    this.orderedSamples.length = 0;
    for (let offset = 0; offset < this.size; offset += 1) {
      const index = (this.cursor - this.size + offset + this.samples.length) % this.samples.length;
      this.orderedSamples.push(this.samples[index]!);
    }
    this.orderedSamples.sort((a, b) => a - b);
    return this.orderedSamples[Math.ceil(this.orderedSamples.length * 0.95) - 1]!;
  }
}
