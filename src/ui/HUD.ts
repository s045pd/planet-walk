import type { Telemetry } from '../core/types';
import { applyPaletteToBackground } from '../planet/Planet';
import type { PlanetConfig } from '../planet/PlanetConfigs';
import type { SurfaceScene } from '../surface/SurfaceScene';
import { Minimap } from './Minimap';
import { Phase } from './Phase';
import { RightPanel } from './RightPanel';
import { TelemetryStrip } from './Telemetry';
import { TopBar } from './TopBar';
import { WorldSelect } from './WorldSelect';

function hex(color: { r: number; g: number; b: number }): string {
  const c = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${c(color.r)}${c(color.g)}${c(color.b)}`;
}

export class HUD {
  private root: HTMLElement;
  readonly topbar: TopBar;
  readonly phase: Phase;
  readonly right: RightPanel;
  readonly telemetry: TelemetryStrip;
  readonly worldSelect: WorldSelect;
  private viewport: HTMLElement;
  private targetPin: HTMLElement;
  private modeBtn: HTMLButtonElement;
  private descentEl: HTMLElement;
  private glowEl: HTMLElement;
  readonly minimap: Minimap;
  private activeConfig: PlanetConfig | null = null;

  constructor(onPick: (config: PlanetConfig) => void, onToggleMode: () => void) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    document.body.appendChild(this.root);

    this.topbar = new TopBar(this.root);
    this.phase = new Phase(this.root);

    this.viewport = document.createElement('section');
    this.viewport.className = 'viewport';
    this.viewport.innerHTML = `
      <div class="viewport__bracket viewport__bracket--tl"></div>
      <div class="viewport__bracket viewport__bracket--tr"></div>
      <div class="viewport__bracket viewport__bracket--bl"></div>
      <div class="viewport__bracket viewport__bracket--br"></div>
      <div class="viewport__cam">
        <span data-cam-mode>CAM · 03 · ORBIT OBSERVER</span>
        <span class="muted">EXPOSURE 1/60 · F 2.8 · ISO 800</span>
      </div>
      <div class="viewport__crosshair"></div>
      <div class="target__pin" data-target>
        <strong data-target-name>TARGET</strong>
        <small data-target-coord>0.0° · 0.0°</small>
        <small data-target-dist>DIST · BEARING</small>
      </div>
      <button class="modebtn modebtn--land" data-ui data-modebtn type="button">
        <span class="modebtn__marker">▾</span><span data-modebtn-label>INITIATE LANDING</span>
      </button>
      <div class="descent" data-descent>
        <div class="descent__label" data-descent-label>DESCENT · ENTRY INTERFACE</div>
      </div>
      <div class="viewport__glow" data-glow></div>
    `;
    this.root.appendChild(this.viewport);
    this.targetPin = this.viewport.querySelector('[data-target]') as HTMLElement;
    this.modeBtn = this.viewport.querySelector('[data-modebtn]') as HTMLButtonElement;
    this.descentEl = this.viewport.querySelector('[data-descent]') as HTMLElement;
    this.glowEl = this.viewport.querySelector('[data-glow]') as HTMLElement;
    this.modeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleMode();
    });

    this.right = new RightPanel(this.root);
    this.minimap = new Minimap(this.root);
    this.telemetry = new TelemetryStrip(this.root);

    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = `
      <div class="legend__keys">
        <span><kbd>W A S D</kbd>TRANSLATE</span>
        <span><kbd>␣</kbd>JUMP</span>
        <span><kbd>MOUSE</kbd>GAZE</span>
        <span><kbd>TAB</kbd>ORBIT / SURFACE</span>
        <span><kbd>M</kbd>WORLDS</span>
      </div>
      <div>PLANET·WALK / 2026 · S045PD</div>
    `;
    this.root.appendChild(legend);

    this.worldSelect = new WorldSelect(document.body, onPick);
  }

  setConfig(config: PlanetConfig): void {
    this.activeConfig = config;
    applyPaletteToBackground(document.body, config);
    document.body.style.background = `linear-gradient(to bottom, ${hex(config.sky.top)}, ${hex(config.sky.horizon)} 85%, ${hex(config.sky.top)})`;
    this.topbar.setMission(config);
    this.phase.setConfig(config);
    this.worldSelect.setActive(config.id);

    const site = config.landingSite;
    const nameEl = this.targetPin.querySelector('[data-target-name]') as HTMLElement;
    const coordEl = this.targetPin.querySelector('[data-target-coord]') as HTMLElement;
    const distEl = this.targetPin.querySelector('[data-target-dist]') as HTMLElement;
    nameEl.textContent = `TARGET · ${site.name.toUpperCase()}`;
    coordEl.textContent = `${site.lat.toFixed(3)}° · ${site.lon.toFixed(3)}°`;
    distEl.textContent = `LANDING ZONE`;
  }

  update(telemetry: Telemetry): void {
    if (!this.activeConfig) return;
    const config = this.activeConfig;
    this.topbar.tick();
    this.topbar.setSignal(-64 - Math.random() * 2, 120 + Math.random() * 8);
    this.phase.setMode(telemetry.mode);
    this.telemetry.update(telemetry, config.solLabel);
    this.right.update(
      telemetry,
      hex(config.sky.top),
      hex(config.surface.mid),
    );

    const camMode = this.viewport.querySelector('[data-cam-mode]') as HTMLElement;
    camMode.textContent = telemetry.mode === 'orbit'
      ? 'CAM · 03 · ORBIT OBSERVER'
      : 'CAM · 07 · SURFACE WALKER';

    this.targetPin.style.display = telemetry.mode === 'orbit' ? 'block' : 'none';

    const label = this.modeBtn.querySelector('[data-modebtn-label]') as HTMLElement;
    const marker = this.modeBtn.querySelector('.modebtn__marker') as HTMLElement;
    if (telemetry.mode === 'orbit') {
      this.modeBtn.classList.remove('modebtn--abort');
      this.modeBtn.classList.add('modebtn--land');
      label.textContent = 'INITIATE LANDING';
      marker.textContent = '▾';
    } else {
      this.modeBtn.classList.remove('modebtn--land');
      this.modeBtn.classList.add('modebtn--abort');
      label.textContent = 'RETURN TO ORBIT';
      marker.textContent = '▴';
    }
  }

  setDescent(active: boolean, label = 'DESCENT · ENTRY INTERFACE'): void {
    this.descentEl.classList.toggle('is-active', active);
    const el = this.descentEl.querySelector('[data-descent-label]') as HTMLElement;
    el.textContent = label;
    this.modeBtn.style.visibility = active ? 'hidden' : 'visible';
    this.viewport.classList.toggle('is-shaking', active);
    const isAscent = label.startsWith('ASCENT');
    this.glowEl.classList.toggle('is-descent', active && !isAscent);
    this.glowEl.classList.toggle('is-ascent', active && isAscent);
  }

  updateMinimap(telemetry: Telemetry, surface: SurfaceScene, now: number, x: number, z: number, heading: number): void {
    this.minimap.setLandmark(surface.getLandmarkLabel());
    this.minimap.update(telemetry, surface, now, x, z, heading);
  }
}
