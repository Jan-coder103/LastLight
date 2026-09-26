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
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  Object3D,
  type Material,
} from 'three';
import type { AbilitySlot } from './input/controlMap';
import { installAssetDocumentOverride } from './assets/catalog';
import { readStoredAssetDocument, type AssetDocument } from './assets/assetDocument';
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

const elements = {
  seedForm: document.querySelector<HTMLFormElement>('#seed-form'),
  seedInput: document.querySelector<HTMLInputElement>('#seed-input'),
  seedHint: document.querySelector<HTMLElement>('#seed-hint'),
  modeName: document.querySelector<HTMLElement>('#view-name'),
  lockButton: document.querySelector<HTMLButtonElement>('#lock-button'),
  lockLabel: document.querySelector<HTMLElement>('#lock-label'),
  viewButton: document.querySelector<HTMLButtonElement>('#view-button'),
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
  healthValue: document.querySelector<HTMLElement>('#health-value'),
  healthFill: document.querySelector<HTMLElement>('#health-fill'),
  combatMessage: document.querySelector<HTMLElement>('#combat-message'),
  abilityStatus: document.querySelector<HTMLElement>('#ability-status'),
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
  baseMessage: document.querySelector<HTMLElement>('#base-message'),
  runCount: document.querySelector<HTMLElement>('#run-count'),
  bankGear: document.querySelector<HTMLElement>('#bank-gear'),
  bankSupplies: document.querySelector<HTMLElement>('#bank-supplies'),
  bankMoney: document.querySelector<HTMLElement>('#bank-money'),
  bankFuel: document.querySelector<HTMLElement>('#bank-fuel'),
  harnessStatus: document.querySelector<HTMLElement>('#harness-status'),
  buySuppliesButton: document.querySelector<HTMLButtonElement>('#buy-supplies-button'),
  buyGearButton: document.querySelector<HTMLButtonElement>('#buy-gear-button'),
  buyCargoButton: document.querySelector<HTMLButtonElement>('#buy-cargo-button'),
  startRunButton: document.querySelector<HTMLButtonElement>('#start-run-button'),
  arrivalOverlay: document.querySelector<HTMLElement>('#arrival-overlay'),
  arrivalMessage: document.querySelector<HTMLElement>('#arrival-message'),
  disembarkButton: document.querySelector<HTMLButtonElement>('#disembark-button'),
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
let worldGroup = buildWorld(world);
scene.add(worldGroup);
let navigator = new GridNavigator(world);
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
type InteractiveKind = 'cache' | 'drop' | 'extraction' | 'building-door';

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
let disembarkElapsed = 0;
let extractingRemaining = 0;
let takeoffRemaining = 0;
let reinforcementIndex = 0;
let waveWarningShown = false;
let runLootCollected = 0;
let nearbyRefresh = 0;
let lootGroup = new Group();
lootGroup.name = 'Run loot';
scene.add(lootGroup);
const interactiveViews = new Map<string, InteractiveView>();
let interiorSession: InteriorSession | undefined;
const interiorHostiles = new Map<string, ZombieState[]>();
const interiorLootRemaining = new Map<string, number>();
let cacheSites: CacheSite[] = [];
let openedCacheIds = new Set<string>();
let lootDrops: LootDrop[] = [];
let chopper: Group | undefined;
let chopperRotor: Group | undefined;
let extractionMarker: Group | undefined;
let extractionGuideArrow: ArrowHelper | undefined;
const extractionPoint = new Vector3();
const disembarkStart = new Vector3();
const disembarkEnd = new Vector3();
const resourceNames: Record<ResourceKind, string> = {
  gear: 'gear',
  supplies: 'supplies',
  money: 'credits',
  fuel: 'fuel',
};

interface TimedEffect {
  object: Object3D;
  remaining: number;
}
const timedEffects: TimedEffect[] = [];
let routeLine: Line | undefined;
let dragPointerId: number | undefined;
let pointerStart: { id: number; x: number; y: number } | undefined;
let wasAlive = combat.alive;
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
let observedDash = false;
let autoAttackTargetId: string | undefined;
const enemyAimAssistRadius = 44;

function updateModeUi(): void {
  const label = cameraRig.mode === 'third-person' ? 'THIRD PERSON' : 'TOP-DOWN';
  elements.modeName!.textContent = label;
  elements.viewButton!.setAttribute('aria-label', `Change camera from ${label.toLowerCase()} view`);
  document.querySelector('#game')?.classList.toggle('is-top-down', cameraRig.mode === 'top-down');
  renderControls();
}

function switchView(): void {
  if (gamePhase !== 'active' && !stressActive) return;
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

function updatePointerUi(): void {
  const captured = document.pointerLockElement === canvas;
  elements.lockLabel!.textContent = captured ? 'MOUSE CAPTURED' : 'CAPTURE MOUSE';
  elements.lockButton!.classList.toggle('captured', captured);
  elements.lockButton!.setAttribute('aria-pressed', String(captured));
  if (captured) {
    elements.reticle!.style.left = '50%';
    elements.reticle!.style.top = '50%';
  }
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
    cameraRig.mode === 'third-person'
      ? [
          row('W A S D', 'Move · camera-relative'),
          row('DRAG', 'Look / aim'),
          row('LMB', 'Fire rifle'),
          row(
            'Q',
            `Dash${combat.dashCooldownRemaining > 0 ? ` · ${combat.dashCooldownRemaining.toFixed(1)}s` : ''}`,
          ),
          row('1', 'Field dressing'),
          row('2', 'Shock pulse'),
          row('3', 'Adrenaline'),
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
          row('W', 'Field dressing'),
          row('E', 'Shock pulse'),
          row('R', 'Adrenaline'),
          row('X', 'Use carried supply'),
          row('F', 'Interact / enter / exit'),
          row('TAB', 'Switch camera'),
        ];
  elements.controlsContent!.innerHTML = rows.join('');
}

function updateCombatUi(): void {
  if (stressActive && hordeSimulation) {
    const health = Math.ceil(hordeSimulation.playerHealth);
    elements.hostileCount!.textContent = `${hordeSimulation.livingCount} / ${hordeSimulation.count}`;
    elements.healthValue!.textContent = `${health} / 100`;
    elements.healthFill!.style.width = `${health}%`;
    elements.combatMessage!.textContent = 'Horde stress scene running.';
    return;
  }
  const healthPercent = Math.max(0, Math.min(100, (combat.health / combat.maxHealth) * 100));
  elements.hostileCount!.textContent = String(combat.livingZombieCount);
  elements.healthValue!.textContent = `${Math.ceil(combat.health)} / ${combat.maxHealth}`;
  elements.healthFill!.style.width = `${healthPercent}%`;
  elements.healthFill!.style.background =
    healthPercent < 30
      ? 'linear-gradient(90deg, #a45443, #d07754)'
      : 'linear-gradient(90deg, #85945e, #c2bb76)';
  elements.combatMessage!.textContent = combat.lastMessage;
  elements.runClock!.textContent = `${String(Math.floor(runElapsed / 60)).padStart(2, '0')}:${String(Math.floor(runElapsed % 60)).padStart(2, '0')}`;
  elements.runClock!.classList.toggle(
    'pressure-warning',
    gamePhase === 'active' && reinforcementIndex < 2 && runElapsed >= [50, 110][reinforcementIndex],
  );
  const capacity = cargoCapacity(saveData);
  elements.cargoValue!.textContent = `${cargoWeight(cargo)} / ${capacity}`;
  elements.cargoBreakdown!.textContent = `GEAR ${cargo.gear} · SUP ${cargo.supplies} · CR ${cargo.money} · FUEL ${cargo.fuel}`;
  elements.abilityStatus!.innerHTML = ([1, 2, 3] as const)
    .map((slot) => {
      const remaining = combat.abilityCooldownsRemaining[slot];
      const key = cameraRig.mode === 'top-down' ? ['W', 'E', 'R'][slot - 1] : String(slot);
      const title = ['MED', 'PULSE', 'ADREN'][slot - 1];
      return `<span class="${remaining > 0 ? 'cooling' : ''}">${key} ${title}${remaining > 0 ? ` ${remaining.toFixed(0)}s` : ''}</span>`;
    })
    .join('');
  if (!combat.alive) elements.deathMessage!.textContent = combat.lastMessage;
}

function updateBaseUi(): void {
  document.querySelector('#game')?.classList.toggle('is-base', gamePhase === 'base');
  elements.bankGear!.textContent = String(saveData.base.gear);
  elements.bankSupplies!.textContent = String(saveData.base.supplies);
  elements.bankMoney!.textContent = String(saveData.base.money);
  elements.bankFuel!.textContent = String(saveData.base.fuel);
  elements.runCount!.textContent = String(saveData.completedRuns);
  elements.harnessStatus!.textContent = saveData.cargoUpgrade
    ? `Cargo capacity: ${cargoCapacity(saveData)} units · upgraded`
    : `Cargo capacity: ${cargoCapacity(saveData)} units`;
  elements.buySuppliesButton!.disabled = saveData.base.money < 35;
  elements.buyGearButton!.disabled = saveData.base.money < 50;
  elements.buyCargoButton!.disabled = saveData.cargoUpgrade || saveData.base.money < 90;
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

function setSeed(seed: string): void {
  if (gamePhase !== 'base' || stressActive) {
    elements.seedHint!.textContent = 'Return to camp before changing the world seed.';
    return;
  }
  clearRunScene();
  const trimmed = seed.trim().slice(0, 32) || 'RAVEN-07';
  elements.seedInput!.value = trimmed;
  const previous = worldGroup;
  scene.remove(previous);
  disposeTree(previous);
  clearRoute();

  world = generateWorld(trimmed);
  worldGroup = buildWorld(world);
  scene.add(worldGroup);
  navigator = new GridNavigator(world);
  combatNavigator = new GridNavigator(world);
  combat = new CombatSimulation(world, combatNavigator);
  navigationTask = undefined;
  setNavigationStatus('IDLE');
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  player.setWorld(world);
  player.setEnabled(false);
  cameraRig.setWorld(world);
  cameraRig.reset(player.position);
  createZombieViews();
  zombieGroup.visible = false;
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.arrivalOverlay!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.baseOverlay!.removeAttribute('hidden');
  elements.seedHint!.textContent = 'Map regenerated from this seed.';
  elements.diagSeed!.textContent = world.seed;
  elements.entityValue!.textContent = String(world.objectCount + combat.livingZombieCount + 1);
  updateModeUi();
  updateBaseUi();
  releaseLookDrag();
  releaseMouseCapture();
  canvas?.focus({ preventScroll: true });
  updateCombatUi();
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
  elements.resolutionValue!.textContent = `${cameraRig.mode} · ${renderer.domElement.width}×${renderer.domElement.height} @${renderer.getPixelRatio().toFixed(2)}x`;
  elements.effectsValue!.textContent = String(timedEffects.length);
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

  navigationTask = undefined;
  player.cancelNavigation();
  navigator.setDynamicObstacles([]);
  player.setPosition(world.spawn.x, world.spawn.z);
  player.setEnabled(true);
  cameraRig.reset(player.position);
  if (elements.hordeCamera!.value !== 'third-person') cameraRig.switchMode(player.position);
  stressActive = true;
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
  player.setEnabled(false);
  player.setPosition(world.spawn.x, world.spawn.z);
  cameraRig.reset(player.position);
  document.querySelector('#game')?.classList.remove('is-horde-test');
  elements.baseOverlay!.removeAttribute('hidden');
  elements.hordeLiveStats!.setAttribute('hidden', '');
  elements.hordeActiveTools!.setAttribute('hidden', '');
  elements.hordeStart!.removeAttribute('hidden');
  elements.hordeStop!.setAttribute('hidden', '');
  elements.hordeBenchmark!.disabled = false;
  elements.hordeStatus!.textContent =
    'Stress scene ended. Start another reproducible horde from camp.';
  elements.zoneStatus!.textContent = 'BASE';
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
  const group = new Group();
  group.name = 'Extraction helicopter';
  group.userData.interactiveId = 'extraction';
  const bodyMaterial = new MeshStandardMaterial({
    color: '#455047',
    roughness: 0.78,
    flatShading: true,
  });
  const glassMaterial = new MeshStandardMaterial({
    color: '#52666a',
    roughness: 0.34,
    metalness: 0.16,
    emissive: '#182426',
  });
  const rotorMaterial = new MeshStandardMaterial({ color: '#252a25', roughness: 0.82 });
  const body = new Mesh(new BoxGeometry(2.35, 1.03, 1.45), bodyMaterial);
  body.userData.interactiveId = 'extraction';
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const cockpit = new Mesh(new SphereGeometry(0.76, 10, 7), glassMaterial);
  cockpit.scale.set(0.9, 0.58, 0.82);
  cockpit.position.set(0, 0.14, -0.83);
  group.add(cockpit);
  const tail = new Mesh(new BoxGeometry(0.22, 0.22, 3.45), bodyMaterial);
  tail.position.set(0, 0.12, 2.08);
  group.add(tail);
  const tailFin = new Mesh(new BoxGeometry(0.16, 0.9, 0.68), bodyMaterial);
  tailFin.position.set(0, 0.42, 3.52);
  group.add(tailFin);
  const tailRotor = new Group();
  tailRotor.position.set(0, 0.18, 3.7);
  const tailBladeA = new Mesh(new BoxGeometry(0.12, 1.2, 0.11), rotorMaterial);
  const tailBladeB = new Mesh(new BoxGeometry(1.2, 0.12, 0.11), rotorMaterial);
  tailRotor.add(tailBladeA, tailBladeB);
  group.add(tailRotor);
  const mast = new Mesh(new CylinderGeometry(0.1, 0.12, 0.82, 8), rotorMaterial);
  mast.position.y = 0.88;
  group.add(mast);
  chopperRotor = new Group();
  chopperRotor.position.y = 1.36;
  const bladeA = new Mesh(new BoxGeometry(7.8, 0.09, 0.26), rotorMaterial);
  const bladeB = new Mesh(new BoxGeometry(7.8, 0.09, 0.26), rotorMaterial);
  bladeB.rotation.y = Math.PI / 2;
  chopperRotor.add(bladeA, bladeB);
  group.add(chopperRotor);
  const skidLeft = new Mesh(new BoxGeometry(0.12, 0.12, 3.35), rotorMaterial);
  skidLeft.position.set(-0.94, -0.92, 0.15);
  const skidRight = skidLeft.clone();
  skidRight.position.x = 0.94;
  const strutLeft = new Mesh(new BoxGeometry(0.11, 0.9, 0.12), rotorMaterial);
  strutLeft.position.set(-0.75, -0.53, 0.1);
  const strutRight = strutLeft.clone();
  strutRight.position.x = 0.75;
  group.add(skidLeft, skidRight, strutLeft, strutRight);
  group.traverse((object) => {
    if (object instanceof Mesh) object.castShadow = true;
  });
  const groundY = terrainHeightAt(world.seed, world.spawn.x, world.spawn.z);
  group.position.set(world.spawn.x - 18, groundY + 15, world.spawn.z + 18);
  scene.add(group);
  return group;
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
  return interiorSession?.views ?? interactiveViews;
}

function activeWorldVisual(): Group {
  return interiorSession?.group ?? worldGroup;
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
  combatNavigator = roomNavigator;
  combat.setContext(roomWorld, roomNavigator, () => 0, savedRoomHostiles);
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

function interactWith(view: InteractiveView, allowApproach = true): void {
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
  if (cameraRig.mode !== 'top-down' || (gamePhase !== 'active' && !stressActive)) return;
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
  if (cameraRig.mode !== 'top-down' || gamePhase !== 'active') return;
  autoAttackTargetId = undefined;
  const interactionRange =
    view.kind === 'extraction' ? 6.5 : interiorSession && view.kind === 'building-door' ? 2.8 : 3.6;
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
  combat.lastMessage = `Moving into reach of ${view.kind === 'cache' ? 'the cache' : view.kind === 'drop' ? 'the pickup' : 'the chopper'}.`;
  if (view.kind === 'building-door')
    combat.lastMessage = interiorSession
      ? 'Moving toward the marked exit.'
      : 'Moving toward the building door.';
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
  if (!task || cameraRig.mode !== 'top-down' || (gamePhase !== 'active' && !stressActive)) return;
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
        : interiorSession && view?.kind === 'building-door'
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
  if (interiorSession) leaveBuilding(false);
  if (chopper) {
    scene.remove(chopper);
    disposeTree(chopper);
  }
  chopper = undefined;
  chopperRotor = undefined;
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
  clearRunScene();
  navigator.setDynamicObstacles([]);
  dynamicNavigationRefresh = 0;
  cargo = emptyInventory();
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
  disembarkElapsed = 0;
  extractingRemaining = 0;
  takeoffRemaining = 0;
  reinforcementIndex = 0;
  waveWarningShown = false;
  runLootCollected = 0;
  combat.reset();
  createZombieViews();
  zombieGroup.visible = false;
  player.setPosition(world.spawn.x, world.spawn.z);
  player.setEnabled(false);
  player.cancelNavigation();
  cameraRig.reset(player.position);
  createRunLoot();
  chopper = createChopper();
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
  scene.add(extractionGuideArrow);
  gamePhase = 'arrival';
  document.querySelector('#game')?.classList.remove('is-base');
  clearNavigation('IDLE');
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  elements.baseOverlay!.setAttribute('hidden', '');
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.arrivalOverlay!.removeAttribute('hidden');
  elements.arrivalMessage!.textContent = 'Pilot is lining up the drop zone.';
  elements.disembarkButton!.disabled = true;
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.zoneStatus!.textContent = 'ARRIVAL';
  elements.seedHint!.textContent = 'Chopper inbound over the extraction zone.';
  updateModeUi();
  updateCombatUi();
}

function disembark(): void {
  if (gamePhase !== 'arrival' || elements.disembarkButton!.disabled) return;
  const offset = navigator.isWalkable(world.spawn.x + 14, world.spawn.z) ? 14 : 9;
  disembarkStart.copy(player.position);
  disembarkEnd.set(world.spawn.x + offset, 0, world.spawn.z);
  disembarkElapsed = 0;
  gamePhase = 'disembarking';
  player.setEnabled(false);
  cameraRig.switchMode(player.position);
  autoAttackTargetId = undefined;
  elements.arrivalOverlay!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.zoneStatus!.textContent = 'DISEMBARKING';
  elements.seedHint!.textContent =
    'Leaving the aircraft. The hostile movement delay starts on touchdown.';
  combat.lastMessage = 'Moving clear of the rotor wash…';
  updateModeUi();
  updateCombatUi();
  canvas!.focus({ preventScroll: true });
}

function beginTakeoff(): void {
  if (gamePhase !== 'extracting') return;
  gamePhase = 'takeoff';
  takeoffRemaining = 2.5;
  player.setEnabled(false);
  resolveRunOutcome(saveData, cargo, true);
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'Recovered cargo is secured in storage.'
    : 'Run recovered, but browser storage is unavailable; this session only is saved.';
  elements.zoneStatus!.textContent = 'TAKEOFF';
  elements.nearbyAction!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
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
  player.setEnabled(false);
  player.setPosition(world.spawn.x, world.spawn.z);
  player.cancelNavigation();
  cameraRig.reset(player.position);
  navigationTask = undefined;
  setNavigationStatus('IDLE');
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.arrivalOverlay!.setAttribute('hidden', '');
  elements.extractionGuide!.setAttribute('hidden', '');
  elements.baseOverlay!.removeAttribute('hidden');
  elements.seedHint!.textContent = 'Same seed, same streets.';
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

function addShockEffect(): void {
  const pulse = new Mesh(
    new CircleGeometry(9, 48),
    new MeshBasicMaterial({ color: '#d6c477', transparent: true, opacity: 0.2, depthWrite: false }),
  );
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.set(player.position.x, player.position.y + 0.11, player.position.z);
  scene.add(pulse);
  timedEffects.push({ object: pulse, remaining: 0.22 });
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
    if (effect.remaining > 0) continue;
    scene.remove(effect.object);
    disposeTree(effect.object);
    timedEffects.splice(index, 1);
  }
}

player = new PlayerController(
  world,
  () => switchView(),
  (slot: AbilitySlot) => {
    if (!combat.activateAbility(slot, player.position)) return;
    if (slot === 2) addShockEffect();
  },
  () => {
    if (cameraRig.mode === 'top-down') updateTopDownDashAim(pointerX, pointerY);
    const started = combat.tryDash();
    if (started && cameraRig.mode === 'top-down') autoAttackTargetId = undefined;
    return started;
  },
);
scene.add(player.visual);
player.setEnabled(false);
cameraRig.reset(player.position);
createZombieViews();
zombieGroup.visible = false;
updateBaseUi();
if (activeAssetDocument) {
  elements.baseMessage!.textContent = `Asset Bench override active for ${activeAssetDocument.asset.assetId}. Start a generated run to preview the edited asset.`;
} else if (assetDocumentLoadError) {
  elements.baseMessage!.textContent = `Saved asset override could not be loaded: ${assetDocumentLoadError}`;
}

elements.seedForm!.addEventListener('submit', (event) => {
  event.preventDefault();
  setSeed(elements.seedInput!.value);
});
elements.viewButton!.addEventListener('click', switchView);
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
elements.startRunButton!.addEventListener('click', startRun);
elements.disembarkButton!.addEventListener('click', disembark);
elements.buySuppliesButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || saveData.base.money < 35) return;
  saveData.base.money -= 35;
  saveData.base.supplies += 2;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'Two medical supplies added to camp storage.'
    : 'Supplies added for this session; browser storage is unavailable.';
  updateBaseUi();
});
elements.buyGearButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || saveData.base.money < 50) return;
  saveData.base.money -= 50;
  saveData.base.gear += 1;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'A field gear kit has been added to camp storage.'
    : 'Gear kit added for this session; browser storage is unavailable.';
  updateBaseUi();
});
elements.buyCargoButton!.addEventListener('click', () => {
  if (gamePhase !== 'base' || saveData.cargoUpgrade || saveData.base.money < 90) return;
  saveData.base.money -= 90;
  saveData.cargoUpgrade = true;
  const saved = storeSave(saveData);
  elements.baseMessage!.textContent = saved
    ? 'Harness installed. Carrying capacity increased by five units.'
    : 'Harness installed for this session; browser storage is unavailable.';
  updateBaseUi();
});
window.addEventListener('keydown', (event) => {
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
  if (event.code !== 'KeyF' || event.repeat || gamePhase !== 'active') return;
  if (
    event.target instanceof HTMLElement &&
    ['INPUT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName)
  )
    return;
  event.preventDefault();
  interactNearest();
});
elements.lockButton!.addEventListener('click', () => {
  canvas?.focus({ preventScroll: true });
  if (document.pointerLockElement === canvas) {
    releaseMouseCapture();
  } else if (cameraRig.mode === 'third-person' && canvas.requestPointerLock) {
    try {
      const request = canvas.requestPointerLock();
      if (request instanceof Promise) {
        request.catch(() => {
          elements.seedHint!.textContent =
            'Mouse capture was blocked. Drag on the open scene to look around instead.';
        });
      }
    } catch {
      elements.seedHint!.textContent =
        'Mouse capture is unavailable. Drag on the open scene to look around instead.';
    }
  }
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
      updateHordeUi();
      elements.hordeStatus!.textContent = `Agent #${hordeSimulation.ids[stressHit.instanceId]} hit · ${hordeSimulation.health[stressHit.instanceId]} health remaining.`;
    }
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
  if (cameraRig.mode !== 'top-down' || !combat.alive || (gamePhase !== 'active' && !stressActive))
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
  if (event.code !== 'Escape' || cameraRig.mode !== 'top-down' || !navigationTask) return;
  event.preventDefault();
  clearNavigation('CANCELLED');
  combat.lastMessage = 'Click-to-move route cancelled.';
  updateCombatUi();
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  moveToPointer(event);
});
document.addEventListener('pointerlockchange', updatePointerUi);
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
  if (chopperRotor) chopperRotor.rotation.y += delta * 19;
  if (gamePhase === 'arrival') {
    arrivalElapsed += delta;
    const groundY = terrainHeightAt(world.seed, world.spawn.x, world.spawn.z);
    const approach = Math.min(1, arrivalElapsed / 2.8);
    const easedApproach = 1 - (1 - approach) ** 3;
    if (chopper) {
      chopper.position.set(
        world.spawn.x - 18 * (1 - easedApproach),
        groundY + 15 - 11.6 * easedApproach,
        world.spawn.z + 18 * (1 - easedApproach),
      );
    }
    if (arrivalElapsed >= 2.8 && elements.disembarkButton!.disabled) {
      elements.disembarkButton!.disabled = false;
      elements.arrivalMessage!.textContent = 'Touchdown confirmed. Disembark when ready.';
      elements.seedHint!.textContent =
        'Touchdown confirmed. Press the button to leave the chopper.';
    }
  }
  if (gamePhase === 'disembarking') {
    disembarkElapsed += delta;
    const progress = Math.min(1, disembarkElapsed / 1.6);
    const easedProgress = progress * progress * (3 - 2 * progress);
    player.setPosition(
      disembarkStart.x + (disembarkEnd.x - disembarkStart.x) * easedProgress,
      disembarkStart.z + (disembarkEnd.z - disembarkStart.z) * easedProgress,
    );
    if (progress >= 1) {
      gamePhase = 'active';
      runElapsed = 0;
      player.setEnabled(true);
      zombieGroup.visible = true;
      elements.extractionGuide!.removeAttribute('hidden');
      elements.zoneStatus!.textContent = 'ACTIVE';
      elements.seedHint!.textContent = 'Find a cache, then return to the landing ring.';
      combat.lastMessage =
        'Insertion window · hostiles begin moving in 12 seconds. Search a cache.';
      updateCombatUi();
    }
  }
  if (gamePhase === 'takeoff') {
    takeoffRemaining -= delta;
    const groundY = terrainHeightAt(world.seed, world.spawn.x, world.spawn.z);
    if (chopper) chopper.position.y = groundY + 3.4 + (2.5 - Math.max(0, takeoffRemaining)) * 3.4;
    if (takeoffRemaining <= 0) finishSuccess();
  }
  const simulationStartedAt = performance.now();
  simulationAccumulator = Math.min(simulationAccumulator + delta, fixedStep * 8);
  while (simulationAccumulator >= fixedStep) {
    if (stressActive && hordeSimulation) {
      hordeSimulation.tick(fixedStep, player.position.x, player.position.z);
      player.update(fixedStep, cameraRig.mode, cameraRig.yaw, 1);
      updateNavigationProgress();
    } else if (gamePhase === 'active' || gamePhase === 'extracting') {
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
        combat.tick(fixedStep, player.position);
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
  cameraRig.update(delta, player.position);
  if (cameraRig.mode === 'third-person') {
    player.setFacingDirection(
      cameraRig.currentTarget.x - camera.position.x,
      cameraRig.currentTarget.z - camera.position.z,
    );
  }
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
  const gpuQuery = beginGpuFrameQuery();
  renderer.render(scene, camera);
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
    updatePointerUi();
  }
  if (now - lastUiTime > 120) {
    updateCombatUi();
    updateRenderDiagnosticsUi();
    if (cameraRig.mode === 'third-person') renderControls();
    elements.entityValue!.textContent = String(
      world.objectCount +
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
