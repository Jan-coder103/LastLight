import { updatePlayerFog } from './world/playerFog';
import { FirePatchPool } from './game/FirePatches';
import { chooseAssistedTarget, extractionArrowVisible } from './game/targeting';
import { seededMissionEvents, residentRoles } from './game/missionObjectives';
import { Follower } from './game/Followers';
import {
  weaponStats,
  refillGrenades,
  isFirearm,
  owns,
  grenadeCapacity,
  sortieRules,
  payForSortie,
  awardObjectives,
  canPurchase,
  skillNodes,
  type Sortie,
} from './game/progression';
import {
  setScoutFirearm,
  setFirstPersonFirearm,
  createPlayerVisual,
  type PlayerVisualRig,
} from './player/playerVisual';
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
  EquirectangularReflectionMapping,
  Fog,
  Group,
  Line,
  LineBasicMaterial,
  LineLoop,
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
  SRGBColorSpace,
  TextureLoader,
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
import { buildCamp, updateCampWalkers, addCampExterior, animateCampGate } from './camp/buildCamp';
import { buyCampItem, campPrices, sellCampItem } from './camp/campEconomy';
import { campEntrances, campServices, createCampWorld, campHeightAt } from './camp/campWorld';
import { CameraRig } from './camera/CameraRig';
import { BloodTrailGate, BloodTrailVisual, impactShakeStrength } from './game/CombatFeedback';
import { CombatSimulation, type ZombieState } from './game/CombatSimulation';
import { ExplosiveBarrelFuses } from './game/ExplosiveBarrel';
import { ExplosiveBarrelVisual } from './game/ExplosiveBarrelVisual';
import { benchmarkCountsForHorde, benchmarkHorde } from './game/HordeBenchmark';
import { HordeSimulation, type HordeSpawnPattern } from './game/HordeSimulation';
import { PerformanceWindow } from './game/PerformanceWindow';
import { isPickupInRange, PickupFeed, PickupPressState } from './game/PickupFeed';
import { openCache, placeLootCaches, type CacheSite, type LootDrop } from './game/loot';
import { InventoryPanel } from './game/InventoryPanel';
import {
  addItem,
  gridRows,
  itemDefinitions,
  removeItem,
  type ItemGrid,
  type ItemId,
} from './game/itemInventory';
import {
  addCargo,
  cargoCapacity,
  cargoWeight,
  emptyInventory,
  loadSave,
  resetBackpackAfterDeath,
  resolveRunOutcome,
  storeSave,
  type ResourceKind,
  type SaveData,
} from './game/saveData';
import {
  createZombieVisual,
  setZombieHitFlash,
  syncZombieVisual,
  ZombieCrowdVisual,
} from './game/zombieVisual';
import { GridNavigator, type NavPoint } from './navigation/GridNavigator';
import { buildInterior } from './interiors/buildInterior';
import { generateInterior, interiorWorld, type InteriorLayout } from './interiors/interiorLayout';
import { playerSpeedMultiplier, PlayerController } from './player/PlayerController';
import { createFirstPersonWeapon } from './player/playerVisual';
import { playerPresentation } from './player/presentation';
import { canRequestPointerLock } from './input/pointerLock';
import { buildWorld, updateWorldLods, animateCoastalWater } from './world/buildWorld';
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
scene.add(camera);
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

const skyLight = new AmbientLight('#c4cfe0', 0.98);
scene.add(skyLight);
const fillLight = new AmbientLight('#7085a3', 0.43);
scene.add(fillLight);
const sun = new DirectionalLight('#ffc48a', 2.28);
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
new TextureLoader().load(new URL('../skybox_hub.png', import.meta.url).href, (texture) => {
  texture.colorSpace = SRGBColorSpace;
  texture.mapping = EquirectangularReflectionMapping;
  atmosphereRuntime.setCampBackground(texture);
});
const particleBursts = new ParticleBursts(scene);
const bloodTrailVisual = new BloodTrailVisual(scene);
const bloodTrailGate = new BloodTrailGate();
const pickupFeedModel = new PickupFeed();
const pickupPressState = new PickupPressState();
const pickupPromptElements = new Map<string, HTMLElement>();

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
  pickupPrompts: document.querySelector<HTMLElement>('#pickup-prompts'),
  pickupFeed: document.querySelector<HTMLElement>('#pickup-feed'),
  hostileCount: document.querySelector<HTMLElement>('#hostile-count'),
  noiseStatus: document.querySelector<HTMLElement>('#noise-status'),
  noiseValue: document.querySelector<HTMLElement>('#noise-value'),
  noiseMeter: document.querySelector<HTMLElement>('#noise-meter'),
  noiseFill: document.querySelector<HTMLElement>('#noise-fill'),
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
let campWorld = createCampWorld();
let gateOpen = false;
let gatePending: boolean | undefined;
const campGroup = buildCamp();
addCampExterior(campGroup);
scene.add(campGroup);
const campChopperRotor = campGroup.getObjectByName('Camp helicopter main rotor');
const campChopperTailRotor = campGroup.getObjectByName('Camp helicopter tail rotor');
let campNavigator = new GridNavigator(campWorld);
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
const firstPersonWeapon = createFirstPersonWeapon();
firstPersonWeapon.visual.visible = false;
camera.add(firstPersonWeapon.visual);
const firstPersonMuzzleWorld = new Vector3();
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
  | 'camp-departure'
  | 'camp-scrap'
  | 'camp-food'
  | 'camp-gate'
  | 'objective'
  | 'survivor';

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

interface WoundedTrailTarget {
  kind: 'combat' | 'field-horde' | 'stress-horde';
  index?: number;
  x: number;
  z: number;
  elapsed: number;
}

interface ExplosiveBarrelRecord {
  object: Object3D;
  visual: ExplosiveBarrelVisual;
}

let gamePhase: GamePhase = 'base';
let stressActive = false;
let hordeSimulation: HordeSimulation | undefined;
let hordeVisual: ZombieCrowdVisual | undefined;
let fieldHorde: HordeSimulation | undefined;
let fieldHordeVisual: ZombieCrowdVisual | undefined;
let noiseRadiusVisual: LineLoop | undefined;
let noiseRadiusRefreshRemaining = 0;
let fieldHordeSpawnRemaining = 2;
let hordeRenderTier = new Uint8Array();
let fieldHordeRenderTier = new Uint8Array();
const fieldHordeCapacity = 10_000;
let hordeSyncMs = 0;
let hordeSyncCount = 0;

function isFieldHordeGameplay(): boolean {
  return Boolean(
    fieldHorde &&
    !stressActive &&
    !interiorSession &&
    gamePhase !== 'base' &&
    gamePhase !== 'result',
  );
}

function emitFieldNoise(intensity: number, x = player.position.x, z = player.position.z): void {
  if (isFieldHordeGameplay()) fieldHorde?.emitNoise(x, z, intensity);
}

let saveData: SaveData = loadSave();
let cargo = emptyInventory();
let runItems: ItemGrid = saveData.storedItems;
let equippedWeapon: ItemId = saveData.progression.activeWeapon;
let lastVisualWeapon: ItemId | undefined;
let sortie: Sortie = 'standard';
let companionHired = false;
let runObjectives: string[] = [];
const followers: { actor: Follower; visual: Group; context?: string }[] = [];
const firePatches = new FirePatchPool<Mesh>();
let lastAttackTargetId: string | undefined;
let lastEarnedPoints = 0;
let attackIntentRemaining = 0;
let fireHeld = false;
let droppedItemNumber = 0;
let inventoryPanel: InventoryPanel;
function activeItems(): ItemGrid {
  return runItems;
}
function syncGrenades(): void {
  grenadeCount = Math.min(
    grenadeCapacity(saveData),
    runItems.items.filter((item) => item.id === 'grenade').length,
  );
}
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
const woundedTrailTargets = new Map<string, WoundedTrailTarget>();
const zombieHitFlashes = new Map<string, number>();
let barrelFuses = new ExplosiveBarrelFuses();
const explosiveBarrels = new Map<string, ExplosiveBarrelRecord>();
let pickupUiRefresh = 0;
let bloodTrailPopulationRefresh = 0;
let bloodTrailCreationEnabled = true;
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
let grenadeCount = grenadeCapacity(saveData);
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
const enemyAimAssistRadius = 68;

function updateModeUi(): void {
  const label =
    cameraRig.mode === 'top-down'
      ? 'TOP-DOWN'
      : cameraRig.mode === 'first-person'
        ? 'FIRST PERSON'
        : 'THIRD PERSON';
  elements.modeName!.textContent = label;
  const game = document.querySelector('#game');
  game?.classList.toggle('is-top-down', cameraRig.mode === 'top-down');
  game?.classList.toggle('is-first-person', cameraRig.mode === 'first-person');
  syncPlayerPresentation();
  if (cameraRig.mode === 'first-person') {
    elements.reticle!.style.left = '50%';
    elements.reticle!.style.top = '50%';
  }
  renderControls();
}

function syncPlayerPresentation(): void {
  if (lastVisualWeapon !== equippedWeapon && isFirearm(equippedWeapon)) {
    setScoutFirearm(player.visual, equippedWeapon);
    setFirstPersonFirearm(firstPersonWeapon, equippedWeapon);
    lastVisualWeapon = equippedWeapon;
  }
  const presentation = playerPresentation(cameraRig.mode, cameraRig.isTransitioning, gamePhase);
  player.visual.visible = presentation.body;
  firstPersonWeapon.visual.visible = presentation.weapon;
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

function showPointerLockFallback(): void {
  elements.seedHint!.textContent =
    'Mouse capture was blocked. Click the open scene to retry, or drag there to look around.';
}

function requestPointerLockForPlay(): boolean {
  if (cameraRig.mode === 'top-down' || document.pointerLockElement === canvas) return true;
  try {
    const request = canvas!.requestPointerLock();
    if (request && typeof request.then === 'function') request.catch(showPointerLockFallback);
    return true;
  } catch {
    showPointerLockFallback();
    return false;
  }
}

document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  document.querySelector('#game')?.classList.toggle('is-pointer-locked', locked);
  if (locked) {
    elements.seedHint!.textContent = 'Mouse captured · press Escape or Ctrl to release.';
    elements.reticle!.style.left = '50%';
    elements.reticle!.style.top = '50%';
  } else if (cameraRig.mode !== 'top-down' && gamePhase !== 'base') {
    elements.seedHint!.textContent =
      'Mouse released · click the open scene to capture again, or drag to look.';
  }
});

function switchView(): void {
  if (gamePhase !== 'active' && gamePhase !== 'base' && !stressActive) return;
  cameraRig.switchMode(player.position);
  if (cameraRig.mode !== 'first-person') elements.hordeCamera!.value = cameraRig.mode;
  autoAttackTargetId = undefined;
  player.clearKeyboardMovement();
  if (cameraRig.mode === 'top-down') releaseLookDrag();
  else requestPointerLockForPlay();
  canvas?.focus({ preventScroll: true });
  updateModeUi();
  if (cameraRig.mode === 'top-down' && navigationTask) replanNavigationTask();
  else updateRouteLine(true);
  if (cameraRig.mode === 'top-down') updateTopDownDashAim(pointerX, pointerY);
}

