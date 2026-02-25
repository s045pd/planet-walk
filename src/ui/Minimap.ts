import type { IDisposable } from '../core/types';
import { geoToCartesian } from '../utils/geo';

export interface MinimapLandmark {
  name: string;
  lat: number;
  lng: number;
}

interface MinimapFrame {
  playerLat: number;
  playerLng: number;
  playerHeading: number;
  landmarks: MinimapLandmark[];
}

/** Canvas 2D 小地图（右下角 + M 键全屏） */
export class Minimap implements IDisposable {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly overlay: HTMLDivElement;

  private visible = true;
  private fullscreen = false;
  private planetRadius = 1000;
  private backgroundColor = '#234365';
  private cssSize = 220;
  private mapRadius = 100;
  private center = 110;

  private lastFrame: MinimapFrame | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.inset = '0';
    this.overlay.style.background = 'rgba(0, 0, 0, 0.5)';
    this.overlay.style.zIndex = '58';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);

    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.right = '24px';
    this.canvas.style.bottom = '24px';
    this.canvas.style.zIndex = '60';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.userSelect = 'none';
    document.body.appendChild(this.canvas);

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Minimap: failed to create 2D context.');
    }
    this.context = context;
    this.context.textBaseline = 'middle';

    this.applyLayout();
    window.addEventListener('resize', this.onResize);
  }

  update(
    playerLat: number,
    playerLng: number,
    playerHeading: number,
    landmarks: Array<{ name: string; lat: number; lng: number }>,
  ): void {
    this.lastFrame = {
      playerLat,
      playerLng,
      playerHeading,
      landmarks,
    };

    if (!this.visible) {
      return;
    }

    const ctx = this.context;
    ctx.clearRect(0, 0, this.cssSize, this.cssSize);

    const halfAngle = this.fullscreen ? 70 : 60;
    const pixelsPerDegree = this.mapRadius / halfAngle;

    // 圆形地图主体
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.center, this.center, this.mapRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.cssSize, this.cssSize);

    this.drawGrid(playerLat, pixelsPerDegree);
    this.drawLandmarks(playerLat, playerLng, pixelsPerDegree, landmarks);
    ctx.restore();

    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.center, this.center, this.mapRadius, 0, Math.PI * 2);
    ctx.stroke();

    this.drawPlayerHeading(playerHeading);
    this.drawScale(pixelsPerDegree, playerLat, playerLng);
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;
    this.applyVisibility();
    if (visible && this.lastFrame) {
      this.update(
        this.lastFrame.playerLat,
        this.lastFrame.playerLng,
        this.lastFrame.playerHeading,
        this.lastFrame.landmarks,
      );
    }
  }

  setFullscreen(fullscreen: boolean): void {
    if (this.fullscreen === fullscreen) {
      return;
    }
    this.fullscreen = fullscreen;
    this.applyLayout();
    if (this.lastFrame && this.visible) {
      this.update(
        this.lastFrame.playerLat,
        this.lastFrame.playerLng,
        this.lastFrame.playerHeading,
        this.lastFrame.landmarks,
      );
    }
  }

  setPlanetRadius(radius: number): void {
    if (radius > 0) {
      this.planetRadius = radius;
    }
  }

  setBackgroundColor(color: number): void {
    const hex = Math.max(0, Math.min(0xffffff, color));
    this.backgroundColor = `#${hex.toString(16).padStart(6, '0')}`;
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.canvas.remove();
    this.overlay.remove();
  }

  private onResize = (): void => {
    if (!this.fullscreen) {
      return;
    }
    this.applyLayout();
    if (this.visible && this.lastFrame) {
      this.update(
        this.lastFrame.playerLat,
        this.lastFrame.playerLng,
        this.lastFrame.playerHeading,
        this.lastFrame.landmarks,
      );
    }
  };

  private applyLayout(): void {
    if (this.fullscreen) {
      this.cssSize = Math.floor(Math.min(window.innerWidth * 0.6, 600));
      this.mapRadius = Math.floor(this.cssSize * 0.45);
      this.center = this.cssSize * 0.5;
      this.canvas.style.left = '50%';
      this.canvas.style.top = '50%';
      this.canvas.style.right = 'auto';
      this.canvas.style.bottom = 'auto';
      this.canvas.style.transform = 'translate(-50%, -50%)';
    } else {
      this.cssSize = 220;
      this.mapRadius = 100;
      this.center = 110;
      this.canvas.style.left = 'auto';
      this.canvas.style.top = 'auto';
      this.canvas.style.right = '24px';
      this.canvas.style.bottom = '24px';
      this.canvas.style.transform = 'none';
    }

    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.cssSize}px`;
    this.canvas.style.height = `${this.cssSize}px`;
    this.canvas.width = Math.floor(this.cssSize * dpr);
    this.canvas.height = Math.floor(this.cssSize * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.applyVisibility();
  }

  private applyVisibility(): void {
    this.canvas.style.display = this.visible ? 'block' : 'none';
    this.overlay.style.display =
      this.visible && this.fullscreen ? 'block' : 'none';
  }

  private drawGrid(playerLat: number, pixelsPerDegree: number): void {
    const ctx = this.context;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1;

    for (let lat = -90; lat <= 90; lat += 30) {
      const dLat = lat - playerLat;
      const y = this.center - dLat * pixelsPerDegree;
      const localY = y - this.center;
      const horizontalHalf = Math.sqrt(
        Math.max(0, this.mapRadius * this.mapRadius - localY * localY),
      );
      if (horizontalHalf < 1e-3) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(this.center - horizontalHalf, y);
      ctx.lineTo(this.center + horizontalHalf, y);
      ctx.stroke();
    }

    for (let deltaLng = -180; deltaLng <= 180; deltaLng += 30) {
      const x = this.center + deltaLng * pixelsPerDegree;
      const localX = x - this.center;
      const verticalHalf = Math.sqrt(
        Math.max(0, this.mapRadius * this.mapRadius - localX * localX),
      );
      if (verticalHalf < 1e-3) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(x, this.center - verticalHalf);
      ctx.lineTo(x, this.center + verticalHalf);
      ctx.stroke();
    }
  }

  private drawLandmarks(
    playerLat: number,
    playerLng: number,
    pixelsPerDegree: number,
    landmarks: MinimapLandmark[],
  ): void {
    const ctx = this.context;
    ctx.font = '10px ui-sans-serif, system-ui, sans-serif';

    for (const landmark of landmarks) {
      const dLng = this.wrapLongitude(landmark.lng - playerLng);
      const dLat = landmark.lat - playerLat;
      const x = this.center + dLng * pixelsPerDegree;
      const y = this.center - dLat * pixelsPerDegree;
      const dx = x - this.center;
      const dy = y - this.center;
      if (dx * dx + dy * dy > (this.mapRadius - 3) * (this.mapRadius - 3)) {
        continue;
      }

      ctx.fillStyle = '#ff9b3d';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(landmark.name, x + 6, y);
    }
  }

  private drawPlayerHeading(heading: number): void {
    const ctx = this.context;
    ctx.save();
    ctx.translate(this.center, this.center);
    ctx.rotate((heading * Math.PI) / 180);
    ctx.fillStyle = '#3ce874';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(7.5, 8.5);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-7.5, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawScale(
    pixelsPerDegree: number,
    playerLat: number,
    playerLng: number,
  ): void {
    const lineLength = this.fullscreen ? 84 : 54;
    const x0 = this.center - this.mapRadius + 16;
    const y = this.center + this.mapRadius - 14;
    const angleInDegrees = lineLength / pixelsPerDegree;
    const start = geoToCartesian(playerLat, playerLng, this.planetRadius);
    const end = geoToCartesian(
      playerLat,
      this.wrapLongitude(playerLng + angleInDegrees),
      this.planetRadius,
    );
    const dot = Math.max(-1, Math.min(1, start.normalize().dot(end.normalize())));
    const centralAngle = Math.acos(dot);
    const surfaceDistance = this.planetRadius * centralAngle;

    const ctx = this.context;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + lineLength, y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(this.formatDistance(surfaceDistance), x0, y - 10);
  }

  private wrapLongitude(delta: number): number {
    return ((delta + 540) % 360) - 180;
  }

  private formatDistance(distance: number): string {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${distance.toFixed(0)} m`;
  }
}
