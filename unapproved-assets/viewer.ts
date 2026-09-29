import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildingShell } from './examples/buildingShell';
import { waterTower } from './examples/waterTower';
import { createPlayerVisual } from '../src/player/playerVisual';
import {
  createLowDetailVisual as simplifyLowDetailVisual,
  createVeryLowDetailVisual as simplifyVeryLowDetailVisual,
} from '../src/assets/lowDetailVisual';
import './viewer.css';

interface PreviewAsset {
  id: string;
  name: string;
  category?: string;
  dimensions?: { x: number; y: number; z: number };
  createVisual: (variant?: number) => Group;
  createLowDetailVisual?: (variant?: number, sourceVisual?: Group) => Group;
  createVeryLowDetailVisual?: (variant?: number, sourceVisual?: Group) => Group;
}

interface PreviewChoice {
  key: string;
  label: string;
  asset: PreviewAsset;
}

type DetailStage = 'near' | 'low' | 'very-low';

const detailStageLabels: Record<DetailStage, string> = {
  near: 'NEAR · 0 M',
  low: 'LOW · 58 M',
  'very-low': 'ULTRA-LOW · 200 M',
};

type ModuleExports = Record<string, unknown>;

const candidateModules = import.meta.glob<ModuleExports>('./candidate-*.ts', { eager: true });
const canvas = document.querySelector<HTMLCanvasElement>('#preview-canvas');
const stage = document.querySelector<HTMLElement>('#preview-stage');
const assetSelect = document.querySelector<HTMLSelectElement>('#asset-select');
const variantSelect = document.querySelector<HTMLSelectElement>('#variant-select');
const detailSelect = document.querySelector<HTMLSelectElement>('#detail-select');
const fitButton = document.querySelector<HTMLButtonElement>('#fit-button');
const lightReset = document.querySelector<HTMLButtonElement>('#light-reset');
const playerVisibleInput = document.querySelector<HTMLInputElement>('#player-visible');
const playerDistanceInput = document.querySelector<HTMLInputElement>('#player-distance');
const playerDistanceValue = document.querySelector<HTMLOutputElement>('#player-distance-value');
const playerSizeNote = document.querySelector<HTMLElement>('#player-size-note');
const loadMessage = document.querySelector<HTMLElement>('#load-message');
const viewerStatus = document.querySelector<HTMLElement>('#viewer-status');
const assetCaption = document.querySelector<HTMLElement>('#asset-caption');
const boundsCaption = document.querySelector<HTMLElement>('#bounds-caption');
const lightInputs = {
  x: document.querySelector<HTMLInputElement>('#light-x'),
  y: document.querySelector<HTMLInputElement>('#light-y'),
  z: document.querySelector<HTMLInputElement>('#light-z'),
};
const lightValues = {
  x: document.querySelector<HTMLOutputElement>('#light-x-value'),
  y: document.querySelector<HTMLOutputElement>('#light-y-value'),
  z: document.querySelector<HTMLOutputElement>('#light-z-value'),
};

if (
  !canvas ||
  !stage ||
  !assetSelect ||
  !variantSelect ||
  !detailSelect ||
  !fitButton ||
  !lightReset ||
  !playerVisibleInput ||
  !playerDistanceInput ||
  !playerDistanceValue ||
  !playerSizeNote ||
  !loadMessage ||
  !viewerStatus ||
  !assetCaption ||
  !boundsCaption ||
  !lightInputs.x ||
  !lightInputs.y ||
  !lightInputs.z ||
  !lightValues.x ||
  !lightValues.y ||
  !lightValues.z
)
  throw new Error('The unapproved asset viewer page is missing a required element.');

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;

const scene = new Scene();
scene.background = new Color('#a9a488');
scene.fog = new Fog('#a9a488', 175, 390);

