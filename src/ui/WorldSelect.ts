import { PLANET_CONFIGS, type PlanetConfig } from '../planet/PlanetConfigs';

export class WorldSelect {
  private root: HTMLElement;
  private grid: HTMLElement;
  private activeId = '';
  private onPick: (config: PlanetConfig) => void;
  private open = false;

  constructor(parent: HTMLElement, onPick: (config: PlanetConfig) => void) {
    this.onPick = onPick;
    this.root = document.createElement('div');
    this.root.className = 'worldselect';
    this.root.setAttribute('data-ui', 'worldselect');
    this.root.innerHTML = `
      <div class="worldselect__panel">
        <div class="worldselect__header">
          <div class="worldselect__title">SELECT WORLD</div>
          <div class="worldselect__hint">[1-5] DIRECT · [M] CLOSE · [ESC] ABORT</div>
        </div>
        <div class="worldselect__grid" data-grid></div>
      </div>
    `;
    parent.appendChild(this.root);
    this.grid = this.root.querySelector('[data-grid]') as HTMLElement;
    this.render();
    this.root.addEventListener('click', (e) => {
      if (e.target === this.root) this.close();
    });
  }

  setActive(id: string): void {
    this.activeId = id;
    this.render();
  }

  toggle(): void {
    if (this.open) this.close(); else this.show();
  }

  show(): void {
    this.open = true;
    this.root.classList.add('is-open');
  }

  close(): void {
    this.open = false;
    this.root.classList.remove('is-open');
  }

  isOpen(): boolean {
    return this.open;
  }

  selectByIndex(index: number): void {
    const config = PLANET_CONFIGS[index];
    if (config) {
      this.onPick(config);
      this.close();
    }
  }

  private render(): void {
    this.grid.innerHTML = PLANET_CONFIGS.map((p, i) => {
      const active = p.id === this.activeId ? ' worldselect__card--active' : '';
      return `
        <button class="worldselect__card${active}" data-id="${p.id}" data-index="${i}">
          <div>
            <div class="worldselect__card-id">${p.catalogue}</div>
            <div class="worldselect__card-name">${p.name}</div>
            <div class="worldselect__card-tag">${p.tagline}</div>
          </div>
          <div class="worldselect__card-stats">
            <span class="worldselect__card-grav">${p.gravity.toFixed(2)}</span>
            <span class="worldselect__card-unit">m · s⁻²</span>
          </div>
        </button>
      `;
    }).join('');
    this.grid.querySelectorAll<HTMLButtonElement>('.worldselect__card').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const config = PLANET_CONFIGS.find(p => p.id === id);
        if (config) {
          this.onPick(config);
          this.close();
        }
      });
    });
  }
}
