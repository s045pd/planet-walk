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
import { FilterManager } from './postprocess/FilterManager';
import type { PhotoFilterType } from './postprocess/FilterManager';
import type { WeatherSystem } from './weather/WeatherSystem';
import type { PhotoMode } from './camera/PhotoMode';
import type { PhotoModeUI } from './ui/PhotoModeUI';
import type { Scanner } from './science/Scanner';
import type { SampleCollector } from './science/SampleCollector';
import type { SciencePanel } from './ui/SciencePanel';
import type { HiddenPoi, SampleType } from './achievement/AchievementData';
import type { AchievementEvent, AchievementManager } from './achievement/AchievementManager';
import type { AchievementPanel } from './ui/AchievementPanel';
import type { AchievementToast } from './ui/AchievementToast';
import { DayNightCycle } from './environment/DayNightCycle';
import { HelpOverlay } from './ui/HelpOverlay';
import { SettingsPanel } from './ui/SettingsPanel';

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
  private weatherSystem: WeatherSystem | null = null;
  private photoMode: PhotoMode | null = null;
  private photoModeUI: PhotoModeUI | null = null;
  private readonly filterManager: FilterManager;
  private photoModeActive = false;
  private photoModeHideHUD = true;
  private pointerLockEnabledBeforePhoto = false;
  private scanner: Scanner | null = null;
  private sampleCollector: SampleCollector | null = null;
  private sciencePanel: SciencePanel | null = null;
  private achievementManager: AchievementManager | null = null;
  private achievementPanel: AchievementPanel | null = null;
  private achievementToast: AchievementToast | null = null;
  private helpOverlay: HelpOverlay;
  private settingsPanel: SettingsPanel;
  private achievementUnsubscribes: Array<() => void> = [];
  private hiddenPois: HiddenPoi[] = [];
  private planetSampleTypes: Partial<Record<PlanetType, SampleType>> = {};
  private weatherSystemPromise: Promise<void> | null = null;
  private photoModePromise: Promise<void> | null = null;
  private scienceSystemPromise: Promise<void> | null = null;
  private achievementDataPromise: Promise<void> | null = null;
  private achievementSystemPromise: Promise<void> | null = null;
  private pendingAchievementEvents: AchievementEvent[] = [];
  private disposed = false;
  private dayNightCycle: DayNightCycle;
  private minimapFullscreen = false;
  private wasInSurfaceMode = false;
  private isLanding = false;
  private statsSaveElapsed = 0;
  private pendingStatsDistance = 0;
  private pendingStatsPlayTime = 0;
  private pendingStatsSamples = 0;
  private lastWeatherTag: string | null = null;
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
    canvas.style.pointerEvents = 'auto';
    canvas.style.touchAction = 'none';

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

    // 音效系统
    this.audioManager = AudioManager.getInstance();

    this.planetSelector = new PlanetSelector({
      initialPlanet: this.currentPlanet,
      onPlanetSelect: (planetType) => {
        this.audioManager.playUIClick();
        this.switchPlanet(planetType);
      },
    });

    this.playerController = new PlayerController({
      camera: this.cameraSystem.camera,
      input: this.inputManager,
      planetCenter: new THREE.Vector3(0, 0, 0),
      planetId: this.currentPlanet,
      planetRadius: planet.config.radius,
      gravity: planet.config.gravity,
      surfaceMeshes: [planet.mesh],
      onFootstep: (planetId) => {
        this.audioManager.playFootstep(planetId);
      },
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

    // 地标导航
    this.landmarkManager = new LandmarkManager(this.cameraSystem.camera);
    this.landmarkManager.loadPlanet(planet.config, planet.root);

    // 粒子特效（按星球类型）
    this.setupParticles(this.currentPlanet, planet.config.radius);

    // 操作引导
    this.guidePanel = new GuidePanel();

    // 降落按钮
    this.landButton = new LandButton();
    this.landButton.setOnClick(() => {
      this.audioManager.playUIClick();
      this.landOnSurface();
    });

    // 小地图
    this.minimap = new Minimap();
    this.minimap.setPlanetRadius(planet.config.radius);
    this.minimap.setBackgroundColor(planet.config.textures.fallbackColor);
    this.minimap.setVisible(false);

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

    this.helpOverlay = new HelpOverlay();
    this.settingsPanel = new SettingsPanel({
      audioManager: this.audioManager,
      renderer: this.engine.renderer,
      onPixelRatioChange: (pixelRatio) => {
        this.filterManager.resize(window.innerWidth, window.innerHeight, pixelRatio);
      },
    });

    this.dayNightCycle = new DayNightCycle({
      planetRadius: planet.config.radius,
      sunLight: this.sceneManager.sunlight,
      ambientLight: this.sceneManager.ambient,
      skyboxMaterial: this.sceneManager.skyboxMaterial,
      starsMaterial: this.sceneManager.starsMaterial,
      onSunDirectionChange: (direction) => {
        this.planet.setSunDirection(direction);
      },
      onAtmosphereUpdate: (daylight, twilight) => {
        this.planet.setAtmosphereLighting(daylight, twilight);
      },
    });

    // ESC返回轨道
    window.addEventListener('keydown', this.onKeyDown);

    window.addEventListener('resize', this.onResize);
  }

  private scheduleDeferredPlanetTextures(): void {
    requestAnimationFrame(() => {
      if (this.disposed) {
        return;
      }
      void this.planet.loadDeferredTextures();
    });
  }

  private async ensureWeatherSystem(): Promise<void> {
    if (this.weatherSystem || this.disposed) {
      return;
    }
    if (!this.weatherSystemPromise) {
      this.weatherSystemPromise = import('./weather/WeatherSystem')
        .then(({ WeatherSystem }) => {
          if (this.disposed || this.weatherSystem) {
            return;
          }
          this.weatherSystem = new WeatherSystem({
            scene: this.sceneManager.scene,
            planetRadius: this.planet.config.radius,
            weather: this.planet.config.weather,
          });
        })
        .finally(() => {
          this.weatherSystemPromise = null;
        });
    }
    await this.weatherSystemPromise;
  }

  private async ensurePhotoModeSystem(): Promise<void> {
    if ((this.photoMode && this.photoModeUI) || this.disposed) {
      return;
    }
    if (!this.photoModePromise) {
      this.photoModePromise = Promise.all([
        import('./camera/PhotoMode'),
        import('./ui/PhotoModeUI'),
      ])
        .then(([photoModeModule, photoModeUIModule]) => {
          if (this.disposed || (this.photoMode && this.photoModeUI)) {
            return;
          }
          this.photoMode = new photoModeModule.PhotoMode({
            camera: this.cameraSystem.camera,
            input: this.inputManager,
          });
          this.photoModeUI = new photoModeUIModule.PhotoModeUI({
            onFilterChange: this.onPhotoFilterChange,
            onCapture: this.captureScreenshot,
            onHudToggle: this.onPhotoHUDToggle,
            onFovChange: this.onPhotoFovChange,
          });
        })
        .finally(() => {
          this.photoModePromise = null;
        });
    }
    await this.photoModePromise;
  }

  private async ensureScienceSystem(): Promise<void> {
    if ((this.scanner && this.sampleCollector && this.sciencePanel) || this.disposed) {
      return;
    }
    if (!this.scienceSystemPromise) {
      this.scienceSystemPromise = Promise.all([
        import('./science/Scanner'),
        import('./science/SampleCollector'),
        import('./ui/SciencePanel'),
      ])
        .then(([scannerModule, collectorModule, panelModule]) => {
          if (this.disposed || (this.scanner && this.sampleCollector && this.sciencePanel)) {
            return;
          }

          const scanner = new scannerModule.Scanner({
            planetType: this.currentPlanet,
            planetRadius: this.planet.config.radius,
            surfaceMesh: this.planet.mesh,
          });
          const sampleCollector = new collectorModule.SampleCollector({
            planetType: this.currentPlanet,
            planetRadius: this.planet.config.radius,
          });
          const sciencePanel = new panelModule.SciencePanel();
          sciencePanel.setScannerActive(false);
          sciencePanel.setCollectionLog(sampleCollector.getInventory());

          this.scanner = scanner;
          this.sampleCollector = sampleCollector;
          this.sciencePanel = sciencePanel;
        })
        .finally(() => {
          this.scienceSystemPromise = null;
        });
    }
    await this.scienceSystemPromise;
  }

  private async ensureAchievementData(): Promise<void> {
    if (this.hiddenPois.length > 0 || this.disposed) {
      return;
    }
    if (!this.achievementDataPromise) {
      this.achievementDataPromise = import('./achievement/AchievementData')
        .then(({ HIDDEN_POIS, PLANET_SAMPLE_TYPES }) => {
          if (this.disposed) {
            return;
          }
          this.hiddenPois = HIDDEN_POIS.map((poi) => ({ ...poi }));
          this.planetSampleTypes = { ...PLANET_SAMPLE_TYPES };
        })
        .finally(() => {
          this.achievementDataPromise = null;
        });
    }
    await this.achievementDataPromise;
  }

  private async ensureAchievementSystem(): Promise<void> {
    if ((this.achievementManager && this.achievementPanel && this.achievementToast) || this.disposed) {
      return;
    }
    if (!this.achievementSystemPromise) {
      this.achievementSystemPromise = (async () => {
        await this.ensureAchievementData();
        const [managerModule, panelModule, toastModule] = await Promise.all([
          import('./achievement/AchievementManager'),
          import('./ui/AchievementPanel'),
          import('./ui/AchievementToast'),
        ]);
        if (this.disposed || (this.achievementManager && this.achievementPanel && this.achievementToast)) {
          return;
        }
        const manager = new managerModule.AchievementManager();
        const panel = new panelModule.AchievementPanel(manager);
        const toast = new toastModule.AchievementToast();
        this.achievementManager = manager;
        this.achievementPanel = panel;
        this.achievementToast = toast;
        this.flushPendingStatsToPanel();
        if (this.pendingAchievementEvents.length > 0) {
          for (const event of this.pendingAchievementEvents) {
            manager.recordEvent(event);
          }
          this.pendingAchievementEvents = [];
        }
        this.achievementUnsubscribes.push(
          manager.onUnlock((status) => {
            this.audioManager.playAchievementUnlock();
            this.achievementToast?.show(status);
          }),
        );
      })().finally(() => {
        this.achievementSystemPromise = null;
      });
    }
    await this.achievementSystemPromise;
  }

  private recordAchievementEvent(event: AchievementEvent): void {
    if (this.achievementManager) {
      this.achievementManager.recordEvent(event);
      return;
    }
    this.pendingAchievementEvents.push(event);
  }

  private async toggleAchievementPanel(): Promise<void> {
    await this.ensureAchievementSystem();
    this.achievementPanel?.toggle();
  }

  private onResize = (): void => {
    this.engine.resize();
    this.cameraSystem.resize();
    this.filterManager.resize(
      window.innerWidth,
      window.innerHeight,
      this.settingsPanel.getPixelRatio(),
    );
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'KeyH' && !e.repeat) {
      this.audioManager.playUIClick();
      this.helpOverlay.toggle();
      return;
    }

    if (this.helpOverlay.isOpen) {
      if (e.key === 'Escape') {
        this.audioManager.playUIClick();
        this.helpOverlay.close();
      }
      return;
    }

    if (this.settingsPanel.isOpen) {
      if (e.key === 'Escape') {
        this.audioManager.playUIClick();
        this.settingsPanel.close();
      }
      return;
    }

    if (e.code === 'Tab' && !e.repeat) {
      e.preventDefault();
      this.audioManager.playUIClick();
      void this.toggleAchievementPanel();
      return;
    }

    if (e.code === 'KeyP' && !e.repeat) {
      this.audioManager.playUIClick();
      void this.togglePhotoMode();
      return;
    }

    if (e.code === 'KeyT' && !e.repeat) {
      this.audioManager.playUIClick();
      this.dayNightCycle.cycleTimeScale();
      return;
    }

    if (this.photoModeActive) {
      return;
    }
    if (e.code === 'KeyE' && !e.repeat) {
      this.audioManager.playUIClick();
      void this.toggleScanner();
      return;
    }
    if (e.code === 'KeyF' && !e.repeat) {
      void this.collectSample();
      return;
    }
    if (e.code === 'KeyM' && !e.repeat) {
      this.audioManager.playUIClick();
      this.minimapFullscreen = !this.minimapFullscreen;
      this.minimap.setFullscreen(this.minimapFullscreen);
      return;
    }
    if (e.key === 'Escape') {
      if (this.achievementPanel?.isOpen) {
        this.audioManager.playUIClick();
        this.achievementPanel.close();
        return;
      }
      if (this.cameraManager.mode !== 'orbit') {
        this.audioManager.playUIClick();
        this.returnToOrbit();
      }
    }
  };

  private onPhotoFilterChange = (filter: PhotoFilterType): void => {
    this.audioManager.playUIClick();
    this.filterManager.setFilter(filter);
  };

  private onPhotoHUDToggle = (hidden: boolean): void => {
    this.audioManager.playUIClick();
    this.photoModeHideHUD = hidden;
    if (this.photoModeActive) {
      this.hud.setVisible(!hidden);
    }
  };

  private onPhotoFovChange = (fov: number): void => {
    if (this.photoModeActive && this.photoMode) {
      this.photoMode.setFov(fov);
    }
  };

  private async togglePhotoMode(): Promise<void> {
    if (this.photoModeActive) {
      this.exitPhotoMode();
      return;
    }
    await this.ensurePhotoModeSystem();
    this.enterPhotoMode();
  }

  private enterPhotoMode(): void {
    if (this.photoModeActive || !this.photoMode || !this.photoModeUI) {
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
    if (!this.photoModeActive || !this.photoMode || !this.photoModeUI) {
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
    this.audioManager.playUIClick();
    const now = new Date();
    const stamp = `${now.getFullYear()}${this.pad2(now.getMonth() + 1)}${this.pad2(now.getDate())}-${this.pad2(now.getHours())}${this.pad2(now.getMinutes())}${this.pad2(now.getSeconds())}`;
    const link = document.createElement('a');
    link.href = this.engine.renderer.domElement.toDataURL('image/png');
    link.download = `planet-walk-photo-${stamp}.png`;
    link.click();
    this.recordAchievementEvent({
      type: 'photo_taken',
      planet: this.currentPlanet,
    });
  };

  private pad2(value: number): string {
    return String(value).padStart(2, '0');
  }

  private async toggleScanner(): Promise<void> {
    await this.ensureScienceSystem();
    if (!this.scanner || !this.sciencePanel) {
      return;
    }

    const next = !this.scanner.isActive;
    this.scanner.setActive(next);
    this.sciencePanel.setScannerActive(next);
    this.sciencePanel.showActionMessage(
      next ? '扫描仪已启动。' : '扫描仪已关闭。',
      next,
    );
  }

  private async collectSample(): Promise<void> {
    await this.ensureScienceSystem();
    if (!this.sampleCollector || !this.sciencePanel) {
      return;
    }

    if (!this.isInSurfaceMode()) {
      this.sciencePanel.showActionMessage('请先降落到地表后再采集样本。');
      return;
    }

    const result = this.sampleCollector.collect(this.playerController.state.position);
    this.sciencePanel.showActionMessage(result.message, result.ok);
    this.sciencePanel.setCollectionLog(this.sampleCollector.getInventory());
    if (result.ok) {
      this.collectCurrentSample();
    }
  }

  private updateAchievementState(delta: number, walkedDistance: number): void {
    if (!this.achievementManager) {
      return;
    }

    const inSurfaceMode = this.isInSurfaceMode();
    if (inSurfaceMode && !this.wasInSurfaceMode) {
      this.recordAchievementEvent({
        type: 'planet_landed',
        planet: this.currentPlanet,
      });
    }

    if (inSurfaceMode) {
      const playerPosition = this.playerController.state.position;
      const playerGeo = cartesianToGeo(playerPosition, this.sceneManager.planetRadius);
      this.recordAchievementEvent({
        type: 'altitude_updated',
        altitude: playerGeo.alt,
      });

      if (walkedDistance > 1e-3) {
        this.recordAchievementEvent({
          type: 'distance_walked',
          distance: walkedDistance,
        });
      }

      const movement = this.inputManager.getMovementAxis();
      const moving =
        Math.abs(movement.forward) > 1e-3 ||
        Math.abs(movement.right) > 1e-3;
      this.recordAchievementEvent({
        type: 'walk_streak_tick',
        moving,
        delta,
      });
    } else {
      this.recordAchievementEvent({
        type: 'walk_streak_tick',
        moving: false,
        delta,
      });
    }

    this.wasInSurfaceMode = inSurfaceMode;

    const weather = this.weatherSystem?.weather;
    if (weather) {
      const weatherTag = `${this.currentPlanet}:${weather}`;
      if (weatherTag !== this.lastWeatherTag) {
        this.lastWeatherTag = weatherTag;
        this.recordAchievementEvent({
          type: 'weather_changed',
          weather,
        });
      }
    }
  }

  private updateStatsState(delta: number, walkedDistance: number): void {
    this.pendingStatsPlayTime += Math.max(0, delta);

    if (this.isInSurfaceMode() && walkedDistance > 0) {
      this.pendingStatsDistance += walkedDistance;
    }

    if (this.achievementPanel) {
      this.flushPendingStatsToPanel();
      this.statsSaveElapsed += Math.max(0, delta);
      if (this.statsSaveElapsed >= 5) {
        this.achievementPanel.saveStats();
        this.statsSaveElapsed = 0;
      }
    }
  }

  private flushPendingStatsToPanel(): void {
    if (!this.achievementPanel) {
      return;
    }

    if (this.pendingStatsPlayTime > 0) {
      this.achievementPanel.addPlayTime(this.pendingStatsPlayTime);
      this.pendingStatsPlayTime = 0;
    }
    if (this.pendingStatsDistance > 0) {
      this.achievementPanel.addWalkDistance(this.pendingStatsDistance);
      this.pendingStatsDistance = 0;
    }
    if (this.pendingStatsSamples > 0) {
      this.achievementPanel.addCollectedSamples(this.pendingStatsSamples);
      this.pendingStatsSamples = 0;
    }
  }

  private scanCurrentLocation(): void {
    if (!this.isInSurfaceMode()) {
      return;
    }
    const playerPosition = this.playerController.state.position;
    const playerGeo = cartesianToGeo(playerPosition, this.sceneManager.planetRadius);
    const nearest = this.landmarkManager.getNearest(playerPosition);
    const nearestThreshold = this.sceneManager.planetRadius * 0.08;
    const roundedLat = (Math.round(playerGeo.lat * 2) / 2).toFixed(1);
    const roundedLng = (Math.round(playerGeo.lng * 2) / 2).toFixed(1);
    const siteId =
      nearest && nearest.distance <= nearestThreshold
        ? `${this.currentPlanet}:landmark:${this.normalizeSiteName(nearest.name)}`
        : `${this.currentPlanet}:grid:${roundedLat}:${roundedLng}`;

    this.recordAchievementEvent({
      type: 'site_scanned',
      siteId,
    });

    const hiddenPoiId = this.findNearbyHiddenPoi(playerGeo.lat, playerGeo.lng);
    if (hiddenPoiId) {
      this.recordAchievementEvent({
        type: 'hidden_poi_found',
        poiId: hiddenPoiId,
      });
    }
  }

  private collectCurrentSample(): void {
    if (!this.isInSurfaceMode()) {
      return;
    }
    const sampleType = this.planetSampleTypes[this.currentPlanet];
    if (!sampleType) {
      return;
    }
    this.recordAchievementEvent({
      type: 'sample_collected',
      sampleType,
    });
    if (this.achievementPanel) {
      this.achievementPanel.addCollectedSamples(1);
      return;
    }
    this.pendingStatsSamples += 1;
  }

  private normalizeSiteName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  }

  private findNearbyHiddenPoi(lat: number, lng: number): string | null {
    const maxLatOffset = 3;
    const maxLngOffset = 3;
    for (const poi of this.hiddenPois) {
      if (poi.planet !== this.currentPlanet) {
        continue;
      }
      const latDelta = Math.abs(lat - poi.lat);
      const lngDelta = this.getLongitudeDelta(lng, poi.lng);
      if (latDelta <= maxLatOffset && lngDelta <= maxLngOffset) {
        return poi.id;
      }
    }
    return null;
  }

  private getLongitudeDelta(a: number, b: number): number {
    const raw = Math.abs(a - b) % 360;
    return raw > 180 ? 360 - raw : raw;
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

  /** 降落到地表 — 使用相机当前朝向的地表坐标 */
  private landOnSurface(): void {
    if (this.isLanding) {
      return;
    }
    this.isLanding = true;
    this.planetSelector.setDisabled(true);
    this.landButton.hide();
    this.guidePanel.fadeOut();
    const geo = cartesianToGeo(
      this.cameraSystem.camera.position,
      this.sceneManager.planetRadius,
    );
    this.cameraManager
      .animateToSurface(geo.lat, geo.lng, 2500)
      .then(() => {
        this.guidePanel.showFirstPersonGuide();
      })
      .finally(() => {
        this.isLanding = false;
        this.planetSelector.setDisabled(false);
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
    this.planetSelector.setDisabled(false);
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
    if (planetType === this.currentPlanet || this.isLanding) {
      return;
    }
    if (this.photoModeActive) {
      this.exitPhotoMode();
    }

    const nextPlanet = PlanetFactory.create(planetType);
    this.sceneManager.replacePlanet(nextPlanet);
    this.planet = nextPlanet;
    this.scheduleDeferredPlanetTextures();

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
    this.weatherSystem?.switchPlanet(
      this.sceneManager.scene,
      nextPlanet.config.radius,
      nextPlanet.config.weather,
    );
    this.dayNightCycle.setPlanetRadius(nextPlanet.config.radius);

    // 更新粒子特效
    this.setupParticles(planetType, nextPlanet.config.radius);

    // 切换环境音
    this.audioManager.setPlanet(planetType);
    this.scanner?.switchPlanet({
      planetType,
      planetRadius: nextPlanet.config.radius,
      surfaceMesh: nextPlanet.mesh,
    });
    this.sampleCollector?.switchPlanet(planetType, nextPlanet.config.radius);
    this.sciencePanel?.updateNearbyTarget(null);

    this.currentPlanet = planetType;
    this.planetSelector.setActive(planetType);
    this.lastWeatherTag = null;
    this.wasInSurfaceMode = false;

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
    this.scheduleDeferredPlanetTextures();

    void this.ensureWeatherSystem();
    void this.ensureAchievementSystem();

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
        this.updateStatsState(delta, 0);
        this.photoMode?.update(delta);
        this.filterManager.update(delta);
        this.filterManager.render(delta);
        return;
      }

      this.cameraManager.update(delta);
      const cameraPosition = this.cameraSystem.camera.position;
      this.dayNightCycle.update(delta, cameraPosition);

      const walkedDistance = this.playerController.consumeWalkDistanceDelta();
      this.updateAchievementState(delta, walkedDistance);
      this.updateStatsState(delta, walkedDistance);
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

      if (this.scanner?.isActive) {
        this.sciencePanel?.updateScanData(this.scanner.scan(this.cameraSystem.camera));
        this.scanCurrentLocation();
      }
      const nearbyTarget = inSurfaceMode
        ? this.sampleCollector?.getNearbyTarget(this.playerController.state.position) ?? null
        : null;
      this.sciencePanel?.updateNearbyTarget(nearbyTarget);

      // 更新星球特效（云层/夜景/海洋）
      this.planet.update(delta);

      // 更新粒子特效
      this.particleSystem?.update(delta);

      // 更新地标可见性
      this.landmarkManager.update(cameraPosition);

      // 更新天气系统
      this.weatherSystem?.update(delta, cameraPosition);

      const geo = cartesianToGeo(cameraPosition, this.sceneManager.planetRadius);
      const playerGeo = cartesianToGeo(
        this.playerController.state.position,
        this.sceneManager.planetRadius,
      );
      this.hud.update({
        planetName: this.sceneManager.planetName,
        lat: geo.lat,
        lng: geo.lng,
        alt: geo.alt,
        position: cameraPosition,
        localTime: this.dayNightCycle.getLocalTimeString(playerGeo.lng),
        timeScaleLabel: this.dayNightCycle.getTimeScaleLabel(),
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
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.photoModeActive) {
      this.exitPhotoMode();
    }
    this.photoModeUI?.dispose();
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
    this.sciencePanel?.dispose();
    this.weatherSystem?.dispose();
    for (const unsubscribe of this.achievementUnsubscribes) {
      unsubscribe();
    }
    this.achievementUnsubscribes = [];
    this.achievementPanel?.saveStats(true);
    this.achievementPanel?.dispose();
    this.achievementToast?.dispose();
    this.helpOverlay.dispose();
    this.settingsPanel.dispose();
    this.achievementManager?.dispose();
    this.sceneManager.dispose();
    this.engine.dispose();
  }
}
