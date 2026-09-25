import {
  AmbientLight,
  ACESFilmicToneMapping,
  ArrowHelper,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Fog,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import type { AbilitySlot } from './input/controlMap';
import { CameraRig } from './camera/CameraRig';
import { CombatSimulation, type ZombieState } from './game/CombatSimulation';
import { createZombieVisual, syncZombieVisual } from './game/zombieVisual';
import { GridNavigator } from './navigation/GridNavigator';
import { PlayerController } from './player/PlayerController';
import { buildWorld } from './world/buildWorld';
import { generateWorld, type WorldData } from './world/generateWorld';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');
if (!canvas) throw new Error('The #scene canvas is missing from index.html');

const scene = new Scene();
scene.background = new Color('#a9a488');
scene.fog = new Fog('#a9a488', 175, 390);

const camera = new PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
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
  entityValue: document.querySelector<HTMLElement>('#entity-value'),
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
  restartButton: document.querySelector<HTMLButtonElement>('#restart-button'),
};

for (const [key, element] of Object.entries(elements)) {
  if (!element) throw new Error(`Missing game UI element: ${key}`);
}

let world: WorldData = generateWorld(elements.seedInput!.value);
let worldGroup = buildWorld(world);
scene.add(worldGroup);
let navigator = new GridNavigator(world);
let combat = new CombatSimulation(world, navigator);
let zombieGroup = new Group();
zombieGroup.name = 'Hostiles';
scene.add(zombieGroup);
const zombieViews = new Map<string, Group>();
let cameraRig = new CameraRig(camera, canvas, world);
let player!: PlayerController;

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
let navigationGoal: { x: number; z: number } | undefined;
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
  cameraRig.switchMode(player.position);
  autoAttackTargetId = undefined;
  player.clearKeyboardMovement();
  if (cameraRig.mode !== 'third-person') releaseLookDrag();
  canvas?.focus({ preventScroll: true });
  updateModeUi();
  if (cameraRig.mode === 'top-down' && navigationGoal) replanNavigationGoal();
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
          row('TAB', 'Switch camera'),
        ]
      : [
          row('RMB', 'Click to move'),
          row('LMB', 'Fire at cursor'),
          row(
            'Q',
            `Dash${combat.dashCooldownRemaining > 0 ? ` · ${combat.dashCooldownRemaining.toFixed(1)}s` : ''}`,
          ),
          row('W', 'Field dressing'),
          row('E', 'Shock pulse'),
          row('R', 'Adrenaline'),
          row('TAB', 'Switch camera'),
        ];
  elements.controlsContent!.innerHTML = rows.join('');
}

