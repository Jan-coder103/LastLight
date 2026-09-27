import {
  addItem,
  gridColumns,
  gridRows,
  itemDefinitions,
  moveItem,
  removeItem,
  type ItemGrid,
  type ItemId,
} from './itemInventory';
import type { SaveData } from './saveData';

type PanelMode = 'inventory' | 'scrap' | 'food';

export class InventoryPanel {
  private overlay: HTMLElement;
  private grid: HTMLElement;
  private trade: HTMLElement;
  private status: HTMLElement;
  private heading: HTMLElement;
  private heldUid = '';
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private mode: PanelMode = 'inventory';
  private readonly cell = 42;
  readonly closeButton: HTMLButtonElement;

  constructor(
    private save: SaveData,
    private getGrid: () => ItemGrid,
    private isBase: () => boolean,
    private onDrop: (id: ItemId) => void,
    private onChange: () => void,
    private onEquip: (id: ItemId) => void,
    private onClose: () => void,
  ) {
    this.overlay = document.createElement('section');
    this.overlay.className = 'inventory-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-label', 'Backpack');
    this.overlay.hidden = true;
    this.overlay.innerHTML = `<div class="inventory-panel"><header class="inventory-heading"><div><span class="eyebrow">WAYFARER / FIELD KIT</span><h2 id="inventory-title">BACKPACK</h2><p id="inventory-status" aria-live="polite"></p></div><button class="inventory-close" type="button" aria-label="Close inventory">×</button></header><div class="inventory-columns"><div class="inventory-character"><span class="eyebrow">SCOUT</span><div class="scout-figure"><i class="scout-head"></i><i class="scout-torso"></i><i class="scout-arm left"></i><i class="scout-arm right"></i><i class="scout-leg left"></i><i class="scout-leg right"></i></div><p>Click a weapon to equip it.<br>Drag items to rearrange.</p><strong id="inventory-wallet"></strong></div><div class="inventory-right"><div class="inventory-grid-wrap"><div class="inventory-grid" aria-label="Backpack grid"></div></div><div class="inventory-throw" role="button" tabindex="0" aria-label="Drop selected item on ground">↓ <span>DROP ON GROUND</span></div><div class="inventory-trade"></div></div></div></div>`;
    document.querySelector('#game')!.append(this.overlay);
    this.grid = this.overlay.querySelector('.inventory-grid')!;
    this.trade = this.overlay.querySelector('.inventory-trade')!;
    this.status = this.overlay.querySelector('#inventory-status')!;
    this.heading = this.overlay.querySelector('#inventory-title')!;
    this.closeButton = this.overlay.querySelector('.inventory-close')!;
    this.closeButton.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (event) => {
      if (event.target === this.overlay) this.close();
    });
    this.grid.addEventListener('dragover', (event) => event.preventDefault());
    this.grid.addEventListener('drop', (event) => {
      event.preventDefault();
      const uid = event.dataTransfer?.getData('text/plain') || this.heldUid;
      const rect = this.grid.getBoundingClientRect();
      const x = Math.floor((event.clientX - rect.left) / this.cell) - this.dragOffsetX;
      const y = Math.floor((event.clientY - rect.top) / this.cell) - this.dragOffsetY;
      if (moveItem(this.getGrid(), uid, x, y, gridRows(this.save.cargoUpgrade))) {
        this.status.textContent = 'Item moved.';
        this.onChange();
        this.render();
      } else this.status.textContent = 'That shape does not fit there.';
    });
    const dropZone = this.overlay.querySelector<HTMLElement>('.inventory-throw')!;
    dropZone.addEventListener('dragover', (event) => event.preventDefault());
    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      this.drop(event.dataTransfer?.getData('text/plain') || this.heldUid);
    });
    dropZone.addEventListener('click', () => this.drop(this.heldUid));
    dropZone.addEventListener('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') this.drop(this.heldUid);
    });
  }

  get open(): boolean {
    return !this.overlay.hidden;
  }

  show(mode: PanelMode = 'inventory'): void {
    this.mode = mode;
    this.overlay.hidden = false;
    this.status.textContent =
      mode === 'inventory'
        ? 'Fit your loot into the grid.'
        : mode === 'scrap'
          ? 'Break down scrap items or exchange scrap for credits.'
          : 'Buy or sell food for credits.';
    this.render();
    this.closeButton.focus();
  }

  close(): void {
    if (this.overlay.hidden) return;
    this.overlay.hidden = true;
    this.heldUid = '';
    this.onClose();
  }

  private drop(uid: string): void {
    const removed = removeItem(this.getGrid(), uid);
    if (!removed) return;
    this.onDrop(removed.id);
    this.heldUid = '';
    this.onChange();
    this.status.textContent = `${itemDefinitions[removed.id].name} dropped nearby.`;
    this.render();
  }

  private transact(action: 'scrap' | 'exchange' | 'buy' | 'sell', id?: ItemId): void {
    if (!this.isBase()) return;
    const grid = this.getGrid();
    const definition = id ? itemDefinitions[id] : undefined;
    if (action === 'scrap' && definition?.category === 'scrap') {
      const entry = grid.items.find((item) => item.id === id);
      if (!entry) return;
      removeItem(grid, entry.uid);
      this.save.scrap = Math.min(9999, this.save.scrap + definition.scrap!);
      this.status.textContent = `Scrapped ${definition.name} for ${definition.scrap} scrap.`;
    } else if (action === 'exchange') {
      if (this.save.scrap < 5 || this.save.base.money > 9989) return;
      this.save.scrap -= 5;
      this.save.base.money += 10;
      this.status.textContent = 'Traded 5 scrap for 10 credits.';
    } else if (action === 'buy' && definition?.category === 'food') {
      if (
        this.save.base.money < definition.price! ||
        !addItem(grid, id!, gridRows(this.save.cargoUpgrade))
      ) {
        this.status.textContent = 'Not enough credits or backpack space.';
        return;
      }
      this.save.base.money -= definition.price!;
      this.status.textContent = `Bought ${definition.name}.`;
    } else if (action === 'sell' && definition?.category === 'food') {
      const entry = grid.items.find((item) => item.id === id);
      if (!entry || this.save.base.money > 9999 - Math.ceil(definition.price! / 2)) return;
      removeItem(grid, entry.uid);
      this.save.base.money += Math.ceil(definition.price! / 2);
      this.status.textContent = `Sold ${definition.name}.`;
    } else return;
    this.onChange();
    this.render();
  }

  render(): void {
    if (!this.open) return;
    const grid = this.getGrid();
    const rows = gridRows(this.save.cargoUpgrade);
    this.heading.textContent =
      this.mode === 'scrap' ? 'SCRAP YARD' : this.mode === 'food' ? 'FOOD STAND' : 'BACKPACK';
    this.grid.style.width = `${gridColumns * this.cell}px`;
    this.grid.style.height = `${rows * this.cell}px`;
    this.grid.innerHTML = '';
    for (const item of grid.items) {
      const definition = itemDefinitions[item.id];
      const tile = document.createElement('button');
      tile.className = `inventory-item inventory-${definition.category}`;
      if (definition.width === 1 && definition.height === 1)
        tile.classList.add('inventory-item-small');
      tile.type = 'button';
      tile.draggable = true;
      tile.style.left = `${item.x * this.cell}px`;
      tile.style.top = `${item.y * this.cell}px`;
      tile.style.width = `${definition.width * this.cell}px`;
      tile.style.height = `${definition.height * this.cell}px`;
      tile.style.setProperty('--item-color', definition.color);
      tile.title = `${definition.name} · ${definition.width}×${definition.height}`;
      tile.setAttribute('aria-label', tile.title);
      tile.innerHTML = `<strong aria-hidden="true">${definition.symbol}</strong><span>${definition.name}</span>`;
      tile.addEventListener('dragstart', (event) => {
        this.heldUid = item.uid;
        this.dragOffsetX = Math.floor(event.offsetX / this.cell);
        this.dragOffsetY = Math.floor(event.offsetY / this.cell);
        event.dataTransfer?.setData('text/plain', item.uid);
      });
      tile.addEventListener('click', () => {
        this.heldUid = item.uid;
        if (definition.category === 'weapon' && item.id !== 'grenade') this.onEquip(item.id);
        this.status.textContent = `${definition.name} selected · drag to move or drop.`;
      });
      this.grid.append(tile);
    }
    this.overlay.querySelector('#inventory-wallet')!.textContent =
      `${this.save.base.money} CR · ${this.save.scrap} SCRAP`;
    this.trade.innerHTML = '';
    if (!this.isBase()) return;
    if (this.mode === 'inventory') {
      if (this.save.storedReserve.length > 0) {
        const label = document.createElement('p');
        label.textContent = `CAMP RESERVE · ${this.save.storedReserve.length} safe item(s) awaiting grid space`;
        this.trade.append(label);
        this.save.storedReserve.forEach((id, index) => {
          this.trade.append(
            this.tradeButton(`PLACE ${itemDefinitions[id].name.toUpperCase()} IN GRID`, () => {
              if (!addItem(this.getGrid(), id, gridRows(this.save.cargoUpgrade))) {
                this.status.textContent = 'Make room in the grid first.';
                return;
              }
              this.save.storedReserve.splice(index, 1);
              this.onChange();
              this.render();
            }),
          );
        });
      }
      return;
    }
    if (this.mode === 'scrap') {
      this.trade.append(
        this.tradeButton(
          'EXCHANGE 5 SCRAP → 10 CR',
          () => this.transact('exchange'),
          this.save.scrap < 5,
        ),
      );
      for (const item of grid.items.filter(
        (entry) => itemDefinitions[entry.id].category === 'scrap',
      )) {
        const def = itemDefinitions[item.id];
        this.trade.append(
          this.tradeButton(`SCRAP ${def.name.toUpperCase()} · +${def.scrap}`, () => {
            removeItem(grid, item.uid);
            this.save.scrap = Math.min(9999, this.save.scrap + def.scrap!);
            this.status.textContent = `Scrapped ${def.name}.`;
            this.onChange();
            this.render();
          }),
        );
      }
    } else {
      for (const def of Object.values(itemDefinitions).filter((item) => item.category === 'food')) {
        const row = document.createElement('div');
        row.className = 'inventory-trade-row';
        row.append(
          this.tradeButton(
            `BUY ${def.name.toUpperCase()} · ${def.price} CR`,
            () => this.transact('buy', def.id),
            this.save.base.money < def.price!,
          ),
        );
        row.append(
          this.tradeButton(
            `SELL · ${Math.ceil(def.price! / 2)} CR`,
            () => this.transact('sell', def.id),
            !grid.items.some((item) => item.id === def.id),
          ),
        );
        this.trade.append(row);
      }
    }
  }

  private tradeButton(label: string, action: () => void, disabled = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', action);
    return button;
  }
}
