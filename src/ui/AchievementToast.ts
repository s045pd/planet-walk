import type { IDisposable } from '../core/types';
import type { AchievementStatus } from '../achievement/AchievementManager';

export class AchievementToast implements IDisposable {
  private readonly container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '16px';
    this.container.style.right = '16px';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '8px';
    this.container.style.maxWidth = 'min(360px, calc(100vw - 24px))';
    this.container.style.maxHeight = '80vh';
    this.container.style.overflowY = 'auto';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '120';
    document.body.appendChild(this.container);
  }

  show(status: AchievementStatus): void {
    const toast = document.createElement('div');
    toast.style.minWidth = 'min(280px, calc(100vw - 24px))';
    toast.style.maxWidth = 'min(360px, calc(100vw - 24px))';
    toast.style.padding = '12px 14px';
    toast.style.borderRadius = '10px';
    toast.style.border = '1px solid rgba(148, 206, 255, 0.6)';
    toast.style.background = 'rgba(7, 18, 34, 0.92)';
    toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.35)';
    toast.style.color = '#e7f3ff';
    toast.style.fontFamily = 'system-ui, sans-serif';
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    toast.style.transition = 'transform 0.22s ease, opacity 0.22s ease';

    const title = document.createElement('div');
    title.textContent = `成就解锁: ${status.definition.name}`;
    title.style.fontSize = 'clamp(13px, 3.4vw, 14px)';
    title.style.fontWeight = '700';
    title.style.marginBottom = '4px';

    const desc = document.createElement('div');
    desc.textContent = status.definition.description;
    desc.style.fontSize = 'clamp(11px, 3vw, 12px)';
    desc.style.opacity = '0.9';

    toast.append(title, desc);
    this.container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    window.setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      window.setTimeout(() => toast.remove(), 240);
    }, 3000);
  }

  dispose(): void {
    this.container.remove();
  }
}
