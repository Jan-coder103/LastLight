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
    resume = () => Promise.resolve();
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
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: () => {},
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
  audio.setOptions(false, 'clear');
  audio.playWeapon('smg');
  expect(sources).toHaveLength(5);
  vi.unstubAllGlobals();
});
