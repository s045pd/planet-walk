import type { IDisposable } from '../core/types';
import type { CollectedSampleEntry, NearbySampleTarget } from '../science/SampleCollector';
import type { ScanResult } from '../science/Scanner';

export class SciencePanel implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly scanCard: HTMLDivElement;
  private readonly scanStatus: HTMLDivElement;
  private readonly scanBody: HTMLDivElement;
  private readonly collectHint: HTMLDivElement;
  private readonly logCard: HTMLDivElement;
  private readonly logList: HTMLDivElement;
  private readonly actionMessage: HTMLDivElement;
  private messageTimer: number | null = null;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: fixed; right: 16px; top: 72px; z-index: 60;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
      width: min(360px, calc(100vw - 24px));
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    `;

    this.scanCard = document.createElement('div');
    this.scanCard.style.cssText = `
      background: rgba(10, 18, 28, 0.78); border: 1px solid rgba(101, 198, 255, 0.35);
      border-radius: 10px; color: #d9f0ff; padding: 12px 14px; backdrop-filter: blur(6px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.28);
    `;

    const scanTitle = document.createElement('div');
    scanTitle.textContent = '科学扫描仪';
    scanTitle.style.cssText = 'font-size:13px; font-weight:700; margin-bottom:8px; color:#8fd7ff;';

    this.scanStatus = document.createElement('div');
    this.scanStatus.style.cssText = 'font-size:12px; opacity:0.9; margin-bottom:6px;';
    this.scanStatus.textContent = '状态: 待机 (E)';

    this.scanBody = document.createElement('div');
    this.scanBody.style.cssText = 'font-size:12px; line-height:1.7; color:#c7e6ff;';
    this.scanBody.textContent = '按 E 激活扫描仪并对准地面。';

    this.collectHint = document.createElement('div');
    this.collectHint.style.cssText = `
      font-size:12px; margin-top:8px; padding-top:8px;
      border-top: 1px solid rgba(126, 179, 216, 0.25); color:#ffe5a3;
      min-height: 20px;
    `;
    this.collectHint.textContent = '';

    this.scanCard.append(scanTitle, this.scanStatus, this.scanBody, this.collectHint);

    this.logCard = document.createElement('div');
    this.logCard.style.cssText = `
      background: rgba(13, 17, 24, 0.8); border: 1px solid rgba(255, 205, 113, 0.28);
      border-radius: 10px; color: #f5f8ff; padding: 12px 14px; backdrop-filter: blur(6px);
      max-height: 46vh; overflow: hidden; display: flex; flex-direction: column;
    `;

    const logTitle = document.createElement('div');
    logTitle.textContent = '采集日志';
    logTitle.style.cssText = 'font-size:13px; font-weight:700; margin-bottom:8px; color:#ffd47f;';

    this.logList = document.createElement('div');
    this.logList.style.cssText = `
      overflow: auto; font-size:12px; line-height:1.6;
      display: flex; flex-direction: column; gap: 6px; padding-right: 2px;
    `;
    this.logList.textContent = '暂无样本记录。';

    this.logCard.append(logTitle, this.logList);

    this.actionMessage = document.createElement('div');
    this.actionMessage.style.cssText = `
      min-height: 18px; font-size:12px; color:#b4ffd8; text-shadow: 0 0 8px rgba(0,0,0,0.5);
      padding-left: 4px;
    `;

    this.root.append(this.scanCard, this.logCard, this.actionMessage);
    document.body.appendChild(this.root);
  }

  setScannerActive(active: boolean): void {
    this.scanStatus.textContent = active ? '状态: 扫描中 (E 关闭)' : '状态: 待机 (E 开启)';
    this.scanCard.style.borderColor = active
      ? 'rgba(101, 198, 255, 0.55)'
      : 'rgba(101, 198, 255, 0.35)';
    this.logCard.style.display = active ? 'flex' : 'none';
    this.collectHint.style.display = active ? 'block' : 'none';
    if (!active) {
      this.scanBody.textContent = '按 E 激活扫描仪并对准地面。';
    }
  }

  updateScanData(data: ScanResult | null): void {
    if (!data) {
      this.scanBody.textContent = '未命中地表，请将视角对准地面。';
      return;
    }

    this.scanBody.innerHTML = [
      `海拔: ${data.altitude.toFixed(2)} m`,
      `坡度: ${data.slope.toFixed(1)}°`,
      `地质类型: ${data.geologyType}`,
      `坐标: ${data.lat.toFixed(2)}°, ${data.lng.toFixed(2)}°`,
      `探测距离: ${data.distance.toFixed(1)} m`,
    ].join('<br>');
  }

  updateNearbyTarget(target: NearbySampleTarget | null): void {
    if (!target) {
      this.collectHint.textContent = '附近无采集点';
      return;
    }

    const status = target.alreadyCollected ? '已采集' : '按 F 采集';
    this.collectHint.textContent = `${status}: ${target.sample.name} @ ${target.poi.name}`;
  }

  setCollectionLog(entries: readonly CollectedSampleEntry[]): void {
    if (entries.length === 0) {
      this.logList.textContent = '暂无样本记录。';
      return;
    }

    const topEntries = entries.slice(0, 12);
    this.logList.innerHTML = topEntries.map((entry) => {
      const time = new Date(entry.collectedAt).toLocaleString();
      return `
        <div style="padding:6px 8px;border:1px solid rgba(255,255,255,0.12);border-radius:8px;background:rgba(255,255,255,0.02)">
          <div style="color:#ffe1a5;font-weight:600">${entry.sampleName}</div>
          <div style="opacity:.85">${entry.planet.toUpperCase()} · ${entry.poiName}</div>
          <div style="opacity:.65">${time}</div>
        </div>
      `;
    }).join('');
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
    if (this.messageTimer !== null) {
      window.clearTimeout(this.messageTimer);
    }
    this.root.remove();
  }
}
