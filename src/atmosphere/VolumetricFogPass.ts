import {
  Color,
  DataTexture,
  DirectionalLight,
  LinearFilter,
  Matrix4,
  Object3D,
  PerspectiveCamera,
  PointLight,
  RGBAFormat,
  RepeatWrapping,
  Scene,
  SpotLight,
  UnsignedByteType,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { Weather } from './settings';

const localLightCount = 4;
const noiseTextureSize = 128;
const noiseFrequencies = [4, 9, 21, 45] as const;

const fogShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    uNoiseTexture: { value: null },
    uInverseProjection: { value: new Matrix4() },
    uCameraWorld: { value: new Matrix4() },
    uCameraPosition: { value: new Vector3() },
    uFogColor: { value: new Color('#a9a488') },
    uDensity: { value: 0 },
    uTime: { value: 0 },
    uEnabled: { value: 0 },
    uSunDirection: { value: new Vector3(0, 1, 0) },
    uSunColor: { value: new Color('#fff0cc') },
    uSunIntensity: { value: 1 },
    uLightPositions: {
      value: Array.from({ length: localLightCount }, () => new Vector3()),
    },
    uLightColors: {
      value: Array.from({ length: localLightCount }, () => new Color()),
    },
    uLightIntensities: { value: new Float32Array(localLightCount) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform sampler2D uNoiseTexture;
    uniform mat4 uInverseProjection;
    uniform mat4 uCameraWorld;
    uniform vec3 uCameraPosition;
    uniform vec3 uFogColor;
    uniform float uDensity;
    uniform float uTime;
    uniform float uEnabled;
    uniform vec3 uSunDirection;
    uniform vec3 uSunColor;
    uniform float uSunIntensity;
    uniform vec3 uLightPositions[${localLightCount}];
    uniform vec3 uLightColors[${localLightCount}];
    uniform float uLightIntensities[${localLightCount}];
    varying vec2 vUv;

    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      if (uEnabled < 0.5) {
        gl_FragColor = source;
        return;
      }

      float depth = texture2D(tDepth, vUv).x;
      vec4 clipPosition = vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
      vec4 viewPosition = uInverseProjection * clipPosition;
      viewPosition /= max(viewPosition.w, 0.00001);
      vec3 surfacePosition = (uCameraWorld * vec4(viewPosition.xyz, 1.0)).xyz;
      vec3 ray = surfacePosition - uCameraPosition;
      float surfaceDistance = length(ray);
      float marchDistance = min(surfaceDistance, 240.0);
      vec3 rayDirection = ray / max(surfaceDistance, 0.0001);
      vec3 toCamera = -rayDirection;
      vec3 sunDirection = normalize(uSunDirection);
      float stepLength = marchDistance / 12.0;
      float transmittance = 1.0;
      vec3 scatteredLight = vec3(0.0);

      for (int stepIndex = 0; stepIndex < 12; stepIndex++) {
        float distanceAlongRay = (float(stepIndex) + 0.5) * stepLength;
        vec3 samplePosition = uCameraPosition + rayDirection * distanceAlongRay;
        vec2 flow = vec2(uTime * 0.00082, -uTime * 0.00057);
        vec2 noiseUv = samplePosition.xz * 0.0034 + flow;
        noiseUv += vec2(samplePosition.y * 0.0018, -samplePosition.y * 0.0013);
        vec4 noise = texture2D(uNoiseTexture, noiseUv);

        float broadBanks = noise.r * 0.68 + noise.g * 0.32;
        float bankDensity = smoothstep(0.37, 0.72, broadBanks);
        float wisps = smoothstep(0.3, 0.78, noise.b);
        float heightFalloff = exp(-max(samplePosition.y, 0.0) * 0.15);
        float localDensity = uDensity * heightFalloff *
          mix(0.035, 1.65, bankDensity) * (0.68 + wisps * 0.56);
        float segmentTransmittance = exp(-localDensity * stepLength);

        float forwardScatter = pow(max(dot(toCamera, sunDirection), 0.0), 4.0);
        vec3 illumination = uFogColor * (0.35 + uSunIntensity * 0.09);
        illumination += uSunColor * uSunIntensity * (0.035 + forwardScatter * 0.14);
        for (int lightIndex = 0; lightIndex < ${localLightCount}; lightIndex++) {
          if (uLightIntensities[lightIndex] < 0.001) continue;
          vec3 toLight = uLightPositions[lightIndex] - samplePosition;
          float lightDistance = length(toLight);
          float alignment = pow(max(dot(toCamera, normalize(toLight)), 0.0), 5.0);
          float attenuation = uLightIntensities[lightIndex] /
            (1.0 + lightDistance * 0.08 + lightDistance * lightDistance * 0.003);
          illumination += uLightColors[lightIndex] * alignment * attenuation * 0.11;
        }

        scatteredLight += illumination * (1.0 - segmentTransmittance) * transmittance;
        transmittance *= segmentTransmittance;
        if (transmittance < 0.025) break;
      }

      gl_FragColor = vec4(source.rgb * transmittance + scatteredLight, source.a);
    }
  `,
};

/** Raymarches seeded, world-space fog density between the camera and scene depth. */
export class VolumetricFogPass extends ShaderPass {
  private readonly localLights: Array<PointLight | SpotLight> = [];
  private readonly inverseProjection = new Matrix4();
  private readonly cameraWorld = new Matrix4();
  private readonly cameraPosition = new Vector3();
  private noiseTexture: DataTexture;
  private lightRefresh = 0;

  constructor(
    private readonly scene: Scene,
    private readonly camera: PerspectiveCamera,
    private readonly sun: DirectionalLight,
  ) {
    super(fogShader);
    this.enabled = false;
    this.needsSwap = true;
    this.noiseTexture = this.makeNoiseTexture('DEFAULT-MIST');
    this.uniforms.uNoiseTexture!.value = this.noiseTexture;
    this.syncLights();
  }

  setWeather(weather: Weather, color: Color, seed: string): void {
    const active = weather !== 'clear';
    this.enabled = active;
    this.uniforms.uEnabled!.value = active ? 1 : 0;
    this.uniforms.uDensity!.value = weather === 'mist' ? 0.034 : weather === 'rain' ? 0.012 : 0;
    this.uniforms.uFogColor!.value.copy(color);
    const nextNoise = this.makeNoiseTexture(`${seed}:drifting-fog`);
    this.uniforms.uNoiseTexture!.value = nextNoise;
    this.noiseTexture.dispose();
    this.noiseTexture = nextNoise;
    this.syncLights();
  }

  setWeatherVisible(visible: boolean): void {
    this.enabled = visible && this.uniforms.uDensity!.value > 0;
    this.uniforms.uEnabled!.value = this.enabled ? 1 : 0;
  }

  override render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
    deltaTime: number,
    maskActive: boolean,
  ): void {
    this.uniforms.tDepth!.value = readBuffer.depthTexture;
    this.camera.updateMatrixWorld();
    this.inverseProjection.copy(this.camera.projectionMatrixInverse);
    this.cameraWorld.copy(this.camera.matrixWorld);
    this.cameraPosition.copy(this.camera.position);
    this.uniforms.uInverseProjection!.value.copy(this.inverseProjection);
    this.uniforms.uCameraWorld!.value.copy(this.cameraWorld);
    this.uniforms.uCameraPosition!.value.copy(this.cameraPosition);
    this.uniforms.uTime!.value += Math.min(deltaTime, 0.05);
    this.uniforms.uSunDirection!.value.copy(this.sun.position).normalize();
    this.uniforms.uSunColor!.value.copy(this.sun.color);
    this.uniforms.uSunIntensity!.value = this.sun.intensity;
    this.lightRefresh -= deltaTime;
    if (this.lightRefresh <= 0) this.syncLights();
    this.updateLightUniforms();
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  }

  override dispose(): void {
    super.dispose();
    this.noiseTexture.dispose();
  }

  private syncLights(): void {
    this.localLights.length = 0;
    this.scene.updateMatrixWorld(true);
    this.scene.traverse((object) => {
      if (
        (object instanceof PointLight || object instanceof SpotLight) &&
        object.intensity > 0 &&
        this.hasVisibleParents(object)
      ) {
        this.localLights.push(object);
      }
    });
    this.localLights.length = Math.min(this.localLights.length, localLightCount);
    this.lightRefresh = 1.5;
  }

  private hasVisibleParents(object: PointLight | SpotLight): boolean {
    let parent: Object3D | null = object;
    while (parent) {
      if (!parent.visible) return false;
      parent = parent.parent;
    }
    return true;
  }

  private updateLightUniforms(): void {
    const positions = this.uniforms.uLightPositions!.value as Vector3[];
    const colors = this.uniforms.uLightColors!.value as Color[];
    const intensities = this.uniforms.uLightIntensities!.value as Float32Array;
    positions.forEach((position, index) => {
      const light = this.localLights[index];
      if (!light) {
        position.set(0, -10000, 0);
        colors[index]!.setRGB(0, 0, 0);
        intensities[index] = 0;
        return;
      }
      light.getWorldPosition(position);
      colors[index]!.copy(light.color);
      intensities[index] = Math.min(light.intensity, 8);
    });
  }

  private makeNoiseTexture(seed: string): DataTexture {
    let state = this.hashSeed(seed);
    const random = (): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    const fields = noiseFrequencies.map((frequency) => {
      const values = new Float32Array(frequency * frequency);
      for (let index = 0; index < values.length; index++) values[index] = random();
      return values;
    });
    const pixels = new Uint8Array(noiseTextureSize * noiseTextureSize * 4);
    for (let y = 0; y < noiseTextureSize; y++) {
      for (let x = 0; x < noiseTextureSize; x++) {
        const offset = (y * noiseTextureSize + x) * 4;
        noiseFrequencies.forEach((frequency, channel) => {
          const gridX = (x / noiseTextureSize) * frequency;
          const gridY = (y / noiseTextureSize) * frequency;
          const x0 = Math.floor(gridX);
          const y0 = Math.floor(gridY);
          const x1 = (x0 + 1) % frequency;
          const y1 = (y0 + 1) % frequency;
          const amountX = this.smooth(gridX - x0);
          const amountY = this.smooth(gridY - y0);
          const field = fields[channel]!;
          const top = this.mix(field[y0 * frequency + x0]!, field[y0 * frequency + x1]!, amountX);
          const bottom = this.mix(
            field[y1 * frequency + x0]!,
            field[y1 * frequency + x1]!,
            amountX,
          );
          pixels[offset + channel] = Math.round(this.mix(top, bottom, amountY) * 255);
        });
        pixels[offset + 3] = 255;
      }
    }

    const texture = new DataTexture(
      pixels,
      noiseTextureSize,
      noiseTextureSize,
      RGBAFormat,
      UnsignedByteType,
    );
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  private hashSeed(seed: string): number {
    let hash = 2166136261;
    for (let index = 0; index < seed.length; index++) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0 || 1;
  }

  private smooth(value: number): number {
    return value * value * (3 - 2 * value);
  }

  private mix(start: number, end: number, amount: number): number {
    return start + (end - start) * amount;
  }
}
