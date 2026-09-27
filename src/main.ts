import {
  AmbientLight,
  ACESFilmicToneMapping,
  ArrowHelper,
  BufferAttribute,
  BufferGeometry,
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DepthTexture,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  Object3D,
  type Material,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import type { AbilitySlot } from './input/controlMap';
import { installAssetDocumentOverride } from './assets/catalog';
import { readStoredAssetDocument, type AssetDocument } from './assets/assetDocument';
import { createHelicopter } from './assets/helicopter';
import { AtmosphereRuntime } from './atmosphere/AtmosphereRuntime';
import { AudioFeedback } from './atmosphere/AudioFeedback';
import { ParticleBursts } from './atmosphere/ParticleBursts';
import { VolumetricFogPass } from './atmosphere/VolumetricFogPass';
import {
  loadAtmosphereSettings,
  resolveRunAtmosphere,
  saveAtmosphereSettings,
  type AtmosphereSettings,
  type RunAtmosphere,
} from './atmosphere/settings';
import { buildCamp, updateCampWalkers } from './camp/buildCamp';
import { buyCampItem, campPrices, sellCampItem } from './camp/campEconomy';
import { campEntrances, campServices, createCampWorld } from './camp/campWorld';
import { CameraRig } from './camera/CameraRig';
import { CombatSimulation, type ZombieState } from './game/CombatSimulation';
import { benchmarkCountsForHorde, benchmarkHorde } from './game/HordeBenchmark';
import { HordeSimulation, type HordeSpawnPattern } from './game/HordeSimulation';
import { PerformanceWindow } from './game/PerformanceWindow';
import { openCache, placeLootCaches, type CacheSite, type LootDrop } from './game/loot';
import {
  addCargo,
  cargoCapacity,
  cargoWeight,
  emptyInventory,
  loadSave,
  resolveRunOutcome,
  storeSave,
  type ResourceKind,
  type SaveData,
} from './game/saveData';
import { createZombieVisual, syncZombieVisual } from './game/zombieVisual';
import { GridNavigator, type NavPoint } from './navigation/GridNavigator';
import { buildInterior } from './interiors/buildInterior';
import { generateInterior, interiorWorld, type InteriorLayout } from './interiors/interiorLayout';
import { PlayerController } from './player/PlayerController';
import { buildWorld } from './world/buildWorld';
import {
  generateWorld,
  terrainHeightAt,
  type BuildingEntrance,
  type WorldData,
} from './world/generateWorld';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');
if (!canvas) throw new Error('The #scene canvas is missing from index.html');

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

const optionsStorage = safeLocalStorage();
const prefersReducedMotion =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const atmosphereSettings = loadAtmosphereSettings(optionsStorage, prefersReducedMotion);

let activeAssetDocument: AssetDocument | undefined;
let assetDocumentLoadError = '';
try {
  activeAssetDocument = readStoredAssetDocument();
  if (activeAssetDocument) installAssetDocumentOverride(activeAssetDocument);
} catch (error) {
  assetDocumentLoadError =
    error instanceof Error ? error.message : 'The saved asset file is invalid.';
}

const scene = new Scene();
scene.background = new Color('#a9a488');
scene.fog = new Fog('#a9a488', 175, 390);

const camera = new PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
const gl = renderer.getContext() as WebGL2RenderingContext;
const gpuTimer = gl.getExtension('EXT_disjoint_timer_query_webgl2') as {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
} | null;
const pendingGpuQueries: WebGLQuery[] = [];
const gpuFrameTimes = new PerformanceWindow();
const frameIntervals = new PerformanceWindow();
const jsFrameTimes = new PerformanceWindow();
const simulationFrameTimes = new PerformanceWindow();
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = 'srgb';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.info.autoReset = false;

const skyLight = new AmbientLight('#ded9bd', 1.15);
scene.add(skyLight);
const fillLight = new AmbientLight('#75856a', 0.52);
scene.add(fillLight);
const sun = new DirectionalLight('#fff0cc', 2.15);
sun.position.set(-82, 112, 48);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -155;
sun.shadow.camera.right = 155;
sun.shadow.camera.top = 155;
sun.shadow.camera.bottom = -155;
sun.shadow.bias = -0.00025;
sun.target.position.set(0, 0, 0);
scene.add(sun, sun.target);
const volumetricFogPass = new VolumetricFogPass(scene, camera, sun);
const composer = new EffectComposer(renderer);
composer.renderTarget1.depthTexture = new DepthTexture(
  renderer.domElement.width,
  renderer.domElement.height,
);
composer.renderTarget2.depthTexture = new DepthTexture(
  renderer.domElement.width,
  renderer.domElement.height,
);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(volumetricFogPass);
composer.addPass(new OutputPass());
const audioFeedback = new AudioFeedback();
const atmosphereRuntime = new AtmosphereRuntime(
  scene,
  skyLight,
  fillLight,
  sun,
  () => audioFeedback.play('thunder'),
  (exposure) => {
    renderer.toneMappingExposure = exposure;
  },
  volumetricFogPass,
);
const particleBursts = new ParticleBursts(scene);

const elements = {
  seedForm: document.querySelector<HTMLFormElement>('#seed-form'),
  seedInput: document.querySelector<HTMLInputElement>('#seed-input'),
  seedHint: document.querySelector<HTMLElement>('#seed-hint'),
  settingsButton: document.querySelector<HTMLButtonElement>('#settings-button'),
  settingsOverlay: document.querySelector<HTMLElement>('#settings-overlay'),
  settingsClose: document.querySelector<HTMLButtonElement>('#settings-close'),
  settingsNote: document.querySelector<HTMLElement>('#settings-note'),
  timePreference: document.querySelector<HTMLSelectElement>('#time-preference'),
  weatherPreference: document.querySelector<HTMLSelectElement>('#weather-preference'),
  reduceMotion: document.querySelector<HTMLInputElement>('#reduce-motion'),
  reduceFlashes: document.querySelector<HTMLInputElement>('#reduce-flashes'),
  rainVisuals: document.querySelector<HTMLInputElement>('#rain-visuals'),
  audioCues: document.querySelector<HTMLInputElement>('#audio-cues'),
  shakeIntensity: document.querySelector<HTMLInputElement>('#shake-intensity'),
  shakeValue: document.querySelector<HTMLOutputElement>('#shake-value'),
  modeName: document.querySelector<HTMLElement>('#view-name'),
  fpsValue: document.querySelector<HTMLElement>('#fps-value'),
  frameValue: document.querySelector<HTMLElement>('#frame-value'),
  cpuFrameValue: document.querySelector<HTMLElement>('#cpu-frame-value'),
  simulationValue: document.querySelector<HTMLElement>('#simulation-value'),
  renderValue: document.querySelector<HTMLElement>('#render-value'),
  gpuValue: document.querySelector<HTMLElement>('#gpu-value'),
  memoryValue: document.querySelector<HTMLElement>('#memory-value'),
  resolutionValue: document.querySelector<HTMLElement>('#resolution-value'),
  effectsValue: document.querySelector<HTMLElement>('#effects-value'),
  entityValue: document.querySelector<HTMLElement>('#entity-value'),
  navigationValue: document.querySelector<HTMLElement>('#navigation-value'),
  routeValue: document.querySelector<HTMLElement>('#route-value'),
  diagSeed: document.querySelector<HTMLElement>('#diag-seed'),
  controlsContent: document.querySelector<HTMLElement>('#controls-content'),
  hostileCount: document.querySelector<HTMLElement>('#hostile-count'),
  atmosphereStatus: document.querySelector<HTMLElement>('#atmosphere-status'),
  healthPercent: document.querySelector<HTMLElement>('#health-percent'),
  healthRing: document.querySelector<SVGCircleElement>('#health-ring'),
  combatMessage: document.querySelector<HTMLElement>('#combat-message'),
  abilityBar: document.querySelector<HTMLElement>('#ability-bar'),
  reticle: document.querySelector<HTMLElement>('#aim-reticle'),
  deathOverlay: document.querySelector<HTMLElement>('#death-overlay'),
  deathMessage: document.querySelector<HTMLElement>('#death-message'),
  resultEyebrow: document.querySelector<HTMLElement>('#result-eyebrow'),
  resultTitle: document.querySelector<HTMLElement>('#result-title'),
  restartButton: document.querySelector<HTMLButtonElement>('#restart-button'),
  runClock: document.querySelector<HTMLElement>('#run-clock'),
  cargoValue: document.querySelector<HTMLElement>('#cargo-value'),
  cargoBreakdown: document.querySelector<HTMLElement>('#cargo-breakdown'),
  nearbyAction: document.querySelector<HTMLElement>('#nearby-action'),
  extractionGuide: document.querySelector<HTMLElement>('#extraction-guide'),
  guideArrow: document.querySelector<HTMLElement>('#guide-arrow'),
  guideDistance: document.querySelector<HTMLElement>('#guide-distance'),
  guideAction: document.querySelector<HTMLElement>('#guide-action'),
  baseOverlay: document.querySelector<HTMLElement>('#base-overlay'),
  baseCloseButton: document.querySelector<HTMLButtonElement>('#base-close-button'),
  baseMessage: document.querySelector<HTMLElement>('#base-message'),
  baseTitle: document.querySelector<HTMLElement>('#base-title'),
  baseKicker: document.querySelector<HTMLElement>('#base-kicker'),
  baseFootnote: document.querySelector<HTMLElement>('#base-footnote'),
  runCount: document.querySelector<HTMLElement>('#run-count'),
  bankGear: document.querySelector<HTMLElement>('#bank-gear'),
  bankSupplies: document.querySelector<HTMLElement>('#bank-supplies'),
  bankMoney: document.querySelector<HTMLElement>('#bank-money'),
  bankFuel: document.querySelector<HTMLElement>('#bank-fuel'),
  storageGear: document.querySelector<HTMLElement>('#storage-gear'),
  storageSupplies: document.querySelector<HTMLElement>('#storage-supplies'),
  storageMoney: document.querySelector<HTMLElement>('#storage-money'),
  storageFuel: document.querySelector<HTMLElement>('#storage-fuel'),
  harnessStatus: document.querySelector<HTMLElement>('#harness-status'),
  buySuppliesButton: document.querySelector<HTMLButtonElement>('#buy-supplies-button'),
  buyGearButton: document.querySelector<HTMLButtonElement>('#buy-gear-button'),
  sellSuppliesButton: document.querySelector<HTMLButtonElement>('#sell-supplies-button'),
  sellGearButton: document.querySelector<HTMLButtonElement>('#sell-gear-button'),
  buyCargoButton: document.querySelector<HTMLButtonElement>('#buy-cargo-button'),
  startRunButton: document.querySelector<HTMLButtonElement>('#start-run-button'),
  zoneStatus: document.querySelector<HTMLElement>('#zone-status'),
  openHordeLab: document.querySelector<HTMLButtonElement>('#open-horde-lab'),
  hordeLabToggle: document.querySelector<HTMLButtonElement>('#horde-lab-toggle'),
  hordeLab: document.querySelector<HTMLElement>('#horde-lab'),
  hordeLabClose: document.querySelector<HTMLButtonElement>('#horde-lab-close'),
  hordeCount: document.querySelector<HTMLSelectElement>('#horde-count'),
  hordeSeed: document.querySelector<HTMLInputElement>('#horde-seed'),
  hordePattern: document.querySelector<HTMLSelectElement>('#horde-pattern'),
  hordeCamera: document.querySelector<HTMLSelectElement>('#horde-camera'),
  hordeStart: document.querySelector<HTMLButtonElement>('#horde-start'),
  hordeStop: document.querySelector<HTMLButtonElement>('#horde-stop'),
  hordeBenchmark: document.querySelector<HTMLButtonElement>('#horde-benchmark'),
  hordeStatus: document.querySelector<HTMLElement>('#horde-status'),
  hordeLiveStats: document.querySelector<HTMLElement>('#horde-live-stats'),
  hordeBenchmarkResults: document.querySelector<HTMLElement>('#horde-benchmark-results'),
  hordeActiveTools: document.querySelector<HTMLElement>('#horde-active-tools'),
  hordeReopenLab: document.querySelector<HTMLButtonElement>('#horde-reopen-lab'),
  hordeQuickStop: document.querySelector<HTMLButtonElement>('#horde-quick-stop'),
};

for (const [key, element] of Object.entries(elements)) {
  if (!element) throw new Error(`Missing game UI element: ${key}`);
}

let world: WorldData = generateWorld(elements.seedInput!.value);
let currentRunAtmosphere: RunAtmosphere = resolveRunAtmosphere(world.seed, atmosphereSettings);
let worldGroup = buildWorld(world);
scene.add(worldGroup);
worldGroup.visible = false;
const campWorld = createCampWorld();
const campGroup = buildCamp();
scene.add(campGroup);
const campChopperRotor = campGroup.getObjectByName('Camp helicopter main rotor');
const campChopperTailRotor = campGroup.getObjectByName('Camp helicopter tail rotor');
const campNavigator = new GridNavigator(campWorld);
let fieldNavigator = new GridNavigator(world);
let navigator = campNavigator;
// Player routes add moving-hostile blockers; pursuit paths need their own static grid.
let combatNavigator = new GridNavigator(world);
let combat = new CombatSimulation(world, combatNavigator);
let zombieGroup = new Group();
zombieGroup.name = 'Hostiles';
scene.add(zombieGroup);
const zombieViews = new Map<string, Group>();
let cameraRig = new CameraRig(camera, canvas, world);
let player!: PlayerController;

type GamePhase =
  'base' | 'arrival' | 'disembarking' | 'active' | 'extracting' | 'takeoff' | 'result';
type CampMenuMode = 'terminal' | 'quartermaster' | 'storage' | 'operations';
type InteractiveKind =
  | 'cache'
  | 'drop'
  | 'extraction'
  | 'building-door'
  | 'camp-shop'
  | 'camp-storage'
  | 'camp-operations'
  | 'camp-departure';

interface InteractiveView {
  id: string;
  kind: InteractiveKind;
  x: number;
  z: number;
  object: Object3D;
  cache?: CacheSite;
  drop?: LootDrop;
  entrance?: BuildingEntrance;
}

interface NavigationTask {
  x: number;
  z: number;
  range: number;
  interactionId?: string;
  stuckReplans: number;
}

interface InteriorSession {
  entrance: BuildingEntrance;
  layout: InteriorLayout;
  world: WorldData;
  navigator: GridNavigator;
  group: Group;
  lootGroup: Group;
  views: Map<string, InteractiveView>;
  returnPosition: Vector3;
  outdoorNavigator: GridNavigator;
  outdoorCombatNavigator: GridNavigator;
  outdoorHostiles: ZombieState[];
  outdoorZombieGroup: Group;
  outdoorZombieViews: Map<string, Group>;
}

interface CampInteriorSession {
  entrance: BuildingEntrance;
  layout: InteriorLayout;
  world: WorldData;
  navigator: GridNavigator;
  group: Group;
  views: Map<string, InteractiveView>;
  returnPosition: Vector3;
}

let gamePhase: GamePhase = 'base';
let stressActive = false;
let hordeSimulation: HordeSimulation | undefined;
let hordeVisual: InstancedMesh | undefined;
let hordeInstance = new Object3D();
let hordeRenderTier = new Uint8Array();
const changedMatrixIndices: number[] = [];
const changedColorIndices: number[] = [];
const hordeTierColors = [0xb98155, 0x9b9a65, 0x71806a];
let hordeSyncMs = 0;
let hordeSyncCount = 0;
let saveData: SaveData = loadSave();
let cargo = emptyInventory();
let runElapsed = 0;
let arrivalElapsed = 0;
let hoverElapsed = 0;
let disembarkElapsed = 0;
let extractingRemaining = 0;
let takeoffElapsed = 0;
const rappelDuration = 0.9;
const extractionApproachDuration = 0.55;
const extractionHoistDuration = 0.95;
const extractionDepartureDuration = 1.1;
let reinforcementIndex = 0;
let waveWarningShown = false;
let runLootCollected = 0;
let nearbyRefresh = 0;
let lootGroup = new Group();
lootGroup.name = 'Run loot';
scene.add(lootGroup);
const interactiveViews = new Map<string, InteractiveView>();
const campInteractiveViews = new Map<string, InteractiveView>();
let interiorSession: InteriorSession | undefined;
let campInteriorSession: CampInteriorSession | undefined;
const interiorHostiles = new Map<string, ZombieState[]>();
const interiorLootRemaining = new Map<string, number>();
let cacheSites: CacheSite[] = [];
let openedCacheIds = new Set<string>();
let lootDrops: LootDrop[] = [];
let chopper: Group | undefined;
let chopperRotor: Group | undefined;
let chopperTailRotor: Group | undefined;
let extractionMarker: Group | undefined;
let extractionGuideArrow: ArrowHelper | undefined;
const extractionPoint = new Vector3();
const disembarkStart = new Vector3();
const disembarkEnd = new Vector3();
const extractionHelicopterStart = new Vector3();
const extractionHelicopterTarget = new Vector3();
const extractionPlayerStart = new Vector3();
const extractionGroundPosition = new Vector3();
const cameraFollowTarget = new Vector3();
let rappelRope: Mesh | undefined;
const resourceNames: Record<ResourceKind, string> = {
  gear: 'gear',
  supplies: 'supplies',
  money: 'credits',
  fuel: 'fuel',
};

interface TimedEffect {
  object: Object3D;
  remaining: number;
  duration?: number;
  onUpdate?: (progress: number) => void;
  onExpire?: () => void;
}
const timedEffects: TimedEffect[] = [];
interface ActiveTurret {
  object: Group;
  gun: Group;
  x: number;
  z: number;
  activeRemaining: number;
  fireRemaining: number;
  collapseRemaining?: number;
}
interface GrenadeProjectile {
  object: Mesh;
  start: Vector3;
  target: Vector3;
  elapsed: number;
  duration: number;
}
const activeTurrets: ActiveTurret[] = [];
const grenadeProjectiles: GrenadeProjectile[] = [];
let grenadeCount = 3;
let grenadeCooldownRemaining = 0;
let turretPreview: Group | undefined;
let turretRangeMarker: Mesh | undefined;
let turretPreviewPoint: Vector3 | undefined;
let turretPreviewValid = false;
const turretPlacementRadius = 18;
const turretAttackRadius = 10;
const artilleryRadius = 7;
const grenadeBlastRadius = 4.2;
let routeLine: Line | undefined;
let dragPointerId: number | undefined;
let pointerStart: { id: number; x: number; y: number } | undefined;
let wasAlive = combat.alive;
let lastFeedbackHealth = 100;
let feedbackTimeout = 0;
let optionsReturnFocus: HTMLElement | null = null;
let lastUiTime = 0;
let routeRefresh = 0;
let hoverRefresh = 0;
let navigationTask: NavigationTask | undefined;
let navigationStatus = 'IDLE';
let navigationRequestMs = 0;
let navigationRequestMaxMs = 0;
let navigationRequestCount = 0;
let dynamicNavigationRefresh = 0;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let suppressPlacementContextMenu = false;
let observedDash = false;
let autoAttackTargetId: string | undefined;
const enemyAimAssistRadius = 44;

function updateModeUi(): void {
  const label = cameraRig.mode === 'third-person' ? 'THIRD PERSON' : 'TOP-DOWN';
  elements.modeName!.textContent = label;
  document.querySelector('#game')?.classList.toggle('is-top-down', cameraRig.mode === 'top-down');
  renderControls();
}

function updateAtmosphereStatus(): void {
  let status: string;
  if (gamePhase === 'base' || campInteriorSession) {
    status = 'CAMP · CLEAR';
  } else {
    const time = currentRunAtmosphere.time === 'low-sun' ? 'LOW SUN' : 'HIGH MOON';
    const weather = currentRunAtmosphere.weather.toUpperCase();
    status = `${time} · ${weather}`;
  }
  if (elements.atmosphereStatus!.textContent !== status)
    elements.atmosphereStatus!.textContent = status;
}

function applyAccessibilityOptions(): void {
  const game = document.querySelector('#game');
  game?.classList.toggle('reduce-motion', atmosphereSettings.reduceMotion);
  game?.classList.toggle('reduce-flashes', atmosphereSettings.reduceFlashes);
  audioFeedback.setOptions(atmosphereSettings.audioCues, atmosphereRuntime.weather);
}

function settingsStatusText(): string {
  const time = currentRunAtmosphere.time === 'low-sun' ? 'Low sun' : 'High moon';
  const weather =
    currentRunAtmosphere.weather[0]!.toUpperCase() + currentRunAtmosphere.weather.slice(1);
  return gamePhase === 'base' && !stressActive
    ? 'Lighting and weather selections apply to your next deployment.'
    : `Current run stays ${time} · ${weather}. Lighting changes apply next deployment.`;
}

function persistAtmosphereSettings(): void {
  const saved = saveAtmosphereSettings(atmosphereSettings, optionsStorage);
  elements.settingsNote!.textContent = saved
    ? settingsStatusText()
    : 'Options apply for this session; browser storage is unavailable.';
}

function updateSettingsControls(): void {
  elements.timePreference!.value = atmosphereSettings.time;
  elements.weatherPreference!.value = atmosphereSettings.weather;
  elements.reduceMotion!.checked = atmosphereSettings.reduceMotion;
  elements.reduceFlashes!.checked = atmosphereSettings.reduceFlashes;
  elements.rainVisuals!.checked = atmosphereSettings.rainVisuals;
  elements.audioCues!.checked = atmosphereSettings.audioCues;
  elements.shakeIntensity!.value = String(Math.round(atmosphereSettings.shakeIntensity * 100));
  elements.shakeValue!.value = `${Math.round(atmosphereSettings.shakeIntensity * 100)}%`;
  elements.settingsNote!.textContent = settingsStatusText();
}

function applyRunAtmosphere(seed: string): void {
  currentRunAtmosphere = resolveRunAtmosphere(seed, atmosphereSettings);
  atmosphereRuntime.setRun(currentRunAtmosphere, seed, world);
  audioFeedback.setOptions(atmosphereSettings.audioCues, currentRunAtmosphere.weather);
  updateAtmosphereStatus();
  updateSettingsControls();
}

function setCampAtmosphere(): void {
  atmosphereRuntime.setCamp();
  audioFeedback.setOptions(atmosphereSettings.audioCues, 'clear');
  updateAtmosphereStatus();
  updateSettingsControls();
}

function openAtmosphereOptions(): void {
  optionsReturnFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  updateSettingsControls();
  elements.settingsOverlay!.removeAttribute('hidden');
  elements.settingsClose!.focus();
}

function closeAtmosphereOptions(): void {
  elements.settingsOverlay!.setAttribute('hidden', '');
  (optionsReturnFocus ?? elements.settingsButton!).focus();
  optionsReturnFocus = null;
}

function flashDamageFeedback(): void {
  if (!atmosphereSettings.reduceFlashes) {
    const game = document.querySelector('#game');
    game?.classList.remove('damage-flash');
    void game?.clientWidth;
    game?.classList.add('damage-flash');
    window.clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => game?.classList.remove('damage-flash'), 340);
  }
  if (!atmosphereSettings.reduceMotion && atmosphereSettings.shakeIntensity > 0) {
    cameraRig.kickShake(0.08 * atmosphereSettings.shakeIntensity, 0.28);
  }
  audioFeedback.play('damage');
}

