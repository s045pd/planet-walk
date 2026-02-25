import * as THREE from 'three';
import type { IDisposable, IUpdatable } from '../core/types';
import type { InputManager } from '../core/InputManager';
import type { PlayerController } from '../player/PlayerController';
import { OrbitMode } from './OrbitMode';
import { TransitionController } from './TransitionController';

export type CameraMode = 'orbit' | 'firstPerson';

export interface CameraManagerConfig {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLCanvasElement;
  input: InputManager;
  playerController: PlayerController;
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
  readonly transitionController: TransitionController;

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

  constructor(config: CameraManagerConfig) {
    this.camera = config.camera;
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

    this.transitionController = new TransitionController({
      camera: this.camera,
      planetCenter: this._planetCenter,
      getPlanetRadius: this._getPlanetRadius,
      atmosphereScale: 1.02,
      surfaceOffset: 2,
    });

    this.applyOrbitDistanceLimits();
    this.switchTo('orbit');
  }

  get mode(): CameraMode {
    return this._mode;
  }

  switchTo(mode: CameraMode): void {
    if (this._mode === mode && !this._isTransitioning) {
      return;
    }

    if (mode === 'orbit') {
      this._mode = 'orbit';
      this._playerController.setEnabled(false);
      this._input.setPointerLockEnabled(false);
      this.orbitMode.syncFromCamera();
      this.orbitMode.setEnabled(true);
      return;
    }

    this._mode = 'firstPerson';
    this.orbitMode.setEnabled(false);
    this._playerController.syncToCamera(this.camera.position, this._planetCenter);
    this._playerController.setEnabled(true);
    this._input.setPointerLockEnabled(true);
  }

  update(delta: number): void {
    this.applyOrbitDistanceLimits();
    if (this._isTransitioning) {
      return;
    }

    if (this._mode === 'orbit') {
      this.orbitMode.update(delta);
    } else {
      this._playerController.update(delta);
    }

    this.autoSwitchByAltitude();
  }

  async animateToSurface(lat: number, lng: number, duration = 3000): Promise<void> {
    this.switchTo('orbit');
    this._isTransitioning = true;
    this._input.setPointerLockEnabled(false);
    this.orbitMode.setEnabled(false);

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
    if (this._mode === 'firstPerson' && altitude >= this._autoEnterOrbitAltitude) {
      this.switchTo('orbit');
    }
  }

  private getCameraAltitude(): number {
    return this.camera.position.distanceTo(this._planetCenter) - this._getPlanetRadius();
  }

  dispose(): void {
    this.orbitMode.dispose();
    this.transitionController.dispose();
  }
}
