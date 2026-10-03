import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  FogExp2,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshPhysicalMaterial,
  Scene,
  Texture,
  Vector3,
} from 'three';
import type { RunAtmosphere, Weather } from './settings';
import type { WorldData } from '../world/generateWorld';
import type { VolumetricFogPass } from './VolumetricFogPass';

interface RainDrop {
  x: number;
  z: number;
  y: number;
  speed: number;
}

const rainDropCount = 150;

/** Applies one seeded lighting/weather preset and keeps rain to a single draw call. */
export class AtmosphereRuntime {
  private campBackground: Color | Texture;
  private readonly campFog: Fog | FogExp2;
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
  private readonly puddleGroup = new Group();
  private readonly puddleGeometry: CircleGeometry;
  private readonly puddleMaterial: MeshPhysicalMaterial;
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
    private readonly volumetricFog?: VolumetricFogPass,
  ) {
    this.campBackground = (scene.background as Color).clone();
    this.campFog = (scene.fog as Fog | FogExp2).clone();
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
    this.puddleGroup.name = 'Rain puddles';
    this.puddleGroup.visible = false;
    this.puddleGeometry = new CircleGeometry(1, 10);
    this.puddleGeometry.rotateX(-Math.PI / 2);
    this.puddleMaterial = new MeshPhysicalMaterial({
      color: '#66716d',
      roughness: 0.16,
      metalness: 0.06,
      clearcoat: 0.72,
      clearcoatRoughness: 0.13,
      transparent: true,
      opacity: 0.66,
      depthWrite: false,
    });
    this.scene.add(this.puddleGroup);
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

  setCampBackground(background: Texture): void {
    this.campBackground = background;
    if (this.campActive) this.scene.background = background;
  }

  setCamp(): void {
    this.campActive = true;
    this.active = { time: 'low-sun', weather: 'clear' };
    this.rainLines.visible = false;
    this.puddleGroup.visible = false;
    this.volumetricFog?.setWeatherVisible(false);
    this.flashRemaining = 0;
    this.scene.background =
      this.campBackground instanceof Texture ? this.campBackground : this.campBackground.clone();
    this.scene.fog = this.campFog.clone();
    this.skyLight.color.copy(this.campSkyColor);
    this.skyLight.intensity = this.campSkyIntensity;
    this.fillLight.color.copy(this.campFillColor);
    this.fillLight.intensity = this.campFillIntensity;
    this.sun.color.copy(this.campSunColor);
    this.sun.intensity = this.campSunIntensity;
    this.sun.position.copy(this.campSunPosition);
    this.setExposure(1.04);
  }

  setRun(preset: RunAtmosphere, seed: string, world?: WorldData): void {
    this.campActive = false;
    this.active = preset;
    this.flashRemaining = 0;
    const palette = this.palette(preset.time, preset.weather);
    this.scene.background = new Color(palette.sky);
    const distanceFogDensity =
      preset.weather === 'clear' ? 0.0016 : preset.weather === 'mist' ? 0.007 : 0.003;
    this.scene.fog = new FogExp2(palette.fog, distanceFogDensity);
    this.volumetricFog?.setWeather(preset.weather, new Color(palette.fog), seed);
    this.puddleGroup.visible = preset.weather === 'rain';
    this.buildPuddles(preset.weather === 'rain' ? world : undefined, seed);

    if (preset.time === 'low-sun') {
      this.skyLight.color.set('#c4cfe0');
      this.skyLight.intensity = preset.weather === 'rain' ? 0.91 : 0.98;
      this.fillLight.color.set('#7085a3');
      this.fillLight.intensity = 0.43;
      this.sun.color.set(preset.weather === 'rain' ? '#c7bba9' : '#ffc48a');
      this.sun.intensity = preset.weather === 'rain' ? 1.25 : 2.28;
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
    weatherVisible = true,
  ): void {
    if (this.campActive) return;
    this.puddleGroup.visible = weatherVisible && this.active.weather === 'rain';
    this.volumetricFog?.setWeatherVisible(weatherVisible);
    if (reduceFlashes) this.flashRemaining = 0;
    const activeRain = this.active.weather === 'rain' && rainVisible && weatherVisible;
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
      this.sun.intensity = (this.active.weather === 'rain' ? 1.25 : 2.28) + flash;
    } else {
      this.sun.intensity = (this.active.weather === 'rain' ? 0.56 : 0.82) + flash;
    }
  }

  private buildPuddles(world: WorldData | undefined, seed: string): void {
    this.puddleGroup.clear();
    if (!world || world.roads.length === 0) return;

    let state = this.seedValue(`${seed}:puddles`);
    const random = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    const puddleCount = Math.min(168, Math.max(72, world.roads.length * 14));
    for (let index = 0; index < puddleCount; index++) {
      const road = world.roads[Math.floor(random() * world.roads.length)]!;
      const runsAlongX = road.sizeX >= road.sizeZ;
      const along = (random() - 0.5) * Math.max(1, (runsAlongX ? road.sizeX : road.sizeZ) - 2);
      const across = (random() - 0.5) * Math.max(0.5, (runsAlongX ? road.sizeZ : road.sizeX) - 1.1);
      const x = road.centerX + (runsAlongX ? along : across);
      const z = road.centerZ + (runsAlongX ? across : along);
      const puddle = new Mesh(this.puddleGeometry, this.puddleMaterial);
      puddle.position.set(x, 0.078, z);
      puddle.scale.set(0.22 + random() * 1.08, 0.12 + random() * 0.72, 1);
      puddle.rotation.y = random() * Math.PI;
      puddle.receiveShadow = true;
      puddle.renderOrder = 1;
      this.puddleGroup.add(puddle);
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
