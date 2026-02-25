/** 所有需要每帧更新的子系统实现此接口 */
export interface IUpdatable {
  update(delta: number): void;
}

/** 可销毁资源接口 */
export interface IDisposable {
  dispose(): void;
}

/** 引擎配置 */
export interface EngineConfig {
  canvas: HTMLCanvasElement;
  antialias: boolean;
  logarithmicDepthBuffer: boolean;
  pixelRatio: number;
}