function switchView(): void {
  if (gamePhase !== 'active' && gamePhase !== 'base' && !stressActive) return;
  cameraRig.switchMode(player.position);
  elements.hordeCamera!.value = cameraRig.mode;
  autoAttackTargetId = undefined;
  player.clearKeyboardMovement();
  if (cameraRig.mode !== 'third-person') releaseLookDrag();
  canvas?.focus({ preventScroll: true });
  updateModeUi();
  if (cameraRig.mode === 'top-down' && navigationTask) replanNavigationTask();
  else updateRouteLine(true);
  if (cameraRig.mode === 'top-down') updateTopDownDashAim(pointerX, pointerY);
}

function releaseMouseCapture(): void {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
}

function releaseLookDrag(): void {
  const capturedPointer = dragPointerId ?? pointerStart?.id;
  if (capturedPointer === undefined) return;
  if (canvas!.hasPointerCapture(capturedPointer)) canvas!.releasePointerCapture(capturedPointer);
  dragPointerId = undefined;
  document.querySelector('#game')?.classList.remove('is-look-dragging');
}

function row(keys: string, action: string): string {
  const keycaps = keys
    .split('|')
    .map((key) => `<kbd class="wide-key">${key}</kbd>`)
    .join('');
  return `<div class="control-row"><span class="key-group">${keycaps}</span><span>${action}</span></div>`;
}

function renderControls(): void {
  const rows =
    gamePhase === 'base'
      ? cameraRig.mode === 'third-person'
        ? [
            row('W A S D', 'Walk around camp'),
            row('DRAG', 'Look around'),
            row('F', 'Use nearby service / door'),
            row('M', 'Open camp terminal'),
            row('TAB', 'Switch camera'),
          ]
        : [
            row('RMB', 'Click to move'),
            row('ESC', 'Cancel route'),
            row('F', 'Use nearby service / door'),
            row('M', 'Open camp terminal'),
            row('TAB', 'Switch camera'),
          ]
      : cameraRig.mode === 'third-person'
        ? [
            row('W A S D', 'Move · camera-relative'),
            row('DRAG', 'Look / aim'),
            row('LMB', 'Fire rifle'),
            row(
              'Q',
              `Dash${combat.dashCooldownRemaining > 0 ? ` · ${combat.dashCooldownRemaining.toFixed(1)}s` : ''}`,
            ),
            row('1', 'Hold to preview · release to place · mouse click cancels'),
            row('2', 'Call artillery at cursor'),
            row('3', 'Adrenaline'),
            row('G', `Throw grenade · ${grenadeCount} carried`),
            row('X', 'Use carried supply'),
            row('F', 'Interact / enter / exit'),
            row('TAB', 'Switch camera'),
          ]
        : [
            row('RMB', 'Click to move'),
            row('ESC', 'Cancel route'),
            row('LMB', 'Fire at cursor'),
            row(
              'Q',
              `Dash${combat.dashCooldownRemaining > 0 ? ` · ${combat.dashCooldownRemaining.toFixed(1)}s` : ''}`,
            ),
            row('W', 'Hold to preview · release to place · mouse click cancels'),
            row('E', 'Call artillery at cursor'),
            row('R', 'Adrenaline'),
            row('G', `Throw grenade · ${grenadeCount} carried`),
            row('X', 'Use carried supply'),
            row('F', 'Interact / enter / exit'),
            row('TAB', 'Switch camera'),
          ];
  elements.controlsContent!.innerHTML = rows.join('');
}

function updateActionHud(healthPercent: number): void {
  const health = Math.max(0, Math.min(100, healthPercent));
  const circumference = 2 * Math.PI * 31;
  elements.healthPercent!.textContent = `${Math.round(health)}%`;
  elements.healthRing!.style.strokeDasharray = String(circumference);
  elements.healthRing!.style.strokeDashoffset = String(circumference * (1 - health / 100));
  elements.healthRing!.style.stroke = health < 30 ? '#ee574d' : '#d9473d';
  elements.healthPercent!.parentElement!.setAttribute(
    'aria-label',
    `Health ${Math.round(health)} percent`,
  );

  const slots = [1, 2, 3] as const;
  const labels = cameraRig.mode === 'top-down' ? ['W', 'E', 'R'] : ['1', '2', '3'];
  const abilities = [
    { key: 'Q', symbol: '➤', name: 'Dash', cooldown: combat.dashCooldownRemaining },
    {
      key: labels[0]!,
      symbol: '▥',
      name: 'Turret',
      cooldown: combat.abilityCooldownsRemaining[slots[0]],
    },
    {
      key: labels[1]!,
      symbol: '✹',
      name: 'Artillery',
      cooldown: combat.abilityCooldownsRemaining[slots[1]],
    },
    {
      key: labels[2]!,
      symbol: 'ϟ',
      name: 'Adrenaline',
      cooldown: combat.abilityCooldownsRemaining[slots[2]],
    },
    {
      key: 'G',
      symbol: '●',
      name: `Grenade · ${grenadeCount} remaining`,
      cooldown: grenadeCooldownRemaining,
    },
  ];
  elements.abilityBar!.innerHTML = abilities
    .map(({ key, symbol, name, cooldown }) => {
      const cooling = cooldown > 0;
      const unavailable =
        !cooling && (gamePhase !== 'active' || !combat.alive || (key === 'G' && grenadeCount <= 0));
      return `<div class="ability-tile${cooling ? ' cooling' : ''}${unavailable ? ' unavailable' : ''}" aria-label="${name} · ${key}${cooling ? ` · ${cooldown.toFixed(1)} seconds` : ''}" title="${name}">
        <span class="ability-key">${key}</span><span class="ability-symbol" aria-hidden="true">${symbol}</span>
        ${cooling ? `<span class="ability-cooldown" aria-hidden="true">${cooldown.toFixed(1)}</span>` : ''}
        ${key === 'G' ? `<span class="ability-count" aria-hidden="true">${grenadeCount}</span>` : ''}
      </div>`;
    })
    .join('');
}

function updateCombatUi(): void {
  updateAtmosphereStatus();
  if (stressActive && hordeSimulation) {
    const health = Math.ceil(hordeSimulation.playerHealth);
    elements.hostileCount!.textContent = `${hordeSimulation.livingCount} / ${hordeSimulation.count}`;
    updateActionHud(health);
    elements.combatMessage!.textContent = 'Horde stress scene running.';
    return;
  }
  if (gamePhase === 'base') {
    const hudHeading = document.querySelector('.combat-hud-top span');
    const threatLabel = document.querySelector('.combat-hud .field-line span');
    const stockLabel = document.querySelector('.cargo-line span');
    const controlsHeading = document.querySelector('.controls-card .card-heading span');
    if (hudHeading) hudHeading.textContent = 'CAMP STATUS';
    if (threatLabel) threatLabel.textContent = 'THREAT';
    if (stockLabel) stockLabel.textContent = 'CAMP STOCK';
    if (controlsHeading) controlsHeading.textContent = 'CAMP CONTROLS';
    elements.hostileCount!.textContent = 'SAFE';
    updateActionHud((combat.health / combat.maxHealth) * 100);
    elements.combatMessage!.textContent = campInteriorSession
      ? 'Safe-zone building · find the lit marker to return outside.'
      : 'Wayfarer Camp · move between services, or open the camp terminal with M.';
    elements.runClock!.textContent = 'CAMP';
    elements.cargoValue!.textContent = `${saveData.base.gear} G / ${saveData.base.supplies} S`;
    elements.cargoBreakdown!.textContent = `CR ${saveData.base.money} · FUEL ${saveData.base.fuel}`;
    updateNearbyAction();
    return;
  }
  const healthPercent = Math.max(0, Math.min(100, (combat.health / combat.maxHealth) * 100));
  const hudHeading = document.querySelector('.combat-hud-top span');
  const threatLabel = document.querySelector('.combat-hud .field-line span');
  const stockLabel = document.querySelector('.cargo-line span');
  const controlsHeading = document.querySelector('.controls-card .card-heading span');
  if (hudHeading) hudHeading.textContent = 'FIELD STATUS';
  if (threatLabel) threatLabel.textContent = 'HOSTILES';
  if (stockLabel) stockLabel.textContent = 'CARRIED / CAPACITY';
  if (controlsHeading) controlsHeading.textContent = 'FIELD CONTROLS';
  elements.hostileCount!.textContent = String(combat.livingZombieCount);
  updateActionHud(healthPercent);
  elements.combatMessage!.textContent = combat.lastMessage;
  elements.runClock!.textContent = `${String(Math.floor(runElapsed / 60)).padStart(2, '0')}:${String(Math.floor(runElapsed % 60)).padStart(2, '0')}`;
  elements.runClock!.classList.toggle(
    'pressure-warning',
    gamePhase === 'active' && reinforcementIndex < 2 && runElapsed >= [50, 110][reinforcementIndex],
  );
  const capacity = cargoCapacity(saveData);
  elements.cargoValue!.textContent = `${cargoWeight(cargo)} / ${capacity}`;
  elements.cargoBreakdown!.textContent = `GEAR ${cargo.gear} · SUP ${cargo.supplies} · GRENADES ${grenadeCount} · CR ${cargo.money} · FUEL ${cargo.fuel}`;
  if (!combat.alive) elements.deathMessage!.textContent = combat.lastMessage;
}

function updateBaseUi(): void {
  document.querySelector('#game')?.classList.toggle('is-base', gamePhase === 'base');
  elements.bankGear!.textContent = String(saveData.base.gear);
  elements.bankSupplies!.textContent = String(saveData.base.supplies);
  elements.bankMoney!.textContent = String(saveData.base.money);
  elements.bankFuel!.textContent = String(saveData.base.fuel);
  elements.storageGear!.textContent = String(saveData.base.gear);
  elements.storageSupplies!.textContent = String(saveData.base.supplies);
  elements.storageMoney!.textContent = String(saveData.base.money);
  elements.storageFuel!.textContent = String(saveData.base.fuel);
  elements.runCount!.textContent = String(saveData.completedRuns);
  elements.harnessStatus!.textContent = saveData.cargoUpgrade
    ? `Cargo capacity: ${cargoCapacity(saveData)} units · upgraded`
    : `Cargo capacity: ${cargoCapacity(saveData)} units`;
  elements.buySuppliesButton!.disabled = saveData.base.money < campPrices.supplies;
  elements.buyGearButton!.disabled = saveData.base.money < campPrices.gear;
  elements.sellSuppliesButton!.disabled = saveData.base.supplies < 1 || saveData.base.money >= 9999;
  elements.sellGearButton!.disabled = saveData.base.gear < 1 || saveData.base.money >= 9999;
  elements.buyCargoButton!.disabled =
    saveData.cargoUpgrade || saveData.base.money < campPrices.cargoUpgrade;
  elements.buyCargoButton!.innerHTML = saveData.cargoUpgrade
    ? 'CARGO HARNESS INSTALLED <span>✓</span>'
    : 'UPGRADE CARGO HARNESS <span>90 CR</span>';
  elements.zoneStatus!.textContent = gamePhase === 'base' ? 'BASE' : 'ENGAGED';
}

function updateExtractionGuide(): void {
  const deltaX = extractionPoint.x - player.position.x;
  const deltaZ = extractionPoint.z - player.position.z;
  const distance = Math.hypot(deltaX, deltaZ);
  elements.guideDistance!.textContent = `${Math.round(distance)} m`;
  const sin = Math.sin(cameraRig.yaw);
  const cos = Math.cos(cameraRig.yaw);
  const screenRight = deltaX * cos + deltaZ * sin;
  const screenUp = deltaX * sin - deltaZ * cos;
  elements.guideArrow!.style.transform = `rotate(${Math.atan2(screenRight, screenUp) * (180 / Math.PI)}deg)`;
  if (extractionGuideArrow) {
    const direction = new Vector3(deltaX, 0, deltaZ);
    if (direction.lengthSq() > 0.001) extractionGuideArrow.setDirection(direction.normalize());
    extractionGuideArrow.position.set(
      player.position.x,
      player.position.y + 2.5,
      player.position.z,
    );
  }
  elements.guideAction!.textContent =
    distance < 6
      ? gamePhase === 'extracting'
        ? 'BOARDING…'
        : runLootCollected > 0
          ? 'F TO BOARD'
          : 'SCAVENGE FIRST'
      : 'RETURN TO CHOPPER';
}

function clearRoute(): void {
  if (!routeLine) return;
  scene.remove(routeLine);
  disposeTree(routeLine);
  routeLine = undefined;
}

function updateRouteLine(force = false): void {
  if (cameraRig.mode !== 'top-down' || player.navigationPath.length === 0) {
    clearRoute();
    return;
  }
  if (!force && routeRefresh < 0.12) return;
  routeRefresh = 0;
  const points = [player.position, ...player.navigationPath].map(
    (point) => new Vector3(point.x, player.terrainHeight(point.x, point.z) + 0.16, point.z),
  );
  if (points.length < 2) {
    clearRoute();
    return;
  }
  const geometry = new BufferGeometry().setFromPoints(points);
  if (routeLine) {
    routeLine.geometry.dispose();
    routeLine.geometry = geometry;
    return;
  }
  routeLine = new Line(
    geometry,
    new LineBasicMaterial({ color: '#e5c77d', transparent: true, opacity: 0.75 }),
  );
  routeLine.name = 'Player destination route';
  routeLine.frustumCulled = false;
  scene.add(routeLine);
}

function resetCampCamera(): void {
  cameraRig.reset(player.position);
  cameraRig.pitch = 0.42;
  cameraRig.snapTo(player.position);
}

function setSeed(seed: string): void {
  if (gamePhase !== 'base' || stressActive) {
    elements.seedHint!.textContent = 'Return to camp before changing the world seed.';
    return;
  }
  if (campInteriorSession) leaveCampBuilding();
  clearRunScene();
  const trimmed = seed.trim().slice(0, 32) || 'RAVEN-07';
  elements.seedInput!.value = trimmed;
  const previous = worldGroup;
  scene.remove(previous);
  disposeTree(previous);
  clearRoute();

  world = generateWorld(trimmed);
  worldGroup = buildWorld(world);
  worldGroup.visible = false;
  scene.add(worldGroup);
  fieldNavigator = new GridNavigator(world);
  combatNavigator = new GridNavigator(world);
  navigator = campNavigator;
  combat = new CombatSimulation(world, combatNavigator);
  navigationTask = undefined;
  setNavigationStatus('IDLE');
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  player.setWorld(campWorld, () => 0);
  player.setEnabled(elements.baseOverlay!.hasAttribute('hidden'));
  player.setPosition(campWorld.spawn.x, campWorld.spawn.z);
  campGroup.visible = true;
  setCampAtmosphere();
  cameraRig.setWorld(campWorld);
  resetCampCamera();
  createZombieViews();
  zombieGroup.visible = false;
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.seedHint!.textContent =
    'Field map regenerated. Camp storage and upgrades are unchanged.';
  elements.diagSeed!.textContent = world.seed;
  elements.entityValue!.textContent = String(world.objectCount + combat.livingZombieCount + 1);
  updateModeUi();
  updateBaseUi();
  releaseLookDrag();
  releaseMouseCapture();
  canvas?.focus({ preventScroll: true });
  updateCombatUi();
}

