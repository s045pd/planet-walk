import type { IDisposable } from '../core/types';

export class HelpOverlay implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private visible = false;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: fixed; inset: 0; z-index: 140;
      display: none; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.62);
      padding: 20px;
    `;
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) {
        this.close();
      }
    });

    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      width: min(560px, calc(100vw - 24px));
      border-radius: 12px;
      border: 1px solid rgba(163, 201, 255, 0.52);
      background: rgba(8, 16, 30, 0.96);
      color: #eaf3ff;
      padding: 16px;
      font-family: ui-sans-serif, system-ui, sans-serif;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    `;

    const title = document.createElement('div');
    title.textContent = 'Keyboard Shortcuts';
    title.style.cssText = 'font-size:18px;font-weight:700;margin-bottom:4px;';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Press H or Esc to close';
    subtitle.style.cssText = 'font-size:12px;opacity:0.8;margin-bottom:12px;';

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.5;';

    const shortcuts: Array<[string, string]> = [
      ['H', 'Toggle this help overlay'],
      ['Tab', 'Open/close achievements panel'],
      ['P', 'Toggle photo mode'],
      ['T', 'Cycle day/night time speed'],
      ['E', 'Toggle scanner'],
      ['F', 'Collect nearby sample'],
      ['M', 'Toggle minimap fullscreen'],
      ['F3', 'Toggle debug panel'],
      ['Esc', 'Close overlay/panel or return to orbit'],
      ['WASD', 'Move on surface'],
      ['Space', 'Jump on surface'],
      ['Mouse Drag / Wheel', 'Orbit rotate / zoom'],
    ];

    for (const [key, desc] of shortcuts) {
      const row = document.createElement('div');
      row.style.display = 'grid';
      row.style.gridTemplateColumns = '130px 1fr';
      row.style.gap = '8px';

      const keyLabel = document.createElement('span');
      keyLabel.textContent = key;
      keyLabel.style.cssText = `
        display:inline-flex;align-items:center;justify-content:center;
        min-height:24px;padding:0 8px;
        border-radius:6px;border:1px solid rgba(145, 196, 255, 0.45);
        background: rgba(20, 34, 55, 0.9);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight:700;
      `;

      const descLabel = document.createElement('span');
      descLabel.textContent = desc;

      row.append(keyLabel, descLabel);
      list.appendChild(row);
    }

    this.panel.append(title, subtitle, list);
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.visible;
  }

  toggle(): void {
    if (this.visible) {
      this.close();
      return;
    }
    this.open();
  }

  open(): void {
    if (this.visible) {
      return;
    }
    this.visible = true;
    this.root.style.display = 'flex';
  }

  close(): void {
    if (!this.visible) {
      return;
    }
    this.visible = false;
    this.root.style.display = 'none';
  }

  dispose(): void {
    this.root.remove();
  }
}
