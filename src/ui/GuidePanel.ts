import type { IDisposable } from '../core/types';

/**
 * 操作引导面板：告诉用户怎么玩
 */
export class GuidePanel implements IDisposable {
  private readonly root: HTMLDivElement;
  private visible = true;

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'guide-panel';
    this.root.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      padding: 16px 24px; background: rgba(0,0,0,0.75); color: #fff;
      border-radius: 12px; font-family: system-ui, sans-serif; font-size: 14px;
      text-align: center; pointer-events: none; z-index: 50;
      backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.15);
      transition: opacity 0.5s; line-height: 1.8;
    `;
    document.body.appendChild(this.root);
  }

  /** 显示轨道模式引导 */
  showOrbitGuide(): void {
    this.root.innerHTML = `
      🌍 拖拽旋转 · 滚轮缩放<br>
      点击下方 <b>降落</b> 按钮进入地表漫步
    `;
    this.root.style.opacity = '1';
  }

  /** 显示第一人称模式引导 */
  showFirstPersonGuide(): void {
    this.root.innerHTML = `
      🚶 WASD 移动 · 鼠标转向 · 空格跳跃<br>
      ESC 返回轨道视角
    `;
    this.root.style.opacity = '1';
    // 5秒后自动淡出
    setTimeout(() => this.fadeOut(), 5000);
  }

  fadeOut(): void {
    this.root.style.opacity = '0';
  }

  setVisible(visible: boolean): void {
    if (this.visible === visible) {
      return;
    }
    this.visible = visible;
    this.root.style.display = visible ? 'block' : 'none';
  }

  dispose(): void {
    this.root.remove();
  }
}
