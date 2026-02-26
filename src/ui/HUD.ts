import type * as THREE from 'three';
import type { IDisposable } from '../core/types';
import { onLocaleChange, t } from '../i18n';

export interface HUDData {
  planetName: string;
  lat: number;
  lng: number;
  alt: number;
  position: THREE.Vector3;
  localTime: string;
  timeScaleLabel: string;
}

/** 简单抬头显示：星球名 + 地理坐标 + 世界坐标 */
export class HUD implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly planetLine: HTMLDivElement;
  private readonly geoLine: HTMLDivElement;
  private readonly timeLine: HTMLDivElement;
  private readonly unsubscribeLocaleChange: () => void;
  private lastData: HUDData | null = null;
  private visible = true;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.top = '16px';
    this.root.style.left = '16px';
    this.root.style.padding = '10px 12px';
    this.root.style.background = 'rgba(6, 12, 22, 0.55)';
    this.root.style.border = '1px solid rgba(155, 188, 255, 0.35)';
    this.root.style.borderRadius = '8px';
    this.root.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    this.root.style.fontSize = 'clamp(11px, 2.6vw, 12px)';
    this.root.style.lineHeight = '1.5';
    this.root.style.color = '#e7f1ff';
    this.root.style.pointerEvents = 'none';
    this.root.style.userSelect = 'none';
    this.root.style.minWidth = 'min(250px, calc(100vw - 32px))';
    this.root.style.maxWidth = 'min(360px, calc(100vw - 32px))';
    this.root.style.maxHeight = '80vh';
    this.root.style.overflowY = 'auto';
    this.root.style.wordBreak = 'break-word';
    this.root.style.backdropFilter = 'blur(4px)';
    this.root.style.zIndex = '10';

    this.planetLine = document.createElement('div');
    this.geoLine = document.createElement('div');
    this.timeLine = document.createElement('div');

    this.root.append(this.planetLine, this.geoLine, this.timeLine);
    document.body.appendChild(this.root);
    this.applyResponsiveLayout();
    window.addEventListener('resize', this.onResize);
    this.unsubscribeLocaleChange = onLocaleChange(() => {
      this.render();
    });
  }

  update(data: HUDData): void {
    this.lastData = data;
    this.render();
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;
    this.root.style.display = visible ? 'block' : 'none';
  }

  dispose(): void {
    this.unsubscribeLocaleChange();
    window.removeEventListener('resize', this.onResize);
    this.root.remove();
  }

  private render(): void {
    if (!this.lastData) {
      return;
    }

    const { planetName, lat, lng, alt, localTime, timeScaleLabel } = this.lastData;
    const planet = this.getLocalizedPlanetName(planetName);
    const displayAlt = Math.max(0, alt);
    const localizedScale = timeScaleLabel === 'Paused'
      ? t('timeScale.paused')
      : timeScaleLabel;

    this.planetLine.textContent = t('hud.planet', { planet });
    this.geoLine.textContent = t('hud.geo', {
      lat: lat.toFixed(2),
      lng: lng.toFixed(2),
      alt: displayAlt.toFixed(1),
    });
    this.timeLine.textContent = t('hud.time', {
      time: localTime,
      scale: localizedScale,
    });
  }

  private getLocalizedPlanetName(planetName: string): string {
    const key = `planet.${planetName.toLowerCase()}`;
    const localized = t(key);
    return localized === key ? planetName.toUpperCase() : localized;
  }

  private onResize = (): void => {
    this.applyResponsiveLayout();
  };

  private applyResponsiveLayout(): void {
    const compactViewport = window.innerWidth <= 480 || window.innerHeight <= 680;
    if (compactViewport) {
      this.root.style.top = '76px';
      this.root.style.left = '12px';
      this.root.style.right = '12px';
      this.root.style.minWidth = '0';
      this.root.style.maxWidth = 'none';
      this.root.style.width = 'calc(100vw - 24px)';
      this.root.style.padding = '8px 10px';
      this.root.style.fontSize = 'clamp(10px, 3.1vw, 11px)';
      return;
    }

    this.root.style.top = '16px';
    this.root.style.left = '16px';
    this.root.style.right = 'auto';
    this.root.style.width = 'auto';
    this.root.style.padding = '10px 12px';
    this.root.style.fontSize = 'clamp(11px, 2.6vw, 12px)';
    this.root.style.minWidth = 'min(250px, calc(100vw - 32px))';
    this.root.style.maxWidth = 'min(360px, calc(100vw - 32px))';
  }
}
