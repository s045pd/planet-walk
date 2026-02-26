import * as THREE from 'three';
import type { IDisposable, IUpdatable } from '../core/types';
import type { InputManager } from '../core/InputManager';
import type { PlayerController } from '../player/PlayerController';
import { AstronautModel } from '../player/AstronautModel';
import { OrbitMode } from './OrbitMode';
import { ThirdPersonMode } from './ThirdPersonMode';
import { TransitionController } from './TransitionController';

export type CameraMode = 'orbit' | 'firstPerson' | 'thirdPerson';

export interface CameraManagerConfig {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLCanvasElement;
  input: InputManager;
  playerController: PlayerController;
  scene: THREE.Scene;
  getPlanetRadius: () => number;
  planetCenter?: THREE.Vector3;
  orbitMinAltitude?: number;
  orbitMaxDistanceScale?: number;
  autoEnterFirstPersonAltitude?: number;
  autoEnterOrbitAltitude?: number;
}

/** 相机模式管理：轨道/第一人称切换 + 太空到地表过渡 */
export class CameraManager implements IUpdatable, IDisposable {
  readonly camera: THREE.PerspectiveCamera;
  readonly orbitMode: OrbitMode;
  readonly thirdPersonMode: ThirdPersonMode;
  readonly transitionController: TransitionController;
  readonly astronautModel: AstronautModel;

  private readonly _domElement: HTMLCanvasElement;
  private readonly _input: InputManager;
  private readonly _playerController: PlayerController;
  private readonly _getPlanetRadius: () => number;
  private readonly _planetCenter = new THREE.Vector3();

  private readonly _orbitMinAltitude: number;
  private readonly _orbitMaxDistanceScale: number;
  private readonly _autoEnterFirstPersonAltitude: number;
  private readonly _autoEnterOrbitAltitude: number;

  private _mode: CameraMode = 'orbit';
  private _isTransitioning = false;
  private _hotkeysEnabled = true;
  private _pointerLockRetryTimer: number | null = null;
  private _pointerLockRetryCount = 0;

  private readonly _pointerLockRetryAttempts = 3;
  private readonly _pointerLockRetryDelayMs = 500;
  private readonly _fallbackLookTitle = 'Pointer lock unavailable. Hold left mouse and drag to look.';

  private readonly _firstPersonLookHandler = (dx: number, dy: number): void => {
    const sensitivityMultiplier = this._input.pointerLocked ? 1 : 4;
    this._playerController.firstPerson.applyMouseDelta(dx, dy, sensitivityMultiplier);
  };

  private readonly _thirdPersonLookHandler = (dx: number, dy: number): void => {
    this.thirdPersonMode.applyMouseDelta(dx, dy);
  };

  constructor(config: CameraManagerConfig) {
    this.camera = config.camera;
    this._domElement = config.domElement;
    this._input = config.input;
    this._playerController = config.playerController;
    this._getPlanetRadius = config.getPlanetRadius;
    this._planetCenter.copy(config.planetCenter ?? new THREE.Vector3(0, 0, 0));

    this._orbitMinAltitude = config.orbitMinAltitude ?? 3.5;
    this._orbitMaxDistanceScale = config.orbitMaxDistanceScale ?? 8;
    this._autoEnterFirstPersonAltitude = config.autoEnterFirstPersonAltitude ?? 4.2;
    this._autoEnterOrbitAltitude = Math.max(
      config.autoEnterOrbitAltitude ?? 9,
      this._autoEnterFirstPersonAltitude + 0.5,
    );

    this.orbitMode = new OrbitMode({
      camera: this.camera,
      domElement: config.domElement,
      target: this._planetCenter,
    });
    this.thirdPersonMode = new ThirdPersonMode(this.camera);
    this.astronautModel = new AstronautModel();
    config.scene.add(this.astronautModel.root);

    this.transitionController = new TransitionController({
      camera: this.camera,
      planetCenter: this._planetCenter,
      getPlanetRadius: this._getPlanetRadius,
      atmosphereScale: 1.02,
      surfaceOffset: 2,
    });

    this.applyOrbitDistanceLimits();
    window.addEventListener('keydown', this.onKeyDown);
    this.switchTo('orbit', true);
  }

  get mode(): CameraMode {
    return this._mode;
  }

  switchTo(mode: CameraMode, force = false): void {
    if (!force && this._mode === mode && !this._isTransitioning) {
      return;
    }

    if (mode === 'orbit') {
      this._mode = 'orbit';
      this.clearPointerLockRetry();
      this._playerController.setMouseLookHandler(null);
      this._playerController.setCameraSyncEnabled(false);
      this._playerController.setEnabled(false);
      this._input.setPointerLockEnabled(false);
      this.astronautModel.setVisible(false);
      this.orbitMode.syncFromCamera();
      this.orbitMode.setEnabled(true);
      this.updateFallbackLookIndicator();
      return;
    }

    if (this._mode === 'orbit') {
      this._playerController.syncToCamera(this.camera.position, this._planetCenter);
    }

    this._mode = mode;
    this.orbitMode.setEnabled(false);
    this._playerController.setEnabled(true);
    this._input.setPointerLockEnabled(true);
    this.requestPointerLockWithRetry();

    if (mode === 'thirdPerson') {
      this._playerController.setMouseLookHandler(this._thirdPersonLookHandler);
      this._playerController.setCameraSyncEnabled(false);
      this.astronautModel.setVisible(true);
      this.thirdPersonMode.update(this._playerController.state);
      this.updateFallbackLookIndicator();
      return;
    }

    this._playerController.setMouseLookHandler(this._firstPersonLookHandler);
    this._playerController.setCameraSyncEnabled(true);
    this.astronautModel.setVisible(false);
    this.updateFallbackLookIndicator();
  }

