import type { Telemetry } from '../core/types';
import type { SurfaceScene } from '../surface/SurfaceScene';

const SIZE = 180;
const RANGE = 90;
const GRID = 48;
const TRAIL_LEN = 64;

export class Minimap {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private label: HTMLElement;
  private terrainTile: HTMLCanvasElement;
  private tileOrigin = { x: Number.NaN, z: Number.NaN };
  private trail: Array<{ x: number; z: number }> = [];
  private lastSample = 0;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('section');
    this.root.className = 'minimap';
    this.root.setAttribute('data-ui', 'minimap');
    this.root.innerHTML = `
      <div class="minimap__label" data-label>LOCAL GRID</div>
      <canvas class="minimap__canvas" width="${SIZE * 2}" height="${SIZE * 2}"></canvas>
      <div class="minimap__scale">50 m</div>
    `;
    parent.appendChild(this.root);
    this.canvas = this.root.querySelector('canvas') as HTMLCanvasElement;
    this.label = this.root.querySelector('[data-label]') as HTMLElement;

    this.terrainTile = document.createElement('canvas');
    this.terrainTile.width = GRID;
    this.terrainTile.height = GRID;
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? 'block' : 'none';
  }

  setLandmark(label: string | null): void {
    this.label.textContent = label ? `LOCAL GRID · ${label.toUpperCase()}` : 'LOCAL GRID';
  }

  update(telemetry: Telemetry, surface: SurfaceScene, nowSeconds: number, playerX: number, playerZ: number, yawDeg: number): void {
    if (telemetry.mode !== 'surface') {
      this.setVisible(false);
      return;
    }
    this.setVisible(true);

    if (nowSeconds - this.lastSample > 0.12) {
      this.lastSample = nowSeconds;
      this.trail.push({ x: playerX, z: playerZ });
      if (this.trail.length > TRAIL_LEN) this.trail.shift();
    }

    if (Math.abs(this.tileOrigin.x - playerX) > 8 || Math.abs(this.tileOrigin.z - playerZ) > 8 || Number.isNaN(this.tileOrigin.x)) {
      this.renderTerrainTile(surface, playerX, playerZ);
      this.tileOrigin.x = playerX;
      this.tileOrigin.z = playerZ;
    }

    this.renderFrame(playerX, playerZ, yawDeg);
  }

  private renderTerrainTile(surface: SurfaceScene, cx: number, cz: number): void {
    const ctx = this.terrainTile.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(GRID, GRID);
    const heights = new Float32Array(GRID * GRID);
    let min = Infinity;
    let max = -Infinity;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const worldX = cx + ((i / GRID) * 2 - 1) * RANGE;
        const worldZ = cz + ((j / GRID) * 2 - 1) * RANGE;
        const h = surface.getHeightAt(worldX, worldZ);
        heights[j * GRID + i] = h;
        if (h < min) min = h;
        if (h > max) max = h;
      }
    }
    const range = max - min || 1;
    for (let i = 0; i < heights.length; i++) {
      const t = (heights[i] - min) / range;
      const idx = i * 4;
      const v = Math.round(30 + t * 180);
      img.data[idx + 0] = v * 0.95;
      img.data[idx + 1] = v * 0.78;
      img.data[idx + 2] = v * 0.65;
      img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  private renderFrame(playerX: number, playerZ: number, yawDeg: number): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, W, H);

    // terrain tile
    ctx.save();
    ctx.translate(W / 2, H / 2);
    const yawRad = (yawDeg * Math.PI) / 180;
    ctx.rotate(-yawRad);
    const offsetPx = {
      x: ((playerX - this.tileOrigin.x) / RANGE) * (W / 2),
      y: ((playerZ - this.tileOrigin.z) / RANGE) * (H / 2),
    };
    ctx.globalAlpha = 0.85;
    ctx.drawImage(this.terrainTile, -W / 2 - offsetPx.x, -H / 2 - offsetPx.y, W, H);
    ctx.globalAlpha = 1;

    // trail
    ctx.strokeStyle = 'rgba(0, 214, 143, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const px = ((p.x - playerX) / RANGE) * (W / 2);
      const py = ((p.z - playerZ) / RANGE) * (H / 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // player arrow (center, fixed)
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.fillStyle = 'rgb(255, 222, 0)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, 10);
    ctx.lineTo(0, 4);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // bezel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // compass marks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '20px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', W / 2, 22);
    ctx.fillText('S', W / 2, H - 8);
    ctx.textAlign = 'left';
    ctx.fillText('E', W - 20, H / 2 + 6);
    ctx.textAlign = 'right';
    ctx.fillText('W', 20, H / 2 + 6);
  }
}
