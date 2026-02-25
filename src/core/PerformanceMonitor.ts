/**
 * 性能监控器
 * 负责计算FPS并根据性能动态调整渲染质量
 */
export class PerformanceMonitor {
  private frames: number = 0;
  private prevTime: number;
  private fps: number = 0;
  private qualityLevel: number = 1.0; // 1.0 = 最高质量, 0.1 = 最低质量

  constructor() {
    this.prevTime = performance.now();
  }

  /**
   * 每帧调用，更新FPS统计
   */
  update(): void {
    this.frames++;
    const time = performance.now();

    if (time >= this.prevTime + 1000) {
      this.fps = (this.frames * 1000) / (time - this.prevTime);
      this.prevTime = time;
      this.frames = 0;
      this.adjustQuality();
    }
  }

  /**
   * 根据FPS自动调整质量等级
   */
  private adjustQuality(): void {
    if (this.fps < 30) {
      // 帧率过低，降低质量
      this.qualityLevel = Math.max(0.1, this.qualityLevel - 0.1);
    } else if (this.fps > 55) {
      // 帧率良好，尝试提高质量
      this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.1);
    }
  }

  /**
   * 获取当前FPS
   */
  getFPS(): number {
    return Math.round(this.fps);
  }

  /**
   * 获取当前质量等级 (0.1 - 1.0)
   */
  getQualityLevel(): number {
    return this.qualityLevel;
  }
}
