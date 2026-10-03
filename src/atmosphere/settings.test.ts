import { describe, expect, it } from 'vitest';
import {
  atmosphereSettingsKey,
  defaultAtmosphereSettings,
  loadAtmosphereSettings,
  parseAtmosphereSettings,
  resolveRunAtmosphere,
  saveAtmosphereSettings,
} from './settings';

describe('atmosphere options', () => {
  it('honors the operating system reduce-motion preference by default', () => {
    expect(defaultAtmosphereSettings(true)).toMatchObject({
      reduceMotion: true,
      reduceFlashes: true,
    });
  });

  it('loads valid settings and clamps intensity', () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          time: 'high-moon',
          weather: 'rain',
          shakeIntensity: 1.8,
          reduceMotion: true,
          reduceFlashes: true,
          rainVisuals: false,
          audioCues: false,
        }),
    };
    expect(loadAtmosphereSettings(storage)).toEqual({
      time: 'high-moon',
      weather: 'rain',
      reduceMotion: true,
      reduceFlashes: true,
      rainVisuals: false,
      audioCues: false,
      shakeIntensity: 1,
      masterVolume: 0.8,
      effectsVolume: 0.85,
      ambienceVolume: 0.6,
      bloodEnabled: true,
    });
  });

  it('recovers safely from malformed or outdated settings', () => {
    expect(parseAtmosphereSettings('{bad json')).toEqual(defaultAtmosphereSettings());
    expect(parseAtmosphereSettings('{"version":2}')).toEqual(defaultAtmosphereSettings());
  });

  it('persists preferences under a separate versioned key', () => {
    let savedKey = '';
    let savedValue = '';
    const storage = {
      setItem: (key: string, value: string) => {
        savedKey = key;
        savedValue = value;
      },
    };
    const settings = { ...defaultAtmosphereSettings(), weather: 'mist' as const };
    expect(saveAtmosphereSettings(settings, storage)).toBe(true);
    expect(savedKey).toBe(atmosphereSettingsKey);
    expect(JSON.parse(savedValue)).toMatchObject({ version: 1, weather: 'mist' });
    expect(saveAtmosphereSettings(settings, undefined)).toBe(false);
  });

  it('keeps seeded time and weather stable for each world seed', () => {
    const settings = defaultAtmosphereSettings();
    expect(resolveRunAtmosphere('RAVEN-07', settings)).toEqual(
      resolveRunAtmosphere('RAVEN-07', settings),
    );
    expect(resolveRunAtmosphere('RAVEN-07', { ...settings, time: 'high-moon' })).toMatchObject({
      time: 'high-moon',
    });
    expect(resolveRunAtmosphere('RAVEN-07', { ...settings, weather: 'mist' })).toMatchObject({
      weather: 'mist',
    });
  });
});

it('clamps audio levels, preserves mute and blood settings, and migrates legacy options', () => {
  const settings = parseAtmosphereSettings(
    JSON.stringify({
      version: 1,
      masterVolume: -1,
      effectsVolume: 2,
      ambienceVolume: 0,
      bloodEnabled: false,
    }),
  );
  expect(settings).toMatchObject({
    masterVolume: 0,
    effectsVolume: 1,
    ambienceVolume: 0,
    bloodEnabled: false,
  });
  let raw = '';
  saveAtmosphereSettings(settings, {
    setItem: (_key, value) => {
      raw = value;
    },
  });
  expect(parseAtmosphereSettings(raw)).toEqual(settings);
  expect(parseAtmosphereSettings('{"version":1}')).toEqual(defaultAtmosphereSettings());
  expect(parseAtmosphereSettings('{"version":1,"masterVolume":"loud"}').masterVolume).toBe(0.8);
});