  update(delta: number): void {
    this.applyOrbitDistanceLimits();
    const wheelDelta = this._input.consumeWheel();
    if (this._isTransitioning) {
      this.updateFallbackLookIndicator();
      return;
    }

    if (this._mode === 'orbit') {
      this.orbitMode.update(delta);
    } else if (this._mode === 'firstPerson') {
      this._playerController.update(delta);
    } else {
      this._playerController.update(delta);
      if (wheelDelta !== 0) {
        this.thirdPersonMode.applyZoom(wheelDelta);
      }
      this.thirdPersonMode.update(this._playerController.state);
      const movementAxis = this._input.getMovementAxis();
      const isMoving = Math.abs(movementAxis.forward) > 1e-4 || Math.abs(movementAxis.right) > 1e-4;
      this.astronautModel.update(this._playerController.state, isMoving);
    }

    this.autoSwitchByAltitude();
    this.updateFallbackLookIndicator();
  }

  setHotkeysEnabled(enabled: boolean): void {
    this._hotkeysEnabled = enabled;
  }

  async animateToSurface(lat: number, lng: number, duration = 3000): Promise<void> {
    this.switchTo('orbit');
    this._isTransitioning = true;
    this.clearPointerLockRetry();
    this._input.setPointerLockEnabled(false);
    this.orbitMode.setEnabled(false);
    this.updateFallbackLookIndicator();

    try {
      await this.transitionController.animateToSurface(lat, lng, duration);
      this._playerController.syncToCamera(this.camera.position, this._planetCenter);
      this.switchTo('firstPerson');
    } finally {
      this._isTransitioning = false;
    }
  }

  private applyOrbitDistanceLimits(): void {
    const radius = this._getPlanetRadius();
    this.orbitMode.setDistanceLimits(
      radius + this._orbitMinAltitude,
      radius * this._orbitMaxDistanceScale,
    );
  }

  private autoSwitchByAltitude(): void {
    const altitude = this.getCameraAltitude();
    if (this._mode === 'orbit' && altitude <= this._autoEnterFirstPersonAltitude) {
      this.switchTo('firstPerson');
      return;
    }
    if (
      (this._mode === 'firstPerson' || this._mode === 'thirdPerson') &&
      altitude >= this._autoEnterOrbitAltitude
    ) {
      this.switchTo('orbit');
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this._hotkeysEnabled) {
      return;
    }
    if (event.code !== 'KeyV' || event.repeat || this._isTransitioning) {
      return;
    }
    if (this._mode === 'firstPerson') {
      this.switchTo('thirdPerson');
      return;
    }
    if (this._mode === 'thirdPerson') {
      this.switchTo('firstPerson');
    }
  };

  private requestPointerLockWithRetry(): void {
    this.clearPointerLockRetry();
    this.tryRequestPointerLock();
  }

  private tryRequestPointerLock(): void {
    if (this._mode === 'orbit') {
      this.updateFallbackLookIndicator();
      return;
    }
    if (!this._input.pointerLockEnabled || this._input.isMobile) {
      this.updateFallbackLookIndicator();
      return;
    }
    if (this._input.pointerLocked) {
      this._pointerLockRetryCount = 0;
      this.updateFallbackLookIndicator();
      return;
    }

    this._pointerLockRetryCount += 1;
    this._input.tryRequestPointerLock();
    this.updateFallbackLookIndicator();

    if (this._pointerLockRetryCount >= this._pointerLockRetryAttempts) {
      return;
    }

    this._pointerLockRetryTimer = window.setTimeout(() => {
      this._pointerLockRetryTimer = null;
      this.tryRequestPointerLock();
    }, this._pointerLockRetryDelayMs);
  }

  private clearPointerLockRetry(): void {
    if (this._pointerLockRetryTimer !== null) {
      window.clearTimeout(this._pointerLockRetryTimer);
      this._pointerLockRetryTimer = null;
    }
    this._pointerLockRetryCount = 0;
  }

  private updateFallbackLookIndicator(): void {
    const showDragFallback =
      !this._input.isMobile &&
      (this._mode === 'firstPerson' || this._mode === 'thirdPerson') &&
      this._input.pointerLockEnabled &&
      !this._input.pointerLocked;

    this._domElement.style.cursor = showDragFallback ? 'grab' : '';
    this._domElement.title = showDragFallback ? this._fallbackLookTitle : '';
  }

  private getCameraAltitude(): number {
    return this.camera.position.distanceTo(this._planetCenter) - this._getPlanetRadius();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.clearPointerLockRetry();
    this._domElement.style.cursor = '';
    this._domElement.title = '';
    this.orbitMode.dispose();
    this.astronautModel.dispose();
    this.transitionController.dispose();
  }
}