function setCampContext(position = campWorld.spawn, resetCamera = true): void {
  campGroup.visible = true;
  player.visual.visible = true;
  worldGroup.visible = false;
  setCampAtmosphere();
  if (zombieGroup) zombieGroup.visible = false;
  navigator = campNavigator;
  player.setWorld(campWorld, () => 0);
  player.setPosition(position.x, position.z);
  player.setEnabled(elements.baseOverlay!.hasAttribute('hidden'));
  cameraRig.setWorld(campWorld);
  if (resetCamera) resetCampCamera();
  else cameraRig.snapTo(player.position);
  navigationTask = undefined;
  clearRoute();
  setNavigationStatus('IDLE');
  document.querySelector('#game')?.classList.add('is-base');
  const mapName = document.querySelector('.map-label strong');
  if (mapName) mapName.textContent = 'Wayfarer Camp';
  updateModeUi();
  updateCombatUi();
  updateBaseUi();
}

function disposeTree(root: Object3D): void {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  root.traverse((object) => {
    if ('geometry' in object && object.geometry) geometries.add(object.geometry as BufferGeometry);
    if ('material' in object && object.material) {
      const assigned = object.material as Material | Material[];
      for (const material of Array.isArray(assigned) ? assigned : [assigned])
        materials.add(material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function createZombieViews(): void {
  scene.remove(zombieGroup);
  disposeTree(zombieGroup);
  zombieViews.clear();
  zombieGroup = new Group();
  zombieGroup.name = 'Hostiles';
  for (const zombie of combat.zombies) {
    const visual = createZombieVisual(zombie);
    zombieViews.set(zombie.id, visual);
    zombieGroup.add(visual);
  }
  scene.add(zombieGroup);
}

function beginGpuFrameQuery(): WebGLQuery | undefined {
  if (!gpuTimer || pendingGpuQueries.length >= 4) return undefined;
  const query = gl.createQuery();
  if (!query) return undefined;
  gl.beginQuery(gpuTimer.TIME_ELAPSED_EXT, query);
  return query;
}

function finishGpuFrameQuery(query: WebGLQuery | undefined): void {
  if (!query || !gpuTimer) return;
  gl.endQuery(gpuTimer.TIME_ELAPSED_EXT);
  pendingGpuQueries.push(query);
}

function pollGpuFrameQueries(): void {
  if (!gpuTimer) return;
  const disjoint = Boolean(gl.getParameter(gpuTimer.GPU_DISJOINT_EXT));
  for (let index = pendingGpuQueries.length - 1; index >= 0; index -= 1) {
    const query = pendingGpuQueries[index]!;
    if (!gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) continue;
    if (!disjoint) {
      const nanoseconds = Number(gl.getQueryParameter(query, gl.QUERY_RESULT));
      if (Number.isFinite(nanoseconds)) gpuFrameTimes.add(nanoseconds / 1_000_000);
    }
    gl.deleteQuery(query);
    pendingGpuQueries.splice(index, 1);
  }
}

function updateRenderDiagnosticsUi(): void {
  const info = renderer.info;
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  const heap = memory ? `${(memory.usedJSHeapSize / 1_048_576).toFixed(0)} MB` : 'N/A';
  const gpu = !gpuTimer
    ? 'N/A'
    : gpuFrameTimes.count === 0
      ? 'warming'
      : `${gpuFrameTimes.percentile95().toFixed(2)} ms`;
  elements.cpuFrameValue!.innerHTML = `${jsFrameTimes.percentile95().toFixed(2)} <small>MS</small>`;
  elements.simulationValue!.innerHTML = `${simulationFrameTimes.average().toFixed(2)} <small>MS</small>`;
  elements.renderValue!.textContent = `${info.render.calls} / ${info.render.triangles.toLocaleString()}`;
  elements.gpuValue!.textContent = gpu;
  elements.memoryValue!.textContent = `${heap} · ${info.memory.geometries}g / ${info.memory.textures}t`;
  elements.resolutionValue!.textContent = `${renderer.domElement.width}×${renderer.domElement.height} @${renderer.getPixelRatio().toFixed(2)}x`;
  elements.effectsValue!.textContent = String(
    timedEffects.length + particleBursts.activeCount + Number(atmosphereRuntime.isRaining),
  );
}

function updateHordeUi(): void {
  const horde = hordeSimulation;
  if (!horde || !stressActive) return;
  const nearest = horde.findNearestAgent(player.position.x, player.position.z, 120);
  const targetLabel =
    nearest === undefined
      ? 'None in range'
      : `#${horde.ids[nearest]} · ${Math.hypot(horde.x[nearest]! - player.position.x, horde.z[nearest]! - player.position.z).toFixed(1)} m`;
  const tiers = horde.tiers;
  elements.hordeLiveStats!.innerHTML = `
    <div>TRACKED<strong>${horde.count.toLocaleString()}</strong></div>
    <div>LIVING<strong>${horde.livingCount.toLocaleString()}</strong></div>
    <div>NEAR / MID / FAR<strong>${tiers.near} / ${tiers.mid} / ${tiers.far}</strong></div>
    <div>NEAREST TARGET<strong>${targetLabel}</strong></div>
    <div>PLAYER HEALTH<strong>${Math.ceil(horde.playerHealth)} / 100 · ${horde.totalPlayerHits} hits</strong></div>
    <div>SIM STEP<strong>${horde.lastStepMs.toFixed(3)} ms</strong></div>
    <div>FRAME / P95<strong>${elements.fpsValue!.textContent} · ${elements.frameValue!.textContent}</strong></div>
    <div>JS FRAME P95<strong>${elements.cpuFrameValue!.textContent}</strong></div>
    <div>SIM / FRAME<strong>${elements.simulationValue!.textContent}</strong></div>
    <div>DRAW CALLS / TRIANGLES<strong>${elements.renderValue!.textContent}</strong></div>
    <div>GPU TIME P95<strong>${elements.gpuValue!.textContent}</strong></div>
    <div>HEAP / GEOMETRIES / TEXTURES<strong>${elements.memoryValue!.textContent}</strong></div>
    <div>CAMERA / CANVAS<strong>${elements.resolutionValue!.textContent}</strong></div>
    <div>ACTIVE EFFECTS<strong>${elements.effectsValue!.textContent}</strong></div>
    <div>INSTANCE SYNC<strong>${hordeSyncMs.toFixed(2)} ms · ${hordeSyncCount.toLocaleString()} agents</strong></div>`;
  elements.hordeStatus!.textContent = `${elements.hordePattern!.selectedOptions[0]?.textContent ?? 'Horde'} · seed ${elements.hordeSeed!.value.trim() || 'HORDE-01'} · WASD move, LMB shoot visible agents, RMB routes in top-down. No per-agent route search.`;
}

function updateHordeVisual(): void {
  const horde = hordeSimulation;
  const mesh = hordeVisual;
  if (!horde || !mesh || !stressActive) return;
  const started = performance.now();
  let transformChanged = false;
  let colorChanged = false;
  hordeSyncCount = 0;
  changedMatrixIndices.length = 0;
  changedColorIndices.length = 0;
  horde.consumeVisualChanges((index, transform, color) => {
    const tier = horde.tier[index]!;
    if (color || hordeRenderTier[index] !== tier) {
      hordeRenderTier[index] = tier;
      mesh.setColorAt(index, hordeInstance.userData.color.setHex(hordeTierColors[tier]!));
      changedColorIndices.push(index);
      colorChanged = true;
    }
    if (!transform) return;
    if (horde.alive[index] === 0) {
      hordeInstance.position.set(0, -10_000, 0);
      hordeInstance.scale.setScalar(0);
    } else {
      hordeInstance.position.set(horde.x[index]!, horde.y[index]! + 0.84, horde.z[index]!);
      hordeInstance.rotation.set(0, horde.facing[index]!, 0);
      const healthScale = 0.86 + (horde.health[index]! / 100) * 0.14;
      hordeInstance.scale.set(healthScale, healthScale, healthScale);
    }
    hordeInstance.updateMatrix();
    mesh.setMatrixAt(index, hordeInstance.matrix);
    changedMatrixIndices.push(index);
    transformChanged = true;
    hordeSyncCount += 1;
  });
  if (transformChanged) {
    setInstanceUpdateRanges(mesh.instanceMatrix, changedMatrixIndices, 16, horde.count);
    mesh.instanceMatrix.needsUpdate = true;
  }
  if (colorChanged && mesh.instanceColor) {
    setInstanceUpdateRanges(mesh.instanceColor, changedColorIndices, 3, horde.count);
    mesh.instanceColor.needsUpdate = true;
  }
  hordeSyncMs = performance.now() - started;
}

function setInstanceUpdateRanges(
  attribute: BufferAttribute,
  indices: number[],
  stride: number,
  instanceCount: number,
): void {
  attribute.clearUpdateRanges();
  if (indices.length === 0 || indices.length >= instanceCount * 0.3) return;
  indices.sort((a, b) => a - b);

  // Use one full upload when sparse ranges would create too many WebGL submissions.
  let start = indices[0]!;
  let previous = start;
  let rangeCount = 0;
  for (let offset = 1; offset < indices.length; offset += 1) {
    const index = indices[offset]!;
    if (index === previous) continue;
    if (index <= previous + 1) {
      previous = index;
      continue;
    }
    attribute.addUpdateRange(start * stride, (previous - start + 1) * stride);
    rangeCount += 1;
    if (rangeCount >= 64) {
      attribute.clearUpdateRanges();
      return;
    }
    start = index;
    previous = index;
  }
  attribute.addUpdateRange(start * stride, (previous - start + 1) * stride);
}

function openHordeLab(): void {
  elements.hordeLab!.removeAttribute('hidden');
  elements.hordeActiveTools!.setAttribute('hidden', '');
  updateHordeUi();
}

function closeHordeLab(): void {
  elements.hordeLab!.setAttribute('hidden', '');
  if (stressActive) elements.hordeActiveTools!.removeAttribute('hidden');
}

function startHordeTest(): void {
  if (gamePhase !== 'base' || stressActive) {
    elements.hordeStatus!.textContent = 'Return to camp before starting a stress scene.';
    return;
  }
  const count = Number(elements.hordeCount!.value);
  const seed = elements.hordeSeed!.value.trim().slice(0, 32) || 'HORDE-01';
  const pattern = elements.hordePattern!.value as HordeSpawnPattern;
  hordeSimulation = new HordeSimulation(count, seed, pattern, world, new GridNavigator(world));
  hordeRenderTier = new Uint8Array(count);
  hordeRenderTier.fill(255);
  hordeSyncMs = 0;
  hordeSyncCount = 0;
  const body = new CylinderGeometry(0.34, 0.48, 1.65, 6, 1);
  const material = new MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true });
  hordeVisual = new InstancedMesh(body, material, count);
  hordeVisual.name = 'Instanced horde stress visuals';
  hordeVisual.instanceMatrix.setUsage(DynamicDrawUsage);
  hordeVisual.frustumCulled = false;
  hordeVisual.castShadow = false;
  hordeVisual.receiveShadow = false;
  hordeInstance = new Object3D();
  hordeInstance.userData.color = new Color();
  scene.add(hordeVisual);

  if (campInteriorSession) leaveCampBuilding();
  campGroup.visible = false;
  worldGroup.visible = true;
  navigator = fieldNavigator;
  navigationTask = undefined;
  player.cancelNavigation();
  navigator.setDynamicObstacles([]);
  player.setWorld(world, (x, z) => terrainHeightAt(world.seed, x, z));
  player.setPosition(world.spawn.x, world.spawn.z);
  player.setEnabled(true);
  cameraRig.setWorld(world);
  cameraRig.reset(player.position);
  if (elements.hordeCamera!.value !== 'third-person') cameraRig.switchMode(player.position);
  stressActive = true;
  applyRunAtmosphere(seed);
  lastFeedbackHealth = hordeSimulation.playerHealth;
  updateAtmosphereStatus();
  updateSettingsControls();
  document.querySelector('#game')?.classList.add('is-horde-test');
  elements.baseOverlay!.setAttribute('hidden', '');
  elements.hordeLiveStats!.removeAttribute('hidden');
  elements.hordeActiveTools!.setAttribute('hidden', '');
  elements.hordeStart!.setAttribute('hidden', '');
  elements.hordeStop!.removeAttribute('hidden');
  elements.hordeBenchmark!.disabled = true;
  elements.hordeStatus!.textContent = `Loading ${count.toLocaleString()} agents from ${seed}…`;
  elements.zoneStatus!.textContent = 'HORDE LAB';
  updateModeUi();
  updateHordeUi();
  releaseMouseCapture();
  releaseLookDrag();
  canvas?.focus({ preventScroll: true });
}

function stopHordeTest(): void {
  if (!stressActive) return;
  stressActive = false;
  if (hordeVisual) {
    scene.remove(hordeVisual);
    hordeVisual.geometry.dispose();
    const materials = Array.isArray(hordeVisual.material)
      ? hordeVisual.material
      : [hordeVisual.material];
    materials.forEach((material) => material.dispose());
  }
  hordeVisual = undefined;
  hordeSimulation = undefined;
  hordeRenderTier = new Uint8Array();
  setCampContext();
  document.querySelector('#game')?.classList.remove('is-horde-test');
  elements.baseOverlay!.setAttribute('hidden', '');
  elements.hordeLiveStats!.setAttribute('hidden', '');
  elements.hordeActiveTools!.setAttribute('hidden', '');
  elements.hordeStart!.removeAttribute('hidden');
  elements.hordeStop!.setAttribute('hidden', '');
  elements.hordeBenchmark!.disabled = false;
  elements.hordeStatus!.textContent =
    'Stress scene ended. Start another reproducible horde from camp.';
  elements.zoneStatus!.textContent = 'BASE';
  updateBaseUi();
  updateModeUi();
  updateBaseUi();
}

async function runHordeBenchmark(): Promise<void> {
  if (gamePhase !== 'base' || stressActive) {
    elements.hordeStatus!.textContent =
      'End the stress scene and return to camp before benchmarking.';
    return;
  }
  elements.hordeBenchmark!.disabled = true;
  elements.hordeStart!.disabled = true;
  elements.hordeBenchmarkResults!.innerHTML = '<p>Measuring simulation steps…</p>';
  elements.hordeStatus!.textContent =
    'Benchmark excludes scene creation, rendering, and browser frame time.';
  const seed = elements.hordeSeed!.value.trim().slice(0, 32) || 'HORDE-01';
  const pattern = elements.hordePattern!.value as HordeSpawnPattern;
  const benchmarkNavigator = new GridNavigator(world);
  const rows: string[] = [];
  try {
    for (const count of benchmarkCountsForHorde()) {
      const result = benchmarkHorde(count, seed, pattern, world, benchmarkNavigator);
      rows.push(
        `<tr><td>${result.count.toLocaleString()}</td><td>${result.meanMs.toFixed(3)}</td><td>${result.p95Ms.toFixed(3)}</td><td>${result.living.toLocaleString()}</td></tr>`,
      );
      elements.hordeBenchmarkResults!.innerHTML = `<table><thead><tr><th>AGENTS</th><th>MEAN MS</th><th>P95 MS</th><th>ALIVE</th></tr></thead><tbody>${rows.join('')}</tbody></table><p>Simulation only · fixed 1/60 s steps · seed ${seed} · ${elements.hordePattern!.selectedOptions[0]?.textContent}</p>`;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
    elements.hordeStatus!.textContent =
      'Benchmark complete. Repeat with the same seed and pattern to compare host measurements.';
  } catch (error) {
    elements.hordeStatus!.textContent = `Benchmark failed: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    elements.hordeBenchmark!.disabled = false;
    elements.hordeStart!.disabled = false;
  }
}

function createChopper(): Group {
  const helicopter = createHelicopter('extraction', true);
  const group = helicopter.group;
  group.name = 'Extraction helicopter';
  chopperRotor = helicopter.mainRotor;
  chopperTailRotor = helicopter.tailRotor;
  const groundY = terrainHeightAt(world.seed, world.spawn.x, world.spawn.z);
  group.position.set(world.spawn.x - 22, groundY + 18, world.spawn.z + 22);
  scene.add(group);
  return group;
}

function createRappelRope(): void {
  removeRappelRope();
  rappelRope = new Mesh(
    new CylinderGeometry(0.035, 0.035, 1, 6),
    new MeshStandardMaterial({ color: '#343a35', roughness: 1, flatShading: true }),
  );
  rappelRope.name = 'Insertion and extraction rope';
  rappelRope.castShadow = false;
  rappelRope.receiveShadow = false;
  scene.add(rappelRope);
}

function updateRappelRope(x: number, z: number, topY: number, bottomY: number): void {
  if (!rappelRope) return;
  const length = Math.max(0.08, topY - bottomY);
  rappelRope.position.set(x, bottomY + length / 2, z);
  rappelRope.scale.y = length;
}

function removeRappelRope(): void {
  if (!rappelRope) return;
  scene.remove(rappelRope);
  disposeTree(rappelRope);
  rappelRope = undefined;
}

function createExtractionMarker(): Group {
  const group = new Group();
  group.name = 'Extraction landing zone';
  group.userData.interactiveId = 'extraction';
  const groundY = terrainHeightAt(world.seed, world.spawn.x, world.spawn.z);
  group.position.set(world.spawn.x, groundY + 0.08, world.spawn.z);
  const outer = new Mesh(
    new RingGeometry(4.4, 4.65, 48),
    new MeshBasicMaterial({
      color: '#e8c873',
      transparent: true,
      opacity: 0.74,
      side: 2,
      depthWrite: false,
    }),
  );
  outer.rotation.x = -Math.PI / 2;
  const inner = new Mesh(
    new RingGeometry(2.1, 2.24, 40),
    new MeshBasicMaterial({
      color: '#e8c873',
      transparent: true,
      opacity: 0.42,
      side: 2,
      depthWrite: false,
    }),
  );
  inner.rotation.x = -Math.PI / 2;
  const mast = new Mesh(
    new CylinderGeometry(0.055, 0.075, 3.3, 6),
    new MeshStandardMaterial({ color: '#5e5843', roughness: 0.8 }),
  );
  mast.position.y = 1.72;
  const beacon = new Mesh(
    new SphereGeometry(0.3, 8, 6),
    new MeshBasicMaterial({ color: '#ffdf8b' }),
  );
  beacon.position.y = 3.38;
  group.add(outer, inner, mast, beacon);
  scene.add(group);
  extractionPoint.set(world.spawn.x, groundY, world.spawn.z);
  const view: InteractiveView = {
    id: 'extraction',
    kind: 'extraction',
    x: world.spawn.x,
    z: world.spawn.z,
    object: group,
  };
  interactiveViews.set(view.id, view);
  return group;
}

function createCacheVisual(site: CacheSite): Group {
  const group = new Group();
  group.name = `Loot cache ${site.id}`;
  group.userData.interactiveId = site.id;
  group.position.set(site.x, terrainHeightAt(world.seed, site.x, site.z), site.z);
  const body = new Mesh(
    new BoxGeometry(1.35, 0.85, 1.05),
    new MeshStandardMaterial({ color: '#59614d', roughness: 0.92, flatShading: true }),
  );
  body.position.y = 0.44;
  body.castShadow = true;
  body.receiveShadow = true;
  const lid = new Mesh(
    new BoxGeometry(1.42, 0.18, 1.12),
    new MeshStandardMaterial({ color: '#73755a', roughness: 0.85, flatShading: true }),
  );
  lid.position.y = 0.94;
  lid.castShadow = true;
  const latch = new Mesh(
    new BoxGeometry(0.17, 0.28, 0.08),
    new MeshStandardMaterial({ color: '#d2b66f', metalness: 0.32, roughness: 0.65 }),
  );
  latch.position.set(0, 0.55, -0.57);
  body.userData.interactiveId = site.id;
  lid.userData.interactiveId = site.id;
  latch.userData.interactiveId = site.id;
  group.add(body, lid, latch);
  return group;
}

function createDropVisual(drop: LootDrop): Group {
  const colors: Record<ResourceKind, string> = {
    gear: '#aab2a0',
    supplies: '#91b278',
    money: '#e4c56d',
    fuel: '#d98c55',
  };
  const group = new Group();
  group.name = `Pickup ${drop.id}`;
  group.userData.interactiveId = drop.id;
  group.position.set(drop.x, terrainHeightAt(world.seed, drop.x, drop.z) + 0.48, drop.z);
  const token = new Mesh(
    new BoxGeometry(0.56, 0.56, 0.56),
    new MeshStandardMaterial({
      color: colors[drop.kind],
      roughness: 0.5,
      metalness: 0.16,
      flatShading: true,
    }),
  );
  token.rotation.y = Math.PI / 4;
  token.castShadow = true;
  token.userData.interactiveId = drop.id;
  const glow = new Mesh(
    new RingGeometry(0.4, 0.52, 22),
    new MeshBasicMaterial({
      color: colors[drop.kind],
      transparent: true,
      opacity: 0.56,
      side: 2,
      depthWrite: false,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.36;
  glow.userData.interactiveId = drop.id;
  group.add(token, glow);
  return group;
}

function findObjectWithInteractiveId(root: Object3D, id: string): Object3D | undefined {
  let match: Object3D | undefined;
  root.traverse((object) => {
    if (!match && object.userData.interactiveId === id) match = object;
  });
  return match;
}

function createCampInteractiveViews(): void {
  campInteractiveViews.clear();
  for (const service of campServices) {
    const object = findObjectWithInteractiveId(campGroup, service.id);
    if (!object) continue;
    campInteractiveViews.set(service.id, {
      id: service.id,
      kind: service.kind,
      x: service.x,
      z: service.z,
      object,
    });
  }
  for (const entrance of campEntrances) {
    const object = findObjectWithInteractiveId(campGroup, entrance.id);
    if (!object) continue;
    campInteractiveViews.set(entrance.id, {
      id: entrance.id,
      kind: 'building-door',
      x: entrance.x,
      z: entrance.z,
      object,
      entrance,
    });
  }
}

function createRunLoot(): void {
  scene.remove(lootGroup);
  disposeTree(lootGroup);
  lootGroup = new Group();
  lootGroup.name = 'Run loot';
  interactiveViews.clear();
  cacheSites = placeLootCaches(world, navigator);
  openedCacheIds = new Set();
  lootDrops = [];
  for (const site of cacheSites) {
    const object = createCacheVisual(site);
    lootGroup.add(object);
    interactiveViews.set(site.id, {
      id: site.id,
      kind: 'cache',
      x: site.x,
      z: site.z,
      object,
      cache: site,
    });
  }
  for (const entrance of world.entrances) {
    const object = findObjectWithInteractiveId(worldGroup, entrance.id);
    if (!object) continue;
    interactiveViews.set(entrance.id, {
      id: entrance.id,
      kind: 'building-door',
      x: entrance.x,
      z: entrance.z,
      object,
      entrance,
    });
  }
  scene.add(lootGroup);
}

function activeInteractiveViews(): Map<string, InteractiveView> {
  return (
    interiorSession?.views ??
    campInteriorSession?.views ??
    (gamePhase === 'base' ? campInteractiveViews : interactiveViews)
  );
}

function activeWorldVisual(): Group {
  if (stressActive) return worldGroup;
  return (
    interiorSession?.group ??
    campInteriorSession?.group ??
    (gamePhase === 'base' ? campGroup : worldGroup)
  );
}

function activeLootVisual(): Group {
  return interiorSession?.lootGroup ?? lootGroup;
}

function createInteriorLootVisual(drop: LootDrop): Group {
  const colors: Record<ResourceKind, string> = {
    gear: '#c6a96f',
    supplies: '#93a778',
    money: '#d4c47c',
    fuel: '#b87e54',
  };
  const group = new Group();
  group.position.set(drop.x, 0, drop.z);
  group.name = `Interior ${drop.kind} pickup`;
  group.userData.interactiveId = drop.id;
  const token = new Mesh(
    new BoxGeometry(0.48, 0.48, 0.48),
    new MeshStandardMaterial({ color: colors[drop.kind], roughness: 0.8, flatShading: true }),
  );
  token.position.y = 0.42;
  token.rotation.y = Math.PI / 4;
  token.castShadow = true;
  token.userData.interactiveId = drop.id;
  const marker = new Mesh(
    new RingGeometry(0.42, 0.54, 20),
    new MeshBasicMaterial({ color: colors[drop.kind], transparent: true, opacity: 0.58 }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.04;
  marker.userData.interactiveId = drop.id;
  group.add(token, marker);
  return group;
}

function createInteriorHostile(id: string, x: number, z: number): ZombieState {
  return {
    id,
    position: new Vector3(x, 0, z),
    health: 100,
    maxHealth: 100,
    alive: true,
    stunRemaining: 0,
    attackCooldown: 0.55,
    repathRemaining: 0,
    path: [],
    facing: 0,
  };
}

function enterBuilding(entrance: BuildingEntrance): void {
  if (gamePhase !== 'active' || interiorSession || stressActive) return;
  clearNavigation('IDLE');
  clearRoute();
  autoAttackTargetId = undefined;
  releaseMouseCapture();
  releaseLookDrag();

  const layout = generateInterior(`${world.seed}:${entrance.id}`);
  const roomWorld = interiorWorld(layout, world);
  const roomGroup = buildInterior(layout, world);
  const roomNavigator = new GridNavigator(roomWorld);
  const roomCombatNavigator = new GridNavigator(roomWorld);
  const roomLootGroup = new Group();
  roomLootGroup.name = `Interior loot ${entrance.id}`;
  const views = new Map<string, InteractiveView>();
  for (const item of layout.loot) {
    if (interiorLootRemaining.get(item.id) === 0) continue;
    const drop: LootDrop = {
      id: item.id,
      cacheId: entrance.id,
      kind: item.kind,
      amount: interiorLootRemaining.get(item.id) ?? item.amount,
      x: item.x,
      z: item.z,
      collected: false,
    };
    const object = createInteriorLootVisual(drop);
    roomLootGroup.add(object);
    views.set(drop.id, { id: drop.id, kind: 'drop', x: drop.x, z: drop.z, object, drop });
  }
  const exitObject = findObjectWithInteractiveId(roomGroup, 'interior-exit');
  if (exitObject) {
    views.set('interior-exit', {
      id: 'interior-exit',
      kind: 'building-door',
      x: layout.exit.x,
      z: layout.exit.z,
      object: exitObject,
    });
  }

  const savedRoomHostiles = interiorHostiles.get(entrance.id) ?? [
    createInteriorHostile(layout.encounter.id, layout.encounter.x, layout.encounter.z),
  ];
  interiorHostiles.set(entrance.id, savedRoomHostiles);
  const savedZombieGroup = zombieGroup;
  const savedZombieViews = new Map(zombieViews);
  scene.remove(savedZombieGroup);
  zombieGroup = new Group();
  zombieGroup.name = `Interior hostiles ${entrance.id}`;
  zombieViews.clear();
  for (const hostile of savedRoomHostiles) {
    const visual = createZombieVisual(hostile);
    zombieViews.set(hostile.id, visual);
    zombieGroup.add(visual);
  }
  scene.add(roomGroup, roomLootGroup, zombieGroup);
  worldGroup.visible = false;
  lootGroup.visible = false;
  if (chopper) chopper.visible = false;
  if (extractionMarker) extractionMarker.visible = false;
  if (extractionGuideArrow) extractionGuideArrow.visible = false;

  interiorSession = {
    entrance,
    layout,
    world: roomWorld,
    navigator: roomNavigator,
    group: roomGroup,
    lootGroup: roomLootGroup,
    views,
    returnPosition: player.position.clone(),
    outdoorNavigator: navigator,
    outdoorCombatNavigator: combatNavigator,
    outdoorHostiles: combat.zombies.slice(),
    outdoorZombieGroup: savedZombieGroup,
    outdoorZombieViews: savedZombieViews,
  };
  navigator = roomNavigator;
  combatNavigator = roomCombatNavigator;
  combat.setContext(roomWorld, roomCombatNavigator, () => 0, savedRoomHostiles);
  player.setWorld(roomWorld, () => 0);
  player.setPosition(layout.entry.x, layout.entry.z);
  player.setEnabled(true);
  cameraRig.setWorld(roomWorld);
  cameraRig.snapTo(player.position);
  gamePhase = 'active';
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.zoneStatus!.textContent = 'INSIDE';
  elements.seedHint!.textContent = `${layout.rooms.length} room interior · outdoor activity paused. Find the lit exit marker to leave.`;
  combat.lastMessage = 'Interior entered. Clear the infected and search the rooms.';
  updateModeUi();
  updateCombatUi();
  updateNearbyAction();
  canvas?.focus({ preventScroll: true });
}

function leaveBuilding(resumePlayer = true): void {
  const session = interiorSession;
  if (!session) return;
  interiorHostiles.set(session.entrance.id, combat.zombies.slice());
  scene.remove(session.group, session.lootGroup, zombieGroup);
  disposeTree(session.group);
  disposeTree(session.lootGroup);
  disposeTree(zombieGroup);
  zombieGroup = session.outdoorZombieGroup;
  zombieViews.clear();
  for (const [id, view] of session.outdoorZombieViews) zombieViews.set(id, view);
  scene.add(zombieGroup);
  worldGroup.visible = true;
  lootGroup.visible = true;
  if (chopper) chopper.visible = true;
  if (extractionMarker) extractionMarker.visible = true;
  if (extractionGuideArrow) extractionGuideArrow.visible = true;
  navigator = session.outdoorNavigator;
  combatNavigator = session.outdoorCombatNavigator;
  navigator.setDynamicObstacles([]);
  combat.setContext(
    world,
    combatNavigator,
    (x, z) => terrainHeightAt(world.seed, x, z),
    session.outdoorHostiles,
  );
  player.setWorld(world, (x, z) => terrainHeightAt(world.seed, x, z));
  player.setPosition(session.returnPosition.x, session.returnPosition.z);
  player.setEnabled(resumePlayer && gamePhase === 'active' && combat.alive);
  cameraRig.setWorld(world);
  cameraRig.snapTo(player.position);
  interiorSession = undefined;
  navigationTask = undefined;
  autoAttackTargetId = undefined;
  setNavigationStatus('IDLE');
  clearRoute();
  elements.extractionGuide!.removeAttribute('hidden');
  elements.zoneStatus!.textContent = 'ACTIVE';
  elements.seedHint!.textContent = 'Back outside. The run and horde timer resume now.';
  combat.lastMessage = combat.alive
    ? 'Back outside. The horde resumes its approach.'
    : combat.lastMessage;
  updateModeUi();
  updateCombatUi();
  updateNearbyAction();
}

function addPickup(drop: LootDrop): void {
  lootDrops.push(drop);
  const object = createDropVisual(drop);
  lootGroup.add(object);
  interactiveViews.set(drop.id, {
    id: drop.id,
    kind: 'drop',
    x: drop.x,
    z: drop.z,
    object,
    drop,
  });
}

function openLoot(view: InteractiveView): void {
  if (interiorSession || view.kind !== 'cache' || !view.cache || openedCacheIds.has(view.id))
    return;
  openedCacheIds.add(view.id);
  lootGroup.remove(view.object);
  disposeTree(view.object);
  interactiveViews.delete(view.id);
  for (const drop of openCache(view.cache, world.seed)) addPickup(drop);
  combat.lastMessage = 'Cache opened. Collect what you can carry.';
  updateCombatUi();
}

function collectLoot(view: InteractiveView): void {
  if (view.kind !== 'drop' || !view.drop || view.drop.collected) return;
  const accepted = addCargo(cargo, view.drop.kind, view.drop.amount, cargoCapacity(saveData));
  if (accepted <= 0) {
    combat.lastMessage = `Cargo full. Capacity is ${cargoCapacity(saveData)} units.`;
    updateCombatUi();
    return;
  }
  view.drop.amount -= accepted;
  runLootCollected += accepted;
  if (interiorSession) interiorLootRemaining.set(view.id, view.drop.amount);
  combat.lastMessage = `Collected ${accepted} ${resourceNames[view.drop.kind]}.`;
  if (view.drop.amount <= 0) {
    view.drop.collected = true;
    activeLootVisual().remove(view.object);
    disposeTree(view.object);
    activeInteractiveViews().delete(view.id);
    if (interiorSession) interiorLootRemaining.set(view.id, 0);
  }
  updateCombatUi();
}

const campMenuCopy: Record<
  CampMenuMode,
  { title: string; kicker: string; message: string; footnote: string }
> = {
  terminal: {
    title: 'WAYFARER CAMP',
    kicker: 'SAFE ZONE / GREYWOOD PERIMETER',
    message: 'Camp ledger, quartermaster, and mission board are ready.',
    footnote:
      'Loot secured at camp survives a failed run. Everything still carried is lost if you go down.',
  },
  quartermaster: {
    title: 'QUARTERMASTER',
    kicker: 'CAMP SERVICES / SUPPLY COUNTER',
    message: 'Buy field gear, medical supplies, or a cargo harness; sell spare stock for credits.',
    footnote: 'Trades update your saved camp inventory immediately.',
  },
  storage: {
    title: 'CAMP STORAGE',
    kicker: 'SAFE ZONE / BANKED INVENTORY',
    message: 'Review the resources secured at camp between deployments.',
    footnote:
      'Stored stock is protected. One gear kit and one medical supply are issued at deployment when available.',
  },
  operations: {
    title: 'OPERATIONS BOARD',
    kicker: 'CAMP SERVICES / DESTINATIONS',
    message: 'Choose a destination. Greywood is open and uses no fuel.',
    footnote: 'Military Base and Large City will unlock when their maps are ready.',
  },
};

function openBaseTerminal(mode: CampMenuMode = 'terminal'): void {
  if (gamePhase !== 'base' || stressActive) return;
  const copy = campMenuCopy[mode];
  elements.baseOverlay!.dataset.menu = mode;
  elements.baseOverlay!.setAttribute('aria-label', copy.title);
  elements.baseTitle!.textContent = copy.title;
  elements.baseKicker!.textContent = copy.kicker;
  elements.baseMessage!.textContent = copy.message;
  elements.baseFootnote!.textContent = copy.footnote;
  for (const section of elements.baseOverlay!.querySelectorAll<HTMLElement>('[data-base-menu]')) {
    section.hidden = !section.dataset.baseMenu?.split(/\s+/).includes(mode);
  }
  elements.baseOverlay!.removeAttribute('hidden');
  player.setEnabled(false);
  updateBaseUi();
  canvas?.blur();
}

function closeBaseTerminal(): void {
  elements.baseOverlay!.setAttribute('hidden', '');
  if (gamePhase === 'base' && !stressActive) {
    player.setEnabled(true);
    canvas?.focus({ preventScroll: true });
  }
}

function enterCampBuilding(entrance: BuildingEntrance): void {
  if (gamePhase !== 'base' || campInteriorSession || stressActive) return;
  clearNavigation('IDLE');
  clearRoute();
  releaseMouseCapture();
  releaseLookDrag();
  const layout = generateInterior(`${campWorld.seed}:${entrance.id}`);
  const roomWorld = interiorWorld(layout, campWorld);
  const group = buildInterior(layout, campWorld);
  const roomNavigator = new GridNavigator(roomWorld);
  const views = new Map<string, InteractiveView>();
  const exitObject = findObjectWithInteractiveId(group, 'interior-exit');
  if (exitObject) {
    views.set('interior-exit', {
      id: 'interior-exit',
      kind: 'building-door',
      x: layout.exit.x,
      z: layout.exit.z,
      object: exitObject,
    });
  }
  campGroup.visible = false;
  setCampAtmosphere();
  scene.add(group);
  campInteriorSession = {
    entrance,
    layout,
    world: roomWorld,
    navigator: roomNavigator,
    group,
    views,
    returnPosition: player.position.clone(),
  };
  navigator = roomNavigator;
  player.setWorld(roomWorld, () => 0);
  player.setPosition(layout.entry.x, layout.entry.z);
  player.setEnabled(true);
  cameraRig.setWorld(roomWorld);
  cameraRig.snapTo(player.position);
  elements.baseOverlay!.setAttribute('hidden', '');
  elements.zoneStatus!.textContent = 'CAMP / INSIDE';
  elements.seedHint!.textContent = `${layout.rooms.length} room safe-zone building · use the lit exit to return to camp.`;
  const mapName = document.querySelector('.map-label strong');
  if (mapName)
    mapName.textContent = entrance.id === 'camp-clinic' ? 'Camp Clinic' : 'Camp Barracks';
  updateModeUi();
  updateCombatUi();
  updateNearbyAction();
  canvas?.focus({ preventScroll: true });
}

function leaveCampBuilding(): void {
  const session = campInteriorSession;
  if (!session) return;
  scene.remove(session.group);
  disposeTree(session.group);
  campInteriorSession = undefined;
  campGroup.visible = true;
  setCampAtmosphere();
  navigator = campNavigator;
  player.setWorld(campWorld, () => 0);
  player.setPosition(session.returnPosition.x, session.returnPosition.z);
  player.setEnabled(elements.baseOverlay!.hasAttribute('hidden'));
  cameraRig.setWorld(campWorld);
  cameraRig.snapTo(player.position);
  navigationTask = undefined;
  clearRoute();
  setNavigationStatus('IDLE');
  elements.zoneStatus!.textContent = 'BASE';
  elements.seedHint!.textContent = 'Back in Wayfarer Camp. Your stored resources remain safe.';
  const mapName = document.querySelector('.map-label strong');
  if (mapName) mapName.textContent = 'Wayfarer Camp';
  updateModeUi();
  updateCombatUi();
  updateNearbyAction();
  canvas?.focus({ preventScroll: true });
}

function interactWithCamp(view: InteractiveView, allowApproach: boolean): void {
  const distance = Math.hypot(view.x - player.position.x, view.z - player.position.z);
  if (view.kind === 'building-door') {
    if (campInteriorSession) {
      if (distance <= 2.8) leaveCampBuilding();
      else if (allowApproach && cameraRig.mode === 'top-down') moveToInteractive(view);
      else elements.seedHint!.textContent = 'Move closer to the lit exit marker.';
      return;
    }
    if (!view.entrance) return;
    if (distance <= 3.6) enterCampBuilding(view.entrance);
    else if (allowApproach && cameraRig.mode === 'top-down') moveToInteractive(view);
    else elements.seedHint!.textContent = 'Move closer to the barracks or clinic entrance.';
    return;
  }
  if (distance > 3.8) {
    if (allowApproach && cameraRig.mode === 'top-down') moveToInteractive(view);
    else elements.seedHint!.textContent = 'Walk closer to the marked camp service.';
    return;
  }
  if (view.kind === 'camp-departure') {
    startRun();
  } else if (view.kind === 'camp-shop') {
    openBaseTerminal('quartermaster');
  } else if (view.kind === 'camp-storage') {
    openBaseTerminal('storage');
  } else if (view.kind === 'camp-operations') {
    openBaseTerminal('operations');
  }
}

function interactWith(view: InteractiveView, allowApproach = true): void {
  if (gamePhase === 'base') {
    interactWithCamp(view, allowApproach);
    return;
  }
  if (view.kind === 'building-door') {
    if (interiorSession) {
      if (Math.hypot(view.x - player.position.x, view.z - player.position.z) <= 2.8) {
        leaveBuilding();
        return;
      }
      if (allowApproach && cameraRig.mode === 'top-down') {
        moveToInteractive(view);
        return;
      }
      combat.lastMessage = 'Move closer to the marked exit.';
      updateCombatUi();
      return;
    }
    if (!view.entrance) return;
    if (Math.hypot(view.x - player.position.x, view.z - player.position.z) > 3.6) {
      if (allowApproach && cameraRig.mode === 'top-down') moveToInteractive(view);
      else {
        combat.lastMessage = 'Move closer to the building door.';
        updateCombatUi();
      }
      return;
    }
    enterBuilding(view.entrance);
    return;
  }
  if (view.kind === 'extraction') {
    if (Math.hypot(view.x - player.position.x, view.z - player.position.z) > 6.5) {
      if (allowApproach && cameraRig.mode === 'top-down') {
        moveToInteractive(view);
        return;
      }
      combat.lastMessage = 'Return to the landing zone to board.';
      updateCombatUi();
      return;
    }
    beginExtraction();
    return;
  }
  if (Math.hypot(view.x - player.position.x, view.z - player.position.z) > 3.6) {
    if (allowApproach && cameraRig.mode === 'top-down') {
      moveToInteractive(view);
      return;
    }
    combat.lastMessage = `Move closer to ${view.kind === 'cache' ? 'search this cache' : 'collect the pickup'}.`;
    updateCombatUi();
    return;
  }
  if (view.kind === 'cache') openLoot(view);
  else collectLoot(view);
}

function closestInteractive(): InteractiveView | undefined {
  const views = activeInteractiveViews();
  let closest: InteractiveView | undefined;
  let distance = Infinity;
  for (const view of views.values()) {
    const candidate = Math.hypot(view.x - player.position.x, view.z - player.position.z);
    if (candidate < distance) {
      closest = view;
      distance = candidate;
    }
  }
  return distance <= 4.4 ? closest : undefined;
}

function interactNearest(): void {
  if (gamePhase === 'base') {
    const nearby = closestInteractive();
    if (!nearby) return;
    const range = nearby.kind === 'building-door' && campInteriorSession ? 2.8 : 3.8;
    if (Math.hypot(nearby.x - player.position.x, nearby.z - player.position.z) <= range) {
      interactWith(nearby, false);
    } else if (cameraRig.mode === 'top-down') {
      moveToInteractive(nearby);
    } else {
      interactWith(nearby, false);
    }
    return;
  }
  if (gamePhase !== 'active') return;
  const nearby = closestInteractive();
  if (
    nearby &&
    nearby.kind !== 'extraction' &&
    Math.hypot(nearby.x - player.position.x, nearby.z - player.position.z) <= 3.6
  ) {
    interactWith(nearby, false);
    return;
  }
  const extraction = activeInteractiveViews().get('extraction');
  if (
    extraction &&
    Math.hypot(extraction.x - player.position.x, extraction.z - player.position.z) <= 6.5
  ) {
    interactWith(extraction, false);
    return;
  }
  if (nearby) interactWith(nearby);
  else {
    combat.lastMessage = 'No cache, pickup, or chopper close enough to use.';
    updateCombatUi();
  }
}

function updateNearbyAction(): void {
  if (gamePhase === 'base') {
    const nearby = closestInteractive();
    if (!nearby) {
      elements.nearbyAction!.setAttribute('hidden', '');
      return;
    }
    const distance = Math.hypot(nearby.x - player.position.x, nearby.z - player.position.z);
    const prompt = campInteriorSession
      ? distance <= 2.8
        ? 'F  RETURN TO CAMP'
        : cameraRig.mode === 'top-down'
          ? 'CLICK TO APPROACH EXIT'
          : 'WALK TO LIT EXIT'
      : nearby.kind === 'building-door'
        ? distance <= 3.6
          ? 'F  ENTER BUILDING'
          : cameraRig.mode === 'top-down'
            ? 'CLICK TO APPROACH DOOR'
            : 'WALK TO BUILDING'
        : distance <= 3.8
          ? nearby.kind === 'camp-shop'
            ? 'F  QUARTERMASTER'
            : nearby.kind === 'camp-storage'
              ? 'F  CAMP STORAGE'
              : nearby.kind === 'camp-operations'
                ? 'F  OPERATIONS BOARD'
                : 'F  DEPART FOR GREYWOOD'
          : cameraRig.mode === 'top-down'
            ? 'CLICK TO APPROACH SERVICE'
            : 'WALK TO CAMP SERVICE';
    elements.nearbyAction!.textContent = prompt;
    elements.nearbyAction!.removeAttribute('hidden');
    return;
  }
  if (gamePhase !== 'active') {
    elements.nearbyAction!.setAttribute('hidden', '');
    return;
  }
  const nearby = closestInteractive();
  if (nearby) {
    const distance = Math.hypot(nearby.x - player.position.x, nearby.z - player.position.z);
    const text =
      nearby.kind === 'building-door'
        ? interiorSession
          ? distance <= 2.8
            ? 'F  EXIT BUILDING'
            : 'CLICK TO APPROACH EXIT'
          : distance <= 3.6
            ? 'F  ENTER BUILDING'
            : 'CLICK TO APPROACH DOOR'
        : nearby.kind === 'extraction'
          ? distance <= 6.5
            ? runLootCollected > 0
              ? 'F  BOARD THE CHOPPER'
              : 'SCAVENGE BEFORE EXTRACTION'
            : 'EXTRACTION ZONE'
          : nearby.kind === 'cache'
            ? distance <= 3.6
              ? 'F  SEARCH CACHE'
              : 'CLICK TO APPROACH CACHE'
            : distance <= 3.6
              ? 'F  COLLECT PICKUP'
              : 'CLICK TO APPROACH PICKUP';
    elements.nearbyAction!.textContent = text;
    elements.nearbyAction!.removeAttribute('hidden');
    return;
  }
  elements.nearbyAction!.setAttribute('hidden', '');
}

function beginExtraction(): void {
  if (gamePhase !== 'active') return;
  if (runLootCollected <= 0) {
    combat.lastMessage = 'Recover at least one cache item before extraction is cleared.';
    updateCombatUi();
    return;
  }
  const distance = Math.hypot(
    extractionPoint.x - player.position.x,
    extractionPoint.z - player.position.z,
  );
  if (distance > 6.5) {
    combat.lastMessage = 'Move inside the landing ring to board.';
    updateCombatUi();
    return;
  }
  const danger = combat.zombies.some(
    (zombie) => zombie.alive && zombie.position.distanceTo(player.position) < 3.5,
  );
  if (danger) {
    combat.lastMessage = 'Hostiles are too close. Clear space before boarding.';
    updateCombatUi();
    return;
  }
  gamePhase = 'extracting';
  extractingRemaining = 4;
  player.setEnabled(false);
  autoAttackTargetId = undefined;
  elements.guideAction!.textContent = 'BOARDING…';
  combat.lastMessage = 'Boarding chopper · hold position for 4 seconds.';
  updateCombatUi();
}

function useCarriedSupply(): void {
  if (gamePhase !== 'active') return;
  if (cargo.supplies <= 0) {
    combat.lastMessage = 'No medical supplies are being carried.';
  } else if (combat.health >= combat.maxHealth) {
    combat.lastMessage = 'Save the supply until you are injured.';
  } else {
    cargo.supplies -= 1;
    const restored = Math.min(35, combat.maxHealth - combat.health);
    combat.health += restored;
    combat.lastMessage = `Medical supply used · +${Math.ceil(restored)} health.`;
  }
  updateCombatUi();
}

function moveToLocation(x: number, z: number): void {
  if (
    cameraRig.mode !== 'top-down' ||
    (gamePhase !== 'active' && gamePhase !== 'base' && !stressActive)
  )
    return;
  autoAttackTargetId = undefined;
  const path = requestNavigationPath(x, z);
  if (path.length === 0) {
    if (Math.hypot(x - player.position.x, z - player.position.z) <= 1.8) {
      clearNavigation('ARRIVED');
      return;
    }
    failNavigation('No reachable route to that point. Try a closer destination.');
    return;
  }
  const endpoint = path[path.length - 1];
  navigationTask = { x: endpoint.x, z: endpoint.z, range: 0, stuckReplans: 0 };
  player.setNavigationPath(path);
  setNavigationStatus('ROUTING');
  updateRouteLine(true);
}

function moveToInteractive(view: InteractiveView): void {
  if (cameraRig.mode !== 'top-down' || (gamePhase !== 'active' && gamePhase !== 'base')) return;
  autoAttackTargetId = undefined;
  const interactionRange =
    view.kind === 'extraction'
      ? 6.5
      : (interiorSession || campInteriorSession) && view.kind === 'building-door'
        ? 2.8
        : 3.6;
  const distance = Math.hypot(view.x - player.position.x, view.z - player.position.z);
  if (distance <= interactionRange) {
    clearNavigation('ARRIVED');
    interactWith(view, false);
    return;
  }
  let stoppingRange = Math.max(0.5, interactionRange - 1.5);
  let path = requestNavigationPath(view.x, view.z, stoppingRange);
  if (path.length === 0 && distance > interactionRange) {
    stoppingRange = Math.max(0.25, stoppingRange - 1.5);
    path = requestNavigationPath(view.x, view.z, stoppingRange);
  }
  if (path.length === 0) {
    failNavigation(
      `No clear approach to ${view.kind === 'cache' ? 'this cache' : view.kind === 'drop' ? 'this pickup' : 'the chopper'}.`,
    );
    return;
  }
  navigationTask = {
    x: view.x,
    z: view.z,
    range: stoppingRange,
    interactionId: view.id,
    stuckReplans: 0,
  };
  player.setNavigationPath(path);
  setNavigationStatus('APPROACH');
  routeRefresh = 1;
  updateRouteLine(true);
  combat.lastMessage = `Moving into reach of ${view.kind === 'cache' ? 'the cache' : view.kind === 'drop' ? 'the pickup' : view.kind === 'extraction' ? 'the chopper' : 'the camp service'}.`;
  if (view.kind === 'building-door')
    combat.lastMessage = interiorSession
      ? 'Moving toward the marked exit.'
      : 'Moving toward the building door.';
  if (gamePhase === 'base') elements.seedHint!.textContent = 'Following the camp path.';
  updateCombatUi();
}

function requestNavigationPath(x: number, z: number, range = 0): NavPoint[] {
  const started = performance.now();
  const path =
    range > 0
      ? navigator.findPathToRange(player.position.x, player.position.z, x, z, range)
      : navigator.findPath(player.position.x, player.position.z, x, z);
  navigationRequestMs = performance.now() - started;
  navigationRequestMaxMs = Math.max(navigationRequestMaxMs, navigationRequestMs);
  navigationRequestCount += 1;
  updateNavigationTelemetry();
  return path;
}

function setNavigationStatus(status: string): void {
  navigationStatus = status;
  elements.routeValue!.textContent = status;
}

function updateNavigationTelemetry(): void {
  elements.navigationValue!.innerHTML = `${navigationRequestMs.toFixed(2)} / ${navigationRequestMaxMs.toFixed(2)} <small>MS · ${navigationRequestCount}</small>`;
  elements.routeValue!.textContent = navigationStatus;
}

function clearNavigation(status = 'CANCELLED'): void {
  navigationTask = undefined;
  player.cancelNavigation();
  setNavigationStatus(status);
  routeRefresh = 1;
  updateRouteLine(true);
}

function failNavigation(message: string): void {
  clearNavigation('NO ROUTE');
  combat.lastMessage = message;
  updateCombatUi();
}

function taskIsReached(task: NavigationTask): boolean {
  const distance = Math.hypot(task.x - player.position.x, task.z - player.position.z);
  return task.interactionId ? distance <= task.range + 0.65 : distance <= navigator.cellSize * 0.7;
}

function finishNavigationTask(task: NavigationTask): void {
  if (navigationTask !== task) return;
  navigationTask = undefined;
  player.cancelNavigation();
  setNavigationStatus('ARRIVED');
  updateRouteLine(true);
  if (task.interactionId) {
    const view = activeInteractiveViews().get(task.interactionId);
    if (view) interactWith(view, false);
  }
}

function replanNavigationTask(): void {
  const task = navigationTask;
  if (
    !task ||
    cameraRig.mode !== 'top-down' ||
    (gamePhase !== 'active' && gamePhase !== 'base' && !stressActive)
  )
    return;
  const path = requestNavigationPath(task.x, task.z, task.range);
  if (path.length > 0) {
    player.setNavigationPath(path);
    setNavigationStatus(task.interactionId ? 'APPROACH' : 'ROUTING');
    routeRefresh = 1;
    updateRouteLine(true);
    return;
  }
  if (taskIsReached(task)) {
    finishNavigationTask(task);
    return;
  }
  if (task.interactionId) {
    const view = activeInteractiveViews().get(task.interactionId);
    const useRange =
      view?.kind === 'extraction'
        ? 6.5
        : (interiorSession || campInteriorSession) && view?.kind === 'building-door'
          ? 2.8
          : 3.6;
    if (view && Math.hypot(view.x - player.position.x, view.z - player.position.z) <= useRange) {
      finishNavigationTask(task);
      return;
    }
  }
  failNavigation('The route is blocked. Choose another approach.');
}

function updateDynamicNavigation(): void {
  const obstacles = combat.zombies
    .filter((zombie) => zombie.alive && zombie.position.distanceTo(player.position) > 3.2)
    .map((zombie) => ({ x: zombie.position.x, z: zombie.position.z, radius: 0.8 }));
  navigator.setDynamicObstacles(obstacles);
  if (
    navigationTask &&
    player.navigationPath.length > 0 &&
    !navigator.isPathWalkable({ x: player.position.x, z: player.position.z }, player.navigationPath)
  ) {
    replanNavigationTask();
  }
}

function updateNavigationProgress(): void {
  const task = navigationTask;
  if (!task || cameraRig.mode !== 'top-down') return;
  if (player.consumeNavigationStuck()) {
    task.stuckReplans += 1;
    if (task.stuckReplans > 2) {
      failNavigation('Movement is blocked. Choose another destination.');
      return;
    }
    replanNavigationTask();
    return;
  }
  if (player.navigationPath.length === 0) {
    if (taskIsReached(task)) finishNavigationTask(task);
    else replanNavigationTask();
  }
}

function clearRunScene(): void {
  cancelTurretPlacement();
  for (const turret of activeTurrets) {
    scene.remove(turret.object);
    disposeTree(turret.object);
  }
  activeTurrets.length = 0;
  for (const grenade of grenadeProjectiles) {
    scene.remove(grenade.object);
    disposeTree(grenade.object);
  }
  grenadeProjectiles.length = 0;
  for (const effect of timedEffects) {
    scene.remove(effect.object);
    disposeTree(effect.object);
  }
  timedEffects.length = 0;
  if (interiorSession) leaveBuilding(false);
  removeRappelRope();
  if (chopper) {
    scene.remove(chopper);
    disposeTree(chopper);
  }
  chopper = undefined;
  chopperRotor = undefined;
  chopperTailRotor = undefined;
  if (extractionMarker) {
    scene.remove(extractionMarker);
    disposeTree(extractionMarker);
  }
  extractionMarker = undefined;
  if (extractionGuideArrow) {
    scene.remove(extractionGuideArrow);
    disposeTree(extractionGuideArrow);
  }
  extractionGuideArrow = undefined;
  scene.remove(lootGroup);
  disposeTree(lootGroup);
  lootGroup = new Group();
  lootGroup.name = 'Run loot';
  scene.add(lootGroup);
  interactiveViews.clear();
  cacheSites = [];
  lootDrops = [];
  openedCacheIds = new Set();
  interiorHostiles.clear();
  interiorLootRemaining.clear();
}

function startRun(): void {
  if (gamePhase !== 'base' || stressActive) return;
  if (campInteriorSession) leaveCampBuilding();
  clearRunScene();
  campGroup.visible = false;
  worldGroup.visible = true;
  applyRunAtmosphere(world.seed);
  navigator = fieldNavigator;
  navigator.setDynamicObstacles([]);
  dynamicNavigationRefresh = 0;
  cargo = emptyInventory();
  grenadeCount = 3;
  grenadeCooldownRemaining = 0;
  if (saveData.base.gear > 0) {
    saveData.base.gear -= 1;
    cargo.gear += 1;
  }
  if (saveData.base.supplies > 0) {
    saveData.base.supplies -= 1;
    cargo.supplies += 1;
  }
  storeSave(saveData);
  runElapsed = 0;
  arrivalElapsed = 0;
  hoverElapsed = 0;
  disembarkElapsed = 0;
  extractingRemaining = 0;
  takeoffElapsed = 0;
  reinforcementIndex = 0;
  waveWarningShown = false;
  runLootCollected = 0;
  combat.reset();
  createZombieViews();
  zombieGroup.visible = false;
  player.setWorld(world, (x, z) => terrainHeightAt(world.seed, x, z));
  player.setPosition(world.spawn.x, world.spawn.z);
  player.setEnabled(false);
  player.visual.visible = false;
  player.cancelNavigation();
  cameraRig.setWorld(world);
  createRunLoot();
  chopper = createChopper();
  cameraRig.reset(chopper.position);
  cameraRig.yaw = Math.PI / 4;
  cameraRig.pitch = 0.18;
  cameraRig.snapTo(chopper.position);
  extractionMarker = createExtractionMarker();
  const initialDirection = new Vector3(0, 0, -1);
  extractionGuideArrow = new ArrowHelper(
    initialDirection,
    new Vector3(player.position.x, player.position.y + 2.5, player.position.z),
    5.2,
    '#e8c873',
    0.9,
    0.55,
  );
  extractionGuideArrow.visible = false;
  scene.add(extractionGuideArrow);
  gamePhase = 'arrival';
  updateAtmosphereStatus();
  document.querySelector('#game')?.classList.remove('is-base');
  elements.nearbyAction!.setAttribute('hidden', '');
  updateBaseUi();
  clearNavigation('IDLE');
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  lastFeedbackHealth = combat.health;
  elements.baseOverlay!.setAttribute('hidden', '');
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.zoneStatus!.textContent = 'ARRIVAL';
  const mapName = document.querySelector('.map-label strong');
  if (mapName) mapName.textContent = 'City–Forest Perimeter';
  elements.seedHint!.textContent = 'Following the inbound chopper. Prepare for automatic rappel.';
  updateModeUi();
  updateCombatUi();
}

function beginRappel(): void {
  if (gamePhase !== 'arrival' || !chopper) return;
  const offset = [2.4, -2.4, 4.2, -4.2].find((candidate) =>
    navigator.isWalkable(world.spawn.x + candidate, world.spawn.z),
  );
  const dropX = world.spawn.x + (offset ?? 4.2);
  const groundY = terrainHeightAt(world.seed, dropX, world.spawn.z);
  disembarkEnd.set(dropX, groundY, world.spawn.z);
  const ropeTopY = chopper.position.y - 0.25;
  disembarkStart.set(dropX, Math.max(groundY + 2, ropeTopY - 2.2), world.spawn.z);
  player.position.copy(disembarkStart);
  player.visual.position.copy(disembarkStart);
  player.visual.visible = true;
  disembarkElapsed = 0;
  gamePhase = 'disembarking';
  player.setEnabled(false);
  cameraRig.transitionFocus(player.position);
  createRappelRope();
  autoAttackTargetId = undefined;
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.zoneStatus!.textContent = 'RAPPEL';
  elements.seedHint!.textContent = 'Scout descending. Controls unlock on landing.';
  combat.lastMessage = 'Rope down. Scout rappelling to the ground…';
  updateModeUi();
  updateCombatUi();
  canvas!.focus({ preventScroll: true });
}

function beginTakeoff(): void {
  if (gamePhase !== 'extracting') return;
  gamePhase = 'takeoff';
  takeoffElapsed = 0;
  player.setEnabled(false);
  extractionGroundPosition.set(
    player.position.x,
    terrainHeightAt(world.seed, player.position.x, player.position.z),
    player.position.z,
  );
  extractionPlayerStart.copy(extractionGroundPosition);
  if (chopper) {
    extractionHelicopterStart.copy(chopper.position);
    extractionHelicopterTarget.set(
      extractionGroundPosition.x - 2.4,
      extractionGroundPosition.y + 10.5,
      extractionGroundPosition.z - 0.25,
    );
  }
  player.visual.visible = true;
  createRappelRope();
  resolveRunOutcome(saveData, cargo, true);
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'Recovered cargo is secured in storage.'
    : 'Run recovered, but browser storage is unavailable; this session only is saved.';
  elements.zoneStatus!.textContent = 'TAKEOFF';
  elements.nearbyAction!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  if (extractionGuideArrow) extractionGuideArrow.visible = false;
  combat.lastMessage = 'Boarding complete. Chopper taking off with your cargo.';
  updateCombatUi();
}

function finishDeath(): void {
  gamePhase = 'result';
  player.setEnabled(false);
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.resultEyebrow!.textContent = 'RUN LOST';
  elements.resultTitle!.textContent = 'SCOUT DOWN';
  const lost = cargo.gear + cargo.supplies + cargo.fuel;
  const lostMoney = cargo.money;
  elements.deathMessage!.textContent = `Carried cargo lost: ${lost} stored item(s) and ${lostMoney} credits. Items already at camp are safe.`;
  elements.restartButton!.textContent = 'RETURN TO BASE';
  elements.deathOverlay!.removeAttribute('hidden');
  elements.zoneStatus!.textContent = 'LOST';
  releaseMouseCapture();
  releaseLookDrag();
}

function finishSuccess(): void {
  gamePhase = 'result';
  removeRappelRope();
  player.visual.visible = false;
  player.setPosition(extractionGroundPosition.x, extractionGroundPosition.z);
  if (chopper) chopper.visible = false;
  if (extractionMarker) extractionMarker.visible = false;
  elements.extractionGuide!.setAttribute('hidden', '');
  const recoveredWeight = cargo.gear + cargo.supplies + cargo.fuel;
  elements.resultEyebrow!.textContent = 'RUN COMPLETE / CARGO BANKED';
  elements.resultTitle!.textContent = 'SAFE EXTRACTION';
  elements.deathMessage!.textContent = `Recovered ${recoveredWeight} carried item(s) and ${cargo.money} credits. Stored resources are ready for the next deployment.`;
  elements.restartButton!.textContent = 'RETURN TO BASE';
  elements.deathOverlay!.removeAttribute('hidden');
  elements.zoneStatus!.textContent = 'RECOVERED';
  updateBaseUi();
  releaseMouseCapture();
  releaseLookDrag();
}

function returnToBase(): void {
  if (gamePhase !== 'result') return;
  clearRunScene();
  gamePhase = 'base';
  cargo = emptyInventory();
  runElapsed = 0;
  combat.reset();
  createZombieViews();
  zombieGroup.visible = false;
  setCampContext();
  navigationTask = undefined;
  setNavigationStatus('IDLE');
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.baseOverlay!.setAttribute('hidden', '');
  elements.seedHint!.textContent =
    'Welcome back to Wayfarer Camp. Press F near a service or M for the camp terminal.';
  elements.zoneStatus!.textContent = 'BASE';
  updateBaseUi();
  updateCombatUi();
  updateModeUi();
  clearRoute();
}

function addShotEffect(start: Vector3, end: Vector3): void {
  const line = new Line(
    new BufferGeometry().setFromPoints([start, end]),
    new LineBasicMaterial({ color: '#f3d982', transparent: true, opacity: 0.95 }),
  );
  line.frustumCulled = false;
  scene.add(line);
  timedEffects.push({ object: line, remaining: 0.075 });

  const flash = new Mesh(
    new SphereGeometry(0.075, 6, 4),
    new MeshBasicMaterial({ color: '#ffe9a1', transparent: true, opacity: 0.92 }),
  );
  flash.position.copy(start);
  scene.add(flash);
  timedEffects.push({ object: flash, remaining: 0.055 });
}

function addAbilityParticles(color: string, count = 10): void {
  if (atmosphereSettings.reduceMotion) return;
  const position = player.position.clone();
  position.y += 0.55;
  particleBursts.burst(position, color, count, 1.25, 0.48);
}

function createTurretVisual(preview = false): { object: Group; gun: Group } {
  const object = new Group();
  object.name = preview ? 'Turret placement preview' : 'Deployed auto turret';
  const opacity = preview ? 0.48 : 1;
  const material = (color: string, metalness = 0.12) =>
    new MeshStandardMaterial({
      color,
      roughness: 0.72,
      metalness,
      transparent: preview,
      opacity,
      depthWrite: !preview,
      flatShading: true,
    });
  const base = new Mesh(new CylinderGeometry(0.58, 0.68, 0.26, 8), material('#59614d', 0.2));
  base.position.y = 0.13;
  base.castShadow = !preview;
  const collar = new Mesh(new CylinderGeometry(0.22, 0.29, 0.24, 8), material('#a27c48', 0.36));
  collar.position.y = 0.36;
  const mast = new Mesh(new CylinderGeometry(0.14, 0.2, 0.92, 7), material('#4d5547', 0.25));
  mast.position.y = 0.9;
  const gun = new Group();
  gun.position.y = 1.42;
  const housing = new Mesh(new BoxGeometry(0.78, 0.42, 0.62), material('#58634d', 0.28));
  housing.castShadow = !preview;
  const barrelMaterial = material('#343a33', 0.52);
  const barrelA = new Mesh(new CylinderGeometry(0.065, 0.08, 0.9, 6), barrelMaterial);
  barrelA.rotation.x = -Math.PI / 2;
  barrelA.position.set(-0.17, 0.02, -0.63);
  const barrelB = new Mesh(new CylinderGeometry(0.065, 0.08, 0.9, 6), barrelMaterial.clone());
  barrelB.rotation.x = -Math.PI / 2;
  barrelB.position.set(0.17, 0.02, -0.63);
  const sensor = new Mesh(new SphereGeometry(0.12, 8, 6), material('#e2be69', 0.04));
  sensor.position.set(0, 0.27, -0.16);
  gun.add(housing, barrelA, barrelB, sensor);
  object.add(base, collar, mast, gun);
  return { object, gun };
}

function setTurretPreviewColor(valid: boolean): void {
  if (!turretPreview) return;
  const color = valid ? '#a8ca73' : '#d86a50';
  turretPreview.traverse((part) => {
    if (!('material' in part) || !part.material) return;
    const materials = Array.isArray(part.material) ? part.material : [part.material];
    for (const material of materials) {
      if ('color' in material) (material as MeshStandardMaterial).color.set(color);
    }
  });
}

function beginTurretPlacement(): void {
  if (gamePhase !== 'active' || !combat.alive) return;
  if (!combat.canUseAbility(1)) {
    combat.lastMessage = 'Turret is still recharging.';
    updateCombatUi();
    return;
  }
  if (!turretPreview) {
    turretPreview = createTurretVisual(true).object;
    const marker = new Mesh(
      new RingGeometry(0.78, 0.9, 28),
      new MeshBasicMaterial({
        color: '#a8ca73',
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.04;
    turretPreview.add(marker);
    scene.add(turretPreview);
    turretRangeMarker = new Mesh(
      new RingGeometry(turretPlacementRadius - 0.12, turretPlacementRadius, 72),
      new MeshBasicMaterial({
        color: '#b8d984',
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    );
    turretRangeMarker.rotation.x = -Math.PI / 2;
    scene.add(turretRangeMarker);
  }
  updateTurretPlacementPreview();
}

function cancelTurretPlacement(): boolean {
  if (!turretPreview && !turretRangeMarker) return false;
  if (turretPreview) {
    scene.remove(turretPreview);
    disposeTree(turretPreview);
  }
  if (turretRangeMarker) {
    scene.remove(turretRangeMarker);
    disposeTree(turretRangeMarker);
  }
  turretPreview = undefined;
  turretRangeMarker = undefined;
  turretPreviewPoint = undefined;
  turretPreviewValid = false;
  return true;
}

function updateTurretPlacementPreview(): void {
  if (!turretPreview) return;
  if (gamePhase !== 'active' || !combat.alive) {
    cancelTurretPlacement();
    return;
  }
  if (turretRangeMarker) {
    turretRangeMarker.position.set(player.position.x, player.position.y + 0.08, player.position.z);
    const rangeMaterial = turretRangeMarker.material as MeshBasicMaterial;
    rangeMaterial.color.set(turretPreviewValid ? '#b8d984' : '#d88165');
  }
  const aim = currentAimPosition();
  const point = terrainPointAt(aim.x, aim.y);
  if (!point) {
    turretPreview.visible = false;
    turretPreviewPoint = undefined;
    turretPreviewValid = false;
    setTurretPreviewColor(false);
    return;
  }
  turretPreviewPoint = point;
  const insideRange =
    Math.hypot(point.x - player.position.x, point.z - player.position.z) <= turretPlacementRadius;
  const clearOfOtherTurrets = activeTurrets.every(
    (turret) => Math.hypot(point.x - turret.x, point.z - turret.z) >= 2.2,
  );
  turretPreviewValid = insideRange && clearOfOtherTurrets && navigator.isWalkable(point.x, point.z);
  turretPreview.visible = true;
  turretPreview.position.set(point.x, point.y, point.z);
  setTurretPreviewColor(turretPreviewValid);
  if (turretRangeMarker)
    (turretRangeMarker.material as MeshBasicMaterial).color.set(
      turretPreviewValid ? '#b8d984' : '#d88165',
    );
}

function finishTurretPlacement(): void {
  if (!turretPreview) return;
  if (gamePhase !== 'active' || !combat.alive) {
    cancelTurretPlacement();
    return;
  }
  updateTurretPlacementPreview();
  if (!turretPreviewPoint || !turretPreviewValid) {
    cancelTurretPlacement();
    combat.lastMessage = 'Turret needs clear ground inside the placement circle.';
    updateCombatUi();
    return;
  }
  if (!combat.startAbilityCooldown(1, 10)) {
    cancelTurretPlacement();
    combat.lastMessage = 'Turret is still recharging.';
    updateCombatUi();
    return;
  }
  const position = turretPreviewPoint.clone();
  cancelTurretPlacement();
  const { object, gun } = createTurretVisual();
  object.position.copy(position);
  scene.add(object);
  activeTurrets.push({
    object,
    gun,
    x: position.x,
    z: position.z,
    activeRemaining: 5,
    fireRemaining: 0.18,
  });
  combat.lastMessage = 'Auto turret deployed · active for 5 seconds.';
  addAbilityParticles('#b8d984', 8);
  updateCombatUi();
}

function createComicBurstGeometry(radius: number): ShapeGeometry {
  const shape = new Shape();
  const points = 24;
  for (let index = 0; index < points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const distance = radius * (index % 2 === 0 ? 1 : 0.66);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new ShapeGeometry(shape);
}

function addBlastVisual(center: Vector3, radius: number, decalDuration: number): void {
  const ground = new Group();
  ground.name = 'Blast scorch decal';
  ground.position.set(center.x, center.y + 0.035, center.z);
  const scorch = new Mesh(
    new CircleGeometry(radius * 0.78, 36),
    new MeshBasicMaterial({
      color: '#292720',
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );
  scorch.rotation.x = -Math.PI / 2;
  const soot = new Mesh(
    new RingGeometry(radius * 0.78, radius * 0.91, 36),
    new MeshBasicMaterial({ color: '#655343', transparent: true, opacity: 0.5, depthWrite: false }),
  );
  soot.rotation.x = -Math.PI / 2;
  soot.position.y = 0.008;
  ground.add(scorch, soot);
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2 + 0.22;
    const crack = new Mesh(
      new BoxGeometry(radius * 0.38, 0.014, 0.045),
      new MeshBasicMaterial({ color: '#302c25', transparent: true, opacity: 0.8 }),
    );
    crack.position.set(Math.cos(angle) * radius * 0.58, 0.016, Math.sin(angle) * radius * 0.58);
    crack.rotation.y = -angle;
    ground.add(crack);
  }
  scene.add(ground);
  timedEffects.push({ object: ground, remaining: decalDuration });

  const explosion = new Group();
  explosion.name = 'Comic blast and smoke';
  explosion.position.set(center.x, center.y + 0.55, center.z);
  const reducedFlash = atmosphereSettings.reduceFlashes;
  const outer = new Mesh(
    createComicBurstGeometry(radius * 0.74),
    new MeshBasicMaterial({
      color: reducedFlash ? '#a96348' : '#ed6738',
      transparent: true,
      opacity: reducedFlash ? 0.68 : 0.96,
      side: 2,
      depthWrite: false,
    }),
  );
  outer.rotation.x = -Math.PI / 2;
  const inner = new Mesh(
    createComicBurstGeometry(radius * 0.48),
    new MeshBasicMaterial({
      color: reducedFlash ? '#c29b5c' : '#ffd866',
      transparent: true,
      opacity: reducedFlash ? 0.7 : 0.98,
      side: 2,
      depthWrite: false,
    }),
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.025;
  const core = new Mesh(
    new SphereGeometry(radius * 0.31, 8, 6),
    new MeshBasicMaterial({
      color: reducedFlash ? '#b49a71' : '#fff0aa',
      transparent: true,
      opacity: reducedFlash ? 0.58 : 0.96,
    }),
  );
  core.position.y = 0.8;
  const smokeMaterial = new MeshBasicMaterial({
    color: '#656863',
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
  });
  for (let index = 0; index < 7; index += 1) {
    const angle = (index / 7) * Math.PI * 2;
    const puff = new Mesh(new SphereGeometry(radius * 0.22, 7, 5), smokeMaterial);
    puff.position.set(
      Math.cos(angle) * radius * 0.42,
      1.4 + (index % 3) * 0.26,
      Math.sin(angle) * radius * 0.42,
    );
    puff.scale.set(1.15, 1.3, 0.95);
    explosion.add(puff);
  }
  explosion.add(outer, inner, core);
  scene.add(explosion);
  const duration = 1.15;
  timedEffects.push({
    object: explosion,
    remaining: duration,
    duration,
    onUpdate: (progress) => {
      explosion.scale.setScalar(0.55 + progress * 0.7);
      smokeMaterial.opacity = 0.76 * (1 - progress * 0.8);
    },
  });

  if (!atmosphereSettings.reduceMotion) {
    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2;
      const smokePosition = center
        .clone()
        .add(new Vector3(Math.cos(angle) * radius * 0.28, 0.5, Math.sin(angle) * radius * 0.28));
      particleBursts.burst(smokePosition, '#777972', 7, 2.2, 1.3);
    }
    particleBursts.burst(center.clone().add(new Vector3(0, 0.7, 0)), '#dd8050', 8, 3.1, 0.75);
    if (atmosphereSettings.shakeIntensity > 0)
      cameraRig.kickShake(0.14 * atmosphereSettings.shakeIntensity, 0.32);
  }
}

function fireArtilleryAtPointer(): void {
  if (gamePhase !== 'active' || !combat.alive) return;
  const aim = currentAimPosition();
  const target = terrainPointAt(aim.x, aim.y);
  if (!target) {
    combat.lastMessage = 'Artillery needs a visible ground target.';
    updateCombatUi();
    return;
  }
  if (!combat.startAbilityCooldown(2, 20)) {
    combat.lastMessage = 'Artillery is still recharging.';
    updateCombatUi();
    return;
  }
  const mark = new Group();
  mark.name = 'Artillery impact marker';
  mark.position.copy(target).add(new Vector3(0, 0.1, 0));
  const fill = new Mesh(
    new CircleGeometry(artilleryRadius, 48),
    new MeshBasicMaterial({
      color: '#df7046',
      transparent: true,
      opacity: 0.13,
      side: 2,
      depthWrite: false,
    }),
  );
  fill.rotation.x = -Math.PI / 2;
  const ring = new Mesh(
    new RingGeometry(artilleryRadius - 0.16, artilleryRadius, 48),
    new MeshBasicMaterial({
      color: '#f0c36b',
      transparent: true,
      opacity: 0.88,
      side: 2,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  mark.add(fill, ring);
  scene.add(mark);
  timedEffects.push({
    object: mark,
    remaining: 1.2,
    onExpire: () => {
      const affected = combat.damageHostilesInRadius(target, artilleryRadius, 100);
      combat.lastMessage = `Artillery impact · ${affected} hostile(s) caught in the blast.`;
      addBlastVisual(target, artilleryRadius, 10);
      audioFeedback.play('explosion');
      updateCombatUi();
    },
  });
  combat.lastMessage = 'Artillery inbound · impact in 1.2 seconds.';
  updateCombatUi();
}

function throwGrenadeAtPointer(): void {
  if (gamePhase !== 'active' || !combat.alive) return;
  if (grenadeCount <= 0) {
    combat.lastMessage = 'No grenades left in the backpack.';
    updateCombatUi();
    return;
  }
  if (grenadeCooldownRemaining > 0) return;
  const pointer = currentAimPosition();
  const aim = terrainPointAt(pointer.x, pointer.y);
  if (!aim) {
    combat.lastMessage = 'Grenade needs a visible ground target.';
    updateCombatUi();
    return;
  }
  const offset = new Vector3(aim.x - player.position.x, 0, aim.z - player.position.z);
  if (offset.length() > 38) {
    offset.setLength(38);
    aim.set(
      player.position.x + offset.x,
      player.terrainHeight(player.position.x + offset.x, player.position.z + offset.z),
      player.position.z + offset.z,
    );
  }
  const projectile = new Mesh(
    new SphereGeometry(0.18, 8, 6),
    new MeshStandardMaterial({
      color: '#44463d',
      roughness: 0.58,
      metalness: 0.3,
      flatShading: true,
    }),
  );
  projectile.name = 'Thrown grenade';
  const start = player.position.clone().add(new Vector3(0, 1.1, 0));
  projectile.position.copy(start);
  scene.add(projectile);
  const duration = Math.max(0.35, Math.min(1.1, offset.length() / 25));
  grenadeProjectiles.push({ object: projectile, start, target: aim.clone(), elapsed: 0, duration });
  grenadeCount -= 1;
  grenadeCooldownRemaining = 1;
  combat.lastMessage = `Grenade thrown · ${grenadeCount} remaining.`;
  updateCombatUi();
}

function impactGrenade(point: Vector3): void {
  const affected = combat.damageHostilesInRadius(point, grenadeBlastRadius, 100);
  combat.lastMessage = `Grenade blast · ${affected} hostile(s) caught in the explosion.`;
  addBlastVisual(point, grenadeBlastRadius, 5);
  audioFeedback.play('explosion');
  updateCombatUi();
}

function animateFieldAbilities(delta: number): void {
  grenadeCooldownRemaining = Math.max(0, grenadeCooldownRemaining - delta);
  updateTurretPlacementPreview();
  for (let index = grenadeProjectiles.length - 1; index >= 0; index -= 1) {
    const grenade = grenadeProjectiles[index]!;
    grenade.elapsed += delta;
    const progress = Math.min(1, grenade.elapsed / grenade.duration);
    grenade.object.position.lerpVectors(grenade.start, grenade.target, progress);
    grenade.object.position.y +=
      Math.sin(progress * Math.PI) * Math.min(3.4, grenade.start.distanceTo(grenade.target) * 0.09);
    grenade.object.rotation.set(progress * 8, progress * 5, progress * 3);
    if (progress < 1) continue;
    const target = grenade.target.clone();
    scene.remove(grenade.object);
    disposeTree(grenade.object);
    grenadeProjectiles.splice(index, 1);
    impactGrenade(target);
  }

  for (let index = activeTurrets.length - 1; index >= 0; index -= 1) {
    const turret = activeTurrets[index]!;
    turret.activeRemaining = Math.max(0, turret.activeRemaining - delta);
    if (
      turret.activeRemaining > 0 &&
      combat.alive &&
      (gamePhase === 'active' || gamePhase === 'extracting')
    ) {
      turret.fireRemaining -= delta;
      const target = combat.zombies
        .filter(
          (zombie) =>
            zombie.alive &&
            Math.hypot(zombie.position.x - turret.x, zombie.position.z - turret.z) <=
              turretAttackRadius,
        )
        .sort(
          (a, b) =>
            Math.hypot(a.position.x - turret.x, a.position.z - turret.z) -
            Math.hypot(b.position.x - turret.x, b.position.z - turret.z),
        )[0];
      if (target) {
        const dx = target.position.x - turret.x;
        const dz = target.position.z - turret.z;
        turret.gun.rotation.y = Math.atan2(-dx, -dz);
        if (turret.fireRemaining <= 0) {
          turret.fireRemaining = 0.82;
          turret.object.updateMatrixWorld(true);
          const muzzle = turret.object.localToWorld(new Vector3(0.17, 1.48, -1.03));
          const hitPoint = target.position.clone().add(new Vector3(0, 1.05, 0));
          combat.damageHostile(target.id, 22);
          combat.lastMessage = `Auto turret hit ${target.id}.`;
          addShotEffect(muzzle, hitPoint);
          if (!atmosphereSettings.reduceMotion)
            particleBursts.burst(hitPoint, '#edc773', 4, 1.2, 0.2);
          audioFeedback.play('shot');
          updateCombatUi();
        }
      }
    }
    if (turret.activeRemaining <= 0) {
      const collapseDuration = 0.6;
      if (turret.collapseRemaining === undefined) {
        turret.collapseRemaining = collapseDuration;
        combat.lastMessage = 'Auto turret collapsing.';
        updateCombatUi();
      }
      turret.collapseRemaining = Math.max(0, turret.collapseRemaining - delta);
      const scale = Math.max(0.02, turret.collapseRemaining / collapseDuration);
      turret.object.scale.set(1, scale, 1);
      turret.object.rotation.z = (1 - scale) * 0.16;
      if (turret.collapseRemaining <= 0) {
        scene.remove(turret.object);
        disposeTree(turret.object);
        activeTurrets.splice(index, 1);
      }
    }
  }
}

function addDashIndicator(): void {
  const direction = player.dashDirectionVector;
  direction.y = 0;
  if (direction.lengthSq() < 0.001) return;
  direction.normalize();
  const indicator = new Group();
  indicator.position.copy(player.position);
  const ring = new Mesh(
    new RingGeometry(0.42, 0.52, 32),
    new MeshBasicMaterial({
      color: '#f1d37a',
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.14;
  const arrow = new ArrowHelper(direction, new Vector3(0, 0.2, 0), 3.8, '#f1d37a', 0.7, 0.42);
  indicator.add(ring, arrow);
  scene.add(indicator);
  timedEffects.push({ object: indicator, remaining: 0.42 });
}

function animateEffects(delta: number): void {
  for (let index = timedEffects.length - 1; index >= 0; index -= 1) {
    const effect = timedEffects[index];
    effect.remaining -= delta;
    if (effect.duration) effect.onUpdate?.(Math.max(0, 1 - effect.remaining / effect.duration));
    if (effect.remaining > 0) continue;
    scene.remove(effect.object);
    disposeTree(effect.object);
    timedEffects.splice(index, 1);
    effect.onExpire?.();
  }
}

player = new PlayerController(
  world,
  () => switchView(),
  (slot: AbilitySlot) => {
    if (gamePhase !== 'active' && !stressActive) return;
    if (slot === 2) {
      fireArtilleryAtPointer();
      return;
    }
    if (slot !== 3 || !combat.activateAbility(slot)) return;
    audioFeedback.play('adrenaline');
    addAbilityParticles('#e9cb7a');
  },
  () => beginTurretPlacement(),
  () => finishTurretPlacement(),
  () => cancelTurretPlacement(),
  () => {
    if (gamePhase !== 'active' && !stressActive) return false;
    if (cameraRig.mode === 'top-down') updateTopDownDashAim(pointerX, pointerY);
    const started = combat.tryDash();
    if (started) {
      audioFeedback.play('dash');
      if (!atmosphereSettings.reduceMotion)
        cameraRig.kickShake(0.025 * atmosphereSettings.shakeIntensity, 0.17);
    }
    if (started && cameraRig.mode === 'top-down') autoAttackTargetId = undefined;
    return started;
  },
  () => throwGrenadeAtPointer(),
);
scene.add(player.visual);
createCampInteractiveViews();
player.setWorld(campWorld, () => 0);
player.setEnabled(true);
worldGroup.visible = false;
campGroup.visible = true;
cameraRig.setWorld(campWorld);
resetCampCamera();
applyAccessibilityOptions();
setCampAtmosphere();
createZombieViews();
zombieGroup.visible = false;
updateBaseUi();
updateCombatUi();
if (activeAssetDocument) {
  elements.baseMessage!.textContent = `Asset Bench override active for ${activeAssetDocument.asset.assetId}. Start a generated run to preview the edited asset.`;
} else if (assetDocumentLoadError) {
  elements.baseMessage!.textContent = `Saved asset override could not be loaded: ${assetDocumentLoadError}`;
}

elements.seedForm!.addEventListener('submit', (event) => {
  event.preventDefault();
  setSeed(elements.seedInput!.value);
});
elements.settingsButton!.addEventListener('click', openAtmosphereOptions);
elements.settingsClose!.addEventListener('click', closeAtmosphereOptions);
elements.settingsOverlay!.addEventListener('click', (event) => {
  if (event.target === elements.settingsOverlay) closeAtmosphereOptions();
});
elements.settingsOverlay!.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = Array.from(
    elements.settingsOverlay!.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  );
  if (focusable.length === 0) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
elements.timePreference!.addEventListener('change', () => {
  atmosphereSettings.time = elements.timePreference!.value as AtmosphereSettings['time'];
  persistAtmosphereSettings();
});
elements.weatherPreference!.addEventListener('change', () => {
  atmosphereSettings.weather = elements.weatherPreference!.value as AtmosphereSettings['weather'];
  persistAtmosphereSettings();
});
for (const [input, key] of [
  [elements.reduceMotion!, 'reduceMotion'],
  [elements.reduceFlashes!, 'reduceFlashes'],
  [elements.rainVisuals!, 'rainVisuals'],
  [elements.audioCues!, 'audioCues'],
] as const) {
  input.addEventListener('change', () => {
    atmosphereSettings[key] = input.checked;
    applyAccessibilityOptions();
    if (key === 'audioCues' && input.checked) audioFeedback.unlock();
    persistAtmosphereSettings();
  });
}
elements.shakeIntensity!.addEventListener('input', () => {
  atmosphereSettings.shakeIntensity = Number(elements.shakeIntensity!.value) / 100;
  elements.shakeValue!.value = `${elements.shakeIntensity!.value}%`;
  persistAtmosphereSettings();
});
window.addEventListener('pointerdown', () => audioFeedback.unlock(), { passive: true });
window.addEventListener('keydown', () => audioFeedback.unlock());
elements.openHordeLab!.addEventListener('click', openHordeLab);
elements.hordeLabToggle!.addEventListener('click', () => {
  if (elements.hordeLab!.hasAttribute('hidden')) openHordeLab();
  else closeHordeLab();
});
elements.hordeLabClose!.addEventListener('click', closeHordeLab);
elements.hordeReopenLab!.addEventListener('click', openHordeLab);
elements.hordeQuickStop!.addEventListener('click', stopHordeTest);
elements.hordeStart!.addEventListener('click', startHordeTest);
elements.hordeStop!.addEventListener('click', stopHordeTest);
elements.hordeBenchmark!.addEventListener('click', () => void runHordeBenchmark());
elements.hordeCamera!.addEventListener('change', () => {
  if (!stressActive) return;
  const selected = elements.hordeCamera!.value === 'top-down' ? 'top-down' : 'third-person';
  if (selected !== cameraRig.mode) switchView();
});
elements.restartButton!.addEventListener('click', returnToBase);
elements.baseCloseButton!.addEventListener('click', closeBaseTerminal);
elements.startRunButton!.addEventListener('click', startRun);
elements.buySuppliesButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || !buyCampItem(saveData, 'supplies')) return;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'Two medical supplies added to camp storage.'
    : 'Supplies added for this session; browser storage is unavailable.';
  updateBaseUi();
});
elements.buyGearButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || !buyCampItem(saveData, 'gear')) return;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'A field gear kit has been added to camp storage.'
    : 'Gear kit added for this session; browser storage is unavailable.';
  updateBaseUi();
});
elements.sellGearButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || !sellCampItem(saveData, 'gear')) return;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'One spare gear kit sold for 25 credits.'
    : 'Gear kit sold for this session; browser storage is unavailable.';
  updateBaseUi();
  updateCombatUi();
});
elements.sellSuppliesButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || !sellCampItem(saveData, 'supplies')) return;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'One spare medical supply sold for 12 credits.'
    : 'Medical supply sold for this session; browser storage is unavailable.';
  updateBaseUi();
  updateCombatUi();
});
elements.buyCargoButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || !buyCampItem(saveData, 'cargoUpgrade')) return;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'Harness installed. Carrying capacity increased by five units.'
    : 'Harness installed for this session; browser storage is unavailable.';
  updateBaseUi();
});
window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  const isFormControl =
    event.target instanceof HTMLElement &&
    ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName);
  if (event.code === 'Escape' && !elements.settingsOverlay!.hasAttribute('hidden')) {
    event.preventDefault();
    closeAtmosphereOptions();
    return;
  }
  if (event.code === 'KeyO' && !isFormControl) {
    event.preventDefault();
    if (elements.settingsOverlay!.hasAttribute('hidden')) openAtmosphereOptions();
    else closeAtmosphereOptions();
    return;
  }
  if (event.code === 'KeyM' && gamePhase === 'base' && !isFormControl) {
    event.preventDefault();
    if (elements.baseOverlay!.hasAttribute('hidden')) openBaseTerminal();
    else closeBaseTerminal();
    return;
  }
  if (
    event.code === 'Escape' &&
    gamePhase === 'base' &&
    !elements.baseOverlay!.hasAttribute('hidden')
  ) {
    event.preventDefault();
    closeBaseTerminal();
    return;
  }
  if (event.code === 'KeyX' && !event.repeat && gamePhase === 'active') {
    if (
      event.target instanceof HTMLElement &&
      ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)
    )
      return;
    event.preventDefault();
    useCarriedSupply();
    return;
  }
  if (event.code !== 'KeyF' || (gamePhase !== 'active' && gamePhase !== 'base')) return;
  if (
    event.target instanceof HTMLElement &&
    ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)
  )
    return;
  event.preventDefault();
  interactNearest();
});
function pointerNdc(clientX: number, clientY: number): Vector2 {
  return new Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
}

function pointToNdc(event: PointerEvent | MouseEvent): Vector2 {
  return document.pointerLockElement === canvas
    ? new Vector2(0, 0)
    : pointerNdc(event.clientX, event.clientY);
}

function currentAimPosition(): { x: number; y: number } {
  return document.pointerLockElement === canvas
    ? { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    : { x: pointerX, y: pointerY };
}

function terrainPointAt(clientX: number, clientY: number): Vector3 | undefined {
  const floors: Mesh[] = [];
  if (interiorSession) {
    activeWorldVisual().traverse((object) => {
      if (object instanceof Mesh && object.userData.walkableFloor) floors.push(object);
    });
  } else {
    const floor = activeWorldVisual().getObjectByName('Seeded terrain');
    if (floor instanceof Mesh) floors.push(floor);
  }
  if (floors.length === 0) return undefined;
  const raycaster = new Raycaster();
  raycaster.setFromCamera(pointerNdc(clientX, clientY), camera);
  return raycaster.intersectObjects(floors, false)[0]?.point;
}

function updateTopDownDashAim(clientX: number, clientY: number): void {
  if (cameraRig.mode !== 'top-down') return;
  const point = terrainPointAt(clientX, clientY);
  if (point) player.setCursorWorldPoint(point.x, point.z);
}

function findZombieId(object: Object3D | undefined): string | undefined {
  let current = object;
  while (current) {
    if (typeof current.userData.zombieId === 'string') return current.userData.zombieId;
    current = current.parent ?? undefined;
  }
  return undefined;
}

function findInteractiveId(object: Object3D | undefined): string | undefined {
  let current = object;
  while (current) {
    if (typeof current.userData.interactiveId === 'string') return current.userData.interactiveId;
    if (typeof current.userData.buildingId === 'string') return current.userData.buildingId;
    current = current.parent ?? undefined;
  }
  return undefined;
}

function firstWorldOrLivingHit(raycaster: Raycaster) {
  return raycaster
    .intersectObjects([activeWorldVisual(), activeLootVisual(), zombieGroup], true)
    .find((hit) => {
      const zombieId = findZombieId(hit.object);
      return !zombieId || combat.zombies.some((zombie) => zombie.id === zombieId && zombie.alive);
    });
}

function canSeeZombie(zombie: ZombieState): boolean {
  const origin = camera.getWorldPosition(new Vector3());
  const aimPoint = zombie.position.clone().add(new Vector3(0, 1.05, 0));
  const direction = aimPoint.sub(origin);
  const distance = direction.length();
  direction.normalize();
  const raycaster = new Raycaster(origin, direction, 0, distance + 0.05);
  return findZombieId(firstWorldOrLivingHit(raycaster)?.object) === zombie.id;
}

function findAssistedZombie(
  clientX: number,
  clientY: number,
  directHit: Object3D | undefined,
): ZombieState | undefined {
  const directId = findZombieId(directHit);
  const directTarget = combat.zombies.find((zombie) => zombie.id === directId && zombie.alive);
  if (directTarget) return directTarget;

  camera.updateMatrixWorld(true);
  let nearest: ZombieState | undefined;
  let nearestDistanceSquared = enemyAimAssistRadius * enemyAimAssistRadius;
  for (const zombie of combat.zombies) {
    if (!zombie.alive || !canSeeZombie(zombie)) continue;
    const screen = zombie.position
      .clone()
      .add(new Vector3(0, 1.05, 0))
      .project(camera);
    if (screen.z < -1 || screen.z > 1) continue;
    const screenX = ((screen.x + 1) * window.innerWidth) / 2;
    const screenY = ((1 - screen.y) * window.innerHeight) / 2;
    const dx = screenX - clientX;
    const dy = screenY - clientY;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= nearestDistanceSquared) continue;
    nearest = zombie;
    nearestDistanceSquared = distanceSquared;
  }
  return nearest;
}

function updateEnemyHover(clientX: number, clientY: number, overScene: boolean): void {
  const pointerLocked = document.pointerLockElement === canvas;
  if (!overScene && !pointerLocked) {
    canvas!.classList.remove('is-enemy-hovering');
    elements.reticle!.classList.remove('enemy-hover');
    return;
  }
  const ndc = pointerLocked ? new Vector2(0, 0) : pointerNdc(clientX, clientY);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const hit = firstWorldOrLivingHit(raycaster);
  const hoveringEnemy = Boolean(findZombieId(hit?.object));
  canvas!.classList.toggle('is-enemy-hovering', hoveringEnemy);
  elements.reticle!.classList.toggle('enemy-hover', hoveringEnemy);
}

function fireAlongRay(aimPoint: Vector3): boolean {
  if (!combat.alive) return false;
  if (cameraRig.mode === 'top-down') player.faceToward(aimPoint.x, aimPoint.z);
  const muzzle = player.muzzlePosition();
  const shotDirection = aimPoint.clone().sub(muzzle);
  const shotLength = Math.min(90, shotDirection.length());
  if (shotLength < 0.001) return false;
  shotDirection.normalize();
  const weaponRay = new Raycaster(muzzle, shotDirection, 0, shotLength + 0.05);
  const weaponHit = firstWorldOrLivingHit(weaponRay);
  const hitPoint = weaponHit?.point ?? aimPoint;
  const targetId = findZombieId(weaponHit?.object);
  if (!combat.tryFire(targetId)) return false;
  audioFeedback.play('shot');
  if (targetId) {
    const hostile = combat.zombies.find((zombie) => zombie.id === targetId);
    audioFeedback.play('hit');
    if (!atmosphereSettings.reduceMotion)
      particleBursts.burst(
        hitPoint,
        hostile?.alive ? '#e8d18f' : '#cf9870',
        hostile?.alive ? 5 : 8,
        1.9,
        0.24,
      );
    elements.reticle!.classList.add('hit');
    window.setTimeout(() => elements.reticle!.classList.remove('hit'), 120);
  }
  addShotEffect(muzzle, hitPoint);
  for (const zombie of combat.zombies) {
    const visual = zombieViews.get(zombie.id);
    if (visual) syncZombieVisual(visual, zombie);
  }
  updateCombatUi();
  return true;
}

function fireAtZombie(zombie: ZombieState): boolean {
  return fireAlongRay(zombie.position.clone().add(new Vector3(0, 1.05, 0)));
}

function fireAt(event: PointerEvent): void {
  if (stressActive && hordeSimulation) {
    camera.updateMatrixWorld(true);
    const stressRay = new Raycaster();
    stressRay.setFromCamera(pointToNdc(event), camera);
    const stressHit = hordeVisual
      ? stressRay.intersectObjects([worldGroup, hordeVisual], true)[0]
      : undefined;
    if (
      stressHit &&
      stressHit.object === hordeVisual &&
      stressHit.instanceId !== undefined &&
      hordeSimulation.damageAgent(stressHit.instanceId, 50)
    ) {
      const index = stressHit.instanceId;
      const position = new Vector3(
        hordeSimulation.x[index]!,
        hordeSimulation.y[index]! + 0.9,
        hordeSimulation.z[index]!,
      );
      audioFeedback.play('shot');
      audioFeedback.play('hit');
      if (!atmosphereSettings.reduceMotion) particleBursts.burst(position, '#e8d18f', 5, 1.9, 0.24);
      updateHordeUi();
      elements.hordeStatus!.textContent = `Agent #${hordeSimulation.ids[index]} hit · ${hordeSimulation.health[index]} health remaining.`;
    }
    return;
  }
  if (gamePhase === 'base') {
    const viewRay = new Raycaster();
    viewRay.setFromCamera(pointToNdc(event), camera);
    const hit = viewRay.intersectObject(activeWorldVisual(), true)[0];
    const id = findInteractiveId(hit?.object);
    const interactive = id ? activeInteractiveViews().get(id) : undefined;
    if (interactive) interactWith(interactive);
    else if (cameraRig.mode === 'top-down') moveToPointer(event);
    return;
  }
  if (!combat.alive || gamePhase !== 'active') return;
  const ndc = pointToNdc(event);
  const viewRay = new Raycaster();
  viewRay.setFromCamera(ndc, camera);
  const aimHit = firstWorldOrLivingHit(viewRay);
  const interactiveId = findInteractiveId(aimHit?.object);
  const interactive = interactiveId ? activeInteractiveViews().get(interactiveId) : undefined;
  if (interactive) {
    interactWith(interactive);
    return;
  }
  if (cameraRig.mode === 'top-down') {
    const target = findAssistedZombie(event.clientX, event.clientY, aimHit?.object);
    if (target) {
      autoAttackTargetId = target.id;
      clearNavigation('CANCELLED');
      updateRouteLine(true);
      fireAtZombie(target);
      return;
    }
  }
  autoAttackTargetId = undefined;
  const aimPoint = aimHit?.point ?? viewRay.ray.at(70, new Vector3());
  fireAlongRay(aimPoint);
}

function updateAutoAttack(): void {
  if (!autoAttackTargetId) return;
  if (!combat.alive || cameraRig.mode !== 'top-down' || gamePhase !== 'active') {
    autoAttackTargetId = undefined;
    return;
  }
  const target = combat.zombies.find((zombie) => zombie.id === autoAttackTargetId && zombie.alive);
  if (!target) {
    autoAttackTargetId = undefined;
    return;
  }
  if (combat.fireCooldownRemaining <= 0) fireAtZombie(target);
}

function moveToPointer(event: MouseEvent): void {
  if (
    cameraRig.mode !== 'top-down' ||
    (gamePhase !== 'base' && !combat.alive) ||
    (gamePhase !== 'active' && gamePhase !== 'base' && !stressActive)
  )
    return;
  autoAttackTargetId = undefined;
  pointerX = event.clientX;
  pointerY = event.clientY;
  updateTopDownDashAim(pointerX, pointerY);
  const destination = terrainPointAt(event.clientX, event.clientY);
  if (!destination) return;
  moveToLocation(destination.x, destination.z);
}

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Escape') return;
  if (cancelTurretPlacement()) {
    combat.lastMessage = 'Turret placement cancelled.';
    updateCombatUi();
    return;
  }
  if (cameraRig.mode !== 'top-down' || !navigationTask) return;
  event.preventDefault();
  clearNavigation('CANCELLED');
  combat.lastMessage = 'Click-to-move route cancelled.';
  updateCombatUi();
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (suppressPlacementContextMenu) {
    suppressPlacementContextMenu = false;
    return;
  }
  if (turretPreview) {
    cancelTurretPlacement();
    combat.lastMessage = 'Turret placement cancelled.';
    updateCombatUi();
    return;
  }
  moveToPointer(event);
});
canvas.addEventListener(
  'wheel',
  (event) => {
    if (event.ctrlKey) return;
    event.preventDefault();
    const delta =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * window.innerHeight
          : event.deltaY;
    cameraRig.zoomBy(delta);
  },
  { passive: false },
);
document.addEventListener('pointerlockerror', () => {
  elements.seedHint!.textContent =
    'Mouse capture was blocked. Drag on the open scene to look around instead.';
});
document.addEventListener('mousemove', (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  if (document.pointerLockElement === canvas) {
    cameraRig.lookBy(event.movementX, event.movementY);
    updateEnemyHover(window.innerWidth / 2, window.innerHeight / 2, true);
    return;
  }
  if (cameraRig.mode === 'third-person') {
    elements.reticle!.style.left = `${event.clientX}px`;
    elements.reticle!.style.top = `${event.clientY}px`;
  } else {
    updateTopDownDashAim(event.clientX, event.clientY);
  }
  updateEnemyHover(
    event.clientX,
    event.clientY,
    event.target === canvas || canvas.contains(event.target as Node),
  );
});
canvas.addEventListener('pointerdown', (event) => {
  if (turretPreview && (event.button === 0 || event.button === 2)) {
    event.preventDefault();
    cancelTurretPlacement();
    combat.lastMessage = 'Turret placement cancelled.';
    updateCombatUi();
    suppressPlacementContextMenu = event.button === 2;
    return;
  }
  if (event.button !== 0) return;
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  if (cameraRig.mode !== 'third-person' || document.pointerLockElement === canvas) return;
  canvas?.focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (pointerStart?.id === event.pointerId && dragPointerId === undefined) {
    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    if (distance >= 7) {
      dragPointerId = event.pointerId;
      document.querySelector('#game')?.classList.add('is-look-dragging');
      cameraRig.lookBy(event.movementX, event.movementY);
    }
  } else if (dragPointerId === event.pointerId) {
    cameraRig.lookBy(event.movementX, event.movementY);
  }
  if (document.pointerLockElement !== canvas && cameraRig.mode === 'third-person') {
    elements.reticle!.style.left = `${event.clientX}px`;
    elements.reticle!.style.top = `${event.clientY}px`;
  }
});
canvas.addEventListener('pointerup', (event) => {
  if (pointerStart?.id === event.pointerId) {
    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    if (distance < 7) fireAt(event);
    pointerStart = undefined;
  }
  if (dragPointerId === event.pointerId) releaseLookDrag();
});
canvas.addEventListener('pointercancel', () => {
  pointerStart = undefined;
  releaseLookDrag();
});
canvas.addEventListener('lostpointercapture', () => {
  pointerStart = undefined;
  releaseLookDrag();
});
window.addEventListener('blur', () => {
  releaseMouseCapture();
  releaseLookDrag();
  pointerStart = undefined;
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    releaseMouseCapture();
    releaseLookDrag();
    pointerStart = undefined;
  }
});

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  composer.setSize(width, height);
}
window.addEventListener('resize', resize);

