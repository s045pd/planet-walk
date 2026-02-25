import type { IDisposable } from '../core/types';

/** 全屏加载界面：logo + 进度条 + 淡出动画 */
export class LoadingScreen implements IDisposable {
  private readonly overlay: HTMLDivElement;
  private readonly progressBar: HTMLDivElement;
  private readonly progressText: HTMLDivElement;
  private readonly styleEl: HTMLStyleElement;

  constructor() {
    this.styleEl = document.createElement('style');
    this.styleEl.textContent = `
      @keyframes ls-fadeOut {
        from { opacity: 1; }
        to   { opacity: 0; }
      }
    `;
    document.head.appendChild(this.styleEl);

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      fontFamily: 'system-ui, sans-serif',
      color: '#fff',
      userSelect: 'none',
    } satisfies Partial<CSSStyleDeclaration>);

    // logo 文字
    const logo = document.createElement('div');
    Object.assign(logo.style, {
      fontSize: '48px',
      fontWeight: '700',
      letterSpacing: '8px',
      marginBottom: '48px',
    } satisfies Partial<CSSStyleDeclaration>);
    logo.textContent = '星球漫步';

    // 进度条容器
    const track = document.createElement('div');
    Object.assign(track.style, {
      width: '320px',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(255,255,255,0.15)',
      overflow: 'hidden',
    } satisfies Partial<CSSStyleDeclaration>);

    this.progressBar = document.createElement('div');
    Object.assign(this.progressBar.style, {
      width: '0%',
      height: '100%',
      background: '#fff',
      borderRadius: '2px',
      transition: 'width 0.3s ease',
    } satisfies Partial<CSSStyleDeclaration>);
    track.appendChild(this.progressBar);

    // 百分比文字
    this.progressText = document.createElement('div');
    Object.assign(this.progressText.style, {
      marginTop: '16px',
      fontSize: '14px',
      opacity: '0.6',
    } satisfies Partial<CSSStyleDeclaration>);
    this.progressText.textContent = '0%';

    this.overlay.append(logo, track, this.progressText);
    document.body.appendChild(this.overlay);
  }

  show(): void {
    this.overlay.style.display = 'flex';
    this.overlay.style.opacity = '1';
    this.overlay.style.animation = 'none';
  }

  setProgress(percent: number): void {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    this.progressBar.style.width = `${clamped}%`;
    this.progressText.textContent = `${clamped}%`;
  }

  hide(): Promise<void> {
    return new Promise((resolve) => {
      this.overlay.style.animation = 'ls-fadeOut 0.8s ease forwards';
      this.overlay.addEventListener('animationend', () => {
        this.overlay.style.display = 'none';
        resolve();
      }, { once: true });
    });
  }

  dispose(): void {
    this.overlay.remove();
    this.styleEl.remove();
  }
}
