import { expect, it, vi } from 'vitest';
import { AudioFeedback } from './AudioFeedback';
it('plays distinct bounded weapon voices, respects mute, varies pitch narrowly, and frees nodes', () => {
  const frequencies: number[] = [],
    rates: number[] = [],
    sources: { disconnect: ReturnType<typeof vi.fn>; onended?: () => void }[] = [];
  let currentTime = 0;
  class Context {
    state = 'running';
    get currentTime() {
      return currentTime;
    }
    sampleRate = 100;
    destination = {};
    resume = vi.fn(() => Promise.resolve());
    suspend = vi.fn(() => Promise.resolve());
    createDynamicsCompressor() {
      return {
        threshold: {},
        knee: {},
        ratio: {},
        attack: {},
        release: {},
        connect: (node: unknown) => node,
      };
    }
    createBuffer = (_channels: number, samples: number) => ({
      getChannelData: () => new Float32Array(samples),
    });
    createBufferSource() {
      const source = {
        buffer: null,
        playbackRate: { value: 1 },
        connect: (n: unknown) => n,
        start: () => {
          rates.push(source.playbackRate.value);
        },
        stop: () => {},
        disconnect: vi.fn(),
        onended: undefined as undefined | (() => void),
      };
      sources.push(source);
      return source;
    }
    createBiquadFilter() {
      const frequency = { value: 0 };
      const node = {
        type: '',
        frequency,
        connect: (n: unknown) => {
          frequencies.push(frequency.value);
          return n;
        },
        disconnect: vi.fn(),
      };
      return node;
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          setTargetAtTime: vi.fn(),
        },
        connect: (node: unknown) => node,
        disconnect: vi.fn(),
      };
    }
  }
  vi.stubGlobal('AudioContext', Context);
  const audio = new AudioFeedback();
  audio.setOptions(true, 'clear');
  audio.unlock();
  audio.playWeapon('handgun');
  audio.playWeapon('smg');
  audio.playWeapon('rifle');
  audio.playWeapon('smg');
  audio.playWeapon('smg');
  expect(sources).toHaveLength(4);
  expect(frequencies.slice(0, 3)).toEqual([750, 1500, 430]);
  expect(rates.every((r) => r >= 0.97 && r <= 1.03)).toBe(true);
  sources[0]!.onended!();
  expect(sources[0]!.disconnect).toHaveBeenCalled();
  currentTime = 1;
  audio.playWeapon('rifle');
  expect(sources).toHaveLength(5);
  audio.setPaused(true);
  audio.playWeapon('smg');
  expect(sources).toHaveLength(5);
  audio.setPaused(false);
  audio.setOptions(false, 'clear');
  audio.playWeapon('smg');
  expect(sources).toHaveLength(5);
  vi.unstubAllGlobals();
});

it('routes independently adjustable effects and ambience through a master limiter, and suspends while paused', () => {
  const gains: Array<{
    gain: { setTargetAtTime: ReturnType<typeof vi.fn> };
    connect: ReturnType<typeof vi.fn>;
  }> = [];
  const resume = vi.fn(() => Promise.resolve());
  const suspend = vi.fn(() => Promise.resolve());
  const destination = {};
  const limiter = {
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 0 },
    attack: { value: 0 },
    release: { value: 0 },
    connect: vi.fn(),
  };
  class Context {
    currentTime = 1;
    destination = destination;
    resume = resume;
    suspend = suspend;
    createGain() {
      const node = { gain: { setTargetAtTime: vi.fn() }, connect: vi.fn((target) => target) };
      gains.push(node);
      return node;
    }
    createDynamicsCompressor() {
      return limiter;
    }
  }
  vi.stubGlobal('AudioContext', Context);
  try {
    const audio = new AudioFeedback();
    audio.setOptions(true, 'clear');
    audio.unlock();
    expect(gains[1]!.connect).toHaveBeenCalledWith(gains[0]);
    expect(gains[2]!.connect).toHaveBeenCalledWith(gains[0]);
    expect(gains[0]!.connect).toHaveBeenCalledWith(limiter);
    expect(limiter.connect).toHaveBeenCalledWith(destination);
    audio.setVolumes(0, 1, 0.25);
    expect(gains[0]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 1, 0.02);
    expect(gains[1]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(6, 1, 0.02);
    expect(gains[2]!.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.5, 1, 0.02);
    audio.setPaused(true);
    audio.unlock();
    expect(suspend).toHaveBeenCalledOnce();
    expect(resume).toHaveBeenCalledOnce();
    audio.setPaused(false);
    expect(resume).toHaveBeenCalledTimes(2);
  } finally {
    vi.unstubAllGlobals();
  }
});
