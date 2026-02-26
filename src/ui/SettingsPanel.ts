import type * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import type { IDisposable } from '../core/types';

const STORAGE_KEY = 'planet-walk-settings';
const BASE_PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
const BASE_MOUSE_SENSITIVITY = 0.002;

type ResolutionScale = 0.5 | 1 | 2;

interface SettingsState {
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  resolutionScale: ResolutionScale;
}

interface StoredSettingsState extends Partial<SettingsState> {
  version?: number;
}

export interface SettingsPanelConfig {
  audioManager: AudioManager;
  renderer: THREE.WebGLRenderer;
  onPixelRatioChange?: (pixelRatio: number) => void;
}

let currentMouseSensitivity = BASE_MOUSE_SENSITIVITY;

export function getMouseSensitivity(): number {
  return currentMouseSensitivity;
}

/** 设置面板：音量、鼠标灵敏度、分辨率比例 */
export class SettingsPanel implements IDisposable {
  private readonly audioManager: AudioManager;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly onPixelRatioChange: ((pixelRatio: number) => void) | null;

  private readonly triggerButton: HTMLButtonElement;
  private readonly overlay: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly masterSlider: HTMLInputElement;
  private readonly ambientSlider: HTMLInputElement;
  private readonly sfxSlider: HTMLInputElement;
  private readonly sensitivitySlider: HTMLInputElement;
  private readonly sensitivityValue: HTMLSpanElement;
  private readonly resolutionSelect: HTMLSelectElement;

  private openState = false;
  private settings: SettingsState;

  constructor(config: SettingsPanelConfig) {
    this.audioManager = config.audioManager;
    this.renderer = config.renderer;
    this.onPixelRatioChange = config.onPixelRatioChange ?? null;
    this.settings = this.loadSettings();

    this.triggerButton = document.createElement('button');
    this.triggerButton.type = 'button';
    this.triggerButton.setAttribute('aria-label', 'Open settings panel');
    this.triggerButton.textContent = '⚙';
    this.triggerButton.style.cssText = `
      position: fixed; right: 18px; bottom: 18px; z-index: 90;
      width: 48px; height: 48px; border-radius: 999px;
      border: 1px solid rgba(160, 196, 255, 0.45);
      background: rgba(9, 18, 31, 0.88);
      color: #e6f2ff; font-size: 20px; cursor: pointer;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
    `;
    this.triggerButton.addEventListener('click', this.onTriggerClick);

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 125;
      display: none; align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.58);
      padding: 16px;
    `;
    this.overlay.addEventListener('click', this.onOverlayClick);

    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      width: min(420px, calc(100vw - 24px));
      max-height: min(88vh, 640px);
      overflow-y: auto;
      border-radius: 12px;
      border: 1px solid rgba(155, 192, 255, 0.42);
      background: linear-gradient(180deg, rgba(8, 16, 30, 0.97), rgba(7, 12, 24, 0.97));
      color: #e8f2ff;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.45);
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      padding: 14px;
    `;

    const title = document.createElement('div');
    title.textContent = 'Settings';
    title.style.cssText = 'font-size:clamp(16px,4vw,18px);font-weight:700;margin-bottom:10px;';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Esc or click outside to close';
    subtitle.style.cssText = 'font-size:clamp(11px,3vw,12px);opacity:0.75;margin-bottom:12px;';

    this.masterSlider = this.createSlider('Master Volume', this.settings.masterVolume, (value) => {
      this.settings.masterVolume = value;
      this.audioManager.setMasterVolume(value);
      this.saveSettings();
    });

    this.ambientSlider = this.createSlider('Ambient Volume', this.settings.ambientVolume, (value) => {
      this.settings.ambientVolume = value;
      this.audioManager.setAmbientVolume(value);
      this.saveSettings();
    });

    this.sfxSlider = this.createSlider('SFX Volume', this.settings.sfxVolume, (value) => {
      this.settings.sfxVolume = value;
      this.audioManager.setSfxVolume(value);
      this.saveSettings();
    });

    const sensitivityRow = document.createElement('label');
    sensitivityRow.style.cssText =
      'display:flex;flex-direction:column;gap:6px;font-size:clamp(12px,3.2vw,13px);';

    const sensitivityTop = document.createElement('div');
    sensitivityTop.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
    const sensitivityLabel = document.createElement('span');
    sensitivityLabel.textContent = 'Mouse Sensitivity';
    this.sensitivityValue = document.createElement('span');
    this.sensitivityValue.style.opacity = '0.8';
    sensitivityTop.append(sensitivityLabel, this.sensitivityValue);

