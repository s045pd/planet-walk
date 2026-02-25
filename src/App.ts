import { Engine } from './core/Engine';
import { SceneManager } from './core/Scene';
import { CameraSystem } from './core/Camera';
import { InputManager } from './core/InputManager';
import type { IDisposable } from './core/types';

/** 主控制器：组装各子系统，驱动渲染循环 */
export class App implements IDisposable {
  private engine: Engine;
  private sceneManager: SceneManager;
  private cameraSystem: CameraSystem;
  private inputManager: InputManager;
  private animationId = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });

    this.sceneManager = new SceneManager();
    this.cameraSystem = new CameraSystem();
    this.inputManager = new InputManager();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.engine.resize();
    this.cameraSystem.resize();
  };

  start(): void {
    const loop = (): void => {
      this.animationId = requestAnimationFrame(loop);
      this.engine.render(this.sceneManager.scene, this.cameraSystem.camera);
    };
    loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.inputManager.dispose();
    this.sceneManager.dispose();
    this.engine.dispose();
  }
}
