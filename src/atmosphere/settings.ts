export type TimePreference = 'seeded' | 'low-sun' | 'high-moon';
export type WeatherPreference = 'seeded' | 'clear' | 'mist' | 'rain';
export type TimeOfDay = Exclude<TimePreference, 'seeded'>;
export type Weather = Exclude<WeatherPreference, 'seeded'>;

export interface AtmosphereSettings {
  time: TimePreference;
  weather: WeatherPreference;
  reduceMotion: boolean;
  reduceFlashes: boolean;
  rainVisuals: boolean;
  audioCues: boolean;
  shakeIntensity: number;
}

export interface RunAtmosphere {
  time: TimeOfDay;
  weather: Weather;
}

export const atmosphereSettingsKey = 'last-light-atmosphere-options';

export function defaultAtmosphereSettings(prefersReducedMotion = false): AtmosphereSettings {
  return {
    time: 'seeded',
    weather: 'seeded',
    reduceMotion: prefersReducedMotion,
    reduceFlashes: prefersReducedMotion,
    rainVisuals: true,
    audioCues: true,
    shakeIntensity: 0.55,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

export function parseAtmosphereSettings(
  raw: string | null,
  prefersReducedMotion = false,
): AtmosphereSettings {
  const defaults = defaultAtmosphereSettings(prefersReducedMotion);
  if (!raw) return defaults;
  try {
    const record = asRecord(JSON.parse(raw));
    if (!record || record.version !== 1) return defaults;
    const time: TimePreference =
      record.time === 'low-sun' || record.time === 'high-moon' ? record.time : 'seeded';
    const weather: WeatherPreference =
      record.weather === 'clear' || record.weather === 'mist' || record.weather === 'rain'
        ? record.weather
        : 'seeded';
    const intensity = record.shakeIntensity;
    return {
      time,
      weather,
      reduceMotion:
        typeof record.reduceMotion === 'boolean' ? record.reduceMotion : defaults.reduceMotion,
      reduceFlashes:
        typeof record.reduceFlashes === 'boolean' ? record.reduceFlashes : defaults.reduceFlashes,
      rainVisuals:
        typeof record.rainVisuals === 'boolean' ? record.rainVisuals : defaults.rainVisuals,
      audioCues: typeof record.audioCues === 'boolean' ? record.audioCues : defaults.audioCues,
      shakeIntensity:
        typeof intensity === 'number' && Number.isFinite(intensity)
          ? Math.max(0, Math.min(1, intensity))
          : defaults.shakeIntensity,
    };
  } catch {
    return defaults;
  }
}

export function loadAtmosphereSettings(
  storage: Pick<Storage, 'getItem'> | undefined,
  prefersReducedMotion = false,
): AtmosphereSettings {
  try {
    return parseAtmosphereSettings(
      storage?.getItem(atmosphereSettingsKey) ?? null,
      prefersReducedMotion,
    );
  } catch {
    return defaultAtmosphereSettings(prefersReducedMotion);
  }
}

export function saveAtmosphereSettings(
  settings: AtmosphereSettings,
  storage: Pick<Storage, 'setItem'> | undefined,
): boolean {
  try {
    storage?.setItem(atmosphereSettingsKey, JSON.stringify({ version: 1, ...settings }));
    return Boolean(storage);
  } catch {
    return false;
  }
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolveRunAtmosphere(seed: string, settings: AtmosphereSettings): RunAtmosphere {
  const hash = hashSeed(seed);
  const times: readonly TimeOfDay[] = ['low-sun', 'high-moon'];
  const weathers: readonly Weather[] = ['clear', 'mist', 'rain'];
  return {
    time: settings.time === 'seeded' ? times[hash & 1]! : settings.time,
    weather:
      settings.weather === 'seeded' ? weathers[(hash >>> 1) % weathers.length]! : settings.weather,
  };
}
