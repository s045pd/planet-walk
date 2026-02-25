import type { IDisposable } from '../core/types';

export interface DebugStats {
  fps: number;
  activeNodes: number;
  memory?: number; // MB
}

/**
 * 调试面板
 * 显示 FPS, 活跃节点数, 内存占用等信息
 */
export class DebugPanel implements IDisposable {
  private container: HTMLDivElement;
  private fpsElement: HTMLDivElement;
  private nodesElement: HTMLDivElement;
  private memoryElement: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '10px';
    this.container.style.right = '10px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.container.style.color = '#0f0';
    this.container.style.padding = '10px';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '12px';
    this.container.style.zIndex = '1000';
    this.container.style.pointerEvents = 'none';
    this.container.style.borderRadius = '4px';

    this.fpsElement = document.createElement('div');
    this.nodesElement = document.createElement('div');
    this.memoryElement = document.createElement('div');

    this.container.appendChild(this.fpsElement);
    this.container.appendChild(this.nodesElement);
    this.container.appendChild(this.memoryElement);

    document.body.appendChild(this.container);
  }

  update(stats: DebugStats): void {
    this.fpsElement.textContent = `FPS: ${stats.fps}`;
    this.nodesElement.textContent = `Active Nodes: ${stats.activeNodes}`;
    if (stats.memory !== undefined) {
      this.memoryElement.textContent = `Memory: ${stats.memory.toFixed(2)} MB`;
    } else {
      this.memoryElement.textContent = 'Memory: N/A';
    }
  }

  dispose(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
