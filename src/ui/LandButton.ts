import type { IDisposable } from '../core/types';

/**
 * 降落按钮：从轨道模式进入地表漫步
 */
export class LandButton implements IDisposable {
  private readonly button: HTMLButtonElement;
  private onClick: (() => void) | null = null;
  private lastClickAt = 0;

  constructor() {
    this.button = document.createElement('button');
    this.button.textContent = '🚀 降落到地表';
    this.button.type = 'button';
    this.button.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      padding: 12px 32px; background: linear-gradient(135deg, #1a6bff, #0044cc);
      color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 24px;
      font-size: 16px; font-family: system-ui, sans-serif; font-weight: 600;
      cursor: pointer; z-index: 50; letter-spacing: 1px;
      backdrop-filter: blur(6px); transition: all 0.2s;
      box-shadow: 0 4px 20px rgba(26,107,255,0.4);
    `;

    this.button.addEventListener('mouseenter', () => {
      this.button.style.transform = 'translateX(-50%) scale(1.05)';
      this.button.style.boxShadow = '0 6px 28px rgba(26,107,255,0.6)';
    });
    this.button.addEventListener('mouseleave', () => {
      this.button.style.transform = 'translateX(-50%) scale(1)';
      this.button.style.boxShadow = '0 4px 20px rgba(26,107,255,0.4)';
    });

    this.button.addEventListener('click', () => {
      const now = Date.now();
      if (now - this.lastClickAt < 300) {
        return;
      }
      this.lastClickAt = now;
      this.onClick?.();
    });
    document.body.appendChild(this.button);
  }

  setOnClick(callback: () => void): void {
    this.onClick = callback;
  }

  show(): void {
    this.button.style.display = 'block';
  }

  hide(): void {
    this.button.style.display = 'none';
  }

  dispose(): void {
    this.button.remove();
  }
}
