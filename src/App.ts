import * as THREE from 'three';
import { Engine } from './core/Engine';
import { SceneManager } from './core/Scene';
import { CameraSystem } from './core/Camera';
import { InputManager } from './core/InputManager';
import type { IDisposable } from './core/types';
import { PlanetFactory } from './planet/PlanetFactory';
import type { PlanetType } from './planet/PlanetFactory';
import { Planet } from './planet/Planet';
import { cartesianToGeo } from './utils/geo';
import { HUD } from './ui/HUD';
import { PlanetSelector } from './ui/PlanetSelector';
import { PlayerController } from './player/PlayerController';
import { CameraManager } from './camera/CameraManager';
import { DebugPanel } from './ui/DebugPanel';
import { LoadingScreen } from './ui/LoadingScreen';
import { PerformanceMonitor } from './core/PerformanceMonitor';

/** 主控制器：组装各子系统，驱动渲染循环 */
export class App implements IDisposable {
  private engine: Engine;
  private sceneManager: SceneManager;
  private cameraSystem: CameraSystem;
  private inputManager: InputManager;
  private hud: HUD;
  private planetSelector: PlanetSelector;
  private playerController: PlayerController;
  private cameraManager: CameraManager;
  private debugPanel: DebugPanel;
  private loadingScreen: LoadingScreen;
  private performanceMonitor: PerformanceMonitor;
  private clock = new THREE.Clock();
  private animationId = 0;
  private currentPlanet: PlanetType = 'earth';
  private planet: Planet;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });

    const planet = PlanetFactory.create(this.currentPlanet);
    this.planet = planet;
    this.sceneManager = new SceneManager(planet);
    this.cameraSystem = new CameraSystem();
    this.inputManager = new InputManager(canvas);
    this.hud = new HUD();
    this.planetSelector = new PlanetSelector({
      initialPlanet: this.currentPlanet,
      onPlanetSelect: this.switchPlanet,
    });

    this.playerController = new PlayerController({
      camera: this.cameraSystem.camera,
      input: this.inputManager,
      planetCenter: new THREE.Vector3(0, 0, 0),
      planetId: this.currentPlanet,
      planetRadius: planet.config.radius,
      gravity: planet.config.gravity,
      surfaceMeshes: [planet.mesh],
    });

    this.cameraManager = new CameraManager({
      camera: this.cameraSystem.camera,
      domElement: canvas,
      input: this.inputManager,
      playerController: this.playerController,
      getPlanetRadius: () => this.sceneManager.planetRadius,
      planetCenter: new THREE.Vector3(0, 0, 0),
    });

    this.debugPanel = new DebugPanel();
    this.loadingScreen = new LoadingScreen();
    this.performanceMonitor = new PerformanceMonitor();

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.engine.resize();
    this.cameraSystem.resize();
  };

  private switchPlanet = (planetType: PlanetType): void => {
    if (planetType === this.currentPlanet) {
      return;
    }

    const nextPlanet = PlanetFactory.create(planetType);
    this.sceneManager.replacePlanet(nextPlanet);
    this.playerController.switchPlanet({
      planetId: planetType,
      planetRadius: nextPlanet.config.radius,
      gravity: nextPlanet.config.gravity,
      surfaceMeshes: [nextPlanet.mesh],
    });

    this.currentPlanet = planetType;
    this.planetSelector.setActive(planetType);
  };

  async start(): Promise<void> {
    this.loadingScreen.show();

    await this.planet.loadTextures((percent) => {
      this.loadingScreen.setProgress(percent);
    });

    await this.loadingScreen.hide();
    this.cameraManager.switchTo('orbit');

    this.clock.start();
    const loop = (): void => {
      this.animationId = requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      this.cameraManager.update(delta);

      const cameraPosition = this.cameraSystem.camera.position;
      const geo = cartesianToGeo(cameraPosition, this.sceneManager.planetRadius);
      this.hud.update({
        planetName: this.sceneManager.planetName,
        lat: geo.lat,
        lng: geo.lng,
        alt: geo.alt,
        position: cameraPosition,
      });

      this.performanceMonitor.update();

      this.engine.render(this.sceneManager.scene, this.cameraSystem.camera);

      this.debugPanel.update({
        fps: this.performanceMonitor.getFPS(),
        activeNodes: 0,
      });
    };
    loop();
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    this.cameraManager.dispose();
    this.playerController.dispose();
    this.inputManager.dispose();
    this.hud.dispose();
    this.debugPanel.dispose();
    this.loadingScreen.dispose();
    this.planetSelector.dispose();
    this.sceneManager.dispose();
    this.engine.dispose();
  }
}
