import {
  AmbientLight,
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { CameraRig } from './camera/CameraRig';
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
};

for (const [key, element] of Object.entries(elements)) {
  if (!element) throw new Error(`Missing game UI element: ${key}`);
}

let world: WorldData = generateWorld(elements.seedInput!.value);
let worldGroup = buildWorld(world);
scene.add(worldGroup);

let cameraRig: CameraRig;
const player = new PlayerController(world, () => switchView());
scene.add(player.visual);
cameraRig = new CameraRig(camera, canvas, world);
cameraRig.reset(player.position);

function updateModeUi(): void {
  const label = cameraRig.mode === 'third-person' ? 'THIRD PERSON' : 'TOP-DOWN';
  elements.modeName!.textContent = label;
  elements.viewButton!.setAttribute('aria-label', `Change camera from ${label.toLowerCase()} view`);
}

function switchView(): void {
  cameraRig.switchMode(player.position);
  if (cameraRig.mode !== 'third-person') releaseLookDrag();
  canvas?.focus({ preventScroll: true });
  updateModeUi();
}

function releaseMouseCapture(): void {
  if (document.pointerLockElement === canvas) document.exitPointerLock();
}

let dragPointerId: number | undefined;
function releaseLookDrag(): void {
  if (dragPointerId === undefined) return;
  if (canvas!.hasPointerCapture(dragPointerId)) canvas!.releasePointerCapture(dragPointerId);
  dragPointerId = undefined;
  document.querySelector('#game')?.classList.remove('is-look-dragging');
}

function updatePointerUi(): void {
  const captured = document.pointerLockElement === canvas;
  elements.lockLabel!.textContent = captured ? 'MOUSE CAPTURED' : 'CAPTURE MOUSE';
  elements.lockButton!.classList.toggle('captured', captured);
  elements.lockButton!.setAttribute('aria-pressed', String(captured));
}

function setSeed(seed: string): void {
  const trimmed = seed.trim().slice(0, 32) || 'RAVEN-07';
  elements.seedInput!.value = trimmed;
  const previous = worldGroup;
  scene.remove(previous);
  disposeTree(previous);

  world = generateWorld(trimmed);
  worldGroup = buildWorld(world);
  scene.add(worldGroup);
  player.setWorld(world);
  cameraRig.setWorld(world);
  cameraRig.reset(player.position);
  elements.seedHint!.textContent = 'Map regenerated from this seed.';
  elements.diagSeed!.textContent = world.seed;
  elements.entityValue!.textContent = String(world.objectCount + 1);
  updateModeUi();
  releaseLookDrag();
  releaseMouseCapture();
  canvas?.focus({ preventScroll: true });
}

function disposeTree(root: import('three').Object3D): void {
  const geometries = new Set<import('three').BufferGeometry>();
  const materials = new Set<import('three').Material>();
  root.traverse((object) => {
    if ('geometry' in object && object.geometry)
      geometries.add(object.geometry as import('three').BufferGeometry);
    if ('material' in object && object.material) {
      const assigned = object.material as import('three').Material | import('three').Material[];
      for (const material of Array.isArray(assigned) ? assigned : [assigned])
        materials.add(material);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

elements.seedForm!.addEventListener('submit', (event) => {
  event.preventDefault();
  setSeed(elements.seedInput!.value);
});
elements.viewButton!.addEventListener('click', switchView);
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

canvas.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('pointerlockchange', updatePointerUi);
document.addEventListener('pointerlockerror', () => {
  elements.seedHint!.textContent =
    'Mouse capture was blocked. Drag on the open scene to look around instead.';
});
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === canvas) cameraRig.lookBy(event.movementX, event.movementY);
});
canvas.addEventListener('pointerdown', (event) => {
  if (
    cameraRig.mode !== 'third-person' ||
    event.button !== 0 ||
    document.pointerLockElement === canvas
  )
    return;
  dragPointerId = event.pointerId;
  canvas?.focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);
  document.querySelector('#game')?.classList.add('is-look-dragging');
});
canvas.addEventListener('pointermove', (event) => {
  if (dragPointerId === event.pointerId) cameraRig.lookBy(event.movementX, event.movementY);
});
canvas.addEventListener('pointerup', (event) => {
  if (dragPointerId === event.pointerId) releaseLookDrag();
});
canvas.addEventListener('pointercancel', releaseLookDrag);
canvas.addEventListener('lostpointercapture', releaseLookDrag);
window.addEventListener('blur', () => {
  releaseMouseCapture();
  releaseLookDrag();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') {
    releaseMouseCapture();
    releaseLookDrag();
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
function animate(now: number): void {
  const delta = Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  frameCount += 1;
  player.update(delta, cameraRig.mode, cameraRig.yaw);
  cameraRig.update(delta, player.position);
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
    elements.entityValue!.textContent = String(world.objectCount + 1);
    updateModeUi();
    updatePointerUi();
  }
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
