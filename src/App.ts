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
import { Minimap } from './ui/Minimap';
import { WeatherSystem } from './weather/WeatherSystem';
import { PhotoMode } from './camera/PhotoMode';
import { PhotoModeUI } from './ui/PhotoModeUI';
import { FilterManager } from './postprocess/FilterManager';
import type { PhotoFilterType } from './postprocess/FilterManager';

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
  private minimap: Minimap;
  private weatherSystem: WeatherSystem;
  private readonly photoMode: PhotoMode;
  private readonly photoModeUI: PhotoModeUI;
  private readonly filterManager: FilterManager;
  private photoModeActive = false;
  private photoModeHideHUD = true;
  private pointerLockEnabledBeforePhoto = false;
  private minimapFullscreen = false;
  private clock = new THREE.Clock();
  private animationId = 0;
  private currentPlanet: PlanetType = 'earth';
  private planet: Planet;
  private readonly headingForward = new THREE.Vector3();
  private readonly headingEast = new THREE.Vector3();
  private readonly headingNorth = new THREE.Vector3();
  private readonly headingWorldForward = new THREE.Vector3(0, 0, -1);
  private readonly headingWorldNorth = new THREE.Vector3(0, 1, 0);
  private readonly headingFallbackNorth = new THREE.Vector3(0, 0, 1);

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

    // 小地图
    this.minimap = new Minimap();
    this.minimap.setPlanetRadius(planet.config.radius);
    this.minimap.setBackgroundColor(planet.config.textures.fallbackColor);
    this.minimap.setVisible(false);

    // 天气系统
    this.weatherSystem = new WeatherSystem({
      scene: this.sceneManager.scene,
      planetRadius: planet.config.radius,
      weather: planet.config.weather,
    });

    this.filterManager = new FilterManager({
      renderer: this.engine.renderer,
      scene: this.sceneManager.scene,
      camera: this.cameraSystem.camera,
    });
    this.filterManager.resize(
      window.innerWidth,
      window.innerHeight,
      Math.min(window.devicePixelRatio, 2),
    );

    this.photoMode = new PhotoMode({
      camera: this.cameraSystem.camera,
      input: this.inputManager,
    });
    this.photoModeUI = new PhotoModeUI({
      onFilterChange: this.onPhotoFilterChange,
      onCapture: this.captureScreenshot,
      onHudToggle: this.onPhotoHUDToggle,
      onFovChange: this.onPhotoFovChange,
    });

    // ESC返回轨道
    window.addEventListener('keydown', this.onKeyDown);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.engine.resize();
    this.cameraSystem.resize();
    this.filterManager.resize(
      window.innerWidth,
      window.innerHeight,
      Math.min(window.devicePixelRatio, 2),
    );
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'KeyP' && !e.repeat) {
      this.togglePhotoMode();
      return;
    }

    if (this.photoModeActive) {
      return;
    }

    if (e.code === 'KeyM' && !e.repeat) {
      this.minimapFullscreen = !this.minimapFullscreen;
      this.minimap.setFullscreen(this.minimapFullscreen);
      return;
    }
    if (e.key === 'Escape' && this.cameraManager.mode !== 'orbit') {
      this.returnToOrbit();
    }
  };

  private onPhotoFilterChange = (filter: PhotoFilterType): void => {
    this.filterManager.setFilter(filter);
  };

  private onPhotoHUDToggle = (hidden: boolean): void => {
    this.photoModeHideHUD = hidden;
    if (this.photoModeActive) {
      this.hud.setVisible(!hidden);
    }
  };

  private onPhotoFovChange = (fov: number): void => {
    if (this.photoModeActive) {
      this.photoMode.setFov(fov);
    }
  };

  private togglePhotoMode(): void {
    if (this.photoModeActive) {
      this.exitPhotoMode();
      return;
    }
    this.enterPhotoMode();
  }

  private enterPhotoMode(): void {
    if (this.photoModeActive) {
      return;
    }

    this.photoModeActive = true;
    this.photoModeHideHUD = true;
    this.pointerLockEnabledBeforePhoto = this.inputManager.pointerLockEnabled;
    this.cameraManager.setHotkeysEnabled(false);
    if (this.cameraManager.mode === 'orbit') {
      this.cameraManager.orbitMode.setEnabled(false);
    }

    this.photoMode.enter();
    this.inputManager.setPointerLockEnabled(true);
    if (!this.inputManager.isMobile) {
      try {
        this.engine.renderer.domElement.requestPointerLock();
      } catch {
        // 忽略浏览器在非激活状态下拒绝锁指针
      }
    }

    this.filterManager.setFilter('normal');
    this.setMainUIVisible(false);
    this.photoModeUI.show({
      filter: this.filterManager.filter,
      hideHUD: this.photoModeHideHUD,
      fov: this.photoMode.getFov(),
    });
  }

  private exitPhotoMode(): void {
    if (!this.photoModeActive) {
      return;
    }

    this.photoMode.exit(true);
    this.photoModeActive = false;
    this.photoModeUI.hide();
    this.filterManager.setFilter('normal');

    this.cameraManager.setHotkeysEnabled(true);
    if (this.cameraManager.mode === 'orbit') {
      this.cameraManager.orbitMode.setEnabled(true);
      this.cameraManager.orbitMode.syncFromCamera();
    }
    this.inputManager.setPointerLockEnabled(this.pointerLockEnabledBeforePhoto);

    this.setMainUIVisible(true);
  }

  private setMainUIVisible(visible: boolean): void {
    this.planetSelector.setVisible(visible);
    this.debugPanel.setVisible(visible);
    this.guidePanel.setVisible(visible);
    this.hud.setVisible(visible);

    if (visible) {
      if (this.cameraManager.mode === 'orbit') {
        this.landButton.show();
      } else {
        this.landButton.hide();
      }
      this.minimap.setVisible(this.isInSurfaceMode());
      return;
    }

    this.landButton.hide();
    this.minimap.setVisible(false);
    const infoCard = document.getElementById('landmark-info-card');
    if (infoCard instanceof HTMLDivElement) {
      infoCard.style.display = 'none';
    }
  }

  private isInSurfaceMode(): boolean {
    return (
      this.cameraManager.mode === 'firstPerson' ||
      this.cameraManager.mode === 'thirdPerson'
    );
  }

  private captureScreenshot = (): void => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${this.pad2(now.getMonth() + 1)}${this.pad2(now.getDate())}-${this.pad2(now.getHours())}${this.pad2(now.getMinutes())}${this.pad2(now.getSeconds())}`;
    const link = document.createElement('a');
    link.href = this.engine.renderer.domElement.toDataURL('image/png');
    link.download = `planet-walk-photo-${stamp}.png`;
    link.click();
  };

  private pad2(value: number): string {
    return String(value).padStart(2, '0');
  }

  private computePlayerHeading(
    quaternion: THREE.Quaternion,
    up: THREE.Vector3,
  ): number {
    this.headingForward
      .copy(this.headingWorldForward)
      .applyQuaternion(quaternion);
    this.headingForward.addScaledVector(up, -this.headingForward.dot(up));
    if (this.headingForward.lengthSq() < 1e-8) {
      return 0;
    }
    this.headingForward.normalize();

    this.headingEast.crossVectors(this.headingWorldNorth, up);
    if (this.headingEast.lengthSq() < 1e-8) {
      this.headingEast.crossVectors(this.headingFallbackNorth, up);
    }
    if (this.headingEast.lengthSq() < 1e-8) {
      return 0;
    }
    this.headingEast.normalize();

    this.headingNorth.crossVectors(up, this.headingEast).normalize();
    const east = this.headingForward.dot(this.headingEast);
    const north = this.headingForward.dot(this.headingNorth);
    const heading = Math.atan2(east, north) * (180 / Math.PI);
    return (heading + 360) % 360;
  }

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
    if (this.photoModeActive) {
      this.exitPhotoMode();
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
    this.minimap.setPlanetRadius(nextPlanet.config.radius);
    this.minimap.setBackgroundColor(nextPlanet.config.textures.fallbackColor);

    // 切换天气系统
    this.weatherSystem.switchPlanet(
      this.sceneManager.scene,
      nextPlanet.config.radius,
      nextPlanet.config.weather,
    );

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

      if (this.photoModeActive) {
        this.photoMode.update(delta);
        this.filterManager.update(delta);
        this.filterManager.render(delta);
        return;
      }

      this.cameraManager.update(delta);

      const inSurfaceMode = this.isInSurfaceMode();
      this.minimap.setVisible(inSurfaceMode);
      if (inSurfaceMode) {
        const playerState = this.playerController.state;
        const playerGeo = cartesianToGeo(
          playerState.position,
          this.sceneManager.planetRadius,
        );
        const heading = this.computePlayerHeading(
          playerState.quaternion,
          playerState.up,
        );
        this.minimap.update(
          playerGeo.lat,
          playerGeo.lng,
          heading,
          this.planet.config.landmarks,
        );
      }

      // 更新星球特效（云层/夜景/海洋）
      this.planet.update(delta);

      // 更新粒子特效
      this.particleSystem?.update(delta);

      // 更新地标可见性
      const cameraPosition = this.cameraSystem.camera.position;
      this.landmarkManager.update(cameraPosition);

      // 更新天气系统
      this.weatherSystem.update(delta, cameraPosition);

      const geo = cartesianToGeo(cameraPosition, this.sceneManager.planetRadius);
      this.hud.update({
        planetName: this.sceneManager.planetName,
        lat: geo.lat,
        lng: geo.lng,
        alt: geo.alt,
        position: cameraPosition,
      });

      this.performanceMonitor.update();

      this.filterManager.update(delta);
      this.filterManager.render(delta);

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
    if (this.photoModeActive) {
      this.exitPhotoMode();
    }
    this.photoModeUI.dispose();
    this.filterManager.dispose();
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
    this.minimap.dispose();
    this.weatherSystem.dispose();
    this.sceneManager.dispose();
    this.engine.dispose();
  }
}
