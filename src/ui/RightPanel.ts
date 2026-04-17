import type { Telemetry } from '../core/types';

export class RightPanel {
  private root: HTMLElement;
  private trajectoryCanvas: HTMLCanvasElement;
  private attitudeCanvas: HTMLCanvasElement;
  private trajectoryCaption: HTMLElement;
  private attitudeCaption: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('section');
    this.root.className = 'rightpanel';
    this.root.setAttribute('data-ui', 'right');
    this.root.innerHTML = `
      <div>
        <div class="rightpanel__label">TRAJECTORY</div>
        <canvas data-trajectory width="280" height="280"></canvas>
        <div class="rightpanel__caption" data-trajectory-caption>APPROACH</div>
      </div>
      <div>
        <div class="rightpanel__label">ATTITUDE</div>
        <canvas data-attitude width="280" height="280"></canvas>
        <div class="rightpanel__caption" data-attitude-caption>PITCH · ROLL</div>
      </div>
    `;
    parent.appendChild(this.root);
    this.trajectoryCanvas = this.root.querySelector('[data-trajectory]') as HTMLCanvasElement;
    this.attitudeCanvas = this.root.querySelector('[data-attitude]') as HTMLCanvasElement;
    this.trajectoryCaption = this.root.querySelector('[data-trajectory-caption]') as HTMLElement;
    this.attitudeCaption = this.root.querySelector('[data-attitude-caption]') as HTMLElement;
  }

  update(telemetry: Telemetry, skyTop: string, surfaceMid: string): void {
    this.drawTrajectory(telemetry, skyTop, surfaceMid);
    this.drawAttitude(telemetry, surfaceMid);
    this.trajectoryCaption.textContent = telemetry.mode === 'orbit'
      ? `DIST ${(telemetry.altitude / 1000).toFixed(1)} km`
      : `HEADING ${telemetry.heading.toFixed(1)}°`;
    this.attitudeCaption.textContent = `PITCH ${telemetry.pitch >= 0 ? '+' : ''}${telemetry.pitch.toFixed(1)}°  ·  ROLL ${telemetry.roll >= 0 ? '+' : ''}${telemetry.roll.toFixed(1)}°`;
  }

  private drawTrajectory(telemetry: Telemetry, sky: string, surface: string): void {
    const ctx = this.trajectoryCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.trajectoryCanvas.width;
    const h = this.trajectoryCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = sky;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // planet disc
    ctx.fillStyle = surface;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 62, 0, Math.PI * 2);
    ctx.stroke();

    // dashed orbit
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 100, 94, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // position from lat/lon (orthographic from viewer angle)
    const lat = (telemetry.lat * Math.PI) / 180;
    const lon = (telemetry.lon * Math.PI) / 180;
    const px = cx + 62 * Math.cos(lat) * Math.cos(lon);
    const py = cy - 62 * Math.sin(lat);

    // approach curve
    ctx.strokeStyle = 'rgba(74,158,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy - 70);
    ctx.quadraticCurveTo(cx - 20, cy - 20, px, py);
    ctx.stroke();

    // current marker
    ctx.fillStyle = 'rgb(0,214,143)';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,214,143,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.stroke();

    // start marker
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(cx - 102, cy - 72, 2, 2);

    // crosshair ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, 10); ctx.lineTo(cx, w - 10);
    ctx.moveTo(10, cy); ctx.lineTo(h - 10, cy);
    ctx.stroke();
  }

  private drawAttitude(telemetry: Telemetry, surface: string): void {
    const ctx = this.attitudeCanvas.getContext('2d');
    if (!ctx) return;
    const w = this.attitudeCanvas.width;
    const h = this.attitudeCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = 88;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    const roll = (telemetry.roll * Math.PI) / 180;
    ctx.rotate(roll);

    // ground hemisphere
    ctx.fillStyle = surface;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    const pitchOffset = telemetry.pitch * 1.5;
    ctx.fillRect(-r, pitchOffset, r * 2, r * 2);
    ctx.globalAlpha = 1;

    // horizon line
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r, pitchOffset);
    ctx.lineTo(r, pitchOffset);
    ctx.stroke();

    ctx.restore();

    // bezel ring
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // fixed aircraft marker
    ctx.strokeStyle = 'rgb(255,222,0)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy);
    ctx.lineTo(cx - 10, cy);
    ctx.moveTo(cx + 10, cy);
    ctx.lineTo(cx + 26, cy);
    ctx.stroke();
    ctx.fillStyle = 'rgb(255,222,0)';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // compass ticks
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, cy - r - 6);
    ctx.fillText('S', cx, cy + r + 14);
    ctx.textAlign = 'left';
    ctx.fillText('E', cx + r + 6, cy + 4);
    ctx.textAlign = 'right';
    ctx.fillText('W', cx - r - 6, cy + 4);
  }
}
