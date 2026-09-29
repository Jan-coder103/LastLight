import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { applyAssetMaterialSettings, assetCatalog } from '../assets/catalog';
import {
  defaultAssetDocument,
  clearStoredAssetDocument,
  listDefaultAssetDocuments,
  parseAssetDocument,
  serializeAssetDocument,
  storeAssetDocumentForGame,
  type AssetMaterialSetting,
} from '../assets/assetDocument';
import type { Vec3Data } from '../assets/assetTypes';
import './style.css';

type LodStage = 'near' | 'low' | 'very-low';

const lodStageLabels: Record<LodStage, string> = {
  near: 'HIGH DETAIL · 0 M',
  low: 'LOW DETAIL · 58 M',
  'very-low': 'ULTRA-LOW · 200 M',
};

const canvas = document.querySelector<HTMLCanvasElement>('#asset-canvas');
const library = document.querySelector<HTMLElement>('#asset-list');
const inspector = document.querySelector<HTMLElement>('#inspector');
const previewWrap = document.querySelector<HTMLElement>('#preview-wrap');
const saveButton = document.querySelector<HTMLButtonElement>('#save-button');
const gameButton = document.querySelector<HTMLButtonElement>('#game-button');
const fileInput = document.querySelector<HTMLInputElement>('#open-file');
const validationStatus = document.querySelector<HTMLElement>('#validation-status');
const message = document.querySelector<HTMLElement>('#editor-message');
if (
  !canvas ||
  !library ||
  !inspector ||
  !previewWrap ||
  !saveButton ||
  !gameButton ||
  !fileInput ||
  !validationStatus ||
  !message
)
  throw new Error('The Asset Bench page is missing a required element.');

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(previewWrap.clientWidth, previewWrap.clientHeight, false);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;

const scene = new Scene();
scene.background = new Color('#252b23');
const camera = new PerspectiveCamera(37, 1, 0.1, 1200);
const ambient = new AmbientLight('#ded9c4', 1.65);
const keyLight = new DirectionalLight('#fff0ce', 2.55);
keyLight.position.set(-10, 18, 13);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
const fillLight = new DirectionalLight('#9ba88d', 1.2);
fillLight.position.set(11, 8, -12);
scene.add(ambient, keyLight, fillLight);

const ground = new Mesh(
  new PlaneGeometry(500, 500),
  new MeshStandardMaterial({ color: '#353b31', roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.035;
ground.receiveShadow = true;
scene.add(ground);
const grid = new GridHelper(80, 40, '#747a5b', '#41483a');
grid.position.y = 0.004;
for (const material of Array.isArray(grid.material) ? grid.material : [grid.material]) {
  material.transparent = true;
  material.opacity = 0.32;
}
scene.add(grid);

const baseAssetDocuments = listDefaultAssetDocuments();
const baseAssets = baseAssetDocuments.map((document) => assetCatalog.get(document.asset.assetId)!);
let selectedDocument = baseAssetDocuments[0]!;
let selectedVariant = 0;
let lodStage: LodStage = 'near';
let sourceVisual: Group | undefined;
let currentVisual: Group | undefined;
let orbitYaw = 0.72;
let orbitPitch = 0.28;
let cameraDistance = 10;
let nearDistance = 10;
let farDistance = 24;
let cameraRange: 'near' | 'far' = 'near';
let orbitPointer: number | undefined;
let lastPointerX = 0;
let lastPointerY = 0;
let validationError = '';

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character]!;
  });
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? String(numberFormat.format(value)) : '';
}

function numberField(
  label: string,
  value: number,
  attributes: string,
  min: number,
  max: number,
  step = 0.1,
): string {
  return `<label class="number-field">${label}<input type="number" value="${formatNumber(value)}" min="${min}" max="${max}" step="${step}" ${attributes}></label>`;
}

function vectorFields(
  label: string,
  vector: Vec3Data,
  vectorPath: string,
  minimum: number,
  maximum: number,
): string {
  return `<div class="vector-control"><div class="field-note">${label}</div><div class="field-grid">${(
    ['x', 'y', 'z'] as const
  )
    .map((axis) =>
      numberField(
        axis,
        vector[axis],
        `data-vector="${vectorPath}" data-axis="${axis}"`,
        minimum,
        maximum,
      ),
    )
    .join('')}</div></div>`;
}

function currentBaseAsset() {
  return assetCatalog.get(selectedDocument.asset.assetId)!;
}

