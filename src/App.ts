import { Engine } from './core/Engine';
import { SceneManager } from './core/Scene';
import { CameraSystem } from './core/Camera';
import { InputManager } from './core/InputManager';
import type { IDisposable } from './core/types';
import { PlanetFactory } from './planet/PlanetFactory';

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

    const planet = PlanetFactory.createEarth();
    this.sceneManager = new SceneManager(planet);
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