let previousTime = performance.now();
let frameCount = 0;
let sampleTime = 0;
let sampleFrames = 0;
let fpsAverage = 0;
let simulationAccumulator = 0;
const fixedStep = 1 / 60;
function animate(now: number): void {
  const frameStartedAt = performance.now();
  const frameIntervalMs = now - previousTime;
  const delta = Math.min(frameIntervalMs / 1000, 0.1);
  frameIntervals.add(frameIntervalMs);
  previousTime = now;
  frameCount += 1;
  if (gamePhase === 'base' && !campInteriorSession) updateCampWalkers(campGroup, delta);
  if (chopperRotor) chopperRotor.rotation.y += delta * 19;
  if (chopperTailRotor) chopperTailRotor.rotation.z += delta * 24;
  if (campChopperRotor) campChopperRotor.rotation.y += delta * 2.2;
  if (campChopperTailRotor) campChopperTailRotor.rotation.z += delta * 2.8;
  if (gamePhase === 'arrival') {
    arrivalElapsed += delta;
    const groundY = terrainHeightAt(world.seed, world.spawn.x, world.spawn.z);
    const approach = Math.min(1, arrivalElapsed / 3.2);
    const easedApproach = 1 - (1 - approach) ** 3;
    if (chopper) {
      chopper.position.set(
        world.spawn.x - 22 * (1 - easedApproach),
        groundY + 18 - 7.5 * easedApproach,
        world.spawn.z + 22 * (1 - easedApproach),
      );
    }
    if (approach >= 1) {
      hoverElapsed += delta;
      if (hoverElapsed >= 0.4) beginRappel();
    }
  }
  if (gamePhase === 'disembarking') {
    disembarkElapsed += delta;
    const progress = Math.min(1, disembarkElapsed / rappelDuration);
    const easedProgress = 1 - (1 - progress) ** 3;
    const groundY = disembarkEnd.y;
    player.position.set(
      disembarkEnd.x,
      disembarkStart.y + (groundY - disembarkStart.y) * easedProgress,
      disembarkEnd.z,
    );
    player.visual.position.copy(player.position);
    if (chopper) {
      const settle = Math.max(0, Math.min(1, (progress - 0.2) / 0.8));
      chopper.position.y = groundY + 10.5 - 7.1 * settle;
      updateRappelRope(
        disembarkEnd.x,
        disembarkEnd.z,
        chopper.position.y - 0.25,
        player.position.y + 1.15,
      );
    }
    if (progress >= 1) {
      player.setPosition(disembarkEnd.x, disembarkEnd.z);
      gamePhase = 'active';
      runElapsed = 0;
      player.setEnabled(true);
      cameraRig.switchMode(player.position);
      removeRappelRope();
      zombieGroup.visible = true;
      if (extractionGuideArrow) extractionGuideArrow.visible = true;
      elements.extractionGuide!.removeAttribute('hidden');
      elements.zoneStatus!.textContent = 'ACTIVE';
      elements.seedHint!.textContent = 'Find a cache, then return to the landing ring.';
      combat.lastMessage =
        'Insertion window · hostiles begin moving in 12 seconds. Search a cache.';
      updateCombatUi();
    }
  }
  if (gamePhase === 'takeoff') {
    takeoffElapsed += delta;
    const groundY = extractionGroundPosition.y;
    const approachEnd = extractionApproachDuration;
    const hoistEnd = approachEnd + extractionHoistDuration;
    const takeoffEnd = hoistEnd + extractionDepartureDuration;
    if (chopper && takeoffElapsed < approachEnd) {
      const progress = takeoffElapsed / approachEnd;
      const eased = progress * progress * (3 - 2 * progress);
      chopper.position.lerpVectors(extractionHelicopterStart, extractionHelicopterTarget, eased);
      player.position.copy(extractionPlayerStart);
      player.visual.position.copy(player.position);
      updateRappelRope(
        chopper.position.x + 2.4,
        chopper.position.z + 0.25,
        chopper.position.y - 0.25,
        groundY + 0.12,
      );
    } else if (chopper && takeoffElapsed < hoistEnd) {
      const progress = Math.min(1, (takeoffElapsed - approachEnd) / extractionHoistDuration);
      const eased = 1 - (1 - progress) ** 3;
      const ropeX = chopper.position.x + 2.4;
      const ropeZ = chopper.position.z + 0.25;
      const ropeTop = chopper.position.y - 0.25;
      player.position.set(ropeX, groundY + (ropeTop - 2.2 - groundY) * eased, ropeZ);
      player.visual.position.copy(player.position);
      updateRappelRope(ropeX, ropeZ, ropeTop, player.position.y + 1.15);
    } else {
      removeRappelRope();
      player.visual.visible = false;
      if (chopper) {
        const progress = Math.min(1, (takeoffElapsed - hoistEnd) / extractionDepartureDuration);
        const eased = progress * progress * (3 - 2 * progress);
        chopper.position.set(
          extractionHelicopterTarget.x + 22 * eased,
          extractionHelicopterTarget.y + 18 * eased,
          extractionHelicopterTarget.z - 22 * eased,
        );
      }
    }
    if (takeoffElapsed >= takeoffEnd) finishSuccess();
  }
  const simulationStartedAt = performance.now();
  simulationAccumulator = Math.min(simulationAccumulator + delta, fixedStep * 8);
  while (simulationAccumulator >= fixedStep) {
    if (stressActive && hordeSimulation) {
      hordeSimulation.tick(fixedStep, player.position.x, player.position.z);
      player.update(fixedStep, cameraRig.mode, cameraRig.yaw, 1);
      updateNavigationProgress();
    } else if (gamePhase === 'base') {
      player.update(fixedStep, cameraRig.mode, cameraRig.yaw, 1);
      updateNavigationProgress();
    } else if (gamePhase === 'active' || gamePhase === 'extracting') {
      combat.tickCooldowns(fixedStep);
      if (gamePhase === 'active') {
        if (!interiorSession) runElapsed += fixedStep;
        const warningTimes = [50, 110];
        const spawnTimes = [90, 150];
        if (
          !interiorSession &&
          reinforcementIndex < 2 &&
          runElapsed >= warningTimes[reinforcementIndex] &&
          !waveWarningShown
        ) {
          waveWarningShown = true;
          combat.lastMessage = `Horde movement detected. Reinforcements may reach this area in ${spawnTimes[reinforcementIndex] - warningTimes[reinforcementIndex]} seconds. Extract while the route is clear.`;
        }
        if (
          !interiorSession &&
          reinforcementIndex < 2 &&
          runElapsed >= spawnTimes[reinforcementIndex]
        ) {
          const added = combat.addReinforcements(2, player.position);
          for (const zombie of added) {
            const visual = createZombieVisual(zombie);
            zombieViews.set(zombie.id, visual);
            zombieGroup.add(visual);
          }
          reinforcementIndex += 1;
          waveWarningShown = false;
        }
      }
      if (player.isDashing && !observedDash && cameraRig.mode === 'top-down') addDashIndicator();
      const wasDashing = player.isDashing;
      if (gamePhase === 'extracting' || interiorSession || runElapsed >= 12)
        combat.tickHostiles(fixedStep, player.position);
      if (!combat.alive) {
        simulationAccumulator = 0;
        break;
      }
      if (gamePhase === 'active') {
        if (cameraRig.mode === 'top-down') {
          dynamicNavigationRefresh -= fixedStep;
          if (dynamicNavigationRefresh <= 0) {
            dynamicNavigationRefresh = 0.3;
            updateDynamicNavigation();
          }
        }
        player.update(
          fixedStep,
          cameraRig.mode,
          cameraRig.yaw,
          combat.adrenalineRemaining > 0 ? 1.5 : 1,
        );
        updateAutoAttack();
        if (wasDashing && !player.isDashing) replanNavigationTask();
        updateNavigationProgress();
        observedDash = player.isDashing;
      } else if (gamePhase === 'extracting') {
        extractingRemaining -= fixedStep;
        const danger = combat.zombies.some(
          (zombie) => zombie.alive && zombie.position.distanceTo(player.position) < 3.5,
        );
        if (danger) {
          gamePhase = 'active';
          player.setEnabled(true);
          combat.lastMessage =
            'Boarding interrupted by a nearby hostile. Clear space and try again.';
        } else if (extractingRemaining <= 0) {
          beginTakeoff();
        }
      }
    }
    simulationAccumulator -= fixedStep;
  }
  simulationFrameTimes.add(performance.now() - simulationStartedAt);
  if (wasAlive && !combat.alive) {
    finishDeath();
  }
  wasAlive = combat.alive;
  for (const zombie of combat.zombies) {
    const visual = zombieViews.get(zombie.id);
    if (visual) syncZombieVisual(visual, zombie);
  }
  updateHordeVisual();
  const visibleHealth =
    stressActive && hordeSimulation ? hordeSimulation.playerHealth : combat.health;
  if (visibleHealth < lastFeedbackHealth) flashDamageFeedback();
  lastFeedbackHealth = visibleHealth;
  cameraFollowTarget.copy(player.position);
  if (chopper && (gamePhase === 'arrival' || gamePhase === 'takeoff'))
    cameraFollowTarget.copy(chopper.position);
  cameraRig.update(delta, cameraFollowTarget);
  const rainCanRender =
    stressActive || (gamePhase !== 'base' && !interiorSession && !campInteriorSession);
  atmosphereRuntime.update(
    delta,
    player.position,
    cameraRig.mode === 'top-down',
    rainCanRender && atmosphereSettings.rainVisuals,
    atmosphereSettings.reduceFlashes,
    rainCanRender,
  );
  particleBursts.update(delta);
  if (cameraRig.mode === 'third-person') {
    player.setFacingDirection(
      cameraRig.currentTarget.x - camera.position.x,
      cameraRig.currentTarget.z - camera.position.z,
    );
  }
  animateFieldAbilities(delta);
  animateEffects(delta);
  if (gamePhase === 'active' || gamePhase === 'extracting') {
    if (!interiorSession) updateExtractionGuide();
    nearbyRefresh += delta;
    if (nearbyRefresh >= 0.12) {
      nearbyRefresh = 0;
      updateNearbyAction();
    }
    if (!interiorSession) {
      lootDrops.forEach((drop, index) => {
        if (drop.collected) return;
        const view = interactiveViews.get(drop.id);
        if (view)
          view.object.position.y =
            terrainHeightAt(world.seed, drop.x, drop.z) +
            0.48 +
            Math.sin(now * 0.003 + index) * 0.08;
      });
    } else {
      let index = 0;
      for (const view of interiorSession.views.values()) {
        if (view.kind !== 'drop') continue;
        view.object.position.y = 0.03 + Math.sin(now * 0.003 + index) * 0.045;
        index += 1;
      }
    }
  }
  routeRefresh += delta;
  updateRouteLine();
  hoverRefresh += delta;
  if (hoverRefresh >= 0.1) {
    hoverRefresh = 0;
    if (document.pointerLockElement === canvas) {
      updateEnemyHover(window.innerWidth / 2, window.innerHeight / 2, true);
    } else {
      updateEnemyHover(pointerX, pointerY, canvas!.matches(':hover'));
    }
  }
  pollGpuFrameQueries();
  renderer.info.reset();
  const gpuQuery = beginGpuFrameQuery();
  composer.render(delta);
  finishGpuFrameQuery(gpuQuery);

  sampleTime += delta;
  sampleFrames += 1;
  if (sampleTime >= 0.5) {
    const fps = sampleFrames / sampleTime;
    fpsAverage = fpsAverage === 0 ? fps : fpsAverage * 0.58 + fps * 0.42;
    elements.fpsValue!.innerHTML = `${Math.round(fpsAverage)} <small>FPS</small>`;
    elements.frameValue!.innerHTML = `${frameIntervals.percentile95().toFixed(1)} <small>MS</small>`;
    sampleFrames = 0;
    sampleTime = 0;
  }
  if (frameCount === 1) {
    elements.diagSeed!.textContent = world.seed;
    updateModeUi();
  }
  if (now - lastUiTime > 120) {
    updateCombatUi();
    updateRenderDiagnosticsUi();
    if (cameraRig.mode === 'third-person') renderControls();
    elements.entityValue!.textContent = String(
      (gamePhase === 'base' ? campGroup.children.length : world.objectCount) +
        (stressActive ? (hordeSimulation?.count ?? 0) : combat.zombies.length) +
        lootGroup.children.length +
        1,
    );
    if (stressActive && !elements.hordeLab!.hasAttribute('hidden')) updateHordeUi();
    updateNavigationTelemetry();
    lastUiTime = now;
  }
  jsFrameTimes.add(performance.now() - frameStartedAt);
  requestAnimationFrame(animate);
}

updateModeUi();
updateCombatUi();
requestAnimationFrame(animate);
