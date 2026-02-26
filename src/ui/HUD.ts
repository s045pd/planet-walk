import type * as THREE from 'three';
import type { IDisposable } from '../core/types';

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
  private readonly worldLine: HTMLDivElement;
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
    this.root.style.fontSize = '12px';
    this.root.style.lineHeight = '1.5';
    this.root.style.color = '#e7f1ff';
    this.root.style.pointerEvents = 'none';
    this.root.style.userSelect = 'none';
    this.root.style.minWidth = '250px';
    this.root.style.backdropFilter = 'blur(4px)';
    this.root.style.zIndex = '10';

    this.planetLine = document.createElement('div');
    this.geoLine = document.createElement('div');
    this.timeLine = document.createElement('div');
    this.worldLine = document.createElement('div');

    this.root.append(this.planetLine, this.geoLine, this.timeLine, this.worldLine);
    document.body.appendChild(this.root);
  }

  update(data: HUDData): void {
    this.planetLine.textContent = `Planet: ${data.planetName.toUpperCase()}`;
    this.geoLine.textContent =
      `Lat: ${data.lat.toFixed(2)}°, Lng: ${data.lng.toFixed(2)}°, Alt: ${data.alt.toFixed(1)} m`;
    this.timeLine.textContent =
      `Local Time: ${data.localTime} (${data.timeScaleLabel})`;
    this.worldLine.textContent =
      `X: ${data.position.x.toFixed(1)}  Y: ${data.position.y.toFixed(1)}  Z: ${data.position.z.toFixed(1)}`;
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;
    this.root.style.display = visible ? 'block' : 'none';
  }

  dispose(): void {
    this.root.remove();
  }
}
