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
import { AudioManager } from './audio/AudioManager';
import { LandmarkManager } from './ui/LandmarkManager';
import { MeteorEffect } from './effects/MeteorEffect';
import { DustStorm } from './effects/DustStorm';
import { MicroImpact } from './effects/MicroImpact';
import type { ParticleSystem } from './effects/ParticleSystem';
import { GuidePanel } from './ui/GuidePanel';
import { LandButton } from './ui/LandButton';

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
  private audioManager: AudioManager;
  private landmarkManager: LandmarkManager;
  private particleSystem: ParticleSystem | null = null;
  private guidePanel: GuidePanel;
  private landButton: LandButton;
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
      scene: this.sceneManager.scene,
      getPlanetRadius: () => this.sceneManager.planetRadius,
      planetCenter: new THREE.Vector3(0, 0, 0),
    });

    this.debugPanel = new DebugPanel();
    this.loadingScreen = new LoadingScreen();
    this.performanceMonitor = new PerformanceMonitor();

    // 音效系统
    this.audioManager = AudioManager.getInstance();

    // 地标导航
    this.landmarkManager = new LandmarkManager(this.cameraSystem.camera);
    this.landmarkManager.loadPlanet(planet.config, planet.root);

    // 粒子特效（按星球类型）
    this.setupParticles(this.currentPlanet, planet.config.radius);

    // 操作引导
    this.guidePanel = new GuidePanel();

    // 降落按钮
    this.landButton = new LandButton();
    this.landButton.setOnClick(() => this.landOnSurface());

    // ESC返回轨道
    window.addEventListener('keydown', this.onKeyDown);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.engine.resize();
    this.cameraSystem.resize();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.cameraManager.mode !== 'orbit') {
      this.returnToOrbit();
    }
  };

  /** 降落到地表 */
  private landOnSurface(): void {
    this.landButton.hide();
    this.guidePanel.fadeOut();
    // 使用第一个地标的坐标，或默认位置
    const landmarks = this.planet.config.landmarks;
    const lat = landmarks.length > 0 ? landmarks[0].lat : 0;
    const lng = landmarks.length > 0 ? landmarks[0].lng : 0;
    this.cameraManager.animateToSurface(lat, lng, 2500).then(() => {
      this.guidePanel.showFirstPersonGuide();
    });
  }

  /** 返回轨道视角 */
  private returnToOrbit(resetPosition = false): void {
    if (resetPosition) {
      // 重置相机到默认轨道位置（星球半径 * 3）
      const r = this.planet.config.radius;
      this.cameraManager.camera.position.set(0, 0, r * 3);
      this.cameraManager.camera.lookAt(0, 0, 0);
    }
    this.cameraManager.switchTo('orbit');
    this.landButton.show();
    this.guidePanel.showOrbitGuide();
  }

  /** 根据星球类型设置粒子特效 */
  private setupParticles(planetType: PlanetType, radius: number): void {
    // 清理旧粒子
    if (this.particleSystem) {
      this.sceneManager.scene.remove(this.particleSystem.mesh);
      this.particleSystem.dispose();
      this.particleSystem = null;
    }

    switch (planetType) {
      case 'earth':
        this.particleSystem = new MeteorEffect(radius);
        break;
      case 'mars':
        this.particleSystem = new DustStorm(radius);
        break;
      case 'moon':
        this.particleSystem = new MicroImpact(radius);
        break;
    }

    if (this.particleSystem) {
      this.sceneManager.scene.add(this.particleSystem.mesh);
    }
  }

  private switchPlanet = (planetType: PlanetType): void => {
    if (planetType === this.currentPlanet) {
      return;
    }

    const nextPlanet = PlanetFactory.create(planetType);
    this.sceneManager.replacePlanet(nextPlanet);
    this.planet = nextPlanet;

    this.playerController.switchPlanet({
      planetId: planetType,
      planetRadius: nextPlanet.config.radius,
      gravity: nextPlanet.config.gravity,
      surfaceMeshes: [nextPlanet.mesh],
    });

    // 更新地标
    this.landmarkManager.loadPlanet(nextPlanet.config, nextPlanet.root);

    // 更新粒子特效
    this.setupParticles(planetType, nextPlanet.config.radius);

    // 切换环境音
    this.audioManager.setPlanet(planetType);

    this.currentPlanet = planetType;
    this.planetSelector.setActive(planetType);

    // 切换星球后回到轨道模式（重置相机位置）
    this.returnToOrbit(true);
  };

  async start(): Promise<void> {
    this.loadingScreen.show();

    await this.planet.loadTextures((percent) => {
      this.loadingScreen.setProgress(percent);
    });

    await this.loadingScreen.hide();
    this.cameraManager.switchTo('orbit');
    this.guidePanel.showOrbitGuide();
    this.landButton.show();

    // 初始化音效（需要用户交互后）
    const initAudio = (): void => {
      this.audioManager.init();
      this.audioManager.setPlanet(this.currentPlanet);
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);

    this.clock.start();
    const loop = (): void => {
      this.animationId = requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      this.cameraManager.update(delta);

      // 更新星球特效（云层/夜景/海洋）
      this.planet.update(delta);

      // 更新粒子特效
      this.particleSystem?.update(delta);

      // 更新地标可见性
      const cameraPosition = this.cameraSystem.camera.position;
      this.landmarkManager.update(cameraPosition);

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
    window.removeEventListener('keydown', this.onKeyDown);
    this.cameraManager.dispose();
    this.playerController.dispose();
    this.inputManager.dispose();
    this.hud.dispose();
    this.debugPanel.dispose();
    this.loadingScreen.dispose();
    this.planetSelector.dispose();
    this.landmarkManager.dispose();
    this.particleSystem?.dispose();
    this.audioManager.dispose();
    this.guidePanel.dispose();
    this.landButton.dispose();
    this.sceneManager.dispose();
    this.engine.dispose();
  }
}
