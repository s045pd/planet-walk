import type { Mode } from '../core/types';
import type { PlanetConfig } from '../planet/PlanetConfigs';

export interface SampleEntry {
  id: number;
  label: string;
  detail: string;
}

const PHASES = [
  { id: 'orbit', label: 'ORBIT INSERTION' },
  { id: 'deorbit', label: 'DE-ORBIT BURN' },
  { id: 'entry', label: 'ATMOSPHERIC ENTRY' },
  { id: 'chute', label: 'CHUTE DEPLOY' },
  { id: 'touchdown', label: 'TOUCHDOWN' },
  { id: 'walk', label: 'SURFACE WALK' },
  { id: 'survey', label: 'EXTENDED SURVEY' },
  { id: 'return', label: 'RETURN VEHICLE' },
];

export class Phase {
  private el: HTMLElement;
  private listEl: HTMLElement;
  private notesEl: HTMLElement;
  private samplesEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('section');
    this.el.className = 'phase';
    this.el.setAttribute('data-ui', 'phase');
    this.el.innerHTML = `
      <div class="phase__label">FLIGHT PHASE</div>
      <ul class="phase__list" data-phases></ul>
      <div class="notes" data-notes>
        <div class="notes__title">FIELD NOTES</div>
        <ul data-notes-list></ul>
      </div>
      <div class="notes notes--samples" data-samples-wrap style="display:none">
        <div class="notes__title">SAMPLES · [F]</div>
        <ul data-samples-list></ul>
      </div>
    `;
    parent.appendChild(this.el);
    this.listEl = this.el.querySelector('[data-phases]') as HTMLElement;
    this.notesEl = this.el.querySelector('[data-notes-list]') as HTMLElement;
    this.samplesEl = this.el.querySelector('[data-samples-list]') as HTMLElement;
  }

  setMode(mode: Mode): void {
    const activeIndex = mode === 'orbit' ? 0 : 5;
    this.listEl.innerHTML = PHASES.map((phase, i) => {
      const cls = i < activeIndex
        ? 'phase__item phase__item--done'
        : i === activeIndex
          ? 'phase__item phase__item--active'
          : 'phase__item';
      const marker = i < activeIndex ? '✓' : i === activeIndex ? '▸' : '·';
      return `<li class="${cls}"><span class="phase__dot"></span>${marker} ${phase.label}</li>`;
    }).join('');
  }

  setConfig(config: PlanetConfig): void {
    this.notesEl.innerHTML = config.notes.map(n => `<li>${n}</li>`).join('');
  }

  setSamples(samples: SampleEntry[]): void {
    const wrap = this.el.querySelector('[data-samples-wrap]') as HTMLElement;
    wrap.style.display = samples.length > 0 ? 'block' : 'none';
    this.samplesEl.innerHTML = samples
      .slice(-5)
      .reverse()
      .map(s => `<li><strong>#${String(s.id).padStart(2, '0')}</strong> ${s.label} <small>${s.detail}</small></li>`)
      .join('');
  }

  pulse(): void {
    this.samplesEl.classList.remove('notes--pulse');
    void this.samplesEl.offsetWidth;
    this.samplesEl.classList.add('notes--pulse');
  }
}