function renderLibrary(): void {
  library!.innerHTML = baseAssets
    .map((asset) => {
      const selected = asset.id === selectedDocument.asset.assetId;
      const icon = asset.category === 'building' ? '⌂' : asset.category === 'landmark' ? '⌖' : '◇';
      return `<button type="button" class="asset-option${selected ? ' selected' : ''}" data-asset-id="${htmlEscape(asset.id)}" aria-pressed="${selected}"><span class="asset-option-icon" aria-hidden="true">${icon}</span><span><strong>${htmlEscape(asset.name)}</strong><small>${htmlEscape(asset.category)}</small></span></button>`;
    })
    .join('');
  document.querySelector('#asset-count')!.textContent = String(baseAssets.length).padStart(2, '0');
}

function renderInspector(): void {
  const values = selectedDocument.asset;
  const pointCards = values.interactionPoints
    .map(
      (point, index) => `<article class="point-card">
        <div class="point-heading"><span>${htmlEscape(point.id)}</span><button class="small-remove" type="button" data-remove-point="${index}" aria-label="Remove ${htmlEscape(point.label)}">REMOVE</button></div>
        <label class="text-field">LABEL<input type="text" maxlength="80" value="${htmlEscape(point.label)}" data-point-index="${index}" data-point-field="label"></label>
        <div class="field-note">LOCAL POSITION / METRES</div>
        <div class="field-grid">${(['x', 'y', 'z'] as const)
          .map((axis) =>
            numberField(
              axis,
              point.position[axis],
              `data-point-index="${index}" data-point-axis="${axis}"`,
              -500,
              500,
            ),
          )
          .join('')}</div>
      </article>`,
    )
    .join('');
  const materialCards = values.materials
    .map(
      (material, index) => `<article class="material-card">
        <div class="material-heading"><span>${htmlEscape(material.name)}</span><span>${material.metalness > 0.55 ? 'METAL' : 'SURFACE'}</span></div>
        <div class="material-controls">
          <label class="color-field">COLOR<input type="color" value="${material.color}" data-material-index="${index}" data-material-field="color" aria-label="${htmlEscape(material.name)} color"></label>
          ${numberField('Rough', material.roughness, `data-material-index="${index}" data-material-field="roughness"`, 0, 1, 0.01)}
          ${numberField('Metal', material.metalness, `data-material-index="${index}" data-material-field="metalness"`, 0, 1, 0.01)}
        </div>
      </article>`,
    )
    .join('');
  const collider = values.collider;
  const scrollTop = inspector!.scrollTop;
  inspector!.innerHTML = `
    <section class="inspector-section">
      <h3>PLACEMENT BOUNDS <small>METRES</small></h3>
      ${vectorFields('Used by generated placement checks', values.dimensions, 'dimensions', 0.1, 500)}
    </section>
    <section class="inspector-section">
      <h3>COLLISION</h3>
      <label class="toggle-row"><input id="collider-enabled" type="checkbox" ${collider ? 'checked' : ''}> SOLID COLLIDER ENABLED</label>
      ${collider ? `${vectorFields('Center / local coordinates', collider.center, 'collider.center', -500, 500)}<div style="height:10px"></div>${vectorFields('Size / metres', collider.size, 'collider.size', 0.05, 500)}` : '<p class="field-note">This asset will have no physical collision in a generated run.</p>'}
    </section>
    <section class="inspector-section">
      <h3>INTERACTION POINTS <small>${values.interactionPoints.length} / 16</small></h3>
      ${pointCards || '<p class="field-note">No interaction points are authored on this asset.</p>'}
      <button class="small-add" type="button" data-add-point ${values.interactionPoints.length >= 16 ? 'disabled' : ''}>+ ADD INTERACTION POINT</button>
    </section>
    <section class="inspector-section">
      <h3>MATERIALS <small>${values.materials.length} SLOTS</small></h3>
      <p class="field-note">Colors and surface response update the shared game materials.</p>
      ${materialCards}
    </section>`;
  inspector!
    .querySelectorAll<HTMLInputElement>('input[data-material-field="color"]')
    .forEach((input) => {
      // Color pickers can dispatch their final native-picker events differently across browsers.
      // Bind directly to each control so the committed OS picker value is always read from it.
      input.addEventListener('input', updateMaterialColor);
      input.addEventListener('change', updateMaterialColor);
    });
  inspector!.scrollTop = scrollTop;
}