    this.sensitivitySlider = document.createElement('input');
    this.sensitivitySlider.type = 'range';
    this.sensitivitySlider.min = '0.5';
    this.sensitivitySlider.max = '2';
    this.sensitivitySlider.step = '0.05';
    this.sensitivitySlider.value = String(
      this.settings.mouseSensitivity / BASE_MOUSE_SENSITIVITY,
    );
    this.sensitivitySlider.style.cssText = 'width:100%;accent-color:#7ab4ff;cursor:pointer;';
    this.sensitivitySlider.addEventListener('input', this.onSensitivityInput);

    sensitivityRow.append(sensitivityTop, this.sensitivitySlider);

    const resolutionRow = document.createElement('label');
    resolutionRow.style.cssText =
      'display:flex;flex-direction:column;gap:6px;font-size:clamp(12px,3.2vw,13px);';
    const resolutionLabel = document.createElement('span');
    resolutionLabel.textContent = 'Resolution Scale';
    this.resolutionSelect = document.createElement('select');
    this.resolutionSelect.style.cssText = `
      min-height: 40px; border-radius: 8px; padding: 6px 10px;
      border: 1px solid rgba(150, 187, 255, 0.42);
      background: rgba(11, 23, 40, 0.95); color: #eaf4ff;
      font-size: clamp(12px, 3.1vw, 13px); cursor: pointer;
    `;
    this.resolutionSelect.innerHTML = `
      <option value="0.5">0.5x</option>
      <option value="1">1x</option>
      <option value="2">2x</option>
    `;
    this.resolutionSelect.value = String(this.settings.resolutionScale);
    this.resolutionSelect.addEventListener('change', this.onResolutionChange);
    resolutionRow.append(resolutionLabel, this.resolutionSelect);

    const volumeGroup = document.createElement('div');
    volumeGroup.style.cssText = `
      border: 1px solid rgba(131, 170, 240, 0.28);
      border-radius: 10px;
      background: rgba(12, 24, 42, 0.45);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    volumeGroup.append(this.masterSlider.parentElement!, this.ambientSlider.parentElement!, this.sfxSlider.parentElement!);

    const controlGroup = document.createElement('div');
    controlGroup.style.cssText = `
      border: 1px solid rgba(131, 170, 240, 0.28);
      border-radius: 10px;
      background: rgba(12, 24, 42, 0.45);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    controlGroup.append(sensitivityRow, resolutionRow);

    this.panel.append(title, subtitle, volumeGroup, controlGroup);
    this.overlay.appendChild(this.panel);
    document.body.append(this.triggerButton, this.overlay);

