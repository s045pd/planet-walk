import type { PlanetConfig } from '../planet/PlanetConfigs';

export class TopBar {
  private el: HTMLElement;
  private missionEl: HTMLElement;
  private timeEl: HTMLElement;
  private signalEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'topbar';
    this.el.setAttribute('data-ui', 'topbar');
    this.el.innerHTML = `
      <div class="topbar__brand">
        <div class="topbar__brand-name">PLANET · WALK</div>
        <div class="topbar__brand-rev">MISSION CONSOLE · REV 0.2</div>
      </div>
      <div class="topbar__mission">
        <div class="topbar__mission-label">MISSION</div>
        <div class="topbar__mission-value" data-mission></div>
      </div>
      <div class="topbar__time">
        <div class="topbar__live">LIVE</div>
        <div class="topbar__time-value" data-clock></div>
        <div class="topbar__signal" data-signal></div>
      </div>
    `;
    parent.appendChild(this.el);
    this.missionEl = this.el.querySelector('[data-mission]') as HTMLElement;
    this.timeEl = this.el.querySelector('[data-clock]') as HTMLElement;
    this.signalEl = this.el.querySelector('[data-signal]') as HTMLElement;
  }

  setMission(config: PlanetConfig): void {
    this.missionEl.textContent = `${config.name} · ${config.landingSite.name.toUpperCase()}`;
  }

  setSignal(rssiDbm: number, latencyMs: number): void {
    this.signalEl.textContent = `DSN · ${rssiDbm.toFixed(0)} dBm · LAT ${latencyMs.toFixed(0)} ms`;
  }

  tick(): void {
    const now = new Date();
    const iso = now.toISOString();
    this.timeEl.textContent = `${iso.slice(0, 10)} · ${iso.slice(11, 19)} UTC`;
  }
}
