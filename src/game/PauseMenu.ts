export type PausePage = 'closed' | 'menu' | 'settings' | 'title';

export class PauseMenu {
  page: PausePage = 'closed';
  private settingsReturn: 'menu' | 'title' = 'menu';

  get paused(): boolean {
    return this.page !== 'closed';
  }

  open(): void {
    this.page = 'menu';
  }
  resume(): void {
    this.page = 'closed';
  }
  settings(): void {
    this.settingsReturn = this.page === 'title' ? 'title' : 'menu';
    this.page = 'settings';
  }
  back(): void {
    this.page = this.settingsReturn;
  }
  exit(): void {
    this.page = 'title';
  }
  escape(): void {
    if (this.page === 'settings') this.back();
    else if (this.page === 'menu') this.resume();
    else if (this.page === 'closed') this.open();
  }
}