function releaseMouseCapture(): void {
  cameraRig.setAiming(false);
  fireHeld = false;
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
  const topDown = cameraRig.mode === 'top-down';
  const firstPerson = cameraRig.mode === 'first-person';
  const rows =
    gamePhase === 'base'
      ? topDown
        ? [
            row('RMB', 'Click to move'),
            row('SHIFT', 'Hold to sprint along route'),
            row('ESC', 'Cancel route'),
            row('F', 'Use nearby service / door'),
            row('M', 'Open camp terminal'),
            row('I', 'Open backpack'),
            row('TAB', 'Switch camera'),
          ]
        : [
            row('W A S D', 'Walk around camp'),
            row('SHIFT', 'Hold to sprint'),
            row('DRAG', firstPerson ? 'Look if mouse capture is unavailable' : 'Look around'),
            ...(firstPerson ? [row('CTRL|ESC', 'Release mouse capture')] : []),
            row('F', 'Use nearby service / door'),
            row('M', 'Open camp terminal'),
            row('I', 'Open backpack'),
            row('TAB', 'Switch camera'),
          ]
      : topDown
        ? [
            row('RMB', 'Click to move'),
            row('SHIFT', 'Hold to sprint along route'),
            row('ESC', 'Cancel route'),
            row('LMB', 'Fire at cursor'),
            row(
              'Q',
              `Dash${combat.dashCooldownRemaining > 0 ? ` · ${combat.dashCooldownRemaining.toFixed(1)}s` : ''}`,
            ),
            row('W', 'Hold to preview · release to place · mouse click cancels'),
            row('E', 'Call artillery at cursor'),
            row('R', 'Adrenaline · 2.5× speed for 5 s'),
            row('G', `Throw grenade · ${grenadeCount} carried`),
            row('I', 'Open backpack / equip weapon'),
            row('X', 'Use carried supply'),
            row('F', 'Interact / enter / exit'),
            row('TAB', 'Switch camera'),
          ]
        : [
            row('W A S D', 'Move · camera-relative'),
            row(
              'DRAG',
              firstPerson
                ? 'Look if mouse capture is unavailable'
                : 'Look / aim when mouse capture is unavailable',
            ),
            row('SHIFT', 'Hold to sprint'),
            row('CTRL|ESC', 'Release mouse capture'),
            row('LMB', firstPerson ? 'Fire from the center reticle' : 'Fire equipped weapon'),
            row('RMB', 'Hold to aim · release to restore view'),
            row(
              'Q',
              `Dash${combat.dashCooldownRemaining > 0 ? ` · ${combat.dashCooldownRemaining.toFixed(1)}s` : ''}`,
            ),
            row('1', 'Hold to preview · release to place · mouse click cancels'),
            row('2', 'Call artillery at cursor'),
            row('3', 'Adrenaline · 2.5× speed for 5 s'),
            row('G', `Throw grenade · ${grenadeCount} carried`),
            row('I', 'Open backpack / equip weapon'),
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

function updateNoiseUi(): void {
  const horde = isFieldHordeGameplay() ? fieldHorde : undefined;
  if (!elements.noiseStatus || !elements.noiseValue || !elements.noiseMeter || !elements.noiseFill)
    return;
  elements.noiseStatus.hidden = !horde;
  if (!horde) {
    elements.noiseValue.textContent = 'QUIET · 0 M';
    elements.noiseFill.style.width = '0%';
    elements.noiseMeter.setAttribute('aria-valuenow', '0');
    elements.noiseMeter.setAttribute('aria-valuetext', 'Quiet; no awareness radius');
    return;
  }
  const level = Math.round(horde.noiseLevel * 100);
  const radius = Math.ceil(horde.awarenessRadius);
  const label = level >= 65 ? 'LOUD' : level >= 30 ? 'ELEVATED' : level > 0 ? 'LOW' : 'QUIET';
  elements.noiseValue.textContent = `${label} · ${radius} M`;
  elements.noiseFill.style.width = `${level}%`;
  elements.noiseMeter.setAttribute('aria-valuenow', String(level));
  elements.noiseMeter.setAttribute(
    'aria-valuetext',
    `${label.toLowerCase()}, ${radius} meter infected awareness radius`,
  );
}

function updateCombatUi(): void {
  updateAtmosphereStatus();
  updateNoiseUi();
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
  elements.hostileCount!.textContent = isFieldHordeGameplay()
    ? `${fieldHorde!.livingCount} / ${fieldHorde!.activeCount}`
    : String(combat.livingZombieCount);
  updateActionHud(healthPercent);
  elements.combatMessage!.textContent = combat.lastMessage;
  elements.runClock!.textContent = `${String(Math.floor(runElapsed / 60)).padStart(2, '0')}:${String(Math.floor(runElapsed % 60)).padStart(2, '0')}`;
  elements.runClock!.classList.toggle(
    'pressure-warning',
    gamePhase === 'active' && runElapsed >= 50,
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
    ? `Cargo ${cargoCapacity(saveData)} units · backpack 9.6 kg · upgraded`
    : `Cargo ${cargoCapacity(saveData)} units · backpack 7.2 kg`;
  elements.buySuppliesButton!.disabled = saveData.base.money < campPrices.supplies;
  elements.buyGearButton!.disabled = saveData.base.money < campPrices.gear;
  elements.sellSuppliesButton!.disabled = saveData.base.supplies < 1 || saveData.base.money >= 9999;
  elements.sellGearButton!.disabled = saveData.base.gear < 1 || saveData.base.money >= 9999;
  elements.buyCargoButton!.disabled = false;
  elements.buyCargoButton!.textContent = 'OPEN ARMORY & SKILL TREE';
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
    extractionGuideArrow.visible = extractionArrowVisible(
      runElapsed,
      gamePhase === 'active',
      !interiorSession,
    );
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
  scanExplosiveBarrels();
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
  player.setWorld(campWorld, campHeightAt);
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
  elements.entityValue!.textContent = String(
    world.objectCount + (fieldHorde?.livingCount ?? combat.livingZombieCount) + 1,
  );
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
  player.setWorld(campWorld, campHeightAt);
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
    if (
      'geometry' in object &&
      object.geometry &&
      !(object.geometry as BufferGeometry).userData.sharedZombieGeometry
    )
      geometries.add(object.geometry as BufferGeometry);
    if ('material' in object && object.material) {
      const assigned = object.material as Material | Material[];
      for (const material of Array.isArray(assigned) ? assigned : [assigned]) {
        if (!material.userData.sharedZombieMaterial) materials.add(material);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function disposeCrowdVisual(visual: ZombieCrowdVisual): void {
  for (const mesh of visual.parts) mesh.dispose();
}

function createZombieViews(): void {
  scene.remove(zombieGroup);
  disposeTree(zombieGroup);
  zombieViews.clear();
  zombieGroup = new Group();
  zombieGroup.name = 'Hostiles';
  for (const zombie of combat.zombies) {
    if (!zombie.alive) continue;
    const visual = createZombieVisual(zombie);
    zombieViews.set(zombie.id, visual);
    zombieGroup.add(visual);
  }
  scene.add(zombieGroup);
}

function syncCombatZombieView(zombie: ZombieState): void {
  const visual = zombieViews.get(zombie.id);
  if (!visual) return;
  if (!zombie.alive) {
    setZombieHitFlash(visual, false);
    zombieHitFlashes.delete(zombie.id);
    visual.removeFromParent();
    zombieViews.delete(zombie.id);
    return;
  }
  syncZombieVisual(visual, zombie);
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
    timedEffects.length +
      particleBursts.activeCount +
      bloodTrailVisual.pool.marks.length +
      Number(atmosphereRuntime.isRaining),
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

function syncCrowdVisual(
  horde: HordeSimulation | undefined,
  visual: ZombieCrowdVisual | undefined,
  renderTier: Uint8Array,
): void {
  if (!horde || !visual) return;
  const started = performance.now();
  horde.consumeVisualChanges((index, transform, color) => {
    if (!transform && !color) return;
    const tier = horde.tier[index]!;
    if (color || renderTier[index] !== tier) renderTier[index] = tier;
    if (horde.alive[index] === 0) {
      visual.hideAgent(index);
    } else {
      const healthScale = 0.86 + (horde.health[index]! / 100) * 0.14;
      visual.setAgent(
        index,
        horde.x[index]!,
        horde.y[index]!,
        horde.z[index]!,
        horde.facing[index]!,
        healthScale,
        tier,
      );
    }
    hordeSyncCount += Number(transform);
  });
  visual.consumeDirtyUpdates(({ mesh, matrixIndices, colorIndices }) => {
    if (matrixIndices.length > 0) {
      setInstanceUpdateRanges(mesh.instanceMatrix, matrixIndices, 16, mesh.count);
      mesh.instanceMatrix.needsUpdate = true;
    }
    if (colorIndices.length > 0 && mesh.instanceColor) {
      setInstanceUpdateRanges(mesh.instanceColor, colorIndices, 3, mesh.count);
      mesh.instanceColor.needsUpdate = true;
    }
  });
  hordeSyncMs = performance.now() - started;
}

function updateHordeVisual(): void {
  hordeSyncCount = 0;
  if (stressActive) {
    syncCrowdVisual(hordeSimulation, hordeVisual, hordeRenderTier);
  } else if (fieldHorde) {
    syncCrowdVisual(fieldHorde, fieldHordeVisual, fieldHordeRenderTier);
  }
}

function createNoiseRadiusVisual(): void {
  const segments = 96;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(segments * 3), 3));
  const material = new LineBasicMaterial({
    color: '#d8c27b',
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    toneMapped: false,
  });
  noiseRadiusVisual = new LineLoop(geometry, material);
  noiseRadiusVisual.name = 'Player noise awareness radius';
  noiseRadiusVisual.frustumCulled = false;
  noiseRadiusVisual.renderOrder = 3;
  noiseRadiusVisual.visible = false;
  noiseRadiusRefreshRemaining = 0;
  scene.add(noiseRadiusVisual);
}

function updateNoiseRadiusVisual(delta: number): void {
  const visual = noiseRadiusVisual;
  const horde = isFieldHordeGameplay() ? fieldHorde : undefined;
  if (!visual) return;
  const radius = horde?.awarenessRadius ?? 0;
  visual.visible = Boolean(horde && radius >= 1);
  if (!horde || radius < 1) return;

  noiseRadiusRefreshRemaining -= delta;
  if (noiseRadiusRefreshRemaining > 0) return;
  noiseRadiusRefreshRemaining = 0.08;
  const position = visual.geometry.getAttribute('position') as BufferAttribute;
  const segments = position.count;
  const centerX = player.position.x;
  const centerZ = player.position.z;
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;
    position.setXYZ(index, x, terrainHeightAt(world.seed, x, z) + 0.075, z);
  }
  position.needsUpdate = true;
  visual.geometry.computeBoundingSphere();
  (visual.material as LineBasicMaterial).opacity = 0.1 + horde.noiseLevel * 0.1;
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
  hordeVisual = new ZombieCrowdVisual(count, 'Instanced horde stress visuals');
  scene.add(hordeVisual.group);

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
    scene.remove(hordeVisual.group);
    disposeCrowdVisual(hordeVisual);
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
  group.position.set(
    drop.x,
    (gamePhase === 'base' ? 0 : terrainHeightAt(world.seed, drop.x, drop.z)) + 0.48,
    drop.z,
  );
  const token = new Mesh(
    new BoxGeometry(0.56, 0.56, 0.56),
    new MeshStandardMaterial({
      color: drop.itemId ? itemDefinitions[drop.itemId].color : colors[drop.kind],
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
      color: drop.itemId ? itemDefinitions[drop.itemId].color : colors[drop.kind],
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
  const gate = campGroup.getObjectByName('camp-gate--1');
  if (gate)
    campInteractiveViews.set('camp-gate', {
      id: 'camp-gate',
      kind: 'camp-gate',
      x: 0,
      z: 29,
      object: gate,
    });
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
  cacheSites = placeLootCaches(
    world,
    navigator,
    world.lootZones.reduce((n, zone) => n + zone.cacheCount, 0) * sortieRules[sortie].crates,
  );
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
    new MeshStandardMaterial({
      color: drop.itemId ? itemDefinitions[drop.itemId].color : colors[drop.kind],
      roughness: 0.8,
      flatShading: true,
    }),
  );
  token.position.y = 0.42;
  token.rotation.y = Math.PI / 4;
  token.castShadow = true;
  token.userData.interactiveId = drop.id;
  const marker = new Mesh(
    new RingGeometry(0.42, 0.54, 20),
    new MeshBasicMaterial({
      color: drop.itemId ? itemDefinitions[drop.itemId].color : colors[drop.kind],
      transparent: true,
      opacity: 0.58,
    }),
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

  const savedRoomHostiles =
    interiorHostiles.get(entrance.id) ??
    Array.from({ length: sortieRules[sortie].encounters }, (_, i) =>
      createInteriorHostile(
        `${layout.encounter.id}-${i}`,
        layout.encounter.x + i * 1.5,
        layout.encounter.z,
      ),
    );
  interiorHostiles.set(entrance.id, savedRoomHostiles);
  const savedZombieGroup = zombieGroup;
  const savedZombieViews = new Map(zombieViews);
  scene.remove(savedZombieGroup);
  zombieGroup = new Group();
  zombieGroup.name = `Interior hostiles ${entrance.id}`;
  zombieViews.clear();
  for (const hostile of savedRoomHostiles) {
    if (!hostile.alive) continue;
    const visual = createZombieVisual(hostile);
    zombieViews.set(hostile.id, visual);
    zombieGroup.add(visual);
  }
  scene.add(roomGroup, roomLootGroup, zombieGroup);
  if (fieldHordeVisual) fieldHordeVisual.group.visible = false;
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
  regroupFollowers(interiorSession.returnPosition, interiorSession.entrance.id);
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
  const discarded = [...session.views.values()].flatMap((view) =>
    view.drop?.cacheId === 'discard' && view.drop.itemId ? [view.drop.itemId] : [],
  );
  interiorHostiles.set(session.entrance.id, combat.zombies.slice());
  scene.remove(session.group, session.lootGroup, zombieGroup);
  disposeTree(session.group);
  disposeTree(session.lootGroup);
  disposeTree(zombieGroup);
  zombieGroup = session.outdoorZombieGroup;
  zombieViews.clear();
  for (const [id, view] of session.outdoorZombieViews) zombieViews.set(id, view);
  scene.add(zombieGroup);
  if (fieldHordeVisual) fieldHordeVisual.group.visible = true;
  worldGroup.visible = true;
  lootGroup.visible = true;
  if (chopper) chopper.visible = true;
  if (extractionMarker) extractionMarker.visible = true;
  if (extractionGuideArrow) extractionGuideArrow.visible = runElapsed >= 60;
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
  regroupFollowers(session.layout.exit, undefined);
  interiorSession = undefined;
  for (const id of discarded)
    spawnGroundItem(id, session.returnPosition.x + 1.7, session.returnPosition.z + 0.7);
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

function spawnGroundItem(id: ItemId, x: number, z: number): void {
  const drop: LootDrop = {
    id: `discard-${++droppedItemNumber}`,
    cacheId: 'discard',
    kind: 'gear',
    amount: 1,
    x,
    z,
    collected: false,
    itemId: id,
  };
  const object =
    interiorSession || campInteriorSession
      ? createInteriorLootVisual(drop)
      : createDropVisual(drop);
  const views = activeInteractiveViews();
  (
    interiorSession?.lootGroup ??
    campInteriorSession?.group ??
    (gamePhase === 'base' ? campGroup : lootGroup)
  ).add(object);
  views.set(drop.id, { id: drop.id, kind: 'drop', x: drop.x, z: drop.z, object, drop });
  if (gamePhase !== 'base') lootDrops.push(drop);
}

function dropInventoryItem(id: ItemId): void {
  spawnGroundItem(id, player.position.x + 1.7, player.position.z + 0.7);
  if (id === 'grenade') syncGrenades();
  if (id === equippedWeapon) equippedWeapon = saveData.progression.activeWeapon;
}

function openLoot(view: InteractiveView): void {
  if (interiorSession || view.kind !== 'cache' || !view.cache || openedCacheIds.has(view.id))
    return;
  openedCacheIds.add(view.id);
  lootGroup.remove(view.object);
  disposeTree(view.object);
  interactiveViews.delete(view.id);
  for (const drop of openCache(view.cache, world.seed, sortieRules[sortie].value)) addPickup(drop);
  combat.lastMessage = 'Cache opened. Collect what you can carry.';
  updateCombatUi();
}

function collectLoot(view: InteractiveView): void {
  if (view.kind !== 'drop' || !view.drop || view.drop.collected) return;
  if (view.drop.itemId) {
    const item = addItem(activeItems(), view.drop.itemId, gridRows(saveData.cargoUpgrade));
    if (!item) {
      combat.lastMessage = 'Backpack full. Rearrange items or upgrade it at camp.';
      updateCombatUi();
      return;
    }
    if (gamePhase === 'base') storeSave(saveData);
    if (view.drop.itemId === 'grenade') syncGrenades();
    if (gamePhase === 'active' && view.drop.cacheId !== 'discard') runLootCollected += 1;
    const name = itemDefinitions[view.drop.itemId].name;
    view.drop.collected = true;
    view.object.parent?.remove(view.object);
    disposeTree(view.object);
    activeInteractiveViews().delete(view.id);
    combat.lastMessage = `Picked up ${name}.`;
    addPickupFeedEntry(`Picked up ${name}`);
    inventoryPanel.render();
    updateCombatUi();
    return;
  }
  const accepted = addCargo(cargo, view.drop.kind, view.drop.amount, cargoCapacity(saveData));
  if (accepted <= 0) {
    combat.lastMessage = `Cargo full. Capacity is ${cargoCapacity(saveData)} units.`;
    updateCombatUi();
    return;
  }
  view.drop.amount -= accepted;
  runLootCollected += accepted;
  addPickupFeedEntry(`Picked up ${accepted} ${resourceNames[view.drop.kind]}`);
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
    message:
      'Buy field gear, medical supplies, or a backpack upgrade; sell spare stock for credits.',
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
  const discarded = [...session.views.values()].flatMap((view) =>
    view.drop?.cacheId === 'discard' && view.drop.itemId ? [view.drop.itemId] : [],
  );
  scene.remove(session.group);
  disposeTree(session.group);
  campInteriorSession = undefined;
  for (const id of discarded)
    spawnGroundItem(id, session.returnPosition.x + 1.7, session.returnPosition.z + 0.7);
  campGroup.visible = true;
  setCampAtmosphere();
  navigator = campNavigator;
  player.setWorld(campWorld, campHeightAt);
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
  if (view.kind === 'camp-gate') {
    toggleGate();
    return;
  }
  if (view.kind === 'camp-departure') {
    showSortieChoice();
  } else if (view.kind === 'drop') {
    collectLoot(view);
  } else if (view.kind === 'camp-scrap') {
    inventoryPanel.show('scrap');
    player.setEnabled(false);
  } else if (view.kind === 'camp-food') {
    inventoryPanel.show('food');
    player.setEnabled(false);
  } else if (view.kind === 'camp-shop') {
    inventoryPanel.show('tree');
    player.setEnabled(false);
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
  if (view.kind === 'objective' || view.kind === 'survivor') completeOptionalEvent(view);
  else if (view.kind === 'cache') openLoot(view);
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
            : nearby.kind === 'camp-scrap'
              ? 'F  SCRAP YARD'
              : nearby.kind === 'camp-food'
                ? 'F  FOOD STAND'
                : nearby.kind === 'drop'
                  ? 'F  PICK UP ITEM'
                  : nearby.kind === 'camp-storage'
                    ? 'F  CAMP STORAGE'
                    : nearby.kind === 'camp-operations'
                      ? 'F  OPERATIONS BOARD'
                      : nearby.kind === 'camp-gate'
                        ? 'F  OPEN / CLOSE GATE'
                        : 'F  SORTIE CHOICE'
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
          : nearby.kind === 'objective'
            ? 'F  DISABLE ALARM · 25 CR + FIRST-CLEAR POINT ON EXTRACTION · INFECTED NEARBY'
            : nearby.kind === 'survivor'
              ? `F  FREE ${residentRoles[nearby.id.replace('survivor-', '')]?.name.toUpperCase() ?? 'SURVIVOR'} · ESCORT TO CHOPPER · CAMP CONTRIBUTION ON EXTRACTION`
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
  const danger = hasHostileWithin(player.position.x, player.position.z, 3.5);
  if (danger) {
    combat.lastMessage = 'Hostiles are too close. Clear space before boarding.';
    updateCombatUi();
    return;
  }
  gamePhase = 'extracting';
  fireHeld = false;
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
  let obstacles: Array<{ x: number; z: number; radius: number }>;
  if (isFieldHordeGameplay() && fieldHorde) {
    const candidates: Array<{ x: number; z: number; radius: number; distanceSquared: number }> = [];
    for (let index = 0; index < fieldHorde.activeCount; index += 1) {
      if (fieldHorde.alive[index] !== 1) continue;
      const dx = fieldHorde.x[index]! - player.position.x;
      const dz = fieldHorde.z[index]! - player.position.z;
      const distanceSquared = dx * dx + dz * dz;
      if (distanceSquared <= 3.2 * 3.2 || distanceSquared > 34 * 34) continue;
      candidates.push({
        x: fieldHorde.x[index]!,
        z: fieldHorde.z[index]!,
        radius: 0.8,
        distanceSquared,
      });
    }
    obstacles = candidates
      .sort((a, b) => a.distanceSquared - b.distanceSquared)
      .slice(0, 96)
      .map(({ x, z, radius }) => ({ x, z, radius }));
  } else {
    obstacles = combat.zombies
      .filter((zombie) => zombie.alive && zombie.position.distanceTo(player.position) > 3.2)
      .map((zombie) => ({ x: zombie.position.x, z: zombie.position.z, radius: 0.8 }));
  }
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
  for (const f of followers) {
    scene.remove(f.visual);
    disposeTree(f.visual);
  }
  followers.length = 0;
  for (const visual of firePatches.clear()) {
    scene.remove(visual);
    disposeTree(visual);
  }
  lastAttackTargetId = undefined;
  cancelTurretPlacement();
  for (const id of zombieHitFlashes.keys()) {
    const visual = zombieViews.get(id);
    if (visual) setZombieHitFlash(visual, false);
  }
  zombieHitFlashes.clear();
  woundedTrailTargets.clear();
  bloodTrailVisual.pool.marks.length = 0;
  bloodTrailVisual.update(0);
  for (const prompt of pickupPromptElements.values()) prompt.remove();
  pickupPromptElements.clear();
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
  if (fieldHordeVisual) {
    scene.remove(fieldHordeVisual.group);
    disposeCrowdVisual(fieldHordeVisual);
  }
  fieldHordeVisual = undefined;
  if (noiseRadiusVisual) {
    scene.remove(noiseRadiusVisual);
    noiseRadiusVisual.geometry.dispose();
    (noiseRadiusVisual.material as LineBasicMaterial).dispose();
  }
  noiseRadiusVisual = undefined;
  fieldHorde = undefined;
  fieldHordeRenderTier = new Uint8Array();
  fieldHordeSpawnRemaining = sortieRules[sortie].spawnSeconds;
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

function refreshResidentVisuals(): void {
  const prior = campGroup.getObjectByName('rescued-residents');
  if (prior) {
    campGroup.remove(prior);
    disposeTree(prior);
  }
  const group = new Group();
  group.name = 'rescued-residents';
  for (const [index, id] of saveData.progression.residents.slice(0, 8).entries()) {
    const resident = createPlayerVisual();
    resident.name = id;
    (resident.userData.rig as PlayerVisualRig).rifle.visible = false;
    resident.position.set(-3 + index * 0.7, 0, -5);
    group.add(resident);
  }
  campGroup.add(group);
}

function showSortieChoice(): void {
  if (gamePhase !== 'base' || stressActive) return;
  closeBaseTerminal();
  releaseMouseCapture();
  cameraRig.setAiming(false);
  player.clearKeyboardMovement();
  player.setEnabled(false);
  document.querySelector('.sortie-panel')?.remove();
  const panel = document.createElement('section');
  panel.className = 'sortie-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  const count = world.lootZones.reduce((n, z) => n + z.cacheCount, 0);
  panel.innerHTML = `<h2>CHOPPER DEPLOYMENT</h2><p>Destination seed: ${world.seed.replace(/[<>&"']/g, '')} · Banked fuel: ${saveData.base.fuel}</p><p>Standard: free · ${count} reachable crates · 20 starting hostiles · one reinforcement every 2 seconds.</p><p>High-yield: 2 fuel · about ${count * 2} reachable crates · 1.5× loot value · 40 starting hostiles · one reinforcement each second · double indoor encounters. Enemy health and damage stay the same. Fuel is spent at liftoff and is lost on failure.</p><p id="hire-status">Companion: ${companionHired ? 'HIRED for this run' : '40 credits per run'} · ${saveData.base.money} credits</p>`;
  const button = (text: string, fn: () => void, disabled = false) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.disabled = disabled;
    b.onclick = fn;
    panel.append(b);
    return b;
  };
  const launch = (choice: Sortie) => {
    sortie = choice;
    panel.remove();
    startRun();
  };
  button('Standard sortie · FREE', () => launch('standard'));
  button('High-yield sortie · 2 FUEL', () => launch('high'), saveData.base.fuel < 2);
  button(
    companionHired ? 'Companion hired' : 'Hire companion · 40 CR',
    () => {
      if (companionHired || saveData.base.money < 40) return;
      saveData.base.money -= 40;
      companionHired = true;
      storeSave(saveData);
      showSortieChoice();
    },
    companionHired || saveData.base.money < 40,
  );
  button('Armory / Skill Tree', () => {
    panel.remove();
    inventoryPanel.show('tree');
  });
  button('Cancel', () => {
    panel.remove();
    player.setEnabled(true);
    canvas?.focus();
  });
  document.querySelector('#game')!.append(panel);
  panel.querySelector<HTMLButtonElement>('button')?.focus();
}

function toggleGate(): void {
  if (gatePending !== undefined) return;
  const next = !gateOpen;
  if (!next && Math.abs(player.position.x) < 7 && Math.abs(player.position.z - 29) < 3) {
    elements.seedHint!.textContent = 'Step clear of the gate before closing it.';
    return;
  }
  gatePending = next;
  // Keep the entrance blocked throughout animation; release only when fully open.
  if (!next) setGateNavigation(false);
  elements.seedHint!.textContent = next ? 'Opening camp gate…' : 'Closing camp gate…';
}
function setGateNavigation(open: boolean): void {
  campWorld = createCampWorld(open);
  campNavigator = new GridNavigator(campWorld);
  navigator = campNavigator;
  clearNavigation('IDLE');
  player.setWorld(campWorld, campHeightAt);
  cameraRig.setWorld(campWorld);
}
function updateGate(delta: number): void {
  if (gatePending === undefined) return;
  if (animateCampGate(campGroup, gatePending, delta) > 0.001) return;
  gateOpen = gatePending;
  gatePending = undefined;
  setGateNavigation(gateOpen);
  elements.seedHint!.textContent = gateOpen
    ? 'Gate open · follow the path into the hills. F at the gate to close.'
    : 'Camp perimeter secured.';
}
function addFollower(id: string, armed: boolean, position: Vector3): void {
  if (followers.some((f) => f.actor.id === id)) return;
  const actor = new Follower(id, armed, armed && owns(saveData, 'durability') ? 120 : 80);
  actor.regroup(position);
  const visual = createPlayerVisual();
  visual.name = id;
  (visual.userData.rig as PlayerVisualRig).rifle.visible = armed;
  visual.scale.setScalar(0.92);
  visual.traverse((object) => {
    if (object instanceof Mesh && object.material instanceof MeshStandardMaterial) {
      object.material = object.material.clone();
      object.material.color.lerp(new Color(armed ? '#7c9bb5' : '#bb9d70'), 0.45);
    }
  });
  visual.position.copy(position);
  scene.add(visual);
  followers.push({ actor, visual, context: interiorSession?.entrance.id });
}
function regroupFollowers(
  previous: { x: number; z: number },
  nextContext: string | undefined,
): void {
  for (const follower of followers) {
    if (follower.context === nextContext) continue;
    if (
      follower.actor.armed ||
      Math.hypot(follower.actor.position.x - previous.x, follower.actor.position.z - previous.z) < 8
    ) {
      follower.context = nextContext;
      follower.actor.regroup(player.position);
      follower.visual.position.copy(player.position);
    }
    follower.visual.visible = follower.actor.alive && follower.context === nextContext;
  }
}
function tickFollowers(delta: number): void {
  attackIntentRemaining = Math.max(0, attackIntentRemaining - delta);
  for (const { actor, visual, context } of followers) {
    if (context !== interiorSession?.entrance.id) {
      visual.visible = false;
      continue;
    }
    const before = actor.position.clone();
    actor.tick(
      delta,
      player.position,
      navigator,
      interiorSession ? () => 0 : (x, z) => terrainHeightAt(world.seed, x, z),
      owns(saveData, 'regroup'),
    );
    visual.visible = actor.alive;
    visual.position.copy(actor.position);
    const moved = actor.position.distanceToSquared(before) > 0.00001;
    if (moved)
      visual.rotation.y = Math.atan2(before.x - actor.position.x, before.z - actor.position.z);
    const rig = visual.userData.rig as PlayerVisualRig;
    const swing = moved ? Math.sin(runElapsed * 10) * 0.45 : 0;
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
    if (!actor.alive) continue;
    const close = nearestHostile(
      actor.position.x,
      actor.position.z,
      owns(saveData, 'defense') ? 9 : 6,
    );
    if (close && close.position.distanceTo(actor.position) < 1.8)
      actor.health = Math.max(0, actor.health - delta * 6);
    if (!actor.armed || actor.cooldown > 0) continue;
    const target = actor.defensiveTarget(
      getHostileTarget(
        autoAttackTargetId ?? (attackIntentRemaining > 0 ? lastAttackTargetId : undefined),
      ),
      close,
      owns(saveData, 'defense') ? 9 : 6,
    );
    if (!target) continue;
    const origin = actor.position.clone().add(new Vector3(0, 1.2, 0)),
      end = target.position.clone().add(new Vector3(0, 1, 0));
    const ray = new Raycaster(
      origin,
      end.clone().sub(origin).normalize(),
      0,
      origin.distanceTo(end),
    );
    const hit = ray
      .intersectObject(activeWorldVisual(), true)
      .find((h) => !h.object.userData.walkableFloor);
    if (hit && hit.distance < origin.distanceTo(end) - 0.3) continue;
    damageHostile(target.id, 20);
    actor.cooldown = 0.6;
    visual.rotation.y = Math.atan2(
      actor.position.x - target.position.x,
      actor.position.z - target.position.z,
    );
    addShotEffect(origin, end);
    audioFeedback.playWeapon('handgun');
    // Defensive fire alerts only its local patch; it never emits scout-wide noise.
  }
}
function tickFirePatches(delta: number): void {
  const context = interiorSession?.entrance.id;
  for (const patch of firePatches.patches) patch.payload.visible = patch.context === context;
  const { damage, expired } = firePatches.tick(delta, context);
  for (const point of damage) damageHostilesInRadius(point, 3, 8);
  for (const visual of expired) {
    scene.remove(visual);
    disposeTree(visual);
  }
}
function createOptionalEvents(): void {
  // Cache sites already pass shared walkability and escape-route validation.
  const selected = seededMissionEvents(world.seed, cacheSites, saveData.progression.residents);
  for (const event of selected) {
    const { id, site } = event;
    const index = event.kind === 'alarm' ? 0 : 1;
    const object = index === 0 ? new Group() : createPlayerVisual();
    if (index === 0) {
      const pole = new Mesh(
        new BoxGeometry(0.7, 1.7, 0.6),
        new MeshStandardMaterial({ color: '#b46643' }),
      );
      pole.position.y = 0.85;
      object.add(pole);
    }
    const offsets = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ];
    const offset = offsets.find(
      ([dx, dz]) =>
        navigator.isWalkable(site.x + dx!, site.z + dz!) &&
        navigator.findPath(world.spawn.x, world.spawn.z, site.x + dx!, site.z + dz!).length > 0,
    ) ?? [0, 0];
    const eventX = site.x + offset[0]!,
      eventZ = site.z + offset[1]!;
    object.position.set(eventX, terrainHeightAt(world.seed, eventX, eventZ), eventZ);
    object.userData.interactiveId = id;
    // Events share the accessible cache approach, with no new collision volume.
    lootGroup.add(object);
    interactiveViews.set(id, {
      id,
      kind: index === 0 ? 'objective' : 'survivor',
      x: eventX,
      z: eventZ,
      object,
    });
    if (index === 0) emitFieldNoise(0.5, site.x, site.z);
  }
}
function completeOptionalEvent(view: InteractiveView): void {
  if (view.kind === 'survivor') {
    runLootCollected++;
    const id = view.id.replace('survivor-', '');
    const role = residentRoles[id]!;
    addFollower(id, false, view.object.position);
    combat.lastMessage = `${role.name} · ${role.role} freed. Escort within 9 m of the chopper. ${role.contribution}; death or leaving them behind grants nothing.`;
  } else {
    runObjectives.push('alarm-station');
    runLootCollected++;
    cargo.money += 25;
    fieldHorde?.calmArea(view.x, view.z, 30);
    combat.lastMessage =
      'Alarm disabled · area calming. Extract for 25 credits and a first-clear skill point.';
  }
  view.object.removeFromParent();
  disposeTree(view.object);
  interactiveViews.delete(view.id);
  updateCombatUi();
}

function startRun(): void {
  if (gamePhase !== 'base' || stressActive) return;
  if (!payForSortie(saveData, sortie)) return;
  scanExplosiveBarrels();
  requestPointerLockForPlay();
  inventoryPanel.close();
  if (campInteriorSession) leaveCampBuilding();
  clearRunScene();
  campGroup.visible = false;
  worldGroup.visible = true;
  applyRunAtmosphere(world.seed);
  navigator = fieldNavigator;
  navigator.setDynamicObstacles([]);
  dynamicNavigationRefresh = 0;
  cargo = emptyInventory();
  equippedWeapon = saveData.progression.activeWeapon;
  // Charges are an ability resource and refill without taking loot capacity.
  refillGrenades(saveData, runItems);
  syncGrenades();
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
  runLootCollected = 0;
  combat.maxHealth = owns(saveData, 'health') ? 115 : 100;
  combat.dashRecovery = owns(saveData, 'dash') ? 1.6 : 2;
  combat.reset(0);
  createZombieViews();
  zombieGroup.visible = false;
  fieldHorde = new HordeSimulation(
    fieldHordeCapacity,
    `${world.seed}:field-horde`,
    'ring',
    world,
    new GridNavigator(world),
    sortieRules[sortie].initial,
    { dormantActivation: true },
  );
  fieldHordeVisual = new ZombieCrowdVisual(fieldHordeCapacity, 'Field horde');
  fieldHordeVisual.group.visible = false;
  fieldHordeRenderTier = new Uint8Array(fieldHordeCapacity);
  fieldHordeRenderTier.fill(255);
  scene.add(fieldHordeVisual.group);
  createNoiseRadiusVisual();
  fieldHordeSpawnRemaining = 2;
  player.setWorld(world, (x, z) => terrainHeightAt(world.seed, x, z));
  player.setPosition(world.spawn.x, world.spawn.z);
  player.setEnabled(false);
  player.visual.visible = false;
  player.cancelNavigation();
  cameraRig.setWorld(world);
  createRunLoot();
  runObjectives = [];
  createOptionalEvents();
  if (companionHired) addFollower('hired-companion', true, player.position);
  companionHired = false;
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
  updateModeUi();
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
  player.visual.visible = cameraRig.mode !== 'first-person';
  firstPersonWeapon.visual.visible = cameraRig.mode === 'first-person';
  createRappelRope();
  resolveRunOutcome(saveData, cargo, true);
  const rescued = followers
    .filter(
      (f) =>
        !f.context &&
        !f.actor.armed &&
        f.actor.alive &&
        f.actor.position.distanceTo(player.position) < 9,
    )
    .map((f) => f.actor.id);
  const bonus = awardObjectives(
    saveData,
    [...runObjectives, ...rescued.map((id) => `rescue:${id}`)],
    rescued,
  );
  lastEarnedPoints = 1 + bonus;
  for (const item of runItems.items)
    if (isFirearm(item.id) && !saveData.progression.unlockedWeapons.includes(item.id))
      saveData.progression.unlockedWeapons.push(item.id);
  for (const follower of followers) follower.visual.visible = false;
  saveData.storedItems = runItems;
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
  const lostItems = runItems.items.length;
  runItems = resetBackpackAfterDeath(saveData);
  syncGrenades();
  storeSave(saveData);
  player.setEnabled(false);
  firstPersonWeapon.visual.visible = false;
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.resultEyebrow!.textContent = 'RUN LOST';
  elements.resultTitle!.textContent = 'SCOUT DOWN';
  const lost = cargo.gear + cargo.supplies + cargo.fuel;
  const lostMoney = cargo.money;
  elements.deathMessage!.textContent = `Carried cargo lost: ${lost} resource unit(s), ${lostItems} backpack item(s), and ${lostMoney} credits. Camp resources, permanent firearms, and skill points remain safe. A handgun is reissued; grenades refill at deployment.`;
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
  firstPersonWeapon.visual.visible = false;
  player.setPosition(extractionGroundPosition.x, extractionGroundPosition.z);
  if (chopper) chopper.visible = false;
  if (extractionMarker) extractionMarker.visible = false;
  elements.extractionGuide!.setAttribute('hidden', '');
  const recoveredWeight = cargo.gear + cargo.supplies + cargo.fuel;
  elements.resultEyebrow!.textContent = 'RUN COMPLETE / CARGO BANKED';
  elements.resultTitle!.textContent = 'SAFE EXTRACTION';
  elements.deathMessage!.textContent = `Recovered ${recoveredWeight} carried item(s) and ${cargo.money} credits. Earned ${lastEarnedPoints} skill point(s). Available: ${
    skillNodes
      .filter((n) => canPurchase(saveData, n))
      .slice(0, 3)
      .map((n) => n.name)
      .join(', ') || 'save for your next node'
  }. Camp roster: ${saveData.progression.residents.length}.`;
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
  refreshResidentVisuals();
  cargo = emptyInventory();
  inventoryPanel.close();
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
  if (!combat.startAbilityCooldown(1, owns(saveData, 'setup') ? 8 : 10)) {
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
    activeRemaining: owns(saveData, 'uptime') ? 7 : 5,
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
    const shake = impactShakeStrength(
      atmosphereSettings.reduceMotion,
      atmosphereSettings.shakeIntensity,
    );
    if (shake > 0) cameraRig.kickShake(shake, 0.32);
  }
}

function applySharedGroundExplosion(
  center: Vector3,
  radius: number,
  decalDuration: number,
  label: 'Artillery impact' | 'Grenade blast' | 'Barrel explosion',
): void {
  emitFieldNoise(1, center.x, center.z);
  const affected = damageHostilesInRadius(center, radius, 100);
  combat.lastMessage = `${label} · ${affected} hostile(s) caught in the blast.`;
  addBlastVisual(center, radius, decalDuration);
  audioFeedback.play('explosion');
  updateCombatUi();
}

function scanExplosiveBarrels(): void {
  explosiveBarrels.clear();
  barrelFuses = new ExplosiveBarrelFuses();
  worldGroup.traverse((object) => {
    const id = object.userData.explosiveBarrelId as string | undefined;
    if (!id) return;
    explosiveBarrels.set(id, { object, visual: new ExplosiveBarrelVisual(object) });
  });
}

function explosiveBarrelIdAt(object: Object3D | undefined): string | undefined {
  let current = object;
  while (current) {
    const id = current.userData.explosiveBarrelId as string | undefined;
    if (id) return id;
    current = current.parent ?? undefined;
  }
  return undefined;
}

function triggerExplosiveBarrel(object: Object3D | undefined): boolean {
  const id = explosiveBarrelIdAt(object);
  if (!id || !barrelFuses.trigger(id)) return false;
  combat.lastMessage = 'Explosive barrel hit · fuse started.';
  audioFeedback.play('hit');
  updateCombatUi();
  return true;
}

function updateExplosiveBarrelBlinkMaterials(): void {
  for (const [id, barrel] of explosiveBarrels) {
    barrel.visual.setBlinking(barrelFuses.isBlinking(id));
  }
}

function tickExplosiveBarrels(delta: number): void {
  for (const id of barrelFuses.update(delta)) {
    const barrel = explosiveBarrels.get(id);
    if (!barrel) continue;
    barrel.object.getWorldPosition(cameraFollowTarget);
    const center = new Vector3(
      cameraFollowTarget.x,
      terrainHeightAt(world.seed, cameraFollowTarget.x, cameraFollowTarget.z),
      cameraFollowTarget.z,
    );
    barrel.visual.detonate();
    explosiveBarrels.delete(id);
    applySharedGroundExplosion(center, artilleryRadius, 10, 'Barrel explosion');
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
  emitFieldNoise(0.5);
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
      applySharedGroundExplosion(target, artilleryRadius, 10, 'Artillery impact');
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
  emitFieldNoise(0.28);
  const charge = runItems.items.find((item) => item.id === 'grenade');
  if (charge) removeItem(runItems, charge.uid);
  syncGrenades();
  grenadeCooldownRemaining = 1;
  combat.lastMessage = `Grenade thrown · ${grenadeCount} remaining.`;
  updateCombatUi();
}

function impactGrenade(point: Vector3): void {
  applySharedGroundExplosion(
    point,
    owns(saveData, 'blast') ? 5.4 : grenadeBlastRadius,
    5,
    'Grenade blast',
  );
  if (owns(saveData, 'fire') && firePatches.canAdd(point, interiorSession?.entrance.id)) {
    const visual = new Mesh(
      new CircleGeometry(3, 18),
      new MeshBasicMaterial({
        color: '#dd662a',
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    visual.rotation.x = -Math.PI / 2;
    visual.position.copy(point).add(new Vector3(0, 0.1, 0));
    scene.add(visual);
    firePatches.add(point, interiorSession?.entrance.id, visual);
  }
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
      const target = nearestHostile(
        turret.x,
        turret.z,
        owns(saveData, 'coverage') ? 12 : turretAttackRadius,
      );
      if (target) {
        const dx = target.position.x - turret.x;
        const dz = target.position.z - turret.z;
        turret.gun.rotation.y = Math.atan2(-dx, -dz);
        if (turret.fireRemaining <= 0) {
          turret.fireRemaining = 0.82;
          turret.object.updateMatrixWorld(true);
          const muzzle = turret.object.localToWorld(new Vector3(0.17, 1.48, -1.03));
          const hitPoint = target.position.clone().add(new Vector3(0, 1.05, 0));
          damageHostile(target.id, 22);
          const remainingTarget = getHostileTarget(target.id);
          if (remainingTarget) {
            if (target.hordeIndex !== undefined) {
              fieldHorde?.applyShotKnockback(target.hordeIndex, turret.x, turret.z);
              if (!atmosphereSettings.reduceFlashes)
                fieldHordeVisual?.flashAgent(target.hordeIndex);
              trackShotWoundedEnemy(
                target.id,
                'field-horde',
                remainingTarget.position,
                target.hordeIndex,
              );
            } else {
              combat.applyShotKnockback(target.id, turret.x, turret.z);
              const visual = zombieViews.get(target.id);
              if (!atmosphereSettings.reduceFlashes && visual) {
                setZombieHitFlash(visual, true);
                zombieHitFlashes.set(target.id, 0.14);
              }
              trackShotWoundedEnemy(target.id, 'combat', remainingTarget.position);
            }
          }
          emitFieldNoise(0.52, turret.x, turret.z);
          combat.lastMessage = `Auto turret hit ${target.id}.`;
          addShotEffect(muzzle, hitPoint);
          if (!atmosphereSettings.reduceMotion && !atmosphereSettings.reduceFlashes)
            particleBursts.burst(hitPoint, '#b04c42', 3, 1.35, 0.2);
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
      emitFieldNoise(0.18);
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
inventoryPanel = new InventoryPanel(
  saveData,
  activeItems,
  () => gamePhase === 'base',
  dropInventoryItem,
  () => {
    if (gamePhase === 'base') storeSave(saveData);
    syncGrenades();
    updateBaseUi();
    updateCombatUi();
  },
  (id) => {
    if (!isFirearm(id)) return;
    equippedWeapon = id;
    if (
      gamePhase === 'base' &&
      isFirearm(id) &&
      saveData.progression.unlockedWeapons.includes(id)
    ) {
      saveData.progression.activeWeapon = id;
      storeSave(saveData);
    }
    combat.lastMessage = `${itemDefinitions[id].name} equipped.`;
    updateCombatUi();
  },
  () => {
    if (
      (gamePhase === 'base' || gamePhase === 'active') &&
      elements.baseOverlay!.hasAttribute('hidden')
    )
      player.setEnabled(true);
    canvas?.focus({ preventScroll: true });
  },
);
createCampInteractiveViews();
refreshResidentVisuals();
player.setWorld(campWorld, campHeightAt);
player.setEnabled(true);
worldGroup.visible = false;
campGroup.visible = true;
cameraRig.setWorld(campWorld);
resetCampCamera();
applyAccessibilityOptions();
setCampAtmosphere();
createZombieViews();
zombieGroup.visible = false;
syncGrenades();
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
  while (selected !== cameraRig.mode) switchView();
});
elements.restartButton!.addEventListener('click', returnToBase);
elements.baseCloseButton!.addEventListener('click', closeBaseTerminal);
elements.startRunButton!.addEventListener('click', showSortieChoice);
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
  if (gamePhase !== 'base') return;
  closeBaseTerminal();
  player.setEnabled(false);
  inventoryPanel.show('tree');
});
window.addEventListener(
  'keydown',
  (event) => {
    const typing =
      event.target instanceof HTMLElement &&
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName);
    if (typing) return;
    if (
      event.code === 'KeyI' &&
      !event.repeat &&
      (gamePhase === 'base' || gamePhase === 'active')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (inventoryPanel.open) inventoryPanel.close();
      else {
        if (!elements.baseOverlay!.hasAttribute('hidden')) closeBaseTerminal();
        inventoryPanel.show();
        player.setEnabled(false);
        releaseMouseCapture();
        releaseLookDrag();
      }
      return;
    }
    if (inventoryPanel.open || document.querySelector('.sortie-panel')) {
      if (event.code === 'Escape') {
        inventoryPanel.close();
        const sortiePanel = document.querySelector('.sortie-panel');
        if (sortiePanel) {
          sortiePanel.remove();
          player.setEnabled(true);
          canvas?.focus();
        }
        event.preventDefault();
      }
      event.stopImmediatePropagation();
    }
  },
  true,
);
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
  animatePickupPress(closestInteractive());
  interactNearest();
});
function pointerNdc(clientX: number, clientY: number): Vector2 {
  return new Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
}

function pointToNdc(event: Pick<MouseEvent, 'clientX' | 'clientY'>): Vector2 {
  return cameraRig.mode === 'first-person' || document.pointerLockElement === canvas
    ? new Vector2(0, 0)
    : pointerNdc(event.clientX, event.clientY);
}

function currentAimPosition(): { x: number; y: number } {
  return cameraRig.mode === 'first-person' || document.pointerLockElement === canvas
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

function findZombieId(object: Object3D | undefined, instanceId?: number): string | undefined {
  let current = object;
  while (current) {
    if (typeof current.userData.zombieId === 'string') return current.userData.zombieId;
    if (
      current.userData.hordePart === true &&
      fieldHordeVisual &&
      fieldHorde &&
      instanceId !== undefined
    ) {
      const agentIndex = fieldHordeVisual.agentIndexForInstance(current, instanceId);
      if (
        agentIndex !== undefined &&
        agentIndex < fieldHorde.activeCount &&
        fieldHorde.alive[agentIndex] === 1
      )
        return `field-horde-${fieldHorde.ids[agentIndex]}`;
      return undefined;
    }
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

interface HostileTarget {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  alive: boolean;
  hordeIndex?: number;
}

function fieldHordeIndex(id: string | undefined): number | undefined {
  if (!id || !id.startsWith('field-horde-') || !fieldHorde) return undefined;
  const numericId = Number(id.slice('field-horde-'.length));
  const index = numericId - 1;
  return Number.isInteger(index) && index >= 0 && index < fieldHorde.activeCount
    ? index
    : undefined;
}

function getHostileTarget(id: string | undefined): HostileTarget | undefined {
  const index = fieldHordeIndex(id);
  if (index !== undefined && fieldHorde && fieldHorde.alive[index] === 1) {
    return {
      id: id!,
      position: new Vector3(fieldHorde.x[index]!, fieldHorde.y[index]!, fieldHorde.z[index]!),
      health: fieldHorde.health[index]!,
      maxHealth: 100,
      alive: true,
      hordeIndex: index,
    };
  }
  return combat.zombies.find((zombie) => zombie.id === id && zombie.alive);
}

function damageHostile(id: string, amount: number): boolean {
  const index = fieldHordeIndex(id);
  if (index !== undefined && fieldHorde) {
    return fieldHorde.damageAgent(index, amount);
  }
  return combat.damageHostile(id, amount);
}

function damageHostilesInRadius(center: Vector3, radius: number, amount: number): number {
  if (isFieldHordeGameplay() && fieldHorde)
    return fieldHorde.damageAgentsInRadius(center.x, center.z, radius, amount);
  return combat.damageHostilesInRadius(center, radius, amount);
}

function trackShotWoundedEnemy(
  id: string,
  kind: WoundedTrailTarget['kind'],
  position: Vector3,
  index?: number,
): void {
  woundedTrailTargets.set(id, { kind, index, x: position.x, z: position.z, elapsed: 0 });
}

function updateCombatFeedback(delta: number): void {
  bloodTrailPopulationRefresh -= delta;
  if (bloodTrailPopulationRefresh <= 0) {
    bloodTrailPopulationRefresh = 0.25;
    const population = stressActive
      ? (hordeSimulation?.livingCount ?? 0)
      : (fieldHorde?.livingCount ?? combat.livingZombieCount);
    bloodTrailCreationEnabled = bloodTrailGate.update(population);
  }
  for (const [id, remaining] of zombieHitFlashes) {
    const next = remaining - delta;
    if (next <= 0) {
      const visual = zombieViews.get(id);
      if (visual) setZombieHitFlash(visual, false);
      zombieHitFlashes.delete(id);
    } else zombieHitFlashes.set(id, next);
  }
  hordeVisual?.updateHitFlashes(delta);
  fieldHordeVisual?.updateHitFlashes(delta);

  for (const [id, target] of woundedTrailTargets) {
    let x: number | undefined;
    let z: number | undefined;
    let health = 100;
    let alive = false;
    if (target.kind === 'combat') {
      const zombie = combat.zombies.find((candidate) => candidate.id === id && candidate.alive);
      if (zombie) {
        x = zombie.position.x;
        z = zombie.position.z;
        health = zombie.health;
        alive = zombie.alive;
      }
    } else {
      const horde = target.kind === 'stress-horde' ? hordeSimulation : fieldHorde;
      const index = target.index;
      if (horde && index !== undefined && horde.alive[index] === 1) {
        x = horde.x[index]!;
        z = horde.z[index]!;
        health = horde.health[index]!;
        alive = true;
      }
    }
    if (!alive || health >= 100 || x === undefined || z === undefined) {
      woundedTrailTargets.delete(id);
      continue;
    }
    target.elapsed += delta;
    const moved = Math.hypot(x - target.x, z - target.z);
    if (moved < 0.72 || target.elapsed < 0.22) continue;
    if (bloodTrailCreationEnabled)
      bloodTrailVisual.add(
        new Vector3(x, terrainHeightAt(world.seed, x, z) + 0.035, z),
        Math.atan2(z - target.z, x - target.x),
      );
    target.x = x;
    target.z = z;
    target.elapsed = 0;
  }
}

function addPickupFeedEntry(text: string): void {
  pickupFeedModel.add(text);
  renderPickupFeed();
}

function renderPickupFeed(): void {
  const root = elements.pickupFeed!;
  const anchor = player.position
    .clone()
    .add(new Vector3(0, 1.1, 0))
    .project(camera);
  root.hidden = anchor.z < -1 || anchor.z > 1;
  root.style.left = `${(anchor.x * 0.5 + 0.5) * window.innerWidth - 34}px`;
  root.style.top = `${(-anchor.y * 0.5 + 0.5) * window.innerHeight}px`;
  const entries = pickupFeedModel.visibleEntries;
  const alive = new Set(entries.map((entry) => String(entry.id)));
  for (const child of [...root.children]) {
    if (!alive.has((child as HTMLElement).dataset.entryId ?? '')) child.remove();
  }
  for (const entry of entries) {
    let element = root.querySelector<HTMLElement>(`[data-entry-id="${entry.id}"]`);
    if (!element) {
      element = document.createElement('div');
      element.className = 'pickup-feed-entry';
      element.dataset.entryId = String(entry.id);
      element.textContent = entry.text;
      root.append(element);
    }
    element.style.opacity = String(entry.opacity);
  }
}

function promptLabel(drop: LootDrop): string {
  return drop.itemId
    ? itemDefinitions[drop.itemId].name.toUpperCase()
    : `${drop.amount} ${resourceNames[drop.kind].toUpperCase()}`;
}

function updatePickupPrompts(): void {
  const active = new Set<string>();
  if (
    (gamePhase === 'active' || gamePhase === 'base') &&
    !inventoryPanel?.open &&
    elements.settingsOverlay!.hasAttribute('hidden') &&
    elements.baseOverlay!.hasAttribute('hidden')
  ) {
    camera.updateMatrixWorld(true);
    for (const view of activeInteractiveViews().values()) {
      const drop = view.kind === 'drop' ? view.drop : undefined;
      if (
        !drop ||
        drop.collected ||
        !isPickupInRange(player.position.x, player.position.z, view.x, view.z)
      )
        continue;
      const id = view.id;
      active.add(id);
      let prompt = pickupPromptElements.get(id);
      if (!prompt) {
        prompt = document.createElement('div');
        prompt.className = 'pickup-prompt';
        prompt.dataset.pickupId = id;
        const keycap = document.createElement('span');
        keycap.className = 'pickup-key';
        keycap.textContent = 'F';
        const label = document.createElement('span');
        label.textContent = `PICK UP · ${promptLabel(drop)}`;
        prompt.append(keycap, label);
        elements.pickupPrompts!.append(prompt);
        pickupPromptElements.set(id, prompt);
      }
      prompt.classList.toggle('is-pressed', pickupPressState.isPressed(id));
      const worldPoint = view.object.getWorldPosition(new Vector3());
      worldPoint.y += 1.05;
      const projected = worldPoint.project(camera);
      const visible =
        projected.z >= -1 &&
        projected.z <= 1 &&
        Math.abs(projected.x) <= 1.08 &&
        Math.abs(projected.y) <= 1.08;
      prompt.hidden = !visible;
      if (visible) {
        prompt.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
        prompt.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
      }
    }
  }
  for (const [id, prompt] of pickupPromptElements) {
    if (active.has(id)) continue;
    prompt.remove();
    pickupPromptElements.delete(id);
  }
}

function animatePickupPress(view: InteractiveView | undefined): void {
  if (
    view?.kind === 'drop' &&
    view.drop &&
    !view.drop.collected &&
    isPickupInRange(player.position.x, player.position.z, view.x, view.z)
  )
    pickupPressState.press(view.id);
}

function nearestHostile(x: number, z: number, radius: number): HostileTarget | undefined {
  if (isFieldHordeGameplay() && fieldHorde) {
    const index = fieldHorde.findNearestAgent(x, z, radius);
    if (index === undefined) return undefined;
    return getHostileTarget(`field-horde-${fieldHorde.ids[index]}`);
  }
  let nearest: ZombieState | undefined;
  let nearestDistance = radius * radius;
  for (const zombie of combat.zombies) {
    if (!zombie.alive) continue;
    const dx = zombie.position.x - x;
    const dz = zombie.position.z - z;
    const distance = dx * dx + dz * dz;
    if (distance > nearestDistance) continue;
    nearestDistance = distance;
    nearest = zombie;
  }
  return nearest;
}

function hasHostileWithin(x: number, z: number, radius: number): boolean {
  return nearestHostile(x, z, radius) !== undefined;
}

function findFieldHordeAgentAlongRay(
  raycaster: Raycaster,
  obstructionDistance: number,
): number | undefined {
  if (!isFieldHordeGameplay() || !fieldHorde) return undefined;
  const { origin, direction } = raycaster.ray;
  const maxDistance = Math.min(90, obstructionDistance + 0.55);
  const hitRadiusSquared = 0.72 * 0.72;
  let nearest: number | undefined;
  let nearestAlongRay = maxDistance;
  for (let index = 0; index < fieldHorde.activeCount; index += 1) {
    if (fieldHorde.alive[index] !== 1) continue;
    const centerX = fieldHorde.x[index]!;
    const centerY = fieldHorde.y[index]! + 1;
    const centerZ = fieldHorde.z[index]!;
    const offsetX = centerX - origin.x;
    const offsetY = centerY - origin.y;
    const offsetZ = centerZ - origin.z;
    const alongRay = offsetX * direction.x + offsetY * direction.y + offsetZ * direction.z;
    if (alongRay < 0 || alongRay > nearestAlongRay) continue;
    const closestX = origin.x + direction.x * alongRay;
    const closestY = origin.y + direction.y * alongRay;
    const closestZ = origin.z + direction.z * alongRay;
    const dx = closestX - centerX;
    const dz = closestZ - centerZ;
    if (
      dx * dx + dz * dz > hitRadiusSquared ||
      closestY < fieldHorde.y[index]! + 0.05 ||
      closestY > fieldHorde.y[index]! + 2.05
    )
      continue;
    nearest = index;
    nearestAlongRay = alongRay;
  }
  return nearest;
}

function firstWorldOrLivingHit(raycaster: Raycaster) {
  const objects = [activeWorldVisual(), activeLootVisual(), zombieGroup];
  if (isFieldHordeGameplay() && fieldHordeVisual?.group.visible)
    objects.push(fieldHordeVisual.group);
  return raycaster.intersectObjects(objects, true).find((hit) => {
    const zombieId = findZombieId(hit.object, hit.instanceId);
    if (!zombieId) return true;
    return getHostileTarget(zombieId) !== undefined;
  });
}

function canSeeZombie(zombie: HostileTarget): boolean {
  const origin = camera.getWorldPosition(new Vector3());
  const aimPoint = zombie.position.clone().add(new Vector3(0, 1.05, 0));
  const direction = aimPoint.sub(origin);
  const distance = direction.length();
  direction.normalize();
  const raycaster = new Raycaster(origin, direction, 0, distance + 0.05);
  const hit = firstWorldOrLivingHit(raycaster);
  return findZombieId(hit?.object, hit?.instanceId) === zombie.id;
}

function findAssistedZombie(
  clientX: number,
  clientY: number,
  directHit: Object3D | undefined,
  instanceId?: number,
): HostileTarget | undefined {
  const directTarget = getHostileTarget(findZombieId(directHit, instanceId));
  if (directTarget) return directTarget;
  camera.updateMatrixWorld(true);
  const rect = canvas!.getBoundingClientRect();
  const candidates: { target: HostileTarget; distanceSquared: number }[] = [];
  const consider = (target: HostileTarget) => {
    if (target.position.distanceTo(player.position) > 90) return;
    const screen = target.position
      .clone()
      .add(new Vector3(0, 1.05, 0))
      .project(camera);
    if (screen.z < -1 || screen.z > 1) return;
    const dx = rect.left + ((screen.x + 1) * rect.width) / 2 - clientX;
    const dy = rect.top + ((1 - screen.y) * rect.height) / 2 - clientY;
    if (dx * dx + dy * dy <= enemyAimAssistRadius * enemyAimAssistRadius)
      candidates.push({ target, distanceSquared: dx * dx + dy * dy });
  };
  if (isFieldHordeGameplay() && fieldHorde) {
    for (let i = 0; i < fieldHorde.activeCount; i++) {
      if (fieldHorde.alive[i] !== 1) continue;
      const target = getHostileTarget(`field-horde-${fieldHorde.ids[i]}`);
      if (target) consider(target);
    }
  } else for (const zombie of combat.zombies) if (zombie.alive) consider(zombie);
  return chooseAssistedTarget(undefined, candidates, enemyAimAssistRadius, canSeeZombie);
}

function updateEnemyHover(clientX: number, clientY: number, overScene: boolean): void {
  const pointerLocked = document.pointerLockElement === canvas;
  if (!overScene && !pointerLocked) {
    canvas!.classList.remove('is-enemy-hovering');
    elements.reticle!.classList.remove('enemy-hover');
    return;
  }
  const ndc =
    cameraRig.mode === 'first-person' || pointerLocked
      ? new Vector2(0, 0)
      : pointerNdc(clientX, clientY);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const hit = firstWorldOrLivingHit(raycaster);
  const hoveringEnemy = Boolean(findZombieId(hit?.object, hit?.instanceId));
  canvas!.classList.toggle('is-enemy-hovering', hoveringEnemy);
  elements.reticle!.classList.toggle('enemy-hover', hoveringEnemy);
}

function fireAlongRay(aimPoint: Vector3, preferredHordeIndex?: number): boolean {
  if (!combat.alive) return false;
  const weapon = isFirearm(equippedWeapon) ? equippedWeapon : saveData.progression.activeWeapon;
  const stats = weaponStats(saveData, weapon);
  const damage = stats.damage;
  const cooldown = stats.cooldown;
  if (cameraRig.mode === 'top-down') player.faceToward(aimPoint.x, aimPoint.z);
  let muzzle: Vector3;
  if (cameraRig.mode === 'first-person') {
    camera.updateMatrixWorld(true);
    muzzle = firstPersonWeapon.muzzle.getWorldPosition(firstPersonMuzzleWorld);
  } else {
    muzzle = player.muzzlePosition();
  }
  const shotDirection = aimPoint.clone().sub(muzzle);
  const shotLength = Math.min(stats.range, shotDirection.length());
  if (shotLength < 0.001) return false;
  shotDirection.normalize();
  const weaponRay = new Raycaster(muzzle, shotDirection, 0, shotLength + 0.05);
  const weaponHit = firstWorldOrLivingHit(weaponRay);
  const hitPoint = weaponHit?.point ?? aimPoint;
  const barrelId = explosiveBarrelIdAt(weaponHit?.object);
  const hitHordeIndex =
    weaponHit?.instanceId !== undefined && fieldHordeVisual
      ? fieldHordeVisual.agentIndexForInstance(weaponHit.object, weaponHit.instanceId)
      : undefined;
  const maximumRange = stats.range;
  const preferredTargetInRange =
    preferredHordeIndex !== undefined && fieldHorde
      ? Math.hypot(
          fieldHorde.x[preferredHordeIndex]! - muzzle.x,
          fieldHorde.y[preferredHordeIndex]! + 1 - muzzle.y,
          fieldHorde.z[preferredHordeIndex]! - muzzle.z,
        ) <= maximumRange
      : false;
  const directHordeIndex = preferredTargetInRange ? preferredHordeIndex : hitHordeIndex;
  const targetId =
    directHordeIndex !== undefined && fieldHorde
      ? `field-horde-${fieldHorde.ids[directHordeIndex]}`
      : findZombieId(weaponHit?.object, weaponHit?.instanceId);
  const hordeIndex = isFieldHordeGameplay()
    ? (directHordeIndex ?? fieldHordeIndex(targetId))
    : undefined;
  const targetBeforeHit = getHostileTarget(targetId);
  if (!combat.tryFire(hordeIndex === undefined ? targetId : undefined, damage, cooldown))
    return false;
  emitFieldNoise(weapon === 'shotgun' ? 0.74 : weapon === 'handgun' ? 0.48 : 0.62);
  if (hordeIndex !== undefined && targetId) {
    fieldHorde?.damageAgent(hordeIndex, damage);
    if (fieldHorde?.alive[hordeIndex] === 1) {
      fieldHorde.applyShotKnockback(hordeIndex, player.position.x, player.position.z);
    }
    combat.lastMessage =
      fieldHorde?.alive[hordeIndex] === 1 ? 'Hostile hit.' : 'Hostile eliminated.';
  } else if (targetId && targetBeforeHit) {
    combat.applyShotKnockback(targetId, player.position.x, player.position.z);
  }
  if (barrelId) triggerExplosiveBarrel(weaponHit?.object);
  audioFeedback.playWeapon(weapon);
  lastAttackTargetId = targetId;
  attackIntentRemaining = 1;
  if (targetId) {
    const targetAfterHit = getHostileTarget(targetId);
    const aliveAfterHit = targetAfterHit !== undefined;
    audioFeedback.play('hit');
    if (!atmosphereSettings.reduceMotion && !atmosphereSettings.reduceFlashes)
      particleBursts.burst(
        hitPoint,
        aliveAfterHit ? '#b04c42' : '#87352d',
        aliveAfterHit ? 4 : 6,
        1.45,
        0.22,
      );
    if (aliveAfterHit && targetAfterHit) {
      const hitIndex = targetAfterHit.hordeIndex;
      if (hitIndex !== undefined) {
        if (!atmosphereSettings.reduceFlashes) fieldHordeVisual?.flashAgent(hitIndex);
        trackShotWoundedEnemy(targetId, 'field-horde', targetAfterHit.position, hitIndex);
      } else {
        const visual = zombieViews.get(targetId);
        if (!atmosphereSettings.reduceFlashes && visual) {
          setZombieHitFlash(visual, true);
          zombieHitFlashes.set(targetId, 0.14);
        }
        trackShotWoundedEnemy(targetId, 'combat', targetAfterHit.position);
      }
    }
    elements.reticle!.classList.add('hit');
    window.setTimeout(() => elements.reticle!.classList.remove('hit'), 120);
  }
  addShotEffect(muzzle, hitPoint);
  if (hordeIndex !== undefined) updateHordeVisual();
  else {
    for (const zombie of combat.zombies) syncCombatZombieView(zombie);
  }
  updateCombatUi();
  return true;
}

function fireAtZombie(zombie: HostileTarget): boolean {
  return fireAlongRay(zombie.position.clone().add(new Vector3(0, 1.05, 0)), zombie.hordeIndex);
}

function fireAt(event: Pick<MouseEvent, 'clientX' | 'clientY'>): void {
  if (stressActive && hordeSimulation) {
    camera.updateMatrixWorld(true);
    const stressRay = new Raycaster();
    stressRay.setFromCamera(pointToNdc(event), camera);
    const stressHit = hordeVisual
      ? stressRay.intersectObjects([worldGroup, hordeVisual.group], true)[0]
      : undefined;
    const stressIndex =
      stressHit?.instanceId !== undefined && hordeVisual
        ? hordeVisual.agentIndexForInstance(stressHit.object, stressHit.instanceId)
        : undefined;
    if (
      stressHit &&
      stressHit.object.userData.hordePart === true &&
      stressIndex !== undefined &&
      hordeSimulation.damageAgent(stressIndex, 50)
    ) {
      const index = stressIndex;
      if (hordeSimulation.alive[index] === 1) {
        hordeSimulation.applyShotKnockback(index, player.position.x, player.position.z);
      }
      const position = new Vector3(
        hordeSimulation.x[index]!,
        hordeSimulation.y[index]! + 0.9,
        hordeSimulation.z[index]!,
      );
      audioFeedback.play('shot');
      audioFeedback.play('hit');
      if (!atmosphereSettings.reduceMotion && !atmosphereSettings.reduceFlashes)
        particleBursts.burst(position, '#ad493f', 4, 1.45, 0.22);
      if (hordeSimulation.alive[index] === 1) {
        if (!atmosphereSettings.reduceFlashes) hordeVisual?.flashAgent(index);
        trackShotWoundedEnemy(
          `stress-horde-${hordeSimulation.ids[index]}`,
          'stress-horde',
          position,
          index,
        );
      }
      updateHordeVisual();
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
    const target = findAssistedZombie(
      event.clientX,
      event.clientY,
      aimHit?.object,
      aimHit?.instanceId,
    );
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
  const mappedAimHordeIndex =
    aimHit?.instanceId !== undefined && fieldHordeVisual
      ? fieldHordeVisual.agentIndexForInstance(aimHit.object, aimHit.instanceId)
      : undefined;
  const aimHordeIndex =
    findFieldHordeAgentAlongRay(viewRay, aimHit?.distance ?? 90) ?? mappedAimHordeIndex;
  fireAlongRay(aimPoint, aimHordeIndex);
}

function updateAutoAttack(): void {
  if (!autoAttackTargetId) return;
  if (!combat.alive || cameraRig.mode !== 'top-down' || gamePhase !== 'active') {
    autoAttackTargetId = undefined;
    return;
  }
  const target = getHostileTarget(autoAttackTargetId);
  if (!target) {
    autoAttackTargetId = undefined;
    return;
  }
  if (
    combat.fireCooldownRemaining <= 0 &&
    target.position.distanceTo(player.position) <=
      weaponStats(
        saveData,
        isFirearm(equippedWeapon) ? equippedWeapon : saveData.progression.activeWeapon,
      ).range &&
    canSeeZombie(target)
  )
    fireAtZombie(target);
}

function moveToPointer(event: Pick<MouseEvent, 'clientX' | 'clientY'>): void {
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
  if (
    document.pointerLockElement === canvas &&
    (event.code === 'ControlLeft' || event.code === 'ControlRight') &&
    !event.repeat
  ) {
    event.preventDefault();
    releaseMouseCapture();
    return;
  }
  if (event.code === 'Escape' && document.pointerLockElement === canvas) {
    releaseMouseCapture();
    return;
  }
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
document.addEventListener('pointerlockerror', showPointerLockFallback);
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
  } else if (cameraRig.mode === 'top-down') {
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
  if (event.button === 2 && cameraRig.mode !== 'top-down') {
    cameraRig.setAiming(true);
    event.preventDefault();
    return;
  }
  if (event.button !== 0) return;
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  if (cameraRig.mode === 'top-down') return;
  if (document.pointerLockElement === canvas) {
    if (gamePhase === 'active') {
      fireHeld = true;
      fireAt(event);
    }
    return;
  }
  if (canRequestPointerLock(cameraRig.mode, event.target === canvas, false)) {
    requestPointerLockForPlay();
    return;
  }
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
window.addEventListener('pointerup', (event) => {
  if (event.button === 2) cameraRig.setAiming(false);
  if (event.button === 0) fireHeld = false;
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
  cameraRig.setAiming(false);
  pointerStart = undefined;
  fireHeld = false;
  releaseLookDrag();
});
canvas.addEventListener('lostpointercapture', () => {
  pointerStart = undefined;
  fireHeld = false;
  releaseLookDrag();
});
window.addEventListener('blur', () => {
  cameraRig.setAiming(false);
  releaseMouseCapture();
  releaseLookDrag();
  pointerStart = undefined;
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    cameraRig.setAiming(false);
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
  if (gamePhase === 'base' && !campInteriorSession) {
    updateGate(delta);
    updateWorldLods(campGroup, player.position, 0);
  }
  if (gamePhase === 'base' && !campInteriorSession)
    updateCampWalkers(campGroup, delta, player.position);
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
      updateModeUi();
      removeRappelRope();
      zombieGroup.visible = true;
      if (fieldHordeVisual) fieldHordeVisual.group.visible = true;
      if (extractionGuideArrow) extractionGuideArrow.visible = runElapsed >= 60;
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
    if (inventoryPanel.open) {
      // The backpack pauses the field encounter while arranging items.
    } else if (stressActive && hordeSimulation) {
      hordeSimulation.tick(fixedStep, player.position.x, player.position.z);
      player.update(fixedStep, cameraRig.mode, cameraRig.yaw, 1);
      updateNavigationProgress();
    } else if (gamePhase === 'base') {
      player.update(fixedStep, cameraRig.mode, cameraRig.yaw, 1);
      updateNavigationProgress();
    } else if (gamePhase === 'active' || gamePhase === 'extracting') {
      combat.tickCooldowns(fixedStep);
      if (!interiorSession) tickExplosiveBarrels(fixedStep);
      if (gamePhase === 'active') {
        if (!interiorSession) runElapsed += fixedStep;
      }
      if (!interiorSession && fieldHorde) {
        fieldHordeSpawnRemaining -= fixedStep;
        if (fieldHordeSpawnRemaining <= 0) {
          const spawned = fieldHorde.spawnOne(player.position.x, player.position.z);
          fieldHordeSpawnRemaining += sortieRules[sortie].spawnSeconds;
          if (spawned !== undefined && spawned % 15 === 0) {
            combat.lastMessage = 'Distant movement · more infected are closing in.';
          }
        }
      }
      if (player.isDashing && !observedDash && cameraRig.mode === 'top-down') addDashIndicator();
      const wasDashing = player.isDashing;
      if (gamePhase === 'extracting' || interiorSession || runElapsed >= 12) {
        if (isFieldHordeGameplay() && fieldHorde) {
          const previousHits = fieldHorde.totalPlayerHits;
          fieldHorde.tick(fixedStep, player.position.x, player.position.z);
          const hitsTaken = fieldHorde.totalPlayerHits - previousHits;
          for (let hit = 0; hit < hitsTaken; hit += 1) combat.damagePlayer(8);
          fieldHorde.playerHealth = combat.health;
        } else {
          combat.tickHostiles(fixedStep, player.position);
        }
      }
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
        const previousPlayerX = player.position.x;
        const previousPlayerZ = player.position.z;
        player.update(
          fixedStep,
          cameraRig.mode,
          cameraRig.yaw,
          playerSpeedMultiplier(combat.adrenalineRemaining > 0, player.sprintHeld) *
            (owns(saveData, 'speed') ? 1.08 : 1),
        );
        const movedX = player.position.x - previousPlayerX;
        const movedZ = player.position.z - previousPlayerZ;
        if (movedX * movedX + movedZ * movedZ > 0.0001 && (fieldHorde?.awarenessRadius ?? 0) < 10) {
          emitFieldNoise((player.sprintHeld ? 20 : 10) / 140);
        }
        if (fireHeld && cameraRig.mode !== 'top-down' && combat.fireCooldownRemaining <= 0)
          fireAt({ clientX: pointerX, clientY: pointerY });
        updateAutoAttack();
        tickFollowers(fixedStep);
        tickFirePatches(fixedStep);
        if (!interiorSession) {
          const alarm = interactiveViews.get('alarm-station');
          if (alarm) fieldHorde?.emitNoise(alarm.x, alarm.z, 0.35);
        }
        if (wasDashing && !player.isDashing) replanNavigationTask();
        updateNavigationProgress();
        observedDash = player.isDashing;
      } else if (gamePhase === 'extracting') {
        extractingRemaining -= fixedStep;
        const danger = hasHostileWithin(player.position.x, player.position.z, 3.5);
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
  updateCombatFeedback(delta);
  if (wasAlive && !combat.alive) {
    finishDeath();
  }
  wasAlive = combat.alive;
  for (const zombie of combat.zombies) syncCombatZombieView(zombie);
  updateHordeVisual();
  const visibleHealth =
    stressActive && hordeSimulation ? hordeSimulation.playerHealth : combat.health;
  if (visibleHealth < lastFeedbackHealth) flashDamageFeedback();
  lastFeedbackHealth = visibleHealth;
  cameraFollowTarget.copy(player.position);
  if (chopper && (gamePhase === 'arrival' || gamePhase === 'takeoff'))
    cameraFollowTarget.copy(chopper.position);
  updatePlayerFog(player.position, worldGroup.visible);
  cameraRig.update(delta, cameraFollowTarget);
  syncPlayerPresentation();
  if (worldGroup.visible) updateWorldLods(worldGroup, player.position, delta);
  if (worldGroup.visible) animateCoastalWater(worldGroup, now / 1000);
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
  bloodTrailVisual.update(delta);
  pickupPressState.update(delta);
  updateExplosiveBarrelBlinkMaterials();
  if (cameraRig.mode !== 'top-down') {
    player.setFacingDirection(
      cameraRig.currentTarget.x - camera.position.x,
      cameraRig.currentTarget.z - camera.position.z,
    );
  }
  animateFieldAbilities(delta);
  updateNoiseRadiusVisual(delta);
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
  updatePickupPrompts();
  pickupFeedModel.update(delta);
  renderPickupFeed();
  pickupUiRefresh += delta;
  if (pickupUiRefresh >= 0.12) {
    pickupUiRefresh = 0;
    renderPickupFeed();
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
    if (cameraRig.mode !== 'top-down') renderControls();
    elements.entityValue!.textContent = String(
      (gamePhase === 'base' ? campGroup.children.length : world.objectCount) +
        (stressActive
          ? (hordeSimulation?.count ?? 0)
          : (fieldHorde?.livingCount ?? combat.zombies.length)) +
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
