import type { IDisposable } from '../core/types';
import type { PhotoFilterType } from '../postprocess/FilterManager';
import { clamp } from '../utils/math';

export interface PhotoModeUIConfig {
  onFilterChange: (filter: PhotoFilterType) => void;
  onCapture: () => void;
  onHudToggle: (hidden: boolean) => void;
  onFovChange: (fov: number) => void;
}

interface PhotoModeUIState {
  filter: PhotoFilterType;
  hideHUD: boolean;
  fov: number;
}

/** 照片模式界面：滤镜、HUD开关、截图和FOV调节 */
export class PhotoModeUI implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly hudToggle: HTMLInputElement;
  private readonly fovSlider: HTMLInputElement;
  private readonly fovValue: HTMLSpanElement;
  private readonly screenshotToast: HTMLDivElement;
  private readonly filterButtons = new Map<PhotoFilterType, HTMLButtonElement>();

  private readonly onFilterChange: (filter: PhotoFilterType) => void;
  private readonly onCapture: () => void;
  private readonly onHudToggle: (hidden: boolean) => void;
  private readonly onFovChange: (fov: number) => void;

  private visible = false;
  private toastTimer: number | null = null;

  constructor(config: PhotoModeUIConfig) {
    this.onFilterChange = config.onFilterChange;
    this.onCapture = config.onCapture;
    this.onHudToggle = config.onHudToggle;
    this.onFovChange = config.onFovChange;

    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: fixed; left: 16px; bottom: 16px; z-index: 1001;
      background: rgba(7, 14, 24, 0.92); border: 1px solid rgba(149, 201, 255, 0.55);
      border-radius: 12px; padding: 14px; color: #f0f6ff;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      width: min(360px, calc(100vw - 32px)); backdrop-filter: blur(8px);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
      max-height: 80vh; overflow-y: auto;
      display: none;
    `;

    const title = document.createElement('div');
    title.textContent = '照片模式';
    title.style.cssText = 'font-size:clamp(13px, 3.4vw, 14px);font-weight:700;letter-spacing:0.4px;margin-bottom:10px;';

    const filterLabel = document.createElement('div');
    filterLabel.textContent = '滤镜';
    filterLabel.style.cssText = 'font-size:clamp(11px, 3vw, 12px);opacity:0.85;margin-bottom:6px;';

    const filterPanel = document.createElement('div');
    filterPanel.style.cssText = `
      background:#0a131f; border:1px solid #4d688c; border-radius:10px;
      padding:10px; margin-bottom:12px;
    `;

    const filterRow = document.createElement('div');
    filterRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    this.createFilterButton(filterRow, '正常', 'normal');
    this.createFilterButton(filterRow, '复古', 'vintage');
    this.createFilterButton(filterRow, '科幻', 'sci-fi');
    this.createFilterButton(filterRow, '黑白', 'bw');
    filterPanel.append(filterRow);

    const hudRow = document.createElement('label');
    hudRow.style.cssText =
      'display:flex;align-items:center;gap:8px;font-size:clamp(11px, 3vw, 12px);margin-bottom:12px;cursor:pointer;min-height:44px;';
    this.hudToggle = document.createElement('input');
    this.hudToggle.type = 'checkbox';
    this.hudToggle.addEventListener('change', () => {
      this.onHudToggle(this.hudToggle.checked);
    });
    const hudText = document.createElement('span');
    hudText.textContent = '隐藏HUD';
    hudRow.append(this.hudToggle, hudText);

    const fovHeader = document.createElement('div');
    fovHeader.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;font-size:clamp(11px, 3vw, 12px);margin-bottom:6px;';
    const fovLabel = document.createElement('span');
    fovLabel.textContent = 'FOV';
    this.fovValue = document.createElement('span');
    this.fovValue.textContent = '60°';
    this.fovValue.style.opacity = '0.9';
    fovHeader.append(fovLabel, this.fovValue);

    this.fovSlider = document.createElement('input');
    this.fovSlider.type = 'range';
    this.fovSlider.min = '30';
    this.fovSlider.max = '110';
    this.fovSlider.step = '1';
    this.fovSlider.style.cssText = 'width:100%;margin-bottom:12px;min-height:44px;';
    this.fovSlider.addEventListener('input', () => {
      const fov = clamp(Number(this.fovSlider.value), 30, 110);
      this.fovValue.textContent = `${Math.round(fov)}°`;
      this.onFovChange(fov);
    });

    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';

    const captureButton = document.createElement('button');
    captureButton.textContent = '拍照';
    captureButton.type = 'button';
    captureButton.style.cssText =
      'padding:7px 12px;border-radius:8px;border:1px solid rgba(117,196,255,0.5);background:#2274d6;color:#fff;cursor:pointer;font-size:clamp(11px, 3vw, 12px);font-weight:600;min-height:44px;min-width:44px;';
    captureButton.addEventListener('click', () => {
      this.onCapture();
      this.showScreenshotToast();
    });

    const tip = document.createElement('span');
    tip.textContent = 'P 退出';
    tip.style.cssText = 'font-size:clamp(10px, 2.8vw, 11px);opacity:0.7;';

    actionRow.append(captureButton, tip);

    this.screenshotToast = document.createElement('div');
    this.screenshotToast.textContent = 'Screenshot saved!';
    this.screenshotToast.style.cssText = `
      position:absolute; right:14px; bottom:14px;
      padding:6px 10px; border-radius:8px;
      border:1px solid rgba(149, 225, 186, 0.9);
      background:#0d2a1d; color:#ddffe9;
      font-size:clamp(11px, 3vw, 12px); font-weight:600;
      opacity:0; transform:translateY(6px);
      transition:opacity 160ms ease, transform 160ms ease;
      pointer-events:none;
    `;

    this.root.append(title, filterLabel, filterPanel, hudRow, fovHeader, this.fovSlider, actionRow, this.screenshotToast);
    document.body.appendChild(this.root);
    this.applyResponsiveLayout();
    window.addEventListener('resize', this.onResize);
  }

  show(state: PhotoModeUIState): void {
    this.visible = true;
    this.root.style.display = 'block';
    this.setFilter(state.filter);
    this.setHUDHidden(state.hideHUD);
    this.setFov(state.fov);
  }

  hide(): void {
    if (!this.visible) {
      return;
    }
    this.visible = false;
    this.root.style.display = 'none';
  }

  setFilter(filter: PhotoFilterType): void {
    for (const [type, button] of this.filterButtons) {
      const active = type === filter;
      button.style.background = active ? '#f0c66b' : '#131d2c';
      button.style.color = active ? '#241100' : '#f6fbff';
      button.style.borderColor = active
        ? '#ffde97'
        : '#6b89b4';
    }
  }

  setHUDHidden(hidden: boolean): void {
    this.hudToggle.checked = hidden;
  }

  setFov(fov: number): void {
    const clamped = clamp(fov, 30, 110);
    this.fovSlider.value = String(Math.round(clamped));
    this.fovValue.textContent = `${Math.round(clamped)}°`;
  }

  dispose(): void {
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    window.removeEventListener('resize', this.onResize);
    this.root.remove();
  }

  private createFilterButton(
    container: HTMLElement,
    label: string,
    filter: PhotoFilterType,
  ): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText =
      'padding:6px 10px;border-radius:7px;border:1px solid #6b89b4;background:#131d2c;color:#f6fbff;cursor:pointer;font-size:clamp(11px, 3vw, 12px);font-weight:600;min-height:44px;min-width:44px;';
    button.addEventListener('click', () => {
      this.setFilter(filter);
      this.onFilterChange(filter);
    });
    this.filterButtons.set(filter, button);
    container.appendChild(button);
  }

  private showScreenshotToast(): void {
    this.screenshotToast.style.opacity = '1';
    this.screenshotToast.style.transform = 'translateY(0)';
    if (this.toastTimer !== null) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => {
      this.screenshotToast.style.opacity = '0';
      this.screenshotToast.style.transform = 'translateY(6px)';
      this.toastTimer = null;
    }, 2000);
  }

  private onResize = (): void => {
    this.applyResponsiveLayout();
  };

  private applyResponsiveLayout(): void {
    const compactViewport = window.innerWidth <= 480 || window.innerHeight <= 680;
    if (compactViewport) {
      this.root.style.left = '12px';
      this.root.style.right = '12px';
      this.root.style.bottom = '12px';
      this.root.style.width = 'calc(100vw - 24px)';
      this.root.style.padding = '12px';
      return;
    }

    this.root.style.left = '16px';
    this.root.style.right = 'auto';
    this.root.style.bottom = '16px';
    this.root.style.width = 'min(360px, calc(100vw - 32px))';
    this.root.style.padding = '14px';
  }
}
