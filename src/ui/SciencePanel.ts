import type { IDisposable } from '../core/types';
import { getLocale, onLocaleChange, t } from '../i18n';
import type { CollectedSampleEntry, NearbySampleTarget } from '../science/SampleCollector';
import type { ScanResult } from '../science/Scanner';

export class SciencePanel implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly scanCard: HTMLDivElement;
  private readonly scanTitle: HTMLDivElement;
  private readonly scanStatus: HTMLDivElement;
  private readonly scanBody: HTMLDivElement;
  private readonly collectHint: HTMLDivElement;
  private readonly logCard: HTMLDivElement;
  private readonly logTitle: HTMLDivElement;
  private readonly logList: HTMLDivElement;
  private readonly actionMessage: HTMLDivElement;
  private readonly unsubscribeLocaleChange: () => void;

  private messageTimer: number | null = null;
  private scannerActive = false;
  private scanBodyState: 'instruction' | 'noHit' | 'data' = 'instruction';
  private lastScanData: ScanResult | null = null;
  private lastNearbyTarget: NearbySampleTarget | null = null;
  private collectionLogEntries: CollectedSampleEntry[] = [];

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: fixed; right: 16px; bottom: 260px; z-index: 60;
      display: flex; flex-direction: column; gap: 10px; pointer-events: auto;
      width: min(360px, calc(100vw - 32px));
      max-height: 80vh; overflow-y: auto; touch-action: pan-y;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    `;

    this.scanCard = document.createElement('div');
    this.scanCard.style.cssText = `
      background: rgba(10, 18, 28, 0.78); border: 1px solid rgba(101, 198, 255, 0.35);
      border-radius: 10px; color: #d9f0ff; padding: 12px 14px; backdrop-filter: blur(6px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.28);
    `;

    this.scanTitle = document.createElement('div');
    this.scanTitle.style.cssText = 'font-size:clamp(12px, 3.2vw, 13px); font-weight:700; margin-bottom:8px; color:#8fd7ff;';

    this.scanStatus = document.createElement('div');
    this.scanStatus.style.cssText = 'font-size:clamp(11px, 3vw, 12px); opacity:0.9; margin-bottom:6px;';

    this.scanBody = document.createElement('div');
    this.scanBody.style.cssText = 'font-size:clamp(11px, 3vw, 12px); line-height:1.7; color:#c7e6ff;';

    this.collectHint = document.createElement('div');
    this.collectHint.style.cssText = `
      font-size:clamp(11px, 3vw, 12px); margin-top:8px; padding-top:8px;
      border-top: 1px solid rgba(126, 179, 216, 0.25); color:#ffe5a3;
      min-height: 20px;
    `;

    this.scanCard.append(this.scanTitle, this.scanStatus, this.scanBody, this.collectHint);

    this.logCard = document.createElement('div');
    this.logCard.style.cssText = `
      background: rgba(13, 17, 24, 0.8); border: 1px solid rgba(255, 205, 113, 0.28);
      border-radius: 10px; color: #f5f8ff; padding: 12px 14px; backdrop-filter: blur(6px);
      max-height: 46vh; overflow: hidden; display: flex; flex-direction: column;
    `;

    this.logTitle = document.createElement('div');
    this.logTitle.style.cssText = 'font-size:clamp(12px, 3.2vw, 13px); font-weight:700; margin-bottom:8px; color:#ffd47f;';

    this.logList = document.createElement('div');
    this.logList.style.cssText = `
      overflow: auto; font-size:clamp(11px, 3vw, 12px); line-height:1.6;
      display: flex; flex-direction: column; gap: 6px; padding-right: 2px;
    `;

    this.logCard.append(this.logTitle, this.logList);

    this.actionMessage = document.createElement('div');
    this.actionMessage.style.cssText = `
      min-height: 18px; font-size:clamp(11px, 3vw, 12px); color:#b4ffd8; text-shadow: 0 0 8px rgba(0,0,0,0.5);
      padding-left: 4px;
    `;

    this.root.append(this.scanCard, this.logCard, this.actionMessage);
    document.body.appendChild(this.root);
    this.applyResponsiveLayout();
    window.addEventListener('resize', this.onResize);

    this.renderLocalizedText();
    this.unsubscribeLocaleChange = onLocaleChange(() => {
      this.renderLocalizedText();
    });
  }

  setScannerActive(active: boolean): void {
    this.scannerActive = active;
    this.scanCard.style.borderColor = active
      ? 'rgba(101, 198, 255, 0.55)'
      : 'rgba(101, 198, 255, 0.35)';
    this.logCard.style.display = active ? 'flex' : 'none';
    this.collectHint.style.display = active ? 'block' : 'none';

    if (!active) {
      this.scanBodyState = 'instruction';
      this.lastScanData = null;
    }

    this.renderScanStatus();
    this.renderScanBody();
  }

  updateScanData(data: ScanResult | null): void {
    if (!data) {
      this.lastScanData = null;
      this.scanBodyState = 'noHit';
      this.renderScanBody();
      return;
    }

    this.lastScanData = data;
    this.scanBodyState = 'data';
    this.renderScanBody();
  }

  updateNearbyTarget(target: NearbySampleTarget | null): void {
    this.lastNearbyTarget = target;
    this.renderNearbyTarget();
  }

  setCollectionLog(entries: readonly CollectedSampleEntry[]): void {
    this.collectionLogEntries = [...entries];
    this.renderCollectionLog();
  }

  showActionMessage(message: string, success = false): void {
    this.actionMessage.textContent = message;
    this.actionMessage.style.color = success ? '#a8ffd0' : '#ffd5a8';
    if (this.messageTimer !== null) {
      window.clearTimeout(this.messageTimer);
    }
    this.messageTimer = window.setTimeout(() => {
      this.actionMessage.textContent = '';
      this.messageTimer = null;
    }, 2200);
  }

  dispose(): void {
    this.unsubscribeLocaleChange();
    if (this.messageTimer !== null) {
      window.clearTimeout(this.messageTimer);
    }
    window.removeEventListener('resize', this.onResize);
    this.root.remove();
  }

  private renderLocalizedText(): void {
    this.scanTitle.textContent = t('science.title');
    this.logTitle.textContent = t('science.logTitle');
    this.renderScanStatus();
    this.renderScanBody();
    this.renderNearbyTarget();
    this.renderCollectionLog();
  }

  private renderScanStatus(): void {
    this.scanStatus.textContent = this.scannerActive
      ? t('science.status.active')
      : t('science.status.idle');
  }

  private renderScanBody(): void {
    if (this.scanBodyState === 'instruction') {
      this.scanBody.textContent = t('science.instruction');
      return;
    }

    if (this.scanBodyState === 'noHit' || !this.lastScanData) {
      this.scanBody.textContent = t('science.noHit');
      return;
    }

    const data = this.lastScanData;
    this.scanBody.innerHTML = [
      t('science.data.altitude', { value: data.altitude.toFixed(2) }),
      t('science.data.slope', { value: data.slope.toFixed(1) }),
      t('science.data.geology', { value: data.geologyType }),
      t('science.data.coords', {
        lat: data.lat.toFixed(2),
        lng: data.lng.toFixed(2),
      }),
      t('science.data.distance', { value: data.distance.toFixed(1) }),
    ].join('<br>');
  }

  private renderNearbyTarget(): void {
    if (!this.lastNearbyTarget) {
      this.collectHint.textContent = t('science.collect.none');
      return;
    }

    const status = this.lastNearbyTarget.alreadyCollected
      ? t('science.collect.collected')
      : t('science.collect.action');
    this.collectHint.textContent = `${status}: ${this.lastNearbyTarget.sample.name} @ ${this.lastNearbyTarget.poi.name}`;
  }

  private renderCollectionLog(): void {
    if (this.collectionLogEntries.length === 0) {
      this.logList.textContent = t('science.log.empty');
      return;
    }

    const topEntries = this.collectionLogEntries.slice(0, 12);
    this.logList.innerHTML = topEntries.map((entry) => {
      const time = new Date(entry.collectedAt).toLocaleString(getLocale());
      const planet = this.getLocalizedPlanet(entry.planet);
      return `
        <div style="padding:6px 8px;border:1px solid rgba(255,255,255,0.12);border-radius:8px;background:rgba(255,255,255,0.02)">
          <div style="color:#ffe1a5;font-weight:600">${entry.sampleName}</div>
          <div style="opacity:.85">${planet} · ${entry.poiName}</div>
          <div style="opacity:.65">${time}</div>
        </div>
      `;
    }).join('');
  }

  private getLocalizedPlanet(planet: string): string {
    const key = `planet.${planet.toLowerCase()}`;
    const localized = t(key);
    return localized === key ? planet.toUpperCase() : localized;
  }

  private onResize = (): void => {
    this.applyResponsiveLayout();
  };

  private applyResponsiveLayout(): void {
    const compactViewport = window.innerWidth <= 880 || window.innerHeight <= 680;
    if (compactViewport) {
      this.root.style.right = '12px';
      this.root.style.left = '12px';
      this.root.style.bottom = '12px';
      this.root.style.width = 'calc(100vw - 24px)';
      return;
    }

    this.root.style.right = '16px';
    this.root.style.left = 'auto';
    this.root.style.bottom = '260px';
    this.root.style.width = 'min(360px, calc(100vw - 32px))';
  }
}