const camera = new PerspectiveCamera(53, 1, 0.1, 1000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;

// Match the game's default camp daylight and its color-managed renderer.
scene.add(new AmbientLight('#ded9bd', 1.15));
scene.add(new AmbientLight('#75856a', 0.52));
const keyLight = new DirectionalLight('#fff0cc', 2.15);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.bias = -0.00025;
scene.add(keyLight, keyLight.target);

const ground = new Mesh(
  new PlaneGeometry(500, 500),
  new MeshStandardMaterial({ color: '#687454', roughness: 1, flatShading: true }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.035;
ground.receiveShadow = true;
scene.add(ground);

const playerReference = createPlayerVisual();
playerReference.visible = playerVisibleInput.checked;
scene.add(playerReference);
const playerHeight = new Box3().setFromObject(playerReference).getSize(new Vector3()).y;
playerSizeNote.textContent = `Gameplay scout · ${playerHeight.toFixed(1)} m tall · minimum gap keeps it clear`;

const gameLightOffset = new Vector3(-8.2, 11.2, 4.8);
const choices: PreviewChoice[] = [
  { key: 'example:building-shell', label: 'Example · City Building Shell', asset: buildingShell },
  { key: 'example:water-tower', label: 'Example · Water Tower Landmark', asset: waterTower },
];
const moduleErrors: string[] = [];
for (const [path, module] of Object.entries(candidateModules)) {
  const matchingAssets = Object.values(module).filter(isPreviewAsset);
  if (matchingAssets.length === 0) {
    moduleErrors.push(`${path} exports no asset with a createVisual() factory`);
    continue;
  }
  for (const asset of matchingAssets) {
    choices.push({
      key: `${path}:${asset.id}`,
      label: `Candidate · ${asset.name} (${path.replace('./', '')})`,
      asset,
    });
  }
}

let selectedChoice: PreviewChoice | undefined;
let sourceVisual: Group | undefined;
let currentVisual: Group | undefined;
let currentVisualUsesGeneratedGeometry = false;
let currentAssetBounds: Box3 | undefined;
let previewRadius = 2;

function isPreviewAsset(value: unknown): value is PreviewAsset {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PreviewAsset>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.createVisual === 'function'
  );
}

function status(message: string, isError = false): void {
  viewerStatus!.textContent = message;
  viewerStatus!.classList.toggle('error', isError);
}

function fitCamera(bounds: Box3, resetView = true): void {
  const previousDirection = camera.position.clone().sub(controls.target);
  const previousDistance = previousDirection.length();
  if (previousDistance > 0) previousDirection.normalize();
  positionPlayerReference(bounds);
  const modelTarget = bounds.getCenter(new Vector3());
  const viewingBounds = bounds.clone();
  if (playerVisibleInput!.checked) viewingBounds.union(new Box3().setFromObject(playerReference));
  const size = viewingBounds.getSize(new Vector3());
  const target = viewingBounds.getCenter(new Vector3());
  previewRadius = Math.max(size.x, size.y, size.z, 1) * 0.5;
  const fitDistance = Math.max(3, previewRadius * 3.7);
  const distance = resetView ? fitDistance : Math.max(previousDistance, fitDistance);
  controls.target.copy(target);
  const direction =
    !resetView && previousDistance > 0 ? previousDirection : new Vector3(1, 0.56, 1.2).normalize();
  camera.position.copy(target).add(direction.multiplyScalar(distance));
  camera.near = Math.max(0.05, previewRadius / 100);
  camera.far = Math.max(1000, previewRadius * 100);
  camera.updateProjectionMatrix();
  controls.minDistance = Math.max(0.4, previewRadius * 0.3);
  controls.maxDistance = Math.max(distance * 8, 80);
  keyLight.target.position.copy(modelTarget);
  const extent = Math.max(12, previewRadius * 3.5);
  keyLight.shadow.camera.left = -extent;
  keyLight.shadow.camera.right = extent;
  keyLight.shadow.camera.top = extent;
  keyLight.shadow.camera.bottom = -extent;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = Math.max(250, previewRadius * 20);
  keyLight.shadow.camera.updateProjectionMatrix();
  updateLightPosition();
  controls.update();
}

function setSafePlayerDistance(bounds: Box3): void {
  const size = bounds.getSize(new Vector3());
  const minimum = Math.ceil((Math.hypot(size.x * 0.5, size.z * 0.5) + 1.2) * 10) / 10;
  playerDistanceInput!.min = String(minimum);
  playerDistanceInput!.max = String(minimum + 30);
  playerDistanceInput!.value = String(minimum);
  playerDistanceValue!.value = `${minimum.toFixed(1)} m`;
}

function positionPlayerReference(bounds: Box3): void {
  const center = bounds.getCenter(new Vector3());
  const distance = Number(playerDistanceInput!.value);
  playerReference.position.set(center.x + distance, 0, center.z);
  playerReference.rotation.y = Math.PI / 2;
  playerReference.visible = playerVisibleInput!.checked;
  playerDistanceValue!.value = `${distance.toFixed(1)} m`;
}

function disposeVisual(root: Group): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function disposeGeneratedGeometry(root: Group): void {
  root.traverse((object) => {
    if (object instanceof Mesh) object.geometry.dispose();
  });
}

function selectedDetailStage(): DetailStage {
  return detailSelect!.value as DetailStage;
}

function showSelectedDetail(): void {
  if (!selectedChoice || !sourceVisual || !currentAssetBounds) return;

  if (currentVisual) {
    scene.remove(currentVisual);
    if (currentVisual !== sourceVisual && currentVisualUsesGeneratedGeometry) {
      disposeGeneratedGeometry(currentVisual);
    }
    currentVisual = undefined;
  }

  const choice = selectedChoice;
  const stage = selectedDetailStage();
  const variant = Number(variantSelect!.value);
  let visual = sourceVisual;
  let meshCount = 0;
  currentVisualUsesGeneratedGeometry = false;

  try {
    if (stage === 'low') {
      if (choice.asset.createLowDetailVisual) {
        visual = choice.asset.createLowDetailVisual(variant, sourceVisual);
      } else {
        visual = simplifyLowDetailVisual(sourceVisual, choice.asset.id);
        currentVisualUsesGeneratedGeometry = true;
      }
    } else if (stage === 'very-low') {
      if (choice.asset.createVeryLowDetailVisual) {
        visual = choice.asset.createVeryLowDetailVisual(variant, sourceVisual);
      } else {
        visual = simplifyVeryLowDetailVisual(sourceVisual, choice.asset.id);
        currentVisualUsesGeneratedGeometry = true;
      }
    }

    visual.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      if (object.visible) meshCount += 1;
      if (stage === 'near') {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    scene.add(visual);
    currentVisual = visual;
    if (meshCount === 0) {
      loadMessage!.textContent = `No geometry remains in the ${detailStageLabels[stage]} stage.`;
      loadMessage!.classList.add('visible');
    } else {
      loadMessage!.classList.remove('visible');
    }
    const skipped =
      moduleErrors.length > 0 ? ` · ${moduleErrors.length} candidate module(s) skipped` : '';
    assetCaption!.textContent = `${choice.asset.name} · ${choice.asset.category ?? 'ASSET'}`;
    status(
      `${choices.length} model${choices.length === 1 ? '' : 's'} available${skipped} · ${choice.label} · ${detailStageLabels[stage]}${meshCount === 0 ? ' · empty stage' : ''}`,
      moduleErrors.length > 0,
    );
  } catch (error) {
    if (visual !== sourceVisual && currentVisualUsesGeneratedGeometry) {
      disposeGeneratedGeometry(visual);
    }
    currentVisualUsesGeneratedGeometry = false;
    const message = error instanceof Error ? error.message : 'Unknown model error.';
    loadMessage!.textContent = `Could not render ${detailStageLabels[stage]} for ${choice.label}.\n${message}`;
    loadMessage!.classList.add('visible');
    status(`LOD preview failed: ${message}`, true);
  }
}

function loadChoice(choice: PreviewChoice): void {
  if (currentVisual) {
    scene.remove(currentVisual);
    if (currentVisual !== sourceVisual && currentVisualUsesGeneratedGeometry) {
      disposeGeneratedGeometry(currentVisual);
    }
    currentVisual = undefined;
  }
  if (sourceVisual) {
    scene.remove(sourceVisual);
    disposeVisual(sourceVisual);
    sourceVisual = undefined;
  }
  try {
    const variant = Number(variantSelect!.value);
    sourceVisual = choice.asset.createVisual(variant);
    const bounds = new Box3().setFromObject(sourceVisual);
    if (bounds.isEmpty()) throw new Error('The model did not create any visible geometry.');
    currentAssetBounds = bounds;
    setSafePlayerDistance(bounds);
    fitCamera(bounds);
    const dimensions = bounds.getSize(new Vector3());
    boundsCaption!.textContent = `MODEL ${dimensions.x.toFixed(1)} × ${dimensions.y.toFixed(1)} × ${dimensions.z.toFixed(1)} M`;
    showSelectedDetail();
  } catch (error) {
    if (currentVisual) {
      scene.remove(currentVisual);
      if (currentVisual !== sourceVisual && currentVisualUsesGeneratedGeometry) {
        disposeGeneratedGeometry(currentVisual);
      }
      currentVisual = undefined;
    }
    if (sourceVisual) {
      disposeVisual(sourceVisual);
      sourceVisual = undefined;
    }
    currentAssetBounds = undefined;
    const message = error instanceof Error ? error.message : 'Unknown model error.';
    loadMessage!.textContent = `Could not render ${choice.label}.\n${message}`;
    loadMessage!.classList.add('visible');
    status(`Model preview failed: ${message}`, true);
  }
}

function fillChoices(): void {
  assetSelect!.replaceChildren(
    ...choices.map((choice) => {
      const option = document.createElement('option');
      option.value = choice.key;
      option.textContent = choice.label;
      return option;
    }),
  );
  selectedChoice = choices[0];
  if (selectedChoice) loadChoice(selectedChoice);
}

function updateLightPosition(): void {
  const offset = new Vector3(
    Number(lightInputs.x!.value),
    Number(lightInputs.y!.value),
    Number(lightInputs.z!.value),
  );
  if (offset.lengthSq() < 0.01) offset.setY(0.1);
  keyLight.position.copy(keyLight.target.position).add(offset);
  keyLight.updateMatrixWorld();
  lightValues.x!.value = Number(lightInputs.x!.value).toFixed(1);
  lightValues.y!.value = Number(lightInputs.y!.value).toFixed(1);
  lightValues.z!.value = Number(lightInputs.z!.value).toFixed(1);
}

function resize(): void {
  const width = stage!.clientWidth;
  const height = stage!.clientHeight;
  if (width <= 0 || height <= 0) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function render(): void {
  controls.update();
  renderer.render(scene, camera);
}

for (const axis of ['x', 'y', 'z'] as const) {
  lightInputs[axis]!.addEventListener('input', updateLightPosition);
}
lightReset.addEventListener('click', () => {
  lightInputs.x!.value = String(gameLightOffset.x);
  lightInputs.y!.value = String(gameLightOffset.y);
  lightInputs.z!.value = String(gameLightOffset.z);
  updateLightPosition();
});
assetSelect.addEventListener('change', () => {
  selectedChoice = choices.find((choice) => choice.key === assetSelect!.value);
  if (selectedChoice) loadChoice(selectedChoice);
});
variantSelect.addEventListener('change', () => {
  if (selectedChoice) loadChoice(selectedChoice);
});
detailSelect.addEventListener('change', showSelectedDetail);
fitButton.addEventListener('click', () => {
  if (currentAssetBounds) fitCamera(currentAssetBounds);
});
playerVisibleInput.addEventListener('change', () => {
  if (currentAssetBounds) fitCamera(currentAssetBounds);
});
playerDistanceInput.addEventListener('input', () => {
  if (currentAssetBounds) fitCamera(currentAssetBounds, false);
});

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(stage);
window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  controls.dispose();
  renderer.dispose();
});

fillChoices();
resize();
renderer.setAnimationLoop(render);
