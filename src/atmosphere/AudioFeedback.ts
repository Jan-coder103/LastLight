import type { Firearm } from '../game/progression';
import { volumeSetting, type Weather } from './settings';

export type AudioCue =
  'shot' | 'hit' | 'damage' | 'dash' | 'shock' | 'heal' | 'adrenaline' | 'thunder' | 'explosion';

/** Small Web Audio cues; the context is created only after a user gesture. */
export class AudioFeedback {
  private context: AudioContext | undefined;
  private shotEnds: number[] = [];
  private shotSerial = 0;
  private enabled = true;
  private paused = false;
  private masterVolume = 0.8;
  private effectsVolume = 0.85;
  private ambienceVolume = 0.6;
  private masterGain: GainNode | undefined;
  private effectsGain: GainNode | undefined;
  private ambienceGain: GainNode | undefined;
  private rainEnabled = true;
  private rainSource: AudioBufferSourceNode | undefined;
  private rainGain: GainNode | undefined;
  private noiseBuffer: AudioBuffer | undefined;

  unlock(): void {
    if (!this.enabled || this.paused) return;
    try {
      if (!this.context) {
        const context = (this.context = new AudioContext());
        this.masterGain = context.createGain();
        this.effectsGain = context.createGain();
        this.ambienceGain = context.createGain();
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.knee.value = 6;
        limiter.ratio.value = 8;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.12;
        this.effectsGain.connect(this.masterGain);
        this.ambienceGain.connect(this.masterGain);
        this.masterGain.connect(limiter).connect(context.destination);
        this.syncVolumes();
      }
      void this.context.resume().catch(() => undefined);
      this.syncRain();
    } catch {
      // Web Audio can be unavailable or disabled by the host browser.
    }
  }

  setOptions(enabled: boolean, weather: Weather): void {
    this.enabled = enabled;
    this.rainEnabled = enabled && weather === 'rain';
    this.syncVolumes();
    this.syncRain();
  }

  setVolumes(master: number, effects: number, ambience: number): void {
    this.masterVolume = volumeSetting(master, this.masterVolume);
    this.effectsVolume = volumeSetting(effects, this.effectsVolume);
    this.ambienceVolume = volumeSetting(ambience, this.ambienceVolume);
    this.syncVolumes();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) void this.context?.suspend().catch(() => undefined);
    else this.unlock();
  }

  private syncVolumes(): void {
    const now = this.context?.currentTime ?? 0;
    this.masterGain?.gain.setTargetAtTime(this.enabled ? this.masterVolume : 0, now, 0.02);
    this.effectsGain?.gain.setTargetAtTime(this.effectsVolume * 6, now, 0.02);
    this.ambienceGain?.gain.setTargetAtTime(this.ambienceVolume * 2, now, 0.02);
  }

  play(cue: AudioCue): void {
    const context = this.context;
    if (this.paused || !this.enabled || !context || context.state === 'closed') return;
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
      source.connect(filter).connect(gain).connect(this.effectsGain!);
      source.start(now);
      source.stop(now + duration);
      return;
    }
    if (cue === 'thunder' || cue === 'explosion') {
      const source = context.createBufferSource();
      source.buffer = this.getNoiseBuffer(context);
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cue === 'thunder' ? 170 : 460, now);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      const duration = cue === 'thunder' ? 2.1 : 0.62;
      gain.gain.linearRampToValueAtTime(
        cue === 'thunder' ? 0.042 : 0.095,
        now + (cue === 'thunder' ? 0.26 : 0.025),
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source
        .connect(filter)
        .connect(gain)
        .connect(cue === 'thunder' ? this.ambienceGain! : this.effectsGain!);
      source.start(now);
      source.stop(now + duration + 0.05);
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const tones: Record<
      Exclude<AudioCue, 'shot' | 'dash' | 'thunder' | 'explosion'>,
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
    oscillator.connect(gain).connect(this.effectsGain!);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  /** Original procedural synthesis; no sampled recordings or third-party licenses. */
  playWeapon(weapon: Firearm): void {
    const context = this.context;
    if (this.paused || !this.enabled || !context || context.state !== 'running') return;
    const now = context.currentTime;
    this.shotEnds = this.shotEnds.filter((end) => end > now);
    if (this.shotEnds.length >= 4) return;
    const profile =
      weapon === 'smg'
        ? [1500, 0.055, 0.032]
        : weapon === 'handgun'
          ? [750, 0.12, 0.055]
          : [430, 0.16, 0.055];
    const [frequency, duration, volume] = profile as [number, number, number];
    const source = context.createBufferSource();
    source.buffer = this.getNoiseBuffer(context);
    source.playbackRate.value = 0.97 + (this.shotSerial++ % 7) * 0.01;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(this.effectsGain!);
    source.start(now);
    source.stop(now + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    this.shotEnds.push(now + duration);
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
    source.connect(filter).connect(gain).connect(this.ambienceGain!);
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