function syncHeader(): void {
  const asset = currentBaseAsset();
  document.querySelector('#preview-name')!.textContent = asset.name;
  document.querySelector('#preview-category')!.textContent =
    `${asset.category.toUpperCase()} / 3D PREVIEW`;
  document.querySelector('#asset-id-label')!.textContent = `ASSET / ${asset.id.toUpperCase()}`;
  const dimensions = selectedDocument.asset.dimensions;
  document.querySelector('#bounds-caption')!.textContent =
    `BOUNDS ${dimensions.x.toFixed(1)} × ${dimensions.y.toFixed(1)} × ${dimensions.z.toFixed(1)} M`;
  const variantSelect = document.querySelector<HTMLSelectElement>('#variant-select')!;
  variantSelect.disabled = asset.id !== 'building-shell';
  variantSelect.value = String(selectedVariant);
}

function disposeVisual(root: Group): void {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function updateCamera(): void {
  const horizontal = Math.cos(orbitPitch) * cameraDistance;
  const target = (scene.userData.previewTarget as Vector3 | undefined) ?? new Vector3(0, 3, 0);
  camera.position.set(
    target.x + Math.sin(orbitYaw) * horizontal,
    target.y + Math.sin(orbitPitch) * cameraDistance,
    target.z + Math.cos(orbitYaw) * horizontal,
  );
  camera.lookAt(target);
}

function setCameraRange(range: 'near' | 'far'): void {
  cameraRange = range;
  cameraDistance = range === 'near' ? nearDistance : farDistance;
  document.querySelectorAll<HTMLButtonElement>('[data-distance]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.distance === range);
  });
  updateCamera();
}

function disposePreviewVisuals(): void {
  const previousVisual = currentVisual;
  const previousSource = sourceVisual;
  if (previousVisual) {
    scene.remove(previousVisual);
    if (previousVisual !== previousSource) disposeVisual(previousVisual);
  }
  if (previousSource && previousSource !== previousVisual) {
    scene.remove(previousSource);
    disposeVisual(previousSource);
  }
  currentVisual = undefined;
  sourceVisual = undefined;
}

function renderLodVisual(): void {
  const source = sourceVisual;
  if (!source) return;
  if (currentVisual) {
    scene.remove(currentVisual);
    if (currentVisual !== source) disposeVisual(currentVisual);
    currentVisual = undefined;
  }

  const base = currentBaseAsset();
  let visual: Group | undefined = source;
  if (lodStage === 'low') {
    visual = base.createLowDetailVisual?.(selectedVariant, source);
  } else if (lodStage === 'very-low') {
    visual = base.createVeryLowDetailVisual?.(selectedVariant, source);
  }

  if (!visual) throw new Error(`The ${lodStage} LOD is not available for ${base.name}.`);
  if (visual !== source) {
    applyAssetMaterialSettings(visual, selectedDocument.asset.materials);
  }
  visual.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.receiveShadow = true;
    if (visual === source) object.castShadow = true;
  });

  currentVisual = visual;
  scene.add(currentVisual);
  document.querySelectorAll<HTMLButtonElement>('[data-lod-stage]').forEach((button) => {
    const selected = button.dataset.lodStage === lodStage;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelector<HTMLElement>('#lod-stage-label')!.textContent = lodStageLabels[lodStage];
}

function renderVisual(): void {
  disposePreviewVisuals();
  const base = currentBaseAsset();
  sourceVisual = base.createVisual(selectedVariant);
  applyAssetMaterialSettings(sourceVisual, selectedDocument.asset.materials);
  const bounds = new Box3().setFromObject(sourceVisual);
  const size = bounds.getSize(new Vector3());
  const target = bounds.getCenter(new Vector3());
  scene.userData.previewTarget = target;
  const radius = Math.max(size.x, size.y, size.z, 1) * 0.5;
  nearDistance = Math.max(4, radius * 3.6);
  farDistance = Math.max(nearDistance * 2.4, radius * 8.5);
  renderLodVisual();
  setCameraRange(cameraRange);
}

function validateCurrent(): boolean {
  try {
    selectedDocument = parseAssetDocument(selectedDocument);
    validationError = '';
  } catch (error) {
    validationError = error instanceof Error ? error.message : 'The asset definition is invalid.';
  }
  const valid = !validationError;
  validationStatus!.classList.toggle('invalid', !valid);
  validationStatus!.innerHTML = valid
    ? '<span class="status-dot"></span><span>Definition valid</span>'
    : `<span class="status-dot"></span><span>${htmlEscape(validationError)}</span>`;
  saveButton!.disabled = !valid;
  gameButton!.disabled = !valid;
  return valid;
}

function refreshEditor(): void {
  renderLibrary();
  renderInspector();
  syncHeader();
  renderVisual();
  validateCurrent();
}

function chooseAsset(assetId: string): void {
  try {
    selectedDocument = defaultAssetDocument(assetId);
    selectedVariant = 0;
    message!.textContent =
      'Source definition loaded. Edit metadata or materials, then save or try it in game.';
    refreshEditor();
  } catch (error) {
    message!.textContent = error instanceof Error ? error.message : 'Could not load that asset.';
  }
}

function updateNumberInput(target: HTMLInputElement): void {
  const value = target.value.trim() === '' ? Number.NaN : Number(target.value);
  const vectorPath = target.dataset.vector;
  const axis = target.dataset.axis as keyof Vec3Data | undefined;
  if (vectorPath && axis) {
    if (vectorPath === 'dimensions') selectedDocument.asset.dimensions[axis] = value;
    else if (vectorPath === 'collider.center' && selectedDocument.asset.collider)
      selectedDocument.asset.collider.center[axis] = value;
    else if (vectorPath === 'collider.size' && selectedDocument.asset.collider)
      selectedDocument.asset.collider.size[axis] = value;
  }
  const pointIndex = Number(target.dataset.pointIndex);
  const pointAxis = target.dataset.pointAxis as keyof Vec3Data | undefined;
  if (Number.isInteger(pointIndex) && pointAxis) {
    const point = selectedDocument.asset.interactionPoints[pointIndex];
    if (point) point.position[pointAxis] = value;
  }
  const materialIndex = Number(target.dataset.materialIndex);
  const materialField = target.dataset.materialField;
  if (Number.isInteger(materialIndex) && materialField && materialField !== 'color') {
    const material = selectedDocument.asset.materials[materialIndex] as
      AssetMaterialSetting | undefined;
    if (material && (materialField === 'roughness' || materialField === 'metalness'))
      material[materialField] = value;
  }
}

function setMaterialColor(target: HTMLInputElement): void {
  const material = selectedDocument.asset.materials[Number(target.dataset.materialIndex)];
  if (material) material.color = target.value;
}

function updateMaterialColor(event: Event): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLInputElement)) return;
  setMaterialColor(target);
  const valid = validateCurrent();
  if (valid) {
    syncHeader();
    renderVisual();
    message!.textContent =
      'Definition valid. Save a portable JSON file or try this asset in a generated run.';
  } else
    message!.textContent =
      'Fix the highlighted definition issue before saving or using this asset.';
}

function previewInspectorInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (target.dataset.materialField === 'color') return;
  if (target.type === 'number') updateNumberInput(target);
  else if (target.dataset.pointField === 'label') {
    const point = selectedDocument.asset.interactionPoints[Number(target.dataset.pointIndex)];
    if (point) point.label = target.value;
  } else return;

  const valid = validateCurrent();
  if (valid) {
    syncHeader();
    renderVisual();
    message!.textContent =
      'Definition valid. Save a portable JSON file or try this asset in a generated run.';
  } else
    message!.textContent =
      'Fix the highlighted definition issue before saving or using this asset.';
}

function editInspector(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLButtonElement)) return;
  if (target instanceof HTMLInputElement && target.dataset.materialField === 'color') return;
  const button = target instanceof HTMLButtonElement ? target : undefined;
  if (button?.hasAttribute('data-add-point')) {
    const usedIds = new Set(selectedDocument.asset.interactionPoints.map((point) => point.id));
    let index = 1;
    while (usedIds.has(`interaction-${index}`)) index += 1;
    selectedDocument.asset.interactionPoints.push({
      id: `interaction-${index}`,
      label: `Interaction ${index}`,
      position: { x: 0, y: 0, z: 0 },
    });
  } else if (button?.dataset.removePoint !== undefined) {
    selectedDocument.asset.interactionPoints.splice(Number(button.dataset.removePoint), 1);
  } else if (target instanceof HTMLInputElement && target.id === 'collider-enabled') {
    if (target.checked) {
      const baseCollider = assetCatalog.get(selectedDocument.asset.assetId)?.collider;
      selectedDocument.asset.collider = baseCollider
        ? { center: { ...baseCollider.center }, size: { ...baseCollider.size } }
        : { center: { x: 0, y: 0, z: 0 }, size: { x: 1, y: 1, z: 1 } };
    } else selectedDocument.asset.collider = null;
  } else if (target instanceof HTMLInputElement && target.dataset.pointField === 'label') {
    const point = selectedDocument.asset.interactionPoints[Number(target.dataset.pointIndex)];
    if (point) point.label = target.value;
  } else if (target instanceof HTMLInputElement && target.type === 'number') {
    updateNumberInput(target);
  }
  const valid = validateCurrent();
  if (valid) {
    renderInspector();
    syncHeader();
    renderVisual();
    message!.textContent =
      'Definition valid. Save a portable JSON file or try this asset in a generated run.';
  }
  if (!valid)
    message!.textContent =
      'Fix the highlighted definition issue before saving or using this asset.';
}

