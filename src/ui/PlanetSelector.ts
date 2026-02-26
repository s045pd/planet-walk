import type { IDisposable } from '../core/types';
import type { PlanetType } from '../planet/PlanetFactory';

export interface PlanetSelectorConfig {
  initialPlanet: PlanetType;
  onPlanetSelect: (planet: PlanetType) => void;
}

/** 星球切换面板：地球 / 火星 / 月球 */
export class PlanetSelector implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly buttons: Record<PlanetType, HTMLButtonElement>;
  private readonly onPlanetSelect: (planet: PlanetType) => void;
  private visible = true;

  constructor(config: PlanetSelectorConfig) {
    this.onPlanetSelect = config.onPlanetSelect;
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.top = '16px';
    this.root.style.right = '16px';
    this.root.style.display = 'flex';
    this.root.style.gap = '8px';
    this.root.style.padding = '10px';
    this.root.style.background = 'rgba(6, 12, 22, 0.65)';
    this.root.style.border = '1px solid rgba(155, 188, 255, 0.35)';
    this.root.style.borderRadius = '10px';
    this.root.style.backdropFilter = 'blur(4px)';
    this.root.style.zIndex = '20';
    this.root.style.pointerEvents = 'none';

    this.buttons = {
      earth: this.createButton('地球', 'earth'),
      mars: this.createButton('火星', 'mars'),
      moon: this.createButton('月球', 'moon'),
    };

    this.root.append(this.buttons.earth, this.buttons.mars, this.buttons.moon);
    document.body.appendChild(this.root);
    this.setActive(config.initialPlanet);
  }

  setActive(planet: PlanetType): void {
    (Object.keys(this.buttons) as PlanetType[]).forEach((type) => {
      const isActive = type === planet;
      const button = this.buttons[type];
      button.style.background = isActive ? '#78b7ff' : 'rgba(14, 26, 46, 0.9)';
      button.style.color = isActive ? '#051224' : '#d9e8ff';
      button.style.borderColor = isActive ? '#a8d4ff' : 'rgba(155, 188, 255, 0.45)';
    });
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;
    this.root.style.display = visible ? 'flex' : 'none';
  }

  dispose(): void {
    this.root.remove();
  }

  private createButton(label: string, planet: PlanetType): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.type = 'button';
    button.style.padding = '6px 10px';
    button.style.border = '1px solid rgba(155, 188, 255, 0.45)';
    button.style.borderRadius = '6px';
    button.style.fontSize = '12px';
    button.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif';
    button.style.cursor = 'pointer';
    button.style.transition = 'background-color 120ms ease, color 120ms ease, border-color 120ms ease';
    button.style.pointerEvents = 'auto';
    button.addEventListener('click', () => {
      this.onPlanetSelect(planet);
    });
    return button;
  }
}
