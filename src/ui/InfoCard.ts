/**
 * 地标信息卡片：HTML覆盖层显示地标详情
 */
export class InfoCard {
  private readonly container: HTMLDivElement;
  private visible = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'landmark-info-card';
    this.container.style.cssText = `
      position: fixed; display: none; padding: 16px 20px;
      background: rgba(0,0,0,0.85); color: #fff; border-radius: 12px;
      border: 1px solid rgba(255,200,50,0.4); font-family: sans-serif;
      pointer-events: none; z-index: 100; min-width: min(200px, calc(100vw - 24px));
      max-width: min(320px, calc(100vw - 24px)); max-height: 80vh; overflow-y: auto;
      font-size: clamp(11px, 3vw, 13px);
      backdrop-filter: blur(8px); transition: opacity 0.2s;
    `;
    document.body.appendChild(this.container);

    // 点击外部关闭
    document.addEventListener('pointerdown', (e) => {
      if (this.visible && !this.container.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  /** 显示地标信息 */
  show(name: string, description: string, lat: number, lng: number, screenX: number, screenY: number): void {
    this.container.innerHTML = `
      <div style="font-size:clamp(14px, 4vw, 16px);font-weight:bold;margin-bottom:8px;color:#ffc832">${name}</div>
      <div style="font-size:clamp(12px, 3.2vw, 13px);margin-bottom:6px;opacity:0.85">${description || '未知地标'}</div>
      <div style="font-size:clamp(10px, 2.8vw, 11px);opacity:0.6">📍 ${lat.toFixed(2)}°, ${lng.toFixed(2)}°</div>
    `;
    this.container.style.display = 'block';
    const maxX = Math.max(8, window.innerWidth - this.container.offsetWidth - 8);
    const maxY = Math.max(8, window.innerHeight - this.container.offsetHeight - 8);
    this.container.style.left = `${Math.min(screenX, maxX)}px`;
    this.container.style.top = `${Math.min(screenY, maxY)}px`;
    this.visible = true;
  }

  hide(): void {
    this.container.style.display = 'none';
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    this.container.remove();
  }
}