function updateCombatUi(): void {
  const healthPercent = Math.max(0, Math.min(100, (combat.health / combat.maxHealth) * 100));
  elements.hostileCount!.textContent = `${combat.livingZombieCount} HOSTILE${combat.livingZombieCount === 1 ? '' : 'S'}`;
  elements.healthValue!.textContent = `${Math.ceil(combat.health)} / ${combat.maxHealth}`;
  elements.healthFill!.style.width = `${healthPercent}%`;
  elements.healthFill!.style.background =
    healthPercent < 30
      ? 'linear-gradient(90deg, #a45443, #d07754)'
      : 'linear-gradient(90deg, #85945e, #c2bb76)';
  elements.combatMessage!.textContent = combat.lastMessage;
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
  combat = new CombatSimulation(world, navigator);
  navigationGoal = undefined;
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  player.setWorld(world);
  player.setEnabled(true);
  cameraRig.setWorld(world);
  cameraRig.reset(player.position);
  createZombieViews();
  elements.deathOverlay!.setAttribute('hidden', '');
  elements.seedHint!.textContent = 'Map regenerated from this seed.';
  elements.diagSeed!.textContent = world.seed;
  elements.entityValue!.textContent = String(world.objectCount + combat.livingZombieCount + 1);
  updateModeUi();
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
cameraRig.reset(player.position);
createZombieViews();

elements.seedForm!.addEventListener('submit', (event) => {
  event.preventDefault();
  setSeed(elements.seedInput!.value);
});
elements.viewButton!.addEventListener('click', switchView);
elements.restartButton!.addEventListener('click', () => {
  combat.reset();
  player.setPosition(world.spawn.x, world.spawn.z);
  player.setEnabled(true);
  cameraRig.reset(player.position);
  navigationGoal = undefined;
  observedDash = false;
  autoAttackTargetId = undefined;
  wasAlive = true;
  elements.deathOverlay!.setAttribute('hidden', '');
  createZombieViews();
  updateCombatUi();
  updateModeUi();
  clearRoute();
  releaseMouseCapture();
  canvas?.focus({ preventScroll: true });
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
  const terrain = worldGroup.getObjectByName('Seeded terrain');
  if (!(terrain instanceof Mesh)) return undefined;
  const raycaster = new Raycaster();
  raycaster.setFromCamera(pointerNdc(clientX, clientY), camera);
  return raycaster.intersectObject(terrain, false)[0]?.point;
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

function firstWorldOrLivingHit(raycaster: Raycaster) {
  return raycaster.intersectObjects([worldGroup, zombieGroup], true).find((hit) => {
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
  if (!combat.alive) return;
  const ndc = pointToNdc(event);
  const viewRay = new Raycaster();
  viewRay.setFromCamera(ndc, camera);
  const aimHit = firstWorldOrLivingHit(viewRay);
  if (cameraRig.mode === 'top-down') {
    const target = findAssistedZombie(event.clientX, event.clientY, aimHit?.object);
    if (target) {
      autoAttackTargetId = target.id;
      player.setNavigationPath([]);
      navigationGoal = undefined;
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
  if (!combat.alive || cameraRig.mode !== 'top-down') {
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
  if (cameraRig.mode !== 'top-down' || !combat.alive) return;
  autoAttackTargetId = undefined;
  pointerX = event.clientX;
  pointerY = event.clientY;
  updateTopDownDashAim(pointerX, pointerY);
  const destination = terrainPointAt(event.clientX, event.clientY);
  if (!destination) return;
  const path = navigator.findPath(
    player.position.x,
    player.position.z,
    destination.x,
    destination.z,
  );
  player.setNavigationPath(path);
  navigationGoal = path.length > 0 ? { x: destination.x, z: destination.z } : undefined;
  routeRefresh = 1;
  updateRouteLine(true);
  if (path.length === 0) elements.seedHint!.textContent = 'No nearby clear route to that point.';
}

function replanNavigationGoal(): void {
  if (!navigationGoal) return;
  const path = navigator.findPath(
    player.position.x,
    player.position.z,
    navigationGoal.x,
    navigationGoal.z,
  );
  player.setNavigationPath(path);
  if (path.length === 0) navigationGoal = undefined;
  routeRefresh = 1;
  updateRouteLine(true);
}

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
  const delta = Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  frameCount += 1;
  simulationAccumulator = Math.min(simulationAccumulator + delta, fixedStep * 8);
  while (simulationAccumulator >= fixedStep) {
    if (player.isDashing && !observedDash && cameraRig.mode === 'top-down') addDashIndicator();
    const wasDashing = player.isDashing;
    combat.tick(fixedStep, player.position);
    player.update(
      fixedStep,
      cameraRig.mode,
      cameraRig.yaw,
      combat.adrenalineRemaining > 0 ? 1.5 : 1,
    );
    updateAutoAttack();
    if (wasDashing && !player.isDashing) replanNavigationGoal();
    observedDash = player.isDashing;
    if (cameraRig.mode === 'top-down' && !player.isDashing && player.navigationPath.length === 0) {
      navigationGoal = undefined;
    }
    simulationAccumulator -= fixedStep;
  }
  if (wasAlive && !combat.alive) {
    player.setEnabled(false);
    elements.deathOverlay!.removeAttribute('hidden');
    releaseMouseCapture();
    releaseLookDrag();
  }
  wasAlive = combat.alive;
  for (const zombie of combat.zombies) {
    const visual = zombieViews.get(zombie.id);
    if (visual) syncZombieVisual(visual, zombie);
  }
  cameraRig.update(delta, player.position);
  if (cameraRig.mode === 'third-person') {
    player.setFacingDirection(
      cameraRig.currentTarget.x - camera.position.x,
      cameraRig.currentTarget.z - camera.position.z,
    );
  }
  animateEffects(delta);
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
  renderer.render(scene, camera);

  sampleTime += delta;
  sampleFrames += 1;
  if (sampleTime >= 0.5) {
    const fps = sampleFrames / sampleTime;
    fpsAverage = fpsAverage === 0 ? fps : fpsAverage * 0.58 + fps * 0.42;
    elements.fpsValue!.innerHTML = `${Math.round(fpsAverage)} <small>FPS</small>`;
    elements.frameValue!.innerHTML = `${(1000 / Math.max(1, fpsAverage)).toFixed(1)} <small>MS</small>`;
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
    if (cameraRig.mode === 'third-person') renderControls();
    elements.entityValue!.textContent = String(world.objectCount + combat.livingZombieCount + 1);
    lastUiTime = now;
  }
  requestAnimationFrame(animate);
}

updateModeUi();
updateCombatUi();
requestAnimationFrame(animate);
