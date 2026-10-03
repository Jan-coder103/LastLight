import { AmbientLight, Color, DirectionalLight, Fog, Scene, Texture, Vector3 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { AtmosphereRuntime } from './AtmosphereRuntime';

describe('AtmosphereRuntime', () => {
  it('restores the camp palette and only shows rain when requested', () => {
    const scene = new Scene();
    scene.background = new Color('#a9a488');
    scene.fog = new Fog('#a9a488', 175, 390);
    const sky = new AmbientLight('#ded9bd', 1.15);
    const fill = new AmbientLight('#75856a', 0.52);
    const sun = new DirectionalLight('#fff0cc', 2.15);
    const exposure = vi.fn();
    const runtime = new AtmosphereRuntime(scene, sky, fill, sun, vi.fn(), exposure);
    const original = (scene.background as Color).getHexString();

    runtime.setRun({ time: 'high-moon', weather: 'rain' }, 'MOON-RAIN');
    runtime.update(0.05, new Vector3(2, 0, 3), true, true, true);
    expect(runtime.isRaining).toBe(true);
    expect((scene.background as Color).getHexString()).not.toBe(original);
    runtime.update(0.05, new Vector3(2, 0, 3), true, false, true);
    expect(runtime.isRaining).toBe(false);

    runtime.setCamp();
    expect((scene.background as Color).getHexString()).toBe(original);
    expect(runtime.isRaining).toBe(false);
    expect(exposure).toHaveBeenLastCalledWith(1.04);
  });

  it('keeps lightning silent when flash reduction is enabled', () => {
    const scene = new Scene();
    scene.background = new Color('#a9a488');
    scene.fog = new Fog('#a9a488', 175, 390);
    const sky = new AmbientLight('#ded9bd', 1.15);
    const fill = new AmbientLight('#75856a', 0.52);
    const sun = new DirectionalLight('#fff0cc', 2.15);
    const thunder = vi.fn();
    const runtime = new AtmosphereRuntime(scene, sky, fill, sun, thunder, () => undefined);
    runtime.setRun({ time: 'low-sun', weather: 'rain' }, 'THUNDER');
    for (let index = 0; index < 400; index += 1)
      runtime.update(0.1, new Vector3(), false, false, true);
    expect(thunder).toHaveBeenCalled();
    expect(sun.intensity).toBeCloseTo(1.25);
  });
});

it('shares the panorama with missions including late loads, and uses 150–200 m fog', () => {
  const scene = new Scene();
  scene.background = new Color('#a9a488');
  scene.fog = new Fog('#a9a488', 175, 390);
  const runtime = new AtmosphereRuntime(
    scene,
    new AmbientLight(),
    new AmbientLight(),
    new DirectionalLight(),
    () => {},
    () => {},
  );
  runtime.setRun({ time: 'low-sun', weather: 'clear' }, 'PANORAMA');
  const panorama = new Texture();
  runtime.setCampBackground(panorama);
  expect(scene.background).toBe(panorama);
  runtime.setCamp();
  expect(scene.background).toBe(panorama);
  runtime.setRun({ time: 'high-moon', weather: 'clear' }, 'PANORAMA');
  expect(scene.background).toBe(panorama);
  expect(scene.fog).toBeInstanceOf(Fog);
  expect((scene.fog as Fog).near).toBe(150);
  expect((scene.fog as Fog).far).toBe(200);
  runtime.setCamp();
  expect(scene.background).toBe(panorama);
});
