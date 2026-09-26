import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  LineBasicMaterial,
  LineSegments,
  Scene,
  Vector3,
} from 'three';
import type { RunAtmosphere, Weather } from './settings';

interface RainDrop {
  x: number;
  z: number;
  y: number;
  speed: number;
}

const rainDropCount = 150;

/** Applies one seeded lighting/weather preset and keeps rain to a single draw call. */
export class AtmosphereRuntime {
  private readonly campBackground: Color;
  private readonly campFog: Color;
  private readonly campFogNear: number;
  private readonly campFogFar: number;
  private readonly campSkyColor: Color;
  private readonly campSkyIntensity: number;
  private readonly campFillColor: Color;
  private readonly campFillIntensity: number;
  private readonly campSunColor: Color;
  private readonly campSunIntensity: number;
  private readonly campSunPosition: Vector3;
  private readonly rainGeometry = new BufferGeometry();
  private readonly rainPositions = new Float32Array(rainDropCount * 6);
  private readonly rainDrops: RainDrop[] = [];
  private readonly rainLines: LineSegments<BufferGeometry, LineBasicMaterial>;
  private rainAccumulator = 0;
  private thunderRemaining = 0;
  private flashRemaining = 0;
  private randomState = 1;
  private campActive = true;
  private active: RunAtmosphere = { time: 'low-sun', weather: 'clear' };

  constructor(
    private readonly scene: Scene,
    private readonly skyLight: AmbientLight,
    private readonly fillLight: AmbientLight,
    private readonly sun: DirectionalLight,
    private readonly onThunder: () => void,
    private readonly setExposure: (value: number) => void,
  ) {
    this.campBackground = (scene.background as Color).clone();
    const fog = scene.fog as Fog;
    this.campFog = fog.color.clone();
    this.campFogNear = fog.near;
    this.campFogFar = fog.far;
    this.campSkyColor = skyLight.color.clone();
    this.campSkyIntensity = skyLight.intensity;
    this.campFillColor = fillLight.color.clone();
    this.campFillIntensity = fillLight.intensity;
    this.campSunColor = sun.color.clone();
    this.campSunIntensity = sun.intensity;
    this.campSunPosition = sun.position.clone();

    this.rainGeometry.setAttribute(
      'position',
      new BufferAttribute(this.rainPositions, 3).setUsage(DynamicDrawUsage),
    );
    this.rainGeometry.setDrawRange(0, rainDropCount * 2);
    this.rainLines = new LineSegments(
      this.rainGeometry,
      new LineBasicMaterial({
        color: '#d7e1e4',
        transparent: true,
        opacity: 0.27,
        depthWrite: false,
      }),
    );
    this.rainLines.name = 'Atmosphere rain streaks';
    this.rainLines.frustumCulled = false;
    this.rainLines.visible = false;
    this.scene.add(this.rainLines);
  }

  get time(): RunAtmosphere['time'] {
    return this.active.time;
  }

  get weather(): Weather {
    return this.active.weather;
  }

  get isRaining(): boolean {
    return this.rainLines.visible;
  }

  setCamp(): void {
    this.campActive = true;
    this.active = { time: 'low-sun', weather: 'clear' };
    this.rainLines.visible = false;
    this.flashRemaining = 0;
    this.scene.background = this.campBackground.clone();
    const fog = this.scene.fog as Fog;
    fog.color.copy(this.campFog);
    fog.near = this.campFogNear;
    fog.far = this.campFogFar;
    this.skyLight.color.copy(this.campSkyColor);
    this.skyLight.intensity = this.campSkyIntensity;
    this.fillLight.color.copy(this.campFillColor);
    this.fillLight.intensity = this.campFillIntensity;
    this.sun.color.copy(this.campSunColor);
    this.sun.intensity = this.campSunIntensity;
    this.sun.position.copy(this.campSunPosition);
    this.setExposure(1.04);
  }

