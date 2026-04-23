import type { Telemetry } from '../core/types';
import { formatDeg } from '../utils/math';

export class TelemetryStrip {
  private el: HTMLElement;
  private speedEl: HTMLElement;
  private altEl: HTMLElement;
  private latEl: HTMLElement;
  private lonEl: HTMLElement;
  private solEl: HTMLElement;
  private localEl: HTMLElement;
  private gravityEl: HTMLElement;
  private fpsEl: HTMLElement;
  private drawEl: HTMLElement;
  private memEl: HTMLElement;
  private altUnitEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('section');
    this.el.className = 'telemetry';
    this.el.setAttribute('data-ui', 'telemetry');
    this.el.innerHTML = `
      <div class="telemetry__cell">
        <span class="telemetry__label">SPEED</span>
        <span class="telemetry__value" data-speed>0.0</span>
        <span class="telemetry__unit">M · S⁻¹</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">ALTITUDE</span>
        <span class="telemetry__value" data-alt>0</span>
        <span class="telemetry__unit" data-alt-unit>METERS · MSL</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">COORDINATES</span>
        <span class="telemetry__value telemetry__value--stack">
          <span data-lat>+0.000°<small>LAT</small></span>
          <span data-lon>+0.000°<small>LON</small></span>
        </span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">MISSION TIME</span>
        <span class="telemetry__value">T+<span data-sol>0</span></span>
        <span class="telemetry__unit"><span data-local>00:00</span> · SOL</span>
      </div>
      <div class="telemetry__cell">
        <span class="telemetry__label">SYSTEM</span>
        <div class="telemetry__system-row"><span>GRAVITY</span><strong data-gravity>— m·s⁻²</strong></div>
        <div class="telemetry__system-row"><span>FPS</span><strong class="good" data-fps>0.0</strong></div>
        <div class="telemetry__system-row"><span>DRAW CALLS</span><strong data-draw>0</strong></div>
        <div class="telemetry__system-row telemetry__system-row--muted"><span>MEM</span><strong data-mem>0 MB</strong></div>
      </div>
    `;
    parent.appendChild(this.el);
    this.speedEl = this.el.querySelector('[data-speed]') as HTMLElement;
    this.altEl = this.el.querySelector('[data-alt]') as HTMLElement;
    this.altUnitEl = this.el.querySelector('[data-alt-unit]') as HTMLElement;
    this.latEl = this.el.querySelector('[data-lat]') as HTMLElement;
    this.lonEl = this.el.querySelector('[data-lon]') as HTMLElement;
    this.solEl = this.el.querySelector('[data-sol]') as HTMLElement;
    this.localEl = this.el.querySelector('[data-local]') as HTMLElement;
    this.gravityEl = this.el.querySelector('[data-gravity]') as HTMLElement;
    this.fpsEl = this.el.querySelector('[data-fps]') as HTMLElement;
    this.drawEl = this.el.querySelector('[data-draw]') as HTMLElement;
    this.memEl = this.el.querySelector('[data-mem]') as HTMLElement;
  }

  update(t: Telemetry, datum: string): void {
    this.speedEl.textContent = t.velocity.toFixed(1);
    this.altEl.textContent = Math.round(t.altitude).toLocaleString();
    this.altUnitEl.textContent = `METERS · DATUM ${datum}`;
    this.latEl.innerHTML = `${formatDeg(t.lat, 'lat')}<small>LAT</small>`;
    this.lonEl.innerHTML = `${formatDeg(t.lon, 'lon')}<small>LON</small>`;
    this.solEl.textContent = String(t.sol);
    this.localEl.textContent = t.localTime;
    this.gravityEl.textContent = `${t.gravity.toFixed(2)} m·s⁻²`;
    this.fpsEl.textContent = t.fps.toFixed(1);
    this.drawEl.textContent = String(t.drawCalls);
    this.memEl.textContent = `${t.memoryMB.toFixed(0)} MB`;
  }
}
