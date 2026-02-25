import * as THREE from 'three';
import { Engine } from './core/Engine';
import { SceneManager } from './core/Scene';
import { CameraSystem } from './core/Camera';
import { InputManager } from './core/InputManager';
import type { IDisposable } from './core/types';
import { PlanetFactory } from './planet/PlanetFactory';
import { cartesianToGeo } from './utils/geo';
import { HUD } from './ui/HUD';
import { PlayerController } from './player/PlayerController';

/** 主控制器：组装各子系统，驱动渲染循环 */
export class App implements IDisposable {
  private engine: Engine;
  private sceneManager: SceneManager;
  private cameraSystem: CameraSystem;
  private inputManager: InputManager;
  private hud: HUD;
  private playerController: PlayerController;
  private clock = new THREE.Clock();
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
    this.inputManager = new InputManager(canvas);
    this.hud = new HUD();

    this.playerController = new PlayerController({
      camera: this.cameraSystem.camera,
      input: this.inputManager,
      planetCenter: new THREE.Vector3(0, 0, 0),
      planetRadius: planet.config.radius,
      surfaceMeshes: [planet.mesh],
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.engine.resize();
    this.cameraSystem.resize();
  };

  start(): void {
    this.clock.start();
    const loop = (): void => {
      this.animationId = requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      this.playerController.update(delta);

      const cameraPosition = this.cameraSystem.camera.position;
      const geo = cartesianToGeo(cameraPosition, this.sceneManager.planetRadius);
      this.hud.update({
        planetName: this.sceneManager.planetName,
        lat: geo.lat,
        lng: geo.lng,
        alt: geo.alt,
        position: cameraPosition,
      });

      this.engine.render(this.sceneManager.scene, this.cameraSystem.camera);
    };
    loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.playerController.dispose();
    this.inputManager.dispose();
    this.hud.dispose();
    this.sceneManager.dispose();
    this.engine.dispose();
  }
}