    window.addEventListener('keydown', this.onWindowKeyDown);
    this.applySettings();
    this.updateSensitivityLabel();
  }

  get isOpen(): boolean {
    return this.openState;
  }

  getPixelRatio(): number {
    return BASE_PIXEL_RATIO * this.settings.resolutionScale;
  }

  toggle(): void {
    if (this.openState) {
      this.close();
      return;
    }
    this.open();
  }

  close(): void {
    if (!this.openState) {
      return;
    }
    this.openState = false;
    this.overlay.style.display = 'none';
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onWindowKeyDown);
    this.triggerButton.removeEventListener('click', this.onTriggerClick);
    this.overlay.removeEventListener('click', this.onOverlayClick);
    this.sensitivitySlider.removeEventListener('input', this.onSensitivityInput);
    this.resolutionSelect.removeEventListener('change', this.onResolutionChange);
    this.triggerButton.remove();
    this.overlay.remove();
  }

  private open(): void {
    if (this.openState) {
      return;
    }
    this.openState = true;
    this.overlay.style.display = 'flex';
  }

  private createSlider(
    label: string,
    value: number,
    onChange: (value: number) => void,
  ): HTMLInputElement {
    const row = document.createElement('label');
    row.style.cssText =
      'display:flex;flex-direction:column;gap:6px;font-size:clamp(12px,3.2vw,13px);';

    const top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

    const title = document.createElement('span');
    title.textContent = label;

    const valueLabel = document.createElement('span');
    valueLabel.style.opacity = '0.8';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = String(value);
    slider.style.cssText = 'width:100%;accent-color:#7ab4ff;cursor:pointer;';

    const updateLabel = (nextValue: number): void => {
      valueLabel.textContent = `${Math.round(nextValue * 100)}%`;
    };
    updateLabel(value);

    slider.addEventListener('input', () => {
      const nextValue = this.clamp01(Number(slider.value));
      slider.value = String(nextValue);
      updateLabel(nextValue);
      onChange(nextValue);
    });

    top.append(title, valueLabel);
    row.append(top, slider);
    this.panel.appendChild(row);
    return slider;
  }

  private onTriggerClick = (): void => {
    this.toggle();
  };

  private onOverlayClick = (event: MouseEvent): void => {
    if (event.target === this.overlay) {
      this.close();
    }
  };

  private onWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.openState) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.close();
    }
  };

  private onSensitivityInput = (): void => {
    const multiplier = this.clamp(
      Number(this.sensitivitySlider.value),
      0.5,
      2,
    );
    const sensitivity = BASE_MOUSE_SENSITIVITY * multiplier;
    this.settings.mouseSensitivity = sensitivity;
    currentMouseSensitivity = sensitivity;
    this.updateSensitivityLabel();
    this.saveSettings();
  };

  private onResolutionChange = (): void => {
    const raw = Number(this.resolutionSelect.value);
    const scale: ResolutionScale = raw === 0.5 || raw === 2 ? raw : 1;
    this.settings.resolutionScale = scale;
    this.applyResolution();
    this.saveSettings();
  };

  private applySettings(): void {
    this.audioManager.setMasterVolume(this.settings.masterVolume);
    this.audioManager.setAmbientVolume(this.settings.ambientVolume);
    this.audioManager.setSfxVolume(this.settings.sfxVolume);

    this.masterSlider.value = String(this.settings.masterVolume);
    this.ambientSlider.value = String(this.settings.ambientVolume);
    this.sfxSlider.value = String(this.settings.sfxVolume);

    currentMouseSensitivity = this.settings.mouseSensitivity;
    this.sensitivitySlider.value = String(
      this.settings.mouseSensitivity / BASE_MOUSE_SENSITIVITY,
    );
    this.updateSensitivityLabel();

    this.resolutionSelect.value = String(this.settings.resolutionScale);
    this.applyResolution();
  }

  private applyResolution(): void {
    const pixelRatio = this.getPixelRatio();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.onPixelRatioChange?.(pixelRatio);
  }

  private loadSettings(): SettingsState {
    const fallback: SettingsState = {
      masterVolume: 0.5,
      ambientVolume: 1,
      sfxVolume: 1,
      mouseSensitivity: BASE_MOUSE_SENSITIVITY,
      resolutionScale: 1,
    };

    if (typeof localStorage === 'undefined') {
      return fallback;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw) as StoredSettingsState;
      return {
        masterVolume: this.normalizeVolume(parsed.masterVolume, fallback.masterVolume),
        ambientVolume: this.normalizeVolume(parsed.ambientVolume, fallback.ambientVolume),
        sfxVolume: this.normalizeVolume(parsed.sfxVolume, fallback.sfxVolume),
        mouseSensitivity: this.normalizeSensitivity(
          parsed.mouseSensitivity,
          fallback.mouseSensitivity,
        ),
        resolutionScale: this.normalizeResolutionScale(parsed.resolutionScale),
      };
    } catch {
      return fallback;
    }
  }

  private saveSettings(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const payload: StoredSettingsState = {
      version: 1,
      masterVolume: this.settings.masterVolume,
      ambientVolume: this.settings.ambientVolume,
      sfxVolume: this.settings.sfxVolume,
      mouseSensitivity: this.settings.mouseSensitivity,
      resolutionScale: this.settings.resolutionScale,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  private updateSensitivityLabel(): void {
    const multiplier = this.settings.mouseSensitivity / BASE_MOUSE_SENSITIVITY;
    this.sensitivityValue.textContent = `${multiplier.toFixed(2)}x`;
  }

  private normalizeVolume(value: unknown, fallback: number): number {
    if (typeof value !== 'number') {
      return fallback;
    }
    return this.clamp01(value);
  }

  private normalizeSensitivity(value: unknown, fallback: number): number {
    if (typeof value !== 'number') {
      return fallback;
    }
    return this.clamp(value, BASE_MOUSE_SENSITIVITY * 0.5, BASE_MOUSE_SENSITIVITY * 2);
  }

  private normalizeResolutionScale(value: unknown): ResolutionScale {
    if (value === 0.5 || value === 2) {
      return value;
    }
    return 1;
  }

  private clamp01(value: number): number {
    return this.clamp(value, 0, 1);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
