import type { IDisposable } from '../core/types';
import { getLocale, onLocaleChange, t } from '../i18n';

type ShareTemplate = 'minimal' | 'sci-fi' | 'postcard';

export interface ShareCardState {
  planet: string;
  lat: number;
  lng: number;
  yaw: number;
  pitch: number;
  capturedAt: Date;
}

export interface ShareCardPayload {
  screenshotDataUrl: string;
  state: ShareCardState;
}

/** 分享卡片：模板预览、下载、复制链接、Web Share */
export class ShareCard implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly title: HTMLDivElement;
  private readonly subtitle: HTMLDivElement;
  private readonly templateLabel: HTMLDivElement;
  private readonly previewCanvas: HTMLCanvasElement;
  private readonly statusText: HTMLDivElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly downloadButton: HTMLButtonElement;
  private readonly copyLinkButton: HTMLButtonElement;
  private readonly webShareButton: HTMLButtonElement;
  private readonly unsubscribeLocaleChange: () => void;
  private readonly templateButtons = new Map<ShareTemplate, HTMLButtonElement>();

  private activeTemplate: ShareTemplate = 'minimal';
  private visible = false;
  private sourceImage: HTMLImageElement | null = null;
  private shareState: ShareCardState | null = null;
  private openToken = 0;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText = `
      position: fixed; inset: 0; z-index: 1500;
      display: none; align-items: center; justify-content: center;
      background: rgba(1, 5, 12, 0.72);
      padding: 16px;
    `;
    this.root.addEventListener('click', this.onBackdropClick);

    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      width: min(880px, calc(100vw - 24px));
      max-height: min(90vh, 900px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-radius: 14px;
      border: 1px solid rgba(140, 188, 255, 0.45);
      background: linear-gradient(180deg, rgba(8, 18, 33, 0.97), rgba(6, 12, 24, 0.97));
      color: #eaf4ff;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.48);
      padding: 14px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:12px;';

    const titleWrap = document.createElement('div');
    titleWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    this.title = document.createElement('div');
    this.title.style.cssText = 'font-size:clamp(17px,4.1vw,20px);font-weight:700;';
    this.subtitle = document.createElement('div');
    this.subtitle.style.cssText = 'font-size:clamp(11px,2.9vw,12px);opacity:0.78;';
    titleWrap.append(this.title, this.subtitle);

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.style.cssText = `
      min-width: 44px; min-height: 44px; border-radius: 10px;
      border: 1px solid rgba(152, 193, 255, 0.55);
      background: rgba(12, 25, 46, 0.92); color: #f2f8ff;
      font-size: 13px; font-weight: 700; cursor: pointer;
      padding: 0 12px;
    `;
    this.closeButton.addEventListener('click', () => {
      this.close();
    });

    header.append(titleWrap, this.closeButton);

    const previewWrap = document.createElement('div');
    previewWrap.style.cssText = `
      border-radius: 12px;
      border: 1px solid rgba(139, 182, 248, 0.4);
      background: rgba(6, 14, 26, 0.75);
      padding: 8px;
      min-height: 160px;
      overflow: auto;
    `;

    this.previewCanvas = document.createElement('canvas');
    this.previewCanvas.style.cssText = `
      display: block;
      width: 100%;
      max-height: min(58vh, 520px);
      height: auto;
      border-radius: 10px;
      background: #0a121f;
    `;
    previewWrap.appendChild(this.previewCanvas);

    const templateSection = document.createElement('div');
    templateSection.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
    this.templateLabel = document.createElement('div');
    this.templateLabel.style.cssText = 'font-size:clamp(11px,3vw,12px);opacity:0.82;';
    templateSection.appendChild(this.templateLabel);
    this.createTemplateButton(templateSection, 'shareCard.template.minimal', 'minimal');
    this.createTemplateButton(templateSection, 'shareCard.template.sciFi', 'sci-fi');
    this.createTemplateButton(templateSection, 'shareCard.template.postcard', 'postcard');

    const actionRow = document.createElement('div');
    actionRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
    this.downloadButton = this.createActionButton(actionRow, 'shareCard.download', '#2d8bff');
    this.copyLinkButton = this.createActionButton(actionRow, 'shareCard.copyLink', '#1e6bcf');
    this.webShareButton = this.createActionButton(actionRow, 'shareCard.webShare', '#1553a5');

    this.statusText = document.createElement('div');
    this.statusText.style.cssText = 'font-size:clamp(11px,3vw,12px);min-height:1.4em;color:#d6e8ff;opacity:0.9;';

    this.downloadButton.addEventListener('click', this.onDownloadClick);
    this.copyLinkButton.addEventListener('click', this.onCopyLinkClick);
    this.webShareButton.addEventListener('click', this.onWebShareClick);

    this.panel.append(header, previewWrap, templateSection, actionRow, this.statusText);
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);

    window.addEventListener('keydown', this.onWindowKeyDown);
    this.unsubscribeLocaleChange = onLocaleChange(() => {
      this.applyLocalizedText();
      this.renderPreview();
    });
    this.applyLocalizedText();
    this.syncTemplateButtons();
  }

  get isOpen(): boolean {
    return this.visible;
  }

  async open(payload: ShareCardPayload): Promise<void> {
    const token = ++this.openToken;
    try {
      const image = await this.loadImage(payload.screenshotDataUrl);
      if (token !== this.openToken) {
        return;
      }
      this.sourceImage = image;
      this.shareState = payload.state;
      this.visible = true;
      this.root.style.display = 'flex';
      this.setStatus('');
      this.renderPreview();
    } catch {
      this.setStatus(t('shareCard.status.imageError'));
    }
  }

  close(): void {
    if (!this.visible) {
      return;
    }
    this.visible = false;
    this.root.style.display = 'none';
  }

  dispose(): void {
    this.unsubscribeLocaleChange();
    window.removeEventListener('keydown', this.onWindowKeyDown);
    this.root.removeEventListener('click', this.onBackdropClick);
    this.downloadButton.removeEventListener('click', this.onDownloadClick);
    this.copyLinkButton.removeEventListener('click', this.onCopyLinkClick);
    this.webShareButton.removeEventListener('click', this.onWebShareClick);
    this.root.remove();
  }

  private createTemplateButton(
    container: HTMLElement,
    labelKey: string,
    template: ShareTemplate,
  ): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.labelKey = labelKey;
    button.style.cssText = `
      min-height: 40px; border-radius: 8px;
      border: 1px solid rgba(121, 157, 223, 0.55);
      background: rgba(11, 24, 44, 0.95); color: #ebf5ff;
      font-size: clamp(11px, 3vw, 12px); font-weight: 600;
      padding: 0 10px; cursor: pointer;
    `;
    button.addEventListener('click', () => {
      this.activeTemplate = template;
      this.syncTemplateButtons();
      this.renderPreview();
    });
    this.templateButtons.set(template, button);
    container.appendChild(button);
  }

  private createActionButton(
    container: HTMLElement,
    labelKey: string,
    background: string,
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.labelKey = labelKey;
    button.style.cssText = `
      min-height: 44px; min-width: 44px; border-radius: 9px;
      border: 1px solid rgba(138, 186, 255, 0.55);
      background: ${background}; color: #ffffff;
      font-size: clamp(11px, 3vw, 12px); font-weight: 700;
      padding: 0 12px; cursor: pointer;
    `;
    container.appendChild(button);
    return button;
  }

  private applyLocalizedText(): void {
    this.title.textContent = t('shareCard.title');
    this.subtitle.textContent = t('shareCard.subtitle');
    this.templateLabel.textContent = t('shareCard.template');
    this.downloadButton.textContent = t('shareCard.download');
    this.copyLinkButton.textContent = t('shareCard.copyLink');
    this.webShareButton.textContent = t('shareCard.webShare');
    this.closeButton.textContent = t('shareCard.close');

    for (const button of this.templateButtons.values()) {
      const labelKey = button.dataset.labelKey;
      if (labelKey) {
        button.textContent = t(labelKey);
      }
    }
  }

  private syncTemplateButtons(): void {
    for (const [template, button] of this.templateButtons) {
      const active = template === this.activeTemplate;
      button.style.borderColor = active ? '#bfe0ff' : 'rgba(121, 157, 223, 0.55)';
      button.style.background = active
        ? 'rgba(51, 112, 192, 0.95)'
        : 'rgba(11, 24, 44, 0.95)';
    }
  }

  private renderPreview(): void {
    if (!this.sourceImage || !this.shareState) {
      return;
    }
    this.previewCanvas.width = this.sourceImage.width;
    this.previewCanvas.height = this.sourceImage.height;
    const context = this.previewCanvas.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    switch (this.activeTemplate) {
      case 'minimal':
        this.drawMinimal(context, this.previewCanvas.width, this.previewCanvas.height);
        break;
      case 'sci-fi':
        this.drawSciFi(context, this.previewCanvas.width, this.previewCanvas.height);
        break;
      case 'postcard':
        this.drawPostcard(context, this.previewCanvas.width, this.previewCanvas.height);
        break;
    }
  }

  private drawMinimal(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    if (!this.sourceImage || !this.shareState) {
      return;
    }
    context.drawImage(this.sourceImage, 0, 0, width, height);

    const panelHeight = Math.max(86, Math.round(height * 0.2));
    const gradient = context.createLinearGradient(0, height - panelHeight, 0, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    context.fillStyle = gradient;
    context.fillRect(0, height - panelHeight, width, panelHeight);

    const padding = Math.max(18, Math.round(width * 0.028));
    const titleSize = Math.max(20, Math.round(width * 0.04));
    const bodySize = Math.max(12, Math.round(width * 0.022));

    context.fillStyle = '#f8fcff';
    context.font = `700 ${titleSize}px "Segoe UI", sans-serif`;
    context.fillText(
      this.getPlanetLabel(this.shareState.planet),
      padding,
      height - panelHeight + titleSize + 6,
    );

    context.font = `500 ${bodySize}px "Segoe UI", sans-serif`;
    context.fillStyle = '#d7ebff';
    context.fillText(this.getCoordinateText(), padding, height - panelHeight + titleSize + bodySize + 20);
    context.fillStyle = '#b7d9f9';
    context.fillText(this.getTimestampText(), padding, height - 16);
  }

  private drawSciFi(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    if (!this.sourceImage || !this.shareState) {
      return;
    }
    context.drawImage(this.sourceImage, 0, 0, width, height);

    const frame = Math.max(12, Math.round(width * 0.018));
    const corner = Math.max(36, Math.round(width * 0.09));
    const stroke = Math.max(2, Math.round(width * 0.0035));
    context.strokeStyle = 'rgba(116, 235, 255, 0.92)';
    context.lineWidth = stroke;

    context.beginPath();
    context.moveTo(frame, frame + corner);
    context.lineTo(frame, frame);
    context.lineTo(frame + corner, frame);
    context.moveTo(width - frame - corner, frame);
    context.lineTo(width - frame, frame);
    context.lineTo(width - frame, frame + corner);
    context.moveTo(frame, height - frame - corner);
    context.lineTo(frame, height - frame);
    context.lineTo(frame + corner, height - frame);
    context.moveTo(width - frame - corner, height - frame);
    context.lineTo(width - frame, height - frame);
    context.lineTo(width - frame, height - frame - corner);
    context.stroke();

    const panelWidth = Math.max(220, Math.round(width * 0.44));
    const panelHeight = Math.max(88, Math.round(height * 0.19));
    context.fillStyle = 'rgba(1, 17, 34, 0.72)';
    context.fillRect(frame + 8, frame + 8, panelWidth, panelHeight);
    context.strokeStyle = 'rgba(118, 226, 255, 0.72)';
    context.lineWidth = Math.max(1, Math.round(stroke * 0.6));
    context.strokeRect(frame + 8, frame + 8, panelWidth, panelHeight);

    const titleSize = Math.max(17, Math.round(width * 0.031));
    const bodySize = Math.max(11, Math.round(width * 0.02));
    context.fillStyle = '#c4f4ff';
    context.font = `700 ${titleSize}px "SFMono-Regular", Menlo, monospace`;
    context.fillText(this.getPlanetLabel(this.shareState.planet).toUpperCase(), frame + 22, frame + titleSize + 20);
    context.font = `500 ${bodySize}px "SFMono-Regular", Menlo, monospace`;
    context.fillStyle = '#88dfff';
    context.fillText(this.getCoordinateText(), frame + 22, frame + titleSize + bodySize + 30);
    context.fillText(`yaw ${this.shareState.yaw.toFixed(3)}  pitch ${this.shareState.pitch.toFixed(3)}`, frame + 22, frame + titleSize + bodySize * 2 + 38);

    const watermarkWidth = Math.max(320, Math.round(width * 0.48));
    const watermarkHeight = Math.max(32, Math.round(height * 0.07));
    const watermarkX = width - watermarkWidth - frame - 8;
    const watermarkY = height - watermarkHeight - frame - 8;
    context.fillStyle = 'rgba(2, 22, 40, 0.74)';
    context.fillRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight);
    context.strokeStyle = 'rgba(118, 226, 255, 0.68)';
    context.strokeRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight);
    context.fillStyle = '#a7ebff';
    context.font = `500 ${bodySize}px "SFMono-Regular", Menlo, monospace`;
    context.fillText(this.getTimestampText(), watermarkX + 12, watermarkY + Math.round(watermarkHeight * 0.63));
  }

  private drawPostcard(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    if (!this.sourceImage || !this.shareState) {
      return;
    }
    const margin = Math.max(22, Math.round(width * 0.032));
    const captionHeight = Math.max(62, Math.round(height * 0.13));
    const photoWidth = width - margin * 2;
    const photoHeight = height - margin * 2 - captionHeight;

    context.fillStyle = '#f2ecdd';
    context.fillRect(0, 0, width, height);
    context.drawImage(this.sourceImage, margin, margin, photoWidth, photoHeight);

    context.strokeStyle = '#d2c6ad';
    context.lineWidth = Math.max(2, Math.round(width * 0.0022));
    context.strokeRect(margin, margin, photoWidth, photoHeight);

    const titleSize = Math.max(20, Math.round(width * 0.039));
    const bodySize = Math.max(12, Math.round(width * 0.021));

    context.fillStyle = '#3b2d1d';
    context.font = `700 ${titleSize}px "Georgia", serif`;
    context.fillText(this.getPlanetLabel(this.shareState.planet), margin, height - captionHeight + titleSize - 8);

    context.font = `500 ${bodySize}px "Georgia", serif`;
    context.fillStyle = '#594429';
    context.fillText(this.getCoordinateText(), margin, height - captionHeight + titleSize + bodySize + 6);
    context.fillText(this.getTimestampText(), margin, height - margin);

    const stampWidth = Math.max(74, Math.round(width * 0.12));
    const stampHeight = Math.max(48, Math.round(height * 0.095));
    const stampX = width - margin - stampWidth;
    const stampY = height - captionHeight + 8;
    context.strokeStyle = '#b68a3d';
    context.lineWidth = Math.max(2, Math.round(width * 0.0025));
    context.strokeRect(stampX, stampY, stampWidth, stampHeight);
    context.font = `700 ${Math.max(10, Math.round(width * 0.016))}px "Georgia", serif`;
    context.fillStyle = '#8a5d17';
    context.fillText('PLANET', stampX + 10, stampY + 20);
    context.fillText(this.shareState.planet.toUpperCase(), stampX + 10, stampY + 36);
  }

  private buildShareUrl(): string {
    if (!this.shareState) {
      return window.location.href;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('planet', this.shareState.planet.toLowerCase());
    url.searchParams.set('lat', this.shareState.lat.toFixed(4));
    url.searchParams.set('lng', this.shareState.lng.toFixed(4));
    url.searchParams.set('yaw', this.shareState.yaw.toFixed(3));
    url.searchParams.set('pitch', this.shareState.pitch.toFixed(3));
    return url.toString();
  }

  private buildDownloadFilename(): string {
    if (!this.shareState) {
      return 'planet-walk-photo.png';
    }
    const date = this.shareState.capturedAt;
    const stamp = `${date.getFullYear()}${this.pad2(date.getMonth() + 1)}${this.pad2(date.getDate())}-${this.pad2(date.getHours())}${this.pad2(date.getMinutes())}${this.pad2(date.getSeconds())}`;
    const planetSlug = this.shareState.planet.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    return `planet-walk-${planetSlug}-${stamp}.png`;
  }

  private getPlanetLabel(planet: string): string {
    const key = `planet.${planet.toLowerCase()}`;
    const localized = t(key);
    return localized === key ? planet.toUpperCase() : localized;
  }

  private getCoordinateText(): string {
    if (!this.shareState) {
      return '';
    }
    return `${t('shareCard.watermark.coords')} ${this.shareState.lat.toFixed(2)}°, ${this.shareState.lng.toFixed(2)}°`;
  }

  private getTimestampText(): string {
    if (!this.shareState) {
      return '';
    }
    return `${t('shareCard.watermark.captured')} ${this.formatTimestamp(this.shareState.capturedAt)}`;
  }

  private formatTimestamp(date: Date): string {
    const formatter = new Intl.DateTimeFormat(getLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  }

  private async loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load screenshot image'));
      image.src = dataUrl;
    });
  }

  private setStatus(message: string): void {
    this.statusText.textContent = message;
  }

  private copyTextFallback(value: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  }

  private async copyToClipboard(value: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // Fallback below.
      }
    }
    return this.copyTextFallback(value);
  }

  private onDownloadClick = (): void => {
    if (!this.sourceImage || !this.shareState) {
      return;
    }
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.sourceImage.width;
    exportCanvas.height = this.sourceImage.height;
    const context = exportCanvas.getContext('2d');
    if (!context) {
      return;
    }
    switch (this.activeTemplate) {
      case 'minimal':
        this.drawMinimal(context, exportCanvas.width, exportCanvas.height);
        break;
      case 'sci-fi':
        this.drawSciFi(context, exportCanvas.width, exportCanvas.height);
        break;
      case 'postcard':
        this.drawPostcard(context, exportCanvas.width, exportCanvas.height);
        break;
    }

    const link = document.createElement('a');
    link.href = exportCanvas.toDataURL('image/png');
    link.download = this.buildDownloadFilename();
    link.click();
  };

  private onCopyLinkClick = async (): Promise<void> => {
    const url = this.buildShareUrl();
    const copied = await this.copyToClipboard(url);
    this.setStatus(copied ? t('shareCard.status.linkCopied') : t('shareCard.status.copyFailed'));
  };

  private onWebShareClick = async (): Promise<void> => {
    const url = this.buildShareUrl();
    const planet = this.shareState ? this.getPlanetLabel(this.shareState.planet) : '';
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };

    if (typeof nav.share === 'function') {
      try {
        await nav.share({
          title: t('shareCard.shareTitle', { planet }),
          text: t('shareCard.shareText', { planet }),
          url,
        });
        this.setStatus(t('shareCard.status.shared'));
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    const copied = await this.copyToClipboard(url);
    this.setStatus(copied ? t('shareCard.status.linkCopied') : t('shareCard.status.copyFailed'));
  };

  private onWindowKeyDown = (event: KeyboardEvent): void => {
    if (!this.visible) {
      return;
    }
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.close();
  };

  private onBackdropClick = (event: MouseEvent): void => {
    if (event.target !== this.root) {
      return;
    }
    this.close();
  };

  private pad2(value: number): string {
    return String(value).padStart(2, '0');
  }
}
