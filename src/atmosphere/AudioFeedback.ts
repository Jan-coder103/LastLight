import type { Weather } from './settings';

export type AudioCue =
  'shot' | 'hit' | 'damage' | 'dash' | 'shock' | 'heal' | 'adrenaline' | 'thunder';

/** Small Web Audio cues; the context is created only after a user gesture. */
export class AudioFeedback {
  private context: AudioContext | undefined;
  private enabled = true;
  private rainEnabled = true;
  private rainSource: AudioBufferSourceNode | undefined;
  private rainGain: GainNode | undefined;
  private noiseBuffer: AudioBuffer | undefined;

  unlock(): void {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => undefined);
      this.syncRain();
    } catch {
      // Web Audio can be unavailable or disabled by the host browser.
    }
  }

  setOptions(enabled: boolean, weather: Weather): void {
    this.enabled = enabled;
    this.rainEnabled = enabled && weather === 'rain';
    this.syncRain();
  }

  play(cue: AudioCue): void {
    const context = this.context;
    if (!this.enabled || !context || context.state === 'closed') return;
    const now = context.currentTime;
    if (cue === 'shot' || cue === 'dash') {
      const source = context.createBufferSource();
      source.buffer = this.getNoiseBuffer(context);
      const filter = context.createBiquadFilter();
      filter.type = cue === 'shot' ? 'highpass' : 'bandpass';
      filter.frequency.setValueAtTime(cue === 'shot' ? 900 : 720, now);
      const gain = context.createGain();
      const duration = cue === 'shot' ? 0.085 : 0.15;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(cue === 'shot' ? 0.055 : 0.038, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(now);
      source.stop(now + duration);
      return;
    }
    if (cue === 'thunder') {
      const source = context.createBufferSource();
      source.buffer = this.getNoiseBuffer(context);
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(170, now);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.042, now + 0.26);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(now);
      source.stop(now + 2.15);
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const tones: Record<
      Exclude<AudioCue, 'shot' | 'dash' | 'thunder'>,
      [number, number, number, OscillatorType, number]
    > = {
      hit: [620, 360, 0.11, 'triangle', 0.045],
      damage: [118, 72, 0.24, 'sine', 0.06],
      shock: [270, 78, 0.32, 'sawtooth', 0.04],
      heal: [490, 820, 0.25, 'sine', 0.035],
      adrenaline: [350, 680, 0.19, 'triangle', 0.03],
    };
    const [startHz, endHz, duration, type, volume] = tones[cue];
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startHz, now);
    oscillator.frequency.exponentialRampToValueAtTime(endHz, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  dispose(): void {
    this.stopRain();
    if (this.context && this.context.state !== 'closed') void this.context.close();
  }

  private getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const samples = Math.ceil(context.sampleRate * 2.2);
    const buffer = context.createBuffer(1, samples, context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x51f15e;
    for (let index = 0; index < data.length; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      data[index] = ((seed / 0x100000000) * 2 - 1) * 0.7;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private syncRain(): void {
    const context = this.context;
    if (!context) return;
    if (!this.rainEnabled || context.state === 'closed') {
      this.stopRain();
      return;
    }
    if (this.rainSource) return;
    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2100;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.012, context.currentTime + 0.4);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    this.rainSource = source;
    this.rainGain = gain;
  }

  private stopRain(): void {
    if (!this.rainSource) return;
    try {
      const now = this.context?.currentTime ?? 0;
      this.rainGain?.gain.setTargetAtTime(0.0001, now, 0.12);
      this.rainSource.stop(now + 0.5);
    } catch {
      // The source may already be stopping after a weather preference change.
    }
    this.rainSource = undefined;
    this.rainGain = undefined;
  }
}
