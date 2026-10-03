import { residentRoles } from './missionObjectives';
import { itemDefinitions } from './itemInventory';
import { canPurchase, owns, purchaseNode, respec, skillNodes, type Firearm } from './progression';
import type { SaveData } from './saveData';

/** A connected web with keyboard focus, pointer panning and bounded wheel zoom. */
export function renderProgression(
  container: HTMLElement,
  save: SaveData,
  mode: 'armory' | 'tree',
  changed: () => void,
  equip: (id: Firearm) => void,
): void {
  container.replaceChildren();
  if (mode === 'armory') {
    for (const id of save.progression.unlockedWeapons) {
      const button = document.createElement('button');
      button.textContent = `${itemDefinitions[id].name} ${save.progression.activeWeapon === id ? '· SELECTED' : '· select for next run'}`;
      button.onclick = () => {
        save.progression.activeWeapon = id;
        equip(id);
        changed();
        renderProgression(container, save, mode, changed, equip);
      };
      container.append(button);
    }
    const roster = document.createElement('p');
    roster.textContent = `Camp residents: ${save.progression.residents.length ? save.progression.residents.map((id) => `${residentRoles[id]?.name ?? id} · ${residentRoles[id]?.role ?? 'Resident'}`).join(', ') : 'Rescue survivors to grow the camp.'}`;
    container.append(roster);
    return;
  }
  const toolbar = document.createElement('div');
  const reset = document.createElement('button');
  reset.textContent = 'Reassign skill points (free)';
  const center = document.createElement('button');
  center.textContent = 'Center tree';
  const info = document.createElement('p');
  info.setAttribute('aria-live', 'polite');
  info.textContent = `${save.progression.skillPoints} skill points · ${save.base.money} credits · drag to pan, wheel to zoom`;
  toolbar.append(reset, center, info);
  const viewport = document.createElement('div');
  viewport.className = 'skill-viewport';
  const web = document.createElement('div');
  web.className = 'skill-web';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1100 850');
  svg.classList.add('skill-links');
  for (const node of skillNodes)
    for (const parentId of node.parents) {
      const parent = skillNodes.find((n) => n.id === parentId)!;
      const line = document.createElementNS(svg.namespaceURI, 'line');
      for (const [key, value] of Object.entries({
        x1: parent.x,
        y1: parent.y,
        x2: node.x,
        y2: node.y,
      }))
        line.setAttribute(key, String(value));
      svg.append(line);
    }
  web.append(svg);
  let scale = 0.7,
    x = 0,
    y = 0;
  const transform = () => {
    web.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };
  const recenter = () => {
    x = viewport.clientWidth / 2 - 500 * scale;
    y = viewport.clientHeight / 2 - 420 * scale;
    transform();
  };
  for (const node of skillNodes) {
    const button = document.createElement('button');
    button.className = 'skill-node';
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.classList.toggle('owned', owns(save, node.id));
    button.classList.toggle('available', canPurchase(save, node));
    const description = `${node.name}: ${node.preview}. Requires ${node.parents.map((id) => skillNodes.find((n) => n.id === id)!.name).join(' or ') || 'none'}. Cost ${node.cost} ${node.currency}.`;
    button.title = description;
    button.setAttribute('aria-label', description);
    button.textContent = `${node.name}\n${owns(save, node.id) ? 'Allocated' : `${node.cost} ${node.currency}`}`;
    button.onfocus = button.onmouseenter = () => {
      info.textContent = description;
    };
    button.onclick = () => {
      if (purchaseNode(save, node.id)) {
        changed();
        renderProgression(container, save, mode, changed, equip);
      } else
        info.textContent = owns(save, node.id)
          ? 'Already allocated.'
          : 'Connect a prerequisite and earn enough currency first.';
    };
    web.append(button);
  }
  viewport.append(web);
  container.append(toolbar, viewport);
  center.onclick = recenter;
  reset.onclick = () => {
    respec(save);
    changed();
    renderProgression(container, save, mode, changed, equip);
  };
  let drag: { x: number; y: number; px: number; py: number } | undefined;
  viewport.onpointerdown = (event) => {
    if ((event.target as HTMLElement).closest('button')) return;
    drag = { x, y, px: event.clientX, py: event.clientY };
    viewport.setPointerCapture(event.pointerId);
  };
  viewport.onpointermove = (event) => {
    if (!drag) return;
    x = drag.x + event.clientX - drag.px;
    y = drag.y + event.clientY - drag.py;
    transform();
  };
  viewport.onpointerup = viewport.onpointercancel = () => {
    drag = undefined;
  };
  viewport.onwheel = (event) => {
    event.preventDefault();
    const old = scale;
    scale = Math.max(0.35, Math.min(1.7, scale * Math.exp(-event.deltaY * 0.001)));
    const rect = viewport.getBoundingClientRect();
    const px = event.clientX - rect.left,
      py = event.clientY - rect.top;
    x = px - ((px - x) * scale) / old;
    y = py - ((py - y) * scale) / old;
    transform();
  };
  requestAnimationFrame(recenter);
}