function saveFile(): void {
  if (!validateCurrent()) return;
  const file = new Blob([serializeAssetDocument(selectedDocument)], {
    type: 'application/json',
  });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${selectedDocument.asset.assetId}-v${selectedDocument.version}.json`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
  message!.textContent = `Saved ${link.download}. Open the file here later to continue editing.`;
}

async function openFile(file?: File): Promise<void> {
  if (!file) return;
  try {
    const parsed = parseAssetDocument(JSON.parse(await file.text()) as unknown);
    selectedDocument = parsed;
    selectedVariant = 0;
    cameraRange = 'near';
    message!.textContent = `Opened ${file.name}. The shared asset definition is ready to edit.`;
    refreshEditor();
  } catch (error) {
    message!.textContent =
      error instanceof Error ? error.message : 'Could not open this asset file.';
  } finally {
    fileInput!.value = '';
  }
}

function tryInGame(): void {
  if (!validateCurrent()) return;
  try {
    storeAssetDocumentForGame(selectedDocument);
    message!.textContent = 'Loading Last Light with this asset override.';
    window.location.assign('/');
  } catch (error) {
    message!.textContent =
      error instanceof Error ? error.message : 'Could not send this asset to the game.';
  }
}

function resize(): void {
  const width = previewWrap!.clientWidth;
  const height = previewWrap!.clientHeight;
  if (width === 0 || height === 0) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate(): void {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

library.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-asset-id]');
  if (button) chooseAsset(button.dataset.assetId!);
});
inspector.addEventListener('input', previewInspectorInput);
inspector.addEventListener('change', editInspector);
inspector.addEventListener('click', editInspector);
document.querySelector('#open-button')!.addEventListener('click', () => fileInput!.click());
fileInput.addEventListener('change', () => void openFile(fileInput.files?.[0]));
document.querySelector('#reset-button')!.addEventListener('click', () => {
  try {
    clearStoredAssetDocument();
    chooseAsset(selectedDocument.asset.assetId);
    message!.textContent =
      'Source defaults restored. The saved game test override has been cleared.';
  } catch (error) {
    message!.textContent =
      error instanceof Error ? error.message : 'Could not clear the game override.';
  }
});
saveButton.addEventListener('click', saveFile);
gameButton.addEventListener('click', tryInGame);
document
  .querySelector<HTMLSelectElement>('#variant-select')!
  .addEventListener('change', (event) => {
    selectedVariant = Number((event.target as HTMLSelectElement).value);
    renderVisual();
  });
document.querySelectorAll<HTMLButtonElement>('[data-lod-stage]').forEach((button) => {
  button.addEventListener('click', () => {
    const stage = button.dataset.lodStage;
    if (stage !== 'near' && stage !== 'low' && stage !== 'very-low') return;
    lodStage = stage;
    renderLodVisual();
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-distance]').forEach((button) => {
  button.addEventListener('click', () =>
    setCameraRange(button.dataset.distance === 'far' ? 'far' : 'near'),
  );
});

canvas.addEventListener('pointerdown', (event) => {
  orbitPointer = event.pointerId;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  canvas!.setPointerCapture(event.pointerId);
  canvas!.classList.add('is-orbiting');
});
canvas.addEventListener('pointermove', (event) => {
  if (orbitPointer !== event.pointerId) return;
  orbitYaw -= (event.clientX - lastPointerX) * 0.008;
  orbitPitch = Math.max(-0.05, Math.min(1.18, orbitPitch + (event.clientY - lastPointerY) * 0.006));
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  updateCamera();
});
const stopOrbit = (event: PointerEvent) => {
  if (orbitPointer !== event.pointerId) return;
  orbitPointer = undefined;
  canvas!.classList.remove('is-orbiting');
};
canvas.addEventListener('pointerup', stopOrbit);
canvas.addEventListener('pointercancel', stopOrbit);
canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    cameraDistance = Math.max(
      2,
      Math.min(farDistance * 1.35, cameraDistance * Math.exp(event.deltaY * 0.001)),
    );
    updateCamera();
  },
  { passive: false },
);

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(previewWrap);
window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  renderer.dispose();
});

refreshEditor();
resize();
animate();