  setRun(preset: RunAtmosphere, seed: string): void {
    this.campActive = false;
    this.active = preset;
    this.flashRemaining = 0;
    const palette = this.palette(preset.time, preset.weather);
    this.scene.background = new Color(palette.sky);
    const fog = this.scene.fog as Fog;
    fog.color.set(palette.fog);
    fog.near = preset.weather === 'clear' ? 175 : preset.weather === 'mist' ? 32 : 58;
    fog.far = preset.weather === 'clear' ? 390 : preset.weather === 'mist' ? 145 : 205;

    if (preset.time === 'low-sun') {
      this.skyLight.color.set('#ded9bd');
      this.skyLight.intensity = preset.weather === 'rain' ? 0.98 : 1.15;
      this.fillLight.color.set('#75856a');
      this.fillLight.intensity = 0.52;
      this.sun.color.set(preset.weather === 'rain' ? '#ddd2b9' : '#fff0cc');
      this.sun.intensity = preset.weather === 'rain' ? 1.25 : 2.05;
      this.sun.position.set(-82, 52, 48);
      this.setExposure(1.0);
    } else {
      this.skyLight.color.set('#9aabc1');
      this.skyLight.intensity = 0.82;
      this.fillLight.color.set('#53697e');
      this.fillLight.intensity = 0.44;
      this.sun.color.set('#aabfe7');
      this.sun.intensity = preset.weather === 'rain' ? 0.56 : 0.82;
      this.sun.position.set(36, 122, -55);
      this.setExposure(1.08);
    }

    this.resetRain(seed);
    this.thunderRemaining = 13 + this.nextRandom() * 13;
  }

  update(
    deltaSeconds: number,
    playerPosition: Vector3,
    topDown: boolean,
    rainVisible: boolean,
    reduceFlashes: boolean,
  ): void {
    if (this.campActive) return;
    if (reduceFlashes) this.flashRemaining = 0;
    const activeRain = this.active.weather === 'rain' && rainVisible;
    this.rainLines.visible = activeRain;
    if (activeRain) this.updateRain(deltaSeconds, playerPosition, topDown);

    if (this.active.weather === 'rain') {
      this.thunderRemaining -= deltaSeconds;
      if (this.thunderRemaining <= 0) {
        this.onThunder();
        this.thunderRemaining = 24 + this.nextRandom() * 20;
        if (!reduceFlashes) this.flashRemaining = 0.24;
      }
    }
    this.flashRemaining = Math.max(0, this.flashRemaining - deltaSeconds);
    const flash =
      this.flashRemaining > 0 ? Math.sin((this.flashRemaining / 0.24) * Math.PI) * 0.72 : 0;
    if (this.active.time === 'low-sun') {
      this.sun.intensity = (this.active.weather === 'rain' ? 1.25 : 2.05) + flash;
    } else {
      this.sun.intensity = (this.active.weather === 'rain' ? 0.56 : 0.82) + flash;
    }
  }

  private palette(time: RunAtmosphere['time'], weather: Weather): { sky: string; fog: string } {
    if (time === 'low-sun') {
      if (weather === 'mist') return { sky: '#9d9a88', fog: '#aaa796' };
      if (weather === 'rain') return { sky: '#7f8985', fog: '#929b95' };
      return { sky: '#a9a488', fog: '#a9a488' };
    }
    if (weather === 'mist') return { sky: '#4b5968', fog: '#697789' };
    if (weather === 'rain') return { sky: '#384754', fog: '#536272' };
    return { sky: '#3c4d60', fog: '#3c4d60' };
  }

  private resetRain(seed: string): void {
    this.randomState = this.seedValue(`${seed}:rain`);
    this.rainDrops.length = 0;
    for (let index = 0; index < rainDropCount; index += 1) {
      this.rainDrops.push({
        x: (this.nextRandom() * 2 - 1) * 23,
        z: (this.nextRandom() * 2 - 1) * 23,
        y: 1 + this.nextRandom() * 32,
        speed: 15 + this.nextRandom() * 5,
      });
    }
    this.rainAccumulator = 0;
  }

  private updateRain(deltaSeconds: number, player: Vector3, topDown: boolean): void {
    this.rainAccumulator += Math.min(deltaSeconds, 0.05);
    if (this.rainAccumulator < 0.045) return;
    const step = this.rainAccumulator;
    this.rainAccumulator = 0;
    const ceiling = topDown ? 37 : 12;
    for (let index = 0; index < this.rainDrops.length; index += 1) {
      const drop = this.rainDrops[index]!;
      drop.y -= drop.speed * step;
      if (drop.y < 0.8) {
        drop.y = ceiling * (0.45 + this.nextRandom() * 0.55);
        drop.x = (this.nextRandom() * 2 - 1) * 23;
        drop.z = (this.nextRandom() * 2 - 1) * 23;
      }
      const offset = index * 6;
      const x = player.x + drop.x;
      const z = player.z + drop.z;
      this.rainPositions[offset] = x;
      this.rainPositions[offset + 1] = drop.y;
      this.rainPositions[offset + 2] = z;
      this.rainPositions[offset + 3] = x + 0.045;
      this.rainPositions[offset + 4] = drop.y - 0.78;
      this.rainPositions[offset + 5] = z + 0.08;
    }
    this.rainGeometry.attributes.position!.needsUpdate = true;
  }

  private seedValue(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 1;
  }

  private nextRandom(): number {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 0x100000000;
  }
}
